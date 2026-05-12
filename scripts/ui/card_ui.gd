## card_ui.gd - 卡牌UI组件
## 显示单张卡牌的信息：名称、类型、效果、消耗等

class_name CardUI
extends Control

# ==================== 信号 ====================
## 点击信号
signal clicked(card: Card)
## 悬停信号
signal hovered(card: Card)
## 拖拽开始信号
signal drag_started(card: Card)
## 拖拽结束信号
signal drag_ended(card: Card)

# ==================== 高亮颜色常量 ====================
## 可选中的高亮颜色
const HIGHLIGHT_SELECTABLE: Color = Color(1.0, 1.0, 0.5, 0.3)
## 被选中的高亮颜色
const HIGHLIGHT_SELECTED: Color = Color(0.5, 1.0, 0.5, 0.5)
## 不可用的灰暗颜色
const HIGHLIGHT_DISABLED: Color = Color(0.3, 0.3, 0.3, 0.5)

# ==================== 卡牌类型颜色 ====================
const TYPE_COLORS: Dictionary = {
	Types.CardType.EMPTY_HAND: Color(0.8, 0.6, 0.4),    # 空手 - 棕色
	Types.CardType.SHORT_WEAPON: Color(0.6, 0.6, 0.8),  # 短兵 - 蓝灰色
	Types.CardType.LONG_WEAPON: Color(0.7, 0.5, 0.7),   # 长兵 - 紫色
	Types.CardType.LEG: Color(0.6, 0.8, 0.6),           # 腿法 - 绿色
	Types.CardType.ANY: Color(0.9, 0.9, 0.9)            # 任意 - 白色
}

# ==================== 导出属性 ====================
## 绑定的卡牌数据（使用无类型避免导出限制）
var card = null  # Card 类型，运行时赋值

# ==================== 子节点引用 ====================
## 卡牌背景
@onready var background: ColorRect = $Background
## 卡牌类型指示条
@onready var type_bar: ColorRect = $TypeBar
## 名称标签
@onready var name_label: Label = $NameLabel
## 类型标签
@onready var type_label: Label = $TypeLabel
## 效果描述标签
@onready var desc_label: Label = $DescLabel
## 轻功消耗标签
@onready var cost_label: Label = $CostLabel
## 伤害图标/标签
@onready var damage_label: Label = $DamageLabel
## 护盾图标/标签
@onready var shield_label: Label = $ShieldLabel
## 治疗图标/标签
@onready var heal_label: Label = $HealLabel

# ==================== 状态 ====================
## 是否可选中
var is_selectable: bool = true
## 是否被选中
var is_selected: bool = false
## 是否可用（轻功足够等）
var is_playable: bool = true
## 是否正在拖拽
var is_dragging: bool = false

# ==================== 内部变量 ====================
## 默认背景颜色
var _default_modulate: Color = Color.WHITE
## 拖拽偏移
var _drag_offset: Vector2 = Vector2.ZERO


func _ready() -> void:
	# 连接鼠标事件
	gui_input.connect(_on_gui_input)
	mouse_entered.connect(_on_mouse_entered)
	mouse_exited.connect(_on_mouse_exited)

	# 保存默认颜色
	_default_modulate = self_modulate

	# 如果已有卡牌，进行初始化
	if card:
		setup()


## 设置卡牌UI，绑定卡牌数据
func setup() -> void:
	if not card:
		return

	# 更新名称
	name_label.text = card.name

	# 更新类型
	type_label.text = Types.get_card_type_name(card.type)
	type_bar.color = TYPE_COLORS.get(card.type, Color.GRAY)

	# 更新效果描述
	desc_label.text = card.get_short_description()

	# 更新轻功消耗
	cost_label.text = str(card.agility_cost)

	# 更新伤害/护盾/治疗显示
	_update_effect_labels()

	# 更新高亮状态
	_update_highlight()


## 更新效果标签显示
func _update_effect_labels() -> void:
	# 伤害
	if card.damage > 0:
		damage_label.text = str(card.damage)
		damage_label.visible = true
	else:
		damage_label.visible = false

	# 护盾
	if card.shield > 0:
		shield_label.text = str(card.shield)
		shield_label.visible = true
	else:
		shield_label.visible = false

	# 治疗
	if card.heal > 0:
		heal_label.text = str(card.heal)
		heal_label.visible = true
	else:
		heal_label.visible = false


## 设置是否可选中
func set_selectable(value: bool) -> void:
	is_selectable = value
	_update_highlight()


## 设置是否被选中
func set_selected(value: bool) -> void:
	is_selected = value
	_update_highlight()


## 设置是否可用
func set_playable(value: bool) -> void:
	is_playable = value
	_update_highlight()


## 更新高亮状态
func _update_highlight() -> void:
	# 优先级：不可用 > 被选中 > 可选中
	if not is_playable:
		self_modulate = HIGHLIGHT_DISABLED
	elif is_selected:
		self_modulate = HIGHLIGHT_SELECTED
	elif is_selectable:
		self_modulate = HIGHLIGHT_SELECTABLE
	else:
		self_modulate = _default_modulate


## 刷新显示（外部调用以更新数据）
func refresh() -> void:
	if not card:
		return

	# 更新效果描述
	desc_label.text = card.get_short_description()

	# 更新效果标签
	_update_effect_labels()


# ==================== 事件处理 ====================
func _on_gui_input(event: InputEvent) -> void:
	if event is InputEventMouseButton:
		if event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			# 开始拖拽或点击
			if is_selectable and is_playable:
				is_dragging = true
				_drag_offset = get_local_mouse_position()
				drag_started.emit(card)
			clicked.emit(card)
		elif not event.pressed and event.button_index == MOUSE_BUTTON_LEFT:
			# 结束拖拽
			if is_dragging:
				is_dragging = false
				drag_ended.emit(card)


func _on_mouse_entered() -> void:
	hovered.emit(card)


func _on_mouse_exited() -> void:
	hovered.emit(null)


## 拖拽处理
func _process(delta: float) -> void:
	if is_dragging:
		# 跟随鼠标
		global_position = get_global_mouse_position() - _drag_offset
