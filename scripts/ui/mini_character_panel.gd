## mini_character_panel.gd - 迷你角色面板组件
## 用于门派管理界面显示弟子简要信息：头像、名称、状态、精力、当前事务

class_name MiniCharacterPanel
extends Control

# ==================== 信号 ====================
## 点击信号
signal clicked(character)
## 悬停信号
signal hovered(character)

# ==================== 导出属性 ====================
## 绑定的角色（弟子）
@export var character: Character = null

# ==================== 子节点引用 ====================
## 头像容器
@onready var portrait: TextureRect = $Portrait
## 名称标签
@onready var name_label: Label = $NameLabel
## 状态图标容器
@onready var status_icons: HBoxContainer = $StatusIcons
## 精力标签
@onready var vitality_label: Label = $VitalityLabel
## 当前事务标签
@onready var task_label: Label = $TaskLabel
## 剩余时辰标签
@onready var time_label: Label = $TimeLabel
## 点击提示标签
@onready var click_hint: Label = $ClickHint

# ==================== 状态 ====================
## 弟子当前状态（健康、训练、修炼等）
var disciple_status: String = "healthy"
## 当前执行事务
var current_task: String = ""
## 剩余时辰
var remaining_time: int = 0
## 当前精力
var current_vitality: int = 0
## 精力上限
var max_vitality: int = 100

# ==================== 内部变量 ====================
## 默认背景颜色
var _default_modulate: Color = Color.WHITE


func _ready() -> void:
	# 连接鼠标事件
	gui_input.connect(_on_gui_input)
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)

	# 保存默认颜色
	_default_modulate = self_modulate

	# 如果已有角色，进行初始化
	if character:
		setup()


## 设置面板，绑定角色数据
func setup() -> void:
	if not character:
		return

	# 更新名称
	name_label.text = character.name

	# 更新精力（使用 MP 作为精力代理，或根据实际系统调整）
	current_vitality = character.current_mp
	max_vitality = character.max_mp
	vitality_label.text = "精力 %d" % current_vitality

	# 更新状态图标
	_update_status_icons()

	# 更新事务信息
	_update_task_info()

	# 更新点击提示
	click_hint.visible = true


## 设置弟子状态（外部调用）
## status: "healthy" | "training" | "cultivating" | "exploring" | "resting"
func set_status(status: String) -> void:
	disciple_status = status
	_update_status_icons()


## 设置当前事务（外部调用）
func set_task(task_name: String, remaining: int = 0) -> void:
	current_task = task_name
	remaining_time = remaining
	_update_task_info()


## 设置精力值（外部调用）
func set_vitality(current: int, maximum: int = -1) -> void:
	current_vitality = current
	if maximum > 0:
		max_vitality = maximum
	vitality_label.text = "精力 %d" % current_vitality


## 更新状态图标
func _update_status_icons() -> void:
	# 清除现有图标
	for child in status_icons.get_children():
		child.queue_free()

	# 根据状态创建图标
	var status_label := Label.new()
	status_label.add_theme_font_size_override("font_size", 14)

	match disciple_status:
		"healthy":
			status_label.text = "*"
			status_label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.3, 1))
		"training":
			status_label.text = "o"
			status_label.add_theme_color_override("font_color", Color(0.9, 0.7, 0.3, 1))
		"cultivating":
			status_label.text = "o"
			status_label.add_theme_color_override("font_color", Color(0.7, 0.5, 0.9, 1))
		"exploring":
			status_label.text = "o"
			status_label.add_theme_color_override("font_color", Color(0.3, 0.7, 0.9, 1))
		"resting":
			status_label.text = "o"
			status_label.add_theme_color_override("font_color", Color(0.5, 0.5, 0.5, 1))
		_:
			status_label.text = "*"
			status_label.add_theme_color_override("font_color", Color(0.3, 0.9, 0.3, 1))

	status_icons.add_child(status_label)


## 更新事务信息
func _update_task_info() -> void:
	if current_task.is_empty():
		task_label.text = "正在: 无"
		time_label.visible = false
	else:
		task_label.text = "正在: %s" % current_task
		if remaining_time > 0:
			time_label.text = "剩余: %d时辰" % remaining_time
			time_label.visible = true
		else:
			time_label.visible = false


## 刷新显示（外部调用以更新数据）
func refresh() -> void:
	if not character:
		return

	# 更新精力
	current_vitality = character.current_mp
	max_vitality = character.max_mp
	vitality_label.text = "精力 %d" % current_vitality

	# 更新状态图标
	_update_status_icons()


# ==================== 事件处理 ====================
func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			clicked.emit(character)


func _on_mouse_entered() -> void:
	hovered.emit(character)
	# 悬停时显示点击提示
	if click_hint:
		click_hint.modulate.a = 1.0


func _on_mouse_exited() -> void:
	hovered.emit(null)
	# 离开时隐藏点击提示
	if click_hint:
		click_hint.modulate.a = 0.5
