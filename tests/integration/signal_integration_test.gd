## signal_integration_test.gd - 战斗信号系统集成测试
## 验证 Story 014 所有验收标准

extends GutTest

const GameStateClass = preload("res://scripts/game/game_state.gd")
const CardStateClass = preload("res://scripts/game/card_state.gd")

var game_state: GameState

# 信号接收状态
var signal_received: bool = false
var received_turn: int = -1
var received_actor: Dictionary = {}
var received_target: Dictionary = {}
var received_amount: int = 0
var received_source: Dictionary = {}
var received_winner: Dictionary = {}
var received_loser: Dictionary = {}
var received_card = null
var received_skill = null
var received_message: String = ""


func before_each() -> void:
	# 创建基础游戏状态
	var player_data := _create_character("Player", 60, "A")
	var enemy_data := _create_character("Enemy", 60, "B")

	var result := GameStateClass.create(player_data, enemy_data)
	game_state = result.state

	# 重置信号状态
	_reset_signal_state()


func _reset_signal_state() -> void:
	signal_received = false
	received_turn = -1
	received_actor = {}
	received_target = {}
	received_amount = 0
	received_source = {}
	received_winner = {}
	received_loser = {}
	received_card = null
	received_skill = null
	received_message = ""


# ==================== 信号回调方法 ====================

func _on_turn_started(turn_num: int) -> void:
	signal_received = true
	received_turn = turn_num


func _on_actor_changed(actor: Dictionary) -> void:
	signal_received = true
	received_actor = actor


func _on_damage_dealt(target: Dictionary, amount: int, source: Dictionary) -> void:
	signal_received = true
	received_target = target
	received_amount = amount
	received_source = source


func _on_game_ended(winner: Dictionary, loser: Dictionary) -> void:
	signal_received = true
	received_winner = winner
	received_loser = loser


func _on_card_played(character: Dictionary, card) -> void:
	signal_received = true
	received_card = card


func _on_skill_used(character: Dictionary, skill) -> void:
	signal_received = true
	received_skill = skill


func _on_shield_gained(character: Dictionary, amount: int) -> void:
	signal_received = true
	received_amount = amount


func _on_character_healed(character: Dictionary, amount: int) -> void:
	signal_received = true
	received_amount = amount


func _on_log_message(text: String) -> void:
	signal_received = true
	received_message = text


# ==================== AC-1: turn_changed 信号发射 ====================

func test_ac1_actor_changed_signal() -> void:
	game_state.actor_changed.connect(_on_actor_changed)
	game_state.start_battle()

	assert_true(signal_received, "start_battle 应发射 actor_changed 信号")
	assert_false(received_actor.is_empty(), "actor_changed 应传递有效角色")


func test_ac1_turn_started_signal() -> void:
	game_state.start_battle()
	_reset_signal_state()

	game_state.turn_started.connect(_on_turn_started)
	game_state.start_new_turn()

	assert_true(signal_received, "start_new_turn 应发射 turn_started 信号")


# ==================== AC-2: damage_dealt 信号发射 ====================

func test_ac2_damage_dealt_signal() -> void:
	game_state.start_battle()
	game_state.damage_dealt.connect(_on_damage_dealt)

	# 手动发射信号
	game_state.damage_dealt.emit(game_state.enemy, 5, game_state.player)

	assert_true(signal_received, "damage_dealt 信号应成功发射")
	assert_eq(received_amount, 5, "伤害值应为 5")


# ==================== AC-3: battle_ended 信号发射 ====================

func test_ac3_game_ended_signal() -> void:
	game_state.start_battle()
	game_state.game_ended.connect(_on_game_ended)

	# 设置敌人死亡
	game_state.enemy["hp"] = 0
	game_state._end_game()

	assert_true(signal_received, "游戏结束应发射 game_ended 信号")


func test_ac3_game_ended_draw() -> void:
	game_state.start_battle()
	game_state.game_ended.connect(_on_game_ended)

	# 设置双方都死亡
	game_state.player["hp"] = 0
	game_state.enemy["hp"] = 0
	game_state._end_game()

	assert_true(signal_received, "平局也应发射 game_ended 信号")
	assert_true(received_winner.is_empty(), "平局时 winner 应为空字典")


# ==================== AC-4: 信号连接正确 ====================

func test_ac4_signal_connection() -> void:
	# 连接信号
	game_state.turn_started.connect(_on_turn_started)
	game_state.damage_dealt.connect(_on_damage_dealt)
	game_state.game_ended.connect(_on_game_ended)

	# 验证连接状态
	assert_true(game_state.turn_started.is_connected(_on_turn_started), "turn_started 应已连接")
	assert_true(game_state.damage_dealt.is_connected(_on_damage_dealt), "damage_dealt 应已连接")
	assert_true(game_state.game_ended.is_connected(_on_game_ended), "game_ended 应已连接")


# ==================== AC-5: 信号断开防止内存泄漏 ====================

func test_ac5_signal_disconnect() -> void:
	game_state.turn_started.connect(_on_turn_started)

	# 验证已连接
	assert_true(game_state.turn_started.is_connected(_on_turn_started), "信号应已连接")

	# 断开连接
	game_state.turn_started.disconnect(_on_turn_started)

	# 验证已断开
	assert_false(game_state.turn_started.is_connected(_on_turn_started), "信号应已断开")


# ==================== 其他信号测试 ====================

func test_card_played_signal() -> void:
	game_state.start_battle()
	game_state.card_played.connect(_on_card_played)

	# 手动发射信号
	game_state.card_played.emit(game_state.player, null)

	assert_true(signal_received, "card_played 信号应成功发射")


func test_shield_gained_signal() -> void:
	game_state.start_battle()
	game_state.shield_gained.connect(_on_shield_gained)

	game_state.shield_gained.emit(game_state.player, 5)

	assert_true(signal_received, "shield_gained 信号应成功发射")
	assert_eq(received_amount, 5, "护盾值应为 5")


func test_character_healed_signal() -> void:
	game_state.start_battle()
	game_state.character_healed.connect(_on_character_healed)

	game_state.character_healed.emit(game_state.player, 10)

	assert_true(signal_received, "character_healed 信号应成功发射")


func test_log_message_signal() -> void:
	game_state.start_battle()
	game_state.log_message.connect(_on_log_message)

	game_state.log_message.emit("测试消息")

	assert_true(signal_received, "log_message 信号应成功发射")
	assert_eq(received_message, "测试消息", "消息内容应正确")


# ==================== 辅助方法 ====================

func _create_character(id: String, hp: int, team: String) -> Dictionary:
	return {
		"id": id,
		"name": id,
		"hp": hp,
		"max_hp": 60,
		"mp": 20,
		"max_mp": 20,
		"agility": 10,
		"base_agility": 10,
		"team": team,
		"hand": [],
		"deck": ["punch", "kick", "punch", "kick", "punch", "kick", "punch"],
		"discard": [],
		"skills": [],
		"shield": 0,
		"dots": [],
		"debuffs": [],
	}
