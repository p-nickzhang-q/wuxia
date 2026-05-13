## status_bar.gd - 状态栏组件
## 显示回合数、当前阶段、行动者名称

class_name StatusBar
extends Control

# ==================== 子节点引用 ====================
@onready var turn_label: Label = $TurnLabel
@onready var phase_label: Label = $PhaseLabel
@onready var actor_label: Label = $ActorLabel

# ==================== 内部状态 ====================
var _current_turn: int = 0
var _current_phase: String = ""
var _current_actor: String = ""


func _ready() -> void:
	# 应用布局常量
	custom_minimum_size = Vector2(LayoutConstants.STATUS_BAR_WIDTH, LayoutConstants.STATUS_BAR_HEIGHT)


## 设置回合数
func set_turn(turn: int) -> void:
	_current_turn = turn
	if turn_label:
		turn_label.text = "第 %d 回合" % turn


## 设置阶段文本
func set_phase(phase: String) -> void:
	_current_phase = phase
	if phase_label:
		phase_label.text = phase


## 设置行动者名称
func set_actor(actor_name: String) -> void:
	_current_actor = actor_name
	if actor_label:
		actor_label.text = "行动: %s" % actor_name


## 获取当前回合数
func get_turn() -> int:
	return _current_turn


## 获取当前阶段
func get_phase() -> String:
	return _current_phase


## 获取当前行动者
func get_actor() -> String:
	return _current_actor


## 刷新显示
func refresh() -> void:
	if turn_label:
		turn_label.text = "第 %d 回合" % _current_turn
	if phase_label:
		phase_label.text = _current_phase
	if actor_label:
		actor_label.text = "行动: %s" % _current_actor
