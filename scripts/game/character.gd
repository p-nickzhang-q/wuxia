## character.gd - 角色类
## 管理角色的状态、卡组、武功和内功

class_name Character
extends RefCounted

# ==================== 基础属性 ====================
## 角色ID
var id: String = ""

## 角色名称
var name: String = ""

## 角色称号
var title: String = ""

## 最大生命值
var max_hp: int = 60

## 最大内力
var max_mp: int = 20

## 基础轻功值
var base_agility: int = 10

# ==================== 当前状态 ====================
## 当前生命值
var current_hp: int = 0

## 当前内力
var current_mp: int = 0

## 护盾值
var shield: int = 0

## 当前轻功值
var current_agility: int = 0

# ==================== 卡组系统 ====================
## 牌库
var deck: Array[Card] = []

## 手牌
var hand: Array[Card] = []

## 弃牌堆
var discard_pile: Array[Card] = []

# ==================== 武功系统 ====================
## 武功招式列表
var skills: Array[Skill] = []

# ==================== 内功系统 ====================
## 内功列表
var passives: Array[Passive] = []


## 静态工厂方法 - 从数据字典创建角色
static func from_data(data: Dictionary) -> Character:
	var character := Character.new()
	character.id = data.get("id", "")
	character.name = data.get("name", "未知角色")
	character.title = data.get("title", "")
	character.max_hp = data.get("hp", 60)
	character.max_mp = data.get("mp", 20)
	character.base_agility = data.get("agility", 10)

	# 初始化当前状态
	character.current_hp = character.max_hp
	character.current_mp = character.max_mp
	character.current_agility = character.base_agility

	# 加载卡牌
	var deck_data: Array = data.get("deck", [])
	for card_id in deck_data:
		var card_data: Dictionary = GameManager.cards_data.get(card_id, {})
		if not card_data.is_empty():
			var card := Card.from_data(card_data)
			character.deck.append(card)

	# 加载武功
	var skills_data: Array = data.get("martialArts", [])
	for skill_id in skills_data:
		var skill_data: Dictionary = GameManager.skills_data.get(skill_id, {})
		if not skill_data.is_empty():
			var skill := Skill.from_data(skill_data)
			character.skills.append(skill)

	# 加载内功
	var passives_data: Array = data.get("passives", [])
	for passive_id in passives_data:
		var passive_data: Dictionary = GameManager.skills_data.get(passive_id, {})
		if not passive_data.is_empty():
			var passive := Passive.from_data(passive_data)
			character.passives.append(passive)

	return character


## 抽牌
func draw_cards(count: int) -> Array[Card]:
	var drawn: Array[Card] = []
	for i in range(count):
		if deck.is_empty():
			# 洗牌
			deck.append_array(discard_pile)
			discard_pile.clear()
			_shuffle_deck()
		if not deck.is_empty():
			var card: Card = deck.pop_back()
			hand.append(card)
			drawn.append(card)
	return drawn


## 打出卡牌
func play_card(card_index: int) -> Card:
	if card_index >= 0 and card_index < hand.size():
		var card: Card = hand.pop_at(card_index)
		discard_pile.append(card)
		return card
	return null


## 受到伤害，返回伤害结果字典
func take_damage(amount: int, source: Character = null) -> Dictionary:
	var result := {
		"actual_damage": 0,
		"shield_absorbed": 0,
		"source": source
	}

	var actual_damage := amount

	# 先扣护盾
	if shield > 0:
		if shield >= amount:
			result.shield_absorbed = amount
			shield -= amount
			return result
		else:
			result.shield_absorbed = shield
			actual_damage = amount - shield
			shield = 0

	current_hp -= actual_damage
	if current_hp < 0:
		current_hp = 0

	result.actual_damage = actual_damage
	return result


## 治疗，返回实际治疗量
func heal(amount: int) -> int:
	var old_hp := current_hp
	current_hp = mini(current_hp + amount, max_hp)
	return current_hp - old_hp


## 消耗内力
func use_mp(amount: int) -> bool:
	if current_mp >= amount:
		current_mp -= amount
		return true
	return false


## 恢复内力
func recover_mp(amount: int) -> void:
	current_mp = mini(current_mp + amount, max_mp)


## 消耗轻功
func use_agility(amount: int) -> bool:
	if current_agility >= amount:
		current_agility -= amount
		return true
	return false


## 恢复轻功
func recover_agility(amount: int) -> void:
	current_agility = mini(current_agility + amount, base_agility)


## 是否死亡
func is_dead() -> bool:
	return current_hp <= 0


## 洗牌
func _shuffle_deck() -> void:
	deck.shuffle()


## 重置战斗状态
func reset_for_battle() -> void:
	current_hp = max_hp
	current_mp = max_mp
	shield = 0
	current_agility = base_agility
	hand.clear()
	discard_pile.clear()

	# 重置所有武功冷却
	for skill in skills:
		skill.current_cooldown = 0

	# 重置所有内功触发次数
	for passive in passives:
		passive.reset_turn_triggers()

	# 洗牌
	deck.shuffle()


## 回合开始处理
func on_turn_start(game_state) -> void:
	# 重置内功触发次数
	for passive in passives:
		passive.reset_turn_triggers()

	# 触发回合开始内功
	_trigger_passives(Types.TriggerTiming.TURN_START, game_state)


## 回合结束处理
func on_turn_end(game_state) -> void:
	# 减少武功冷却
	for skill in skills:
		skill.on_turn_end()

	# 触发回合结束内功
	_trigger_passives(Types.TriggerTiming.TURN_END, game_state)


## 触发内功
func _trigger_passives(timing: Types.TriggerTiming, game_state, args: Array = []) -> Array[Dictionary]:
	var results: Array[Dictionary] = []
	for passive in passives:
		if passive.trigger_timing == timing:
			var result := passive.trigger(self, game_state, args)
			if result.get("triggered", false):
				results.append(result)
	return results


## 触发造成伤害时的内功
func trigger_on_damage(game_state, target: Character, damage: int) -> Array[Dictionary]:
	return _trigger_passives(Types.TriggerTiming.ON_DAMAGE, game_state, [target, damage])


## 触发受到伤害时的内功
func trigger_on_take_damage(game_state, source: Character, damage: int) -> Array[Dictionary]:
	return _trigger_passives(Types.TriggerTiming.ON_TAKE_DAMAGE, game_state, [source, damage])


## 触发使用基础招式时的内功
func trigger_on_play_card(game_state, card: Card) -> Array[Dictionary]:
	return _trigger_passives(Types.TriggerTiming.ON_PLAY_CARD, game_state, [card])


## 触发使用武功招式时的内功
func trigger_on_skill_use(game_state, skill: Skill) -> Array[Dictionary]:
	return _trigger_passives(Types.TriggerTiming.ON_SKILL_USE, game_state, [skill])


## 获取可用武功列表
func get_available_skills() -> Array[Skill]:
	var available: Array[Skill] = []
	for skill in skills:
		if skill.is_available(current_mp, current_agility, hand):
			available.append(skill)
	return available


## 获取所有可用行动
func get_available_actions() -> Dictionary:
	var result := {
		"cards": [],  # 可打出的卡牌索引
		"skills": []  # 可使用的武功索引
	}

	# 检查每张手牌是否可打出
	for i in range(hand.size()):
		if hand[i].agility_cost <= current_agility:
			result.cards.append(i)

	# 检查每个武功是否可用
	for i in range(skills.size()):
		if skills[i].is_available(current_mp, current_agility, hand):
			result.skills.append(i)

	return result


## 使用武功招式
func use_skill(skill_index: int, card_index: int, target: Character = null, game_state = null) -> Dictionary:
	var result := {
		"success": false,
		"skill": null,
		"card": null,
		"target": target,
		"effects": []
	}

	if skill_index < 0 or skill_index >= skills.size():
		return result

	var skill := skills[skill_index]
	if not skill.is_available(current_mp, current_agility, hand):
		return result

	# 检查卡牌索引是否有效
	var available_cards := skill.get_available_card_indices(hand)
	if card_index not in available_cards:
		return result

	# 消耗资源
	current_mp -= skill.mp_cost
	current_agility -= skill.agility_cost

	# 使用卡牌
	var card: Card = hand.pop_at(card_index)
	discard_pile.append(card)

	# 标记武功使用
	skill.use()

	result.success = true
	result.skill = skill
	result.card = card

	# 触发武功使用内功
	var trigger_results := trigger_on_skill_use(game_state, skill)
	result.effects.append_array(trigger_results)

	return result


## 重置回合状态
func reset_turn() -> void:
	# 重置轻功
	current_agility = base_agility

	# 重置内功触发次数
	for passive in passives:
		passive.reset_turn_triggers()


## 获取手牌中指定类型的卡牌索引
func get_cards_by_type(card_type: Types.CardType) -> Array[int]:
	var indices: Array[int] = []
	for i in range(hand.size()):
		if Types.is_card_type_match(hand[i].type, card_type):
			indices.append(i)
	return indices


## 转换为字典（用于序列化）
func to_dict() -> Dictionary:
	var deck_ids: Array[String] = []
	for card in deck:
		deck_ids.append(card.card_id)

	var hand_ids: Array[String] = []
	for card in hand:
		hand_ids.append(card.card_id)

	var discard_ids: Array[String] = []
	for card in discard_pile:
		discard_ids.append(card.card_id)

	var skill_ids: Array[String] = []
	for skill in skills:
		skill_ids.append(skill.skill_id)

	var passive_ids: Array[String] = []
	for passive in passives:
		passive_ids.append(passive.passive_id)

	return {
		"id": id,
		"name": name,
		"title": title,
		"max_hp": max_hp,
		"max_mp": max_mp,
		"agility": base_agility,
		"current_hp": current_hp,
		"current_mp": current_mp,
		"shield": shield,
		"current_agility": current_agility,
		"deck": deck_ids,
		"hand": hand_ids,
		"discard_pile": discard_ids,
		"skills": skill_ids,
		"passives": passive_ids
	}
