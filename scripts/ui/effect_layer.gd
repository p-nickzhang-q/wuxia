## effect_layer.gd - 特效层
## CanvasLayer，显示在最顶层，管理伤害数字等特效

class_name EffectLayer
extends CanvasLayer

# ==================== 配置 ====================
## 伤害数字场景
const DAMAGE_NUMBER_SCENE = preload("res://scenes/effects/damage_number.tscn")

## 特效持续时间
const EFFECT_DURATION: float = 1.0

## 特效对象池
var _damage_number_pool: Array = []

## 当前活动的特效
var _active_effects: Array = []


func _ready() -> void:
	# 设置为最顶层
	layer = 100


## 显示伤害数字
func show_damage_number(damage: int, position: Vector2, is_crit: bool = false) -> void:
	var number = _get_damage_number()
	if number == null:
		return

	number.global_position = position
	number.setup(damage, LayoutConstants.COLOR_TEXT_RED, is_crit)
	number.float_up()

	_active_effects.append(number)

	# 设置自动回收
	get_tree().create_timer(EFFECT_DURATION).timeout.connect(
		_recycle_effect.bind(number)
	)


## 显示护盾数字
func show_shield_number(amount: int, position: Vector2) -> void:
	var number = _get_damage_number()
	if number == null:
		return

	number.global_position = position
	number.setup(amount, LayoutConstants.COLOR_TEXT_BLUE, false)
	number.float_up()

	_active_effects.append(number)

	get_tree().create_timer(EFFECT_DURATION).timeout.connect(
		_recycle_effect.bind(number)
	)


## 显示治疗数字
func show_heal_number(amount: int, position: Vector2) -> void:
	var number = _get_damage_number()
	if number == null:
		return

	number.global_position = position
	number.setup(amount, LayoutConstants.COLOR_TEXT_GREEN, false)
	number.float_up()

	_active_effects.append(number)

	get_tree().create_timer(EFFECT_DURATION).timeout.connect(
		_recycle_effect.bind(number)
	)


## 获取伤害数字（从池中或新建）
func _get_damage_number():
	# 尝试从池中获取
	if not _damage_number_pool.is_empty():
		var number = _damage_number_pool.pop_back()
		number.show()
		return number

	# 创建新的
	if DAMAGE_NUMBER_SCENE and DAMAGE_NUMBER_SCENE.can_instantiate():
		var number = DAMAGE_NUMBER_SCENE.instantiate()
		add_child(number)
		return number

	return null


## 回收特效到对象池
func _recycle_effect(effect) -> void:
	if effect == null:
		return

	# 从活动列表移除
	var idx = _active_effects.find(effect)
	if idx >= 0:
		_active_effects.remove_at(idx)

	# 隐藏并放回池中
	effect.hide()
	effect.global_position = Vector2(-1000, -1000)
	_damage_number_pool.append(effect)


## 清除所有特效
func clear_all_effects() -> void:
	for effect in _active_effects:
		if effect and is_instance_valid(effect):
			effect.queue_free()

	_active_effects.clear()

	for effect in _damage_number_pool:
		if effect and is_instance_valid(effect):
			effect.queue_free()

	_damage_number_pool.clear()
