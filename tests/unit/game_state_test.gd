## game_state_test.gd - GameState 单元测试
## 验证 Story 002 所有验收标准

extends GutTest

var game_state: GameState


func before_each() -> void:
	# 创建测试角色数据
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


# ==================== AC-1: GameState 信号声明 ====================

func test_ac1_signals_declared() -> void:
	# 验证信号存在
	assert_not_null(game_state.turn_started, "turn_started 信号应存在")
	assert_not_null(game_state.turn_ended, "turn_ended 信号应存在")
	assert_not_null(game_state.actor_changed, "actor_changed 信号应存在")
	assert_not_null(game_state.card_played, "card_played 信号应存在")
	assert_not_null(game_state.skill_used, "skill_used 信号应存在")
	assert_not_null(game_state.damage_dealt, "damage_dealt 信号应存在")
	assert_not_null(game_state.game_ended, "game_ended 信号应存在")


# ==================== AC-2: start_battle 初始化角色 ====================

func test_ac2_start_battle_initializes_characters() -> void:
	game_state.start_battle()

	assert_eq(game_state.player.get("id", ""), "hero", "player.id 应为 'hero'")
	assert_eq(game_state.enemy.get("id", ""), "enemy", "enemy.id 应为 'enemy'")
	assert_eq(game_state.turn_number, 1, "turn_number 应为 1")


func test_ac2_start_battle_empty_data() -> void:
	var empty_state_result := GameState.create({}, {})
	var empty_state: GameState = empty_state_result.state

	empty_state.start_battle()

	assert_not_null(empty_state.player, "player 应存在（即使数据为空）")
	assert_not_null(empty_state.enemy, "enemy 应存在（即使数据为空）")


# ==================== AC-3: get_turn_order 按轻功排序 ====================

func test_ac3_get_turn_order_by_agility() -> void:
	game_state.start_battle()

	var order := game_state.get_turn_order()

	assert_eq(order.size(), 2, "应有 2 个角色")
	assert_eq(order[0], game_state.player, "player 轻功高应先行动")
	assert_eq(order[1], game_state.enemy, "enemy 轻功低应后行动")


func test_ac3_get_turn_order_equal_agility() -> void:
	# 创建轻功相同的角色
	var player_data := {"id": "p1", "hp": 10, "mp": 5, "agility": 5, "deck": [], "martialArts": [], "passives": []}
	var enemy_data := {"id": "e1", "hp": 10, "mp": 5, "agility": 5, "deck": [], "martialArts": [], "passives": []}

	var state_result := GameState.create(player_data, enemy_data)
	var state: GameState = state_result.state
	state.start_battle()

	var order: Array = state.get_turn_order()

	assert_eq(order.size(), 2, "应有 2 个角色")


# ==================== AC-4: get_current_actor 返回当前行动角色 ====================

func test_ac4_get_current_actor() -> void:
	game_state.start_battle()

	var actor := game_state.get_current_actor()

	assert_not_null(actor, "应返回当前行动角色")
	assert_eq(actor, game_state.player, "player 轻功高应先行动")


# ==================== 场景集成测试 ====================

func test_game_state_can_be_created() -> void:
	var player_data := {"id": "test", "hp": 10, "mp": 5, "agility": 5, "deck": [], "martialArts": [], "passives": []}
	var enemy_data := {"id": "test2", "hp": 10, "mp": 5, "agility": 5, "deck": [], "martialArts": [], "passives": []}

	var state_result := GameState.create(player_data, enemy_data)
	var state: GameState = state_result.state

	assert_not_null(state, "GameState 应成功创建")
	assert_not_null(state.player, "player 应存在")
	assert_not_null(state.enemy, "enemy 应存在")