## effect_processor.gd - 效果处理器
## 处理卡牌、武功、内功的各种效果
## 设计原则：所有效果处理集中于此，便于维护和测试

class_name EffectProcessor
extends RefCounted


## 效果处理结果
## 包含处理后的效果信息和需要应用的状态变更
class EffectResult:
	## 效果是否成功执行
	var success: bool = true

	## 效果类型
	var effect_type: String = ""

	## 效果值（伤害量、治疗量等）
	var value: int = 0

	## 效果描述
	var description: String = ""

	## 是否为修饰符（如伤害加成、伤害减免）
	var is_modifier: bool = false

	## 修饰符类型（仅当 is_modifier 为 true 时有效）
	var modifier_type: String = ""

	## 目标角色
	var target = null  # Character 类型

	## 来源角色
	var source = null  # Character 类型

	## 额外数据（如反弹伤害信息）
	var extra_data: Dictionary = {}


	## 创建成功的结果
	static func ok(type: String, val: int, desc: String = "") -> EffectResult:
		var result := EffectResult.new()
		result.success = true
		result.effect_type = type
		result.value = val
		result.description = desc
		return result


	## 创建修饰符结果
	static func modifier(type: String, val: int, desc: String = "") -> EffectResult:
		var result := EffectResult.new()
		result.success = true
		result.effect_type = type
		result.value = val
		result.description = desc
		result.is_modifier = true
		result.modifier_type = type
		return result


	## 创建失败的结果
	static func failed(reason: String) -> EffectResult:
		var result := EffectResult.new()
		result.success = false
		result.description = reason
		return result


	## 转换为字典
	func to_dict() -> Dictionary:
		return {
			"success": success,
			"effect_type": effect_type,
			"value": value,
			"description": description,
			"is_modifier": is_modifier,
			"modifier_type": modifier_type,
			"target": target.name if target else null,
			"source": source.name if source else null,
			"extra_data": extra_data
		}


## 伤害修饰符信息
## 用于 damage_boost 和 damage_reduction
class DamageModifier:
	## 修饰符类型
	var modifier_type: String = ""

	## 修饰符值（百分比）
	var percentage: int = 0

	## 来源描述
	var source_description: String = ""

	## 拥有者
	var owner = null  # Character 类型


	## 创建伤害加成修饰符
	static func damage_boost(percentage_val: int, owner_char, source_desc: String = "") -> DamageModifier:
		var mod := DamageModifier.new()
		mod.modifier_type = "damage_boost"
		mod.percentage = percentage_val
		mod.owner = owner_char
		mod.source_description = source_desc
		return mod


	## 创建伤害减免修饰符
	static func damage_reduction(percentage_val: int, owner_char, source_desc: String = "") -> DamageModifier:
		var mod := DamageModifier.new()
		mod.modifier_type = "damage_reduction"
		mod.percentage = percentage_val
		mod.owner = owner_char
		mod.source_description = source_desc
		return mod


	## 应用修饰符到伤害值
	## damage_boost: 增加 (base_damage * percentage / 100) 的伤害
	## damage_reduction: 减少 (incoming_damage * percentage / 100) 的伤害
	func apply(damage: int, is_incoming: bool = false) -> int:
		match modifier_type:
			"damage_boost":
				# 伤害加成：增加伤害输出
				if not is_incoming:
					var bonus := damage * percentage / 100
					return damage + bonus
			"damage_reduction":
				# 伤害减免：减少受到的伤害
				if is_incoming:
					var reduction := damage * percentage / 100
					return maxi(0, damage - reduction)

		return damage


	## 转换为字典
	func to_dict() -> Dictionary:
		return {
			"modifier_type": modifier_type,
			"percentage": percentage,
			"source_description": source_description,
			"owner": owner.name if owner else null
		}


## 反弹伤害信息
## 用于 reflect_damage 效果
class ReflectDamageInfo:
	## 反弹百分比
	var percentage_value: int = 0

	## 拥有者（反弹伤害的角色）
	var owner = null  # Character 类型

	## 来源描述
	var source_description: String = ""

	## 固定反弹值（如果设置，则忽略百分比）
	var fixed_amount: int = 0

	## 是否使用固定值
	var use_fixed: bool = false


	## 创建百分比反弹
	static func percentage(pct: int, owner_char, source_desc: String = "") -> ReflectDamageInfo:
		var info := ReflectDamageInfo.new()
		info.percentage_value = pct
		info.owner = owner_char
		info.source_description = source_desc
		info.use_fixed = false
		return info


	## 创建固定值反弹
	static func fixed(amount: int, owner_char, source_desc: String = "") -> ReflectDamageInfo:
		var info := ReflectDamageInfo.new()
		info.fixed_amount = amount
		info.owner = owner_char
		info.source_description = source_desc
		info.use_fixed = true
		return info


	## 计算反弹伤害
	func calculate_reflect(received_damage: int) -> int:
		if use_fixed:
			return fixed_amount
		else:
			return received_damage * percentage_value / 100


	## 转换为字典
	func to_dict() -> Dictionary:
		return {
			"percentage": percentage_value,
			"owner": owner.name if owner else null,
			"source_description": source_description,
			"fixed_amount": fixed_amount,
			"use_fixed": use_fixed
		}


# ==================== 效果处理主方法 ====================

## 处理效果列表
## 返回所有效果的处理结果
static func process_effects(source, target, effects: Array, game_state) -> Array:
	"""处理多个效果，返回结果数组"""
	var results: Array = []

	for effect in effects:
		if effect is Dictionary:
			var result := process_effect(source, target, effect, game_state)
			results.append(result)

	return results


## 处理单个效果
## source: 效果来源角色 (Character)
## target: 效果目标角色 (Character)
## effect: 效果数据字典
## game_state: 游戏状态（无类型）
static func process_effect(source, target, effect: Dictionary, game_state) -> EffectResult:
	"""处理单个效果，返回效果结果"""
	var effect_type: String = effect.get("type", "")
	var value: int = effect.get("value", 0)
	var duration: int = effect.get("duration", 0)

	# 获取可选的目标覆盖
	var actual_target = effect.get("target_override", null)
	if actual_target == null:
		actual_target = target

	match effect_type:
		# 直接效果 - 立即应用
		"damage", "damage_target":
			return _process_damage(source, actual_target, value, effect, game_state)

		"heal", "heal_self":
			return _process_heal(source, value, effect)

		"shield", "add_shield":
			return _process_shield(source, value, effect)

		"mp_recover", "recover_mp":
			return _process_mp_recover(source, value, effect)

		"agility_boost", "boost_agility":
			return _process_agility_boost(source, value, effect)

		"agility_reduce", "reduce_agility":
			return _process_agility_reduce(actual_target, value, effect)

		"draw_cards", "draw":
			return _process_draw_cards(source, value, effect, game_state)

		"discard", "force_discard":
			return _process_discard(actual_target, value, effect)

		# 修饰符效果 - 返回修饰符供调用者应用
		"damage_boost":
			return _process_damage_boost(source, value, effect)

		"damage_reduction":
			return _process_damage_reduction(source, value, effect)

		# 反弹效果 - 返回信息供伤害系统处理
		"reflect_damage":
			return _process_reflect_damage(source, value, effect)

		# 状态效果
		"stun":
			return _process_stun(actual_target, value, duration, effect)

		"poison":
			return _process_poison(actual_target, value, duration, effect)

		"bleed":
			return _process_bleed(actual_target, value, duration, effect)

		# 条件效果
		"conditional":
			return _process_conditional(source, actual_target, effect, game_state)

		# 链式效果
		"chain":
			return _process_chain(source, actual_target, effect, game_state)

		_:
			return EffectResult.failed("未知效果类型: %s" % effect_type)


# ==================== 直接效果处理 ====================

## 处理伤害效果
static func _process_damage(source, target, value: int, effect: Dictionary, _game_state) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	# 应用伤害
	var damage_result: Dictionary = target.take_damage(value, source)

	var result := EffectResult.ok("damage", damage_result.actual_damage,
		"%s 对 %s 造成 %d 点伤害" % [source.name, target.name, damage_result.actual_damage])
	result.target = target
	result.source = source
	result.extra_data = {
		"shield_absorbed": damage_result.shield_absorbed
	}

	return result


## 处理治疗效果
static func _process_heal(target, value: int, effect: Dictionary) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	var actual_heal: int = target.heal(value)

	return EffectResult.ok("heal", actual_heal,
		"%s 恢复 %d 点生命" % [target.name, actual_heal])


## 处理护盾效果
static func _process_shield(target, value: int, effect: Dictionary) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	target.shield += value

	return EffectResult.ok("shield", value,
		"%s 获得 %d 点护盾" % [target.name, value])


## 处理内力恢复效果
static func _process_mp_recover(target, value: int, effect: Dictionary) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	target.recover_mp(value)

	return EffectResult.ok("mp_recover", value,
		"%s 恢复 %d 点内力" % [target.name, value])


## 处理轻功提升效果
static func _process_agility_boost(target, value: int, effect: Dictionary) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	target.current_agility += value

	return EffectResult.ok("agility_boost", value,
		"%s 轻功提升 %d" % [target.name, value])


## 处理轻功降低效果
static func _process_agility_reduce(target, value: int, effect: Dictionary) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	target.current_agility = maxi(0, target.current_agility - value)

	return EffectResult.ok("agility_reduce", value,
		"%s 轻功降低 %d" % [target.name, value])


## 处理抽牌效果
static func _process_draw_cards(target, value: int, effect: Dictionary, _game_state) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	var drawn: Array = target.draw_cards(value)

	return EffectResult.ok("draw_cards", drawn.size(),
		"%s 抽取 %d 张牌" % [target.name, drawn.size()])


## 处理弃牌效果
static func _process_discard(target, value: int, effect: Dictionary) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	# 随机弃牌
	var discarded_count := 0
	for i in range(value):
		if target.hand.is_empty():
			break
		var card = target.hand.pop_at(randi() % target.hand.size())
		if card:
			target.discard_pile.append(card)
			discarded_count += 1

	return EffectResult.ok("discard", discarded_count,
		"%s 弃掉 %d 张牌" % [target.name, discarded_count])


# ==================== 修饰符效果处理 ====================

## 处理伤害加成效果
## 返回 DamageModifier 供调用者在伤害计算时应用
static func _process_damage_boost(source, value: int, effect: Dictionary) -> EffectResult:
	if source == null:
		return EffectResult.failed("无有效来源")

	# 创建伤害加成修饰符
	var modifier := DamageModifier.damage_boost(value, source,
		effect.get("source_description", "内功效果"))

	# 返回修饰符结果
	var result := EffectResult.modifier("damage_boost", value,
		"%s 伤害提升 %d%%" % [source.name, value])
	result.source = source
	result.extra_data = {
		"modifier": modifier
	}

	return result


## 处理伤害减免效果
## 返回 DamageModifier 供调用者在受到伤害时应用
static func _process_damage_reduction(source, value: int, effect: Dictionary) -> EffectResult:
	if source == null:
		return EffectResult.failed("无有效来源")

	# 创建伤害减免修饰符
	var modifier := DamageModifier.damage_reduction(value, source,
		effect.get("source_description", "内功效果"))

	# 返回修饰符结果
	var result := EffectResult.modifier("damage_reduction", value,
		"%s 伤害减免 %d%%" % [source.name, value])
	result.source = source
	result.extra_data = {
		"modifier": modifier
	}

	return result


## 处理反弹伤害效果
## 返回 ReflectDamageInfo 供伤害系统在计算伤害后处理
static func _process_reflect_damage(source, value: int, effect: Dictionary) -> EffectResult:
	if source == null:
		return EffectResult.failed("无有效来源")

	# 检查是否为固定值反弹
	var is_fixed: bool = effect.get("is_fixed", false)

	var reflect_info: ReflectDamageInfo
	if is_fixed:
		reflect_info = ReflectDamageInfo.fixed(value, source,
			effect.get("source_description", "内功效果"))
	else:
		reflect_info = ReflectDamageInfo.percentage(value, source,
			effect.get("source_description", "内功效果"))

	# 返回反弹信息
	var result := EffectResult.ok("reflect_damage", value,
		"%s 反弹 %d%% 伤害" % [source.name, value])
	result.source = source
	result.is_modifier = true
	result.extra_data = {
		"reflect_info": reflect_info
	}

	return result


# ==================== 状态效果处理 ====================

## 处理眩晕效果
## 眩晕状态需要在角色类中实现状态管理
static func _process_stun(target, value: int, duration: int, effect: Dictionary) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	# 检查目标是否有状态管理
	if target.has_method("apply_status"):
		target.apply_status("stun", duration, {"intensity": value})
		return EffectResult.ok("stun", duration,
			"%s 被眩晕 %d 回合" % [target.name, duration])
	else:
		# 如果没有状态系统，记录到 extra_data 供外部处理
		var result := EffectResult.ok("stun", duration,
			"%s 被眩晕 %d 回合" % [target.name, duration])
		result.target = target
		result.extra_data = {
			"status_type": "stun",
			"duration": duration,
			"intensity": value
		}
		return result


## 处理中毒效果
static func _process_poison(target, value: int, duration: int, effect: Dictionary) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	if target.has_method("apply_status"):
		target.apply_status("poison", duration, {"damage_per_turn": value})
		return EffectResult.ok("poison", value,
			"%s 中毒，每回合受到 %d 点伤害，持续 %d 回合" % [target.name, value, duration])
	else:
		var result := EffectResult.ok("poison", value,
			"%s 中毒，每回合受到 %d 点伤害，持续 %d 回合" % [target.name, value, duration])
		result.target = target
		result.extra_data = {
			"status_type": "poison",
			"duration": duration,
			"damage_per_turn": value
		}
		return result


## 处理流血效果
static func _process_bleed(target, value: int, duration: int, effect: Dictionary) -> EffectResult:
	if target == null:
		return EffectResult.failed("无有效目标")

	if target.has_method("apply_status"):
		target.apply_status("bleed", duration, {"damage_per_turn": value})
		return EffectResult.ok("bleed", value,
			"%s 流血，每回合受到 %d 点伤害，持续 %d 回合" % [target.name, value, duration])
	else:
		var result := EffectResult.ok("bleed", value,
			"%s 流血，每回合受到 %d 点伤害，持续 %d 回合" % [target.name, value, duration])
		result.target = target
		result.extra_data = {
			"status_type": "bleed",
			"duration": duration,
			"damage_per_turn": value
		}
		return result


# ==================== 条件效果处理 ====================

## 处理条件效果
## 根据条件决定执行哪个效果
static func _process_conditional(source, target, effect: Dictionary, game_state) -> EffectResult:
	var condition: String = effect.get("condition", "")
	var on_true: Dictionary = effect.get("on_true", {})
	var on_false: Dictionary = effect.get("on_false", {})

	var condition_met := _evaluate_condition(source, target, condition, game_state)

	if condition_met:
		if not on_true.is_empty():
			return process_effect(source, target, on_true, game_state)
		return EffectResult.ok("conditional", 0, "条件满足但无效果")
	else:
		if not on_false.is_empty():
			return process_effect(source, target, on_false, game_state)
		return EffectResult.ok("conditional", 0, "条件不满足")


## 评估条件
static func _evaluate_condition(source, target, condition: String, game_state) -> bool:
	match condition:
		"hp_below_50":
			return target != null and target.current_hp < target.max_hp * 0.5
		"hp_below_30":
			return target != null and target.current_hp < target.max_hp * 0.3
		"hp_full":
			return target != null and target.current_hp >= target.max_hp
		"mp_above_10":
			return source != null and source.current_mp > 10
		"target_shielded":
			return target != null and target.shield > 0
		"has_shield":
			return source != null and source.shield > 0
		"first_turn":
			return game_state != null and game_state.turn_number == 1
		_:
			return false


# ==================== 链式效果处理 ====================

## 处理链式效果
## 按顺序执行多个效果
static func _process_chain(source, target, effect: Dictionary, game_state) -> EffectResult:
	var effects: Array = effect.get("effects", [])

	if effects.is_empty():
		return EffectResult.ok("chain", 0, "无链式效果")

	var total_value := 0
	var descriptions: Array[String] = []

	for sub_effect in effects:
		if sub_effect is Dictionary:
			var result := process_effect(source, target, sub_effect, game_state)
			if result.success:
				total_value += result.value
				if not result.description.is_empty():
					descriptions.append(result.description)

	return EffectResult.ok("chain", total_value, " | ".join(descriptions))


# ==================== 辅助方法 ====================

## 从效果结果中提取所有修饰符
## 用于在伤害计算时应用
static func extract_modifiers(results: Array) -> Array:
	"""从效果结果数组中提取所有修饰符"""
	var modifiers: Array = []

	for result in results:
		if result is EffectResult and result.is_modifier:
			if result.extra_data.has("modifier"):
				modifiers.append(result.extra_data["modifier"])

	return modifiers


## 从效果结果中提取反弹伤害信息
## 用于在伤害计算后处理反弹
static func extract_reflect_info(results: Array) -> Array:
	"""从效果结果数组中提取所有反弹伤害信息"""
	var reflect_infos: Array = []

	for result in results:
		if result is EffectResult and result.effect_type == "reflect_damage":
			if result.extra_data.has("reflect_info"):
				reflect_infos.append(result.extra_data["reflect_info"])

	return reflect_infos


## 应用伤害修饰符
## modifiers: DamageModifier 数组
## base_damage: 基础伤害
## is_incoming: 是否为受到的伤害（用于区分伤害加成和伤害减免）
static func apply_damage_modifiers(modifiers: Array, base_damage: int, is_incoming: bool = false) -> int:
	"""应用所有伤害修饰符，返回最终伤害"""
	var final_damage := base_damage

	for modifier in modifiers:
		if modifier is DamageModifier:
			final_damage = modifier.apply(final_damage, is_incoming)

	return final_damage


## 计算反弹伤害
## reflect_infos: ReflectDamageInfo 数组
## received_damage: 受到的伤害
static func calculate_reflect_damage(reflect_infos: Array, received_damage: int) -> int:
	"""计算总反弹伤害"""
	var total_reflect := 0

	for info in reflect_infos:
		if info is ReflectDamageInfo:
			total_reflect += info.calculate_reflect(received_damage)

	return total_reflect


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
		"damage_boost":
			return "伤害加成"
		"damage_reduction":
			return "伤害减免"
		"reflect_damage":
			return "反弹伤害"
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
