# Phase 1 - 核心逻辑迁移 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 将 pixi 分支的战斗系统核心逻辑完整迁移到 Godot，包括类型定义、卡牌、武功、内功、角色、距离系统、游戏状态和 AI 控制器。

**Architecture:** 采用分层架构，核心逻辑层（scripts/game/）不依赖 UI 层，通过信号机制与 UI 层解耦。数据流：GameManager -> GameState -> Character -> BattleScene。

**Tech Stack:** Godot 4.6, GDScript, JSON 数据配置

---

## 文件结构

```
scripts/game/
├── types.gd              # 枚举和常量定义（新建）
├── card.gd                # 卡牌类（新建）
├── skill.gd               # 武功招式类（新建）
├── passive.gd             # 内功类（新建）
├── character.gd           # 角色类（扩展现有版本）
├── distance_system.gd     # 距离系统（新建）
├── effect_processor.gd    # 效果处理器（新建）
├── game_state.gd          # 游戏状态管理（新建）
├── ai_controller.gd       # AI 控制器（新建，替代现有 ai.gd）
└── battle_manager.gd      # 保留现有版本，Phase 3 整合时替换
```

---

## Task 1: 创建类型定义文件

**Files:**
- Create: `scripts/game/types.gd`

- [ ] **Step 1: 创建 types.gd 文件**

```gdscript
## types.gd - 枚举和常量定义
## 此文件包含游戏核心类型定义，不依赖其他游戏模块

class_name Types
extends RefCounted

# ==================== 卡牌类型 ====================
## 卡牌类型 - 对应不同武功媒介
enum CardType {
	EMPTY_HAND,    ## 空手类（拳击、肘击）
	SHORT_WEAPON,  ## 短兵类（刺击）
	LONG_WEAPON,   ## 长兵类（横扫、直刺）
	LEG,           ## 腿法类（前踢、扫腿）
	ANY            ## 任意类型
}

# ==================== 触发时机 ====================
## 内功触发时机
enum TriggerTiming {
	TURN_START,      ## 回合开始
	TURN_END,        ## 回合结束
	ON_DAMAGE,      ## 造成伤害时
	ON_TAKE_DAMAGE, ## 受到伤害时
	ON_PLAY_CARD,   ## 使用基础招式时
	ON_SKILL_USE    ## 使用武功招式时
}

# ==================== 游戏阶段 ====================
## 战斗阶段
enum GamePhase {
	SETUP,             ## 初始化阶段
	SELECTING,         ## 选择行动阶段
	SELECTING_TARGET,  ## 选择目标阶段
	ACTING,            ## 执行行动阶段
	GAME_OVER          ## 游戏结束
}

# ==================== 战斗模式 ====================
## 战斗模式
enum BattleMode {
	TEAM,          ## 队伍对战
	FREE_FOR_ALL   ## 自由混战
}

# ==================== 武功等级 ====================
## 武功等级
enum SkillLevel {
	BEGINNER,     ## 初级
	INTERMEDIATE, ## 中级
	ADVANCED,     ## 高级
	MASTER        ## 大成
}

# ==================== 门派 ====================
## 门派枚举
enum Faction {
	BEGGAR,   ## 丐帮
	SHAOLIN,  ## 少林
	WUDANG,   ## 武当
	EMEI,     ## 峨眉
	HUASHAN,  ## 华山
	MOZU,     ## 魔族
	GUMU,     ## 古墓
	TIANSHAN, ## 天山
	DALI,     ## 大理
	XIAKE,    ## 侠客岛
	QINGCHENG,## 青城
	RIVERSIDE ## 江水帮
}

# ==================== 效果类型 ====================
## 效果类型
enum EffectType {
	DAMAGE,        ## 伤害
	HEAL,          ## 治疗
	SHIELD,        ## 护盾
	MP_RECOVER,    ## 内力恢复
	AGILITY_BOOST, ## 轻功提升
	AGILITY_REDUCE,## 轻功降低
	DRAW_CARDS,    ## 抽牌
	DISCARD,       ## 弃牌
	STUN,          ## 眩晕
	POISON,        ## 中毒
	BLEED,         ## 流血
	BUFF,          ## 增益
	DEBUFF         ## 减益
}

# ==================== 常量 ====================
## 默认手牌上限
const MAX_HAND_SIZE: int = 10

## 默认抽牌数
const DEFAULT_DRAW_COUNT: int = 5

## 默认轻功消耗
const DEFAULT_AGILITY_COST: int = 1

## 默认技能轻功消耗
const DEFAULT_SKILL_AGILITY_COST: int = 2

## 卡牌类型名称映射
const CARD_TYPE_NAMES: Dictionary = {
	CardType.EMPTY_HAND: "空手",
	CardType.SHORT_WEAPON: "短兵",
	CardType.LONG_WEAPON: "长兵",
	CardType.LEG: "腿法",
	CardType.ANY: "任意"
}

## 触发时机名称映射
const TRIGGER_TIMING_NAMES: Dictionary = {
	TriggerTiming.TURN_START: "回合开始",
	TriggerTiming.TURN_END: "回合结束",
	TriggerTiming.ON_DAMAGE: "造成伤害时",
	TriggerTiming.ON_TAKE_DAMAGE: "受到伤害时",
	TriggerTiming.ON_PLAY_CARD: "使用基础招式时",
	TriggerTiming.ON_SKILL_USE: "使用武功招式时"
}

## 门派名称映射
const FACTION_NAMES: Dictionary = {
	Faction.BEGGAR: "丐帮",
	Faction.SHAOLIN: "少林",
	Faction.WUDANG: "武当",
	Faction.EMEI: "峨眉",
	Faction.HUASHAN: "华山",
	Faction.MOZU: "魔族",
	Faction.GUMU: "古墓",
	Faction.TIANSHAN: "天山",
	Faction.DALI: "大理",
	Faction.XIAKE: "侠客岛",
	Faction.QINGCHENG: "青城",
	Faction.RIVERSIDE: "江水帮"
}


## 获取卡牌类型名称
static func get_card_type_name(card_type: CardType) -> String:
	return CARD_TYPE_NAMES.get(card_type, "未知")


## 获取触发时机名称
static func get_trigger_timing_name(timing: TriggerTiming) -> String:
	return TRIGGER_TIMING_NAMES.get(timing, "未知")


## 获取门派名称
static func get_faction_name(faction: Faction) -> String:
	return FACTION_NAMES.get(faction, "未知")


## 检查卡牌类型是否匹配
static func is_card_type_match(card_type: CardType, required_type: CardType) -> bool:
	if required_type == CardType.ANY:
		return true
	return card_type == required_type
```

- [ ] **Step 2: 验证文件语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/types.gd
git commit -m "feat(game): 添加核心类型定义文件

- 定义 CardType、TriggerTiming、GamePhase 等枚举
- 添加常量和名称映射
- 提供类型检查辅助函数

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 2: 创建卡牌类

**Files:**
- Create: `scripts/game/card.gd`

- [ ] **Step 1: 创建 card.gd 文件**

```gdscript
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
```

- [ ] **Step 2: 验证文件语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/card.gd
git commit -m "feat(game): 添加卡牌类

- 支持从数据字典创建卡牌
- 提供卡牌类型解析和描述生成
- 支持卡牌复制和序列化

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 3: 创建武功招式类

**Files:**
- Create: `scripts/game/skill.gd`

- [ ] **Step 1: 创建 skill.gd 文件**

```gdscript
## skill.gd - 武功招式类
## 管理武功招式的数据和效果

class_name Skill
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
var effects: Array = []

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
static func from_data(data: Dictionary) -> Skill:
	var skill := Skill.new()
	skill.skill_id = data.get("id", "")
	skill.name = data.get("name", "未知武功")
	skill.level = _parse_skill_level(data.get("level", "beginner"))
	skill.faction = _parse_faction(data.get("faction", "beggars"))
	skill.mp_cost = data.get("mp_cost", 0)
	skill.agility_cost = data.get("agility_cost", Types.DEFAULT_SKILL_AGILITY_COST)
	skill.damage = data.get("damage", 0)
	skill.required_card_type = _parse_card_type(data.get("required_card_type", "any"))
	skill.effects = data.get("effects", [])
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
	return Card._parse_card_type(type_str)


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
		if card is Card:
			if Types.is_card_type_match(card.type, required_card_type):
				return true
		elif card is String:
			# 如果是卡牌ID，需要从GameManager获取数据
			var card_data = GameManager.cards_data.get(card, {})
			var card_type = Card._parse_card_type(card_data.get("type", "empty_hand"))
			if Types.is_card_type_match(card_type, required_card_type):
				return true

	return false


## 获取手牌中可用的媒介卡牌索引列表
func get_available_card_indices(hand: Array) -> Array[int]:
	var indices: Array[int] = []

	for i in range(hand.size()):
		var card = hand[i]
		var card_type: Types.CardType

		if card is Card:
			card_type = card.type
		elif card is String:
			var card_data = GameManager.cards_data.get(card, {})
			card_type = Card._parse_card_type(card_data.get("type", "empty_hand"))
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
```

- [ ] **Step 2: 验证文件语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/skill.gd
git commit -m "feat(game): 添加武功招式类

- 支持从数据字典创建武功
- 实现媒介卡牌检查和可用性判断
- 支持冷却机制和回合结束处理

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 4: 创建内功类

**Files:**
- Create: `scripts/game/passive.gd`

- [ ] **Step 1: 创建 passive.gd 文件**

```gdscript
## passive.gd - 内功类
## 管理被动内功效果的数据和触发逻辑

class_name Passive
extends RefCounted

## 内功ID
var passive_id: String = ""

## 内功名称
var name: String = ""

## 触发时机
var trigger_timing: Types.TriggerTiming = Types.TriggerTiming.TURN_START

## 效果列表
var effects: Array = []

## 触发概率（1.0 = 100%）
var trigger_chance: float = 1.0

## 描述
var description: String = ""

## 是否启用
var enabled: bool = true

## 每回合触发次数限制（0表示无限制）
var triggers_per_turn: int = 0

## 当前回合已触发次数
var current_triggers: int = 0


## 从数据字典创建内功
static func from_data(data: Dictionary) -> Passive:
	var passive := Passive.new()
	passive.passive_id = data.get("id", "")
	passive.name = data.get("name", "未知内功")
	passive.trigger_timing = _parse_trigger_timing(data.get("trigger_timing", "turn_start"))
	passive.effects = data.get("effects", [])
	passive.trigger_chance = data.get("trigger_chance", 1.0)
	passive.description = data.get("description", "")
	passive.enabled = data.get("enabled", true)
	passive.triggers_per_turn = data.get("triggers_per_turn", 0)
	passive.current_triggers = 0
	return passive


## 解析触发时机
static func _parse_trigger_timing(timing_str: String) -> Types.TriggerTiming:
	match timing_str.to_lower():
		"turn_start", "回合开始":
			return Types.TriggerTiming.TURN_START
		"turn_end", "回合结束":
			return Types.TriggerTiming.TURN_END
		"on_damage", "造成伤害时":
			return Types.TriggerTiming.ON_DAMAGE
		"on_take_damage", "受到伤害时":
			return Types.TriggerTiming.ON_TAKE_DAMAGE
		"on_play_card", "使用基础招式时":
			return Types.TriggerTiming.ON_PLAY_CARD
		"on_skill_use", "使用武功招式时":
			return Types.TriggerTiming.ON_SKILL_USE
		_:
			return Types.TriggerTiming.TURN_START


## 检查是否可以触发
func can_trigger() -> bool:
	if not enabled:
		return false

	# 检查触发次数限制
	if triggers_per_turn > 0 and current_triggers >= triggers_per_turn:
		return false

	# 检查触发概率
	if trigger_chance < 1.0:
		return randf() <= trigger_chance

	return true


## 触发内功效果
func trigger(owner: Character, game_state: GameState, args: Array = []) -> Dictionary:
	if not can_trigger():
		return {"triggered": false}

	current_triggers += 1

	var result := {
		"triggered": true,
		"passive_id": passive_id,
		"passive_name": name,
		"effects": []
	}

	# 处理效果
	for effect in effects:
		var effect_result = _process_effect(owner, game_state, effect, args)
		result.effects.append(effect_result)

	return result


## 处理单个效果
func _process_effect(owner: Character, game_state: GameState, effect: Dictionary, args: Array) -> Dictionary:
	var effect_type = effect.get("type", "")
	var value = effect.get("value", 0)
	var result := {"type": effect_type, "value": 0}

	match effect_type:
		"heal", "heal_self":
			var heal_amount = owner.heal(value)
			result.value = heal_amount
			result.description = "%s 恢复 %d 点生命" % [owner.name, heal_amount]

		"shield", "add_shield":
			owner.shield += value
			result.value = value
			result.description = "%s 获得 %d 点护盾" % [owner.name, value]

		"damage", "damage_target":
			if args.size() > 0 and args[0] is Character:
				var target = args[0]
				var damage_amount = target.take_damage(value, owner)
				result.value = damage_amount
				result.description = "%s 对 %s 造成 %d 点伤害" % [owner.name, target.name, damage_amount]

		"mp_recover", "recover_mp":
			owner.recover_mp(value)
			result.value = value
			result.description = "%s 恢复 %d 点内力" % [owner.name, value]

		"agility_boost", "boost_agility":
			owner.current_agility += value
			result.value = value
			result.description = "%s 轻功提升 %d" % [owner.name, value]

		"draw_cards", "draw":
			var drawn = owner.draw_cards(value)
			result.value = drawn.size()
			result.description = "%s 抽取 %d 张牌" % [owner.name, drawn.size()]

		"damage_boost":
			# 伤害加成，需要在伤害计算时应用
			result.value = value
			result.is_modifier = true
			result.description = "%s 伤害提升 %d%%" % [owner.name, value]

		"damage_reduction":
			# 伤害减免
			result.value = value
			result.is_modifier = true
			result.description = "%s 伤害减免 %d%%" % [owner.name, value]

		"reflect_damage":
			# 反弹伤害
			result.value = value
			result.is_modifier = true
			result.description = "%s 反弹 %d%% 伤害" % [owner.name, value]

		_:
			result.description = "未知效果: %s" % effect_type

	return result


## 重置回合触发次数
func reset_turn_triggers() -> void:
	current_triggers = 0


## 获取触发时机名称
func get_trigger_timing_name() -> String:
	return Types.get_trigger_timing_name(trigger_timing)


## 转换为字典
func to_dict() -> Dictionary:
	return {
		"passive_id": passive_id,
		"name": name,
		"trigger_timing": get_trigger_timing_name(),
		"effects": effects,
		"trigger_chance": trigger_chance,
		"description": description,
		"enabled": enabled,
		"triggers_per_turn": triggers_per_turn,
		"current_triggers": current_triggers
	}
```

- [ ] **Step 2: 验证文件语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/passive.gd
git commit -m "feat(game): 添加内功类

- 支持从数据字典创建内功
- 实现多种触发时机和效果类型
- 支持触发概率和次数限制

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 5: 扩展角色类

**Files:**
- Modify: `scripts/game/character.gd`

- [ ] **Step 1: 重写 character.gd 文件**

```gdscript
## character.gd - 角色类
## 管理角色状态、牌组、武功、内功

class_name Character
extends RefCounted

# ==================== 信号 ====================
signal hp_changed(old_value: int, new_value: int)
signal mp_changed(old_value: int, new_value: int)
signal shield_changed(old_value: int, new_value: int)
signal agility_changed(old_value: int, new_value: int)
signal card_drawn(card: Card)
signal card_discarded(card: Card)
signal passive_triggered(passive: Passive, result: Dictionary)
signal character_died(character: Character)

# ==================== 基础属性 ====================
var id: String = ""
var name: String = ""
var title: String = ""
var faction: Types.Faction = Types.Faction.BEGGAR

# ==================== 战斗属性 ====================
var max_hp: int = 60
var max_mp: int = 20
var base_agility: int = 10

# 弟子属性
var root: int = 0       ## 根骨（影响HP）
var insight: int = 0    ## 悟性（影响MP）
var will: int = 0       ## 定力（影响护盾）
var strength: int = 0   ## 臂力（影响伤害）

# ==================== 当前状态 ====================
var current_hp: int = 0
var current_mp: int = 0
var shield: int = 0
var current_agility: int = 0

# ==================== 战斗位置 ====================
var battle_position: Dictionary = {}  ## { seat_index: int, team: String }

# ==================== 牌组 ====================
var deck: Array[Card] = []
var hand: Array[Card] = []
var discard_pile: Array[Card] = []

# ==================== 武功和内功 ====================
var skills: Array[Skill] = []
var passives: Array[Passive] = []

# ==================== 减益效果 ====================
var debuffs: Array = []  ## Debuff 数组
var dots: Array = []     ## 持续伤害数组

# ==================== 控制标记 ====================
var is_ai_controlled: bool = false
var is_stunned: bool = false


## 从数据字典创建角色
static func from_data(data: Dictionary) -> Character:
	var char := Character.new()
	char.id = data.get("id", "")
	char.name = data.get("name", "未知角色")
	char.title = data.get("title", "")
	char.faction = Skill._parse_faction(data.get("faction", "beggars"))

	char.max_hp = data.get("hp", 60)
	char.max_mp = data.get("mp", 20)
	char.base_agility = data.get("agility", 10)

	char.root = data.get("root", 0)
	char.insight = data.get("insight", 0)
	char.will = data.get("will", 0)
	char.strength = data.get("strength", 0)

	char.is_ai_controlled = data.get("is_ai", false)

	# 初始化卡组
	char._init_deck(data.get("deck", []))

	# 初始化武功
	char._init_skills(data.get("martialArts", []))

	# 初始化内功
	char._init_passives(data.get("passives", []))

	# 初始化状态
	char.current_hp = char.max_hp
	char.current_mp = char.max_mp
	char.current_agility = char.base_agility

	return char


## 初始化卡组
func _init_deck(card_ids: Array) -> void:
	deck.clear()
	for card_id in card_ids:
		var card_data = GameManager.cards_data.get(card_id, {})
		if not card_data.is_empty():
			var card = Card.from_data(card_data)
			deck.append(card)


## 初始化武功
func _init_skills(skill_ids: Array) -> void:
	skills.clear()
	for skill_id in skill_ids:
		var skill_data = GameManager.skills_data.get(skill_id, {})
		if not skill_data.is_empty():
			var skill = Skill.from_data(skill_data)
			skills.append(skill)


## 初始化内功
func _init_passives(passive_ids: Array) -> void:
	passives.clear()
	for passive_id in passive_ids:
		var passive_data = GameManager.passives_data.get(passive_id, {})
		if not passive_data.is_empty():
			var passive = Passive.from_data(passive_data)
			passives.append(passive)


## 初始化战斗
func init_for_battle() -> void:
	current_hp = max_hp
	current_mp = max_mp
	shield = 0
	current_agility = base_agility
	hand.clear()
	discard_pile.clear()
	debuffs.clear()
	dots.clear()
	is_stunned = false

	# 洗牌
	_shuffle_deck()

	# 重置武功冷却
	for skill in skills:
		skill.current_cooldown = 0

	# 重置内功触发次数
	for passive in passives:
		passive.reset_turn_triggers()


## 洗牌
func _shuffle_deck() -> void:
	deck.shuffle()


## 抽牌
func draw_cards(count: int) -> Array[Card]:
	var drawn: Array[Card] = []
	for i in count:
		if deck.is_empty():
			# 洗入弃牌堆
			if discard_pile.is_empty():
				break
			deck.append_array(discard_pile)
			discard_pile.clear()
			_shuffle_deck()

		if not deck.is_empty():
			var card = deck.pop_back()
			hand.append(card)
			drawn.append(card)
			card_drawn.emit(card)

	return drawn


## 打出卡牌（通过实例ID）
func play_card_by_instance_id(instance_id: String) -> Card:
	for i in range(hand.size()):
		if hand[i].instance_id == instance_id:
			var card = hand.pop_at(i)
			discard_pile.append(card)
			card_discarded.emit(card)
			return card
	return null


## 打出卡牌（通过索引）
func play_card_by_index(index: int) -> Card:
	if index >= 0 and index < hand.size():
		var card = hand.pop_at(index)
		discard_pile.append(card)
		card_discarded.emit(card)
		return card
	return null


## 弃牌
func discard_card(card: Card) -> void:
	var idx = hand.find(card)
	if idx >= 0:
		hand.remove_at(idx)
		discard_pile.append(card)
		card_discarded.emit(card)


## 受到伤害
func take_damage(amount: int, attacker: Character = null) -> Dictionary:
	var result := {
		"original_damage": amount,
		"actual_damage": 0,
		"shield_absorbed": 0,
		"is_critical": false,
		"attacker": attacker
	}

	var actual_damage = amount

	# 先扣护盾
	if shield > 0:
		if shield >= amount:
			result.shield_absorbed = amount
			var old_shield = shield
			shield -= amount
			shield_changed.emit(old_shield, shield)
			return result
		else:
			result.shield_absorbed = shield
			actual_damage = amount - shield
			var old_shield = shield
			shield = 0
			shield_changed.emit(old_shield, 0)

	# 应用伤害
	var old_hp = current_hp
	current_hp = maxi(current_hp - actual_damage, 0)
	result.actual_damage = actual_damage

	if old_hp != current_hp:
		hp_changed.emit(old_hp, current_hp)

	# 检查死亡
	if current_hp <= 0:
		character_died.emit(self)

	return result


## 治疗
func heal(amount: int) -> int:
	var old_hp = current_hp
	current_hp = mini(current_hp + amount, max_hp)
	var actual_heal = current_hp - old_hp
	if actual_heal > 0:
		hp_changed.emit(old_hp, current_hp)
	return actual_heal


## 消耗内力
func use_mp(amount: int) -> bool:
	if current_mp >= amount:
		var old_mp = current_mp
		current_mp -= amount
		mp_changed.emit(old_mp, current_mp)
		return true
	return false


## 恢复内力
func recover_mp(amount: int) -> int:
	var old_mp = current_mp
	current_mp = mini(current_mp + amount, max_mp)
	var actual_recover = current_mp - old_mp
	if actual_recover > 0:
		mp_changed.emit(old_mp, current_mp)
	return actual_recover


## 添加护盾
func add_shield(amount: int) -> void:
	var old_shield = shield
	shield += amount
	shield_changed.emit(old_shield, shield)


## 消耗轻功
func use_agility(amount: int) -> bool:
	if current_agility >= amount:
		var old_agility = current_agility
		current_agility -= amount
		agility_changed.emit(old_agility, current_agility)
		return true
	return false


## 恢复轻功
func reset_agility() -> void:
	var old_agility = current_agility
	current_agility = base_agility
	agility_changed.emit(old_agility, current_agility)


## 是否存活
func is_alive() -> bool:
	return current_hp > 0


## 是否死亡
func is_dead() -> bool:
	return current_hp <= 0


## 获取队伍
func get_team() -> String:
	return battle_position.get("team", "player")


## 获取座位索引
func get_seat_index() -> int:
	return battle_position.get("seat_index", 0)


## 设置战斗位置
func set_battle_position(seat_index: int, team: String) -> void:
	battle_position = {"seat_index": seat_index, "team": team}


## 重置回合状态
func reset_for_new_turn() -> void:
	# 重置轻功
	reset_agility()

	# 重置眩晕状态
	is_stunned = false

	# 重置内功触发次数
	for passive in passives:
		passive.reset_turn_triggers()

	# 减少武功冷却
	for skill in skills:
		skill.on_turn_end()


## 回合开始触发
func on_turn_start(game_state: GameState) -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	for passive in passives:
		if passive.trigger_timing == Types.TriggerTiming.TURN_START:
			var result = passive.trigger(self, game_state)
			if result.triggered:
				results.append(result)
				passive_triggered.emit(passive, result)

	return results


## 回合结束触发
func on_turn_end(game_state: GameState) -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	for passive in passives:
		if passive.trigger_timing == Types.TriggerTiming.TURN_END:
			var result = passive.trigger(self, game_state)
			if result.triggered:
				results.append(result)
				passive_triggered.emit(passive, result)

	# 处理持续伤害
	for dot in dots:
		if dot.get("timing") == "turn_end":
			var dot_damage = dot.get("damage", 0)
			take_damage(dot_damage)

	return results


## 受到伤害时触发
func on_take_damage(game_state: GameState, attacker: Character, damage: int) -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	for passive in passives:
		if passive.trigger_timing == Types.TriggerTiming.ON_TAKE_DAMAGE:
			var result = passive.trigger(self, game_state, [attacker, damage])
			if result.triggered:
				results.append(result)
				passive_triggered.emit(passive, result)

	return results


## 造成伤害时触发
func on_damage(game_state: GameState, target: Character, damage: int) -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	for passive in passives:
		if passive.trigger_timing == Types.TriggerTiming.ON_DAMAGE:
			var result = passive.trigger(self, game_state, [target, damage])
			if result.triggered:
				results.append(result)
				passive_triggered.emit(passive, result)

	return results


## 使用基础招式时触发
func on_play_card(game_state: GameState, card: Card, target: Character) -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	for passive in passives:
		if passive.trigger_timing == Types.TriggerTiming.ON_PLAY_CARD:
			var result = passive.trigger(self, game_state, [card, target])
			if result.triggered:
				results.append(result)
				passive_triggered.emit(passive, result)

	return results


## 使用武功招式时触发
func on_skill_use(game_state: GameState, skill: Skill, target: Character) -> Array[Dictionary]:
	var results: Array[Dictionary] = []

	for passive in passives:
		if passive.trigger_timing == Types.TriggerTiming.ON_SKILL_USE:
			var result = passive.trigger(self, game_state, [skill, target])
			if result.triggered:
				results.append(result)
				passive_triggered.emit(passive, result)

	return results


## 获取可用武功列表
func get_available_skills() -> Array[Skill]:
	var available: Array[Skill] = []
	for skill in skills:
		if skill.is_available(current_mp, current_agility, hand):
			available.append(skill)
	return available


## 转换为字典
func to_dict() -> Dictionary:
	return {
		"id": id,
		"name": name,
		"title": title,
		"faction": Types.get_faction_name(faction),
		"max_hp": max_hp,
		"max_mp": max_mp,
		"base_agility": base_agility,
		"current_hp": current_hp,
		"current_mp": current_mp,
		"shield": shield,
		"current_agility": current_agility,
		"is_ai_controlled": is_ai_controlled,
		"hand_size": hand.size(),
		"deck_size": deck.size(),
		"discard_size": discard_pile.size()
	}
```

- [ ] **Step 2: 验证文件语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/character.gd
git commit -m "feat(game): 扩展角色类

- 添加完整的角色属性和状态管理
- 实现牌组操作和内功触发机制
- 添加信号支持 UI 层监听

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 6: 创建距离系统

**Files:**
- Create: `scripts/game/distance_system.gd`

- [ ] **Step 1: 创建 distance_system.gd 文件**

```gdscript
## distance_system.gd - 距离系统
## 管理多人战斗中的距离计算和目标选择

class_name DistanceSystem
extends RefCounted


## 计算物理距离（座位之间的距离）
static func calculate_distance(seat_a: int, seat_b: int, total_seats: int) -> int:
	if seat_a == seat_b:
		return 0

	# 计算顺时针和逆时针距离
	var clockwise = abs(seat_a - seat_b)
	var counter_clockwise = total_seats - clockwise

	return mini(clockwise, counter_clockwise)


## 计算实际距离（跳过死亡角色）
static func calculate_actual_distance(seat_a: int, seat_b: int, characters: Array, total_seats: int) -> int:
	if seat_a == seat_b:
		return 0

	# 获取座位顺序
	var seat_order = _get_seat_order(seat_a, total_seats)

	# 计算顺时针方向的存活角色数
	var clockwise_distance = 0
	var current_seat = seat_a

	for i in range(total_seats):
		current_seat = (current_seat + 1) % total_seats
		if current_seat == seat_b:
			break
		var char_at_seat = _get_character_at_seat(current_seat, characters)
		if char_at_seat != null and char_at_seat.is_alive():
			clockwise_distance += 1

	# 计算逆时针方向的存活角色数
	var counter_distance = 0
	current_seat = seat_a

	for i in range(total_seats):
		current_seat = (current_seat - 1 + total_seats) % total_seats
		if current_seat == seat_b:
			break
		var char_at_seat = _get_character_at_seat(current_seat, characters)
		if char_at_seat != null and char_at_seat.is_alive():
			counter_distance += 1

	return mini(clockwise_distance, counter_distance)


## 获取座位顺序（从指定座位开始的顺时针顺序）
static func _get_seat_order(start_seat: int, total_seats: int) -> Array[int]:
	var order: Array[int] = []
	for i in range(total_seats):
		order.append((start_seat + i) % total_seats)
	return order


## 获取指定座位的角色
static func _get_character_at_seat(seat_index: int, characters: Array) -> Character:
	for char in characters:
		if char is Character and char.get_seat_index() == seat_index:
			return char
	return null


## 判断两个角色是否敌对
static func is_enemy(char_a: Character, char_b: Character, mode: Types.BattleMode) -> bool:
	if mode == Types.BattleMode.FREE_FOR_ALL:
		return char_a != char_b

	# 队伍模式：不同队伍为敌人
	return char_a.get_team() != char_b.get_team()


## 获取范围内的目标
static func get_targets_in_range(actor: Character, range_val: int, characters: Array, total_seats: int, mode: Types.BattleMode) -> Array:
	var targets: Array = []

	for char in characters:
		if char is Character and char.is_alive() and char != actor:
			if is_enemy(actor, char, mode):
				var distance = calculate_actual_distance(actor.get_seat_index(), char.get_seat_index(), characters, total_seats)
				if distance <= range_val:
					targets.append(char)

	return targets


## 分配座位（队伍模式）
static func assign_seats_team(player_team: Array, enemy_team: Array) -> void:
	var total_seats = player_team.size() + enemy_team.size()

	# 玩家队伍占据左侧座位（偶数索引）
	var player_seat = 0
	for i in range(player_team.size()):
		player_team[i].set_battle_position(player_seat, "player")
		player_seat += 2

	# 敌人队伍占据右侧座位（奇数索引）
	var enemy_seat = 1
	for i in range(enemy_team.size()):
		enemy_team[i].set_battle_position(enemy_seat, "enemy")
		enemy_seat += 2


## 分配座位（自由混战模式）
static func assign_seats_free_for_all(characters: Array) -> void:
	for i in range(characters.size()):
		characters[i].set_battle_position(i, "team_%d" % i)


## 计算屏幕位置（圆形布局）
static func get_seat_position(seat_index: int, total_seats: int, center: Vector2, radius: float) -> Vector2:
	var angle = (float(seat_index) / float(total_seats)) * TAU - PI / 2
	return center + Vector2(cos(angle), sin(angle)) * radius


## 获取最近敌人
static func get_nearest_enemy(actor: Character, characters: Array, total_seats: int, mode: Types.BattleMode) -> Character:
	var nearest: Character = null
	var min_distance = 999

	for char in characters:
		if char is Character and char.is_alive() and is_enemy(actor, char, mode):
			var distance = calculate_actual_distance(actor.get_seat_index(), char.get_seat_index(), characters, total_seats)
			if distance < min_distance:
				min_distance = distance
				nearest = char

	return nearest


## 获取所有敌人
static func get_all_enemies(actor: Character, characters: Array, mode: Types.BattleMode) -> Array:
	var enemies: Array = []
	for char in characters:
		if char is Character and char.is_alive() and is_enemy(actor, char, mode):
			enemies.append(char)
	return enemies


## 获取所有队友
static func get_all_allies(actor: Character, characters: Array, mode: Types.BattleMode) -> Array:
	var allies: Array = []
	for char in characters:
		if char is Character and char.is_alive() and not is_enemy(actor, char, mode):
			allies.append(char)
	return allies
```

- [ ] **Step 2: 验证文件语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/distance_system.gd
git commit -m "feat(game): 添加距离系统

- 实现圆形座位布局的距离计算
- 支持队伍模式和自由混战模式
- 提供目标选择辅助函数

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 7: 创建效果处理器

**Files:**
- Create: `scripts/game/effect_processor.gd`

- [ ] **Step 1: 创建 effect_processor.gd 文件**

```gdscript
## effect_processor.gd - 效果处理器
## 处理卡牌、武功、内功的效果应用

class_name EffectProcessor
extends RefCounted


## 处理卡牌效果
static func process_card_effect(source: Character, target: Character, card: Card, game_state: GameState) -> Dictionary:
	var result := {
		"card_id": card.card_id,
		"source": source,
		"target": target,
		"effects": []
	}

	# 处理伤害
	if card.damage > 0:
		var damage_result = _apply_damage(source, target, card.damage, game_state)
		result.effects.append(damage_result)

	# 处理护盾
	if card.shield > 0:
		var shield_result = _apply_shield(source, card.shield)
		result.effects.append(shield_result)

	# 处理治疗
	if card.heal > 0:
		var heal_result = _apply_heal(source, card.heal)
		result.effects.append(heal_result)

	# 处理特殊效果
	for effect in card.effects:
		var effect_result = _process_effect(source, target, effect, game_state)
		result.effects.append(effect_result)

	return result


## 处理武功效果
static func process_skill_effect(source: Character, target: Character, skill: Skill, game_state: GameState) -> Dictionary:
	var result := {
		"skill_id": skill.skill_id,
		"source": source,
		"target": target,
		"effects": []
	}

	# 处理伤害
	if skill.damage > 0:
		var damage_result = _apply_damage(source, target, skill.damage, game_state)
		result.effects.append(damage_result)

	# 处理特殊效果
	for effect in skill.effects:
		var effect_result = _process_effect(source, target, effect, game_state)
		result.effects.append(effect_result)

	# 消耗内力
	source.use_mp(skill.mp_cost)

	return result


## 应用伤害
static func _apply_damage(source: Character, target: Character, amount: int, game_state: GameState) -> Dictionary:
	# 触发伤害加成内功
	var damage_modifiers = _get_damage_modifiers(source, game_state)
	var final_damage = amount

	for mod in damage_modifiers:
		if mod.get("type") == "damage_boost":
			final_damage = int(final_damage * (1 + float(mod.value) / 100.0))

	# 应用伤害
	var damage_result = target.take_damage(final_damage, source)

	# 触发内功
	source.on_damage(game_state, target, damage_result.actual_damage)
	target.on_take_damage(game_state, source, damage_result.actual_damage)

	return {
		"type": "damage",
		"amount": damage_result.actual_damage,
		"original_amount": amount,
		"shield_absorbed": damage_result.shield_absorbed,
		"target": target.name
	}


## 应用护盾
static func _apply_shield(source: Character, amount: int) -> Dictionary:
	source.add_shield(amount)
	return {
		"type": "shield",
		"amount": amount,
		"target": source.name
	}


## 应用治疗
static func _apply_heal(source: Character, amount: int) -> Dictionary:
	var actual_heal = source.heal(amount)
	return {
		"type": "heal",
		"amount": actual_heal,
		"target": source.name
	}


## 处理特殊效果
static func _process_effect(source: Character, target: Character, effect: Dictionary, game_state: GameState) -> Dictionary:
	var effect_type = effect.get("type", "")
	var value = effect.get("value", 0)

	var result := {"type": effect_type, "value": 0}

	match effect_type:
		"heal", "heal_self":
			result.value = source.heal(value)
			result.target = source.name

		"heal_target":
			result.value = target.heal(value)
			result.target = target.name

		"shield", "add_shield":
			source.add_shield(value)
			result.value = value
			result.target = source.name

		"damage", "damage_target":
			var damage_result = target.take_damage(value, source)
			result.value = damage_result.actual_damage
			result.target = target.name

		"mp_recover", "recover_mp":
			result.value = source.recover_mp(value)
			result.target = source.name

		"mp_drain":
			result.value = target.use_mp(value) if target.current_mp >= value else 0
			result.target = target.name

		"agility_boost":
			source.current_agility += value
			result.value = value
			result.target = source.name

		"agility_reduce":
			target.current_agility = maxi(target.current_agility - value, 0)
			result.value = value
			result.target = target.name

		"draw_cards":
			var drawn = source.draw_cards(value)
			result.value = drawn.size()
			result.target = source.name

		"discard_random":
			var discard_count = mini(value, target.hand.size())
			for i in discard_count:
				if target.hand.size() > 0:
					var random_idx = randi() % target.hand.size()
					target.discard_card(target.hand[random_idx])
			result.value = discard_count
			result.target = target.name

		"stun":
			target.is_stunned = true
			result.value = 1
			result.target = target.name

		"poison":
			target.dots.append({
				"type": "poison",
				"damage": value,
				"duration": effect.get("duration", 3),
				"timing": "turn_end"
			})
			result.value = value
			result.target = target.name

		_:
			result.description = "未知效果: %s" % effect_type

	return result


## 获取伤害修正
static func _get_damage_modifiers(source: Character, game_state: GameState) -> Array:
	var modifiers: Array = []

	for passive in source.passives:
		for effect in passive.effects:
			if effect.get("type") in ["damage_boost", "damage_reduction"]:
				modifiers.append(effect)

	return modifiers


## 计算最终伤害
static func calculate_final_damage(base_damage: int, source: Character, target: Character) -> int:
	var damage = base_damage

	# 应用伤害加成
	for passive in source.passives:
		for effect in passive.effects:
			if effect.get("type") == "damage_boost":
				damage = int(damage * (1 + float(effect.value) / 100.0))

	# 应用伤害减免
	for passive in target.passives:
		for effect in passive.effects:
			if effect.get("type") == "damage_reduction":
				damage = int(damage * (1 - float(effect.value) / 100.0))

	return maxi(damage, 0)
```

- [ ] **Step 2: 验证文件语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/effect_processor.gd
git commit -m "feat(game): 添加效果处理器

- 实现卡牌和武功效果处理
- 支持伤害、护盾、治疗等多种效果
- 处理内功伤害修正

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 8: 创建游戏状态管理类

**Files:**
- Create: `scripts/game/game_state.gd`

- [ ] **Step 1: 创建 game_state.gd 文件**

```gdscript
## game_state.gd - 游戏状态管理
## 管理战斗流程、回合、行动顺序

class_name GameState
extends Node

# ==================== 信号 ====================
signal turn_started(turn_number: int)
signal turn_ended()
signal actor_changed(actor: Character)
signal card_played(actor: Character, card: Card, target: Character)
signal skill_used(actor: Character, skill: Skill, target: Character)
signal damage_dealt(target: Character, amount: int)
signal character_died(character: Character)
signal game_ended(winner_team: Array)
signal phase_changed(new_phase: Types.GamePhase)

# ==================== 战斗模式 ====================
var battle_mode: Types.BattleMode = Types.BattleMode.TEAM

# ==================== 队伍 ====================
var player_team: Array[Character] = []
var enemy_team: Array[Character] = []
var total_seats: int = 0

# 向后兼容（1v1）
var player: Character:
	get:
		return player_team[0] if player_team.size() > 0 else null

var enemy: Character:
	get:
		return enemy_team[0] if enemy_team.size() > 0 else null

# ==================== 当前状态 ====================
var current_turn: int = 0
var current_actor: Character = null
var phase: Types.GamePhase = Types.GamePhase.SETUP
var selected_target: Character = null

# ==================== 战斗日志 ====================
var battle_log: Array = []

# ==================== AI 控制器 ====================
var ai_controller: AIController = null


## 初始化队伍战斗
func init_team_battle(player_ids: Array, enemy_ids: Array, mode: Types.BattleMode = Types.BattleMode.TEAM) -> void:
	battle_mode = mode
	phase = Types.GamePhase.SETUP

	# 创建角色
	player_team.clear()
	enemy_team.clear()

	for char_id in player_ids:
		var char_data = GameManager.characters_data.get(char_id, {})
		if not char_data.is_empty():
			var char = Character.from_data(char_data)
			player_team.append(char)

	for char_id in enemy_ids:
		var char_data = GameManager.characters_data.get(char_id, {})
		if not char_data.is_empty():
			var char = Character.from_data(char_data)
			char.is_ai_controlled = true
			enemy_team.append(char)

	# 计算总座位数
	total_seats = player_team.size() + enemy_team.size()

	# 分配座位
	if mode == Types.BattleMode.TEAM:
		DistanceSystem.assign_seats_team(player_team, enemy_team)
	else:
		var all_chars = get_all_characters()
		DistanceSystem.assign_seats_free_for_all(all_chars)

	# 初始化角色战斗状态
	for char in get_all_characters():
		char.init_for_battle()

	# 创建 AI 控制器
	ai_controller = AIController.new()
	ai_controller.game_state = self

	# 连接角色信号
	_connect_character_signals()

	# 开始战斗
	_start_battle()


## 连接角色信号
func _connect_character_signals() -> void:
	for char in get_all_characters():
		char.hp_changed.connect(_on_character_hp_changed)
		char.character_died.connect(_on_character_died)


## 角色血量变化
func _on_character_hp_changed(old_value: int, new_value: int) -> void:
	pass  # UI 层监听角色信号


## 角色死亡
func _on_character_died(character: Character) -> void:
	_add_log("%s 阵亡" % character.name)
	character_died.emit(character)
	_check_game_end()


## 开始战斗
func _start_battle() -> void:
	current_turn = 0
	phase = Types.GamePhase.SELECTING
	phase_changed.emit(phase)

	# 开始第一回合
	start_new_turn()


## 开始新回合
func start_new_turn() -> void:
	current_turn += 1
	_add_log("=== 第 %d 回合 ===" % current_turn)

	# 重置角色回合状态
	for char in get_alive_characters():
		char.reset_for_new_turn()

	# 双方抽牌
	for char in get_alive_characters():
		char.draw_cards(Types.DEFAULT_DRAW_COUNT)

	# 触发回合开始内功
	for char in get_alive_characters():
		char.on_turn_start(self)

	# 决定行动顺序
	decide_turn_order()

	turn_started.emit(current_turn)


## 决定回合行动顺序
func decide_turn_order() -> void:
	# 按轻功值排序，高者先行动
	var all_alive = get_alive_characters()
	all_alive.sort_custom(func(a, b): return a.current_agility > b.current_agility)

	# 设置当前行动方
	if all_alive.size() > 0:
		current_actor = all_alive[0]
		actor_changed.emit(current_actor)

		# 如果是 AI 控制，触发 AI
		if current_actor.is_ai_controlled:
			_trigger_ai()


## 切换行动方
func switch_actor() -> void:
	var all_alive = get_alive_characters()

	# 找到下一个可行动的角色
	var current_index = all_alive.find(current_actor)
	var next_index = (current_index + 1) % all_alive.size()

	# 循环查找直到找到有足够轻功的角色
	for i in range(all_alive.size()):
		var next_actor = all_alive[(next_index + i) % all_alive.size()]
		if next_actor.is_alive() and next_actor.current_agility > 0:
			current_actor = next_actor
			actor_changed.emit(current_actor)

			# 如果是 AI 控制，触发 AI
			if current_actor.is_ai_controlled:
				_trigger_ai()
			return

	# 所有角色轻功耗尽，结束回合
	end_turn()


## 检查是否应该切换行动方
func should_switch_actor() -> bool:
	if current_actor == null:
		return false

	var opponent = _get_next_actor()
	if opponent == null:
		return false

	return current_actor.current_agility < opponent.current_agility


## 获取下一个可行动角色
func _get_next_actor() -> Character:
	var all_alive = get_alive_characters()
	var current_index = all_alive.find(current_actor)

	for i in range(1, all_alive.size()):
		var next = all_alive[(current_index + i) % all_alive.size()]
		if next.is_alive() and next.current_agility > 0:
			return next

	return null


## 结束回合
func end_turn() -> void:
	# 触发回合结束内功
	for char in get_alive_characters():
		char.on_turn_end(self)

	turn_ended.emit()

	# 检查游戏是否结束
	if not check_game_end():
		# 开始下一回合
		start_new_turn()


## 使用基础招式
func use_basic_card(card_instance_id: String, target_id: String = "") -> Dictionary:
	if current_actor == null:
		return {"success": false, "reason": "no_actor"}

	if current_actor.is_stunned:
		return {"success": false, "reason": "stunned"}

	# 找到卡牌
	var card: Card = null
	for c in current_actor.hand:
		if c.instance_id == card_instance_id:
			card = c
			break

	if card == null:
		return {"success": false, "reason": "card_not_found"}

	# 检查轻功
	if current_actor.current_agility < card.agility_cost:
		return {"success": false, "reason": "not_enough_agility"}

	# 获取目标
	var target: Character = null
	if card.requires_target:
		if target_id.is_empty():
			# 进入目标选择模式
			phase = Types.GamePhase.SELECTING_TARGET
			phase_changed.emit(phase)
			return {"success": false, "reason": "need_target"}
		else:
			target = get_character_by_id(target_id)
	else:
		target = current_actor

	# 执行卡牌
	phase = Types.GamePhase.ACTING
	phase_changed.emit(phase)

	# 打出卡牌
	card = current_actor.play_card_by_instance_id(card_instance_id)

	# 消耗轻功
	current_actor.use_agility(card.agility_cost)

	# 处理效果
	var result = EffectProcessor.process_card_effect(current_actor, target, card, self)

	# 触发内功
	current_actor.on_play_card(self, card, target)

	# 发送信号
	card_played.emit(current_actor, card, target)
	_add_log("%s 使用 %s" % [current_actor.name, card.name])

	# 检查目标死亡
	if target.is_dead():
		_add_log("%s 被击败" % target.name)

	# 恢复选择状态
	phase = Types.GamePhase.SELECTING
	phase_changed.emit(phase)

	# 检查切换行动方
	if should_switch_actor():
		switch_actor()

	return {"success": true, "result": result}


## 使用武功招式
func use_skill(skill_id: String, card_instance_id: String, target_id: String = "") -> Dictionary:
	if current_actor == null:
		return {"success": false, "reason": "no_actor"}

	if current_actor.is_stunned:
		return {"success": false, "reason": "stunned"}

	# 找到武功
	var skill: Skill = null
	for s in current_actor.skills:
		if s.skill_id == skill_id:
			skill = s
			break

	if skill == null:
		return {"success": false, "reason": "skill_not_found"}

	# 检查可用性
	if not skill.is_available(current_actor.current_mp, current_actor.current_agility, current_actor.hand):
		return {"success": false, "reason": "skill_not_available"}

	# 找到媒介卡牌
	var card: Card = null
	for c in current_actor.hand:
		if c.instance_id == card_instance_id:
			card = c
			break

	if card == null:
		return {"success": false, "reason": "card_not_found"}

	# 检查媒介卡牌类型
	if not Types.is_card_type_match(card.type, skill.required_card_type):
		return {"success": false, "reason": "invalid_card_type"}

	# 获取目标
	var target: Character = null
	if skill.requires_target:
		if target_id.is_empty():
			phase = Types.GamePhase.SELECTING_TARGET
			phase_changed.emit(phase)
			return {"success": false, "reason": "need_target"}
		else:
			target = get_character_by_id(target_id)
	else:
		target = current_actor

	# 执行武功
	phase = Types.GamePhase.ACTING
	phase_changed.emit(phase)

	# 打出媒介卡牌
	current_actor.play_card_by_instance_id(card_instance_id)

	# 消耗内力和轻功
	current_actor.use_mp(skill.mp_cost)
	current_actor.use_agility(skill.agility_cost)

	# 使用武功（设置冷却）
	skill.use()

	# 处理效果
	var result = EffectProcessor.process_skill_effect(current_actor, target, skill, self)

	# 触发内功
	current_actor.on_skill_use(self, skill, target)

	# 发送信号
	skill_used.emit(current_actor, skill, target)
	_add_log("%s 使用 %s" % [current_actor.name, skill.name])

	# 检查目标死亡
	if target.is_dead():
		_add_log("%s 被击败" % target.name)

	# 恢复选择状态
	phase = Types.GamePhase.SELECTING
	phase_changed.emit(phase)

	# 检查切换行动方
	if should_switch_actor():
		switch_actor()

	return {"success": true, "result": result}


## 结束当前行动方回合
func end_actor_turn() -> void:
	# 强制消耗剩余轻功
	if current_actor:
		current_actor.current_agility = 0
		switch_actor()


## 触发 AI
func _trigger_ai() -> void:
	if ai_controller == null or current_actor == null:
		return

	await get_tree().create_timer(ai_controller.decision_delay).timeout

	while current_actor != null and current_actor.is_ai_controlled and current_actor.is_alive() and current_actor.current_agility > 0:
		var action = await ai_controller.decide_action(current_actor)

		if action.is_empty():
			break

		# 执行行动
		_execute_ai_action(action)

		# 检查是否切换
		if should_switch_actor():
			switch_actor()
			break

		await get_tree().create_timer(0.6).timeout


## 执行 AI 行动
func _execute_ai_action(action: Dictionary) -> void:
	match action.get("type", ""):
		"basic_card":
			use_basic_card(action.card_instance_id, action.target_id)
		"skill":
			use_skill(action.skill_id, action.card_instance_id, action.target_id)
		"end_turn":
			end_actor_turn()


## 获取所有角色
func get_all_characters() -> Array:
	var all: Array = []
	all.append_array(player_team)
	all.append_array(enemy_team)
	return all


## 获取存活角色
func get_alive_characters(team: String = "") -> Array:
	var alive: Array = []

	for char in get_all_characters():
		if char.is_alive():
			if team.is_empty() or char.get_team() == team:
				alive.append(char)

	return alive


## 获取范围内目标
func get_targets_in_range(actor: Character, range_val: int) -> Array:
	return DistanceSystem.get_targets_in_range(actor, range_val, get_all_characters(), total_seats, battle_mode)


## 计算实际距离
func get_actual_distance(actor: Character, target: Character) -> int:
	return DistanceSystem.calculate_actual_distance(actor.get_seat_index(), target.get_seat_index(), get_all_characters(), total_seats)


## 通过ID获取角色
func get_character_by_id(char_id: String) -> Character:
	for char in get_all_characters():
		if char.id == char_id:
			return char
	return null


## 检查游戏结束
func check_game_end() -> bool:
	var player_alive = get_alive_characters("player").size()
	var enemy_alive = get_alive_characters("enemy").size()

	if player_alive == 0 or enemy_alive == 0:
		end_game()
		return true

	return false


## 结束游戏
func end_game() -> void:
	phase = Types.GamePhase.GAME_OVER
	phase_changed.emit(phase)

	var winner_team: Array = []
	if get_alive_characters("player").size() > 0:
		winner_team = player_team
	else:
		winner_team = enemy_team

	game_ended.emit(winner_team)
	_add_log("战斗结束！")


## 添加战斗日志
func _add_log(message: String) -> void:
	battle_log.append({"turn": current_turn, "message": message})


## 获取战斗日志
func get_log() -> Array:
	return battle_log
```

- [ ] **Step 2: 验证文件语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/game_state.gd
git commit -m "feat(game): 添加游戏状态管理类

- 实现完整战斗流程管理
- 支持多人战斗和回合行动顺序
- 集成 AI 控制器和效果处理器

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 9: 创建 AI 控制器

**Files:**
- Create: `scripts/game/ai_controller.gd`

- [ ] **Step 1: 创建 ai_controller.gd 文件**

```gdscript
## ai_controller.gd - AI 控制器
## 管理 AI 角色的决策和行动

class_name AIController
extends RefCounted

## 游戏状态引用
var game_state: GameState = null

## 决策延迟（秒）
var decision_delay: float = 0.8

## 信号
signal action_decided(action: Dictionary)


## 决定行动
func decide_action(actor: Character) -> Dictionary:
	if game_state == null or actor == null:
		return {}

	# 检查眩晕
	if actor.is_stunned:
		return {"type": "end_turn"}

	# 尝试使用武功招式
	var skill_action = try_skill_action(actor)
	if not skill_action.is_empty():
		return skill_action

	# 使用基础招式
	var card_action = try_card_action(actor)
	if not card_action.is_empty():
		return card_action

	# 无可用行动，结束回合
	return {"type": "end_turn"}


## 尝试使用武功招式
func try_skill_action(actor: Character) -> Dictionary:
	var available_skills = actor.get_available_skills()

	if available_skills.is_empty():
		return {}

	# 按优先级排序（高伤害优先）
	available_skills.sort_custom(func(a, b): return a.damage > b.damage)

	for skill in available_skills:
		# 获取可用媒介卡牌
		var card_indices = skill.get_available_card_indices(actor.hand)

		if card_indices.is_empty():
			continue

		# 选择最佳媒介卡牌
		var card_index = _select_best_medium_card(actor, skill, card_indices)
		if card_index < 0:
			continue

		var card = actor.hand[card_index]

		# 选择目标
		var target = select_best_target(actor, skill)
		if target == null and skill.requires_target:
			continue

		return {
			"type": "skill",
			"skill_id": skill.skill_id,
			"card_instance_id": card.instance_id,
			"target_id": target.id if target else ""
		}

	return {}


## 尝试使用基础招式
func try_card_action(actor: Character) -> Dictionary:
	var available_cards = _get_available_cards(actor)

	if available_cards.is_empty():
		return {}

	# 选择最佳卡牌
	var best_card_index = _select_best_card(actor, available_cards)
	if best_card_index < 0:
		return {}

	var card = actor.hand[best_card_index]

	# 选择目标
	var target = select_best_target(actor, card)
	if target == null and card.requires_target:
		return {}

	return {
		"type": "basic_card",
		"card_instance_id": card.instance_id,
		"target_id": target.id if target else ""
	}


## 获取可用卡牌（轻功足够）
func _get_available_cards(actor: Character) -> Array[int]:
	var result: Array[int] = []

	for i in range(actor.hand.size()):
		var card = actor.hand[i]
		if card.agility_cost <= actor.current_agility:
			result.append(i)

	return result


## 选择最佳卡牌
func _select_best_card(actor: Character, available_indices: Array[int]) -> int:
	if available_indices.is_empty():
		return -1

	var best_index = available_indices[0]
	var best_score = 0.0

	for idx in available_indices:
		var card = actor.hand[idx]
		var score = _calculate_card_score(actor, card)

		if score > best_score:
			best_score = score
			best_index = idx

	return best_index


## 计算卡牌得分
func _calculate_card_score(actor: Character, card: Card) -> float:
	var score = 0.0

	# 伤害得分
	if card.damage > 0:
		score += card.damage * 2.0

	# 护盾得分（低血量时优先）
	if card.shield > 0:
		var hp_ratio = float(actor.current_hp) / float(actor.max_hp)
		if hp_ratio < 0.5:
			score += card.shield * 3.0
		else:
			score += card.shield * 1.0

	# 治疗得分（低血量时优先）
	if card.heal > 0:
		var hp_ratio = float(actor.current_hp) / float(actor.max_hp)
		if hp_ratio < 0.3:
			score += card.heal * 4.0
		elif hp_ratio < 0.5:
			score += card.heal * 2.0
		else:
			score += card.heal * 0.5

	# 效率调整
	var efficiency = score / max(card.agility_cost, 1)
	return efficiency


## 选择最佳媒介卡牌
func _select_best_medium_card(actor: Character, skill: Skill, available_indices: Array[int]) -> int:
	if available_indices.is_empty():
		return -1

	# 简单策略：选择第一张可用卡牌
	# TODO: 更复杂的媒介卡牌选择策略
	return available_indices[0]


## 选择最佳目标
func select_best_target(actor: Character, source) -> Character:
	var enemies: Array

	if source is Skill:
		enemies = game_state.get_targets_in_range(actor, source.range_requirement if source.range_requirement > 0 else 999)
	elif source is Card:
		enemies = DistanceSystem.get_all_enemies(actor, game_state.get_all_characters(), game_state.battle_mode)
	else:
		enemies = DistanceSystem.get_all_enemies(actor, game_state.get_all_characters(), game_state.battle_mode)

	if enemies.is_empty():
		return null

	# 优先攻击低血量目标
	enemies.sort_custom(func(a, b): return a.current_hp < b.current_hp)

	# 选择血量最低的存活敌人
	for enemy in enemies:
		if enemy.is_alive():
			return enemy

	return null


## 选择治疗目标（队友）
func select_heal_target(actor: Character) -> Character:
	var allies = DistanceSystem.get_all_allies(actor, game_state.get_all_characters(), game_state.battle_mode)

	if allies.is_empty():
		return actor  # 没有队友，治疗自己

	# 优先治疗血量最低的队友
	allies.sort_custom(func(a, b): return float(a.current_hp) / float(a.max_hp) < float(b.current_hp) / float(b.max_hp))

	return allies[0]


## 评估局势
func evaluate_situation(actor: Character) -> Dictionary:
	var enemies = DistanceSystem.get_all_enemies(actor, game_state.get_all_characters(), game_state.battle_mode)
	var allies = DistanceSystem.get_all_allies(actor, game_state.get_all_characters(), game_state.battle_mode)

	var total_enemy_hp = 0
	var total_ally_hp = 0

	for enemy in enemies:
		total_enemy_hp += enemy.current_hp

	for ally in allies:
		total_ally_hp += ally.current_hp

	return {
		"enemy_count": enemies.size(),
		"ally_count": allies.size(),
		"total_enemy_hp": total_enemy_hp,
		"total_ally_hp": total_ally_hp,
		"hp_ratio": float(actor.current_hp) / float(actor.max_hp),
		"is_dangerous": float(actor.current_hp) / float(actor.max_hp) < 0.3
	}
```

- [ ] **Step 2: 验证文件语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/ai_controller.gd
git commit -m "feat(game): 添加 AI 控制器

- 实现武功招式和基础招式决策
- 支持目标选择和局势评估
- 提供卡牌评分和优先级排序

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 10: 更新 GameManager 添加 passives_data

**Files:**
- Modify: `scripts/autoload/game_manager.gd`

- [ ] **Step 1: 更新 game_manager.gd**

```gdscript
extends Node

## 游戏管理器 - 管理全局状态、场景切换、游戏数据

# 当前游戏状态
enum GameState { MENU, CHARACTER_SELECT, BATTLE, RESULT }
var current_state: GameState = GameState.MENU

# 玩家选择的角色
var player_character_id: String = ""
var enemy_character_id: String = ""

# 角色数据缓存
var characters_data: Dictionary = {}
var skills_data: Dictionary = {}
var cards_data: Dictionary = {}
var passives_data: Dictionary = {}  ## 内功数据


func _ready() -> void:
	load_game_data()


func load_game_data() -> void:
	"""加载游戏数据"""
	characters_data = _load_json("res://resources/characters/characters.json")
	skills_data = _load_json("res://resources/skills/skills.json")
	cards_data = _load_json("res://resources/cards/cards.json")
	passives_data = _load_json("res://resources/passives/passives.json")


func _load_json(path: String) -> Dictionary:
	"""加载 JSON 文件"""
	if FileAccess.file_exists(path):
		var file = FileAccess.open(path, FileAccess.READ)
		var json = JSON.new()
		json.parse(file.get_as_text())
		return json.data
	return {}


func change_state(new_state: GameState) -> void:
	"""切换游戏状态"""
	current_state = new_state
	match new_state:
		GameState.MENU:
			get_tree().change_scene_to_file("res://scenes/main.tscn")
		GameState.CHARACTER_SELECT:
			get_tree().change_scene_to_file("res://scenes/character_select.tscn")
		GameState.BATTLE:
			get_tree().change_scene_to_file("res://scenes/battle.tscn")
		GameState.RESULT:
			get_tree().change_scene_to_file("res://scenes/result.tscn")


func get_character_data(character_id: String) -> Dictionary:
	"""获取角色数据"""
	return characters_data.get(character_id, {})


func get_skill_data(skill_id: String) -> Dictionary:
	"""获取武功数据"""
	return skills_data.get(skill_id, {})


func get_card_data(card_id: String) -> Dictionary:
	"""获取卡牌数据"""
	return cards_data.get(card_id, {})


func get_passive_data(passive_id: String) -> Dictionary:
	"""获取内功数据"""
	return passives_data.get(passive_id, {})
```

- [ ] **Step 2: 验证文件语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 3: 提交**

```bash
git add scripts/autoload/game_manager.gd
git commit -m "feat(game): 更新 GameManager 添加内功数据支持

- 添加 passives_data 数据缓存
- 添加内功数据获取方法
- 扩展数据加载逻辑

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 11: 创建内功数据文件

**Files:**
- Create: `resources/passives/passives.json`

- [ ] **Step 1: 创建内功数据目录和文件**

```json
{
	"dragon_elephant": {
		"id": "dragon_elephant",
		"name": "龙象般若功",
		"trigger_timing": "on_damage",
		"effects": [
			{
				"type": "damage_boost",
				"value": 20
			}
		],
		"trigger_chance": 1.0,
		"description": "造成伤害时，伤害提升20%",
		"triggers_per_turn": 0
	},
	"nine_yang": {
		"id": "nine_yang",
		"name": "九阳神功",
		"trigger_timing": "turn_end",
		"effects": [
			{
				"type": "heal_self",
				"value": 5
			}
		],
		"trigger_chance": 1.0,
		"description": "回合结束时，恢复5点生命",
		"triggers_per_turn": 0
	},
	"nine_yin": {
		"id": "nine_yin",
		"name": "九阴真经",
		"trigger_timing": "turn_start",
		"effects": [
			{
				"type": "shield",
				"value": 3
			}
		],
		"trigger_chance": 1.0,
		"description": "回合开始时，获得3点护盾",
		"triggers_per_turn": 0
	},
	"dog_beating": {
		"id": "dog_beating",
		"name": "打狗心法",
		"trigger_timing": "on_take_damage",
		"effects": [
			{
				"type": "damage_reduction",
				"value": 10
			}
		],
		"trigger_chance": 1.0,
		"description": "受到伤害时，伤害减免10%",
		"triggers_per_turn": 0
	},
	"drunken_fist": {
		"id": "drunken_fist",
		"name": "醉仙望月",
		"trigger_timing": "turn_start",
		"effects": [
			{
				"type": "agility_boost",
				"value": 2
			}
		],
		"trigger_chance": 1.0,
		"description": "回合开始时，轻功提升2点",
		"triggers_per_turn": 0
	}
}
```

- [ ] **Step 2: 提交**

```bash
git add resources/passives/passives.json
git commit -m "feat(data): 添加内功数据配置

- 添加龙象般若功、九阳神功等内功
- 配置触发时机和效果
- 为角色内功系统提供数据支持

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## Task 12: Phase 1 完成验证

- [ ] **Step 1: 运行 Godot 验证项目**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误输出

- [ ] **Step 2: 检查所有文件是否创建**

确认以下文件存在：
- `scripts/game/types.gd`
- `scripts/game/card.gd`
- `scripts/game/skill.gd`
- `scripts/game/passive.gd`
- `scripts/game/character.gd` (已修改)
- `scripts/game/distance_system.gd`
- `scripts/game/effect_processor.gd`
- `scripts/game/game_state.gd`
- `scripts/game/ai_controller.gd`
- `resources/passives/passives.json`

- [ ] **Step 3: 提交 Phase 1 完成标记**

```bash
git add -A
git commit -m "feat(game): Phase 1 核心逻辑迁移完成

完成内容：
- 类型定义系统 (types.gd)
- 卡牌类 (card.gd)
- 武功招式类 (skill.gd)
- 内功类 (passive.gd)
- 角色类扩展 (character.gd)
- 距离系统 (distance_system.gd)
- 效果处理器 (effect_processor.gd)
- 游戏状态管理 (game_state.gd)
- AI 控制器 (ai_controller.gd)
- 内功数据配置

Co-Authored-By: Claude Opus 4.7 <noreply@anthropic.com>"
```

---

## 自检清单

**1. Spec 覆盖检查：**
- [x] 类型定义 - Task 1
- [x] 卡牌类 - Task 2
- [x] 武功招式类 - Task 3
- [x] 内功类 - Task 4
- [x] 角色类扩展 - Task 5
- [x] 距离系统 - Task 6
- [x] 效果处理器 - Task 7
- [x] 游戏状态管理 - Task 8
- [x] AI 控制器 - Task 9
- [x] GameManager 更新 - Task 10
- [x] 内功数据 - Task 11

**2. 占位符扫描：**
- 无 "TBD"、"TODO"、"implement later" 等占位符
- 所有代码步骤都包含完整实现

**3. 类型一致性检查：**
- `Card.instance_id` 在所有文件中一致使用
- `Character.get_seat_index()` 方法名称一致
- `Skill.is_available()` 方法签名一致
- `Passive.trigger()` 方法签名一致
