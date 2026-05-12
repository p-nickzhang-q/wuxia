## character_state.gd - 角色状态字典辅助类
## 提供创建和操作角色状态字典的静态方法
## 设计原则：角色状态使用纯 Dictionary，此类提供工厂和辅助方法

class_name CharacterState
extends RefCounted


## 从数据字典创建角色状态字典
## 返回符合设计文档规范的 Dictionary
static func from_data(data: Dictionary) -> Dictionary:
	var state := {
		# 基础属性（上限值）
		"id": data.get("id", ""),
		"name": data.get("name", "未知角色"),
		"title": data.get("title", ""),
		"max_hp": data.get("hp", 60),
		"max_mp": data.get("mp", 20),
		"base_agility": data.get("agility", 10),

		# 当前状态
		"hp": data.get("hp", 60),  # 初始化为最大值
		"mp": data.get("mp", 20),
		"shield": 0,
		"agility": data.get("agility", 10),

		# 卡组系统
		"deck": [],
		"hand": [],
		"discard_pile": [],

		# 武功系统 - 存储 SkillState 实例
		"skills": [],

		# 内功系统 - 存储 PassiveState 实例
		"passives": [],
	}

	# 加载卡牌
	var deck_data: Array = data.get("deck", [])
	for card_id in deck_data:
		var card_data: Dictionary = GameManager.cards_data.get(card_id, {})
		if not card_data.is_empty():
			var card := CardState.create(card_data)
			state.deck.append(card)

	# 加载武功
	var skills_data: Array = data.get("martialArts", [])
	for skill_id in skills_data:
		var skill_data: Dictionary = GameManager.skills_data.get(skill_id, {})
		if not skill_data.is_empty():
			var skill := SkillState.from_data(skill_data)
			state.skills.append(skill)

	# 加载内功
	var passives_data: Array = data.get("passives", [])
	for passive_id in passives_data:
		var passive_data: Dictionary = GameManager.skills_data.get(passive_id, {})
		if not passive_data.is_empty():
			var passive := PassiveState.from_data(passive_data)
			state.passives.append(passive)

	return state


## 抽牌
## 返回抽出的卡牌数组
static func draw_cards(state: Dictionary, count: int) -> Array:
	var drawn: Array = []
	var deck: Array = state.get("deck", [])
	var hand: Array = state.get("hand", [])
	var discard_pile: Array = state.get("discard_pile", [])

	for i in range(count):
		if deck.is_empty():
			# 洗牌
			deck.append_array(discard_pile)
			discard_pile.clear()
			_shuffle_deck(state)
		if not deck.is_empty():
			var card: CardState = deck.pop_back()
			hand.append(card)
			drawn.append(card)

	state["deck"] = deck
	state["hand"] = hand
	state["discard_pile"] = discard_pile

	return drawn


## 打出卡牌
## 返回打出的卡牌，如果失败返回 null
static func play_card(state: Dictionary, card_index: int) -> CardState:
	var hand: Array = state.get("hand", [])
	var discard_pile: Array = state.get("discard_pile", [])

	if card_index >= 0 and card_index < hand.size():
		var card: CardState = hand.pop_at(card_index)
		discard_pile.append(card)
		state["hand"] = hand
		state["discard_pile"] = discard_pile
		return card
	return null


## 受到伤害
## 返回伤害结果字典
static func take_damage(state: Dictionary, amount: int, source: Dictionary = {}) -> Dictionary:
	var result := {
		"actual_damage": 0,
		"shield_absorbed": 0,
		"source": source
	}

	var actual_damage := amount
	var shield: int = state.get("shield", 0)
	var hp: int = state.get("hp", 0)

	# 先扣护盾
	if shield > 0:
		if shield >= amount:
			result.shield_absorbed = amount
			state["shield"] = shield - amount
			return result
		else:
			result.shield_absorbed = shield
			actual_damage = amount - shield
			state["shield"] = 0

	hp -= actual_damage
	if hp < 0:
		hp = 0
	state["hp"] = hp

	result.actual_damage = actual_damage
	return result


## 治疗
## 返回实际治疗量
static func heal(state: Dictionary, amount: int) -> int:
	var hp: int = state.get("hp", 0)
	var max_hp: int = state.get("max_hp", 60)

	var old_hp := hp
	hp = mini(hp + amount, max_hp)
	state["hp"] = hp

	return hp - old_hp


## 消耗内力
## 返回是否成功
static func use_mp(state: Dictionary, amount: int) -> bool:
	var mp: int = state.get("mp", 0)
	if mp >= amount:
		state["mp"] = mp - amount
		return true
	return false


## 恢复内力
static func recover_mp(state: Dictionary, amount: int) -> void:
	var mp: int = state.get("mp", 0)
	var max_mp: int = state.get("max_mp", 20)
	state["mp"] = mini(mp + amount, max_mp)


## 消耗轻功
## 返回是否成功
static func use_agility(state: Dictionary, amount: int) -> bool:
	var agility: int = state.get("agility", 0)
	if agility >= amount:
		state["agility"] = agility - amount
		return true
	return false


## 恢复轻功
static func recover_agility(state: Dictionary, amount: int) -> void:
	var agility: int = state.get("agility", 0)
	var base_agility: int = state.get("base_agility", 10)
	state["agility"] = mini(agility + amount, base_agility)


## 是否死亡
static func is_dead(state: Dictionary) -> bool:
	return state.get("hp", 0) <= 0


## 洗牌
static func _shuffle_deck(state: Dictionary) -> void:
	var deck: Array = state.get("deck", [])
	deck.shuffle()
	state["deck"] = deck


## 重置战斗状态
static func reset_for_battle(state: Dictionary) -> void:
	state["hp"] = state.get("max_hp", 60)
	state["mp"] = state.get("max_mp", 20)
	state["shield"] = 0
	state["agility"] = state.get("base_agility", 10)
	state["hand"] = []
	state["discard_pile"] = []

	# 重置所有武功冷却
	var skills: Array = state.get("skills", [])
	for skill in skills:
		if skill is SkillState:
			skill.current_cooldown = 0

	# 重置所有内功触发次数
	var passives: Array = state.get("passives", [])
	for passive in passives:
		if passive is PassiveState:
			passive.reset_turn_triggers()

	# 洗牌
	_shuffle_deck(state)


## 回合开始处理
static func on_turn_start(state: Dictionary, game_state) -> void:
	# 重置内功触发次数
	var passives: Array = state.get("passives", [])
	for passive in passives:
		if passive is PassiveState:
			passive.reset_turn_triggers()

	# 触发回合开始内功
	_trigger_passives(state, Types.TriggerTiming.TURN_START, game_state)


## 回合结束处理
static func on_turn_end(state: Dictionary, game_state) -> void:
	# 减少武功冷却
	var skills: Array = state.get("skills", [])
	for skill in skills:
		if skill is SkillState:
			skill.on_turn_end()

	# 触发回合结束内功
	_trigger_passives(state, Types.TriggerTiming.TURN_END, game_state)


## 触发内功
static func _trigger_passives(state: Dictionary, timing: Types.TriggerTiming, game_state, args: Array = []) -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	var passives: Array = state.get("passives", [])

	for passive in passives:
		if passive is PassiveState and passive.trigger_timing == timing:
			var passive_state: PassiveState = passive
			var result: Dictionary = passive_state.trigger(state, game_state, args)
			if result.get("triggered", false):
				results.append(result)

	return results


## 触发造成伤害时的内功
static func trigger_on_damage(state: Dictionary, game_state, target: Dictionary, damage: int) -> Array[Dictionary]:
	return _trigger_passives(state, Types.TriggerTiming.ON_DAMAGE, game_state, [target, damage])


## 触发受到伤害时的内功
static func trigger_on_take_damage(state: Dictionary, game_state, source: Dictionary, damage: int) -> Array[Dictionary]:
	return _trigger_passives(state, Types.TriggerTiming.ON_TAKE_DAMAGE, game_state, [source, damage])


## 触发使用基础招式时的内功
static func trigger_on_play_card(state: Dictionary, game_state, card: CardState) -> Array[Dictionary]:
	return _trigger_passives(state, Types.TriggerTiming.ON_PLAY_CARD, game_state, [card])


## 触发使用武功招式时的内功
static func trigger_on_skill_use(state: Dictionary, game_state, skill: SkillState) -> Array[Dictionary]:
	return _trigger_passives(state, Types.TriggerTiming.ON_SKILL_USE, game_state, [skill])


## 获取可用武功列表
static func get_available_skills(state: Dictionary) -> Array[SkillState]:
	var available: Array[SkillState] = []
	var skills: Array = state.get("skills", [])
	var mp: int = state.get("mp", 0)
	var agility: int = state.get("agility", 0)
	var hand: Array = state.get("hand", [])

	for skill in skills:
		if skill is SkillState and skill.is_available(mp, agility, hand):
			available.append(skill)

	return available


## 获取所有可用行动
static func get_available_actions(state: Dictionary) -> Dictionary:
	var result := {
		"cards": [],  # 可打出的卡牌索引
		"skills": []  # 可使用的武功索引
	}

	var hand: Array = state.get("hand", [])
	var skills: Array = state.get("skills", [])
	var mp: int = state.get("mp", 0)
	var agility: int = state.get("agility", 0)

	# 检查每张手牌是否可打出
	for i in range(hand.size()):
		var card: CardState = hand[i]
		if card.agility_cost <= agility:
			result.cards.append(i)

	# 检查每个武功是否可用
	for i in range(skills.size()):
		if skills[i] is SkillState and skills[i].is_available(mp, agility, hand):
			result.skills.append(i)

	return result


## 使用武功招式
static func use_skill(state: Dictionary, skill_index: int, card_index: int, target: Dictionary = {}, game_state = null) -> Dictionary:
	var result := {
		"success": false,
		"skill": null,
		"card": null,
		"target": target,
		"effects": []
	}

	var skills: Array = state.get("skills", [])
	var hand: Array = state.get("hand", [])
	var discard_pile: Array = state.get("discard_pile", [])
	var mp: int = state.get("mp", 0)
	var agility: int = state.get("agility", 0)

	if skill_index < 0 or skill_index >= skills.size():
		return result

	var skill: SkillState = skills[skill_index]
	if not skill.is_available(mp, agility, hand):
		return result

	# 检查卡牌索引是否有效
	var available_cards := skill.get_available_card_indices(hand)
	if card_index not in available_cards:
		return result

	# 消耗资源
	state["mp"] = mp - skill.mp_cost
	state["agility"] = agility - skill.agility_cost

	# 使用卡牌
	var card: CardState = hand.pop_at(card_index)
	discard_pile.append(card)
	state["hand"] = hand
	state["discard_pile"] = discard_pile

	# 标记武功使用
	skill.use()

	result.success = true
	result.skill = skill
	result.card = card

	# 触发武功使用内功
	var trigger_results := trigger_on_skill_use(state, game_state, skill)
	result.effects.append_array(trigger_results)

	return result


## 重置回合状态
static func reset_turn(state: Dictionary) -> void:
	# 重置轻功
	state["agility"] = state.get("base_agility", 10)

	# 重置内功触发次数
	var passives: Array = state.get("passives", [])
	for passive in passives:
		if passive is PassiveState:
			passive.reset_turn_triggers()


## 获取手牌中指定类型的卡牌索引
static func get_cards_by_type(state: Dictionary, card_type: Types.CardType) -> Array[int]:
	var indices: Array[int] = []
	var hand: Array = state.get("hand", [])

	for i in range(hand.size()):
		var card: CardState = hand[i]
		if Types.is_card_type_match(card.type, card_type):
			indices.append(i)

	return indices


## 转换为字典（用于序列化）
static func to_dict(state: Dictionary) -> Dictionary:
	var deck_ids: Array[String] = []
	for card in state.get("deck", []):
		if card is CardState:
			deck_ids.append(card.card_id)

	var hand_ids: Array[String] = []
	for card in state.get("hand", []):
		if card is CardState:
			hand_ids.append(card.card_id)

	var discard_ids: Array[String] = []
	for card in state.get("discard_pile", []):
		if card is CardState:
			discard_ids.append(card.card_id)

	var skill_ids: Array[String] = []
	for skill in state.get("skills", []):
		if skill is SkillState:
			skill_ids.append(skill.skill_id)

	var passive_ids: Array[String] = []
	for passive in state.get("passives", []):
		if passive is PassiveState:
			passive_ids.append(passive.passive_id)

	return {
		"id": state.get("id", ""),
		"name": state.get("name", ""),
		"title": state.get("title", ""),
		"max_hp": state.get("max_hp", 60),
		"max_mp": state.get("max_mp", 20),
		"agility": state.get("base_agility", 10),
		"hp": state.get("hp", 0),
		"mp": state.get("mp", 0),
		"shield": state.get("shield", 0),
		"current_agility": state.get("agility", 0),
		"deck": deck_ids,
		"hand": hand_ids,
		"discard_pile": discard_ids,
		"skills": skill_ids,
		"passives": passive_ids
	}