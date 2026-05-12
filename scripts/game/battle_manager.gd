class_name BattleManager
extends Node

## 战斗管理器 - 管理战斗流程、回合、行动顺序

signal turn_changed(current_actor_id: String)
signal damage_dealt(target: Dictionary, amount: int)
signal battle_ended(winner: Dictionary, loser: Dictionary)

# 战斗双方
var player: Dictionary = {}
var enemy: Dictionary = {}

# 当前回合
var current_turn: int = 0
var current_actor: Dictionary = {}  # 当前行动方

# AI 系统
var ai: AI


func start_battle(player_data: Dictionary, enemy_data: Dictionary) -> void:
	"""开始战斗"""
	player = CharacterState.from_data(player_data)
	enemy = CharacterState.from_data(enemy_data)

	# 初始化 AI（默认普通难度）
	ai = AI.new(self, AI.AIDifficulty.NORMAL)

	current_turn = 1
	_determine_first_actor()
	_start_turn()


func _determine_first_actor() -> void:
	"""根据轻功决定先手"""
	var player_agility: int = player.get("agility", 0)
	var enemy_agility: int = enemy.get("agility", 0)

	if player_agility >= enemy_agility:
		current_actor = player
	else:
		current_actor = enemy


func _start_turn() -> void:
	"""开始回合"""
	# 双方抽牌
	CharacterState.draw_cards(player, 5)
	CharacterState.draw_cards(enemy, 5)

	# 触发回合开始效果
	# TODO: 触发内功效果

	var actor_id: String = current_actor.get("id", "")
	turn_changed.emit(actor_id)

	# 如果当前行动方是敌人，触发 AI
	if current_actor == enemy:
		_trigger_ai()


func _trigger_ai() -> void:
	"""触发 AI 行动"""
	await ai.execute_turn()

	# AI 行动结束后，检查是否需要结束回合或切换行动方
	if not CharacterState.is_dead(player) and not CharacterState.is_dead(enemy):
		if current_actor == enemy:
			# AI 仍有轻功但无行动，结束回合
			end_turn()


func play_card(card_index: int) -> Dictionary:
	"""打出卡牌"""
	if current_actor != player:
		return {"success": false, "reason": "not_player_turn"}

	var card: CardState = CharacterState.play_card(player, card_index)
	if card == null:
		return {"success": false, "reason": "invalid_card"}

	# 执行卡牌效果
	var card_data = GameManager.cards_data.get(card.card_id, {})
	_execute_card_effect(player, enemy, card_data)

	# 消耗轻功
	var agility: int = player.get("agility", 0)
	player["agility"] = agility - card_data.get("agility_cost", 1)

	# 检查是否切换行动方
	_check_actor_switch()

	return {"success": true, "card_id": card.card_id}


func use_skill(skill_id: String, card_index: int) -> Dictionary:
	"""使用武功招式"""
	var skill_data = GameManager.skills_data.get(skill_id, {})

	# 检查内力
	var mp_cost = skill_data.get("mp_cost", 0)
	if not CharacterState.use_mp(current_actor, mp_cost):
		return {"success": false, "reason": "not_enough_mp"}

	# 检查媒介卡牌
	var required_type = skill_data.get("required_card_type", "any")
	var card: CardState = CharacterState.play_card(current_actor, card_index)

	# 执行招式效果
	_execute_skill_effect(current_actor, _get_opponent(current_actor), skill_data)

	# 消耗轻功
	var agility: int = current_actor.get("agility", 0)
	current_actor["agility"] = agility - skill_data.get("agility_cost", 2)

	_check_actor_switch()

	return {"success": true, "skill_id": skill_id}


func _execute_card_effect(source: Dictionary, target: Dictionary, card_data: Dictionary) -> void:
	"""执行卡牌效果"""
	var damage = card_data.get("damage", 0)
	var defense = card_data.get("defense", 0)
	var heal = card_data.get("heal", 0)

	if damage > 0:
		var result: Dictionary = CharacterState.take_damage(target, damage, source)
		damage_dealt.emit(target, result.actual_damage)

	if defense > 0:
		var shield: int = source.get("shield", 0)
		source["shield"] = shield + defense

	if heal > 0:
		CharacterState.heal(source, heal)

	_check_battle_end()


func _execute_skill_effect(source: Dictionary, target: Dictionary, skill_data: Dictionary) -> void:
	"""执行武功招式效果"""
	var damage = skill_data.get("damage", 0)
	var effects = skill_data.get("effects", [])

	if damage > 0:
		var result: Dictionary = CharacterState.take_damage(target, damage, source)
		damage_dealt.emit(target, result.actual_damage)

	# 处理特殊效果
	for effect in effects:
		_apply_effect(source, target, effect)

	_check_battle_end()


func _apply_effect(source: Dictionary, target: Dictionary, effect: Dictionary) -> void:
	"""应用效果"""
	var type = effect.get("type", "")
	var value = effect.get("value", 0)

	match type:
		"heal":
			CharacterState.heal(source, value)
		"shield":
			var shield: int = source.get("shield", 0)
			source["shield"] = shield + value
		"damage":
			CharacterState.take_damage(target, value, source)
		"mp_recover":
			CharacterState.recover_mp(source, value)
		"agility_boost":
			var agility: int = source.get("agility", 0)
			source["agility"] = agility + value


func _check_actor_switch() -> void:
	"""检查是否切换行动方"""
	var opponent = _get_opponent(current_actor)

	var current_agility: int = current_actor.get("agility", 0)
	var opponent_agility: int = opponent.get("agility", 0)

	if current_agility < opponent_agility:
		current_actor = opponent
		var actor_id: String = current_actor.get("id", "")
		turn_changed.emit(actor_id)

		# 如果切换到敌人，触发 AI
		if current_actor == enemy:
			_trigger_ai()


func _get_opponent(character: Dictionary) -> Dictionary:
	"""获取对手"""
	if character == player:
		return enemy
	return player


func _check_battle_end() -> void:
	"""检查战斗是否结束"""
	if CharacterState.is_dead(player):
		battle_ended.emit(enemy, player)
	elif CharacterState.is_dead(enemy):
		battle_ended.emit(player, enemy)


func end_turn() -> void:
	"""结束当前回合"""
	# 回合结束效果
	# TODO: 触发内功效果

	current_turn += 1

	# 重置轻功
	player["agility"] = player.get("base_agility", 10)
	enemy["agility"] = enemy.get("base_agility", 10)

	_determine_first_actor()
	_start_turn()