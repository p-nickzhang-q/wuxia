## shield_effect.gd - 护盾效果
## 显示护盾数值并带有粒子效果

class_name ShieldEffect
extends Node2D

## 标签节点
@onready var label: Label = $Label
## 粒子节点
@onready var particles: GPUParticles2D = $Particles

## 默认字体大小
const DEFAULT_FONT_SIZE: int = 20

## 当前数值
var _value: int = 0
var _color: Color = Color.CYAN


## 设置护盾效果
func setup(amount: int, color: Color = Color.CYAN) -> void:
	_value = amount
	_color = color

	if label:
		label.text = "+" + str(amount)
		label.add_theme_color_override("font_color", color)
		label.add_theme_font_size_override("font_size", DEFAULT_FONT_SIZE)


## 向上飘动动画
func float_up(distance: float = -30.0, duration: float = 1.0) -> void:
	# 触发粒子效果
	if particles:
		particles.emitting = true
		_setup_shield_particles()

	var tween: Tween = create_tween()
	var start_pos: Vector2 = global_position
	var end_pos: Vector2 = start_pos + Vector2(0, distance)

	tween.set_parallel(true)
	tween.tween_property(self, "global_position", end_pos, duration).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "modulate:a", 0.0, duration).set_ease(Tween.EASE_IN)

	tween.set_parallel(false)
	tween.tween_callback(queue_free)


## 设置护盾粒子参数
func _setup_shield_particles() -> void:
	if not particles:
		return

	var process_mat: ParticleProcessMaterial = ParticleProcessMaterial.new()
	process_mat.emission_shape = ParticleProcessMaterial.EMISSION_SHAPE_POINT
	process_mat.direction = Vector3(0, -1, 0)
	process_mat.spread = 30.0
	process_mat.initial_velocity_min = 20.0
	process_mat.initial_velocity_max = 50.0
	process_mat.gravity = Vector3(0, -10, 0)
	process_mat.scale_min = 2.0
	process_mat.scale_max = 4.0
	process_mat.color = _color

	particles.process_material = process_mat


## 初始化
func _ready() -> void:
	if not label:
		label = $Label
	if not particles:
		particles = $Particles

	scale = Vector2(1.0, 1.0)
	modulate.a = 1.0
