## battle.gd - 战斗场景主控制器
## 协调 GameState、BattleUI
## 实现设计文档: 战斗场景架构

extends Control

# ==================== 导出配置 ====================
## AI 决策延迟（秒）
const AI_DECISION_DELAY: float = 0.8
## 动画刷新间隔（秒）
const UI_REFRESH_INTERVAL: float = 0.1

# ==================== 子节点引用 ====================
## 战斗UI容器
@onready var battle_ui: Control = $BattleUI

## 顶部栏
@onready var turn_label: Label = $BattleUI/TopBar/TurnLabel
@onready var actor_label: Label = $BattleUI/TopBar/ActorLabel

## 角色面板
@onready var player_panel: CharacterPanel = $BattleUI/MainArea/BattleField/PlayerTeam/PlayerPanel
@onready var enemy_panel: CharacterPanel = $BattleUI/MainArea/BattleField/EnemyTeam/EnemyPanel

## 右侧边栏
@onready var agility_axis: AgilityAxis = $BattleUI/MainArea/Sidebar/AgilityAxis
@onready var battle_log: BattleLog = $BattleUI/MainArea/Sidebar/BattleLog

## 底部栏（新布局：HandRow + SkillRow）
@onready var skill_container: HBoxContainer = $BattleUI/BottomBar/SkillRow/SkillContainer
@onready var hand_container: HBoxContainer = $BattleUI/BottomBar/HandRow/HandArea/HandContainer
@onready var end_turn_button: Button = $BattleUI/BottomBar/HandRow/EndTurnButton

## 提示框
@onready var tooltip: Tooltip = $BattleUI/Tooltip

# ==================== 核心模块 ====================
## 游戏状态（数据层）
var game_state: GameState = null

## UI管理器
var ui_manager: BattleUIManager = null

## 输入处理器
var input_handler: BattleInputHandler = null

## 动画器
var animator: BattleAnimator = null

# ==================== 内部状态 ====================
## 是否正在处理 AI 回合
var _is_ai_turn: bool = false
## UI 刷新计时器
var _ui_refresh_timer: float = 0.0


func _ready() -> void:
	# 连接结束回合按钮
	if end_turn_button:
		end_turn_button.pressed.connect(_on_end_turn_pressed)

	# 连接角色面板点击信号
	if player_panel:
		player_panel.clicked.connect(_on_character_panel_clicked)
	if enemy_panel:
		enemy_panel.clicked.connect(_on_character_panel_clicked)

	# 初始化模块
	_initialize_modules()

	# 开始战斗
	_start_battle()


## 初始化所有模块
func _initialize_modules() -> void:
	# 创建输入处理器
	input_handler = BattleInputHandler.new()
	input_handler.setup(game_state)
	input_handler.action_requested.connect(_on_action_requested)
	input_handler.target_selection_started.connect(_on_target_selection_started)
	input_handler.target_selected.connect(_on_target_selected)
	input_handler.state_changed.connect(_on_input_state_changed)

	# 创建动画器
	animator = BattleAnimator.new()
	animator.setup()
	animator.animation_started.connect(_on_animation_started)
	animator.animation_completed.connect(_on_animation_completed)

	# 创建UI管理器
	ui_manager = BattleUIManager.new()
	ui_manager.setup(game_state, battle_ui, input_handler, animator)
	ui_manager.action_confirmed.connect(_on_ui_action_confirmed)
	ui_manager.action_cancelled.connect(_on_ui_action_cancelled)


## 开始战斗
func _start_battle() -> void:
	# 如果没有选择角色，使用默认角色
	if GameManager.player_character_id.is_empty():
		GameManager.player_character_id = "qiaofeng"
	if GameManager.enemy_character_id.is_empty():
		GameManager.enemy_character_id = "duanyu"

	# 获取角色数据
	var player_data: Dictionary = GameManager.get_character_data(GameManager.player_character_id)
	var enemy_data: Dictionary = GameManager.get_character_data(GameManager.enemy_character_id)

	# 创建游戏状态
	var state_result := GameState.create(player_data, enemy_data)
	game_state = state_result.state

	# 连接游戏状态信号
	_connect_game_state_signals()

	# 更新输入处理器引用
	if input_handler:
		input_handler.game_state = game_state

	# 开始战斗
	game_state.start_battle()

	# 初始化 UI
	_update_ui()
	_render_skills()
	_render_hand()

	_log("战斗开始！")


## 连接游戏状态信号
func _connect_game_state_signals() -> void:
	game_state.turn_started.connect(_on_turn_started)
	game_state.turn_ended.connect(_on_turn_ended)
	game_state.actor_changed.connect(_on_actor_changed)
	game_state.card_played.connect(_on_card_played)
	game_state.skill_used.connect(_on_skill_used)
	game_state.damage_dealt.connect(_on_damage_dealt)
	game_state.shield_gained.connect(_on_shield_gained)
	game_state.character_healed.connect(_on_character_healed)
	game_state.passive_triggered.connect(_on_passive_triggered)
	game_state.game_ended.connect(_on_game_ended)
	game_state.log_message.connect(_on_log_message)


func _process(delta: float) -> void:
	# 轮询刷新 UI
	_ui_refresh_timer += delta
	if _ui_refresh_timer >= UI_REFRESH_INTERVAL:
		_ui_refresh_timer = 0.0
		_poll_and_refresh()


## 轮询刷新 UI
func _poll_and_refresh() -> void:
	if game_state == null:
		return

	# 检查状态变化并刷新
	_update_ui()

	# 检查是否需要触发 AI
	_check_ai_turn()


## 检查是否轮到 AI 行动
func _check_ai_turn() -> void:
	if _is_ai_turn:
		return

	if game_state == null or game_state.current_actor.is_empty():
		return

	# 如果当前行动者是敌人，触发 AI
	if game_state.current_actor == game_state.enemy and not CharacterState.is_dead(game_state.enemy):
		_is_ai_turn = true
		_execute_ai_turn()


## 执行 AI 回合
func _execute_ai_turn() -> void:
	# 等待一小段时间让玩家看到状态变化
	await get_tree().create_timer(AI_DECISION_DELAY).timeout

	if game_state == null or game_state.enemy.is_empty() or CharacterState.is_dead(game_state.enemy):
		_is_ai_turn = false
		return

	# 使用静态 AI 系统执行回合
	await AI.execute_turn(game_state, AI.AIDifficulty.NORMAL)

	# 刷新 UI
	_update_ui()
	_render_hand()

	_is_ai_turn = false


# ==================== UI 更新方法 ====================

## 更新 UI 显示
func _update_ui() -> void:
	if game_state == null:
		return

	# 更新回合标签
	var actor_name: String = game_state.get_current_actor_name()
	if turn_label:
		turn_label.text = "第 %d 回合" % game_state.turn_number
	if actor_label:
		actor_label.text = "行动: %s" % actor_name

	# 更新角色面板
	if player_panel and not game_state.player.is_empty():
		player_panel.character = game_state.player
		player_panel.setup()
	if enemy_panel and not game_state.enemy.is_empty():
		enemy_panel.character = game_state.enemy
		enemy_panel.setup()

	# 更新轻功轴
	if agility_axis:
		_update_agility_axis()

	# 注意：不在这里调用 _render_skills() 和 _render_hand()
	# 它们应该只在需要时被调用（如回合开始、打出卡牌后）


## 更新轻功轴
func _update_agility_axis() -> void:
	if agility_axis == null or game_state == null:
		return

	var character_ids: Array[String] = []
	if not game_state.player.is_empty():
		var player_id: String = game_state.player.get("id", "")
		if not player_id.is_empty():
			character_ids.append(player_id)
	if not game_state.enemy.is_empty():
		var enemy_id: String = game_state.enemy.get("id", "")
		if not enemy_id.is_empty():
			character_ids.append(enemy_id)

	agility_axis.setup(character_ids, _get_character_data_for_axis)


## 获取角色数据用于轻功轴
func _get_character_data_for_axis(char_id: String) -> Dictionary:
	if game_state == null:
		return {}

	if not game_state.player.is_empty():
		var player_id: String = game_state.player.get("id", "")
		if player_id == char_id:
			var p = game_state.player
			return {
				"name": p.get("name", ""),
				"current_agility": p.get("agility", 0),
				"base_agility": p.get("base_agility", 10),
				"is_player": true,
				"is_current_actor": game_state.current_actor == p
			}

	if not game_state.enemy.is_empty():
		var enemy_id: String = game_state.enemy.get("id", "")
		if enemy_id == char_id:
			var e = game_state.enemy
			return {
				"name": e.get("name", ""),
				"current_agility": e.get("agility", 0),
				"base_agility": e.get("base_agility", 10),
				"is_player": false,
				"is_current_actor": game_state.current_actor == e
			}

	return {}


## 渲染武功按钮
func _render_skills() -> void:
	if skill_container == null or game_state == null:
		return

	# 清空武功容器（使用 free() 立即删除）
	for child in skill_container.get_children():
		child.get_parent().remove_child(child)
		child.free()

	# 渲染玩家的武功
	var skills: Array = game_state.player.get("skills", [])
	var mp: int = game_state.player.get("mp", 0)
	var agility: int = game_state.player.get("agility", 0)
	var hand: Array = game_state.player.get("hand", [])

	for i in range(skills.size()):
		var skill: SkillState = skills[i]
		# 使用 SkillButton 组件
		var skill_button_scene := preload("res://scenes/components/skill_button.tscn")
		var skill_button: SkillButton = skill_button_scene.instantiate()
		skill_button.skill = skill

		# 先添加到场景树，让 @onready 变量初始化
		skill_container.add_child(skill_button)

		# 然后设置和更新状态
		skill_button.setup()
		skill_button.set_state(mp, agility, hand)

		skill_button.skill_pressed.connect(_on_skill_pressed)


## 渲染手牌
func _render_hand() -> void:
	if hand_container == null or game_state == null:
		return

	# 清空手牌容器（使用 free() 立即删除）
	for child in hand_container.get_children():
		child.get_parent().remove_child(child)
		child.free()

	# 渲染手牌
	var hand: Array = game_state.player.get("hand", [])
	var agility: int = game_state.player.get("agility", 0)

	for i in range(hand.size()):
		var card: CardState = hand[i]
		# 使用 CardUI 组件
		var card_ui_scene := preload("res://scenes/components/card.tscn")
		var card_ui: CardUI = card_ui_scene.instantiate()
		card_ui.card = card

		# 先添加到场景树，让 @onready 变量初始化
		hand_container.add_child(card_ui)

		# 然后设置和更新状态
		card_ui.setup()

		# 检查是否可用（轻功足够）
		var is_playable: bool = card.agility_cost <= agility
		card_ui.set_playable(is_playable)

		# 连接点击信号
		card_ui.clicked.connect(_on_card_ui_clicked)


## 添加日志
func _log(message: String) -> void:
	if battle_log:
		battle_log.add_message(message)
	print("[Battle] %s" % message)


# ==================== 事件处理 ====================

## 卡牌UI点击处理
func _on_card_ui_clicked(card: CardState) -> void:
	# 检查是否是玩家回合
	if game_state.current_actor != game_state.player:
		_log("现在不是你的回合!")
		return

	# 检查是否正在处理 AI
	if _is_ai_turn:
		return

	# 找到卡牌在手牌中的索引
	var hand: Array = game_state.player.get("hand", [])
	var card_index: int = -1
	for i in range(hand.size()):
		var hand_card: CardState = hand[i]
		if hand_card.instance_id == card.instance_id:
			card_index = i
			break

	if card_index < 0:
		_log("卡牌未找到!")
		return

	# 使用输入处理器处理
	if input_handler:
		input_handler.handle_card_click(card_index)


## 结束回合按钮处理
func _on_end_turn_pressed() -> void:
	if game_state == null or game_state.current_actor != game_state.player:
		return

	if _is_ai_turn:
		return

	# 使用输入处理器处理
	if input_handler:
		input_handler.handle_end_turn()


## 角色面板点击处理
func _on_character_panel_clicked(character: Dictionary) -> void:
	if game_state == null or input_handler == null:
		return

	# 检查是否在选择目标状态
	if not input_handler.is_selecting_target():
		return

	# 获取有效目标列表
	var targets: Array = input_handler.valid_targets
	if targets.is_empty():
		return

	# 找到点击的角色在目标列表中的索引
	var target_index: int = -1
	for i in range(targets.size()):
		if targets[i] == character:
			target_index = i
			break

	if target_index < 0:
		_log("无效的目标!")
		return

	# 使用输入处理器处理目标点击
	input_handler.handle_target_click(target_index)


## 行动请求处理（来自输入处理器）
func _on_action_requested(action: Dictionary) -> void:
	var action_type: String = action.get("type", "")

	match action_type:
		"play_card":
			_execute_play_card(action.get("card_index", -1))
		"use_skill":
			_execute_use_skill(action.get("skill_index", -1), action.get("card_index", -1))
		"end_turn":
			_execute_end_turn()


## 执行打出卡牌
func _execute_play_card(card_index: int) -> void:
	if card_index < 0 or game_state == null:
		return

	var result: Dictionary = game_state.use_basic_card(card_index)
	if result.success:
		_log("打出卡牌: %s" % result.card.card_id)
		_update_ui()
		_render_hand()
	else:
		_log("无法出牌: %s" % result.get("error", "未知错误"))


## 执行使用武功
func _execute_use_skill(skill_index: int, card_index: int) -> void:
	if skill_index < 0 or card_index < 0 or game_state == null:
		return

	var result: Dictionary = game_state.use_skill(skill_index, card_index)
	if result.success:
		_log("使用武功: %s" % result.skill.name)
		_update_ui()
		_render_hand()
	else:
		_log("无法使用武功: %s" % result.get("error", "未知错误"))


## 执行结束回合
func _execute_end_turn() -> void:
	if game_state == null:
		return

	game_state.pass_turn()
	_update_ui()
	_render_hand()


## 目标选择开始处理
func _on_target_selection_started(targets: Array) -> void:
	_log("请选择目标...")

	# 更新角色面板的高亮状态
	if player_panel:
		var is_targetable: bool = game_state.player in targets
		player_panel.set_targetable(is_targetable)
	if enemy_panel:
		var is_targetable: bool = game_state.enemy in targets
		enemy_panel.set_targetable(is_targetable)


## 目标选择完成处理
func _on_target_selected(target) -> void:
	_log("已选择目标")

	# 清除角色面板的高亮状态
	if player_panel:
		player_panel.set_targetable(false)
	if enemy_panel:
		enemy_panel.set_targetable(false)


## 输入状态改变处理
func _on_input_state_changed(new_state: int) -> void:
	# 如果退出目标选择状态，清除高亮
	if new_state != BattleInputHandler.InputState.SELECTING_TARGET:
		if player_panel:
			player_panel.set_targetable(false)
		if enemy_panel:
			enemy_panel.set_targetable(false)


## 武功按钮点击处理
func _on_skill_pressed(skill: SkillState, button: SkillButton) -> void:
	# 检查是否是玩家回合
	if game_state == null or game_state.current_actor != game_state.player:
		_log("现在不是你的回合!")
		return

	# 检查是否正在处理 AI
	if _is_ai_turn:
		return

	# 找到武功在列表中的索引
	var skills: Array = game_state.player.get("skills", [])
	var skill_index: int = -1
	for i in range(skills.size()):
		var s: SkillState = skills[i]
		if s.skill_id == skill.skill_id:
			skill_index = i
			break

	if skill_index < 0:
		_log("武功未找到!")
		return

	# 使用输入处理器处理
	if input_handler:
		input_handler.handle_skill_click(skill_index)


# ==================== 游戏状态信号处理 ====================

## 回合开始处理
func _on_turn_started(turn_num: int) -> void:
	_log("第 %d 回合开始" % turn_num)
	_update_ui()
	_render_skills()
	_render_hand()


## 回合结束处理
func _on_turn_ended() -> void:
	_log("回合结束")


## 行动方改变处理
func _on_actor_changed(actor: Dictionary) -> void:
	var actor_name: String = "玩家" if actor == game_state.player else "敌人"
	_log("轮到 %s 行动" % actor_name)
	_update_ui()


## 卡牌打出处理
func _on_card_played(character: Dictionary, card: CardState) -> void:
	var char_name: String = character.get("name", "未知")
	_log("%s 打出 %s" % [char_name, card.name])


## 武功使用处理
func _on_skill_used(character: Dictionary, skill: SkillState) -> void:
	var char_name: String = character.get("name", "未知")
	_log("%s 使用 %s" % [char_name, skill.name])


## 伤害处理
func _on_damage_dealt(target: Dictionary, amount: int, source: Dictionary) -> void:
	var target_name: String = target.get("name", "未知")
	_log("%s 受到 %d 点伤害" % [target_name, amount])

	# 播放伤害动画
	if animator:
		animator.play_damage_animation(target, amount)


## 护盾获得处理
func _on_shield_gained(character: Dictionary, amount: int) -> void:
	var char_name: String = character.get("name", "未知")
	_log("%s 获得 %d 点护盾" % [char_name, amount])


## 角色治疗处理
func _on_character_healed(character: Dictionary, amount: int) -> void:
	var char_name: String = character.get("name", "未知")
	_log("%s 恢复 %d 点生命" % [char_name, amount])


## 内功触发处理
func _on_passive_triggered(character: Dictionary, passive: PassiveState, result: Dictionary) -> void:
	var char_name: String = character.get("name", "未知")
	_log("%s 的 %s 触发" % [char_name, passive.name])


## 游戏结束处理
func _on_game_ended(winner: Dictionary, loser: Dictionary) -> void:
	var winner_name: String = winner.get("name", "未知")
	_log("%s 获胜!" % winner_name)

	# 播放战斗结束动画
	if animator:
		animator.play_battle_end_animation(winner, loser)

	# 延迟切换到结果场景
	await get_tree().create_timer(2.0).timeout
	GameManager.change_state(GameManager.GameScene.RESULT)


## 日志消息处理
func _on_log_message(text: String) -> void:
	_log(text)


## 动画开始处理
func _on_animation_started(animation_type: String, data: Dictionary) -> void:
	# 可以在这里触发视觉效果
	pass


## 动画完成处理
func _on_animation_completed(animation_type: String, data: Dictionary) -> void:
	# 通知动画器处理下一个动画
	if animator:
		animator.on_animation_finished()


## UI行动确认处理
func _on_ui_action_confirmed(card_index: int, skill_index: int, target_id: String) -> void:
	if skill_index >= 0 and card_index >= 0:
		_execute_use_skill(skill_index, card_index)
	elif card_index >= 0:
		_execute_play_card(card_index)


## UI行动取消处理
func _on_ui_action_cancelled() -> void:
	_log("取消选择")
