## agility_axis.gd - 轻功轴组件
## 显示所有角色的轻功值对比，用于行动顺序可视化

class_name AgilityAxis
extends Control

# ==================== 信号 ====================
## 点击角色标记信号
signal character_marker_clicked(character_id: String)

# ==================== 常量 ====================
## 条形图背景颜色
const BAR_BG_COLOR: Color = Color(0.2, 0.2, 0.2, 0.8)
## 玩家条形图颜色
const PLAYER_BAR_COLOR: Color = Color(0.3, 0.7, 0.4, 1.0)
## 敌人条形图颜色
const ENEMY_BAR_COLOR: Color = Color(0.7, 0.3, 0.3, 1.0)
## 当前行动者边框颜色
const ACTOR_BORDER_COLOR: Color = Color(1.0, 0.9, 0.3, 1.0)
## 条形图高度
const BAR_HEIGHT: int = 24
## 条形图间距
const BAR_SPACING: int = 8
## 条形图圆角半径
const BAR_CORNER_RADIUS: int = 4

# ==================== 导出属性 ====================
## 最大轻功值（用于计算条形图宽度比例）
@export var max_agility: int = 20

# ==================== 内部类 ====================
## 轻功标记 - 每个角色的轻功显示单元
class AgilityMarker extends Control:
	## 绑定的角色ID
	var character_id: String = ""
	## 角色名称
	var character_name: String = ""
	## 是否为玩家角色
	var is_player: bool = false
	## 是否为当前行动者
	var is_current_actor: bool = false
	## 当前轻功值
	var current_agility: int = 0
	## 基础轻功值
	var base_agility: int = 0
	## 最大轻功值（用于计算比例）
	var max_agility_value: int = 20

	## 条形图背景
	var _bar_bg: ColorRect
	## 条形图填充
	var _bar_fill: ColorRect
	## 名称标签
	var _name_label: Label
	## 数值标签
	var _value_label: Label
	## 边框（当前行动者高亮）
	var _border: StyleBoxFlat

	## 点击信号
	signal clicked(id: String)

	func _ready() -> void:
		custom_minimum_size = Vector2(0, BAR_HEIGHT)
		_setup_ui()

	func _setup_ui() -> void:
		# 条形图背景
		_bar_bg = ColorRect.new()
		_bar_bg.color = BAR_BG_COLOR
		_bar_bg.set_anchors_preset(Control.PRESET_FULL_RECT)
		_bar_bg.size_flags_horizontal = Control.SIZE_EXPAND_FILL
		add_child(_bar_bg)

		# 条形图填充
		_bar_fill = ColorRect.new()
		_bar_fill.color = PLAYER_BAR_COLOR if is_player else ENEMY_BAR_COLOR
		_bar_fill.set_anchors_preset(Control.PRESET_LEFT_WIDE)
		add_child(_bar_fill)

		# 名称标签
		_name_label = Label.new()
		_name_label.set_anchors_preset(Control.PRESET_CENTER_LEFT)
		_name_label.offset_left = 8
		_name_label.theme_override_colors/font_color = Color.WHITE
		_name_label.theme_override_font_sizes/font_size = 14
		add_child(_name_label)

		# 数值标签
		_value_label = Label.new()
		_value_label.set_anchors_preset(Control.PRESET_CENTER_RIGHT)
		_value_label.offset_right = -8
		_value_label.theme_override_colors/font_color = Color.WHITE
		_value_label.theme_override_font_sizes/font_size = 14
		_value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
		add_child(_value_label)

		# 连接鼠标事件
		gui_input.connect(_on_gui_input)
		mouse_filter = MOUSE_FILTER_PASS

	func _on_gui_input(event: InputEvent) -> void:
		if event is InputEventMouseButton:
			if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
				clicked.emit(character_id)

	## 更新显示
	func update_display() -> void:
		# 更新名称
		_name_label.text = character_name

		# 更新数值
		_value_label.text = "%d / %d" % [current_agility, base_agility]

		# 更新条形图宽度
		var ratio: float = float(current_agility) / float(max_agility_value)
		ratio = clamp(ratio, 0.0, 1.0)
		_bar_fill.anchor_right = ratio

		# 更新颜色
		_bar_fill.color = PLAYER_BAR_COLOR if is_player else ENEMY_BAR_COLOR

		# 更新边框（当前行动者高亮）
		if is_current_actor:
			_bar_bg.color = ACTOR_BORDER_COLOR
		else:
			_bar_bg.color = BAR_BG_COLOR

	## 设置数据
	func setup(id: String, name: String, player: bool, current: int, base: int, max_val: int, is_actor: bool) -> void:
		character_id = id
		character_name = name
		is_player = player
		current_agility = current
		base_agility = base
		max_agility_value = max_val
		is_current_actor = is_actor

		if is_inside_tree():
			update_display()

# ==================== 子节点引用 ====================
## 标题标签
@onready var _title_label: Label = $TitleLabel
## 标记容器
@onready var _marker_container: VBoxContainer = $MarkerContainer

# ==================== 状态 ====================
## 角色标记字典 {character_id: AgilityMarker}
var _markers: Dictionary = {}
## 当前行动者ID
var _current_actor_id: String = ""

# ==================== 配置 ====================
## 标题文本
var _title_text: String = "轻功对比"


func _ready() -> void:
	_setup_ui()


func _setup_ui() -> void:
	# 设置标题
	if _title_label:
		_title_label.text = _title_text


## 设置组件，传入角色ID列表和角色数据获取函数
## character_ids: 角色ID数组
## get_character_data: 获取角色数据的函数，签名 func(id: String) -> Dictionary
func setup(character_ids: Array[String], get_character_data: Callable) -> void:
	# 清除现有标记
	_clear_markers()

	# 为每个角色创建标记
	for char_id in character_ids:
		var data: Dictionary = get_character_data.call(char_id)
		if data.is_empty():
			continue

		var marker := AgilityMarker.new()
		marker.setup(
			char_id,
			data.get("name", "未知"),
			data.get("is_player", false),
			data.get("current_agility", 0),
			data.get("base_agility", 10),
			max_agility,
			char_id == _current_actor_id
		)
		marker.clicked.connect(_on_marker_clicked)

		_marker_container.add_child(marker)
		_markers[char_id] = marker

	# 更新布局
	_update_layout()


## 刷新显示（更新轻功值和行动者状态）
## get_character_data: 获取角色数据的函数
func refresh(get_character_data: Callable) -> void:
	for char_id in _markers:
		var marker: AgilityMarker = _markers[char_id]
		var data: Dictionary = get_character_data.call(char_id)
		if data.is_empty():
			continue

		marker.current_agility = data.get("current_agility", 0)
		marker.is_current_actor = (char_id == _current_actor_id)
		marker.update_display()


## 设置当前行动者
func set_current_actor(actor_id: String) -> void:
	_current_actor_id = actor_id

	# 更新所有标记的高亮状态
	for char_id in _markers:
		var marker: AgilityMarker = _markers[char_id]
		marker.is_current_actor = (char_id == actor_id)
		marker.update_display()


## 设置最大轻功值
func set_max_agility(value: int) -> void:
	max_agility = value

	# 更新所有标记
	for marker: AgilityMarker in _markers.values():
		marker.max_agility_value = value
		marker.update_display()


## 清除所有标记
func _clear_markers() -> void:
	for child in _marker_container.get_children():
		child.queue_free()
	_markers.clear()


## 更新布局
func _update_layout() -> void:
	# 计算总高度
	var total_height: int = BAR_HEIGHT * _markers.size() + BAR_SPACING * max(0, _markers.size() - 1)
	custom_minimum_size.y = total_height


## 标记点击处理
func _on_marker_clicked(character_id: String) -> void:
	character_marker_clicked.emit(character_id)
