## effect_processor.gd - 效果处理器
## 处理卡牌、武功、内功的各种效果
## 设计原则：简化版本，直接处理效果

class_name EffectProcessor
extends RefCounted


## 处理效果列表
## 返回所有效果的处理结果
static func process_effects(source: Dictionary, target: Dictionary, effects: Array, game_state: GameState) -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	for effect in effects:
		if effect is Dictionary:
			var result := process_effect(source, target, effect, game_state)
			results.append(result)

	return results


## 处理单个效果
static func process_effect(source: Dictionary, target: Dictionary, effect: Dictionary, game_state: GameState) -> Dictionary:
	var effect_type: String = effect.get("type", "")
	var value: int = effect.get("value", 0)
	var duration: int = effect.get("duration", 0)

	# 获取可选的目标覆盖
	var actual_target: Dictionary = effect.get("target_override", {})
	if actual_target.is_empty():
		actual_target = target

	var result := {
		"success": true,
		"effect_type": effect_type,
		"value": 0,
		"description": ""
	}

	var source_name: String = source.get("name", "未知")
	var target_name: String = actual_target.get("name", "未知")

	match effect_type:
		# 直接效果 - 立即应用
		"damage", "damage_target":
			var damage_result: Dictionary = CharacterState.take_damage(actual_target, value, source)
			result.value = damage_result.actual_damage
			result.description = "%s 对 %s 造成 %d 点伤害" % [source_name, target_name, damage_result.actual_damage]
			if game_state != null:
				game_state.damage_dealt.emit(actual_target, damage_result.actual_damage, source)

		"heal", "heal_self":
			var heal_amount: int = CharacterState.heal(source, value)
			result.value = heal_amount
			result.description = "%s 恢复 %d 点生命" % [source_name, heal_amount]
			if game_state != null:
				game_state.character_healed.emit(source, heal_amount)

		"shield", "add_shield":
			var shield: int = source.get("shield", 0)
			source["shield"] = shield + value
			result.value = value
			result.description = "%s 获得 %d 点护盾" % [source_name, value]
			if game_state != null:
				game_state.shield_gained.emit(source, value)

		"mp_recover", "recover_mp":
			CharacterState.recover_mp(source, value)
			result.value = value
			result.description = "%s 恢复 %d 点内力" % [source_name, value]

		"agility_boost", "boost_agility":
			var agility: int = source.get("agility", 0)
			source["agility"] = agility + value
			result.value = value
			result.description = "%s 轻功提升 %d" % [source_name, value]

		"agility_reduce", "reduce_agility":
			var agility: int = actual_target.get("agility", 0)
			actual_target["agility"] = maxi(0, agility - value)
			result.value = value
			result.description = "%s 轻功降低 %d" % [target_name, value]

		"draw_cards", "draw":
			var drawn: Array = CharacterState.draw_cards(source, value)
			result.value = drawn.size()
			result.description = "%s 抽取 %d 张牌" % [source_name, drawn.size()]

		"discard", "force_discard":
			var discard_result := _process_discard(actual_target, value)
			result.value = discard_result
			result.description = "%s 弃掉 %d 张牌" % [target_name, discard_result]

		# 状态效果
		"stun":
			result.value = duration
			result.description = "%s 被眩晕 %d 回合" % [target_name, duration]
			result["status_type"] = "stun"

		"poison":
			result.value = value
			result.description = "%s 中毒，每回合受到 %d 点伤害，持续 %d 回合" % [target_name, value, duration]
			result["status_type"] = "poison"
			result["duration"] = duration

		"bleed":
			result.value = value
			result.description = "%s 流血，每回合受到 %d 点伤害，持续 %d 回合" % [target_name, value, duration]
			result["status_type"] = "bleed"
			result["duration"] = duration

		# 条件效果
		"conditional":
			return _process_conditional(source, actual_target, effect, game_state)

		# 链式效果
		"chain":
			return _process_chain(source, actual_target, effect, game_state)

		_:
			result.success = false
			result.description = "未知效果类型: %s" % effect_type

	return result


## 处理弃牌效果
static func _process_discard(target: Dictionary, value: int) -> int:
	var hand: Array = target.get("hand", [])
	var discard_pile: Array = target.get("discard_pile", [])

	var discarded_count := 0
	for i in range(value):
		if hand.is_empty():
			break
		var card = hand.pop_at(randi() % hand.size())
		if card:
			discard_pile.append(card)
			discarded_count += 1

	target["hand"] = hand
	target["discard_pile"] = discard_pile

	return discarded_count


## 处理条件效果
static func _process_conditional(source: Dictionary, target: Dictionary, effect: Dictionary, game_state: GameState) -> Dictionary:
	var condition: String = effect.get("condition", "")
	var on_true: Dictionary = effect.get("on_true", {})
	var on_false: Dictionary = effect.get("on_false", {})

	var condition_met := _evaluate_condition(source, target, condition, game_state)

	if condition_met:
		if not on_true.is_empty():
			return process_effect(source, target, on_true, game_state)
		return {"success": true, "effect_type": "conditional", "value": 0, "description": "条件满足但无效果"}
	else:
		if not on_false.is_empty():
			return process_effect(source, target, on_false, game_state)
		return {"success": true, "effect_type": "conditional", "value": 0, "description": "条件不满足"}


## 评估条件
static func _evaluate_condition(source: Dictionary, target: Dictionary, condition: String, game_state: GameState) -> bool:
	match condition:
		"hp_below_50":
			var hp: int = target.get("hp", 0)
			var max_hp: int = target.get("max_hp", 60)
			return not target.is_empty() and hp < max_hp * 0.5
		"hp_below_30":
			var hp: int = target.get("hp", 0)
			var max_hp: int = target.get("max_hp", 60)
			return not target.is_empty() and hp < max_hp * 0.3
		"hp_full":
			var hp: int = target.get("hp", 0)
			var max_hp: int = target.get("max_hp", 60)
			return not target.is_empty() and hp >= max_hp
		"mp_above_10":
			var mp: int = source.get("mp", 0)
			return not source.is_empty() and mp > 10
		"target_shielded":
			var shield: int = target.get("shield", 0)
			return not target.is_empty() and shield > 0
		"has_shield":
			var shield: int = source.get("shield", 0)
			return not source.is_empty() and shield > 0
		"first_turn":
			return game_state != null and game_state.turn_number == 1
		_:
			return false


## 处理链式效果
static func _process_chain(source: Dictionary, target: Dictionary, effect: Dictionary, game_state: GameState) -> Dictionary:
	var effects: Array = effect.get("effects", [])

	if effects.is_empty():
		return {"success": true, "effect_type": "chain", "value": 0, "description": "无链式效果"}

	var total_value := 0
	var descriptions: Array[String] = []

	for sub_effect in effects:
		if sub_effect is Dictionary:
			var result := process_effect(source, target, sub_effect, game_state)
			if result.success:
				total_value += result.value
				if not result.description.is_empty():
					descriptions.append(result.description)

	return {
		"success": true,
		"effect_type": "chain",
		"value": total_value,
		"description": " | ".join(descriptions)
	}


## 检查效果是否需要目标
static func effect_requires_target(effect: Dictionary) -> bool:
	var effect_type: String = effect.get("type", "")

	# 这些效果需要目标
	var requires_target_types := [
		"damage", "damage_target",
		"agility_reduce", "reduce_agility",
		"discard", "force_discard",
		"stun", "poison", "bleed"
	]

	return effect_type in requires_target_types


## 获取效果类型的显示名称
static func get_effect_type_name(effect_type: String) -> String:
	match effect_type:
		"damage", "damage_target":
			return "伤害"
		"heal", "heal_self":
			return "治疗"
		"shield", "add_shield":
			return "护盾"
		"mp_recover", "recover_mp":
			return "内力恢复"
		"agility_boost", "boost_agility":
			return "轻功提升"
		"agility_reduce", "reduce_agility":
			return "轻功降低"
		"draw_cards", "draw":
			return "抽牌"
		"discard", "force_discard":
			return "弃牌"
		"stun":
			return "眩晕"
		"poison":
			return "中毒"
		"bleed":
			return "流血"
		"conditional":
			return "条件效果"
		"chain":
			return "链式效果"
		_:
			return "未知效果"
