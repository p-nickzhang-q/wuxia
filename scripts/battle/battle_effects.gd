## battle_effects.gd - 战斗视觉效果管理器
## 管理伤害数字、护盾效果、治疗效果、技能特效等视觉反馈
## 使用屏幕坐标系统，通过 position 参数定位效果

class_name BattleEffects
extends Node2D

## 效果场景预加载
const DAMAGE_NUMBER_SCENE = preload("res://scenes/effects/damage_number.tscn")
const SHIELD_EFFECT_SCENE = preload("res://scenes/effects/shield_effect.tscn")
const HEAL_EFFECT_SCENE = preload("res://scenes/effects/heal_effect.tscn")
const SKILL_EFFECT_SCENE = preload("res://scenes/effects/skill_effect.tscn")

## 默认效果参数
const DEFAULT_FLOAT_DURATION: float = 1.0
const DEFAULT_FLOAT_DISTANCE: float = -50.0
const DEFAULT_DAMAGE_COLOR: Color = Color.RED
const DEFAULT_HEAL_COLOR: Color = Color.GREEN
const DEFAULT_SHIELD_COLOR: Color = Color.CYAN
const DEFAULT_CRIT_COLOR: Color = Color.YELLOW
const DEFAULT_FONT_SIZE: int = 24


## 显示伤害数字
## position: 屏幕坐标位置
## damage: 伤害数值
## is_crit: 是否暴击
func show_damage(position: Vector2, damage: int, is_crit: bool = false) -> void:
	if damage <= 0:
		return

	var damage_number: Node2D = DAMAGE_NUMBER_SCENE.instantiate()
	add_child(damage_number)

	damage_number.global_position = position
	damage_number.setup(damage, DEFAULT_DAMAGE_COLOR if not is_crit else DEFAULT_CRIT_COLOR, is_crit)
	damage_number.float_up(DEFAULT_FLOAT_DISTANCE, DEFAULT_FLOAT_DURATION)


## 显示治疗数字
## position: 屏幕坐标位置
## amount: 治疗数值
func show_heal(position: Vector2, amount: int) -> void:
	if amount <= 0:
		return

	var heal_effect: Node2D = HEAL_EFFECT_SCENE.instantiate()
	add_child(heal_effect)

	heal_effect.global_position = position
	heal_effect.setup(amount, DEFAULT_HEAL_COLOR)
	heal_effect.float_up(DEFAULT_FLOAT_DISTANCE, DEFAULT_FLOAT_DURATION)


## 显示护盾效果
## position: 屏幕坐标位置
## amount: 护盾数值
func show_shield(position: Vector2, amount: int) -> void:
	if amount <= 0:
		return

	var shield_effect: Node2D = SHIELD_EFFECT_SCENE.instantiate()
	add_child(shield_effect)

	shield_effect.global_position = position
	shield_effect.setup(amount, DEFAULT_SHIELD_COLOR)
	shield_effect.float_up(DEFAULT_FLOAT_DISTANCE * 0.5, DEFAULT_FLOAT_DURATION)


## 显示技能特效
## position: 屏幕坐标位置
## skill_name: 技能名称
## skill_type: 技能类型 (fist, palm, short_weapon, long_weapon, kick)
func show_skill(position: Vector2, skill_name: String, skill_type: String = "default") -> void:
	var skill_effect: Node2D = SKILL_EFFECT_SCENE.instantiate()
	add_child(skill_effect)

	skill_effect.global_position = position
	skill_effect.setup(skill_name, skill_type)
	skill_effect.play_animation()


## 显示内功触发效果
## position: 屏幕坐标位置
## passive_name: 内功名称
func show_passive_trigger(position: Vector2, passive_name: String) -> void:
	var skill_effect: Node2D = SKILL_EFFECT_SCENE.instantiate()
	add_child(skill_effect)

	skill_effect.global_position = position
	skill_effect.setup(passive_name, "passive")
	skill_effect.play_animation()


## 显示综合战斗效果
## position: 屏幕坐标位置
## effect_data: 效果数据字典 {damage, heal, shield, is_crit, skill_name, passive_name}
func show_battle_effect(position: Vector2, effect_data: Dictionary) -> void:
	# 显示伤害
	if effect_data.has("damage") and effect_data.damage > 0:
		show_damage(position, effect_data.damage, effect_data.get("is_crit", false))

	# 显示治疗
	if effect_data.has("heal") and effect_data.heal > 0:
		var heal_offset: Vector2 = Vector2(30, 0)
		show_heal(position + heal_offset, effect_data.heal)

	# 显示护盾
	if effect_data.has("shield") and effect_data.shield > 0:
		var shield_offset: Vector2 = Vector2(-30, 0)
		show_shield(position + shield_offset, effect_data.shield)

	# 显示技能名称
	if effect_data.has("skill_name") and effect_data.skill_name != "":
		var skill_offset: Vector2 = Vector2(0, -60)
		show_skill(position + skill_offset, effect_data.skill_name, effect_data.get("skill_type", "default"))

	# 显示内功触发
	if effect_data.has("passive_name") and effect_data.passive_name != "":
		var passive_offset: Vector2 = Vector2(0, -90)
		show_passive_trigger(position + passive_offset, effect_data.passive_name)


## 清除所有效果
func clear_all_effects() -> void:
	for child in get_children():
		child.queue_free()
