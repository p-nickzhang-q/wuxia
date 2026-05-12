## skill_state.gd - 武功招式运行时状态
## 管理武功招式的数据和效果，包含运行时状态（如冷却）

class_name SkillState
extends RefCounted

## 武功ID
var skill_id: String = ""

## 武功名称
var name: String = ""

## 武功等级
var level: Types.SkillLevel = Types.SkillLevel.BEGINNER

## 所属门派
var faction: Types.Faction = Types.Faction.BEGGAR

## 内力消耗
var mp_cost: int = 0

## 轻功消耗
var agility_cost: int = 2

## 基础伤害
var damage: int = 0

## 所需媒介卡牌类型
var required_card_type: Types.CardType = Types.CardType.ANY

## 效果列表
var effects: Array[Dictionary] = []

## 描述
var description: String = ""

## 是否需要目标
var requires_target: bool = true

## 距离要求（0表示任意距离）
var range_requirement: int = 0

## 冷却回合数（0表示无冷却）
var cooldown: int = 0

## 当前冷却剩余
var current_cooldown: int = 0


## 从数据字典创建武功
static func from_data(data: Dictionary) -> SkillState:
	var skill := SkillState.new()
	skill.skill_id = data.get("id", "")
	skill.name = data.get("name", "未知武功")
	skill.level = _parse_skill_level(data.get("level", "beginner"))
	skill.faction = _parse_faction(data.get("faction", "beggars"))
	skill.mp_cost = data.get("mp_cost", 0)
	skill.agility_cost = data.get("agility_cost", Types.DEFAULT_SKILL_AGILITY_COST)
	skill.damage = data.get("damage", 0)
	skill.required_card_type = _parse_card_type(data.get("required_card_type", "any"))
	var effects_data = data.get("effects", [])
	if effects_data and effects_data.size() > 0:
		for effect in effects_data:
			if effect is Dictionary:
				skill.effects.append(effect)
	skill.description = data.get("description", "")
	skill.requires_target = data.get("requires_target", true)
	skill.range_requirement = data.get("range", 0)
	skill.cooldown = data.get("cooldown", 0)
	skill.current_cooldown = 0
	return skill


## 解析武功等级
static func _parse_skill_level(level_str: String) -> Types.SkillLevel:
	match level_str.to_lower():
		"beginner", "初级":
			return Types.SkillLevel.BEGINNER
		"intermediate", "中级":
			return Types.SkillLevel.INTERMEDIATE
		"advanced", "高级":
			return Types.SkillLevel.ADVANCED
		"master", "大成":
			return Types.SkillLevel.MASTER
		_:
			return Types.SkillLevel.BEGINNER


## 解析门派
static func _parse_faction(faction_str: String) -> Types.Faction:
	match faction_str.to_lower():
		"beggars", "丐帮":
			return Types.Faction.BEGGAR
		"shaolin", "少林":
			return Types.Faction.SHAOLIN
		"wudang", "武当":
			return Types.Faction.WUDANG
		"emei", "峨眉":
			return Types.Faction.EMEI
		"huashan", "华山":
			return Types.Faction.HUASHAN
		"mozu", "魔族":
			return Types.Faction.MOZU
		"gumu", "古墓":
			return Types.Faction.GUMU
		"tianshan", "天山":
			return Types.Faction.TIANSHAN
		"dali", "大理":
			return Types.Faction.DALI
		"xiake", "侠客岛":
			return Types.Faction.XIAKE
		"qingcheng", "青城":
			return Types.Faction.QINGCHENG
		"riverside", "江水帮":
			return Types.Faction.RIVERSIDE
		_:
			return Types.Faction.BEGGAR


## 解析卡牌类型
static func _parse_card_type(type_str: String) -> Types.CardType:
	return CardState._parse_card_type(type_str)


## 检查是否可用
func is_available(current_mp: int, current_agility: int, hand: Array, current_cooldown_val: int = -1) -> bool:
	# 检查冷却
	var cd := current_cooldown if current_cooldown_val < 0 else current_cooldown_val
	if cd > 0:
		return false

	# 检查内力
	if current_mp < mp_cost:
		return false

	# 检查轻功
	if current_agility < agility_cost:
		return false

	# 检查媒介卡牌
	return has_required_card(hand)


## 检查手牌中是否有媒介卡牌
func has_required_card(hand: Array) -> bool:
	if required_card_type == Types.CardType.ANY:
		return not hand.is_empty()

	for card in hand:
		if card is CardState:
			if Types.is_card_type_match(card.type, required_card_type):
				return true
		elif card is String:
			# 如果是卡牌ID，需要从GameManager获取数据
			var card_data: Dictionary = _get_card_data(card)
			var card_type: Types.CardType = CardState._parse_card_type(card_data.get("type", "empty_hand"))
			if Types.is_card_type_match(card_type, required_card_type):
				return true

	return false


## 获取卡牌数据（安全访问 GameManager）
static func _get_card_data(card_id: String) -> Dictionary:
	if GameManager != null:
		return GameManager.cards_data.get(card_id, {})
	return {}


## 获取手牌中可用的媒介卡牌索引列表
func get_available_card_indices(hand: Array) -> Array[int]:
	var indices: Array[int] = []

	for i in range(hand.size()):
		var card = hand[i]
		var card_type: Types.CardType

		if card is CardState:
			card_type = card.type
		elif card is String:
			var card_data: Dictionary = _get_card_data(card)
			card_type = CardState._parse_card_type(card_data.get("type", "empty_hand"))
		else:
			continue

		if Types.is_card_type_match(card_type, required_card_type):
			indices.append(i)

	return indices


## 使用武功（减少冷却）
func use() -> void:
	if cooldown > 0:
		current_cooldown = cooldown


## 回合结束（减少冷却）
func on_turn_end() -> void:
	if current_cooldown > 0:
		current_cooldown -= 1


## 获取武功简短描述
func get_short_description() -> String:
	var parts: Array[String] = []
	if damage > 0:
		parts.append("伤害 %d" % damage)
	if mp_cost > 0:
		parts.append("内力 %d" % mp_cost)
	if agility_cost > 0:
		parts.append("轻功 %d" % agility_cost)
	return " | ".join(parts) if not parts.is_empty() else "无效果"


## 获取等级名称
func get_level_name() -> String:
	match level:
		Types.SkillLevel.BEGINNER:
			return "初级"
		Types.SkillLevel.INTERMEDIATE:
			return "中级"
		Types.SkillLevel.ADVANCED:
			return "高级"
		Types.SkillLevel.MASTER:
			return "大成"
		_:
			return "未知"


## 转换为字典
func to_dict() -> Dictionary:
	return {
		"skill_id": skill_id,
		"name": name,
		"level": get_level_name(),
		"faction": Types.get_faction_name(faction),
		"mp_cost": mp_cost,
		"agility_cost": agility_cost,
		"damage": damage,
		"required_card_type": Types.get_card_type_name(required_card_type),
		"effects": effects,
		"description": description,
		"requires_target": requires_target,
		"range": range_requirement,
		"cooldown": cooldown,
		"current_cooldown": current_cooldown
	}
