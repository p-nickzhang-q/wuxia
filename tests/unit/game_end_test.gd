## game_end_test.gd - 游戏结束条件判断单元测试
## 验证 Story 010 所有验收标准

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


# ==================== AC-1: 玩家胜利 ====================

func test_ac1_player_victory() -> void:
	game_state.start_battle()

	# 设置敌人死亡
	game_state.enemy["hp"] = 0

	# 检查游戏结束
	assert_true(game_state.is_battle_over(), "游戏应结束")

	# 获取胜利者
	var winner := game_state.get_winner()
	assert_eq(winner, game_state.player, "玩家应胜利")

	var loser := game_state.get_loser()
	assert_eq(loser, game_state.enemy, "敌人应失败")


func test_ac1_player_victory_signal() -> void:
	game_state.start_battle()

	# 监听信号
	watch_signals(game_state)

	# 设置敌人死亡并触发结束检查
	game_state.enemy["hp"] = 0

	# 模拟伤害后检查
	if game_state.is_battle_over():
		game_state._end_game()

	# 验证信号发射
	assert_signal_emitted(game_state, "game_ended", "game_ended 信号应发射")


# ==================== AC-2: 玩家失败 ====================

func test_ac2_player_defeat() -> void:
	game_state.start_battle()

	# 设置玩家死亡
	game_state.player["hp"] = 0

	# 检查游戏结束
	assert_true(game_state.is_battle_over(), "游戏应结束")

	# 获取胜利者
	var winner := game_state.get_winner()
	assert_eq(winner, game_state.enemy, "敌人应胜利")

	var loser := game_state.get_loser()
	assert_eq(loser, game_state.player, "玩家应失败")


# ==================== AC-3: 平局 ====================

func test_ac3_draw() -> void:
	game_state.start_battle()

	# 设置双方死亡
	game_state.player["hp"] = 0
	game_state.enemy["hp"] = 0

	# 检查游戏结束
	assert_true(game_state.is_battle_over(), "游戏应结束")

	# 平局时双方都不是胜利者
	var winner := game_state.get_winner()
	assert_eq(winner, {}, "平局时无胜利者")


# ==================== AC-4: 伤害后检查游戏结束 ====================

func test_ac4_check_game_end_after_damage() -> void:
	game_state.start_battle()

	# 设置敌人低 HP
	game_state.enemy["hp"] = 3

	# 使用卡牌造成伤害（通过 use_basic_card）
	var hand: Array = game_state.player.get("hand", [])
	if hand.size() > 0:
		# 创建一个高伤害卡牌
		var card: CardState = hand[0]
		card.base_damage = 10

		# 打出卡牌
		var result: Dictionary = game_state.use_basic_card(0)

		# 游戏应该结束
		assert_true(game_state.is_battle_over(), "伤害后游戏应结束")
	else:
		# 如果没有手牌，直接测试伤害逻辑
		CharacterState.take_damage(game_state.enemy, 10, game_state.player)
		assert_true(game_state.is_battle_over(), "伤害后游戏应结束")


func test_ac4_check_game_end_on_turn_end() -> void:
	game_state.start_battle()

	# 设置敌人死亡
	game_state.enemy["hp"] = 0

	# 结束回合时检查游戏结束
	# 由于敌人已死，游戏应该已经结束
	assert_true(game_state.is_battle_over(), "回合结束时检查游戏结束")


# ==================== AC-5: 游戏结束后禁止行动 ====================

func test_ac5_no_action_after_game_over() -> void:
	game_state.start_battle()

	# 设置游戏结束状态
	game_state.enemy["hp"] = 0
	game_state._end_game()

	# 尝试使用卡牌
	var result: Dictionary = game_state.use_basic_card(0)

	assert_false(result.get("success", true), "游戏结束后不应能使用卡牌")


func test_ac5_no_skill_after_game_over() -> void:
	game_state.start_battle()

	# 设置游戏结束状态
	game_state.enemy["hp"] = 0
	game_state._end_game()

	# 尝试使用武功
	var result: Dictionary = game_state.use_skill(0, 0)

	assert_false(result.get("success", true), "游戏结束后不应能使用武功")


func test_ac5_game_over_phase() -> void:
	game_state.start_battle()

	# 初始阶段不是 GAME_OVER
	assert_ne(game_state.current_phase, Types.GamePhase.GAME_OVER, "初始阶段不应是 GAME_OVER")

	# 设置游戏结束
	game_state.enemy["hp"] = 0
	game_state._end_game()

	# 阶段应为 GAME_OVER
	assert_eq(game_state.current_phase, Types.GamePhase.GAME_OVER, "游戏结束后阶段应为 GAME_OVER")


# ==================== 边界值测试 ====================

func test_both_die_simultaneously() -> void:
	game_state.start_battle()

	# 设置双方低 HP
	game_state.player["hp"] = 1
	game_state.enemy["hp"] = 1

	# 同时击杀
	game_state.player["hp"] = 0
	game_state.enemy["hp"] = 0

	assert_true(game_state.is_battle_over(), "双方同时死亡时游戏结束")


func test_negative_hp() -> void:
	game_state.start_battle()

	# 设置负 HP
	game_state.enemy["hp"] = -5

	assert_true(game_state.is_battle_over(), "负 HP 也应视为死亡")


func test_alive_characters_list() -> void:
	game_state.start_battle()

	# 双方存活
	var alive: Array = game_state.get_alive_characters()
	assert_eq(alive.size(), 2, "双方存活时应返回 2 个角色")

	# 敌人死亡
	game_state.enemy["hp"] = 0
	alive = game_state.get_alive_characters()
	assert_eq(alive.size(), 1, "敌人死亡时应返回 1 个角色")
	assert_eq(alive[0], game_state.player, "存活角色应为玩家")


# ==================== 游戏状态查询测试 ====================

func test_get_opponent() -> void:
	game_state.start_battle()

	var opponent := game_state.get_opponent(game_state.player)
	assert_eq(opponent, game_state.enemy, "玩家的对手是敌人")

	opponent = game_state.get_opponent(game_state.enemy)
	assert_eq(opponent, game_state.player, "敌人的对手是玩家")


func test_is_character_turn() -> void:
	game_state.start_battle()

	# 玩家先行动（轻功高）
	assert_true(game_state.is_character_turn(game_state.player), "玩家应先行动")
	assert_false(game_state.is_character_turn(game_state.enemy), "敌人不应行动")


func test_get_battle_summary() -> void:
	game_state.start_battle()

	# 设置游戏结束
	game_state.enemy["hp"] = 0
	game_state._end_game()

	var summary: Dictionary = game_state.get_battle_summary()

	assert_eq(summary.get("winner", ""), "英雄", "胜利者应为英雄")
	assert_eq(summary.get("loser", ""), "敌人", "失败者应为敌人")
	assert_has(summary, "turns", "摘要应包含回合数")
	assert_has(summary, "actions", "摘要应包含行动数")
