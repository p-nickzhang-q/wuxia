# 战斗系统重构实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 重构战斗系统，采用函数式设计，完整实现回合流程、武功效果、内功触发和AI系统。

**Architecture:** 使用工厂函数创建状态对象（GameState、CharacterState），通过信号驱动UI更新。删除现有的类式实现，重新实现。

**Tech Stack:** Godot 4.6 + GDScript

---

## 文件结构

### 删除的文件
- `scripts/game/battle_manager.gd` - 旧的战斗管理器
- `scripts/game/character.gd` - 旧的角色类
- `scripts/game/card.gd` - 旧的卡牌类
- `scripts/game/skill.gd` - 旧的武功类
- `scripts/game/passive.gd` - 旧的内功类
- `scripts/game/game_state.gd` - 旧的游戏状态
- `scripts/game/effect_processor.gd` - 旧的效果处理器
- `scripts/game/distance_system.gd` - 旧的距离系统
- `scripts/game/ai.gd` - 旧的AI系统

### 创建的文件
- `scripts/game/types.gd` - 更新类型定义（保留，更新EffectType）
- `scripts/game/card_state.gd` - 卡牌状态工厂函数
- `scripts/game/character_state.gd` - 角色状态工厂函数
- `scripts/game/skill_state.gd` - 武功状态工厂函数
- `scripts/game/passive_state.gd` - 内功状态工厂函数
- `scripts/game/game_state.gd` - 游戏状态工厂函数（重写）
- `scripts/game/effect_processor.gd` - 效果处理器（重写）
- `scripts/game/ai.gd` - AI系统（重写）

---

## Task 1: 更新类型定义

**Files:**
- Modify: `scripts/game/types.gd`

- [ ] **Step 1: 更新 EffectType 枚举**

修改 `types.gd` 中的 EffectType 枚举，匹配设计文档：

```gdscript
## 效果类型
enum EffectType {
    DAMAGE,            ## 造成伤害
    SHIELD,            ## 获得护盾
    SELF_DAMAGE,       ## 自伤
    DRAIN_MP,          ## 吸取内力
    REMOVE_MP,         ## 消除内力（造成等量伤害）
    DRAIN_HP,          ## 吸取生命
    DOT,               ## 持续伤害
    DEBUFF_AGILITY,    ## 降低轻功
    DISABLE_CARD_TYPE, ## 禁用卡牌类型
    EXTRA_ACTION,      ## 额外行动
    MIMIC              ## 模仿上一次武功
}
```

- [ ] **Step 2: 添加效果类型名称映射**

在 `types.gd` 中添加：

```gdscript
## 效果类型名称映射
const EFFECT_TYPE_NAMES: Dictionary = {
    EffectType.DAMAGE: "伤害",
    EffectType.SHIELD: "护盾",
    EffectType.SELF_DAMAGE: "自伤",
    EffectType.DRAIN_MP: "吸取内力",
    EffectType.REMOVE_MP: "消除内力",
    EffectType.DRAIN_HP: "吸取生命",
    EffectType.DOT: "持续伤害",
    EffectType.DEBUFF_AGILITY: "降低轻功",
    EffectType.DISABLE_CARD_TYPE: "禁用卡牌",
    EffectType.EXTRA_ACTION: "额外行动",
    EffectType.MIMIC: "模仿"
}
```

- [ ] **Step 3: 验证语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误退出

- [ ] **Step 4: 提交**

```bash
git add scripts/game/types.gd
git commit -m "refactor(types): 更新效果类型枚举匹配设计文档"
```

---

## Task 2: 创建卡牌状态工厂函数

**Files:**
- Create: `scripts/game/card_state.gd`
- Delete: `scripts/game/card.gd`

- [ ] **Step 1: 创建 card_state.gd**

```gdscript
## card_state.gd - 卡牌状态工厂函数
## 使用函数式设计创建卡牌状态对象

class_name CardState
extends RefCounted

## 创建卡牌状态
## @param card_id: 卡牌配置ID
## @param instance_id: 卡牌实例ID（战斗中唯一）
## @param data: 卡牌配置数据（可选，从GameManager获取）
## @return: 卡牌状态字典
static func create(card_id: String, instance_id: String, data: Dictionary = {}) -> Dictionary:
    # 如果没有提供数据，从GameManager获取
    if data.is_empty():
        data = GameManager.cards_data.get(card_id, {})

    # 解析卡牌类型
    var card_type = _parse_card_type(data.get("type", "fist"))

    return {
        "id": card_id,
        "instance_id": instance_id,
        "name": data.get("name", "未知卡牌"),
        "type": card_type,
        "base_damage": data.get("damage", 0),
        "base_shield": data.get("defense", 0),
        "agility_cost": data.get("agility_cost", 1),
        "self_damage": data.get("self_damage", 0),
        "range": data.get("range", 1)
    }


## 解析卡牌类型字符串
static func _parse_card_type(type_str: String) -> Types.CardType:
    match type_str:
        "fist", "empty_hand":
            return Types.CardType.EMPTY_HAND
        "palm":
            return Types.CardType.EMPTY_HAND  # 掌法归类为空手
        "short_weapon":
            return Types.CardType.SHORT_WEAPON
        "long_weapon":
            return Types.CardType.LONG_WEAPON
        "kick", "leg":
            return Types.CardType.LEG
        _:
            return Types.CardType.EMPTY_HAND


## 获取卡牌显示名称
static func get_display_name(card: Dictionary) -> String:
    return card.get("name", "未知卡牌")


## 获取卡牌描述
static func get_description(card: Dictionary) -> String:
    var parts: Array[String] = []

    if card.base_damage > 0:
        parts.append("伤害 %d" % card.base_damage)
    if card.base_shield > 0:
        parts.append("护盾 %d" % card.base_shield)
    if card.agility_cost > 0:
        parts.append("消耗轻功 %d" % card.agility_cost)

    return "、".join(parts)
```

- [ ] **Step 2: 删除旧的 card.gd**

```bash
rm scripts/game/card.gd scripts/game/card.gd.uid
```

- [ ] **Step 3: 验证语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误退出

- [ ] **Step 4: 提交**

```bash
git add scripts/game/card_state.gd
git add -u scripts/game/card.gd scripts/game/card.gd.uid
git commit -m "refactor(card): 使用函数式设计重写卡牌状态"
```

---

## Task 3: 创建武功状态工厂函数

**Files:**
- Create: `scripts/game/skill_state.gd`
- Delete: `scripts/game/skill.gd`

- [ ] **Step 1: 创建 skill_state.gd**

```gdscript
## skill_state.gd - 武功状态工厂函数
## 使用函数式设计创建武功状态对象

class_name SkillState
extends RefCounted

## 创建武功状态
## @param skill_id: 武功配置ID
## @param data: 武功配置数据（可选，从GameManager获取）
## @return: 武功状态字典
static func create(skill_id: String, data: Dictionary = {}) -> Dictionary:
    if data.is_empty():
        data = GameManager.skills_data.get(skill_id, {})

    var required_type = _parse_card_type(data.get("required_card_type", "any"))

    return {
        "id": skill_id,
        "name": data.get("name", "未知武功"),
        "level": _parse_skill_level(data.get("level", "beginner")),
        "required_card_type": required_type,
        "mp_cost": data.get("mp_cost", 0),
        "agility_cost": data.get("agility_cost", 2),
        "range": data.get("range", 1),
        "effects": _parse_effects(data.get("effects", [])),
        "damage": data.get("damage", 0),
        "ignore_shield": data.get("ignore_shield", false),
        "description": data.get("description", "")
    }


## 解析卡牌类型
static func _parse_card_type(type_str: String) -> Types.CardType:
    match type_str:
        "fist", "empty_hand":
            return Types.CardType.EMPTY_HAND
        "palm":
            return Types.CardType.EMPTY_HAND
        "short_weapon":
            return Types.CardType.SHORT_WEAPON
        "long_weapon":
            return Types.CardType.LONG_WEAPON
        "kick", "leg":
            return Types.CardType.LEG
        "any":
            return Types.CardType.ANY
        _:
            return Types.CardType.ANY


## 解析武功等级
static func _parse_skill_level(level_str: String) -> Types.SkillLevel:
    match level_str:
        "beginner", "初级":
            return Types.SkillLevel.BEGINNER
        "intermediate", "中级":
            return Types.SkillLevel.INTERMEDIATE
        "advanced", "高级":
            return Types.SkillLevel.ADVANCED
        "master", "顶级", "大成":
            return Types.SkillLevel.MASTER
        _:
            return Types.SkillLevel.BEGINNER


## 解析效果列表
static func _parse_effects(effects_data: Array) -> Array[Dictionary]:
    var effects: Array[Dictionary] = []
    for effect_data in effects_data:
        effects.append(_parse_effect(effect_data))
    return effects


## 解析单个效果
static func _parse_effect(effect_data: Dictionary) -> Dictionary:
    return {
        "type": _parse_effect_type(effect_data.get("type", "damage")),
        "value": effect_data.get("value", 0),
        "duration": effect_data.get("duration", 0),
        "card_type": _parse_card_type(effect_data.get("card_type", "any")),
        "ignore_shield": effect_data.get("ignore_shield", false)
    }


## 解析效果类型
static func _parse_effect_type(type_str: String) -> Types.EffectType:
    match type_str:
        "damage":
            return Types.EffectType.DAMAGE
        "shield":
            return Types.EffectType.SHIELD
        "self_damage":
            return Types.EffectType.SELF_DAMAGE
        "drain_mp", "steal_mp":
            return Types.EffectType.DRAIN_MP
        "remove_mp":
            return Types.EffectType.REMOVE_MP
        "drain_hp":
            return Types.EffectType.DRAIN_HP
        "dot":
            return Types.EffectType.DOT
        "debuff_agility", "agility_reduce":
            return Types.EffectType.DEBUFF_AGILITY
        "disable_card_type":
            return Types.EffectType.DISABLE_CARD_TYPE
        "extra_action", "extra_attack":
            return Types.EffectType.EXTRA_ACTION
        "mimic":
            return Types.EffectType.MIMIC
        _:
            return Types.EffectType.DAMAGE


## 检查是否可以使用武功
## @param skill: 武功状态
## @param mp: 当前内力
## @param agility: 当前轻功
## @param hand: 手牌列表
## @return: 是否可以使用
static func can_use(skill: Dictionary, mp: int, agility: int, hand: Array) -> bool:
    if mp < skill.mp_cost:
        return false
    if agility < skill.agility_cost:
        return false

    # 检查是否有对应类型的手牌
    var required_type = skill.required_card_type
    for card in hand:
        if required_type == Types.CardType.ANY or card.type == required_type:
            if card.agility_cost <= agility:
                return true

    return false


## 获取可用手牌索引
static func get_available_card_indices(skill: Dictionary, hand: Array, agility: int) -> Array[int]:
    var indices: Array[int] = []
    var required_type = skill.required_card_type

    for i in range(hand.size()):
        var card = hand[i]
        var type_match = required_type == Types.CardType.ANY or card.type == required_type
        var agility_enough = card.agility_cost <= agility

        if type_match and agility_enough:
            indices.append(i)

    return indices


## 获取武功描述
static func get_description(skill: Dictionary) -> String:
    var parts: Array[String] = []

    if skill.damage > 0:
        parts.append("伤害 %d" % skill.damage)
    if skill.mp_cost > 0:
        parts.append("消耗内力 %d" % skill.mp_cost)
    if skill.agility_cost > 0:
        parts.append("消耗轻功 %d" % skill.agility_cost)

    for effect in skill.effects:
        parts.append(_get_effect_description(effect))

    return "、".join(parts)


static func _get_effect_description(effect: Dictionary) -> String:
    match effect.type:
        Types.EffectType.DRAIN_MP:
            return "吸取内力 %d" % effect.value
        Types.EffectType.DRAIN_HP:
            return "吸取生命 %d" % effect.value
        Types.EffectType.DOT:
            return "持续伤害 %d/回合，持续%d回合" % [effect.value, effect.duration]
        Types.EffectType.DEBUFF_AGILITY:
            return "降低轻功 %d，持续%d回合" % [effect.value, effect.duration]
        Types.EffectType.DISABLE_CARD_TYPE:
            return "禁用%s，持续%d回合" % [Types.CARD_TYPE_NAMES.get(effect.card_type, "未知"), effect.duration]
        Types.EffectType.EXTRA_ACTION:
            return "额外行动"
        Types.EffectType.MIMIC:
            return "模仿上一次武功"
        _:
            return ""
```

- [ ] **Step 2: 删除旧的 skill.gd**

```bash
rm scripts/game/skill.gd scripts/game/skill.gd.uid
```

- [ ] **Step 3: 验证语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误退出

- [ ] **Step 4: 提交**

```bash
git add scripts/game/skill_state.gd
git add -u scripts/game/skill.gd scripts/game/skill.gd.uid
git commit -m "refactor(skill): 使用函数式设计重写武功状态"
```

---

## Task 4: 创建内功状态工厂函数

**Files:**
- Create: `scripts/game/passive_state.gd`
- Delete: `scripts/game/passive.gd`

- [ ] **Step 1: 创建 passive_state.gd**

```gdscript
## passive_state.gd - 内功状态工厂函数
## 使用函数式设计创建内功状态对象

class_name PassiveState
extends RefCounted

## 创建内功状态
## @param passive_id: 内功配置ID
## @param data: 内功配置数据（可选，从GameManager获取）
## @return: 内功状态字典
static func create(passive_id: String, data: Dictionary = {}) -> Dictionary:
    if data.is_empty():
        data = GameManager.skills_data.get(passive_id, {})

    return {
        "id": passive_id,
        "name": data.get("name", "未知内功"),
        "trigger": _parse_trigger_timing(data.get("trigger", "turn_start")),
        "effects": _parse_effects(data.get("effects", [])),
        "description": data.get("description", ""),
        # 内功效果函数（运行时设置）
        "effect_func": null
    }


## 解析触发时机
static func _parse_trigger_timing(timing_str: String) -> Types.TriggerTiming:
    match timing_str:
        "turn_start":
            return Types.TriggerTiming.TURN_START
        "turn_end":
            return Types.TriggerTiming.TURN_END
        "on_damage":
            return Types.TriggerTiming.ON_DAMAGE
        "on_take_damage":
            return Types.TriggerTiming.ON_TAKE_DAMAGE
        "on_play_card":
            return Types.TriggerTiming.ON_PLAY_CARD
        "on_skill_use":
            return Types.TriggerTiming.ON_SKILL_USE
        _:
            return Types.TriggerTiming.TURN_START


## 解析效果列表
static func _parse_effects(effects_data: Array) -> Array[Dictionary]:
    var effects: Array[Dictionary] = []
    for effect_data in effects_data:
        effects.append({
            "type": effect_data.get("type", ""),
            "value": effect_data.get("value", 0),
            "duration": effect_data.get("duration", 0)
        })
    return effects


## 创建内功效果函数
## 根据内功类型返回对应的处理函数
static func create_effect_func(passive: Dictionary) -> Callable:
    var effects = passive.effects

    # 根据效果类型创建处理函数
    return func(character: Dictionary, game_state: Dictionary, args: Array = []) -> Dictionary:
        var result = {"message": "", "triggered": false}

        for effect in effects:
            match effect.type:
                "dodge_chance":
                    # 闪避几率
                    var chance = effect.value
                    if randi() % 100 < chance:
                        result.triggered = true
                        result.dodged = true
                        result.message = "%s发动闪避！" % character.name

                "agility_boost":
                    # 轻功提升
                    character.agility += effect.value
                    result.triggered = true
                    result.message = "%s轻功提升%d" % [character.name, effect.value]

                "mp_recover_percent":
                    # 内力恢复百分比
                    var recover_amount = int(character.max_mp * effect.value / 100.0)
                    character.mp = mini(character.mp + recover_amount, character.max_mp)
                    result.triggered = true
                    result.message = "%s恢复%d点内力" % [character.name, recover_amount]

                "hp_recover":
                    # 生命恢复
                    var recover_amount = effect.value
                    character.hp = mini(character.hp + recover_amount, character.max_hp)
                    result.triggered = true
                    result.message = "%s恢复%d点生命" % [character.name, recover_amount]

        return result


## 触发内功
## @param passive: 内功状态
## @param character: 角色状态
## @param game_state: 游戏状态
## @param args: 额外参数
## @return: 触发结果
static func trigger(passive: Dictionary, character: Dictionary, game_state: Dictionary, args: Array = []) -> Dictionary:
    if passive.effect_func == null:
        return {"triggered": false}

    return passive.effect_func.call(character, game_state, args)
```

- [ ] **Step 2: 删除旧的 passive.gd**

```bash
rm scripts/game/passive.gd scripts/game/passive.gd.uid
```

- [ ] **Step 3: 验证语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误退出

- [ ] **Step 4: 提交**

```bash
git add scripts/game/passive_state.gd
git add -u scripts/game/passive.gd scripts/game/passive.gd.uid
git commit -m "refactor(passive): 使用函数式设计重写内功状态"
```

---

## Task 5: 创建角色状态工厂函数

**Files:**
- Create: `scripts/game/character_state.gd`
- Delete: `scripts/game/character.gd`

- [ ] **Step 1: 创建 character_state.gd（第一部分：基础结构）**

```gdscript
## character_state.gd - 角色状态工厂函数
## 使用函数式设计创建角色状态对象

class_name CharacterState
extends RefCounted

## 创建角色状态
## @param character_id: 角色配置ID
## @param data: 角色配置数据（可选，从GameManager获取）
## @return: 角色状态字典
static func create(character_id: String, data: Dictionary = {}) -> Dictionary:
    if data.is_empty():
        data = GameManager.characters_data.get(character_id, {})

    var character = {
        # 基础属性
        "id": character_id,
        "name": data.get("name", "未知角色"),
        "title": data.get("title", ""),
        "max_hp": data.get("hp", 60),
        "max_mp": data.get("mp", 20),
        "base_agility": data.get("agility", 10),

        # 当前状态
        "hp": data.get("hp", 60),
        "mp": data.get("mp", 20),
        "agility": data.get("agility", 10),
        "shield": 0,

        # 弟子属性（默认值）
        "root": data.get("root", 5),
        "insight": data.get("insight", 5),
        "will": data.get("will", 5),
        "strength": data.get("strength", 5),

        # 卡组系统
        "deck": [],
        "hand": [],
        "discard_pile": [],

        # 武功系统
        "skills": [],
        "passives": [],

        # 状态效果
        "debuffs": [],
        "dots": []
    }

    # 初始化卡组
    _init_deck(character, data.get("deck", []))

    # 初始化武功
    _init_skills(character, data.get("martialArts", []))

    return character
```

- [ ] **Step 2: 添加初始化方法**

```gdscript
## 初始化卡组
static func _init_deck(character: Dictionary, deck_ids: Array) -> void:
    character.deck.clear()

    for i in range(deck_ids.size()):
        var card_id = deck_ids[i]
        var instance_id = "%s_%s_%d" % [character.id, card_id, i]
        var card = CardState.create(card_id, instance_id)
        character.deck.append(card)

    # 洗牌
    _shuffle_deck(character)


## 初始化武功
static func _init_skills(character: Dictionary, skill_ids: Array) -> void:
    character.skills.clear()
    character.passives.clear()

    for skill_id in skill_ids:
        var skill_data = GameManager.skills_data.get(skill_id, {})
        if skill_data.is_empty():
            continue

        var skill_type = skill_data.get("type", "martial_art")
        if skill_type == "passive":
            var passive = PassiveState.create(skill_id, skill_data)
            passive.effect_func = PassiveState.create_effect_func(passive)
            character.passives.append(passive)
        else:
            var skill = SkillState.create(skill_id, skill_data)
            character.skills.append(skill)


## 洗牌
static func _shuffle_deck(character: Dictionary) -> void:
    var deck = character.deck
    for i in range(deck.size() - 1, 0, -1):
        var j = randi() % (i + 1)
        var temp = deck[i]
        deck[i] = deck[j]
        deck[j] = temp
```

- [ ] **Step 3: 添加卡牌操作方法**

```gdscript
## 抽牌
static func draw_cards(character: Dictionary, count: int) -> Array:
    var drawn = []

    for i in range(count):
        if character.deck.is_empty():
            if character.discard_pile.is_empty():
                break
            # 洗牌
            character.deck.append_array(character.discard_pile)
            character.discard_pile.clear()
            _shuffle_deck(character)

        if not character.deck.is_empty() and character.hand.size() < Types.MAX_HAND_SIZE:
            var card = character.deck.pop_back()
            character.hand.append(card)
            drawn.append(card)

    return drawn


## 打出卡牌
static func play_card(character: Dictionary, card_instance_id: String) -> Dictionary:
    for i in range(character.hand.size()):
        if character.hand[i].instance_id == card_instance_id:
            var card = character.hand.pop_at(i)
            character.discard_pile.append(card)
            return {"success": true, "card": card}

    return {"success": false, "card": null}


## 打出卡牌（按索引）
static func play_card_by_index(character: Dictionary, card_index: int) -> Dictionary:
    if card_index < 0 or card_index >= character.hand.size():
        return {"success": false, "card": null}

    var card = character.hand.pop_at(card_index)
    character.discard_pile.append(card)
    return {"success": true, "card": card}
```

- [ ] **Step 4: 添加状态操作方法**

```gdscript
## 受到伤害
static func take_damage(character: Dictionary, amount: int, attacker: Dictionary = {}) -> Dictionary:
    var result = {
        "actual_damage": 0,
        "shield_absorbed": 0,
        "dodged": false,
        "attacker": attacker
    }

    var actual_damage = amount

    # 先扣护盾
    if character.shield > 0:
        if character.shield >= actual_damage:
            result.shield_absorbed = actual_damage
            character.shield -= actual_damage
            return result
        else:
            result.shield_absorbed = character.shield
            actual_damage -= character.shield
            character.shield = 0

    # 扣除HP
    character.hp = maxi(character.hp - actual_damage, 0)
    result.actual_damage = actual_damage

    return result


## 治疗
static func heal(character: Dictionary, amount: int) -> int:
    var old_hp = character.hp
    character.hp = mini(character.hp + amount, character.max_hp)
    return character.hp - old_hp


## 消耗内力
static func use_mp(character: Dictionary, amount: int) -> bool:
    if character.mp >= amount:
        character.mp -= amount
        return true
    return false


## 恢复内力
static func recover_mp(character: Dictionary, amount: int) -> void:
    character.mp = mini(character.mp + amount, character.max_mp)


## 是否死亡
static func is_alive(character: Dictionary) -> bool:
    return character.hp > 0


## 重置回合状态
static func reset_for_new_turn(character: Dictionary) -> void:
    # 重置轻功
    character.agility = character.base_agility

    # 处理减益效果
    var new_debuffs = []
    for debuff in character.debuffs:
        # 应用减益效果
        if debuff.type == "agility":
            character.agility = maxi(character.agility - debuff.value, 0)

        # 减少持续时间
        debuff.duration -= 1
        if debuff.duration > 0:
            new_debuffs.append(debuff)

    character.debuffs = new_debuffs
```

- [ ] **Step 5: 添加内功触发方法**

```gdscript
## 回合开始处理
static func on_turn_start(character: Dictionary, game_state: Dictionary) -> Array[String]:
    var messages: Array[String] = []

    # 处理持续伤害
    var new_dots = []
    for dot in character.dots:
        character.hp = maxi(character.hp - dot.value, 0)
        messages.append("%s受到持续伤害%d点" % [character.name, dot.value])

        dot.duration -= 1
        if dot.duration > 0:
            new_dots.append(dot)

    character.dots = new_dots

    # 触发回合开始内功
    for passive in character.passives:
        if passive.trigger == Types.TriggerTiming.TURN_START:
            var result = PassiveState.trigger(passive, character, game_state)
            if result.triggered and result.message != "":
                messages.append(result.message)

    return messages


## 回合结束处理
static func on_turn_end(character: Dictionary, game_state: Dictionary) -> Array[String]:
    var messages: Array[String] = []

    for passive in character.passives:
        if passive.trigger == Types.TriggerTiming.TURN_END:
            var result = PassiveState.trigger(passive, character, game_state)
            if result.triggered and result.message != "":
                messages.append(result.message)

    return messages


## 触发造成伤害时的内功
static func trigger_on_damage(character: Dictionary, game_state: Dictionary, target: Dictionary, damage: int) -> Array[String]:
    var messages: Array[String] = []

    for passive in character.passives:
        if passive.trigger == Types.TriggerTiming.ON_DAMAGE:
            var result = PassiveState.trigger(passive, character, game_state, [target, damage])
            if result.triggered and result.message != "":
                messages.append(result.message)

    return messages


## 触发受到伤害时的内功
static func trigger_on_take_damage(character: Dictionary, game_state: Dictionary, attacker: Dictionary, damage: int) -> Dictionary:
    var result = {"dodged": false, "reduced_damage": damage, "messages": []}

    for passive in character.passives:
        if passive.trigger == Types.TriggerTiming.ON_TAKE_DAMAGE:
            var trigger_result = PassiveState.trigger(passive, character, game_state, [attacker, damage])
            if trigger_result.triggered:
                if trigger_result.get("dodged", false):
                    result.dodged = true
                if trigger_result.get("message", "") != "":
                    result.messages.append(trigger_result.message)

    return result
```

- [ ] **Step 6: 添加辅助方法**

```gdscript
## 获取可用卡牌索引
static func get_available_cards(character: Dictionary, current_agility: int) -> Array[int]:
    var indices: Array[int] = []

    for i in range(character.hand.size()):
        var card = character.hand[i]
        if card.agility_cost > current_agility:
            continue

        # 检查是否被禁用
        var disabled = false
        for debuff in character.debuffs:
            if debuff.type == "disable_card_type" and card.type == debuff.card_type:
                disabled = true
                break

        if not disabled:
            indices.append(i)

    return indices


## 获取可用武功
static func get_available_skills(character: Dictionary, current_agility: int) -> Array[Dictionary]:
    var available: Array[Dictionary] = []

    for skill in character.skills:
        if SkillState.can_use(skill, character.mp, current_agility, character.hand):
            available.append(skill)

    return available


## 添加持续伤害
static func add_dot(character: Dictionary, value: int, duration: int) -> void:
    character.dots.append({"value": value, "duration": duration})


## 添加减益效果
static func add_debuff(character: Dictionary, type: String, value, duration: int) -> void:
    character.debuffs.append({"type": type, "value": value, "duration": duration})
```

- [ ] **Step 7: 删除旧的 character.gd**

```bash
rm scripts/game/character.gd scripts/game/character.gd.uid
```

- [ ] **Step 8: 验证语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误退出

- [ ] **Step 9: 提交**

```bash
git add scripts/game/character_state.gd
git add -u scripts/game/character.gd scripts/game/character.gd.uid
git commit -m "refactor(character): 使用函数式设计重写角色状态"
```

---

## Task 6: 创建游戏状态工厂函数

**Files:**
- Modify: `scripts/game/game_state.gd`（完全重写）
- Delete: `scripts/game/battle_manager.gd`

- [ ] **Step 1: 重写 game_state.gd（第一部分：信号和结构）**

```gdscript
## game_state.gd - 游戏状态工厂函数
## 使用函数式设计创建游戏状态对象

class_name GameState
extends RefCounted

# ==================== 信号 ====================
signal turn_started(turn_number: int)
signal turn_ended()
signal actor_changed(actor: Dictionary)

signal card_drawn(character: Dictionary, cards: Array)
signal card_played(character: Dictionary, card: Dictionary)

signal skill_used(character: Dictionary, skill: Dictionary)

signal damage_dealt(target: Dictionary, amount: int)
signal shield_gained(character: Dictionary, amount: int)
signal character_healed(character: Dictionary, amount: int)

signal passive_triggered(character: Dictionary, passive: Dictionary)

signal game_ended(player_won: bool)

signal log_message(text: String)


# ==================== 创建游戏状态 ====================
static func create() -> Dictionary:
    return {
        # 战斗双方
        "player": {},
        "enemy": {},

        # 回合状态
        "current_turn": 0,
        "current_actor": {},
        "phase": Types.GamePhase.SETUP,

        # 战斗日志
        "battle_log": [],

        # 上次使用的武功
        "last_used_skill": {},

        # 信号发射器引用
        "_signals": null
    }
```

- [ ] **Step 2: 添加初始化方法**

```gdscript
## 初始化战斗
static func init_battle(state: Dictionary, player_data: Dictionary, enemy_data: Dictionary) -> void:
    state.player = CharacterState.create(player_data.get("id", "player"), player_data)
    state.enemy = CharacterState.create(enemy_data.get("id", "enemy"), enemy_data)

    state.current_turn = 0
    state.phase = Types.GamePhase.SETUP
    state.battle_log.clear()
    state.last_used_skill = {}

    # 初始化牌组
    CharacterState.draw_cards(state.player, 5)
    CharacterState.draw_cards(state.enemy, 5)

    _add_log(state, "战斗开始！")

    start_new_turn(state)


## 设置信号发射器
static func set_signals(state: Dictionary, signals: RefCounted) -> void:
    state._signals = signals


## 发射信号
static func _emit_signal(state: Dictionary, signal_name: String, args: Array = []) -> void:
    if state._signals == null:
        return

    match signal_name:
        "turn_started":
            state._signals.turn_started.emit(args[0] if args.size() > 0 else 0)
        "actor_changed":
            state._signals.actor_changed.emit(args[0] if args.size() > 0 else {})
        "damage_dealt":
            state._signals.damage_dealt.emit(args[0] if args.size() > 0 else {}, args[1] if args.size() > 1 else 0)
        "shield_gained":
            state._signals.shield_gained.emit(args[0] if args.size() > 0 else {}, args[1] if args.size() > 1 else 0)
        "game_ended":
            state._signals.game_ended.emit(args[0] if args.size() > 0 else false)
        "log_message":
            state._signals.log_message.emit(args[0] if args.size() > 0 else "")
```

- [ ] **Step 3: 添加回合管理方法**

```gdscript
## 开始新回合
static func start_new_turn(state: Dictionary) -> void:
    state.current_turn += 1
    _add_log(state, "\n--- 第%d回合 ---" % state.current_turn)

    # 重置双方状态
    CharacterState.reset_for_new_turn(state.player)
    CharacterState.reset_for_new_turn(state.enemy)

    # 触发回合开始内功
    var player_messages = CharacterState.on_turn_start(state.player, state)
    var enemy_messages = CharacterState.on_turn_start(state.enemy, state)

    for msg in player_messages:
        _add_log(state, msg)
    for msg in enemy_messages:
        _add_log(state, msg)

    # 双方抽牌
    var player_drawn = CharacterState.draw_cards(state.player, 2)
    var enemy_drawn = CharacterState.draw_cards(state.enemy, 2)

    if player_drawn.size() > 0:
        _add_log(state, "%s抽了%d张牌" % [state.player.name, player_drawn.size()])
    if enemy_drawn.size() > 0:
        _add_log(state, "%s抽了%d张牌" % [state.enemy.name, enemy_drawn.size()])

    # 检查游戏结束
    if _check_game_end(state):
        return

    # 发射回合开始信号
    _emit_signal(state, "turn_started", [state.current_turn])

    # 决定行动顺序
    decide_turn_order(state)


## 决定行动顺序
static func decide_turn_order(state: Dictionary) -> void:
    if state.player.agility >= state.enemy.agility:
        state.current_actor = state.player
        _add_log(state, "%s轻功最高，先行动" % state.player.name)
    else:
        state.current_actor = state.enemy
        _add_log(state, "%s轻功最高，先行动" % state.enemy.name)

    state.phase = Types.GamePhase.SELECTING
    _emit_signal(state, "actor_changed", [state.current_actor])


## 切换行动方
static func switch_actor(state: Dictionary) -> void:
    if state.current_actor.id == state.player.id:
        state.current_actor = state.enemy
    else:
        state.current_actor = state.player

    _emit_signal(state, "actor_changed", [state.current_actor])


## 是否应该切换行动方
static func should_switch_actor(state: Dictionary) -> bool:
    var current = state.current_actor
    var opponent = _get_opponent(state, current)

    return current.agility <= opponent.agility


## 结束回合
static func end_turn(state: Dictionary) -> void:
    # 触发回合结束内功
    var player_messages = CharacterState.on_turn_end(state.player, state)
    var enemy_messages = CharacterState.on_turn_end(state.enemy, state)

    for msg in player_messages:
        _add_log(state, msg)
    for msg in enemy_messages:
        _add_log(state, msg)

    # 检查游戏结束
    if _check_game_end(state):
        return

    _emit_signal(state, "turn_ended")

    start_new_turn(state)
```

- [ ] **Step 4: 添加卡牌使用方法**

```gdscript
## 使用基础招式
static func use_basic_card(state: Dictionary, card_instance_id: String, target_id: String = "") -> Dictionary:
    var actor = state.current_actor

    # 查找卡牌
    var card_index = -1
    var card = {}
    for i in range(actor.hand.size()):
        if actor.hand[i].instance_id == card_instance_id:
            card_index = i
            card = actor.hand[i]
            break

    if card.is_empty():
        return {"success": false, "message": "未找到该卡牌"}

    # 检查轻功
    if card.agility_cost > actor.agility:
        return {"success": false, "message": "轻功不足"}

    # 确定目标
    var target = _determine_target(state, actor, target_id, card)

    # 打出卡牌
    CharacterState.play_card_by_index(actor, card_index)

    # 消耗轻功
    actor.agility -= card.agility_cost

    # 执行效果
    _execute_basic_card_effects(state, actor, target, card)

    # 检查游戏结束
    if _check_game_end(state):
        return {"success": true, "game_over": true}

    # 检查回合结束
    _check_turn_end(state)

    return {"success": true}


## 确定目标
static func _determine_target(state: Dictionary, actor: Dictionary, target_id: String, card: Dictionary) -> Dictionary:
    if target_id != "":
        if target_id == state.player.id:
            return state.player
        return state.enemy

    # 纯防御卡牌目标是自己
    if card.base_shield > 0 and card.base_damage == 0:
        return actor

    # 默认目标是对方
    return _get_opponent(state, actor)


## 执行基础卡牌效果
static func _execute_basic_card_effects(state: Dictionary, actor: Dictionary, target: Dictionary, card: Dictionary) -> void:
    var log_parts: Array[String] = []
    log_parts.append("%s使用【%s】" % [actor.name, card.name])

    # 计算伤害
    if card.base_damage > 0:
        var damage = _calculate_damage(actor, card.base_damage)

        # 触发使用卡牌时的内功
        var bonus_damage = _trigger_on_play_card_passives(state, actor, card, damage)
        damage += bonus_damage

        # 造成伤害
        var result = _apply_damage(state, actor, target, damage)

        if result.actual_damage > 0:
            log_parts.append("对%s造成%d点伤害" % [target.name, result.actual_damage])

    # 获得护盾
    if card.base_shield > 0:
        actor.shield += card.base_shield
        log_parts.append("获得%d点护盾" % card.base_shield)
        _emit_signal(state, "shield_gained", [actor, card.base_shield])

    # 自伤
    if card.self_damage > 0:
        actor.hp = maxi(actor.hp - card.self_damage, 0)
        log_parts.append("自身受到%d点反伤" % card.self_damage)

    _add_log(state, "，".join(log_parts))
```

- [ ] **Step 5: 添加武功使用方法**

```gdscript
## 使用武功招式
static func use_skill(state: Dictionary, skill_id: String, card_instance_id: String, target_id: String = "") -> Dictionary:
    var actor = state.current_actor

    # 查找武功
    var skill = {}
    for s in actor.skills:
        if s.id == skill_id:
            skill = s
            break

    if skill.is_empty():
        return {"success": false, "message": "未找到该武功"}

    # 查找卡牌
    var card_index = -1
    var card = {}
    for i in range(actor.hand.size()):
        if actor.hand[i].instance_id == card_instance_id:
            card_index = i
            card = actor.hand[i]
            break

    if card.is_empty():
        return {"success": false, "message": "未找到该卡牌"}

    # 检查是否可以使用
    if not SkillState.can_use(skill, actor.mp, actor.agility, actor.hand):
        return {"success": false, "message": "条件不足"}

    # 确定目标
    var target = _determine_target(state, actor, target_id, {"base_damage": skill.damage, "base_shield": 0})

    # 打出卡牌
    CharacterState.play_card_by_index(actor, card_index)

    # 消耗资源
    actor.mp -= skill.mp_cost
    actor.agility -= skill.agility_cost

    # 触发武功使用内功
    _trigger_on_skill_use_passives(state, actor, skill)

    # 执行武功效果
    var result = _execute_skill_effects(state, actor, target, skill)

    # 记录上次使用的武功
    state.last_used_skill = skill

    # 记录日志
    var log_msg = "%s使用武功【%s】" % [actor.name, skill.name]
    if result.actual_damage > 0:
        log_msg += "，对%s造成%d点伤害" % [target.name, result.actual_damage]
    _add_log(state, log_msg)

    # 检查游戏结束
    if _check_game_end(state):
        return {"success": true, "game_over": true}

    # 检查额外行动
    if result.extra_action:
        _add_log(state, "%s可以再行动一次" % actor.name)
        return {"success": true, "extra_action": true}

    # 检查回合结束
    _check_turn_end(state)

    return {"success": true}
```

- [ ] **Step 6: 添加效果处理方法**

```gdscript
## 执行武功效果
static func _execute_skill_effects(state: Dictionary, actor: Dictionary, target: Dictionary, skill: Dictionary) -> Dictionary:
    var result = {"actual_damage": 0, "extra_action": false}

    # 处理基础伤害
    if skill.damage > 0:
        var damage = _calculate_damage(actor, skill.damage)
        if skill.ignore_shield:
            target.hp = maxi(target.hp - damage, 0)
            result.actual_damage = damage
            _emit_signal(state, "damage_dealt", [target, damage])
        else:
            var damage_result = _apply_damage(state, actor, target, damage)
            result.actual_damage = damage_result.actual_damage

    # 处理效果列表
    for effect in skill.effects:
        var effect_result = _process_effect(state, actor, target, effect, skill)
        if effect_result.actual_damage > 0:
            result.actual_damage += effect_result.actual_damage
        if effect_result.extra_action:
            result.extra_action = true

    return result


## 处理单个效果
static func _process_effect(state: Dictionary, actor: Dictionary, target: Dictionary, effect: Dictionary, skill: Dictionary) -> Dictionary:
    var result = {"actual_damage": 0, "extra_action": false}

    match effect.type:
        Types.EffectType.DAMAGE:
            var damage = _calculate_damage(actor, effect.value)
            var damage_result = _apply_damage(state, actor, target, damage)
            result.actual_damage = damage_result.actual_damage

        Types.EffectType.SHIELD:
            actor.shield += effect.value
            _emit_signal(state, "shield_gained", [actor, effect.value])

        Types.EffectType.SELF_DAMAGE:
            actor.hp = maxi(actor.hp - effect.value, 0)

        Types.EffectType.DRAIN_MP:
            var drain = mini(effect.value, target.mp)
            target.mp -= drain
            actor.mp = mini(actor.mp + drain, actor.max_mp)

        Types.EffectType.REMOVE_MP:
            var remove = mini(effect.value, target.mp)
            target.mp -= remove
            target.hp = maxi(target.hp - remove, 0)

        Types.EffectType.DRAIN_HP:
            var drain = mini(effect.value, target.hp)
            target.hp -= drain
            actor.hp = mini(actor.hp + drain, actor.max_hp)
            result.actual_damage = drain

        Types.EffectType.DOT:
            CharacterState.add_dot(target, effect.value, effect.duration)

        Types.EffectType.DEBUFF_AGILITY:
            CharacterState.add_debuff(target, "agility", effect.value, effect.duration)

        Types.EffectType.DISABLE_CARD_TYPE:
            CharacterState.add_debuff(target, "disable_card_type", effect.card_type, effect.duration)

        Types.EffectType.EXTRA_ACTION:
            result.extra_action = true

        Types.EffectType.MIMIC:
            if not state.last_used_skill.is_empty() and state.last_used_skill.id != "mimic":
                var mimic_result = _execute_skill_effects(state, actor, target, state.last_used_skill)
                result.actual_damage = mimic_result.actual_damage

    return result
```

- [ ] **Step 7: 添加辅助方法**

```gdscript
## 计算伤害
static func _calculate_damage(actor: Dictionary, base_damage: int) -> int:
    var strength_bonus = _get_strength_bonus(actor.strength)
    return int(base_damage * (1.0 + strength_bonus))


## 获取臂力加成
static func _get_strength_bonus(strength: int) -> float:
    match strength:
        1: return 0.0
        2: return 0.05
        3: return 0.1
        4: return 0.15
        5: return 0.2
        6: return 0.25
        7: return 0.3
        8: return 0.4
        9: return 0.5
        10: return 0.6
        _: return 0.0


## 应用伤害
static func _apply_damage(state: Dictionary, actor: Dictionary, target: Dictionary, damage: int) -> Dictionary:
    # 触发受到伤害时的内功
    var trigger_result = CharacterState.trigger_on_take_damage(target, state, actor, damage)

    if trigger_result.dodged:
        _add_log(state, "%s闪避了攻击！" % target.name)
        return {"actual_damage": 0}

    # 造成伤害
    var result = CharacterState.take_damage(target, damage, actor)

    if result.actual_damage > 0:
        _emit_signal(state, "damage_dealt", [target, result.actual_damage])

        # 触发造成伤害时的内功
        var messages = CharacterState.trigger_on_damage(actor, state, target, result.actual_damage)
        for msg in messages:
            _add_log(state, msg)

    return result


## 触发使用卡牌时的内功
static func _trigger_on_play_card_passives(state: Dictionary, actor: Dictionary, card: Dictionary, base_damage: int) -> int:
    var bonus_damage = 0

    for passive in actor.passives:
        if passive.trigger == Types.TriggerTiming.ON_PLAY_CARD:
            var result = PassiveState.trigger(passive, actor, state, [card, base_damage])
            if result.triggered:
                if result.get("bonus_damage", 0) > 0:
                    bonus_damage += result.bonus_damage
                if result.get("message", "") != "":
                    _add_log(state, result.message)

    return bonus_damage


## 触发使用武功时的内功
static func _trigger_on_skill_use_passives(state: Dictionary, actor: Dictionary, skill: Dictionary) -> void:
    for passive in actor.passives:
        if passive.trigger == Types.TriggerTiming.ON_SKILL_USE:
            var result = PassiveState.trigger(passive, actor, state, [skill])
            if result.triggered and result.get("message", "") != "":
                _add_log(state, result.message)


## 获取对手
static func _get_opponent(state: Dictionary, character: Dictionary) -> Dictionary:
    if character.id == state.player.id:
        return state.enemy
    return state.player


## 检查回合结束
static func _check_turn_end(state: Dictionary) -> void:
    if should_switch_actor(state):
        switch_actor(state)
        _add_log(state, "轮到%s行动" % state.current_actor.name)
        state.phase = Types.GamePhase.SELECTING
    else:
        if state.current_actor.agility <= 0:
            end_turn(state)


## 检查游戏结束
static func _check_game_end(state: Dictionary) -> bool:
    if not CharacterState.is_alive(state.player):
        state.phase = Types.GamePhase.GAME_OVER
        _add_log(state, "\n你输了！")
        _emit_signal(state, "game_ended", [false])
        return true

    if not CharacterState.is_alive(state.enemy):
        state.phase = Types.GamePhase.GAME_OVER
        _add_log(state, "\n你赢了！")
        _emit_signal(state, "game_ended", [true])
        return true

    return false


## 添加日志
static func _add_log(state: Dictionary, message: String) -> void:
    state.battle_log.append({
        "text": message,
        "time": Time.get_ticks_msec()
    })
    _emit_signal(state, "log_message", [message])


## 获取当前行动方是否是玩家
static func is_player_turn(state: Dictionary) -> bool:
    return state.current_actor.id == state.player.id
```

- [ ] **Step 8: 删除旧的 battle_manager.gd**

```bash
rm scripts/game/battle_manager.gd scripts/game/battle_manager.gd.uid
rm scripts/game/distance_system.gd scripts/game/distance_system.gd.uid
```

- [ ] **Step 9: 验证语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误退出

- [ ] **Step 10: 提交**

```bash
git add scripts/game/game_state.gd
git add -u scripts/game/battle_manager.gd scripts/game/battle_manager.gd.uid
git add -u scripts/game/distance_system.gd scripts/game/distance_system.gd.uid
git commit -m "refactor(game): 使用函数式设计重写游戏状态"
```

---

## Task 7: 重写效果处理器

**Files:**
- Modify: `scripts/game/effect_processor.gd`

- [ ] **Step 1: 重写 effect_processor.gd**

```gdscript
## effect_processor.gd - 效果处理器
## 处理卡牌、武功、内功的各种效果

class_name EffectProcessor
extends RefCounted

## 处理效果
## @param effect: 效果配置
## @param actor: 行动者
## @param target: 目标
## @param game_state: 游戏状态
## @return: 处理结果
static func process(effect: Dictionary, actor: Dictionary, target: Dictionary, game_state: Dictionary) -> Dictionary:
    var result = {
        "success": true,
        "actual_damage": 0,
        "extra_action": false,
        "message": ""
    }

    match effect.type:
        Types.EffectType.DAMAGE:
            result = _process_damage(effect, actor, target, game_state)
        Types.EffectType.SHIELD:
            result = _process_shield(effect, actor)
        Types.EffectType.SELF_DAMAGE:
            result = _process_self_damage(effect, actor)
        Types.EffectType.DRAIN_MP:
            result = _process_drain_mp(effect, actor, target)
        Types.EffectType.REMOVE_MP:
            result = _process_remove_mp(effect, actor, target)
        Types.EffectType.DRAIN_HP:
            result = _process_drain_hp(effect, actor, target)
        Types.EffectType.DOT:
            result = _process_dot(effect, target)
        Types.EffectType.DEBUFF_AGILITY:
            result = _process_debuff_agility(effect, target)
        Types.EffectType.DISABLE_CARD_TYPE:
            result = _process_disable_card_type(effect, target)
        Types.EffectType.EXTRA_ACTION:
            result.extra_action = true
            result.message = "获得额外行动"
        Types.EffectType.MIMIC:
            result = _process_mimic(effect, actor, target, game_state)

    return result


static func _process_damage(effect: Dictionary, actor: Dictionary, target: Dictionary, game_state: Dictionary) -> Dictionary:
    var base_damage = effect.value
    var strength_bonus = GameState._get_strength_bonus(actor.strength)
    var damage = int(base_damage * (1.0 + strength_bonus))

    var result = CharacterState.take_damage(target, damage, actor)
    return {
        "success": true,
        "actual_damage": result.actual_damage,
        "message": "造成%d点伤害" % result.actual_damage
    }


static func _process_shield(effect: Dictionary, actor: Dictionary) -> Dictionary:
    actor.shield += effect.value
    return {
        "success": true,
        "message": "获得%d点护盾" % effect.value
    }


static func _process_self_damage(effect: Dictionary, actor: Dictionary) -> Dictionary:
    actor.hp = maxi(actor.hp - effect.value, 0)
    return {
        "success": true,
        "message": "自身受到%d点伤害" % effect.value
    }


static func _process_drain_mp(effect: Dictionary, actor: Dictionary, target: Dictionary) -> Dictionary:
    var drain = mini(effect.value, target.mp)
    target.mp -= drain
    actor.mp = mini(actor.mp + drain, actor.max_mp)
    return {
        "success": true,
        "message": "吸取%d点内力" % drain
    }


static func _process_remove_mp(effect: Dictionary, actor: Dictionary, target: Dictionary) -> Dictionary:
    var remove = mini(effect.value, target.mp)
    target.mp -= remove
    target.hp = maxi(target.hp - remove, 0)
    return {
        "success": true,
        "actual_damage": remove,
        "message": "消除%d点内力" % remove
    }


static func _process_drain_hp(effect: Dictionary, actor: Dictionary, target: Dictionary) -> Dictionary:
    var drain = mini(effect.value, target.hp)
    target.hp -= drain
    actor.hp = mini(actor.hp + drain, actor.max_hp)
    return {
        "success": true,
        "actual_damage": drain,
        "message": "吸取%d点生命" % drain
    }


static func _process_dot(effect: Dictionary, target: Dictionary) -> Dictionary:
    CharacterState.add_dot(target, effect.value, effect.duration)
    return {
        "success": true,
        "message": "施加持续伤害%d点/回合，持续%d回合" % [effect.value, effect.duration]
    }


static func _process_debuff_agility(effect: Dictionary, target: Dictionary) -> Dictionary:
    CharacterState.add_debuff(target, "agility", effect.value, effect.duration)
    return {
        "success": true,
        "message": "降低轻功%d点，持续%d回合" % [effect.value, effect.duration]
    }


static func _process_disable_card_type(effect: Dictionary, target: Dictionary) -> Dictionary:
    CharacterState.add_debuff(target, "disable_card_type", effect.card_type, effect.duration)
    var type_name = Types.CARD_TYPE_NAMES.get(effect.card_type, "未知")
    return {
        "success": true,
        "message": "禁用%s，持续%d回合" % [type_name, effect.duration]
    }


static func _process_mimic(effect: Dictionary, actor: Dictionary, target: Dictionary, game_state: Dictionary) -> Dictionary:
    var last_skill = game_state.get("last_used_skill", {})
    if last_skill.is_empty():
        return {"success": false, "message": "没有可模仿的武功"}

    var total_damage = 0
    for e in last_skill.effects:
        var result = process(e, actor, target, game_state)
        if result.actual_damage > 0:
            total_damage += result.actual_damage

    return {
        "success": true,
        "actual_damage": total_damage,
        "message": "模仿%s" % last_skill.name
    }
```

- [ ] **Step 2: 验证语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误退出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/effect_processor.gd
git commit -m "refactor(effect): 简化效果处理器，使用函数式设计"
```

---

## Task 8: 重写AI系统

**Files:**
- Modify: `scripts/game/ai.gd`

- [ ] **Step 1: 重写 ai.gd**

```gdscript
## ai.gd - AI决策系统
## 使用函数式设计，基于游戏状态做决策

class_name AI
extends RefCounted

## AI难度
enum Difficulty {
    EASY,
    NORMAL,
    HARD
}

## 执行AI回合
static func execute_turn(game_state: Dictionary, difficulty: Difficulty = Difficulty.NORMAL) -> void:
    var actor = game_state.current_actor

    # 延迟模拟思考
    await _delay(_get_delay(difficulty))

    # 行动循环
    var action_count = 0
    var max_actions = 10

    while actor.agility > 0 and CharacterState.is_alive(actor) and action_count < max_actions:
        if game_state.phase == Types.GamePhase.GAME_OVER:
            break

        var action = decide_action(game_state, difficulty)

        if action.is_empty():
            GameState._add_log(game_state, "%s没有可用的招式" % actor.name)
            break

        action_count += 1
        await _execute_action(game_state, action)

        if GameState.should_switch_actor(game_state):
            break

        await _delay(600)

    # 结束回合
    if game_state.phase != Types.GamePhase.GAME_OVER:
        if GameState.should_switch_actor(game_state):
            GameState.switch_actor(game_state)
            GameState._add_log(game_state, "轮到%s行动" % game_state.current_actor.name)
        elif actor.agility <= 0:
            GameState.end_turn(game_state)


## 决定行动
static func decide_action(game_state: Dictionary, difficulty: Difficulty) -> Dictionary:
    var actor = game_state.current_actor
    var opponent = GameState._get_opponent(game_state, actor)

    # 获取可用卡牌和武功
    var available_cards = CharacterState.get_available_cards(actor, actor.agility)
    var available_skills = CharacterState.get_available_skills(actor, actor.agility)

    if available_cards.is_empty():
        return {}

    # 根据难度决定策略
    match difficulty:
        Difficulty.EASY:
            return _decide_easy(actor, opponent, available_cards, available_skills)
        Difficulty.HARD:
            return _decide_hard(actor, opponent, available_cards, available_skills)
        _:
            return _decide_normal(actor, opponent, available_cards, available_skills)


## 简单难度决策
static func _decide_easy(actor: Dictionary, opponent: Dictionary, available_cards: Array, available_skills: Array) -> Dictionary:
    # 随机选择
    if available_skills.size() > 0 and randf() < 0.3:
        var skill = available_skills[randi() % available_skills.size()]
        var card_indices = SkillState.get_available_card_indices(skill, actor.hand, actor.agility)
        if card_indices.size() > 0:
            return {
                "type": "skill",
                "skill_id": skill.id,
                "card_index": card_indices[randi() % card_indices.size()]
            }

    if available_cards.size() > 0:
        return {
            "type": "card",
            "card_index": available_cards[randi() % available_cards.size()]
        }

    return {}


## 普通难度决策
static func _decide_normal(actor: Dictionary, opponent: Dictionary, available_cards: Array, available_skills: Array) -> Dictionary:
    # 低血量时考虑防御
    if actor.hp < actor.max_hp * 0.4:
        var defend_card = _find_defend_card(actor, available_cards)
        if not defend_card.is_empty():
            return defend_card

    # 尝试使用武功
    if available_skills.size() > 0 and actor.mp >= 4:
        var skill_action = _find_best_skill(actor, opponent, available_skills)
        if not skill_action.is_empty():
            return skill_action

    # 使用攻击卡牌
    if available_cards.size() > 0:
        var attack_card = _find_best_attack_card(actor, opponent, available_cards)
        if not attack_card.is_empty():
            return attack_card

    return {}


## 困难难度决策
static func _decide_hard(actor: Dictionary, opponent: Dictionary, available_cards: Array, available_skills: Array) -> Dictionary:
    # 优先使用武功斩杀
    if opponent.hp <= 15 and available_skills.size() > 0:
        var skill_action = _find_best_skill(actor, opponent, available_skills)
        if not skill_action.is_empty():
            return skill_action

    # 低血量时防御
    if actor.hp < actor.max_hp * 0.3:
        var defend_card = _find_defend_card(actor, available_cards)
        if not defend_card.is_empty():
            return defend_card

    # 使用最优武功
    if available_skills.size() > 0 and actor.mp >= 3:
        var skill_action = _find_best_skill(actor, opponent, available_skills)
        if not skill_action.is_empty():
            return skill_action

    # 使用最优攻击卡牌
    if available_cards.size() > 0:
        var attack_card = _find_best_attack_card(actor, opponent, available_cards)
        if not attack_card.is_empty():
            return attack_card

    return {}


## 查找防御卡牌
static func _find_defend_card(actor: Dictionary, available_cards: Array) -> Dictionary:
    for card_index in available_cards:
        var card = actor.hand[card_index]
        if card.base_shield > 0:
            return {"type": "card", "card_index": card_index}
    return {}


## 查找最佳攻击卡牌
static func _find_best_attack_card(actor: Dictionary, opponent: Dictionary, available_cards: Array) -> Dictionary:
    var best_index = -1
    var best_efficiency = -1.0

    for card_index in available_cards:
        var card = actor.hand[card_index]
        if card.base_damage > 0:
            var efficiency = float(card.base_damage) / float(card.agility_cost)
            if efficiency > best_efficiency:
                best_efficiency = efficiency
                best_index = card_index

    if best_index >= 0:
        return {"type": "card", "card_index": best_index}

    # 没有攻击卡牌，返回第一张可用卡牌
    if available_cards.size() > 0:
        return {"type": "card", "card_index": available_cards[0]}

    return {}


## 查找最佳武功
static func _find_best_skill(actor: Dictionary, opponent: Dictionary, available_skills: Array) -> Dictionary:
    var best_skill = {}
    var best_damage = 0

    for skill in available_skills:
        if skill.damage > best_damage:
            var card_indices = SkillState.get_available_card_indices(skill, actor.hand, actor.agility)
            if card_indices.size() > 0:
                best_skill = skill
                best_damage = skill.damage

    if not best_skill.is_empty():
        var card_indices = SkillState.get_available_card_indices(best_skill, actor.hand, actor.agility)
        return {
            "type": "skill",
            "skill_id": best_skill.id,
            "card_index": card_indices[0]
        }

    return {}


## 执行行动
static func _execute_action(game_state: Dictionary, action: Dictionary) -> void:
    if action.type == "skill":
        var actor = game_state.current_actor
        var card = actor.hand[action.card_index]
        GameState.use_skill(game_state, action.skill_id, card.instance_id)
    elif action.type == "card":
        var actor = game_state.current_actor
        var card = actor.hand[action.card_index]
        GameState.use_basic_card(game_state, card.instance_id)


## 获取延迟时间
static func _get_delay(difficulty: Difficulty) -> float:
    match difficulty:
        Difficulty.EASY: return 1.2
        Difficulty.HARD: return 0.5
        _: return 0.8


## 延迟函数
static func _delay(seconds: float) -> void:
    await Engine.get_main_loop().create_timer(seconds).timeout
```

- [ ] **Step 2: 验证语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误退出

- [ ] **Step 3: 提交**

```bash
git add scripts/game/ai.gd
git commit -m "refactor(ai): 使用函数式设计重写AI系统"
```

---

## Task 9: 更新 GameManager

**Files:**
- Modify: `scripts/autoload/game_manager.gd`

- [ ] **Step 1: 检查 GameManager 是否需要更新**

读取 `scripts/autoload/game_manager.gd`，确认数据加载逻辑是否正确。

- [ ] **Step 2: 更新数据加载（如需要）**

确保 `cards_data`、`skills_data`、`characters_data` 正确加载。

- [ ] **Step 3: 验证语法**

运行: `godot --path . --headless --quit-after 2`
预期: 无错误退出

- [ ] **Step 4: 提交**

```bash
git add scripts/autoload/game_manager.gd
git commit -m "fix(manager): 更新GameManager数据加载"
```

---

## Task 10: 集成测试

**Files:**
- Create: `test_battle_system.gd`（临时测试脚本）

- [ ] **Step 1: 创建测试脚本**

在项目根目录创建临时测试脚本，验证战斗流程：

```gdscript
extends SceneTree

func _init():
    # 初始化 GameManager
    var manager = load("res://scripts/autoload/game_manager.gd").new()
    manager._ready()

    # 创建游戏状态
    var game_state = GameState.create()

    # 创建测试角色
    var player_data = {
        "id": "qiaofeng",
        "name": "乔峰",
        "hp": 70,
        "mp": 20,
        "agility": 10,
        "deck": ["fist", "fist", "palm", "palm"],
        "martialArts": ["xianglong_zhang"]
    }

    var enemy_data = {
        "id": "duanyu",
        "name": "段誉",
        "hp": 50,
        "mp": 30,
        "agility": 14,
        "deck": ["fist", "fist", "palm", "palm"],
        "martialArts": ["liumai_shenjian"]
    }

    # 初始化战斗
    GameState.init_battle(game_state, player_data, enemy_data)

    # 验证初始状态
    assert(game_state.current_turn == 1, "回合数应为1")
    assert(game_state.player.hp == 70, "玩家HP应为70")
    assert(game_state.enemy.hp == 50, "敌人HP应为50")
    assert(game_state.player.hand.size() == 7, "玩家应有7张手牌（5+2）")
    assert(game_state.enemy.hand.size() == 7, "敌人应有7张手牌（5+2）")

    print("所有测试通过！")
    quit()
```

- [ ] **Step 2: 运行测试**

运行: `godot --path . --script test_battle_system.gd`
预期: 输出"所有测试通过！"

- [ ] **Step 3: 删除测试脚本**

```bash
rm test_battle_system.gd
```

- [ ] **Step 4: 最终提交**

```bash
git add -A
git commit -m "feat(battle): 战斗系统重构完成"
```

---

## 自检清单

### 规格覆盖
- [x] GameState 状态对象 - Task 6
- [x] CharacterState 状态对象 - Task 5
- [x] CardState 状态对象 - Task 2
- [x] SkillState 状态对象 - Task 3
- [x] PassiveState 状态对象 - Task 4
- [x] 回合流程 (start_new_turn, end_turn) - Task 6
- [x] 行动系统 (use_basic_card, use_skill) - Task 6
- [x] 行动顺序 (decide_turn_order, should_switch_actor) - Task 6
- [x] 效果处理器 - Task 7
- [x] 伤害计算 - Task 6
- [x] 内功触发系统 - Task 4, 5
- [x] AI 系统 - Task 8

### 占位符检查
- 无 "TBD"、"TODO"、"implement later" 等占位符
- 所有代码块包含完整实现

### 类型一致性
- 所有方法签名使用 Dictionary 表示状态对象
- 枚举类型统一使用 Types.XXX
