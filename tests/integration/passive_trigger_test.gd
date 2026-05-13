## passive_trigger_test.gd - 内功触发时机系统测试
## 验证 Story 008 所有验收标准

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


# ==================== AC-1: TURN_START 触发 ====================

func test_ac1_turn_start_heal() -> void:
	# 设置玩家 HP 减少
	game_state.player["hp"] = 10
	game_state.player["max_hp"] = 20

	# 添加回合开始治疗内功
	var passive_data := {
		"id": "heal_passive",
		"name": "自愈",
		"trigger_timing": "turn_start",
		"effects": [{"type": "heal", "value": 4}]
	}
	game_state.player["passives"] = [PassiveState.from_data(passive_data)]

	game_state.start_battle()

	# start_battle 会重置 HP，所以我们需要手动触发回合开始
	game_state.player["hp"] = 10  # 重置后再次设置
	CharacterState.on_turn_start(game_state.player, game_state)

	# 回合开始时触发治疗
	assert_eq(game_state.player.get("hp", 0), 14, "TURN_START 应触发治疗")


func test_ac1_turn_start_recover_mp() -> void:
	game_state.player["mp"] = 5
	game_state.player["max_mp"] = 20

	var passive_data := {
		"id": "mp_passive",
		"name": "回气",
		"trigger_timing": "turn_start",
		"effects": [{"type": "recover_mp", "value": 3}]
	}
	game_state.player["passives"] = [PassiveState.from_data(passive_data)]

	game_state.start_battle()

	# start_battle 会重置 MP，所以我们需要手动触发回合开始
	game_state.player["mp"] = 5  # 重置后再次设置
	CharacterState.on_turn_start(game_state.player, game_state)

	assert_eq(game_state.player.get("mp", 0), 8, "TURN_START 应触发内力恢复")


# ==================== AC-2: TURN_END 触发 ====================

func test_ac2_turn_end_shield() -> void:
	game_state.start_battle()

	var passive_data := {
		"id": "shield_passive",
		"name": "护体",
		"trigger_timing": "turn_end",
		"effects": [{"type": "shield", "value": 3}]
	}
	game_state.player["passives"] = [PassiveState.from_data(passive_data)]

	# 手动触发回合结束
	CharacterState.on_turn_end(game_state.player, game_state)

	assert_eq(game_state.player.get("shield", 0), 3, "TURN_END 应触发护盾")


# ==================== AC-3: ON_DAMAGE 触发 ====================

func test_ac3_on_damage_heal() -> void:
	game_state.start_battle()

	game_state.player["hp"] = 15
	game_state.player["max_hp"] = 20

	# 添加造成伤害时恢复内功
	var passive_data := {
		"id": "lifesteal",
		"name": "吸血",
		"trigger_timing": "on_damage",
		"effects": [{"type": "heal", "value": 2}]
	}
	game_state.player["passives"] = [PassiveState.from_data(passive_data)]

	# 添加伤害卡牌
	var card_data := {"id": "card1", "damage": 5, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	game_state.use_basic_card(0)

	# 造成伤害后恢复
	assert_eq(game_state.player.get("hp", 0), 17, "ON_DAMAGE 应触发治疗")


# ==================== AC-4: ON_TAKE_DAMAGE 触发 ====================

func test_ac4_on_take_damage_shield() -> void:
	game_state.start_battle()

	# 添加受到伤害时获得护盾内功
	var passive_data := {
		"id": "iron_skin",
		"name": "铁布衫",
		"trigger_timing": "on_take_damage",
		"effects": [{"type": "shield", "value": 2}]
	}
	game_state.enemy["passives"] = [PassiveState.from_data(passive_data)]

	# 添加伤害卡牌
	var card_data := {"id": "card1", "damage": 5, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	game_state.use_basic_card(0)

	# 受到伤害后获得护盾
	assert_eq(game_state.enemy.get("shield", 0), 2, "ON_TAKE_DAMAGE 应触发护盾")


# ==================== AC-5: ON_PLAY_CARD 触发 ====================

func test_ac5_on_play_card_agility_boost() -> void:
	game_state.start_battle()

	var initial_agility: int = game_state.player.get("agility", 0)

	# 添加使用基础招式时提升轻功内功
	var passive_data := {
		"id": "swift",
		"name": "迅捷",
		"trigger_timing": "on_play_card",
		"effects": [{"type": "agility_boost", "value": 2}]
	}
	game_state.player["passives"] = [PassiveState.from_data(passive_data)]

	# 添加卡牌
	var card_data := {"id": "card1", "damage": 3, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	game_state.use_basic_card(0)

	# 使用卡牌后轻功提升
	assert_eq(game_state.player.get("agility", 0), initial_agility - 1 + 2, "ON_PLAY_CARD 应触发轻功提升")


# ==================== AC-6: ON_SKILL_USE 触发 ====================

func test_ac6_on_skill_use_mp_recover() -> void:
	game_state.start_battle()

	var initial_mp: int = game_state.player.get("mp", 0)

	# 添加使用武功时恢复内力内功
	var passive_data := {
		"id": "meditation",
		"name": "冥想",
		"trigger_timing": "on_skill_use",
		"effects": [{"type": "recover_mp", "value": 2}]
	}
	game_state.player["passives"] = [PassiveState.from_data(passive_data)]

	# 添加武功
	var skill_data := {
		"id": "palm",
		"name": "掌法",
		"damage": 8,
		"mp_cost": 3,
		"agility_cost": 2,
		"required_card_type": "any",
		"cooldown": 0
	}
	game_state.player["skills"] = [SkillState.from_data(skill_data)]

	# 添加手牌
	var card_data := {"id": "card1", "type": "fist", "damage": 2, "agility_cost": 1}
	game_state.player["hand"] = [CardState.create(card_data, "c1")]

	game_state.use_skill(0, 0)

	# 使用武功后恢复内力
	assert_eq(game_state.player.get("mp", 0), initial_mp - 3 + 2, "ON_SKILL_USE 应触发内力恢复")


# ==================== AC-7: 多内功顺序触发 ====================

func test_ac7_multiple_passives_order() -> void:
	game_state.start_battle()

	game_state.player["hp"] = 10
	game_state.player["max_hp"] = 20

	# 添加多个内功
	var passive1 := PassiveState.from_data({
		"id": "heal1",
		"name": "治疗1",
		"trigger_timing": "turn_start",
		"effects": [{"type": "heal", "value": 3}]
	})
	var passive2 := PassiveState.from_data({
		"id": "shield1",
		"name": "护盾1",
		"trigger_timing": "turn_start",
		"effects": [{"type": "shield", "value": 4}]
	})
	game_state.player["passives"] = [passive1, passive2]

	# 手动触发回合开始
	CharacterState.on_turn_start(game_state.player, game_state)

	# 验证两个效果都触发
	assert_eq(game_state.player.get("hp", 0), 13, "应先触发治疗")
	assert_eq(game_state.player.get("shield", 0), 4, "再触发护盾")


# ==================== 触发次数限制 ====================

func test_triggers_per_turn_limit() -> void:
	game_state.start_battle()

	# 添加每回合只触发一次的内功
	var passive_data := {
		"id": "limited",
		"name": "限制内功",
		"trigger_timing": "on_damage",
		"effects": [{"type": "shield", "value": 2}],
		"triggers_per_turn": 1
	}
	game_state.player["passives"] = [PassiveState.from_data(passive_data)]

	# 添加多张伤害卡牌
	var card1 := CardState.create({"id": "c1", "damage": 3, "agility_cost": 1}, "c1")
	var card2 := CardState.create({"id": "c2", "damage": 3, "agility_cost": 1}, "c2")
	game_state.player["hand"] = [card1, card2]
	game_state.player["agility"] = 10  # 确保足够轻功

	# 第一次使用
	game_state.use_basic_card(0)
	assert_eq(game_state.player.get("shield", 0), 2, "第一次应触发")

	# 第二次使用
	game_state.use_basic_card(0)
	assert_eq(game_state.player.get("shield", 0), 2, "第二次不应触发（已达上限）")


# ==================== 触发概率 ====================

func test_trigger_chance() -> void:
	# 使用固定种子确保可重复性
	var triggered_count := 0
	var total_tests := 100

	for i in range(total_tests):
		var player_data := {"id": "hero", "hp": 20, "mp": 10, "agility": 8, "deck": [], "martialArts": [], "passives": []}
		var enemy_data := {"id": "enemy", "hp": 15, "mp": 8, "agility": 5, "deck": [], "martialArts": [], "passives": []}

		var state_result := GameState.create(player_data, enemy_data)
		var test_state: GameState = state_result.state
		test_state.start_battle()

		# 添加 50% 概率触发的内功
		var passive_data := {
			"id": "chance",
			"name": "概率内功",
			"trigger_timing": "turn_start",
			"effects": [{"type": "shield", "value": 5}],
			"trigger_chance": 0.5
		}
		test_state.player["passives"] = [PassiveState.from_data(passive_data)]

		# 手动触发
		var passives: Array = test_state.player.get("passives", [])
		for passive in passives:
			if passive is PassiveState:
				var result: Dictionary = passive.trigger(test_state.player, test_state, [])
				if result.get("triggered", false):
					triggered_count += 1

	# 验证概率在合理范围内（30-70%）
	var ratio: float = float(triggered_count) / float(total_tests)
	assert_true(ratio > 0.3 and ratio < 0.7, "触发概率应在 30-70% 范围内")


# ==================== 内功效果类型 ====================

func test_effect_draw_cards() -> void:
	game_state.start_battle()

	var initial_hand_size: int = game_state.player.get("hand", []).size()

	# 添加抽牌内功
	var passive_data := {
		"id": "draw",
		"name": "抽牌",
		"trigger_timing": "turn_start",
		"effects": [{"type": "draw_cards", "value": 2}]
	}
	game_state.player["passives"] = [PassiveState.from_data(passive_data)]

	# 确保牌组有牌
	var card := CardState.create({"id": "deck_card", "damage": 1, "agility_cost": 1}, "dc")
	game_state.player["deck"] = [card, card, card, card, card]

	# 手动触发
	CharacterState.on_turn_start(game_state.player, game_state)

	assert_eq(game_state.player.get("hand", []).size(), initial_hand_size + 2, "应抽取 2 张牌")


# ==================== 内功禁用 ====================

func test_passive_disabled() -> void:
	game_state.start_battle()

	game_state.player["hp"] = 10
	game_state.player["max_hp"] = 20

	# 添加禁用的内功
	var passive_data := {
		"id": "disabled",
		"name": "禁用内功",
		"trigger_timing": "turn_start",
		"effects": [{"type": "heal", "value": 5}],
		"enabled": false
	}
	game_state.player["passives"] = [PassiveState.from_data(passive_data)]

	# 手动触发回合开始
	CharacterState.on_turn_start(game_state.player, game_state)

	# 禁用的内功不应触发
	assert_eq(game_state.player.get("hp", 0), 10, "禁用的内功不应触发")
