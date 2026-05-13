## basic_card_validation_test.gd - 基础招式卡牌使用验证单元测试
## 验证 Story 005 所有验收标准

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


# ==================== AC-1: 轻功不足验证 ====================

func test_ac1_not_enough_agility() -> void:
	game_state.start_battle()

	# 设置轻功不足
	game_state.player["agility"] = 2

	# 添加需要 4 轻功的卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 4}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_basic_card(0)

	assert_false(result.success, "轻功不足时应失败")
	assert_eq(result.get("error", ""), "not_enough_agility", "应返回轻功不足错误")


func test_ac1_zero_agility() -> void:
	game_state.start_battle()

	# 设置轻功为 0
	game_state.player["agility"] = 0

	# 添加卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_basic_card(0)

	assert_false(result.success, "轻功为 0 时任何卡牌都无法使用")
	assert_eq(result.get("error", ""), "not_enough_agility", "应返回轻功不足错误")


# ==================== AC-2: 目标无效验证 ====================

func test_ac2_target_dead() -> void:
	game_state.start_battle()

	# 设置敌人死亡
	game_state.enemy["hp"] = 0

	# 添加卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_basic_card(0, "enemy")

	assert_false(result.success, "目标死亡时应失败")
	assert_eq(result.get("error", ""), "target_dead", "应返回目标死亡错误")


func test_ac2_invalid_target_id() -> void:
	game_state.start_battle()

	# 添加卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_basic_card(0, "nonexistent")

	assert_false(result.success, "目标 ID 不存在时应失败")
	assert_eq(result.get("error", ""), "invalid_target", "应返回无效目标错误")


# ==================== AC-3: 距离超出验证 ====================

func test_ac3_distance_check_skipped_for_1v1() -> void:
	game_state.start_battle()

	# 添加攻击卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	# 1v1 模式下，距离始终有效
	var result := game_state.use_basic_card(0)

	assert_true(result.success, "1v1 模式下距离始终有效")


# ==================== AC-4: 成功使用卡牌 ====================

func test_ac4_success_use_card() -> void:
	game_state.start_battle()

	var initial_agility: int = game_state.player.get("agility", 0)
	var initial_enemy_hp: int = game_state.enemy.get("hp", 0)

	# 添加卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 2}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	# 监视信号
	watch_signals(game_state)

	var result := game_state.use_basic_card(0)

	assert_true(result.success, "应成功使用卡牌")
	assert_eq(game_state.player.get("agility", 0), initial_agility - 2, "应消耗 2 点轻功")
	assert_true(game_state.enemy.get("hp", 0) < initial_enemy_hp, "敌人 HP 应减少")
	assert_signal_emitted(game_state, "card_played", "应发射 card_played 信号")


func test_ac4_card_moved_to_discard() -> void:
	game_state.start_battle()

	# 添加卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var initial_hand_size: int = game_state.player.get("hand", []).size()
	var initial_discard_size: int = game_state.player.get("discard_pile", []).size()

	game_state.use_basic_card(0)

	assert_eq(game_state.player.get("hand", []).size(), initial_hand_size - 1, "手牌应减少 1 张")
	assert_eq(game_state.player.get("discard_pile", []).size(), initial_discard_size + 1, "弃牌堆应增加 1 张")


# ==================== AC-5: 护盾卡牌效果 ====================

func test_ac5_shield_card_effect() -> void:
	game_state.start_battle()

	# 添加护盾卡牌（无伤害）
	var card_data := {"id": "shield1", "damage": 0, "shield": 4, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "s1")]

	var initial_shield: int = game_state.player.get("shield", 0)

	game_state.use_basic_card(0)

	assert_eq(game_state.player.get("shield", 0), initial_shield + 4, "应获得 4 点护盾")


func test_ac5_shield_stacking() -> void:
	game_state.start_battle()

	# 设置初始护盾
	game_state.player["shield"] = 2

	# 添加护盾卡牌
	var card_data := {"id": "shield1", "damage": 0, "shield": 4, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "s1")]

	game_state.use_basic_card(0)

	assert_eq(game_state.player.get("shield", 0), 6, "护盾应叠加为 6")


# ==================== 目标选择测试 ====================

func test_target_selection_auto() -> void:
	game_state.start_battle()

	# 添加卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_basic_card(0)  # 不指定目标

	assert_true(result.success, "自动选择目标应成功")


func test_target_selection_explicit_enemy() -> void:
	game_state.start_battle()

	# 添加卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_basic_card(0, "enemy")

	assert_true(result.success, "明确指定敌人目标应成功")


func test_target_selection_explicit_self() -> void:
	game_state.start_battle()

	# 添加护盾卡牌（可以对自己使用）
	var card_data := {"id": "shield1", "damage": 0, "shield": 4, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "s1")]

	var result := game_state.use_basic_card(0, "hero")

	assert_true(result.success, "对自己使用护盾卡应成功")
	assert_eq(game_state.player.get("shield", 0), 4, "应获得护盾")


# ==================== 无效卡牌索引测试 ====================

func test_invalid_card_index_negative() -> void:
	game_state.start_battle()

	var result := game_state.use_basic_card(-1)

	assert_false(result.success, "负数索引应失败")
	assert_eq(result.get("error", ""), "invalid_card_index", "应返回无效索引错误")


func test_invalid_card_index_out_of_range() -> void:
	game_state.start_battle()

	var result := game_state.use_basic_card(999)

	assert_false(result.success, "超出范围索引应失败")
	assert_eq(result.get("error", ""), "invalid_card_index", "应返回无效索引错误")


# ==================== 治疗卡牌测试 ====================

func test_heal_card_effect() -> void:
	game_state.start_battle()

	# 设置玩家 HP 减少
	game_state.player["hp"] = 10
	game_state.player["max_hp"] = 20

	# 添加治疗卡牌
	var card_data := {"id": "heal1", "damage": 0, "heal": 5, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "h1")]

	game_state.use_basic_card(0)

	assert_eq(game_state.player.get("hp", 0), 15, "应恢复 5 点 HP")


# ==================== 混合效果卡牌测试 ====================

func test_mixed_effect_card() -> void:
	game_state.start_battle()

	# 添加混合效果卡牌（伤害+护盾）
	var card_data := {"id": "mixed1", "damage": 2, "shield": 3, "agility_cost": 2}
	game_state.player["hand"] = [CardState.create(card_data, "m1")]

	var initial_enemy_hp: int = game_state.enemy.get("hp", 0)

	game_state.use_basic_card(0)

	assert_true(game_state.enemy.get("hp", 0) < initial_enemy_hp, "敌人应受到伤害")
	assert_eq(game_state.player.get("shield", 0), 3, "玩家应获得护盾")
