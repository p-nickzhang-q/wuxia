## agility_axis.gd - 轻功轴组件
## 竖向显示所有角色的轻功值和行动顺序
## 设计文档: 60×280 px，竖向轴

class_name AgilityAxis
extends Control

# ==================== 信号 ====================
## 点击角色标记信号
signal character_marker_clicked(character_id: String)

# ==================== 常量 ====================
## 轴宽度
const AXIS_WIDTH: int = 60
## 轴高度
const AXIS_HEIGHT: int = 280
## 标记直径
const MARKER_DIAMETER: int = 16
## 标记间距
const MARKER_SPACING: int = 8
## 刻度标签宽度
const LABEL_WIDTH: int = 40

## 背景颜色
const BG_COLOR: Color = Color(0.1, 0.1, 0.12, 0.9)
## 轴线颜色
const AXIS_COLOR: Color = Color(0.4, 0.4, 0.45, 1.0)
## 玩家标记颜色
const PLAYER_COLOR: Color = Color(0.3, 0.7, 0.4, 1.0)
## 敌人标记颜色
const ENEMY_COLOR: Color = Color(0.7, 0.3, 0.3, 1.0)
## 当前行动者边框颜色
const ACTOR_BORDER_COLOR: Color = Color(1.0, 0.85, 0.3, 1.0)

# ==================== 导出属性 ====================
## 最大轻功值
@export var max_agility: int = 50

# ==================== 子节点引用 ====================
## 标题标签
@onready var _title_label: Label = $TitleLabel
## 标记容器
@onready var _marker_container: VBoxContainer = $MarkerContainer

# ==================== 状态 ====================
## 角色数据列表 [{id, name, is_player, current_agility, base_agility, is_current_actor}]
var _characters: Array = []
## 角色标记字典 {character_id: Control}
var _markers: Dictionary = {}
## 当前行动者ID
var _current_actor_id: String = ""


func _ready() -> void:
	custom_minimum_size = Vector2(AXIS_WIDTH, AXIS_HEIGHT)
	_setup_ui()


func _setup_ui() -> void:
	if _title_label:
		_title_label.text = "轻功"


## 设置组件
func setup(character_ids: Array[String], get_character_data: Callable) -> void:
	_characters.clear()

	for char_id in character_ids:
		var data: Dictionary = get_character_data.call(char_id)
		if data.is_empty():
			continue

		_characters.append({
			"id": char_id,
			"name": data.get("name", "未知"),
			"is_player": data.get("is_player", false),
			"current_agility": data.get("current_agility", 0),
			"base_agility": data.get("base_agility", 10),
			"is_current_actor": char_id == _current_actor_id
		})

	_rebuild_markers()


## 刷新显示
func refresh(get_character_data: Callable) -> void:
	for i in range(_characters.size()):
		var char_data: Dictionary = _characters[i]
		var data: Dictionary = get_character_data.call(char_data.id)
		if not data.is_empty():
			char_data.current_agility = data.get("current_agility", 0)
			char_data.is_current_actor = char_data.id == _current_actor_id

	_update_markers()


## 设置当前行动者
func set_current_actor(actor_id: String) -> void:
	_current_actor_id = actor_id

	for char_data in _characters:
		char_data.is_current_actor = char_data.id == actor_id

	_update_markers()


## 设置最大轻功值
func set_max_agility(value: int) -> void:
	max_agility = value
	_update_markers()


## 重建所有标记
func _rebuild_markers() -> void:
	# 清除现有标记
	for child in _marker_container.get_children():
		child.queue_free()
	_markers.clear()

	# 按轻功值排序（从高到低）
	var sorted_chars: Array = _characters.duplicate()
	sorted_chars.sort_custom(func(a, b): return a.current_agility > b.current_agility)

	# 计算最大轻功值
	var max_val: int = max_agility
	for char_data in sorted_chars:
		max_val = max(max_val, char_data.current_agility)
	max_agility = max_val

	# 创建标记
	for char_data in sorted_chars:
		var marker := _create_marker(char_data)
		_marker_container.add_child(marker)
		_markers[char_data.id] = marker


## 创建单个标记
func _create_marker(char_data: Dictionary) -> Control:
	var container := HBoxContainer.new()
	container.custom_minimum_size = Vector2(AXIS_WIDTH, 40)
	container.alignment = BoxContainer.ALIGNMENT_CENTER

	# 左侧：角色名简称
	var name_label := Label.new()
	name_label.text = char_data.name.substr(0, 1) if char_data.name.length() > 0 else "?"
	name_label.add_theme_color_override("font_color", Color.WHITE)
	name_label.add_theme_font_size_override("font_size", 12)
	name_label.custom_minimum_size = Vector2(20, 0)
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	container.add_child(name_label)

	# 中间：圆点标记
	var marker_container := Control.new()
	marker_container.custom_minimum_size = Vector2(MARKER_DIAMETER + 4, MARKER_DIAMETER + 4)

	var circle := _create_circle(char_data.is_player, char_data.is_current_actor)
	circle.position = Vector2(2, 2)
	marker_container.add_child(circle)

	container.add_child(marker_container)

	# 右侧：轻功值
	var value_label := Label.new()
	value_label.text = str(char_data.current_agility)
	value_label.add_theme_color_override("font_color", Color.WHITE)
	value_label.add_theme_font_size_override("font_size", 12)
	value_label.custom_minimum_size = Vector2(24, 0)
	value_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_RIGHT
	container.add_child(value_label)

	# 存储引用
	container.set_meta("char_data", char_data)

	return container


## 创建圆形标记
func _create_circle(is_player: bool, is_current_actor: bool) -> Control:
	var circle := Control.new()
	circle.custom_minimum_size = Vector2(MARKER_DIAMETER, MARKER_DIAMETER)

	# 使用 StyleBoxFlat 绘制圆形
	var style := StyleBoxFlat.new()
	style.bg_color = PLAYER_COLOR if is_player else ENEMY_COLOR
	style.corner_radius_top_left = MARKER_DIAMETER / 2
	style.corner_radius_top_right = MARKER_DIAMETER / 2
	style.corner_radius_bottom_left = MARKER_DIAMETER / 2
	style.corner_radius_bottom_right = MARKER_DIAMETER / 2

	if is_current_actor:
		style.border_width_left = 2
		style.border_width_top = 2
		style.border_width_right = 2
		style.border_width_bottom = 2
		style.border_color = ACTOR_BORDER_COLOR

	circle.add_theme_stylebox_override("panel", style)

	return circle


## 更新所有标记
func _update_markers() -> void:
	# 重新排序
	var sorted_chars: Array = _characters.duplicate()
	sorted_chars.sort_custom(func(a, b): return a.current_agility > b.current_agility)

	# 更新标记位置和数值
	for i in range(sorted_chars.size()):
		var char_data: Dictionary = sorted_chars[i]
		var marker: Control = _markers.get(char_data.id)
		if marker:
			# 更新数值标签
			var children: Array = marker.get_children()
			if children.size() >= 3:
				var value_label: Label = children[2]
				value_label.text = str(char_data.current_agility)

			# 更新圆形样式
			if children.size() >= 2:
				var marker_container: Control = children[1]
				if marker_container.get_child_count() > 0:
					var circle: Control = marker_container.get_child(0)
					var style: StyleBoxFlat = circle.get_theme_stylebox("panel")
					if style:
						style.border_width_left = 2 if char_data.is_current_actor else 0
						style.border_width_top = 2 if char_data.is_current_actor else 0
						style.border_width_right = 2 if char_data.is_current_actor else 0
						style.border_width_bottom = 2 if char_data.is_current_actor else 0
						style.border_color = ACTOR_BORDER_COLOR
