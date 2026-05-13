## status_effects_test.gd - 状态效果系统单元测试
## 验证 Story 009 所有验收标准

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


# ==================== AC-1: DoT 每回合扣血 ====================

func test_ac1_dot_damage_per_turn() -> void:
	character_state["hp"] = 10

	# 应用 DoT
	CharacterState.apply_dot(character_state, 3, 2)

	# 处理回合开始效果
	CharacterState.process_effects_for_new_turn(character_state)

	assert_eq(character_state.get("hp", 0), 7, "DoT 应扣除 3 点 HP")
	var dots: Array = character_state.get("dots", [])
	assert_eq(dots.size(), 1, "DoT 应剩 1 个")
	assert_eq(dots[0].get("duration", 0), 1, "DoT duration 应递减为 1")


func test_ac1_dot_with_shield() -> void:
	character_state["hp"] = 10
	character_state["shield"] = 2

	CharacterState.apply_dot(character_state, 3, 2)
	CharacterState.process_effects_for_new_turn(character_state)

	# DoT 伤害先扣护盾
	assert_eq(character_state.get("shield", 0), 0, "护盾应被消耗")
	assert_eq(character_state.get("hp", 0), 9, "剩余伤害扣 HP")


# ==================== AC-2: DoT 到期移除 ====================

func test_ac2_dot_expires() -> void:
	character_state["hp"] = 10

	CharacterState.apply_dot(character_state, 3, 1)
	CharacterState.process_effects_for_new_turn(character_state)

	assert_eq(character_state.get("hp", 0), 7, "DoT 应扣血")
	var dots: Array = character_state.get("dots", [])
	assert_eq(dots.size(), 0, "DoT duration=0 后应移除")


func test_ac2_multiple_dots_expire() -> void:
	character_state["hp"] = 20

	CharacterState.apply_dot(character_state, 3, 1)
	CharacterState.apply_dot(character_state, 2, 2)

	CharacterState.process_effects_for_new_turn(character_state)

	assert_eq(character_state.get("hp", 0), 15, "两个 DoT 都应扣血")
	var dots: Array = character_state.get("dots", [])
	assert_eq(dots.size(), 1, "只剩 duration=2 的 DoT")


# ==================== AC-3: DebuffAgility 降低轻功 ====================

func test_ac3_debuff_agility() -> void:
	character_state["base_agility"] = 8
	character_state["agility"] = 8

	CharacterState.apply_debuff(character_state, "agility", 2, 1)
	CharacterState.process_effects_for_new_turn(character_state)

	assert_eq(character_state.get("agility", 0), 6, "轻功应降低 2")


func test_ac3_debuff_agility_capped() -> void:
	character_state["base_agility"] = 3
	character_state["agility"] = 3

	CharacterState.apply_debuff(character_state, "agility", 5, 1)
	CharacterState.process_effects_for_new_turn(character_state)

	assert_eq(character_state.get("agility", 0), 0, "轻功不应低于 0")


func test_ac3_debuff_agility_expires() -> void:
	character_state["base_agility"] = 8
	character_state["agility"] = 8

	CharacterState.apply_debuff(character_state, "agility", 2, 1)
	CharacterState.process_effects_for_new_turn(character_state)

	var debuffs: Array = character_state.get("debuffs", [])
	assert_eq(debuffs.size(), 0, "Debuff duration=0 后应移除")


# ==================== AC-4: DisableCardType 禁用卡牌 ====================

func test_ac4_disable_card_type() -> void:
	CharacterState.apply_debuff(character_state, "disable_fist", 0, 2)

	assert_true(CharacterState.is_card_type_disabled(character_state, Types.CardType.EMPTY_HAND), "fist 类型应被禁用")
	assert_false(CharacterState.is_card_type_disabled(character_state, Types.CardType.SHORT_WEAPON), "其他类型不应被禁用")


func test_ac4_disable_card_type_expires() -> void:
	CharacterState.apply_debuff(character_state, "disable_fist", 0, 1)

	assert_true(CharacterState.is_card_type_disabled(character_state, Types.CardType.EMPTY_HAND), "禁用生效")

	CharacterState.process_effects_for_new_turn(character_state)

	assert_false(CharacterState.is_card_type_disabled(character_state, Types.CardType.EMPTY_HAND), "到期后解除禁用")


func test_ac4_multiple_disable_types() -> void:
	CharacterState.apply_debuff(character_state, "disable_fist", 0, 2)
	CharacterState.apply_debuff(character_state, "disable_leg", 0, 2)

	assert_true(CharacterState.is_card_type_disabled(character_state, Types.CardType.EMPTY_HAND), "fist 禁用")
	assert_true(CharacterState.is_card_type_disabled(character_state, Types.CardType.LEG), "leg 禁用")
	assert_false(CharacterState.is_card_type_disabled(character_state, Types.CardType.SHORT_WEAPON), "short_weapon 未禁用")


# ==================== AC-5: 多状态效果同时处理 ====================

func test_ac5_multiple_effects() -> void:
	character_state["hp"] = 20
	character_state["base_agility"] = 8
	character_state["agility"] = 8

	CharacterState.apply_dot(character_state, 3, 1)
	CharacterState.apply_debuff(character_state, "agility", 2, 2)

	CharacterState.process_effects_for_new_turn(character_state)

	# DoT 扣血
	assert_eq(character_state.get("hp", 0), 17, "DoT 应扣血 3")
	# Debuff 降低轻功
	assert_eq(character_state.get("agility", 0), 6, "Debuff 应降低轻功 2")

	# DoT 到期移除
	var dots: Array = character_state.get("dots", [])
	assert_eq(dots.size(), 0, "DoT 到期移除")

	# Debuff duration 递减但未到期
	var debuffs: Array = character_state.get("debuffs", [])
	assert_eq(debuffs.size(), 1, "Debuff 未到期")
	assert_eq(debuffs[0].get("duration", 0), 1, "Debuff duration 递减")


# ==================== 效果叠加测试 ====================

func test_dot_stack() -> void:
	character_state["hp"] = 20

	CharacterState.apply_dot(character_state, 3, 2)
	CharacterState.apply_dot(character_state, 2, 2)

	CharacterState.process_effects_for_new_turn(character_state)

	assert_eq(character_state.get("hp", 0), 15, "两个 DoT 都扣血")


func test_debuff_stack() -> void:
	character_state["base_agility"] = 10
	character_state["agility"] = 10

	CharacterState.apply_debuff(character_state, "agility", 2, 2)
	CharacterState.apply_debuff(character_state, "agility", 3, 2)

	CharacterState.process_effects_for_new_turn(character_state)

	assert_eq(character_state.get("agility", 0), 5, "两个 Debuff 都生效")


# ==================== 回合重置测试 ====================

func test_reset_turn_clears_effects() -> void:
	character_state["hp"] = 10
	character_state["agility"] = 5

	CharacterState.apply_dot(character_state, 3, 2)
	CharacterState.apply_debuff(character_state, "agility", 2, 2)

	# reset_turn 不处理效果，只重置轻功和护盾
	CharacterState.reset_turn(character_state)

	# 效果应该还在
	var dots: Array = character_state.get("dots", [])
	var debuffs: Array = character_state.get("debuffs", [])
	assert_eq(dots.size(), 1, "DoT 不应在 reset_turn 中移除")
	assert_eq(debuffs.size(), 1, "Debuff 不应在 reset_turn 中移除")


# ==================== 边界值测试 ====================

func test_dot_zero_value() -> void:
	character_state["hp"] = 10

	CharacterState.apply_dot(character_state, 0, 2)
	CharacterState.process_effects_for_new_turn(character_state)

	assert_eq(character_state.get("hp", 0), 10, "DoT value=0 不扣血")


func test_debuff_zero_duration() -> void:
	CharacterState.apply_debuff(character_state, "agility", 2, 0)

	var debuffs: Array = character_state.get("debuffs", [])
	assert_eq(debuffs.size(), 0, "duration=0 的 Debuff 不应添加")


func test_dot_kills_character() -> void:
	character_state["hp"] = 3

	CharacterState.apply_dot(character_state, 5, 2)
	CharacterState.process_effects_for_new_turn(character_state)

	assert_eq(character_state.get("hp", 0), 0, "DoT 可致死")
	assert_true(CharacterState.is_dead(character_state), "角色应死亡")


# ==================== 效果来源测试 ====================

func test_dot_with_source() -> void:
	var source := {"id": "enemy", "name": "敌人"}
	character_state["hp"] = 10

	CharacterState.apply_dot(character_state, 3, 2, source)
	CharacterState.process_effects_for_new_turn(character_state)

	assert_eq(character_state.get("hp", 0), 7, "带来源的 DoT 也扣血")