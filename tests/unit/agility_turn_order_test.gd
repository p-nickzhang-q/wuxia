## agility_turn_order_test.gd - 轻功行动顺序单元测试
## 验证 Story 004 所有验收标准

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


# ==================== AC-1: _decide_turn_order 按轻功排序 ====================

func test_ac1_decide_turn_order_by_agility() -> void:
	game_state.start_battle()

	# 验证行动顺序
	var order := game_state.get_turn_order()

	assert_eq(order.size(), 2, "应有 2 个角色")
	assert_eq(order[0], game_state.player, "player 轻功高应先行动")
	assert_eq(order[1], game_state.enemy, "enemy 轻功低应后行动")


func test_ac1_decide_turn_order_equal_agility() -> void:
	# 创建轻功相同的角色
	var player_data := {"id": "p1", "hp": 10, "mp": 5, "agility": 5, "deck": [], "martialArts": [], "passives": []}
	var enemy_data := {"id": "e1", "hp": 10, "mp": 5, "agility": 5, "deck": [], "martialArts": [], "passives": []}

	var state_result := GameState.create(player_data, enemy_data)
	var state: GameState = state_result.state
	state.start_battle()

	var order: Array = state.get_turn_order()

	assert_eq(order.size(), 2, "应有 2 个角色")
	# 轻功相同时，player 先（座位顺序）
	assert_eq(order[0], state.player, "轻功相同时 player 先行动")


func test_ac1_decide_turn_order_enemy_higher() -> void:
	# 创建敌人轻功更高的角色
	var player_data := {"id": "p1", "hp": 10, "mp": 5, "agility": 3, "deck": [], "martialArts": [], "passives": []}
	var enemy_data := {"id": "e1", "hp": 10, "mp": 5, "agility": 7, "deck": [], "martialArts": [], "passives": []}

	var state_result := GameState.create(player_data, enemy_data)
	var state: GameState = state_result.state
	state.start_battle()

	var order: Array = state.get_turn_order()

	assert_eq(order.size(), 2, "应有 2 个角色")
	assert_eq(order[0], state.enemy, "enemy 轻功高应先行动")


# ==================== AC-2: should_switch_actor 判断切换 ====================

func test_ac2_should_switch_actor_when_lower() -> void:
	game_state.start_battle()

	# 设置 player 轻功低于 enemy
	game_state.player["agility"] = 3
	game_state.enemy["agility"] = 5
	game_state.current_actor = game_state.player

	var should_switch := game_state.should_switch_actor()

	assert_true(should_switch, "player.agility <= enemy.agility 时应切换")


func test_ac2_should_switch_actor_when_equal() -> void:
	game_state.start_battle()

	# 设置双方轻功相等
	game_state.player["agility"] = 5
	game_state.enemy["agility"] = 5
	game_state.current_actor = game_state.player

	var should_switch := game_state.should_switch_actor()

	assert_true(should_switch, "轻功相等时也应切换")


func test_ac2_should_not_switch_when_higher() -> void:
	game_state.start_battle()

	# 设置 player 轻功高于 enemy
	game_state.player["agility"] = 8
	game_state.enemy["agility"] = 3
	game_state.current_actor = game_state.player

	var should_switch := game_state.should_switch_actor()

	assert_false(should_switch, "player.agility > enemy.agility 时不应切换")


# ==================== AC-3: switch_actor 切换到敌方 ====================

func test_ac3_switch_actor_to_enemy() -> void:
	game_state.start_battle()

	# 设置 player 为当前行动方
	game_state.current_actor = game_state.player

	# 使用 watch_signals 监视信号
	watch_signals(game_state)

	game_state.switch_actor()

	assert_signal_emitted(game_state, "actor_changed", "actor_changed 信号应发射")
	assert_eq(game_state.current_actor, game_state.enemy, "应切换到 enemy")


func test_ac3_switch_actor_no_other_alive() -> void:
	game_state.start_battle()

	# 设置 enemy 死亡
	game_state.enemy["hp"] = 0
	game_state.current_actor = game_state.player

	# 使用 watch_signals 监视信号
	watch_signals(game_state)

	game_state.switch_actor()

	assert_signal_not_emitted(game_state, "actor_changed", "只有一个存活角色时不应切换")


# ==================== AC-4: 轻功消耗后判断 ====================

func test_ac4_agility_consumption_triggers_switch() -> void:
	game_state.start_battle()

	# 初始状态：player.agility=8, enemy.agility=5
	assert_eq(game_state.current_actor, game_state.player, "player 应先行动")

	# 添加卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 6}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	# 使用消耗 6 轻功的卡牌
	var result := game_state.use_basic_card(0)

	assert_true(result.success, "卡牌使用应成功")
	assert_eq(game_state.player.get("agility", 0), 2, "player 轻功应为 2")
	# player.agility=2 < enemy.agility=5，应切换
	assert_eq(game_state.current_actor, game_state.enemy, "应切换到 enemy")


# ==================== AC-5: 回合结束条件 ====================

func test_ac5_turn_end_when_all_agility_depleted() -> void:
	game_state.start_battle()

	# 设置双方轻功为 0
	game_state.player["agility"] = 0
	game_state.enemy["agility"] = 0

	# 使用 watch_signals 监视信号
	watch_signals(game_state)

	# 尝试切换
	game_state._check_actor_switch()

	# 双方无轻功时应结束回合
	assert_signal_emitted(game_state, "turn_ended", "双方轻功耗尽时应结束回合")


func test_ac5_turn_continues_when_agility_available() -> void:
	game_state.start_battle()

	# 设置双方有轻功
	game_state.player["agility"] = 5
	game_state.enemy["agility"] = 3
	game_state.current_actor = game_state.player

	# 监听回合结束信号
	var turn_ended_received := false
	game_state.turn_ended.connect(func():
		turn_ended_received = true
	)

	# 检查切换
	game_state._check_actor_switch()

	# 有轻功时不应结束回合
	assert_false(turn_ended_received, "有轻功时不应结束回合")


# ==================== 行动顺序完整性测试 ====================

func test_full_turn_order_flow() -> void:
	game_state.start_battle()

	# 初始：player.agility=8, enemy.agility=5
	assert_eq(game_state.current_actor, game_state.player, "player 先行动")

	# player 使用消耗 4 轻功的卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 4}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]
	game_state.use_basic_card(0)

	# player.agility=4, enemy.agility=5 → 切换到 enemy
	assert_eq(game_state.current_actor, game_state.enemy, "切换到 enemy")

	# enemy 使用消耗 3 轻功的卡牌
	game_state.enemy["hand"] = [CardState.create(card_data, "e1")]
	game_state.use_basic_card(0)

	# enemy.agility=2, player.agility=4 → 切换回 player
	assert_eq(game_state.current_actor, game_state.player, "切换回 player")