## target_validation_test.gd - 目标选择与攻击范围验证单元测试
## 验证 Story 013 所有验收标准

extends GutTest

const GameStateClass = preload("res://scripts/game/game_state.gd")
const DistanceSystemClass = preload("res://scripts/game/distance_system.gd")
const CardStateClass = preload("res://scripts/game/card_state.gd")
const SkillStateClass = preload("res://scripts/game/skill_state.gd")

var game_state: GameState


func before_each() -> void:
	game_state = GameStateClass.new()


# ==================== AC-1: 目标超出范围 ====================

func test_ac1_target_out_of_range() -> void:
	# 创建多人战斗
	var team_a := [_create_character("A1", 10, "A"), _create_character("A2", 10, "A")]
	var team_b := [_create_character("B1", 10, "B"), _create_character("B2", 10, "B")]

	var result := GameStateClass.create_team_battle(team_a, team_b)
	game_state = result.state
	game_state.start_battle()

	# 座位顺序：A1(0), B1(1), A2(2), B2(3)
	# all_characters 顺序：A1(0), A2(1), B1(2), B2(3)
	# A1 到 B2 的距离：seat_a=0, seat_b=3, total=4
	# direct = 3, wrap = 1, min = 1
	# 所以 A1 到 B2 距离是 1，在 range=1 内

	# 测试超出范围：A2 到 B1
	# A2 在座位 2，B1 在座位 1
	# direct = 1, wrap = 3, min = 1
	# 距离是 1，也在 range=1 内

	# 测试超出范围：A1 到 A2（队友，会被禁止）
	# 需要测试敌人之间的距离超出范围

	# 创建 5 人战斗来测试超出范围
	var team_a2 := [_create_character("A1", 10, "A"), _create_character("A2", 10, "A")]
	var team_b2 := [_create_character("B1", 10, "B"), _create_character("B2", 10, "B"), _create_character("B3", 10, "B")]

	var result2 := GameStateClass.create_team_battle(team_a2, team_b2)
	game_state = result2.state
	game_state.start_battle()

	# 座位顺序：A1(0), B1(1), A2(2), B2(3), B3(4)
	# A1 到 B3：seat_a=0, seat_b=4, total=5
	# direct = 4, wrap = 1, min = 1
	# 距离是 1

	# A1 到 B2：seat_a=0, seat_b=3, total=5
	# direct = 3, wrap = 2, min = 2
	# 距离是 2，超出 range=1
	var a1: Dictionary = game_state.all_characters[0]
	var b2: Dictionary = game_state.all_characters[3]

	var validation := game_state.validate_target(a1, b2, 1)

	assert_false(validation.get("valid", true), "超出范围应返回 invalid")
	assert_true(validation.get("message", "").contains("超出攻击范围"), "应包含超出攻击范围消息")


func test_ac1_target_in_range() -> void:
	# 创建多人战斗
	var team_a := [_create_character("A1", 10, "A"), _create_character("A2", 10, "A")]
	var team_b := [_create_character("B1", 10, "B"), _create_character("B2", 10, "B")]

	var result := GameStateClass.create_team_battle(team_a, team_b)
	game_state = result.state
	game_state.start_battle()

	# 座位顺序：A1(0), B1(1), A2(2), B2(3)
	# all_characters 顺序：A1(0), A2(1), B1(2), B2(3)
	# A1 到 B1 的距离：seat_a=0, seat_b=1, total=4
	# direct = 1, wrap = 3, min = 1
	# 空手卡牌 range = 1，应该在范围内
	var a1: Dictionary = game_state.all_characters[0]
	var b1: Dictionary = game_state.all_characters[2]

	var validation := game_state.validate_target(a1, b1, 1)

	assert_true(validation.get("valid", false), "范围内应返回 valid")


# ==================== AC-2: 目标已死亡 ====================

func test_ac2_target_dead() -> void:
	# 创建角色
	var player_data := _create_character("Player", 10, "A")
	var enemy_data := _create_character("Enemy", 0, "B")  # HP = 0，死亡

	var result := GameStateClass.create(player_data, enemy_data)
	game_state = result.state
	game_state.start_battle()

	var player: Dictionary = game_state.player
	var enemy: Dictionary = game_state.enemy

	var validation := game_state.validate_target(player, enemy, 1)

	assert_false(validation.get("valid", true), "目标死亡应返回 invalid")
	assert_eq(validation.get("message", ""), "目标已死亡", "应返回目标已死亡消息")


# ==================== AC-3: 阵营对战禁止队友攻击 ====================

func test_ac3_team_mode_cannot_attack_teammate() -> void:
	# 创建阵营对战
	var team_a := [_create_character("A1", 10, "A"), _create_character("A2", 10, "A")]
	var team_b := [_create_character("B1", 10, "B"), _create_character("B2", 10, "B")]

	var result := GameStateClass.create_team_battle(team_a, team_b)
	game_state = result.state
	game_state.start_battle()

	# all_characters 顺序：A1, A2, B1, B2（按添加顺序）
	# 座位顺序：A1(0), B1(1), A2(2), B2(3)
	# A1 和 A2 是队友（都在 team A）
	var a1: Dictionary = game_state.all_characters[0]
	var a2: Dictionary = game_state.all_characters[1]

	var validation := game_state.validate_target(a1, a2, 1)

	assert_false(validation.get("valid", true), "阵营对战应禁止队友攻击")
	assert_eq(validation.get("message", ""), "不能攻击队友", "应返回不能攻击队友消息")


func test_ac3_team_mode_can_attack_enemy() -> void:
	# 创建阵营对战
	var team_a := [_create_character("A1", 10, "A"), _create_character("A2", 10, "A")]
	var team_b := [_create_character("B1", 10, "B"), _create_character("B2", 10, "B")]

	var result := GameStateClass.create_team_battle(team_a, team_b)
	game_state = result.state
	game_state.start_battle()

	# all_characters 顺序：A1, A2, B1, B2
	# A1 (team A) 攻击 B1 (team B)
	var a1: Dictionary = game_state.all_characters[0]
	var b1: Dictionary = game_state.all_characters[2]

	var validation := game_state.validate_target(a1, b1, 1)

	assert_true(validation.get("valid", false), "阵营对战应允许攻击敌人")


# ==================== AC-4: 混战模式允许攻击任何人 ====================

func test_ac4_free_for_all_can_attack_anyone() -> void:
	# 创建混战模式
	var characters := [
		_create_character("A", 10, "A"),
		_create_character("B", 10, "B"),
		_create_character("C", 10, "C"),
	]

	var result := GameStateClass.create_free_for_all(characters)
	game_state = result.state
	game_state.start_battle()

	# 在混战模式中，任何人都可以被攻击
	var char_a: Dictionary = game_state.all_characters[0]
	var char_b: Dictionary = game_state.all_characters[1]

	var validation := game_state.validate_target(char_a, char_b, 1)

	assert_true(validation.get("valid", false), "混战模式应允许攻击任何人")


# ==================== AC-5: get_valid_targets 返回列表 ====================

func test_ac5_get_valid_targets() -> void:
	# 创建多人战斗
	var team_a := [_create_character("A1", 10, "A")]
	var team_b := [_create_character("B1", 10, "B"), _create_character("B2", 10, "B"), _create_character("B3", 10, "B")]

	var result := GameStateClass.create_team_battle(team_a, team_b)
	game_state = result.state
	game_state.start_battle()

	var a1: Dictionary = game_state.all_characters[0]

	# 使用 range = 2 的卡牌
	var card_data := {"range": 2}
	var targets: Array = game_state.get_valid_targets(a1, card_data)

	# A1 在座位 0，B1 在座位 1（距离 1），B2 在座位 2（距离 2）
	# B3 在座位 3（距离 2，绕圈）
	assert_true(targets.size() >= 2, "应有至少 2 个有效目标")


func test_ac5_get_valid_targets_empty() -> void:
	# 创建角色
	var player_data := _create_character("Player", 10, "A")
	var enemy_data := _create_character("Enemy", 10, "B")

	var result := GameStateClass.create(player_data, enemy_data)
	game_state = result.state
	game_state.start_battle()

	# 使用 range = 0 的卡牌，但 1v1 模式下距离系统会验证
	# 在 1v1 模式下，range = 0 意味着不检查距离
	# 但目标仍然需要存活且不是自己
	var card_data := {"range": 0}
	var targets: Array = game_state.get_valid_targets(game_state.player, card_data)

	# range = 0 时，validate_target 不检查距离，所以目标有效
	assert_true(targets.size() >= 1, "range = 0 时应有有效目标（不检查距离）")


# ==================== 卡牌范围测试 ====================

func test_card_range_empty_hand() -> void:
	var card := _create_card("punch", "empty_hand", 5, 1)
	var range_val: int = GameStateClass.get_card_range(card)

	assert_eq(range_val, 1, "空手卡牌范围应为 1")


func test_card_range_short_weapon() -> void:
	var card := _create_card("stab", "short_weapon", 5, 1)
	var range_val: int = GameStateClass.get_card_range(card)

	assert_eq(range_val, 2, "短兵卡牌范围应为 2")


func test_card_range_long_weapon() -> void:
	var card := _create_card("slash", "long_weapon", 5, 1)
	var range_val: int = GameStateClass.get_card_range(card)

	assert_eq(range_val, 3, "长兵卡牌范围应为 3")


func test_card_range_leg() -> void:
	var card := _create_card("kick", "leg", 5, 1)
	var range_val: int = GameStateClass.get_card_range(card)

	assert_eq(range_val, 1, "腿法卡牌范围应为 1")


# ==================== 武功范围测试 ====================

func test_skill_range_custom() -> void:
	var skill := SkillStateClass.new()
	skill.range_requirement = 3

	var range_val: int = GameStateClass.get_skill_range(skill)

	assert_eq(range_val, 3, "武功范围应使用自定义值")


func test_skill_range_default() -> void:
	var skill := SkillStateClass.new()
	skill.range_requirement = 0

	var range_val: int = GameStateClass.get_skill_range(skill)

	assert_eq(range_val, 1, "武功默认范围应为 1")


# ==================== 辅助方法 ====================

func _create_character(id: String, hp: int, team: String) -> Dictionary:
	return {
		"id": id,
		"name": id,
		"hp": hp,
		"max_hp": 10,
		"mp": 10,
		"max_mp": 10,
		"agility": 10,
		"base_agility": 10,
		"team": team,
		"hand": [],
		"deck": [],
		"discard": [],
		"skills": [],
		"shield": 0,
		"dots": [],
		"debuffs": [],
	}


func _create_card(id: String, type: String, damage: int, agility_cost: int) -> CardState:
	var card := CardStateClass.new()
	card.card_id = id
	card.name = id
	card.type = _parse_card_type(type)
	card.base_damage = damage
	card.agility_cost = agility_cost
	return card


func _parse_card_type(type_str: String) -> int:
	match type_str.to_lower():
		"empty_hand", "fist":
			return 0  # Types.CardType.EMPTY_HAND
		"short_weapon", "short":
			return 1  # Types.CardType.SHORT_WEAPON
		"long_weapon", "long":
			return 2  # Types.CardType.LONG_WEAPON
		"leg", "kick":
			return 3  # Types.CardType.LEG
		_:
			return 0
