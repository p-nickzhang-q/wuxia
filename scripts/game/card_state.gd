## card_state.gd - 卡牌状态类
## 管理单张卡牌的数据和状态（运行时实例）

class_name CardState
extends RefCounted

# ==================== 实例数据 ====================
## 卡牌唯一实例ID（战斗中生成）
var instance_id: String = ""

## 卡牌配置ID
var card_id: String = ""

## 卡牌名称
var name: String = ""

## 卡牌类型
var type: Types.CardType = Types.CardType.EMPTY_HAND

## 基础伤害值
var base_damage: int = 0

## 基础护盾值
var base_shield: int = 0

## 基础治疗值
var base_heal: int = 0

## 轻功消耗
var agility_cost: int = 1

## 描述
var description: String = ""

## 特殊效果
var effects: Array[Dictionary] = []

## 是否需要目标
var requires_target: bool = true


# ==================== 静态工厂方法 ====================

## 从数据字典创建卡牌状态
static func create(data: Dictionary, new_instance_id: String = "") -> CardState:
	var card := CardState.new()
	card.instance_id = new_instance_id if not new_instance_id.is_empty() else str(Time.get_ticks_msec()) + "_" + str(randi())
	card.card_id = data.get("id", "")
	card.name = data.get("name", "未知卡牌")
	card.type = _parse_card_type(data.get("type", "empty_hand"))
	card.base_damage = data.get("damage", 0)
	card.base_shield = data.get("shield", 0)
	card.base_heal = data.get("heal", 0)
	card.agility_cost = data.get("agility_cost", Types.DEFAULT_AGILITY_COST)
	card.description = data.get("description", "")
	var effects_data = data.get("effects", [])
	if effects_data and effects_data.size() > 0:
		for effect in effects_data:
			if effect is Dictionary:
				card.effects.append(effect)
	card.requires_target = data.get("requires_target", card.base_damage > 0)
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


# ==================== 实例方法 ====================

## 获取卡牌简短描述
func get_short_description() -> String:
	var parts: Array[String] = []
	if base_damage > 0:
		parts.append("伤害 %d" % base_damage)
	if base_shield > 0:
		parts.append("护盾 %d" % base_shield)
	if base_heal > 0:
		parts.append("治疗 %d" % base_heal)
	return " | ".join(parts) if not parts.is_empty() else "无效果"


## 检查是否为攻击卡牌
func is_attack() -> bool:
	return base_damage > 0


## 检查是否为防御卡牌
func is_defense() -> bool:
	return base_shield > 0


## 检查是否为治疗卡牌
func is_heal() -> bool:
	return base_heal > 0


## 复制卡牌（生成新实例ID）
func duplicate() -> CardState:
	var new_card := CardState.new()
	new_card.instance_id = str(Time.get_ticks_msec()) + "_" + str(randi())
	new_card.card_id = card_id
	new_card.name = name
	new_card.type = type
	new_card.base_damage = base_damage
	new_card.base_shield = base_shield
	new_card.base_heal = base_heal
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
		"damage": base_damage,
		"shield": base_shield,
		"heal": base_heal,
		"agility_cost": agility_cost,
		"description": description,
		"effects": effects,
		"requires_target": requires_target
	}


## 获取实例ID（用于字典键）
func get_instance_id() -> int:
	return get_instance_id()
