## skill_effect.gd - 技能特效
## 显示技能名称和动画效果

class_name SkillEffect
extends Node2D

## 标签节点
@onready var label: Label = $Label
## 动画播放器
@onready var animation_player: AnimationPlayer = $AnimationPlayer

## 默认字体大小
const DEFAULT_FONT_SIZE: int = 18
const PASSIVE_FONT_SIZE: int = 16

## 技能类型颜色映射
const SKILL_COLORS: Dictionary = {
	"fist": Color.ORANGE_RED,
	"palm": Color.DEEP_SKY_BLUE,
	"short_weapon": Color.SILVER,
	"long_weapon": Color.GOLD,
	"kick": Color.FIREBRICK,
	"passive": Color.MEDIUM_PURPLE,
	"default": Color.WHITE
}

## 当前数据
var _skill_name: String = ""
var _skill_type: String = "default"


## 设置技能效果
func setup(skill_name: String, skill_type: String = "default") -> void:
	_skill_name = skill_name
	_skill_type = skill_type

	if label:
		label.text = skill_name
		var color: Color = SKILL_COLORS.get(skill_type, SKILL_COLORS["default"])
		label.add_theme_color_override("font_color", color)
		var font_size: int = PASSIVE_FONT_SIZE if skill_type == "passive" else DEFAULT_FONT_SIZE
		label.add_theme_font_size_override("font_size", font_size)


## 播放动画
func play_animation(duration: float = 1.5) -> void:
	var tween: Tween = create_tween()

	# 入场动画：缩放和淡入
	tween.set_parallel(true)
	tween.tween_property(self, "scale", Vector2(1.2, 1.2), 0.15).from(Vector2(0.5, 0.5)).set_ease(Tween.EASE_OUT)
	tween.tween_property(self, "modulate:a", 1.0, 0.15).from(0.0)

	# 停留
	tween.set_parallel(false)
	tween.tween_interval(duration * 0.5)

	# 缩小并淡出
	tween.set_parallel(true)
	tween.tween_property(self, "scale", Vector2(0.8, 0.8), duration * 0.5).set_ease(Tween.EASE_IN)
	tween.tween_property(self, "modulate:a", 0.0, duration * 0.5).set_ease(Tween.EASE_IN)

	# 销毁
	tween.set_parallel(false)
	tween.tween_callback(queue_free)


## 初始化
func _ready() -> void:
	if not label:
		label = $Label
	if not animation_player:
		animation_player = $AnimationPlayer

	scale = Vector2(0.5, 0.5)
	modulate.a = 0.0
