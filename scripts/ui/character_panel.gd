## character_panel.gd - 角色面板组件
## 显示角色的详细信息：立绘、名称、HP/MP条、护盾、轻功、武功标签

class_name CharacterPanel
extends Control

# ==================== 信号 ====================
## 点击信号
signal clicked(character)
## 悬停信号
signal hovered(character)

# ==================== 高亮颜色常量 ====================
## 可作为目标的高亮颜色
const HIGHLIGHT_TARGETABLE: Color = Color(1.0, 1.0, 0.5, 0.3)
## 被选为目标的高亮颜色
const HIGHLIGHT_TARGETED: Color = Color(1.0, 0.5, 0.5, 0.5)
## 当前行动者的高亮颜色
const HIGHLIGHT_ACTOR: Color = Color(0.5, 1.0, 0.5, 0.4)

# ==================== 导出属性 ====================
## 绑定的角色（Dictionary）
var character: Dictionary = {}

# ==================== 子节点引用 ====================
## 立绘容器
@onready var portrait: Control = $Portrait
## 名称标签
@onready var name_label: Label = $NameLabel
## 称号标签
@onready var title_label: Label = $TitleLabel
## HP进度条
@onready var hp_bar: ProgressBar = $HPBar
## HP文本标签
@onready var hp_label: Label = $HPBar/HPLabel
## MP进度条
@onready var mp_bar: ProgressBar = $MPBar
## MP文本标签
@onready var mp_label: Label = $MPBar/MPLabel
## 护盾标签
@onready var shield_label: Label = $ShieldLabel
## 轻功标签
@onready var agility_label: Label = $AgilityLabel
## 武功标签容器
@onready var skill_tags: HBoxContainer = $SkillTags

# ==================== 状态 ====================
## 是否可作为目标
var is_targetable: bool = false
## 是否被选为目标
var is_targeted: bool = false
## 是否为当前行动者
var is_current_actor: bool = false

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
	if not character.is_empty():
		setup()


## 设置面板，绑定角色数据
func setup() -> void:
	if character.is_empty():
		return

	# 更新名称和称号
	name_label.text = character.get("name", "未知")
	title_label.text = character.get("title", "")

	# 更新HP条
	var max_hp: int = character.get("max_hp", 60)
	var hp: int = character.get("hp", 0)
	hp_bar.max_value = max_hp
	hp_bar.value = hp
	hp_label.text = "%d / %d" % [hp, max_hp]

	# 更新MP条
	var max_mp: int = character.get("max_mp", 20)
	var mp: int = character.get("mp", 0)
	mp_bar.max_value = max_mp
	mp_bar.value = mp
	mp_label.text = "%d / %d" % [mp, max_mp]

	# 更新护盾
	var shield: int = character.get("shield", 0)
	if shield > 0:
		shield_label.text = "护盾: %d" % shield
		shield_label.visible = true
	else:
		shield_label.visible = false

	# 更新轻功
	var agility: int = character.get("agility", 0)
	var base_agility: int = character.get("base_agility", 10)
	agility_label.text = "轻功: %d / %d" % [agility, base_agility]

	# 更新武功标签
	_update_skill_tags()

	# 更新高亮状态
	_update_highlight()


## 更新武功标签
func _update_skill_tags() -> void:
	# 清除现有标签
	for child in skill_tags.get_children():
		child.queue_free()

	# 为每个武功创建标签
	var skills: Array = character.get("skills", [])
	for skill in skills:
		if skill is SkillState:
			var tag := Label.new()
			tag.text = skill.name
			tag.add_theme_font_size_override("font_size", 12)

			# 根据武功等级设置颜色
			match skill.level:
				Types.SkillLevel.BEGINNER:
					tag.add_theme_color_override("font_color", Color.GRAY)
				Types.SkillLevel.INTERMEDIATE:
					tag.add_theme_color_override("font_color", Color.WHITE)
				Types.SkillLevel.ADVANCED:
					tag.add_theme_color_override("font_color", Color.CYAN)
				Types.SkillLevel.MASTER:
					tag.add_theme_color_override("font_color", Color.GOLD)

			skill_tags.add_child(tag)


## 设置是否可作为目标
func set_targetable(value: bool) -> void:
	is_targetable = value
	_update_highlight()


## 设置是否被选为目标
func set_targeted(value: bool) -> void:
	is_targeted = value
	_update_highlight()


## 设置是否为当前行动者
func set_current_actor(value: bool) -> void:
	is_current_actor = value
	_update_highlight()


## 更新高亮状态
func _update_highlight() -> void:
	# 优先级：当前行动者 > 被选为目标 > 可作为目标
	if is_current_actor:
		self_modulate = HIGHLIGHT_ACTOR
	elif is_targeted:
		self_modulate = HIGHLIGHT_TARGETED
	elif is_targetable:
		self_modulate = HIGHLIGHT_TARGETABLE
	else:
		self_modulate = _default_modulate


## 刷新显示（外部调用以更新数据）
func refresh() -> void:
	if character.is_empty():
		return

	# 更新HP条
	var max_hp: int = character.get("max_hp", 60)
	var hp: int = character.get("hp", 0)
	hp_bar.max_value = max_hp
	hp_bar.value = hp
	hp_label.text = "%d / %d" % [hp, max_hp]

	# 更新MP条
	var max_mp: int = character.get("max_mp", 20)
	var mp: int = character.get("mp", 0)
	mp_bar.max_value = max_mp
	mp_bar.value = mp
	mp_label.text = "%d / %d" % [mp, max_mp]

	# 更新护盾
	var shield: int = character.get("shield", 0)
	if shield > 0:
		shield_label.text = "护盾: %d" % shield
		shield_label.visible = true
	else:
		shield_label.visible = false

	# 更新轻功
	var agility: int = character.get("agility", 0)
	var base_agility: int = character.get("base_agility", 10)
	agility_label.text = "轻功: %d / %d" % [agility, base_agility]


# ==================== 事件处理 ====================
func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			clicked.emit(character)


func _on_mouse_entered() -> void:
	hovered.emit(character)


func _on_mouse_exited() -> void:
	hovered.emit({})