## skill_button.gd - 技能按钮组件
## 显示武功招式信息，支持可用性检查和冷却显示

class_name SkillButton
extends Button

# ==================== 信号 ====================
## 点击信号，传递技能和按钮
signal skill_pressed(skill: Skill, button: SkillButton)
## 悬停信号，传递技能
signal skill_hovered(skill: Skill)

# ==================== 导出属性 ====================
## 绑定的武功（使用无类型避免导出限制）
var skill = null  # Skill 类型，运行时赋值

# ==================== 子节点引用 ====================
## 技能名称标签
@onready var name_label: Label = $NameLabel
## 消耗信息标签
@onready var cost_label: Label = $CostLabel
## 冷却覆盖层
@onready var cooldown_overlay: ColorRect = $CooldownOverlay
## 冷却文本标签
@onready var cooldown_label: Label = $CooldownOverlay/CooldownLabel

# ==================== 状态 ====================
## 当前内力
var current_mp: int = 0
## 当前轻功
var current_agility: int = 0
## 当前手牌
var hand: Array = []
## 是否禁用（外部控制）
var force_disabled: bool = false


func _ready() -> void:
	# 连接按钮信号
	pressed.connect(_on_pressed)
	mouse_entered.connect(_on_mouse_entered)

	# 如果已有技能，进行初始化
	if skill:
		setup()


## 设置按钮，绑定技能数据
func setup() -> void:
	if not skill:
		return

	# 更新名称
	name_label.text = skill.name

	# 更新消耗信息
	var cost_parts: Array[String] = []
	if skill.mp_cost > 0:
		cost_parts.append("内力:%d" % skill.mp_cost)
	if skill.agility_cost > 0:
		cost_parts.append("轻功:%d" % skill.agility_cost)
	cost_label.text = " | ".join(cost_parts) if not cost_parts.is_empty() else "无消耗"

	# 设置提示文本
	tooltip_text = skill.description

	# 更新可用性
	_update_availability()


## 设置当前状态（用于可用性检查）
func set_state(mp: int, agility: int, hand_cards: Array) -> void:
	current_mp = mp
	current_agility = agility
	hand = hand_cards
	_update_availability()


## 设置冷却显示
func set_cooldown() -> void:
	if not skill:
		cooldown_overlay.visible = false
		return

	if skill.current_cooldown > 0:
		cooldown_overlay.visible = true
		cooldown_label.text = "%d" % skill.current_cooldown
	else:
		cooldown_overlay.visible = false


## 更新可用性状态
func _update_availability() -> void:
	if not skill:
		disabled = true
		return

	# 检查是否强制禁用
	if force_disabled:
		disabled = true
		return

	# 使用技能的可用性检查
	var available: bool = skill.is_available(current_mp, current_agility, hand)
	disabled = not available

	# 同时更新冷却显示
	set_cooldown()


## 刷新显示（外部调用以更新数据）
func refresh() -> void:
	if not skill:
		return

	# 更新可用性
	_update_availability()


# ==================== 事件处理 ====================
func _on_pressed() -> void:
	skill_pressed.emit(skill, self)


func _on_mouse_entered() -> void:
	skill_hovered.emit(skill)
