## tooltip.gd - 通用提示框组件
## 用于显示卡牌、技能、状态效果等的详细信息
## 跟随鼠标位置显示，支持自动边界检测

class_name Tooltip
extends Control

# ==================== 信号 ====================
## 显示完成信号
signal shown()
## 隐藏完成信号
signal tooltip_hidden()

# ==================== 导出属性 ====================
## 显示延迟（秒）
@export var show_delay: float = 0.3
## 隐藏延迟（秒）
@export var hide_delay: float = 0.1
## 边距（像素）
@export var margin: float = 16.0
## 最大宽度（像素）
@export var max_width: float = 300.0
## 是否跟随鼠标
@export var follow_mouse: bool = true

# ==================== 子节点引用 ====================
## 背景面板
@onready var background: Panel = $Background
## 标题标签
@onready var title_label: Label = $VBox/TitleLabel
## 类型标签
@onready var type_label: Label = $VBox/TypeLabel
## 描述标签
@onready var desc_label: Label = $VBox/DescLabel
## 详情容器
@onready var details_container: VBoxContainer = $VBox/DetailsContainer

# ==================== 状态 ====================
## 是否正在显示
var is_showing: bool = false
## 当前显示的数据
var _current_data: Dictionary = {}
## 显示计时器
var _show_timer: float = 0.0
## 隐藏计时器
var _hide_timer: float = 0.0
## 是否等待显示
var _waiting_to_show: bool = false
## 是否等待隐藏
var _waiting_to_hide: bool = false


func _ready() -> void:
	# 初始隐藏
	visible = false
	mouse_filter = Control.MOUSE_FILTER_IGNORE

	# 设置最大宽度
	custom_minimum_size.x = max_width


func _process(delta: float) -> void:
	# 处理显示延迟
	if _waiting_to_show:
		_show_timer += delta
		if _show_timer >= show_delay:
			_waiting_to_show = false
			_do_show()

	# 处理隐藏延迟
	if _waiting_to_hide:
		_hide_timer += delta
		if _hide_timer >= hide_delay:
			_waiting_to_hide = false
			_do_hide()

	# 跟随鼠标
	if visible and follow_mouse:
		_update_position()


# ==================== 公共方法 ====================
## 设置标题
func set_title(text: String) -> void:
	title_label.text = text
	title_label.visible = not text.is_empty()


## 设置类型
func set_type(text: String) -> void:
	type_label.text = text
	type_label.visible = not text.is_empty()


## 设置描述
func set_description(text: String) -> void:
	desc_label.text = text
	desc_label.visible = not text.is_empty()


## 清空详情
func clear_details() -> void:
	for child in details_container.get_children():
		child.queue_free()


## 添加详情行
func add_detail(label: String, value: String, color: Color = Color.WHITE) -> void:
	var hbox := HBoxContainer.new()
	hbox.alignment = BoxContainer.ALIGNMENT_BEGIN

	var label_node := Label.new()
	label_node.text = label + ":"
	label_node.add_theme_color_override("font_color", Color(0.7, 0.7, 0.7))
	label_node.add_theme_font_size_override("font_size", 12)
	hbox.add_child(label_node)

	var value_node := Label.new()
	value_node.text = value
	value_node.add_theme_color_override("font_color", color)
	value_node.add_theme_font_size_override("font_size", 12)
	value_node.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	hbox.add_child(value_node)

	details_container.add_child(hbox)


## 从卡牌数据设置
func setup_from_card(card_data: Dictionary) -> void:
	if card_data.is_empty():
		return

	_current_data = {"type": "card", "data": card_data}

	set_title(card_data.get("name", ""))
	set_type(Types.get_card_type_name(card_data.get("type", Types.CardType.EMPTY_HAND)))

	# 构建描述
	var desc: String = card_data.get("description", "")
	if desc.is_empty():
		# 构建简短描述
		var parts: Array[String] = []
		if card_data.get("damage", 0) > 0:
			parts.append("伤害 %d" % card_data.get("damage", 0))
		if card_data.get("shield", 0) > 0:
			parts.append("护盾 %d" % card_data.get("shield", 0))
		if card_data.get("heal", 0) > 0:
			parts.append("治疗 %d" % card_data.get("heal", 0))
		desc = " | ".join(parts) if not parts.is_empty() else "无效果"
	set_description(desc)

	# 清空并添加详情
	clear_details()

	# 轻功消耗
	add_detail("轻功消耗", str(card_data.get("agility_cost", 1)), Color(0.8, 1.0, 0.8))

	# 伤害
	if card_data.get("damage", 0) > 0:
		add_detail("伤害", str(card_data.get("damage", 0)), Color(1.0, 0.4, 0.4))

	# 护盾
	if card_data.get("shield", 0) > 0:
		add_detail("护盾", str(card_data.get("shield", 0)), Color(0.4, 0.7, 1.0))

	# 治疗
	if card_data.get("heal", 0) > 0:
		add_detail("治疗", str(card_data.get("heal", 0)), Color(0.4, 1.0, 0.4))


## 从技能数据设置
func setup_from_skill(skill_data: Dictionary) -> void:
	if skill_data.is_empty():
		return

	_current_data = {"type": "skill", "data": skill_data}

	set_title(skill_data.get("name", ""))
	set_type(skill_data.get("type", ""))
	set_description(skill_data.get("description", ""))

	clear_details()

	# 轻功消耗
	var agility_cost = skill_data.get("agility_cost", 0)
	if agility_cost > 0:
		add_detail("轻功消耗", str(agility_cost), Color(0.8, 1.0, 0.8))

	# 内力消耗
	var mp_cost = skill_data.get("mp_cost", 0)
	if mp_cost > 0:
		add_detail("内力消耗", str(mp_cost), Color(0.6, 0.8, 1.0))

	# 冷却
	var cooldown = skill_data.get("cooldown", 0)
	if cooldown > 0:
		add_detail("冷却", str(cooldown) + "回合", Color(0.9, 0.9, 0.7))


## 从状态效果数据设置
func setup_from_effect(effect_data: Dictionary) -> void:
	if effect_data.is_empty():
		return

	_current_data = {"type": "effect", "data": effect_data}

	set_title(effect_data.get("name", ""))
	set_type(effect_data.get("type", "状态效果"))
	set_description(effect_data.get("description", ""))

	clear_details()

	# 持续时间
	var duration = effect_data.get("duration", 0)
	if duration > 0:
		add_detail("剩余回合", str(duration), Color(0.9, 0.9, 0.7))

	# 层数
	var stacks = effect_data.get("stacks", 0)
	if stacks > 0:
		add_detail("层数", str(stacks), Color(1.0, 0.9, 0.7))


## 请求显示（开始延迟计时）
func request_show() -> void:
	_waiting_to_hide = false
	_hide_timer = 0.0

	if not visible:
		_waiting_to_show = true
		_show_timer = 0.0


## 请求隐藏（开始延迟计时）
func request_hide() -> void:
	_waiting_to_show = false
	_show_timer = 0.0

	if visible:
		_waiting_to_hide = true
		_hide_timer = 0.0


## 立即显示
func show_immediately() -> void:
	_waiting_to_show = false
	_waiting_to_hide = false
	_do_show()


## 立即隐藏
func hide_immediately() -> void:
	_waiting_to_show = false
	_waiting_to_hide = false
	_do_hide()


# ==================== 内部方法 ====================
## 执行显示
func _do_show() -> void:
	visible = true
	is_showing = true
	_update_position()
	shown.emit()


## 执行隐藏
func _do_hide() -> void:
	visible = false
	is_showing = false
	_current_data.clear()
	tooltip_hidden.emit()


## 更新位置（跟随鼠标并检测边界）
func _update_position() -> void:
	var mouse_pos := get_global_mouse_position()
	var viewport_size := get_viewport().get_visible_rect().size

	# 计算提示框大小
	var tooltip_size := get_combined_minimum_size()
	tooltip_size = tooltip_size.max(custom_minimum_size)

	# 计算位置
	var target_pos := mouse_pos + Vector2(margin, margin)

	# 右边界检测
	if target_pos.x + tooltip_size.x > viewport_size.x:
		target_pos.x = mouse_pos.x - tooltip_size.x - margin

	# 下边界检测
	if target_pos.y + tooltip_size.y > viewport_size.y:
		target_pos.y = mouse_pos.y - tooltip_size.y - margin

	# 确保不超出左边界和上边界
	target_pos.x = max(0, target_pos.x)
	target_pos.y = max(0, target_pos.y)

	global_position = target_pos
