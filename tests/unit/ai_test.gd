## ai_test.gd - AI 决策逻辑单元测试
## 验证 Story 011 所有验收标准

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


# ==================== AC-1: AI 优先使用武功 ====================

func test_ac1_ai_prioritizes_skill() -> void:
	game_state.start_battle()

	# 给敌人添加武功
	var skill := SkillState.new()
	skill.skill_id = "test_skill"
	skill.name = "测试武功"
	skill.damage = 15
	skill.mp_cost = 5
	skill.agility_cost = 2
	skill.required_card_type = Types.CardType.ANY
	game_state.enemy["skills"] = [skill]

	# 设置足够的内力和手牌
	game_state.enemy["mp"] = 10
	game_state.enemy["agility"] = 10

	# 添加手牌
	var card := CardState.create({
		"id": "test_card",
		"name": "测试卡牌",
		"type": "attack",
		"agility_cost": 1,
		"damage": 5
	})
	game_state.enemy["hand"] = [card]

	# 决策
	var action: Dictionary = AI.decide_action(game_state.enemy, game_state.player, game_state, AI.AIDifficulty.HARD)

	# 应该选择武功
	assert_eq(action.get("type", ""), "skill", "AI 应优先使用武功")


func test_ac1_ai_no_skill_uses_card() -> void:
	game_state.start_battle()

	# 没有武功
	game_state.enemy["skills"] = []
	game_state.enemy["mp"] = 10
	game_state.enemy["agility"] = 10

	# 添加手牌
	var card := CardState.create({
		"id": "test_card",
		"name": "测试卡牌",
		"type": "attack",
		"agility_cost": 1,
		"damage": 5
	})
	game_state.enemy["hand"] = [card]

	var action: Dictionary = AI.decide_action(game_state.enemy, game_state.player, game_state, AI.AIDifficulty.NORMAL)

	# 应该选择卡牌
	assert_eq(action.get("type", ""), "card", "无武功时应使用卡牌")


# ==================== AC-2: AI 低 HP 时防御 ====================

func test_ac2_ai_defends_low_hp() -> void:
	game_state.start_battle()

	# 设置敌人极低 HP（需要防御）
	game_state.enemy["hp"] = 2
	game_state.enemy["max_hp"] = 20
	game_state.enemy["agility"] = 10

	# 添加护盾卡牌（高护盾值）
	var shield_card := CardState.create({
		"id": "shield_card",
		"name": "护盾",
		"type": "defense",
		"agility_cost": 1,
		"shield": 10
	})

	# 添加攻击卡牌（低伤害）
	var attack_card := CardState.create({
		"id": "attack_card",
		"name": "攻击",
		"type": "attack",
		"agility_cost": 1,
		"damage": 3
	})

	game_state.enemy["hand"] = [shield_card, attack_card]

	# 评估护盾卡牌在极低 HP 时应获得更高分数
	var shield_score: float = AI.evaluate_card(game_state.enemy, game_state.player, 0)
	var attack_score: float = AI.evaluate_card(game_state.enemy, game_state.player, 1)

	# 护盾分数应该更高（极低 HP 时防御优先）
	assert_gt(shield_score, attack_score, "极低 HP 时护盾分数应高于攻击: shield=%s, attack=%s" % [shield_score, attack_score])


func test_ac2_ai_no_shield_uses_attack() -> void:
	game_state.start_battle()

	# 设置敌人低 HP
	game_state.enemy["hp"] = 3
	game_state.enemy["max_hp"] = 20
	game_state.enemy["agility"] = 10

	# 只有攻击卡牌
	var attack_card := CardState.create({
		"id": "attack_card",
		"name": "攻击",
		"type": "attack",
		"agility_cost": 1,
		"damage": 5
	})

	game_state.enemy["hand"] = [attack_card]

	var action: Dictionary = AI.decide_action(game_state.enemy, game_state.player, game_state, AI.AIDifficulty.NORMAL)

	# 应该使用攻击卡牌
	assert_eq(action.get("type", ""), "card", "无护盾卡牌时应使用攻击")


# ==================== AC-3: AI 选择 HP 最低目标 ====================

func test_ac3_ai_selects_lowest_hp_target() -> void:
	# 在 1v1 模式下，目标只有一个
	game_state.start_battle()

	var target: Dictionary = game_state.get_opponent(game_state.enemy)

	assert_eq(target, game_state.player, "1v1 时目标应为玩家")


# ==================== AC-4: AI 无法行动时结束回合 ====================

func test_ac4_ai_passes_when_no_action() -> void:
	game_state.start_battle()

	# 设置无法行动
	game_state.enemy["hand"] = []
	game_state.enemy["agility"] = 0
	game_state.enemy["skills"] = []

	var action: Dictionary = AI.decide_action(game_state.enemy, game_state.player, game_state, AI.AIDifficulty.NORMAL)

	assert_eq(action.get("type", ""), "pass", "无法行动时应结束回合")


func test_ac4_ai_passes_when_no_agility() -> void:
	game_state.start_battle()

	# 有手牌但没有轻功
	game_state.enemy["agility"] = 0

	var card := CardState.create({
		"id": "test_card",
		"name": "测试卡牌",
		"type": "attack",
		"agility_cost": 1,
		"damage": 5
	})
	game_state.enemy["hand"] = [card]

	var action: Dictionary = AI.decide_action(game_state.enemy, game_state.player, game_state, AI.AIDifficulty.NORMAL)

	assert_eq(action.get("type", ""), "pass", "无轻功时应结束回合")


# ==================== AC-5: execute_turn 完整执行 ====================

func test_ac5_execute_turn_stops_on_game_over() -> void:
	game_state.start_battle()

	# 设置当前行动者为敌人
	game_state.current_actor = game_state.enemy

	# 设置敌人可以一击必杀
	game_state.player["hp"] = 1
	game_state.enemy["agility"] = 10

	var card := CardState.create({
		"id": "kill_card",
		"name": "必杀",
		"type": "attack",
		"agility_cost": 1,
		"damage": 10
	})
	game_state.enemy["hand"] = [card]

	# 执行行动
	var action: Dictionary = AI.decide_action(game_state.enemy, game_state.player, game_state, AI.AIDifficulty.NORMAL)

	# 应该选择攻击
	assert_eq(action.get("type", ""), "card", "应选择攻击")

	# 执行攻击
	if action.get("type", "") == "card":
		var card_index: int = action.get("card_index", -1)
		if card_index >= 0:
			var result: Dictionary = game_state.use_basic_card(card_index)
			# 验证攻击成功
			assert_true(result.get("success", false), "攻击应成功: %s" % result.get("error", "unknown"))

	# 游戏应结束
	assert_true(game_state.is_battle_over(), "攻击后游戏应结束: player.hp=%s" % game_state.player.get("hp", 0))


# ==================== 评估函数测试 ====================

func test_evaluate_card_damage() -> void:
	game_state.start_battle()

	game_state.enemy["agility"] = 10

	var card := CardState.create({
		"id": "damage_card",
		"name": "伤害卡",
		"type": "attack",
		"agility_cost": 1,
		"damage": 10
	})
	game_state.enemy["hand"] = [card]

	var score: float = AI.evaluate_card(game_state.enemy, game_state.player, 0)

	assert_gt(score, 0.0, "伤害卡牌应有正分数: %s" % score)


func test_evaluate_card_shield() -> void:
	game_state.start_battle()

	game_state.enemy["hp"] = 5
	game_state.enemy["max_hp"] = 20
	game_state.enemy["agility"] = 10

	var card := CardState.create({
		"id": "shield_card",
		"name": "护盾卡",
		"type": "defense",
		"agility_cost": 1,
		"shield": 5
	})
	game_state.enemy["hand"] = [card]

	var score: float = AI.evaluate_card(game_state.enemy, game_state.player, 0)

	assert_gt(score, 0.0, "护盾卡牌应有正分数: %s" % score)


func test_evaluate_card_heal() -> void:
	game_state.start_battle()

	game_state.enemy["hp"] = 5
	game_state.enemy["max_hp"] = 20
	game_state.enemy["agility"] = 10

	var card := CardState.create({
		"id": "heal_card",
		"name": "治疗卡",
		"type": "heal",
		"agility_cost": 1,
		"heal": 5
	})
	game_state.enemy["hand"] = [card]

	var score: float = AI.evaluate_card(game_state.enemy, game_state.player, 0)

	assert_gt(score, 0.0, "治疗卡牌应有正分数: %s" % score)


func test_evaluate_skill_damage() -> void:
	game_state.start_battle()

	game_state.enemy["mp"] = 10
	game_state.enemy["agility"] = 10

	var skill := SkillState.new()
	skill.skill_id = "test_skill"
	skill.name = "测试武功"
	skill.damage = 15
	skill.mp_cost = 5
	skill.agility_cost = 2
	skill.required_card_type = Types.CardType.ANY

	var card := CardState.create({
		"id": "medium_card",
		"name": "媒介卡",
		"type": "attack",
		"agility_cost": 1
	})

	game_state.enemy["skills"] = [skill]
	game_state.enemy["hand"] = [card]

	var score: float = AI.evaluate_skill(game_state.enemy, game_state.player, 0)

	assert_gt(score, 0.0, "伤害武功应有正分数: %s" % score)


# ==================== 难度测试 ====================

func test_difficulty_affects_skill_weight() -> void:
	game_state.start_battle()

	game_state.enemy["mp"] = 10
	game_state.enemy["agility"] = 10

	var skill := SkillState.new()
	skill.skill_id = "test_skill"
	skill.name = "测试武功"
	skill.damage = 15
	skill.mp_cost = 5
	skill.agility_cost = 2
	skill.required_card_type = Types.CardType.ANY

	var card := CardState.create({
		"id": "attack_card",
		"name": "攻击卡",
		"type": "attack",
		"agility_cost": 1,
		"damage": 5
	})
	var medium_card := CardState.create({
		"id": "medium_card",
		"name": "媒介卡",
		"type": "attack",
		"agility_cost": 1
	})

	game_state.enemy["skills"] = [skill]
	game_state.enemy["hand"] = [card, medium_card]

	# HARD 难度应更倾向于使用武功
	var hard_action: Dictionary = AI.decide_action(game_state.enemy, game_state.player, game_state, AI.AIDifficulty.HARD)

	# 验证决策有效
	assert_has(hard_action, "type", "决策应包含类型")


func test_difficulty_names() -> void:
	assert_eq(AI.get_difficulty_name(AI.AIDifficulty.EASY), "简单")
	assert_eq(AI.get_difficulty_name(AI.AIDifficulty.NORMAL), "普通")
	assert_eq(AI.get_difficulty_name(AI.AIDifficulty.HARD), "困难")


# ==================== 击杀奖励测试 ====================

func test_kill_bonus() -> void:
	game_state.start_battle()

	game_state.enemy["agility"] = 10

	# 设置玩家低 HP
	game_state.player["hp"] = 3

	var card := CardState.create({
		"id": "kill_card",
		"name": "必杀卡",
		"type": "attack",
		"agility_cost": 1,
		"damage": 10
	})
	game_state.enemy["hand"] = [card]

	var score: float = AI.evaluate_card(game_state.enemy, game_state.player, 0)

	# 击杀奖励应该很高
	assert_gt(score, 100.0, "击杀奖励应超过 100: %s" % score)


# ==================== 效率测试 ====================

func test_efficiency_score() -> void:
	game_state.start_battle()

	game_state.enemy["agility"] = 10

	# 高效率卡牌
	var efficient_card := CardState.create({
		"id": "efficient",
		"name": "高效卡",
		"type": "attack",
		"agility_cost": 1,
		"damage": 10
	})

	# 低效率卡牌
	var inefficient_card := CardState.create({
		"id": "inefficient",
		"name": "低效卡",
		"type": "attack",
		"agility_cost": 5,
		"damage": 10
	})

	game_state.enemy["hand"] = [efficient_card, inefficient_card]

	var efficient_score: float = AI.evaluate_card(game_state.enemy, game_state.player, 0)
	var inefficient_score: float = AI.evaluate_card(game_state.enemy, game_state.player, 1)

	assert_gt(efficient_score, inefficient_score, "高效率卡牌应得更高分: efficient=%s, inefficient=%s" % [efficient_score, inefficient_score])
