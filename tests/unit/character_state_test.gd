## character_state_test.gd - CharacterState 单元测试
## 验证 Story 001 所有验收标准

extends GutTest

var character_state: Dictionary


func before_each() -> void:
	# 创建测试角色数据
	var test_data := {
		"id": "hero",
		"name": "英雄",
		"hp": 20,
		"mp": 10,
		"agility": 8,
		"deck": [],
		"martialArts": [],
		"passives": []
	}
	character_state = CharacterState.from_data(test_data)


# ==================== AC-1: Character 属性初始化 ====================

func test_ac1_attributes_initialized() -> void:
	assert_eq(character_state.get("id", ""), "hero", "id 应为 'hero'")
	assert_eq(character_state.get("name", ""), "英雄", "name 应为 '英雄'")
	assert_eq(character_state.get("max_hp", 0), 20, "max_hp 应为 20")
	assert_eq(character_state.get("hp", 0), 20, "hp 应初始化为 max_hp")
	assert_eq(character_state.get("max_mp", 0), 10, "max_mp 应为 10")
	assert_eq(character_state.get("mp", 0), 10, "mp 应初始化为 max_mp")
	assert_eq(character_state.get("base_agility", 0), 8, "base_agility 应为 8")
	assert_eq(character_state.get("agility", 0), 8, "agility 应初始化为 base_agility")


func test_ac1_missing_fields_use_defaults() -> void:
	var minimal_data := {"id": "test"}
	var state := CharacterState.from_data(minimal_data)

	assert_eq(state.get("name", ""), "未知角色", "缺失 name 使用默认值")
	assert_eq(state.get("max_hp", 0), 60, "缺失 hp 使用默认值 60")
	assert_eq(state.get("max_mp", 0), 20, "缺失 mp 使用默认值 20")
	assert_eq(state.get("base_agility", 0), 10, "缺失 agility 使用默认值 10")


# ==================== AC-2: draw_cards 正常抽牌 ====================

func test_ac2_draw_cards_normal() -> void:
	# 添加测试卡牌到牌组
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	character_state["deck"] = [CardState.create(card_data, "c1"), CardState.create(card_data, "c2"), CardState.create(card_data, "c3")]
	character_state["hand"] = []
	character_state["discard_pile"] = []

	var drawn := CharacterState.draw_cards(character_state, 2)

	assert_eq(drawn.size(), 2, "应抽出 2 张牌")
	assert_eq(character_state["hand"].size(), 2, "hand 应有 2 张牌")
	assert_eq(character_state["deck"].size(), 1, "deck 应剩 1 张牌")


func test_ac2_draw_cards_deck_empty_shuffle_discard() -> void:
	# 牌组空，弃牌堆有牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	character_state["deck"] = []
	character_state["discard_pile"] = [CardState.create(card_data, "d1"), CardState.create(card_data, "d2")]
	character_state["hand"] = []

	var drawn := CharacterState.draw_cards(character_state, 2)

	assert_eq(drawn.size(), 2, "应从弃牌堆洗入后抽出 2 张牌")
	assert_eq(character_state["discard_pile"].size(), 0, "discard_pile 应已清空")


# ==================== AC-3: take_damage 扣除 HP ====================

func test_ac3_take_damage_normal() -> void:
	character_state["hp"] = 15
	character_state["shield"] = 0

	var result := CharacterState.take_damage(character_state, 5)

	assert_eq(result.get("actual_damage", 0), 5, "实际伤害应为 5")
	assert_eq(character_state.get("hp", 0), 10, "hp 应减少到 10")


func test_ac3_take_damage_exceeds_hp() -> void:
	character_state["hp"] = 3

	var result := CharacterState.take_damage(character_state, 10)

	assert_eq(character_state.get("hp", 0), 0, "hp 应为 0（不会变负）")
	assert_eq(result.get("actual_damage", 0), 3, "实际伤害应为 3（只有 3 点 HP）")


func test_ac3_take_damage_shield_absorbs_all() -> void:
	character_state["hp"] = 10
	character_state["shield"] = 5

	var result := CharacterState.take_damage(character_state, 3)

	assert_eq(result.get("actual_damage", 0), 0, "护盾吸收后实际伤害应为 0")
	assert_eq(character_state.get("shield", 0), 2, "shield 应剩 2")
	assert_eq(character_state.get("hp", 0), 10, "hp 应不变")


func test_ac3_take_damage_shield_partial() -> void:
	character_state["hp"] = 10
	character_state["shield"] = 3

	var result := CharacterState.take_damage(character_state, 5)

	assert_eq(result.get("shield_absorbed", 0), 3, "护盾吸收 3")
	assert_eq(result.get("actual_damage", 0), 2, "剩余伤害 2")
	assert_eq(character_state.get("shield", 0), 0, "shield 应为 0")
	assert_eq(character_state.get("hp", 0), 8, "hp 应减少 2")


# ==================== AC-4: heal 不超过 max_hp ====================

func test_ac4_heal_normal() -> void:
	character_state["hp"] = 15
	character_state["max_hp"] = 20

	var healed := CharacterState.heal(character_state, 5)

	assert_eq(healed, 5, "实际治疗量应为 5")
	assert_eq(character_state.get("hp", 0), 20, "hp 应增加到 20")


func test_ac4_heal_exceeds_max() -> void:
	character_state["hp"] = 15
	character_state["max_hp"] = 20

	var healed := CharacterState.heal(character_state, 10)

	assert_eq(healed, 5, "实际治疗量应为 5（capped at max_hp）")
	assert_eq(character_state.get("hp", 0), 20, "hp 不应超过 max_hp")


# ==================== recover_mp 恢复内力 ====================

func test_recover_mp_normal() -> void:
	character_state["mp"] = 5
	character_state["max_mp"] = 10

	CharacterState.recover_mp(character_state, 3)

	assert_eq(character_state.get("mp", 0), 8, "mp 应增加到 8")


func test_recover_mp_exceeds_max() -> void:
	character_state["mp"] = 8
	character_state["max_mp"] = 10

	CharacterState.recover_mp(character_state, 5)

	assert_eq(character_state.get("mp", 0), 10, "mp 不应超过 max_mp")


# ==================== is_dead 判断 ====================

func test_is_dead_when_hp_zero() -> void:
	character_state["hp"] = 0

	assert_true(CharacterState.is_dead(character_state), "hp=0 时应返回 true")


func test_is_alive_when_hp_positive() -> void:
	character_state["hp"] = 5

	assert_false(CharacterState.is_dead(character_state), "hp>0 时应返回 false")


# ==================== reset_turn 重置状态 ====================

func test_reset_turn() -> void:
	character_state["shield"] = 5
	character_state["agility"] = 3
	character_state["base_agility"] = 8

	CharacterState.reset_turn(character_state)

	assert_eq(character_state.get("shield", 0), 0, "shield 应重置为 0")
	assert_eq(character_state.get("agility", 0), 8, "agility 应恢复到 base_agility")


# ==================== play_card 打出卡牌 ====================

func test_play_card_valid_index() -> void:
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	character_state["hand"] = [CardState.create(card_data, "c1"), CardState.create(card_data, "c2")]
	character_state["discard_pile"] = []

	var card := CharacterState.play_card(character_state, 0)

	assert_not_null(card, "应返回打出的卡牌")
	assert_eq(character_state["hand"].size(), 1, "hand 应剩 1 张")
	assert_eq(character_state["discard_pile"].size(), 1, "discard_pile 应有 1 张")


func test_play_card_invalid_index() -> void:
	character_state["hand"] = []

	var card := CharacterState.play_card(character_state, 0)

	assert_null(card, "无效索引应返回 null")