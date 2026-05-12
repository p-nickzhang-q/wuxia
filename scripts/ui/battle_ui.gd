## battle_ui.gd - 战斗UI容器
## 组合所有UI组件，管理布局和交互

class_name BattleUI
extends Control

# ==================== 信号 ====================
## 卡牌点击信号
signal card_clicked(card: Card, card_ui: CardUI)
## 卡牌悬停信号
signal card_hovered(card: Card)
## 技能点击信号
signal skill_clicked(skill: Skill, button: SkillButton)
## 技能悬停信号
signal skill_hovered(skill: Skill)
## 结束回合按钮点击信号
signal end_turn_pressed()
## 角色面板点击信号
signal character_panel_clicked(character: Character)

# ==================== 导出属性 ====================
## 游戏状态引用（使用无类型避免导出限制）
var game_state = null  # GameState 类型，运行时赋值

# ==================== 子节点引用 ====================
## 顶部栏
@onready var top_bar: HBoxContainer = $TopBar
## 回合标签
@onready var turn_label: Label = $TopBar/TurnLabel
## 行动者标签
@onready var actor_label: Label = $TopBar/ActorLabel

## 玩家面板
@onready var player_panel: CharacterPanel = $PlayerPanel
## 敌人面板
@onready var enemy_panel: CharacterPanel = $EnemyPanel

## 右侧容器
@onready var right_container: VBoxContainer = $RightContainer
## 轻功轴
@onready var agility_axis: AgilityAxis = $RightContainer/AgilityAxis
## 战斗日志
@onready var battle_log: BattleLog = $RightContainer/BattleLog

## 底部栏
@onready var bottom_bar: VBoxContainer = $BottomBar
## 技能容器
@onready var skill_container: HBoxContainer = $BottomBar/SkillContainer
## 手牌容器
@onready var hand_container: HBoxContainer = $BottomBar/HandContainer
## 结束回合按钮
@onready var end_turn_button: Button = $BottomBar/EndTurnButton

## 提示框
@onready var tooltip: Tooltip = $Tooltip

# ==================== 组件引用字典 ====================
## 角色面板字典 {character_id: CharacterPanel}
var character_panels: Dictionary = {}
## 卡牌UI字典 {card_instance_id: CardUI}
var card_uis: Dictionary = {}
## 技能按钮字典 {skill_id: SkillButton}
var skill_buttons: Dictionary = {}

# ==================== 内部状态 ====================
## 当前玩家角色
var _player_character: Character = null
## 当前敌人角色
var _enemy_character: Character = null
## 当前选中的卡牌
var _selected_card: Card = null
## 当前选中的技能
var _selected_skill: Skill = null


func _ready() -> void:
	# 连接结束回合按钮
	if end_turn_button:
		end_turn_button.pressed.connect(_on_end_turn_pressed)

	# 初始化组件引用字典
	_initialize_component_dicts()


## 初始化组件引用字典
func _initialize_component_dicts() -> void:
	# 注册角色面板
	if player_panel and _player_character:
		character_panels[_player_character.id] = player_panel
	if enemy_panel and _enemy_character:
		character_panels[_enemy_character.id] = enemy_panel


## 设置UI，绑定游戏状态
func setup(gs: GameState) -> void:
	if not gs:
		push_warning("BattleUI: game_state is null")
		return

	game_state = gs

	# 获取玩家和敌人角色（约定：索引0为玩家，索引1为敌人）
	if gs.characters.size() >= 1:
		_player_character = gs.characters[0]
	if gs.characters.size() >= 2:
		_enemy_character = gs.characters[1]

	# 设置角色面板
	_setup_character_panels()

	# 设置轻功轴
	_setup_agility_axis()

	# 设置技能按钮
	_setup_skill_buttons()

	# 更新顶部栏
	_update_top_bar()

	# 初始化组件引用字典
	_initialize_component_dicts()


## 设置角色面板
func _setup_character_panels() -> void:
	# 设置玩家面板
	if player_panel and _player_character:
		player_panel.character = _player_character
		player_panel.setup()
		player_panel.clicked.connect(_on_character_panel_clicked)
		player_panel.hovered.connect(_on_character_panel_hovered)
		character_panels[_player_character.id] = player_panel

	# 设置敌人面板
	if enemy_panel and _enemy_character:
		enemy_panel.character = _enemy_character
		enemy_panel.setup()
		enemy_panel.clicked.connect(_on_character_panel_clicked)
		enemy_panel.hovered.connect(_on_character_panel_hovered)
		character_panels[_enemy_character.id] = enemy_panel


## 设置轻功轴
func _setup_agility_axis() -> void:
	if not agility_axis or not game_state:
		return

	# 收集角色ID
	var character_ids: Array[String] = []
	for character in game_state.characters:
		character_ids.append(character.id)

	# 设置轻功轴
	agility_axis.setup(character_ids, _get_character_data_callback)

	# 设置当前行动者
	var current_actor: Character = game_state.get_current_actor()
	if current_actor:
		agility_axis.set_current_actor(current_actor.id)


## 获取角色数据的回调函数
func _get_character_data_callback(character_id: String) -> Dictionary:
	if not game_state:
		return {}

	for character in game_state.characters:
		if character.id == character_id:
			return {
				"name": character.name,
				"is_player": character == _player_character,
				"current_agility": character.current_agility,
				"base_agility": character.base_agility
			}

	return {}


## 设置技能按钮
func _setup_skill_buttons() -> void:
	if not skill_container or not _player_character:
		return

	# 清除现有技能按钮
	for child in skill_container.get_children():
		child.queue_free()
	skill_buttons.clear()

	# 为每个武功创建按钮
	for skill in _player_character.skills:
		var button := _create_skill_button(skill)
		skill_container.add_child(button)
		skill_buttons[skill.skill_id] = button


## 创建技能按钮
func _create_skill_button(skill: Skill) -> SkillButton:
	var button_scene := preload("res://scenes/components/skill_button.tscn")
	var button: SkillButton = button_scene.instantiate()
	button.skill = skill
	button.setup()

	# 连接信号
	button.skill_pressed.connect(_on_skill_pressed)
	button.skill_hovered.connect(_on_skill_hovered)

	return button


## 更新顶部栏
func _update_top_bar() -> void:
	if not game_state:
		return

	# 更新回合数
	if turn_label:
		turn_label.text = "第 %d 回合" % game_state.turn_number

	# 更新当前行动者
	if actor_label:
		var current_actor: Character = game_state.get_current_actor()
		if current_actor:
			actor_label.text = "行动: %s" % current_actor.name
		else:
			actor_label.text = "行动: -"


## 更新手牌显示
func update_hand_display() -> void:
	if not hand_container or not _player_character:
		return

	# 清除现有卡牌UI
	for child in hand_container.get_children():
		child.queue_free()
	card_uis.clear()

	# 为每张手牌创建UI
	for i in range(_player_character.hand.size()):
		var card: Card = _player_character.hand[i]
		var card_ui := _create_card_ui(card, i)
		hand_container.add_child(card_ui)
		card_uis[card.get_instance_id()] = card_ui


## 创建卡牌UI
func _create_card_ui(card: Card, index: int) -> CardUI:
	var card_scene := preload("res://scenes/components/card.tscn")
	var card_ui: CardUI = card_scene.instantiate()
	card_ui.card = card
	card_ui.setup()

	# 检查是否可用（轻功足够）
	if _player_character:
		var is_playable := card.agility_cost <= _player_character.current_agility
		card_ui.set_playable(is_playable)

	# 连接信号
	card_ui.clicked.connect(_on_card_clicked)
	card_ui.hovered.connect(_on_card_hovered)

	return card_ui


## 更新技能按钮
func update_skill_buttons() -> void:
	if not _player_character:
		return

	for skill in _player_character.skills:
		var button: SkillButton = skill_buttons.get(skill.skill_id)
		if button:
			button.set_state(
				_player_character.current_mp,
				_player_character.current_agility,
				_player_character.hand
			)


## 刷新所有UI组件
func refresh() -> void:
	if not game_state:
		return

	# 刷新角色面板
	if player_panel:
		player_panel.refresh()
	if enemy_panel:
		enemy_panel.refresh()

	# 刷新轻功轴
	if agility_axis:
		agility_axis.refresh(_get_character_data_callback)
		var current_actor: Character = game_state.get_current_actor()
		if current_actor:
			agility_axis.set_current_actor(current_actor.id)

	# 刷新手牌显示
	update_hand_display()

	# 刷新技能按钮
	update_skill_buttons()

	# 更新顶部栏
	_update_top_bar()

	# 更新角色面板高亮状态
	_update_panel_highlights()


## 更新角色面板高亮状态
func _update_panel_highlights() -> void:
	if not game_state:
		return

	var current_actor: Character = game_state.get_current_actor()

	# 更新玩家面板
	if player_panel and _player_character:
		player_panel.set_current_actor(_player_character == current_actor)

	# 更新敌人面板
	if enemy_panel and _enemy_character:
		enemy_panel.set_current_actor(_enemy_character == current_actor)


## 获取角色面板
func get_panel(character_id: String) -> CharacterPanel:
	return character_panels.get(character_id)


## 获取卡牌UI
func get_card_ui(card_instance_id: int) -> CardUI:
	return card_uis.get(card_instance_id)


## 设置目标选择模式
func set_target_selection_mode(enabled: bool) -> void:
	# 设置敌人面板为可选中目标
	if enemy_panel:
		enemy_panel.set_targetable(enabled)

	# 设置玩家面板不可选中（不能以自己为目标）
	if player_panel:
		player_panel.set_targetable(false)


## 设置选中的卡牌
func set_selected_card(card: Card) -> void:
	_selected_card = card

	# 更新所有卡牌UI的选中状态
	for card_ui: CardUI in card_uis.values():
		card_ui.set_selected(card_ui.card == card)


## 设置选中的技能
func set_selected_skill(skill: Skill) -> void:
	_selected_skill = skill

	# 更新所有技能按钮的选中状态（可选实现）
	# 目前技能按钮没有选中状态，可以后续添加


## 显示提示框（卡牌）
func show_card_tooltip(card: Card) -> void:
	if tooltip and card:
		tooltip.setup_from_card(card)
		tooltip.request_show()


## 显示提示框（技能）
func show_skill_tooltip(skill: Skill) -> void:
	if tooltip and skill:
		var skill_data := {
			"name": skill.name,
			"type": "武功招式",
			"description": skill.description,
			"agility_cost": skill.agility_cost,
			"mp_cost": skill.mp_cost,
			"cooldown": skill.cooldown
		}
		tooltip.setup_from_skill(skill_data)
		tooltip.request_show()


## 隐藏提示框
func hide_tooltip() -> void:
	if tooltip:
		tooltip.request_hide()


## 添加战斗日志
func add_battle_log(text: String, color: Color = Color.WHITE) -> void:
	if battle_log:
		battle_log.add_message(text, color)


## 添加伤害日志
func add_damage_log(source: String, target: String, amount: int, damage_type: String = "") -> void:
	if battle_log:
		battle_log.add_damage_message(source, target, amount, damage_type)


## 添加治疗日志
func add_heal_log(target: String, amount: int, source: String = "") -> void:
	if battle_log:
		battle_log.add_heal_message(target, amount, source)


## 添加回合日志
func add_turn_log(turn_number: int, actor_name: String) -> void:
	if battle_log:
		battle_log.add_turn_message(turn_number, actor_name)


## 清空战斗日志
func clear_battle_log() -> void:
	if battle_log:
		battle_log.clear_log()


# ==================== 事件处理 ====================

func _on_end_turn_pressed() -> void:
	end_turn_pressed.emit()


func _on_card_clicked(card: Card) -> void:
	card_clicked.emit(card, get_card_ui(card.get_instance_id()))


func _on_card_hovered(card: Card) -> void:
	if card:
		show_card_tooltip(card)
		card_hovered.emit(card)
	else:
		hide_tooltip()


func _on_skill_pressed(skill: Skill, button: SkillButton) -> void:
	skill_clicked.emit(skill, button)


func _on_skill_hovered(skill: Skill) -> void:
	if skill:
		show_skill_tooltip(skill)
		skill_hovered.emit(skill)
	else:
		hide_tooltip()


func _on_character_panel_clicked(character: Character) -> void:
	character_panel_clicked.emit(character)


func _on_character_panel_hovered(character: Character) -> void:
	if character:
		# 可以显示角色详细信息
		pass
