## damage_shield_test.gd - 伤害计算与护盾系统单元测试
## 验证 Story 007 所有验收标准

extends GutTest

var character_state: Dictionary


func before_each() -> void:
	var test_data := {
		"id": "hero",
		"name": "英雄",
		"hp": 20,
		"mp": 10,
		"agility": 8,
		"strength": 5,
		"deck": [],
		"martialArts": [],
		"passives": []
	}
	character_state = CharacterState.from_data(test_data)


# ==================== AC-1: 力量加成计算 ====================

func test_ac1_strength_multiplier_normal() -> void:
	# strength=5, multiplier = 1 + (5-1)*0.05 = 1.2
	var damage := CharacterState.calculate_damage_with_strength(character_state, 10)

	assert_eq(damage, 12, "strength=5 时伤害应为 10 * 1.2 = 12")


func test_ac1_strength_multiplier_one() -> void:
	# strength=1, multiplier = 1 + (1-1)*0.05 = 1.0
	character_state["strength"] = 1

	var damage := CharacterState.calculate_damage_with_strength(character_state, 10)

	assert_eq(damage, 10, "strength=1 时 multiplier=1.0")


func test_ac1_strength_multiplier_high() -> void:
	# strength=10, multiplier = 1 + (10-1)*0.05 = 1.45
	character_state["strength"] = 10

	var damage := CharacterState.calculate_damage_with_strength(character_state, 10)

	assert_eq(damage, 14, "strength=10 时伤害应为 10 * 1.45 = 14.5 → 14")


func test_ac1_strength_multiplier_zero_base_damage() -> void:
	var damage := CharacterState.calculate_damage_with_strength(character_state, 0)

	assert_eq(damage, 0, "基础伤害为 0 时结果应为 0")


# ==================== AC-2: 护盾吸收全部伤害 ====================

func test_ac2_shield_absorbs_all() -> void:
	character_state["shield"] = 5
	character_state["hp"] = 20

	var result := CharacterState.take_damage(character_state, 3)

	assert_eq(result.get("actual_damage", 0), 0, "护盾完全吸收时实际伤害应为 0")
	assert_eq(result.get("shield_absorbed", 0), 3, "护盾吸收 3")
	assert_eq(character_state.get("shield", 0), 2, "护盾应剩 2")
	assert_eq(character_state.get("hp", 0), 20, "HP 应不变")


# ==================== AC-3: 护盾部分吸收 ====================

func test_ac3_shield_partial_absorb() -> void:
	character_state["shield"] = 3
	character_state["hp"] = 20

	var result := CharacterState.take_damage(character_state, 5)

	assert_eq(result.get("actual_damage", 0), 2, "护盾吸收后剩余伤害 2")
	assert_eq(result.get("shield_absorbed", 0), 3, "护盾吸收 3")
	assert_eq(character_state.get("shield", 0), 0, "护盾应为 0")
	assert_eq(character_state.get("hp", 0), 18, "HP 应减少 2")


func test_ac3_shield_zero() -> void:
	character_state["shield"] = 0
	character_state["hp"] = 20

	var result := CharacterState.take_damage(character_state, 5)

	assert_eq(result.get("actual_damage", 0), 5, "无护盾时全部伤害")
	assert_eq(result.get("shield_absorbed", 0), 0, "护盾吸收 0")
	assert_eq(character_state.get("hp", 0), 15, "HP 应减少 5")


# ==================== AC-4: 无视护盾伤害 ====================

func test_ac4_ignore_shield() -> void:
	character_state["shield"] = 10
	character_state["hp"] = 20

	var result := CharacterState.take_damage(character_state, 5, {}, true)

	assert_eq(result.get("actual_damage", 0), 5, "无视护盾时实际伤害应为 5")
	assert_eq(result.get("shield_absorbed", 0), 0, "护盾不应吸收")
	assert_eq(character_state.get("shield", 0), 10, "护盾应不变")
	assert_eq(character_state.get("hp", 0), 15, "HP 应减少 5")


func test_ac4_ignore_shield_with_high_damage() -> void:
	character_state["shield"] = 100
	character_state["hp"] = 10

	var result := CharacterState.take_damage(character_state, 15, {}, true)

	assert_eq(result.get("actual_damage", 0), 10, "实际伤害应等于剩余 HP")
	assert_eq(character_state.get("shield", 0), 100, "护盾应不变")
	assert_eq(character_state.get("hp", 0), 0, "HP 应为 0")


# ==================== AC-5: 伤害为 0 不触发信号 ====================

func test_ac5_zero_damage_no_signal() -> void:
	# 这个测试在 GameState 中验证
	var player_data := {"id": "hero", "hp": 20, "mp": 10, "agility": 8, "deck": [], "martialArts": [], "passives": []}
	var enemy_data := {"id": "enemy", "hp": 15, "mp": 8, "agility": 5, "deck": [], "martialArts": [], "passives": []}

	var state_result := GameState.create(player_data, enemy_data)
	var game_state: GameState = state_result.state
	game_state.start_battle()

	# 设置敌人护盾足够吸收伤害
	game_state.enemy["shield"] = 100

	# 监视信号
	watch_signals(game_state)

	# 添加伤害卡牌
	var card_data := {"id": "card1", "damage": 5, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	game_state.use_basic_card(0)

	# 伤害被护盾完全吸收，不应发射 damage_dealt 信号
	assert_signal_not_emitted(game_state, "damage_dealt", "伤害为 0 时不应发射信号")


# ==================== 护盾不跨回合保留 ====================

func test_shield_reset_on_new_turn() -> void:
	character_state["shield"] = 5

	CharacterState.reset_turn(character_state)

	assert_eq(character_state.get("shield", 0), 0, "护盾应在回合开始时重置")


# ==================== selfDamage 处理 ====================

func test_self_damage_no_internal_trigger() -> void:
	# selfDamage 不触发内功的测试需要内功系统，这里只验证伤害计算
	character_state["hp"] = 20

	var result := CharacterState.take_damage(character_state, 5, character_state)

	assert_eq(result.get("actual_damage", 0), 5, "自身伤害应正常计算")
	assert_eq(character_state.get("hp", 0), 15, "HP 应减少")


# ==================== HP 不会变负 ====================

func test_hp_not_negative() -> void:
	character_state["hp"] = 3
	character_state["shield"] = 0

	var result := CharacterState.take_damage(character_state, 100)

	assert_eq(character_state.get("hp", 0), 0, "HP 应为 0（不会变负）")
	assert_eq(result.get("actual_damage", 0), 3, "实际伤害应等于剩余 HP")


# ==================== 边界值测试 ====================

func test_damage_exactly_equals_shield() -> void:
	character_state["shield"] = 5
	character_state["hp"] = 20

	var result := CharacterState.take_damage(character_state, 5)

	assert_eq(result.get("actual_damage", 0), 0, "伤害等于护盾时全部吸收")
	assert_eq(character_state.get("shield", 0), 0, "护盾应为 0")


func test_damage_exceeds_hp_and_shield() -> void:
	character_state["shield"] = 3
	character_state["hp"] = 5

	var result := CharacterState.take_damage(character_state, 20)

	assert_eq(result.get("actual_damage", 0), 5, "实际伤害应等于剩余 HP")
	assert_eq(result.get("shield_absorbed", 0), 3, "护盾吸收 3")
	assert_eq(character_state.get("hp", 0), 0, "HP 应为 0")


# ==================== 力量默认值测试 ====================

func test_strength_default_value() -> void:
	var minimal_data := {"id": "test"}
	var state := CharacterState.from_data(minimal_data)

	assert_eq(state.get("strength", 0), 1, "缺失 strength 使用默认值 1")


func test_strength_explicit_value() -> void:
	var data := {"id": "test", "strength": 7}
	var state := CharacterState.from_data(data)

	assert_eq(state.get("strength", 0), 7, "应使用指定的 strength 值")