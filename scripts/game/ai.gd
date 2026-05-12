## ai.gd - AI 决策系统
## 控制敌人自动行动，支持不同难度级别
## 设计原则：完全静态化，使用 Engine.get_main_loop().create_timer() 实现延迟

class_name AI
extends RefCounted

# ==================== 枚举定义 ====================

## AI 难度级别
enum AIDifficulty {
	EASY,    # 简单：随机选择，较少使用武功
	NORMAL,   # 普通：基础策略，适度使用武功
	HARD     # 困难：优化策略，充分利用武功
}

# ==================== 配置常量 ====================

## 不同难度的决策延迟（秒）
const DELAY_BY_DIFFICULTY: Dictionary = {
	AIDifficulty.EASY: 1.2,
	AIDifficulty.NORMAL: 0.8,
	AIDifficulty.HARD: 0.5
}

## 不同难度的武功使用权重
const SKILL_WEIGHT_BY_DIFFICULTY: Dictionary = {
	AIDifficulty.EASY: 0.3,
	AIDifficulty.NORMAL: 0.6,
	AIDifficulty.HARD: 1.0
}

## 不同难度的随机因子（0-1，越高越随机）
const RANDOM_FACTOR_BY_DIFFICULTY: Dictionary = {
	AIDifficulty.EASY: 0.5,
	AIDifficulty.NORMAL: 0.2,
	AIDifficulty.HARD: 0.05
}

## 最大行动次数（防止无限循环）
const MAX_ACTIONS_PER_TURN: int = 10


# ==================== 静态方法 ====================

## 执行 AI 回合
## game_state: GameState 实例
## difficulty: AI 难度
## on_complete: 完成回调
static func execute_turn(game_state: GameState, difficulty: AIDifficulty = AIDifficulty.NORMAL, on_complete: Callable = Callable()) -> void:
	var actor: Dictionary = game_state.current_actor
	if actor.is_empty() or actor != game_state.enemy:
		if on_complete.is_valid():
			on_complete.call()
		return

	# 延迟执行，让玩家看到 AI 思考
	await _delay(_get_decision_delay(difficulty))

	var action_count := 0

	while _can_continue_action(actor) and action_count < MAX_ACTIONS_PER_TURN:
		# 检查是否有目标存活
		var target: Dictionary = game_state.get_opponent(actor)
		if target.is_empty() or CharacterState.is_dead(target):
			break

		# 决定行动
		var action: Dictionary = decide_action(actor, target, game_state, difficulty)
		if action.is_empty():
			break

		action_count += 1

		# 执行行动
		_execute_action(game_state, action, target)

		# 检查是否切换行动方
		if game_state.current_actor != actor:
			break

		# 检查战斗是否结束
		if game_state.is_battle_over():
			break

		await _delay(_get_action_delay(difficulty))

	if on_complete.is_valid():
		on_complete.call()


## 决定行动 - 返回标准 Dictionary
## 返回格式: { "type": "card"|"skill"|"pass", "card_index": int, "skill_index": int }
static func decide_action(actor: Dictionary, target: Dictionary, game_state: GameState, difficulty: AIDifficulty = AIDifficulty.NORMAL) -> Dictionary:
	# 获取所有可用行动
	var available_actions: Dictionary = CharacterState.get_available_actions(actor)

	# 如果没有可用行动，跳过
	if available_actions.cards.is_empty() and available_actions.skills.is_empty():
		return {"type": "pass"}

	# 评估所有可能的行动
	var best_action: Dictionary = {}
	var best_score: float = -INF

	# 评估基础招式卡牌
	for card_index: int in available_actions.cards:
		var score: float = evaluate_card(actor, target, card_index)
		score = _apply_random_factor(score, difficulty)

		if score > best_score:
			best_score = score
			best_action = {
				"type": "card",
				"card_index": card_index
			}

	# 评估武功招式（根据难度调整权重）
	var skill_weight: float = SKILL_WEIGHT_BY_DIFFICULTY.get(difficulty, 0.6)
	for skill_index: int in available_actions.skills:
		var score: float = evaluate_skill(actor, target, skill_index) * skill_weight
		score = _apply_random_factor(score, difficulty)

		if score > best_score:
			best_score = score
			# 找到合适的媒介卡牌
			var skills: Array = actor.get("skills", [])
			if skill_index >= 0 and skill_index < skills.size():
				var skill: SkillState = skills[skill_index]
				var hand: Array = actor.get("hand", [])
				var card_indices: Array[int] = skill.get_available_card_indices(hand)
				if not card_indices.is_empty():
					best_action = {
						"type": "skill",
						"skill_index": skill_index,
						"card_index": card_indices[0]  # 选择第一张可用卡牌
					}

	return best_action


## 评估卡牌 - 返回 float 分数
static func evaluate_card(actor: Dictionary, target: Dictionary, card_index: int) -> float:
	var hand: Array = actor.get("hand", [])
	if card_index < 0 or card_index >= hand.size():
		return -INF

	var card: CardState = hand[card_index]
	var score: float = 0.0

	var target_shield: int = target.get("shield", 0)
	var target_hp: int = target.get("hp", 0)
	var actor_hp: int = actor.get("hp", 0)
	var actor_max_hp: int = actor.get("max_hp", 60)
	var actor_mp: int = actor.get("mp", 0)
	var actor_max_mp: int = actor.get("max_mp", 20)

	# 伤害评分
	var damage: int = card.base_damage
	if damage > 0:
		# 考虑护盾
		var effective_damage: int = damage
		if target_shield > 0:
			effective_damage = maxi(0, damage - target_shield)

		# 伤害价值：越高越好
		score += effective_damage * 10.0

		# 击杀奖励
		if effective_damage >= target_hp:
			score += 100.0

	# 防御评分
	var defense: int = card.base_shield
	if defense > 0:
		# 低血量时防御更有价值
		var hp_ratio: float = float(actor_hp) / float(actor_max_hp)
		if hp_ratio < 0.5:
			score += defense * 8.0
		else:
			score += defense * 3.0

	# 治疗评分
	var heal: int = card.base_heal
	if heal > 0:
		# 低血量时治疗更有价值
		var hp_ratio: float = float(actor_hp) / float(actor_max_hp)
		var heal_value: int = mini(heal, actor_max_hp - actor_hp)
		if hp_ratio < 0.3:
			score += heal_value * 12.0
		elif hp_ratio < 0.6:
			score += heal_value * 6.0
		else:
			score += heal_value * 2.0

	# 效率评分（伤害/轻功消耗）
	var agility_cost: int = card.agility_cost
	if agility_cost > 0 and damage > 0:
		var efficiency: float = float(damage) / float(agility_cost)
		score += efficiency * 5.0

	return score


## 评估武功招式 - 返回 float 分数
static func evaluate_skill(actor: Dictionary, target: Dictionary, skill_index: int) -> float:
	var skills: Array = actor.get("skills", [])
	if skill_index < 0 or skill_index >= skills.size():
		return -INF

	var skill: SkillState = skills[skill_index]
	var actor_mp: int = actor.get("mp", 0)
	var actor_max_mp: int = actor.get("max_mp", 20)
	var actor_agility: int = actor.get("agility", 0)
	var hand: Array = actor.get("hand", [])

	# 检查是否可用
	if not skill.is_available(actor_mp, actor_agility, hand):
		return -INF

	var score: float = 0.0

	var target_shield: int = target.get("shield", 0)
	var target_hp: int = target.get("hp", 0)

	# 伤害评分
	var damage: int = skill.damage
	if damage > 0:
		var effective_damage: int = damage
		if target_shield > 0:
			effective_damage = maxi(0, damage - target_shield)

		score += effective_damage * 12.0  # 武功伤害权重更高

		# 击杀奖励
		if effective_damage >= target_hp:
			score += 150.0

	# 特殊效果评分
	var effects: Array = skill.effects
	for effect: Dictionary in effects:
		var effect_score: float = _evaluate_effect(actor, target, effect)
		score += effect_score

	# 内力消耗惩罚
	var mp_cost: int = skill.mp_cost
	if mp_cost > 0:
		var mp_ratio: float = float(actor_mp) / float(actor_max_mp)
		# 内力不足时惩罚更大
		if mp_ratio < 0.3:
			score -= mp_cost * 3.0
		else:
			score -= mp_cost * 1.0

	# 轻功效率
	var agility_cost: int = skill.agility_cost
	if agility_cost > 0 and damage > 0:
		var efficiency: float = float(damage) / float(agility_cost)
		score += efficiency * 4.0

	return score


# ==================== 内部静态方法 ====================

## 评估特殊效果
static func _evaluate_effect(actor: Dictionary, target: Dictionary, effect: Dictionary) -> float:
	var effect_type: String = effect.get("type", "")
	var value: int = effect.get("value", 0)
	var score: float = 0.0

	var actor_hp: int = actor.get("hp", 0)
	var actor_max_hp: int = actor.get("max_hp", 60)
	var actor_mp: int = actor.get("mp", 0)
	var actor_max_mp: int = actor.get("max_mp", 20)

	match effect_type:
		"heal":
			var hp_ratio: float = float(actor_hp) / float(actor_max_hp)
			if hp_ratio < 0.3:
				score += value * 15.0
			elif hp_ratio < 0.6:
				score += value * 8.0
			else:
				score += value * 3.0

		"shield":
			var hp_ratio: float = float(actor_hp) / float(actor_max_hp)
			if hp_ratio < 0.5:
				score += value * 10.0
			else:
				score += value * 4.0

		"damage":
			score += value * 8.0

		"mp_recover":
			var mp_ratio: float = float(actor_mp) / float(actor_max_mp)
			if mp_ratio < 0.3:
				score += value * 12.0
			else:
				score += value * 4.0

		"agility_boost":
			# 轻功提升可以增加行动次数
			score += value * 6.0

		_:
			# 未知效果给予基础分
			score += 5.0

	return score


## 应用随机因子（根据难度）
static func _apply_random_factor(score: float, difficulty: AIDifficulty) -> float:
	var random_factor: float = RANDOM_FACTOR_BY_DIFFICULTY.get(difficulty, 0.0)
	if random_factor > 0.0:
		var noise: float = randf_range(-random_factor * 50.0, random_factor * 50.0)
		return score + noise
	return score


## 获取决策延迟
static func _get_decision_delay(difficulty: AIDifficulty) -> float:
	return DELAY_BY_DIFFICULTY.get(difficulty, 0.8)


## 获取行动延迟
static func _get_action_delay(difficulty: AIDifficulty) -> float:
	return DELAY_BY_DIFFICULTY.get(difficulty, 0.8) * 0.75


## 检查是否可以继续行动
static func _can_continue_action(actor: Dictionary) -> bool:
	var agility: int = actor.get("agility", 0)
	return agility > 0 and not CharacterState.is_dead(actor)


## 执行行动
static func _execute_action(game_state: GameState, action: Dictionary, target: Dictionary) -> void:
	if action.is_empty():
		return

	var action_type: String = action.get("type", "")

	match action_type:
		"card":
			var card_index: int = action.get("card_index", -1)
			if card_index >= 0:
				game_state.use_basic_card(card_index)

		"skill":
			var skill_index: int = action.get("skill_index", -1)
			var card_index: int = action.get("card_index", -1)
			if skill_index >= 0 and card_index >= 0:
				game_state.use_skill(skill_index, card_index)

		"pass":
			# 不执行任何行动
			pass


## 延迟函数
static func _delay(seconds: float) -> void:
	var scene_tree: SceneTree = Engine.get_main_loop() as SceneTree
	if scene_tree != null:
		await scene_tree.create_timer(seconds).timeout


# ==================== 工具方法 ====================

## 获取难度名称
static func get_difficulty_name(difficulty: AIDifficulty) -> String:
	match difficulty:
		AIDifficulty.EASY:
			return "简单"
		AIDifficulty.NORMAL:
			return "普通"
		AIDifficulty.HARD:
			return "困难"
		_:
			return "未知"
