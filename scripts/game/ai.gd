class_name AI
extends RefCounted

## AI 决策系统 - 控制敌人自动行动
## 支持不同难度级别的决策逻辑

# ==================== 枚举定义 ====================

## AI 难度级别
enum AIDifficulty {
	EASY,    # 简单：随机选择，较少使用武功
	NORMAL,  # 普通：基础策略，适度使用武功
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

# ==================== 状态变量 ====================

## 战斗管理器引用
var battle_manager: BattleManager

## 当前难度
var difficulty: AIDifficulty = AIDifficulty.NORMAL

## 随机数生成器
var _rng: RandomNumberGenerator


## 初始化 AI
func _init(manager: BattleManager, ai_difficulty: AIDifficulty = AIDifficulty.NORMAL) -> void:
	battle_manager = manager
	difficulty = ai_difficulty
	_rng = RandomNumberGenerator.new()
	_rng.randomize()


# ==================== 主要接口 ====================

## 执行 AI 回合
func execute_turn() -> void:
	var actor: Character = battle_manager.current_actor
	if actor == null or actor != battle_manager.enemy:
		return

	# 延迟执行，让玩家看到 AI 思考
	await _delay(_get_decision_delay())

	var action_count := 0

	while _can_continue_action(actor) and action_count < MAX_ACTIONS_PER_TURN:
		# 检查是否有敌人存活
		var target: Character = _get_target()
		if target == null:
			break

		# 决定行动
		var action: Dictionary = decide_action(actor, target)
		if action.is_empty():
			break

		action_count += 1

		# 执行行动
		_execute_action(action, target)

		# 检查是否切换行动方
		if battle_manager.current_actor != actor:
			break

		# 检查战斗是否结束
		if battle_manager.player.is_dead() or battle_manager.enemy.is_dead():
			break

		await _delay(_get_action_delay())


## 决定行动 - 返回标准 Dictionary
## 返回格式: { "type": "card"|"skill"|"pass", "card_index": int, "skill_index": int }
func decide_action(actor: Character, target: Character) -> Dictionary:
	# 获取所有可用行动
	var available_actions: Dictionary = actor.get_available_actions()

	# 如果没有可用行动，跳过
	if available_actions.cards.is_empty() and available_actions.skills.is_empty():
		return {"type": "pass"}

	# 评估所有可能的行动
	var best_action: Dictionary = {}
	var best_score: float = -INF

	# 评估基础招式卡牌
	for card_index: int in available_actions.cards:
		var score: float = evaluate_card(actor, target, card_index)
		score = _apply_random_factor(score)

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
		score = _apply_random_factor(score)

		if score > best_score:
			best_score = score
			# 找到合适的媒介卡牌
			var skill: SkillState = actor.skills[skill_index]
			var card_indices: Array[int] = skill.get_available_card_indices(actor.hand)
			if not card_indices.is_empty():
				best_action = {
					"type": "skill",
					"skill_index": skill_index,
					"card_index": card_indices[0]  # 选择第一张可用卡牌
				}

	return best_action


## 评估卡牌 - 返回 float 分数
func evaluate_card(actor: Character, target: Character, card_index: int) -> float:
	if card_index < 0 or card_index >= actor.hand.size():
		return -INF

	var card: CardState = actor.hand[card_index]
	var score: float = 0.0

	# 伤害评分
	var damage: int = card.base_damage
	if damage > 0:
		# 考虑护盾
		var effective_damage: int = damage
		if target.shield > 0:
			effective_damage = maxi(0, damage - target.shield)

		# 伤害价值：越高越好
		score += effective_damage * 10.0

		# 击杀奖励
		if effective_damage >= target.current_hp:
			score += 100.0

	# 防御评分
	var defense: int = card.base_shield
	if defense > 0:
		# 低血量时防御更有价值
		var hp_ratio: float = float(actor.current_hp) / float(actor.max_hp)
		if hp_ratio < 0.5:
			score += defense * 8.0
		else:
			score += defense * 3.0

	# 治疗评分
	var heal: int = card.base_heal
	if heal > 0:
		# 低血量时治疗更有价值
		var hp_ratio: float = float(actor.current_hp) / float(actor.max_hp)
		var heal_value: int = mini(heal, actor.max_hp - actor.current_hp)
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
func evaluate_skill(actor: Character, target: Character, skill_index: int) -> float:
	if skill_index < 0 or skill_index >= actor.skills.size():
		return -INF

	var skill: SkillState = actor.skills[skill_index]

	# 检查是否可用
	if not skill.is_available(actor.current_mp, actor.current_agility, actor.hand):
		return -INF

	var score: float = 0.0

	# 伤害评分
	var damage: int = skill.damage
	if damage > 0:
		var effective_damage: int = damage
		if target.shield > 0:
			effective_damage = maxi(0, damage - target.shield)

		score += effective_damage * 12.0  # 武功伤害权重更高

		# 击杀奖励
		if effective_damage >= target.current_hp:
			score += 150.0

	# 特殊效果评分
	var effects: Array = skill.effects
	for effect: Dictionary in effects:
		var effect_score: float = _evaluate_effect(actor, target, effect)
		score += effect_score

	# 内力消耗惩罚
	var mp_cost: int = skill.mp_cost
	if mp_cost > 0:
		var mp_ratio: float = float(actor.current_mp) / float(actor.max_mp)
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


# ==================== 内部方法 ====================

## 评估特殊效果
func _evaluate_effect(actor: Character, target: Character, effect: Dictionary) -> float:
	var effect_type: String = effect.get("type", "")
	var value: int = effect.get("value", 0)
	var score: float = 0.0

	match effect_type:
		"heal":
			var hp_ratio: float = float(actor.current_hp) / float(actor.max_hp)
			if hp_ratio < 0.3:
				score += value * 15.0
			elif hp_ratio < 0.6:
				score += value * 8.0
			else:
				score += value * 3.0

		"shield":
			var hp_ratio: float = float(actor.current_hp) / float(actor.max_hp)
			if hp_ratio < 0.5:
				score += value * 10.0
			else:
				score += value * 4.0

		"damage":
			score += value * 8.0

		"mp_recover":
			var mp_ratio: float = float(actor.current_mp) / float(actor.max_mp)
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
func _apply_random_factor(score: float) -> float:
	var random_factor: float = RANDOM_FACTOR_BY_DIFFICULTY.get(difficulty, 0.0)
	if random_factor > 0.0:
		var noise: float = _rng.randf_range(-random_factor * 50.0, random_factor * 50.0)
		return score + noise
	return score


## 获取决策延迟
func _get_decision_delay() -> float:
	return DELAY_BY_DIFFICULTY.get(difficulty, 0.8)


## 获取行动延迟
func _get_action_delay() -> float:
	return DELAY_BY_DIFFICULTY.get(difficulty, 0.8) * 0.75


## 检查是否可以继续行动
func _can_continue_action(actor: Character) -> bool:
	return actor.current_agility > 0 and not actor.is_dead()


## 获取目标（玩家）
func _get_target() -> Character:
	if battle_manager.player.is_dead():
		return null
	return battle_manager.player


## 执行行动
func _execute_action(action: Dictionary, target: Character) -> void:
	if action.is_empty():
		return

	var action_type: String = action.get("type", "")

	match action_type:
		"card":
			var card_index: int = action.get("card_index", -1)
			if card_index >= 0:
				battle_manager.play_card(card_index)

		"skill":
			var skill_index: int = action.get("skill_index", -1)
			var card_index: int = action.get("card_index", -1)
			if skill_index >= 0 and card_index >= 0:
				var skill: SkillState = battle_manager.enemy.skills[skill_index]
				battle_manager.use_skill(skill.skill_id, card_index)

		"pass":
			# 不执行任何行动
			pass


## 延迟函数
func _delay(seconds: float) -> void:
	await battle_manager.get_tree().create_timer(seconds).timeout


# ==================== 工具方法 ====================

## 设置难度
func set_difficulty(new_difficulty: AIDifficulty) -> void:
	difficulty = new_difficulty


## 获取当前难度
func get_difficulty() -> AIDifficulty:
	return difficulty


## 获取难度名称
func get_difficulty_name() -> String:
	match difficulty:
		AIDifficulty.EASY:
			return "简单"
		AIDifficulty.NORMAL:
			return "普通"
		AIDifficulty.HARD:
			return "困难"
		_:
			return "未知"
