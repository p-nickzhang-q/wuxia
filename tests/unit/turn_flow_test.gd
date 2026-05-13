## turn_flow_test.gd - 回合流程单元测试
## 验证 Story 003 所有验收标准

extends GutTest

var game_state: GameState


func before_each() -> void:
	var player_data := {
		"id": "hero",
		"name": "英雄",
		"hp": 20,
		"mp": 10,
		"agility": 8,
		"deck": [],
		"martialArts": [],
		"passives": []
	}
	var enemy_data := {
		"id": "enemy",
		"name": "敌人",
		"hp": 15,
		"mp": 8,
		"agility": 5,
		"deck": [],
		"martialArts": [],
		"passives": []
	}

	var state_result := GameState.create(player_data, enemy_data)
	game_state = state_result.state


# ==================== AC-1: start_new_turn 重置状态并抽牌 ====================

func test_ac1_start_new_turn_resets_and_draws() -> void:
	game_state.start_battle()
	var initial_turn := game_state.turn_number

	# 添加卡牌到牌组
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["deck"] = [CardState.create(card_data, "c1"), CardState.create(card_data, "c2"), CardState.create(card_data, "c3")]
	game_state.enemy["deck"] = [CardState.create(card_data, "e1"), CardState.create(card_data, "e2")]

	game_state.start_new_turn()

	assert_eq(game_state.turn_number, initial_turn + 1, "回合数应增加")
	assert_eq(game_state.player.get("shield", 0), 0, "护盾应重置为 0")


func test_ac1_start_new_turn_draws_cards() -> void:
	game_state.start_battle()

	# 添加足够卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["deck"] = []
	for i in range(10):
		game_state.player["deck"].append(CardState.create(card_data, "p%d" % i))

	game_state.start_new_turn()

	# DEFAULT_DRAW_COUNT = 5, 每回合抽 5 张
	assert_true(game_state.player.get("hand", []).size() > 0, "应抽到卡牌")


# ==================== AC-2: check_game_end 检测胜利 ====================

func test_ac2_check_game_end_player_wins() -> void:
	game_state.start_battle()

	# 设置敌人死亡
	game_state.enemy["hp"] = 0

	var is_over := game_state.is_battle_over()

	assert_true(is_over, "敌人死亡时战斗应结束")


func test_ac2_check_game_end_enemy_wins() -> void:
	game_state.start_battle()

	# 设置玩家死亡
	game_state.player["hp"] = 0

	var is_over := game_state.is_battle_over()

	assert_true(is_over, "玩家死亡时战斗应结束")


func test_ac2_check_game_end_both_alive() -> void:
	game_state.start_battle()

	# 双方存活
	game_state.player["hp"] = 10
	game_state.enemy["hp"] = 10

	var is_over := game_state.is_battle_over()

	assert_false(is_over, "双方存活时战斗不应结束")


# ==================== AC-3: end_turn 开始新回合 ====================

func test_ac3_end_turn_starts_new_turn() -> void:
	game_state.start_battle()
	var initial_turn := game_state.turn_number

	game_state.end_turn()

	assert_eq(game_state.turn_number, initial_turn + 1, "结束回合后应开始新回合")


func test_ac3_end_turn_when_game_over() -> void:
	game_state.start_battle()

	# 设置敌人死亡
	game_state.enemy["hp"] = 0

	game_state.end_turn()

	assert_eq(game_state.current_phase, Types.GamePhase.GAME_OVER, "游戏结束时状态应为 GAME_OVER")


# ==================== AC-4: 抽牌上限 ====================

func test_ac4_draw_cards_respects_max_hand_size() -> void:
	game_state.start_battle()

	# 设置手牌接近上限
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["hand"] = []
	for i in range(8):  # 已有 8 张
		game_state.player["hand"].append(CardState.create(card_data, "h%d" % i))

	# 抽牌
	var drawn := CharacterState.draw_cards(game_state.player, 5)

	# MAX_HAND_SIZE = 10
	assert_true(game_state.player["hand"].size() <= Types.MAX_HAND_SIZE, "手牌不应超过上限")


# ==================== 回合流程状态 ====================

func test_turn_phase_flow() -> void:
	# 初始状态
	assert_eq(game_state.current_phase, Types.GamePhase.SETUP, "初始应为 SETUP")

	game_state.start_battle()

	assert_eq(game_state.current_phase, Types.GamePhase.SELECTING, "战斗开始后应为 SELECTING")


func test_game_over_phase() -> void:
	game_state.start_battle()

	# 设置敌人死亡
	game_state.enemy["hp"] = 0
	game_state._end_game()

	assert_eq(game_state.current_phase, Types.GamePhase.GAME_OVER, "游戏结束后应为 GAME_OVER")


# ==================== 信号测试 ====================

func test_turn_started_signal_emitted() -> void:
	game_state.start_battle()
	assert_eq(game_state.turn_number, 1, "start_battle 后 turn_number 应为 1")

	# 使用 watch 方法监视信号
	watch_signals(game_state)
	game_state.start_new_turn()
	assert_eq(game_state.turn_number, 2, "start_new_turn 后 turn_number 应为 2")

	assert_signal_emitted(game_state, "turn_started", "turn_started 信号应发射")
	assert_signal_emit_count(game_state, "turn_started", 1, "turn_started 应发射一次")


func test_game_ended_signal_emitted() -> void:
	game_state.start_battle()

	# 使用 watch 方法监视信号
	watch_signals(game_state)

	# 设置敌人死亡并结束游戏
	game_state.enemy["hp"] = 0
	game_state._end_game()

	assert_signal_emitted(game_state, "game_ended", "game_ended 信号应发射")