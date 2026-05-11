class_name Character
extends RefCounted

## 角色类 - 管理角色状态、卡组、武功

# 基础属性
var id: String
var name: String
var title: String
var max_hp: int
var max_mp: int
var agility: int  # 轻功值

# 当前状态
var current_hp: int
var current_mp: int
var shield: int = 0  # 护盾
var current_agility: int

# 卡组
var deck: Array[String] = []  # 卡牌ID列表
var hand: Array[String] = []  # 手牌
var discard_pile: Array[String] = []  # 弃牌堆

# 武功
var martial_arts: Array[String] = []  # 武功ID列表


func _init(data: Dictionary) -> void:
	"""从数据初始化角色"""
	id = data.get("id", "")
	name = data.get("name", "")
	title = data.get("title", "")
	max_hp = data.get("hp", 60)
	max_mp = data.get("mp", 20)
	agility = data.get("agility", 10)

	current_hp = max_hp
	current_mp = max_mp
	current_agility = agility

	for card_id in data.get("deck", []):
		deck.append(card_id)

	for art_id in data.get("martialArts", []):
		martial_arts.append(art_id)


func draw_cards(count: int) -> Array[String]:
	"""抽牌"""
	var drawn: Array[String] = []
	for i in count:
		if deck.is_empty():
			# 洗牌
			deck.append_array(discard_pile)
			discard_pile.clear()
			_shuffle_deck()
		if not deck.is_empty():
			var card = deck.pop_back()
			hand.append(card)
			drawn.append(card)
	return drawn


func play_card(card_index: int) -> String:
	"""打出卡牌"""
	if card_index >= 0 and card_index < hand.size():
		var card_id = hand.pop_at(card_index)
		discard_pile.append(card_id)
		return card_id
	return ""


func take_damage(amount: int) -> int:
	"""受到伤害，返回实际伤害值"""
	var actual_damage = amount

	# 先扣护盾
	if shield > 0:
		if shield >= amount:
			shield -= amount
			return 0
		else:
			actual_damage = amount - shield
			shield = 0

	current_hp -= actual_damage
	if current_hp < 0:
		current_hp = 0

	return actual_damage


func heal(amount: int) -> int:
	"""治疗，返回实际治疗量"""
	var old_hp = current_hp
	current_hp = mini(current_hp + amount, max_hp)
	return current_hp - old_hp


func use_mp(amount: int) -> bool:
	"""消耗内力"""
	if current_mp >= amount:
		current_mp -= amount
		return true
	return false


func recover_mp(amount: int) -> void:
	"""恢复内力"""
	current_mp = mini(current_mp + amount, max_mp)


func is_dead() -> bool:
	"""是否死亡"""
	return current_hp <= 0


func _shuffle_deck() -> void:
	"""洗牌"""
	deck.shuffle()


func reset_for_battle() -> void:
	"""重置战斗状态"""
	current_hp = max_hp
	current_mp = max_mp
	shield = 0
	current_agility = agility
	hand.clear()
	discard_pile.clear()
	deck.shuffle()
