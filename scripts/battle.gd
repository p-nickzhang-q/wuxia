## battle.gd - 战斗场景主控制器
## 协调 GameState、BattleUI、BattleInputHandler、BattleAnimator、BattleEffects
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
@onready var player_panel: CharacterPanel = $BattleUI/PlayerPanel
@onready var enemy_panel: CharacterPanel = $BattleUI/EnemyPanel

## 右侧容器
@onready var agility_axis: AgilityAxis = $BattleUI/RightContainer/AgilityAxis
@onready var battle_log: BattleLog = $BattleUI/RightContainer/BattleLog

## 底部栏
@onready var skill_container: HBoxContainer = $BattleUI/BottomBar/SkillContainer
@onready var hand_container: HBoxContainer = $BattleUI/BottomBar/HandContainer
@onready var end_turn_button: Button = $BattleUI/BottomBar/EndTurnButton

## 提示框
@onready var tooltip: Tooltip = $BattleUI/Tooltip

# ==================== 核心模块 ====================
## 游戏状态（数据层）
var game_state: GameState = null

## 战斗管理器（包装器，保持向后兼容）
var battle_manager: BattleManager = null

## 输入处理器
var input_handler: BattleInputHandler = null

## 动画器
var animator: BattleAnimator = null

## 视觉效果管理器
var effects: BattleEffects = null

# ==================== 内部状态 ====================
## 玩家角色引用
var _player: Character = null
## 敌人角色引用
var _enemy: Character = null
## 是否正在处理 AI 回合
var _is_ai_turn: bool = false
## UI 刷新计时器
var _ui_refresh_timer: float = 0.0


func _ready() -> void:
	# 连接结束回合按钮
	if end_turn_button:
		end_turn_button.pressed.connect(_on_end_turn_pressed)

	# 初始化模块
	_initialize_modules()

	# 开始战斗
	_start_battle()


## 初始化所有模块
func _initialize_modules() -> void:
	# 创建游戏状态
	game_state = GameState.new()

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

	# 创建战斗管理器（作为包装器）
	battle_manager = BattleManager.new()
	add_child(battle_manager)

	# 连接战斗管理器信号
	battle_manager.turn_changed.connect(_on_turn_changed)
	battle_manager.damage_dealt.connect(_on_damage_dealt)
	battle_manager.battle_ended.connect(_on_battle_ended)


## 开始战斗
func _start_battle() -> void:
	# 获取角色数据
	var player_data: Dictionary = GameManager.get_character_data(GameManager.player_character_id)
	var enemy_data: Dictionary = GameManager.get_character_data(GameManager.enemy_character_id)

	# 使用 BattleManager 初始化（保持向后兼容）
	battle_manager.start_battle(player_data, enemy_data)

	# 同步到 GameState
	_sync_game_state_from_battle_manager()

	# 初始化 UI
	_update_ui()
	_render_hand()

	_log("战斗开始！")


## 从 BattleManager 同步状态到 GameState
func _sync_game_state_from_battle_manager() -> void:
	game_state.clear_characters()

	_player = battle_manager.player
	_enemy = battle_manager.enemy

	if _player:
		game_state.add_character(_player)
	if _enemy:
		game_state.add_character(_enemy)

	# 同步回合数
	game_state.turn_number = battle_manager.current_turn

	# 同步当前行动者
	if battle_manager.current_actor == _player:
		game_state.current_actor_index = 0
	elif battle_manager.current_actor == _enemy:
		game_state.current_actor_index = 1


func _process(delta: float) -> void:
	# 轮询刷新 UI（因为 GameState 没有信号）
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

	var current_actor: Character = game_state.get_current_actor()
	if current_actor == null:
		return

	# 如果当前行动者是敌人，触发 AI
	if current_actor == _enemy and not _enemy.is_dead():
		_is_ai_turn = true
		_execute_ai_turn()


## 执行 AI 回合
func _execute_ai_turn() -> void:
	# 等待一小段时间让玩家看到状态变化
	await get_tree().create_timer(AI_DECISION_DELAY).timeout

	if battle_manager.enemy == null or battle_manager.enemy.is_dead():
		_is_ai_turn = false
		return

	# 使用 BattleManager 的 AI 系统执行回合
	if battle_manager.ai:
		await battle_manager.ai.execute_turn()

	# 同步状态
	_sync_game_state_from_battle_manager()

	# 刷新 UI
	_update_ui()
	_render_hand()

	_is_ai_turn = false


# ==================== UI 更新方法 ====================

## 更新 UI 显示
func _update_ui() -> void:
	if battle_manager == null:
		return

	# 更新回合标签
	var actor_name: String = "玩家" if battle_manager.current_actor == battle_manager.player else "敌人"
	if turn_label:
		turn_label.text = "第 %d 回合" % battle_manager.current_turn
	if actor_label:
		actor_label.text = "行动: %s" % actor_name

	# 更新角色面板
	if player_panel and battle_manager.player:
		player_panel.character = battle_manager.player
		player_panel.setup()
	if enemy_panel and battle_manager.enemy:
		enemy_panel.character = battle_manager.enemy
		enemy_panel.setup()

	# 更新轻功轴
	if agility_axis:
		_update_agility_axis()

	# 更新武功按钮
	_render_skills()


## 更新轻功轴
func _update_agility_axis() -> void:
	if agility_axis == null or battle_manager == null:
		return

	var character_ids: Array[String] = []
	if battle_manager.player:
		character_ids.append(battle_manager.player.id)
	if battle_manager.enemy:
		character_ids.append(battle_manager.enemy.id)

	agility_axis.setup(character_ids, _get_character_data_for_axis)


## 获取角色数据用于轻功轴
func _get_character_data_for_axis(char_id: String) -> Dictionary:
	if battle_manager == null:
		return {}

	if battle_manager.player and battle_manager.player.id == char_id:
		var p = battle_manager.player
		return {
			"name": p.name,
			"current_agility": p.current_agility,
			"base_agility": p.base_agility,
			"is_player": true,
			"is_current_actor": battle_manager.current_actor == p
		}
	elif battle_manager.enemy and battle_manager.enemy.id == char_id:
		var e = battle_manager.enemy
		return {
			"name": e.name,
			"current_agility": e.current_agility,
			"base_agility": e.base_agility,
			"is_player": false,
			"is_current_actor": battle_manager.current_actor == e
		}

	return {}


## 渲染武功按钮
func _render_skills() -> void:
	if skill_container == null or battle_manager == null:
		return

	# 清空武功容器
	for child in skill_container.get_children():
		child.queue_free()

	# 渲染玩家的武功
	var skills: Array[Skill] = battle_manager.player.skills
	for i in range(skills.size()):
		var skill: Skill = skills[i]
		# 使用 SkillButton 组件
		var skill_button_scene := preload("res://scenes/components/skill_button.tscn")
		var skill_button: SkillButton = skill_button_scene.instantiate()
		skill_button.skill = skill

		# 先添加到场景树，让 @onready 变量初始化
		skill_container.add_child(skill_button)

		# 然后设置和更新状态
		skill_button.setup()
		skill_button.set_state(
			battle_manager.player.current_mp,
			battle_manager.player.current_agility,
			battle_manager.player.hand
		)

		skill_button.skill_pressed.connect(_on_skill_pressed)


## 渲染手牌
func _render_hand() -> void:
	if hand_container == null or battle_manager == null:
		return

	# 清空手牌容器
	for child in hand_container.get_children():
		child.queue_free()

	# 渲染手牌
	var hand: Array[Card] = battle_manager.player.hand
	for i in range(hand.size()):
		var card: Card = hand[i]
		# 使用 CardUI 组件
		var card_ui_scene := preload("res://scenes/components/card.tscn")
		var card_ui: CardUI = card_ui_scene.instantiate()
		card_ui.card = card

		# 先添加到场景树，让 @onready 变量初始化
		hand_container.add_child(card_ui)

		# 然后设置和更新状态
		card_ui.setup()

		# 检查是否可用（轻功足够）
		var is_playable: bool = card.agility_cost <= battle_manager.player.current_agility
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
func _on_card_ui_clicked(card: Card) -> void:
	# 检查是否是玩家回合
	if battle_manager.current_actor != battle_manager.player:
		_log("现在不是你的回合!")
		return

	# 检查是否正在处理 AI
	if _is_ai_turn:
		return

	# 找到卡牌在手牌中的索引
	var card_index: int = -1
	for i in range(battle_manager.player.hand.size()):
		if battle_manager.player.hand[i].instance_id == card.instance_id:
			card_index = i
			break

	if card_index < 0:
		_log("卡牌未找到!")
		return

	# 使用输入处理器处理
	input_handler.handle_card_click(card_index)


## 卡牌点击处理（旧版，保留向后兼容）
func _on_card_pressed(card_index: int) -> void:
	# 检查是否是玩家回合
	if battle_manager.current_actor != battle_manager.player:
		_log("现在不是你的回合!")
		return

	# 检查是否正在处理 AI
	if _is_ai_turn:
		return

	# 使用输入处理器处理
	input_handler.handle_card_click(card_index)


## 结束回合按钮处理
func _on_end_turn_pressed() -> void:
	if battle_manager.current_actor != battle_manager.player:
		return

	if _is_ai_turn:
		return

	# 使用输入处理器处理
	input_handler.handle_end_turn()


## 行动请求处理（来自输入处理器）
func _on_action_requested(action: Dictionary) -> void:
	var action_type: String = action.get("type", "")

	match action_type:
		"play_card":
			_execute_play_card(action.get("card_index", -1), action.get("target", null))
		"use_skill":
			_execute_use_skill(action.get("skill_index", -1), action.get("card_index", -1), action.get("target", null))
		"end_turn":
			_execute_end_turn()


## 执行打出卡牌
func _execute_play_card(card_index: int, target) -> void:
	if card_index < 0:
		return

	var result: Dictionary = battle_manager.play_card(card_index)
	if result.success:
		_log("打出卡牌: %s" % result.card_id)
		_update_ui()
		_render_hand()
	else:
		_log("无法出牌: %s" % result.reason)


## 执行使用武功
func _execute_use_skill(skill_index: int, card_index: int, target) -> void:
	if skill_index < 0 or card_index < 0:
		return

	var skill: Skill = battle_manager.current_actor.skills[skill_index]
	if skill == null:
		return

	var result: Dictionary = battle_manager.use_skill(skill.skill_id, card_index)
	if result.success:
		_log("使用武功: %s" % skill.name)
		_update_ui()
		_render_hand()
	else:
		_log("无法使用武功: %s" % result.reason)


## 执行结束回合
func _execute_end_turn() -> void:
	battle_manager.end_turn()
	_sync_game_state_from_battle_manager()
	_update_ui()
	_render_hand()


## 目标选择开始处理
func _on_target_selection_started(targets: Array) -> void:
	# 高亮可选目标
	_log("请选择目标...")


## 目标选择完成处理
func _on_target_selected(target) -> void:
	_log("已选择目标")


## 输入状态改变处理
func _on_input_state_changed(new_state: int) -> void:
	# 可以在这里更新 UI 提示
	pass


## 武功按钮点击处理
func _on_skill_pressed(skill: Skill, button: SkillButton) -> void:
	# 检查是否是玩家回合
	if battle_manager.current_actor != battle_manager.player:
		_log("现在不是你的回合!")
		return

	# 检查是否正在处理 AI
	if _is_ai_turn:
		return

	# 找到武功在列表中的索引
	var skill_index: int = -1
	for i in range(battle_manager.player.skills.size()):
		if battle_manager.player.skills[i].skill_id == skill.skill_id:
			skill_index = i
			break

	if skill_index < 0:
		_log("武功未找到!")
		return

	# 使用输入处理器处理
	input_handler.handle_skill_click(skill_index)


## 回合改变处理（来自 BattleManager）
func _on_turn_changed(actor_id: String) -> void:
	var actor_name: String = "玩家" if actor_id == battle_manager.player.id else "敌人"
	_log("轮到 %s 行动" % actor_name)

	# 同步状态
	_sync_game_state_from_battle_manager()


## 伤害处理（来自 BattleManager）
func _on_damage_dealt(target: Character, amount: int) -> void:
	_log("%s 受到 %d 点伤害" % [target.name, amount])

	# 播放伤害动画
	if animator:
		animator.play_damage_animation(target, amount)


## 战斗结束处理（来自 BattleManager）
func _on_battle_ended(winner: Character, loser: Character) -> void:
	_log("%s 获胜!" % winner.name)

	# 播放战斗结束动画
	if animator:
		animator.play_battle_end_animation(winner, loser)

	# 延迟切换到结果场景
	await get_tree().create_timer(2.0).timeout
	GameManager.change_state(GameManager.GameScene.RESULT)


## 动画开始处理
func _on_animation_started(animation_type: String, data: Dictionary) -> void:
	# 可以在这里触发视觉效果
	pass


## 动画完成处理
func _on_animation_completed(animation_type: String, data: Dictionary) -> void:
	# 通知动画器处理下一个动画
	if animator:
		animator.on_animation_finished()
