## card.gd - 卡牌类
## 管理单张卡牌的数据和状态

class_name Card
extends RefCounted

## 卡牌唯一实例ID（战斗中生成）
var instance_id: String = ""

## 卡牌配置ID
var card_id: String = ""

## 卡牌名称
var name: String = ""

## 卡牌类型
var type: Types.CardType = Types.CardType.EMPTY_HAND

## 伤害值
var damage: int = 0

## 护盾值
var shield: int = 0

## 治疗值
var heal: int = 0

## 轻功消耗
var agility_cost: int = 1

## 描述
var description: String = ""

## 特殊效果
var effects: Array = []

## 是否需要目标
var requires_target: bool = true


## 从数据字典创建卡牌
static func from_data(data: Dictionary, instance_id: String = "") -> Card:
	var card := Card.new()
	card.instance_id = instance_id if not instance_id.is_empty() else str(Time.get_ticks_msec()) + "_" + str(randi())
	card.card_id = data.get("id", "")
	card.name = data.get("name", "未知卡牌")
	card.type = _parse_card_type(data.get("type", "empty_hand"))
	card.damage = data.get("damage", 0)
	card.shield = data.get("shield", 0)
	card.heal = data.get("heal", 0)
	card.agility_cost = data.get("agility_cost", Types.DEFAULT_AGILITY_COST)
	card.description = data.get("description", "")
	card.effects = data.get("effects", [])
	card.requires_target = data.get("requires_target", card.damage > 0)
	return card


## 解析卡牌类型字符串
static func _parse_card_type(type_str: String) -> Types.CardType:
	match type_str.to_lower():
		"empty_hand", "empty", "fist":
			return Types.CardType.EMPTY_HAND
		"short_weapon", "short", "dagger":
			return Types.CardType.SHORT_WEAPON
		"long_weapon", "long", "sword":
			return Types.CardType.LONG_WEAPON
		"leg", "kick":
			return Types.CardType.LEG
		"any":
			return Types.CardType.ANY
		_:
			return Types.CardType.EMPTY_HAND


## 获取卡牌简短描述
func get_short_description() -> String:
	var parts: Array[String] = []
	if damage > 0:
		parts.append("伤害 %d" % damage)
	if shield > 0:
		parts.append("护盾 %d" % shield)
	if heal > 0:
		parts.append("治疗 %d" % heal)
	return " | ".join(parts) if not parts.is_empty() else "无效果"


## 检查是否为攻击卡牌
func is_attack() -> bool:
	return damage > 0


## 检查是否为防御卡牌
func is_defense() -> bool:
	return shield > 0


## 检查是否为治疗卡牌
func is_heal() -> bool:
	return heal > 0


## 复制卡牌（生成新实例ID）
func duplicate() -> Card:
	var new_card := Card.new()
	new_card.instance_id = str(Time.get_ticks_msec()) + "_" + str(randi())
	new_card.card_id = card_id
	new_card.name = name
	new_card.type = type
	new_card.damage = damage
	new_card.shield = shield
	new_card.heal = heal
	new_card.agility_cost = agility_cost
	new_card.description = description
	new_card.effects = effects.duplicate(true)
	new_card.requires_target = requires_target
	return new_card


## 转换为字典（用于序列化）
func to_dict() -> Dictionary:
	return {
		"instance_id": instance_id,
		"card_id": card_id,
		"name": name,
		"type": Types.CARD_TYPE_NAMES.get(type, "unknown"),
		"damage": damage,
		"shield": shield,
		"heal": heal,
		"agility_cost": agility_cost,
		"description": description,
		"effects": effects,
		"requires_target": requires_target
	}
