## passive_state.gd - 内功运行时状态
## 管理内功的数据和效果，包含运行时状态（如触发次数）

class_name PassiveState
extends RefCounted

## 内功ID
var passive_id: String = ""

## 内功名称
var name: String = ""

## 触发时机
var trigger_timing: Types.TriggerTiming = Types.TriggerTiming.TURN_START

## 效果列表
var effects: Array[Dictionary] = []

## 触发概率（1.0 = 100%）
var trigger_chance: float = 1.0

## 描述
var description: String = ""

## 是否启用
var enabled: bool = true

## 每回合触发次数限制（0表示无限制）
var triggers_per_turn: int = 0

## 当前回合已触发次数
var current_triggers: int = 0


## 从数据字典创建内功
static func from_data(data: Dictionary) -> PassiveState:
	var passive := PassiveState.new()
	passive.passive_id = data.get("id", "")
	passive.name = data.get("name", "未知内功")
	passive.trigger_timing = _parse_trigger_timing(data.get("trigger_timing", "turn_start"))
	var effects_data = data.get("effects", [])
	passive.effects = effects_data.duplicate(true) if effects_data else []
	passive.trigger_chance = data.get("trigger_chance", 1.0)
	passive.description = data.get("description", "")
	passive.enabled = data.get("enabled", true)
	passive.triggers_per_turn = data.get("triggers_per_turn", 0)
	passive.current_triggers = 0
	return passive


## 解析触发时机
static func _parse_trigger_timing(timing_str: String) -> Types.TriggerTiming:
	match timing_str.to_lower():
		"turn_start", "回合开始":
			return Types.TriggerTiming.TURN_START
		"turn_end", "回合结束":
			return Types.TriggerTiming.TURN_END
		"on_damage", "造成伤害时":
			return Types.TriggerTiming.ON_DAMAGE
		"on_take_damage", "受到伤害时":
			return Types.TriggerTiming.ON_TAKE_DAMAGE
		"on_play_card", "使用基础招式时":
			return Types.TriggerTiming.ON_PLAY_CARD
		"on_skill_use", "使用武功招式时":
			return Types.TriggerTiming.ON_SKILL_USE
		_:
			return Types.TriggerTiming.TURN_START


## 检查是否可以触发
func can_trigger() -> bool:
	if not enabled:
		return false

	# 检查触发次数限制
	if triggers_per_turn > 0 and current_triggers >= triggers_per_turn:
		return false

	# 检查触发概率
	if trigger_chance < 1.0:
		return randf() <= trigger_chance

	return true


## 触发内功效果
## owner: 角色状态字典
func trigger(owner: Dictionary, game_state, args: Array = []) -> Dictionary:
	if not can_trigger():
		return {"triggered": false}

	current_triggers += 1

	var result := {
		"triggered": true,
		"passive_id": passive_id,
		"passive_name": name,
		"effects": []
	}

	# 处理效果
	for effect in effects:
		var effect_result: Dictionary = _process_effect(owner, game_state, effect, args)
		result.effects.append(effect_result)

	return result


## 处理单个效果
func _process_effect(owner: Dictionary, game_state, effect: Dictionary, args: Array) -> Dictionary:
	var effect_type: String = effect.get("type", "")
	var value: int = effect.get("value", 0)
	var result: Dictionary = {"type": effect_type, "value": 0}
	var owner_name: String = owner.get("name", "未知")

	match effect_type:
		"heal", "heal_self":
			var heal_amount: int = CharacterState.heal(owner, value)
			result.value = heal_amount
			result.description = "%s 恢复 %d 点生命" % [owner_name, heal_amount]

		"shield", "add_shield":
			var shield: int = owner.get("shield", 0)
			owner["shield"] = shield + value
			result.value = value
			result.description = "%s 获得 %d 点护盾" % [owner_name, value]

		"damage", "damage_target":
			if args.size() > 0 and args[0] is Dictionary:
				var target: Dictionary = args[0]
				var damage_result: Dictionary = CharacterState.take_damage(target, value, owner)
				result.value = damage_result.actual_damage
				var target_name: String = target.get("name", "未知")
				result.description = "%s 对 %s 造成 %d 点伤害" % [owner_name, target_name, damage_result.actual_damage]

		"mp_recover", "recover_mp":
			CharacterState.recover_mp(owner, value)
			result.value = value
			result.description = "%s 恢复 %d 点内力" % [owner_name, value]

		"agility_boost", "boost_agility":
			var agility: int = owner.get("agility", 0)
			owner["agility"] = agility + value
			result.value = value
			result.description = "%s 轻功提升 %d" % [owner_name, value]

		"draw_cards", "draw":
			var drawn: Array = CharacterState.draw_cards(owner, value)
			result.value = drawn.size()
			result.description = "%s 抽取 %d 张牌" % [owner_name, drawn.size()]

		"damage_boost":
			# 伤害加成，需要在伤害计算时应用
			result.value = value
			result.is_modifier = true
			result.description = "%s 伤害提升 %d%%" % [owner_name, value]

		"damage_reduction":
			# 伤害减免
			result.value = value
			result.is_modifier = true
			result.description = "%s 伤害减免 %d%%" % [owner_name, value]

		"reflect_damage":
			# 反弹伤害
			result.value = value
			result.is_modifier = true
			result.description = "%s 反弹 %d%% 伤害" % [owner_name, value]

		_:
			result.description = "未知效果: %s" % effect_type

	return result


## 重置回合触发次数
func reset_turn_triggers() -> void:
	current_triggers = 0


## 获取触发时机名称
func get_trigger_timing_name() -> String:
	return Types.get_trigger_timing_name(trigger_timing)


## 转换为字典
func to_dict() -> Dictionary:
	return {
		"passive_id": passive_id,
		"name": name,
		"trigger_timing": get_trigger_timing_name(),
		"effects": effects,
		"trigger_chance": trigger_chance,
		"description": description,
		"enabled": enabled,
		"triggers_per_turn": triggers_per_turn,
		"current_triggers": current_triggers
	}
