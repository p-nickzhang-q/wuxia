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
## 战斗UI容器（旧版UI，逐步替换）
@onready var player_hp_bar: ProgressBar = $BattleUI/TopPanel/PlayerPanel/HPBar
@onready var player_mp_bar: ProgressBar = $BattleUI/TopPanel/PlayerPanel/MPBar
@onready var player_hp_label: Label = $BattleUI/TopPanel/PlayerPanel/HPLabel
@onready var player_mp_label: Label = $BattleUI/TopPanel/PlayerPanel/MPLabel
@onready var player_shield_label: Label = $BattleUI/TopPanel/PlayerPanel/ShieldLabel
@onready var player_agility_label: Label = $BattleUI/TopPanel/PlayerPanel/AgilityLabel

@onready var enemy_hp_bar: ProgressBar = $BattleUI/TopPanel/EnemyPanel/HPBar
@onready var enemy_mp_bar: ProgressBar = $BattleUI/TopPanel/EnemyPanel/MPBar
@onready var enemy_hp_label: Label = $BattleUI/TopPanel/EnemyPanel/HPLabel
@onready var enemy_mp_label: Label = $BattleUI/TopPanel/EnemyPanel/MPLabel
@onready var enemy_shield_label: Label = $BattleUI/TopPanel/EnemyPanel/ShieldLabel
@onready var enemy_agility_label: Label = $BattleUI/TopPanel/EnemyPanel/AgilityLabel

@onready var hand_container: HBoxContainer = $BattleUI/HandContainer
@onready var turn_label: Label = $BattleUI/TurnLabel
@onready var log_label: Label = $BattleUI/LogLabel
@onready var end_turn_button: Button = $BattleUI/EndTurnButton

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

	# 更新玩家面板
	var p: Character = battle_manager.player
	if p:
		player_hp_bar.max_value = p.max_hp
		player_hp_bar.value = p.current_hp
		player_hp_label.text = "HP: %d/%d" % [p.current_hp, p.max_hp]
		player_mp_bar.max_value = p.max_mp
		player_mp_bar.value = p.current_mp
		player_mp_label.text = "MP: %d/%d" % [p.current_mp, p.max_mp]
		player_shield_label.text = "护盾: %d" % p.shield
		player_agility_label.text = "轻功: %d" % p.current_agility

	# 更新敌人面板
	var e: Character = battle_manager.enemy
	if e:
		enemy_hp_bar.max_value = e.max_hp
		enemy_hp_bar.value = e.current_hp
		enemy_hp_label.text = "HP: %d/%d" % [e.current_hp, e.max_hp]
		enemy_mp_bar.max_value = e.max_mp
		enemy_mp_bar.value = e.current_mp
		enemy_mp_label.text = "MP: %d/%d" % [e.current_mp, e.max_mp]
		enemy_shield_label.text = "护盾: %d" % e.shield
		enemy_agility_label.text = "轻功: %d" % e.current_agility

	# 更新回合标签
	var actor_name: String = "玩家" if battle_manager.current_actor == battle_manager.player else "敌人"
	turn_label.text = "回合 %d - %s行动" % [battle_manager.current_turn, actor_name]


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
		var card_button := Button.new()
		card_button.text = "%s\n伤害:%d" % [card.name, card.damage]
		card_button.custom_minimum_size = Vector2(80, 100)

		# 检查是否可用（轻功足够）
		var is_playable: bool = card.agility_cost <= battle_manager.player.current_agility
		if not is_playable:
			card_button.modulate = Color(0.5, 0.5, 0.5)

		card_button.pressed.connect(_on_card_pressed.bind(i))
		hand_container.add_child(card_button)


## 添加日志
func _log(message: String) -> void:
	if log_label:
		log_label.text = message
	print("[Battle] %s" % message)


# ==================== 事件处理 ====================

## 卡牌点击处理
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
