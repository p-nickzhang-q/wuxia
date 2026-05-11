class_name BattleManager
extends Node

## 战斗管理器 - 管理战斗流程、回合、行动顺序

signal turn_changed(current_actor: String)
signal damage_dealt(target: Character, amount: int)
signal battle_ended(winner: Character, loser: Character)

# 战斗双方
var player: Character
var enemy: Character

# 当前回合
var current_turn: int = 0
var current_actor: Character  # 当前行动方


func start_battle(player_data: Dictionary, enemy_data: Dictionary) -> void:
	"""开始战斗"""
	player = Character.new(player_data)
	enemy = Character.new(enemy_data)

	current_turn = 1
	_determine_first_actor()
	_start_turn()


func _determine_first_actor() -> void:
	"""根据轻功决定先手"""
	if player.current_agility >= enemy.current_agility:
		current_actor = player
	else:
		current_actor = enemy


func _start_turn() -> void:
	"""开始回合"""
	# 双方抽牌
	player.draw_cards(5)
	enemy.draw_cards(5)

	# 触发回合开始效果
	# TODO: 触发内功效果

	turn_changed.emit(current_actor.id)


func play_card(card_index: int) -> Dictionary:
	"""打出卡牌"""
	if current_actor != player:
		return {"success": false, "reason": "not_player_turn"}

	var card_id = player.play_card(card_index)
	if card_id.is_empty():
		return {"success": false, "reason": "invalid_card"}

	# 执行卡牌效果
	var card_data = GameManager.cards_data.get(card_id, {})
	_execute_card_effect(player, enemy, card_data)

	# 消耗轻功
	player.current_agility -= card_data.get("agility_cost", 1)

	# 检查是否切换行动方
	_check_actor_switch()

	return {"success": true, "card_id": card_id}


func use_skill(skill_id: String, card_index: int) -> Dictionary:
	"""使用武功招式"""
	var skill_data = GameManager.skills_data.get(skill_id, {})

	# 检查内力
	var mp_cost = skill_data.get("mp_cost", 0)
	if not current_actor.use_mp(mp_cost):
		return {"success": false, "reason": "not_enough_mp"}

	# 检查媒介卡牌
	var required_type = skill_data.get("required_card_type", "any")
	var card_id = current_actor.play_card(card_index)

	# 执行招式效果
	_execute_skill_effect(current_actor, _get_opponent(current_actor), skill_data)

	# 消耗轻功
	current_actor.current_agility -= skill_data.get("agility_cost", 2)

	_check_actor_switch()

	return {"success": true, "skill_id": skill_id}


func _execute_card_effect(source: Character, target: Character, card_data: Dictionary) -> void:
	"""执行卡牌效果"""
	var damage = card_data.get("damage", 0)
	var defense = card_data.get("defense", 0)
	var heal = card_data.get("heal", 0)

	if damage > 0:
		var actual = target.take_damage(damage)
		damage_dealt.emit(target, actual)

	if defense > 0:
		source.shield += defense

	if heal > 0:
		source.heal(heal)

	_check_battle_end()


func _execute_skill_effect(source: Character, target: Character, skill_data: Dictionary) -> void:
	"""执行武功招式效果"""
	var damage = skill_data.get("damage", 0)
	var effects = skill_data.get("effects", [])

	if damage > 0:
		var actual = target.take_damage(damage)
		damage_dealt.emit(target, actual)

	# 处理特殊效果
	for effect in effects:
		_apply_effect(source, target, effect)

	_check_battle_end()


func _apply_effect(source: Character, target: Character, effect: Dictionary) -> void:
	"""应用效果"""
	var type = effect.get("type", "")
	var value = effect.get("value", 0)

	match type:
		"heal":
			source.heal(value)
		"shield":
			source.shield += value
		"damage":
			target.take_damage(value)
		"mp_recover":
			source.recover_mp(value)
		"agility_boost":
			source.current_agility += value


func _check_actor_switch() -> void:
	"""检查是否切换行动方"""
	var opponent = _get_opponent(current_actor)

	if current_actor.current_agility < opponent.current_agility:
		current_actor = opponent
		turn_changed.emit(current_actor.id)


func _get_opponent(character: Character) -> Character:
	"""获取对手"""
	if character == player:
		return enemy
	return player


func _check_battle_end() -> void:
	"""检查战斗是否结束"""
	if player.is_dead():
		battle_ended.emit(enemy, player)
	elif enemy.is_dead():
		battle_ended.emit(player, enemy)


func end_turn() -> void:
	"""结束当前回合"""
	# 回合结束效果
	# TODO: 触发内功效果

	current_turn += 1

	# 重置轻功
	player.current_agility = player.agility
	enemy.current_agility = enemy.agility

	_determine_first_actor()
	_start_turn()
