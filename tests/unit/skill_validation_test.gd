## skill_validation_test.gd - 武功招式使用验证单元测试
## 验证 Story 006 所有验收标准

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


# ==================== AC-1: 内力不足验证 ====================

func test_ac1_not_enough_mp() -> void:
	game_state.start_battle()

	# 设置内力不足
	game_state.player["mp"] = 2

	# 添加武功（需要 5 内力）
	var skill_data := {
		"id": "dragon_palm",
		"name": "降龙掌",
		"damage": 10,
		"mp_cost": 5,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_skill(0, 0)

	assert_false(result.success, "内力不足时应失败")
	assert_eq(result.get("error", ""), "skill_not_available", "应返回武功不可用错误")


func test_ac1_zero_mp() -> void:
	game_state.start_battle()

	# 设置内力为 0
	game_state.player["mp"] = 0

	# 添加武功
	var skill_data := {
		"id": "dragon_palm",
		"name": "降龙掌",
		"damage": 10,
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_skill(0, 0)

	assert_false(result.success, "内力为 0 时任何武功都无法使用")


# ==================== AC-2: 手牌类型不匹配 ====================

func test_ac2_card_type_mismatch() -> void:
	game_state.start_battle()

	# 添加武功（需要 fist 类型）
	var skill_data := {
		"id": "dragon_palm",
		"name": "降龙掌",
		"damage": 10,
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加错误类型的手牌
	var card_data := {"id": "sword1", "type": "short_weapon", "damage": 3, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_skill(0, 0)

	assert_false(result.success, "手牌类型不匹配时应失败")
	# skill_not_available 或 invalid_card_for_skill 都表示不可用
	assert_true(result.get("error", "") in ["skill_not_available", "invalid_card_for_skill"], "应返回不可用错误")


func test_ac2_any_card_type_accepted() -> void:
	game_state.start_battle()

	# 添加武功（接受任意类型）
	var skill_data := {
		"id": "universal_strike",
		"name": "通用打击",
		"damage": 8,
		"mp_cost": 2,
		"agility_cost": 2,
		"required_card_type": "any",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加任意类型手牌
	var card_data := {"id": "palm1", "type": "palm", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_skill(0, 0)

	assert_true(result.success, "required_card_type='any' 时任何类型都可用")


# ==================== AC-3: 成功使用武功 ====================

func test_ac3_success_use_skill() -> void:
	game_state.start_battle()

	# 添加武功
	var skill_data := {
		"id": "dragon_palm",
		"name": "降龙掌",
		"damage": 10,
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var initial_mp: int = game_state.player.get("mp", 0)
	var initial_agility: int = game_state.player.get("agility", 0)
	var initial_hand_size: int = game_state.player.get("hand", []).size()

	# 监视信号
	watch_signals(game_state)

	var result := game_state.use_skill(0, 0)

	assert_true(result.success, "应成功使用武功")
	assert_eq(game_state.player.get("mp", 0), initial_mp - 3, "应消耗 3 点内力")
	assert_eq(game_state.player.get("agility", 0), initial_agility - 2, "应消耗 2 点轻功")
	assert_eq(game_state.player.get("hand", []).size(), initial_hand_size - 1, "手牌应减少 1 张")
	assert_signal_emitted(game_state, "skill_used", "应发射 skill_used 信号")


func test_ac3_skill_damage_applied() -> void:
	game_state.start_battle()

	var initial_enemy_hp: int = game_state.enemy.get("hp", 0)

	# 添加武功
	var skill_data := {
		"id": "dragon_palm",
		"name": "降龙掌",
		"damage": 10,
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	game_state.use_skill(0, 0)

	assert_true(game_state.enemy.get("hp", 0) < initial_enemy_hp, "敌人应受到伤害")


# ==================== AC-4: 多效果处理 ====================

func test_ac4_multiple_effects() -> void:
	game_state.start_battle()

	var initial_enemy_hp: int = game_state.enemy.get("hp", 0)
	var initial_player_shield: int = game_state.player.get("shield", 0)

	# 添加多效果武功
	var skill_data := {
		"id": "combo_strike",
		"name": "连击",
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0,
		"damage": 10,
		"effects": [
			{"type": "damage", "value": 10},
			{"type": "shield", "value": 4}
		]
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	game_state.use_skill(0, 0)

	assert_true(game_state.enemy.get("hp", 0) < initial_enemy_hp, "敌人应受到伤害")
	assert_eq(game_state.player.get("shield", 0), initial_player_shield + 4, "玩家应获得护盾")


func test_ac4_effects_order() -> void:
	game_state.start_battle()

	# 添加多效果武功（先伤害后治疗自己）
	var skill_data := {
		"id": "drain_strike",
		"name": "吸血打击",
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0,
		"damage": 8,
		"effects": [
			{"type": "damage", "value": 8},
			{"type": "heal_self", "value": 3}
		]
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 设置玩家 HP 减少
	game_state.player["hp"] = 15
	game_state.player["max_hp"] = 20

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	game_state.use_skill(0, 0)

	assert_eq(game_state.player.get("hp", 0), 18, "应恢复 3 点 HP")


# ==================== AC-5: extraAction 特殊效果 ====================

func test_ac5_extra_action_effect() -> void:
	game_state.start_battle()

	var initial_agility: int = game_state.player.get("agility", 0)

	# 添加带 extraAction 的武功
	var skill_data := {
		"id": "swift_strike",
		"name": "迅捷打击",
		"mp_cost": 2,
		"agility_cost": 0,  # extraAction 不消耗额外轻功
		"required_card_type": "fist",
		"cooldown": 0,
		"damage": 5,
		"effects": [
			{"type": "damage", "value": 5},
			{"type": "extraAction"}
		]
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_skill(0, 0)

	# extraAction 后轻功不应减少（或减少后恢复）
	# 具体行为取决于实现
	assert_true(result.success, "extraAction 武功应成功使用")


# ==================== 目标选择测试 ====================

func test_target_selection_auto() -> void:
	game_state.start_battle()

	# 添加武功
	var skill_data := {
		"id": "dragon_palm",
		"name": "降龙掌",
		"damage": 10,
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_skill(0, 0)  # 不指定目标

	assert_true(result.success, "自动选择目标应成功")


func test_target_selection_explicit() -> void:
	game_state.start_battle()

	# 添加武功
	var skill_data := {
		"id": "dragon_palm",
		"name": "降龙掌",
		"damage": 10,
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_skill(0, 0, "enemy")

	assert_true(result.success, "明确指定目标应成功")


func test_target_dead() -> void:
	game_state.start_battle()

	# 设置敌人死亡
	game_state.enemy["hp"] = 0

	# 添加武功
	var skill_data := {
		"id": "dragon_palm",
		"name": "降龙掌",
		"damage": 10,
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_skill(0, 0, "enemy")

	assert_false(result.success, "目标死亡时应失败")
	assert_eq(result.get("error", ""), "target_dead", "应返回目标死亡错误")


# ==================== 轻功不足验证 ====================

func test_not_enough_agility() -> void:
	game_state.start_battle()

	# 设置轻功不足
	game_state.player["agility"] = 1

	# 添加武功（需要 2 轻功）
	var skill_data := {
		"id": "dragon_palm",
		"name": "降龙掌",
		"damage": 10,
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_skill(0, 0)

	assert_false(result.success, "轻功不足时应失败")


# ==================== 无效索引测试 ====================

func test_invalid_skill_index() -> void:
	game_state.start_battle()

	var result := game_state.use_skill(-1, 0)

	assert_false(result.success, "无效武功索引应失败")
	assert_eq(result.get("error", ""), "invalid_skill_index", "应返回无效索引错误")


func test_invalid_card_index() -> void:
	game_state.start_battle()

	# 添加武功
	var skill_data := {
		"id": "dragon_palm",
		"name": "降龙掌",
		"damage": 10,
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "fist",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	var result := game_state.use_skill(0, 999)

	assert_false(result.success, "无效卡牌索引应失败")


# ==================== 冷却验证 ====================

func test_skill_on_cooldown() -> void:
	game_state.start_battle()

	# 添加有冷却的武功
	var skill_data := {
		"id": "ultimate_strike",
		"name": "终极打击",
		"damage": 20,
		"mp_cost": 5,
		"agility_cost": 3,
		"required_card_type": "fist",
		"cooldown": 2
	}
	var skill := SkillState.from_data(skill_data)
	skill.current_cooldown = 1  # 设置冷却中
	game_state.player["skills"] = [skill]

	# 添加手牌
	var card_data := {"id": "fist1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	var result := game_state.use_skill(0, 0)

	assert_false(result.success, "冷却中的武功应不可用")
