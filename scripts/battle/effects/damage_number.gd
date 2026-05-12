## damage_number.gd - 伤害数字效果
## 显示伤害数值并向上飘动消失

class_name DamageNumber
extends Node2D

## 标签节点
@onready var label: Label = $Label

## 默认字体大小
const DEFAULT_FONT_SIZE: int = 24
const CRIT_FONT_SIZE: int = 32

## 当前数值
var _value: int = 0
var _color: Color = Color.RED
var _is_crit: bool = false


## 设置伤害数字
func setup(damage: int, color: Color = Color.RED, is_crit: bool = false) -> void:
	_value = damage
	_color = color
	_is_crit = is_crit

	if label:
		label.text = str(damage)
		label.add_theme_color_override("font_color", color)
		label.add_theme_font_size_override("font_size", CRIT_FONT_SIZE if is_crit else DEFAULT_FONT_SIZE)

		if is_crit:
			label.text = str(damage) + "!"


## 向上飘动动画
func float_up(distance: float = -50.0, duration: float = 1.0) -> void:
	var tween: Tween = create_tween()
	var start_pos: Vector2 = global_position
	var end_pos: Vector2 = start_pos + Vector2(0, distance)

	# 同时执行位置和透明度动画
	tween.set_parallel(true)
	tween.tween_property(self, "global_position", end_pos, duration).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "modulate:a", 0.0, duration).set_ease(Tween.EASE_IN)

	# 暴击时添加缩放动画
	if _is_crit:
		var scale_tween: Tween = create_tween()
		scale_tween.tween_property(self, "scale", Vector2(1.3, 1.3), 0.1)
		scale_tween.tween_property(self, "scale", Vector2(1.0, 1.0), 0.2)

	# 动画结束后自动销毁
	tween.set_parallel(false)
	tween.tween_callback(queue_free)


## 初始化时设置
func _ready() -> void:
	if not label:
		label = $Label

	scale = Vector2(1.0, 1.0)
	modulate.a = 1.0
