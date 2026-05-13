## game_state.gd - 游戏状态管理类
## 管理整个战斗的状态，包含所有角色、当前阶段、行动历史等
## 设计原则：事件驱动，通过信号通知 UI 更新

class_name GameState
extends RefCounted

# ==================== 信号定义 ====================
## 回合开始信号
signal turn_started(turn_number: int)
## 回合结束信号
signal turn_ended()
## 行动方改变信号
signal actor_changed(actor: Dictionary)
## 卡牌打出信号
signal card_played(character: Dictionary, card: CardState)
## 武功使用信号
signal skill_used(character: Dictionary, skill: SkillState)
## 伤害造成信号
signal damage_dealt(target: Dictionary, amount: int, source: Dictionary)
## 护盾获得信号
signal shield_gained(character: Dictionary, amount: int)
## 角色治疗信号
signal character_healed(character: Dictionary, amount: int)
## 内功触发信号
signal passive_triggered(character: Dictionary, passive: PassiveState, result: Dictionary)
## 游戏结束信号
signal game_ended(winner: Dictionary, loser: Dictionary)
## 日志消息信号
signal log_message(text: String)

# ==================== 属性 ====================
## 玩家角色
var player: Dictionary = {}

## 敌人角色
var enemy: Dictionary = {}

## 当前回合数
var turn_number: int = 1

## 当前行动角色
var current_actor: Dictionary = {}

## 当前游戏阶段
var current_phase: Types.GamePhase = Types.GamePhase.SETUP

## 行动历史记录
var action_history: Array[Dictionary] = []

## 上次使用的武功（用于模仿效果）
var last_used_skill: SkillState = null

# ==================== 工厂方法 ====================

## 创建游戏状态
## 返回包含状态和信号引用的字典
static func create(player_data: Dictionary, enemy_data: Dictionary) -> Dictionary:
	var state := GameState.new()
	state.player = CharacterState.from_data(player_data)
	state.enemy = CharacterState.from_data(enemy_data)
	return {
		"state": state,
		"_signals": state  # 用于发射信号
	}


# ==================== 核心方法 ====================

## 开始战斗
func start_battle() -> void:
	current_phase = Types.GamePhase.SELECTING

	# 初始化双方角色
	CharacterState.reset_for_battle(player)
	CharacterState.reset_for_battle(enemy)

	# 双方抽初始手牌
	CharacterState.draw_cards(player, Types.DEFAULT_DRAW_COUNT)
	CharacterState.draw_cards(enemy, Types.DEFAULT_DRAW_COUNT)

	# 确定先手
	_determine_first_actor()

	# 记录战斗开始
	record_action({
		"type": "battle_start",
		"player": player.get("name", ""),
		"enemy": enemy.get("name", "")
	})

	log_message.emit("战斗开始！")


## 开始新回合
func start_new_turn() -> void:
	turn_number += 1

	# 重置双方轻功
	CharacterState.reset_turn(player)
	CharacterState.reset_turn(enemy)

	# 触发回合开始内功
	CharacterState.on_turn_start(player, self)
	CharacterState.on_turn_start(enemy, self)

	# 双方抽牌
	var player_drawn: Array = CharacterState.draw_cards(player, Types.DEFAULT_DRAW_COUNT)
	var enemy_drawn: Array = CharacterState.draw_cards(enemy, Types.DEFAULT_DRAW_COUNT)

	# 确定先手
	_determine_first_actor()

	# 更新阶段
	current_phase = Types.GamePhase.SELECTING

	# 发出信号
	turn_started.emit(turn_number)
	log_message.emit("第 %d 回合开始" % turn_number)

	# 记录行动
	record_action({
		"type": "turn_start",
		"turn": turn_number,
		"player_drawn": player_drawn.size(),
		"enemy_drawn": enemy_drawn.size()
	})


## 结束回合
func end_turn() -> void:
	# 触发回合结束内功
	CharacterState.on_turn_end(player, self)
	CharacterState.on_turn_end(enemy, self)

	# 处理持续伤害和减益
	_process_dots_and_debuffs()

	# 检查游戏结束
	if is_battle_over():
		_end_game()
		return

	# 发出信号
	turn_ended.emit()

	# 开始新回合
	start_new_turn()


## 使用基础招式卡牌
## target_id: 目标角色 ID，空字符串表示自动选择对手
func use_basic_card(card_index: int, target_id: String = "") -> Dictionary:
	var result := {
		"success": false,
		"card": null,
		"effects": [],
		"error": ""
	}

	if not is_character_turn(current_actor):
		result["error"] = "not_your_turn"
		return result

	var hand: Array = current_actor.get("hand", [])
	if card_index < 0 or card_index >= hand.size():
		result["error"] = "invalid_card_index"
		return result

	var card: CardState = hand[card_index]
	var agility: int = current_actor.get("agility", 0)

	# 检查轻功是否足够
	if card.agility_cost > agility:
		result["error"] = "not_enough_agility"
		return result

	# 验证目标
	var target: Dictionary
	if target_id.is_empty():
		# 自动选择对手
		target = get_opponent(current_actor)
	else:
		# 根据 ID 查找目标
		if target_id == player.get("id", ""):
			target = player
		elif target_id == enemy.get("id", ""):
			target = enemy
		else:
			result["error"] = "invalid_target"
			return result

	# 验证目标存活
	if CharacterState.is_dead(target):
		result["error"] = "target_dead"
		return result

	# 消耗轻功
	current_actor["agility"] = agility - card.agility_cost

	# 打出卡牌
	var played_card: CardState = CharacterState.play_card(current_actor, card_index)
	if played_card == null:
		result["error"] = "play_card_failed"
		return result

	result.card = played_card
	result.success = true

	# 执行卡牌效果
	_execute_card_effects(current_actor, target, played_card)

	# 触发使用卡牌内功
	var trigger_results := CharacterState.trigger_on_play_card(current_actor, self, played_card)
	result.effects.append_array(trigger_results)

	# 发出信号
	card_played.emit(current_actor, played_card)

	# 检查游戏结束
	if is_battle_over():
		_end_game()
		return result

	# 检查是否切换行动方
	_check_actor_switch()

	return result


## 使用武功招式
## skill_index: 武功索引
## card_index: 作为媒介的手牌索引
## target_id: 目标角色 ID，空字符串表示自动选择对手
func use_skill(skill_index: int, card_index: int, target_id: String = "") -> Dictionary:
	var result := {
		"success": false,
		"skill": null,
		"card": null,
		"effects": [],
		"error": ""
	}

	if not is_character_turn(current_actor):
		result["error"] = "not_your_turn"
		return result

	var skills: Array = current_actor.get("skills", [])
	if skill_index < 0 or skill_index >= skills.size():
		result["error"] = "invalid_skill_index"
		return result

	var skill: SkillState = skills[skill_index]
	var mp: int = current_actor.get("mp", 0)
	var agility: int = current_actor.get("agility", 0)
	var hand: Array = current_actor.get("hand", [])

	# 检查是否可用
	if not skill.is_available(mp, agility, hand):
		result["error"] = "skill_not_available"
		return result

	# 检查卡牌索引是否有效
	var available_cards := skill.get_available_card_indices(hand)
	if card_index not in available_cards:
		result["error"] = "invalid_card_for_skill"
		return result

	# 验证目标
	var target: Dictionary
	if target_id.is_empty():
		# 自动选择对手
		target = get_opponent(current_actor)
	else:
		# 根据 ID 查找目标
		if target_id == player.get("id", ""):
			target = player
		elif target_id == enemy.get("id", ""):
			target = enemy
		else:
			result["error"] = "invalid_target"
			return result

	# 验证目标存活
	if CharacterState.is_dead(target):
		result["error"] = "target_dead"
		return result

	# 消耗资源
	current_actor["mp"] = mp - skill.mp_cost
	current_actor["agility"] = agility - skill.agility_cost

	# 使用卡牌作为媒介
	var card: CardState = CharacterState.play_card(current_actor, card_index)
	if card == null:
		result["error"] = "play_card_failed"
		return result

	# 标记武功使用
	skill.use()

	# 记录上次使用的武功
	last_used_skill = skill

	result.skill = skill
	result.card = card
	result.success = true

	# 执行武功效果
	_execute_skill_effects(current_actor, target, skill)

	# 触发武功使用内功
	var trigger_results := CharacterState.trigger_on_skill_use(current_actor, self, skill)
	result.effects.append_array(trigger_results)

	# 发出信号
	skill_used.emit(current_actor, skill)

	# 检查游戏结束
	if is_battle_over():
		_end_game()
		return result

	# 检查是否切换行动方
	_check_actor_switch()

	return result


## 结束当前行动（主动结束回合）
func pass_turn() -> void:
	# 切换到对手
	current_actor = get_opponent(current_actor)
	actor_changed.emit(current_actor)

	# 如果双方都无轻功，结束回合
	var player_agility: int = player.get("agility", 0)
	var enemy_agility: int = enemy.get("agility", 0)

	if player_agility <= 0 and enemy_agility <= 0:
		end_turn()


# ==================== 查询方法 ====================

## 获取所有角色列表（用于UI兼容）
func get_characters() -> Array:
	var chars: Array = []
	if not player.is_empty():
		chars.append(player)
	if not enemy.is_empty():
		chars.append(enemy)
	return chars


## 获取所有存活的战斗角色
func get_alive_characters() -> Array:
	var chars: Array = []
	if not player.is_empty() and not CharacterState.is_dead(player):
		chars.append(player)
	if not enemy.is_empty() and not CharacterState.is_dead(enemy):
		chars.append(enemy)
	return chars


## 检查战斗是否结束
func is_battle_over() -> bool:
	return CharacterState.is_dead(player) or CharacterState.is_dead(enemy)


## 获取胜利者
func get_winner() -> Dictionary:
	# 先检查平局情况
	if CharacterState.is_dead(player) and CharacterState.is_dead(enemy):
		return {}  # 平局，无胜利者
	if CharacterState.is_dead(player):
		return enemy
	if CharacterState.is_dead(enemy):
		return player
	return {}


## 获取失败者
func get_loser() -> Dictionary:
	# 先检查平局情况
	if CharacterState.is_dead(player) and CharacterState.is_dead(enemy):
		return {}  # 平局，无失败者
	if CharacterState.is_dead(player):
		return player
	if CharacterState.is_dead(enemy):
		return enemy
	return {}


## 获取对手
func get_opponent(character: Dictionary) -> Dictionary:
	if character == player:
		return enemy
	return player


## 检查是否轮到指定角色行动
func is_character_turn(character: Dictionary) -> bool:
	return current_actor == character


## 获取当前行动角色
func get_current_actor() -> Dictionary:
	return current_actor


## 获取当前行动角色名称
func get_current_actor_name() -> String:
	if current_actor == player:
		return "玩家"
	return "敌人"


## 获取行动顺序（按轻功降序）
func get_turn_order() -> Array:
	var order: Array = []
	var player_agility: int = player.get("agility", 0)
	var enemy_agility: int = enemy.get("agility", 0)

	# 按轻功降序排列
	if player_agility >= enemy_agility:
		if not CharacterState.is_dead(player):
			order.append(player)
		if not CharacterState.is_dead(enemy):
			order.append(enemy)
	else:
		if not CharacterState.is_dead(enemy):
			order.append(enemy)
		if not CharacterState.is_dead(player):
			order.append(player)

	return order


## 获取指定角色的有效目标列表
func get_targets_for(character: Dictionary) -> Array:
	# 1v1 模式下，目标只有一个对手
	var opponent := get_opponent(character)
	if not opponent.is_empty() and not CharacterState.is_dead(opponent):
		return [opponent]
	return []


## 记录行动到历史
func record_action(action: Dictionary) -> void:
	var record := action.duplicate()
	record["turn"] = turn_number
	record["timestamp"] = Time.get_ticks_msec()
	action_history.append(record)


## 获取战斗摘要
func get_battle_summary() -> Dictionary:
	var winner := get_winner()
	var loser := get_loser()
	return {
		"winner": winner.get("name", "无"),
		"loser": loser.get("name", "无"),
		"turns": turn_number,
		"actions": action_history.size()
	}


# ==================== 内部方法 ====================

## 根据轻功决定先手
func _determine_first_actor() -> void:
	var player_agility: int = player.get("agility", 0)
	var enemy_agility: int = enemy.get("agility", 0)

	if player_agility >= enemy_agility:
		current_actor = player
	else:
		current_actor = enemy

	actor_changed.emit(current_actor)


## 检查是否需要切换行动方
func _check_actor_switch() -> void:
	if should_switch_actor():
		switch_actor()

		# 如果双方都无轻功，结束回合
		var current_agility: int = current_actor.get("agility", 0)
		var opponent := get_opponent(current_actor)
		var opponent_agility: int = opponent.get("agility", 0)

		if current_agility <= 0 and opponent_agility <= 0:
			end_turn()


## 判断是否应该切换行动方
## 当前角色轻功 <= 敌方最高轻功时切换
func should_switch_actor() -> bool:
	if current_actor.is_empty():
		return false

	var opponent := get_opponent(current_actor)
	if opponent.is_empty() or CharacterState.is_dead(opponent):
		return false

	var current_agility: int = current_actor.get("agility", 0)
	var opponent_agility: int = opponent.get("agility", 0)

	return current_agility <= opponent_agility


## 切换到下一个轻功最高的存活角色
func switch_actor() -> void:
	var next_actor: Dictionary = {}
	var max_agility: int = -1

	# 找下一个轻功最高的存活角色
	var alive_chars := get_alive_characters()
	for char_state in alive_chars:
		if char_state != current_actor:
			var agility: int = char_state.get("agility", 0)
			if agility > max_agility:
				max_agility = agility
				next_actor = char_state

	if not next_actor.is_empty():
		current_actor = next_actor
		actor_changed.emit(current_actor)


## 执行卡牌效果
func _execute_card_effects(source: Dictionary, target: Dictionary, card: CardState) -> void:
	# 伤害
	if card.base_damage > 0:
		var damage_result: Dictionary = CharacterState.take_damage(target, card.base_damage, source)
		# 只有实际伤害 > 0 时才发射信号
		if damage_result.actual_damage > 0:
			damage_dealt.emit(target, damage_result.actual_damage, source)

			# 触发造成伤害内功
			CharacterState.trigger_on_damage(source, self, target, damage_result.actual_damage)

			# 触发受到伤害内功
			CharacterState.trigger_on_take_damage(target, self, source, damage_result.actual_damage)

			var target_name: String = target.get("name", "未知")
			log_message.emit("%s 对 %s 造成 %d 点伤害" % [source.get("name", "未知"), target_name, damage_result.actual_damage])

	# 护盾
	if card.base_shield > 0:
		var shield: int = source.get("shield", 0)
		source["shield"] = shield + card.base_shield
		shield_gained.emit(source, card.base_shield)

		var source_name: String = source.get("name", "未知")
		log_message.emit("%s 获得 %d 点护盾" % [source_name, card.base_shield])

	# 治疗
	if card.base_heal > 0:
		var heal_amount: int = CharacterState.heal(source, card.base_heal)
		character_healed.emit(source, heal_amount)

		var source_name: String = source.get("name", "未知")
		log_message.emit("%s 恢复 %d 点生命" % [source_name, heal_amount])

	# 特殊效果
	for effect in card.effects:
		_process_effect(source, target, effect)


## 执行武功效果
func _execute_skill_effects(source: Dictionary, target: Dictionary, skill: SkillState) -> void:
	# 基础伤害
	if skill.damage > 0:
		var damage_result: Dictionary = CharacterState.take_damage(target, skill.damage, source)
		damage_dealt.emit(target, damage_result.actual_damage, source)

		# 触发造成伤害内功
		CharacterState.trigger_on_damage(source, self, target, damage_result.actual_damage)

		# 触发受到伤害内功
		CharacterState.trigger_on_take_damage(target, self, source, damage_result.actual_damage)

		var target_name: String = target.get("name", "未知")
		log_message.emit("%s 使用 %s 对 %s 造成 %d 点伤害" % [source.get("name", "未知"), skill.name, target_name, damage_result.actual_damage])

	# 特殊效果
	for effect in skill.effects:
		_process_effect(source, target, effect)


## 处理单个效果
func _process_effect(source: Dictionary, target: Dictionary, effect: Dictionary) -> void:
	var effect_type: String = effect.get("type", "")
	var value = effect.get("value", 0)  # Variant: can be int or String

	match effect_type:
		"heal", "heal_self":
			var heal_amount: int = CharacterState.heal(source, value)
			character_healed.emit(source, heal_amount)
			log_message.emit("%s 恢复 %d 点生命" % [source.get("name", "未知"), heal_amount])

		"shield", "add_shield":
			var shield: int = source.get("shield", 0)
			source["shield"] = shield + value
			shield_gained.emit(source, value)
			log_message.emit("%s 获得 %d 点护盾" % [source.get("name", "未知"), value])

		"damage", "damage_target":
			var damage_result: Dictionary = CharacterState.take_damage(target, value, source)
			damage_dealt.emit(target, damage_result.actual_damage, source)
			log_message.emit("%s 对 %s 造成 %d 点伤害" % [source.get("name", "未知"), target.get("name", "未知"), damage_result.actual_damage])

		"mp_recover", "recover_mp":
			CharacterState.recover_mp(source, value)
			log_message.emit("%s 恢复 %d 点内力" % [source.get("name", "未知"), value])

		"agility_boost", "boost_agility":
			var agility: int = source.get("agility", 0)
			source["agility"] = agility + value
			log_message.emit("%s 轻功提升 %d" % [source.get("name", "未知"), value])

		"agility_reduce", "reduce_agility":
			var agility: int = target.get("agility", 0)
			target["agility"] = maxi(0, agility - value)
			log_message.emit("%s 轻功降低 %d" % [target.get("name", "未知"), value])

		"draw_cards", "draw":
			var drawn: Array = CharacterState.draw_cards(source, value)
			log_message.emit("%s 抽取 %d 张牌" % [source.get("name", "未知"), drawn.size()])


## 处理持续伤害和减益
func _process_dots_and_debuffs() -> void:
	# TODO: 实现持续伤害和减益效果处理
	pass


## 结束游戏
func _end_game() -> void:
	current_phase = Types.GamePhase.GAME_OVER

	var winner := get_winner()
	var loser := get_loser()

	# 记录战斗结束
	record_action({
		"type": "battle_end",
		"winner": winner.get("name", ""),
		"loser": loser.get("name", ""),
		"turns": turn_number
	})

	# 发出信号
	game_ended.emit(winner, loser)
	log_message.emit("%s 获胜！" % winner.get("name", "未知"))


## 转换为字典（用于序列化/保存）
func to_dict() -> Dictionary:
	return {
		"turn_number": turn_number,
		"current_phase": current_phase,
		"player": CharacterState.to_dict(player),
		"enemy": CharacterState.to_dict(enemy),
		"current_actor_is_player": current_actor == player,
		"action_history": action_history.duplicate()
	}
