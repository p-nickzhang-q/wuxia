class_name AI
extends RefCounted

## AI 决策系统 - 控制敌人自动行动

var battle_manager: BattleManager


func _init(manager: BattleManager) -> void:
	battle_manager = manager


## 执行 AI 回合
func execute_turn() -> void:
	var actor = battle_manager.current_actor
	if actor == null or actor != battle_manager.enemy:
		return

	# 延迟执行，让玩家看到 AI 思考
	await _delay(0.8)

	var action_count := 0
	const max_actions := 10

	while actor.current_agility > 0 and not actor.is_dead() and action_count < max_actions:
		# 检查是否有敌人存活
		var target = _get_target()
		if target == null:
			break

		# 决定行动
		var action = _decide_action(actor, target)
		if action == null:
			break

		action_count += 1

		# 执行行动
		_execute_action(action, target)

		# 检查是否切换行动方
		if battle_manager.current_actor != actor:
			break

		# 检查战斗是否结束
		if battle_manager.player.is_dead() or battle_manager.enemy.is_dead():
			break

		await _delay(0.6)


## 决定行动
func _decide_action(actor: Character, target: Character) -> Dictionary:
	# 获取可用手牌
	var available_cards = _get_available_cards(actor)
	if available_cards.is_empty():
		return {}

	# 尝试使用武功招式（简化版，暂时跳过）
	# TODO: 实现武功招式 AI 决策

	# 选择最佳基础招式卡牌
	var card_index = _select_best_card(actor, target, available_cards)
	if card_index >= 0:
		return {"type": "basic", "card_index": card_index}

	return {}


## 获取可用卡牌（轻功足够）
func _get_available_cards(actor: Character) -> Array[int]:
	var result: Array[int] = []
	for i in range(actor.hand.size()):
		var card_id = actor.hand[i]
		var card_data = GameManager.cards_data.get(card_id, {})
		var agility_cost = card_data.get("agility_cost", 1)
		if agility_cost <= actor.current_agility:
			result.append(i)
	return result


## 选择最佳卡牌
func _select_best_card(actor: Character, target: Character, available_indices: Array[int]) -> int:
	if available_indices.is_empty():
		return -1

	# 简单策略：优先选择伤害最高的卡牌
	var best_index := available_indices[0]
	var best_damage := 0

	for idx in available_indices:
		var card_id = actor.hand[idx]
		var card_data = GameManager.cards_data.get(card_id, {})
		var damage = card_data.get("damage", 0)

		# 如果目标有护盾，优先高伤害
		if target.shield > 0:
			if damage > best_damage:
				best_damage = damage
				best_index = idx
		else:
			# 否则考虑效率（伤害/轻功消耗）
			var agility_cost = card_data.get("agility_cost", 1)
			var efficiency = float(damage) / float(agility_cost)
			var best_card_id = actor.hand[best_index]
			var best_card_data = GameManager.cards_data.get(best_card_id, {})
			var best_agility_cost = best_card_data.get("agility_cost", 1)
			var best_efficiency = float(best_damage) / float(best_agility_cost)

			if efficiency > best_efficiency:
				best_damage = damage
				best_index = idx

	return best_index


## 执行行动
func _execute_action(action: Dictionary, target: Character) -> void:
	if action.is_empty():
		return

	var card_index = action.get("card_index", -1)
	if card_index < 0:
		return

	battle_manager.play_card(card_index)


## 获取目标（玩家）
func _get_target() -> Character:
	if battle_manager.player.is_dead():
		return null
	return battle_manager.player


## 延迟函数
func _delay(seconds: float) -> void:
	await battle_manager.get_tree().create_timer(seconds).timeout
