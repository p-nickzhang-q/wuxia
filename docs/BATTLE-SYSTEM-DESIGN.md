# 战斗系统设计文档

## 概述

本文档描述武侠卡牌对战游戏的战斗系统设计，基于原有 Pixi 分支实现，重新设计为 Godot 4.6 + GDScript 实现。

## 核心设计原则

1. **函数式设计** - 使用工厂函数创建状态对象，而非类
2. **事件驱动** - 通过信号驱动 UI 更新
3. **状态不可变** - 状态变更通过函数返回新状态

---

## 1. 核心状态对象

### 1.1 GameState

游戏状态，管理整个战斗流程。

```gdscript
# 游戏阶段
enum GamePhase {
    SETUP,        # 初始化
    SELECTING,    # 选择行动
    ACTING,       # 执行行动
    GAME_OVER     # 游戏结束
}

# GameState 结构
{
    # 战斗双方
    player: CharacterState,
    enemy: CharacterState,

    # 回合状态
    current_turn: int,           # 当前回合数
    current_actor: CharacterState, # 当前行动方
    phase: GamePhase,            # 游戏阶段

    # 战斗日志
    battle_log: Array[BattleLogEntry],

    # 上次使用的武功（用于模仿效果）
    last_used_skill: SkillState
}
```

### 1.2 CharacterState

角色状态，管理角色属性、卡组、武功、内功。

```gdscript
# CharacterState 结构
{
    # 基础属性
    id: String,
    name: String,
    title: String,
    max_hp: int,
    max_mp: int,
    base_agility: int,

    # 当前状态
    hp: int,
    mp: int,
    agility: int,      # 当前剩余轻功
    shield: int,

    # 弟子属性
    root: int,         # 根骨 (1-10)
    insight: int,      # 悟性 (1-10)
    will: int,         # 定力 (1-10)
    strength: int,     # 臂力 (1-10) - 伤害加成

    # 卡组系统
    deck: Array[CardState],
    hand: Array[CardState],
    discard_pile: Array[CardState],

    # 武功系统
    skills: Array[SkillState],
    passives: Array[PassiveState],

    # 状态效果
    debuffs: Array[DebuffState],
    dots: Array[DotState]
}
```

### 1.3 CardState

卡牌状态。

```gdscript
# 卡牌类型
enum CardType {
    EMPTY_HAND,     # 空手
    SHORT_WEAPON,   # 短兵
    LONG_WEAPON,    # 长兵
    LEG             # 腿法
}

# CardState 结构
{
    id: String,
    instance_id: String,
    name: String,
    type: CardType,
    base_damage: int,
    base_shield: int,
    agility_cost: int,
    self_damage: int,    # 反伤
    range: int           # 攻击距离
}
```

### 1.4 SkillState

武功招式状态。

```gdscript
# 武功等级
enum SkillLevel {
    BEGINNER,      # 初级
    INTERMEDIATE,  # 中级
    ADVANCED,      # 高级
    MASTER         # 顶级
}

# SkillState 结构
{
    id: String,
    name: String,
    level: SkillLevel,
    required_card_type: CardType | "any",
    mp_cost: int,
    agility_cost: int,
    range: int,
    effects: Array[SkillEffect],
    description: String
}
```

### 1.5 SkillEffect

武功效果。

```gdscript
# 效果类型
enum EffectType {
    DAMAGE,            # 造成伤害
    SHIELD,            # 获得护盾
    SELF_DAMAGE,       # 自伤
    DRAIN_MP,          # 吸取内力
    REMOVE_MP,         # 消除内力（造成等量伤害）
    DRAIN_HP,          # 吸取生命
    DOT,               # 持续伤害
    DEBUFF_AGILITY,    # 降低轻功
    DISABLE_CARD_TYPE, # 禁用卡牌类型
    EXTRA_ACTION,      # 额外行动
    MIMIC              # 模仿上一次武功
}

# SkillEffect 结构
{
    type: EffectType,
    value: int,           # 效果数值
    duration: int,        # 持续回合（用于 dot/debuff）
    card_type: CardType,  # 禁用的卡牌类型
    ignore_shield: bool   # 是否无视护盾
}
```

### 1.6 PassiveState

内功状态。

```gdscript
# 触发时机
enum TriggerTiming {
    TURN_START,       # 回合开始
    TURN_END,         # 回合结束
    ON_DAMAGE,        # 造成伤害时
    ON_TAKE_DAMAGE,   # 受到伤害时
    ON_PLAY_CARD,     # 使用基础招式时
    ON_SKILL_USE      # 使用武功招式时
}

# PassiveState 结构
{
    id: String,
    name: String,
    trigger: TriggerTiming,
    description: String
}
```

### 1.7 DebuffState / DotState

减益效果和持续伤害。

```gdscript
# DebuffState
{
    type: "agility" | "disable_card_type",
    value: int | CardType,
    duration: int
}

# DotState
{
    value: int,      # 每回合伤害
    duration: int    # 剩余回合
}
```

---

## 2. 回合流程

### 2.1 流程图

```
start_new_turn()
    │
    ├─→ current_turn++
    │
    ├─→ 重置双方轻功 (agility = base_agility)
    │
    ├─→ 触发回合开始内功 (TURN_START)
    │
    ├─→ 双方抽牌 (2张)
    │
    ├─→ 检查游戏结束
    │       └─→ 任一方死亡 → end_game()
    │
    └─→ decide_turn_order()
            │
            └─→ 按轻功高低决定先手
                  current_actor = 轻功高者
                  phase = SELECTING
```

### 2.2 行动循环

```
while phase == SELECTING:
    │
    ├─→ 玩家/AI 选择行动
    │       │
    │       ├─→ use_basic_card(card_id, target_id)
    │       │       │
    │       │       ├─→ 验证：轻功足够？目标在范围内？
    │       │       ├─→ 消耗轻功
    │       │       ├─→ 执行效果：伤害/护盾/治疗
    │       │       ├─→ 触发内功 (ON_PLAY_CARD, ON_DAMAGE, ON_TAKE_DAMAGE)
    │       │       └─→ 弃牌
    │       │
    │       └─→ use_skill(skill_id, card_id, target_id)
    │               │
    │               ├─→ 验证：轻功足够？内力足够？有对应手牌？
    │               ├─→ 消耗轻功、内力
    │               ├─→ 执行效果列表
    │               ├─→ 触发内功 (ON_SKILL_USE, ON_DAMAGE, ON_TAKE_DAMAGE)
    │               ├─→ 弃牌
    │               └─→ 检查 extra_action
    │
    ├─→ 检查游戏结束
    │       └─→ 任一方死亡 → end_game()
    │
    └─→ should_switch_actor()
            │
            ├─→ 当前轻功 <= 对手轻功 → 切换行动方
            │       current_actor = 对手
            │       发出 turn_changed 信号
            │
            └─→ 双方轻功都为0 → end_turn()
```

### 2.3 回合结束

```
end_turn()
    │
    ├─→ 触发回合结束内功 (TURN_END)
    │
    ├─→ 处理持续伤害 (dot)
    │       └─→ 每个角色受到 dot 伤害，duration--
    │
    ├─→ 处理减益效果 (debuff)
    │       └─→ 每个 debuff 的 duration--
    │
    ├─→ 检查游戏结束
    │       └─→ 任一方死亡 → end_game()
    │
    └─→ start_new_turn()
```

---

## 3. 伤害计算

### 3.1 伤害公式

```
基础伤害 = 卡牌/武功的 damage 值
臂力加成 = floor(基础伤害 * strength_bonus(strength))

实际伤害 = 基础伤害 + 臂力加成
```

### 3.2 臂力加成计算

```gdscript
func calculate_strength_bonus(strength: int) -> float:
    # strength: 1-10
    # 返回伤害加成倍率
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
```

### 3.3 伤害结算流程

```
take_damage(amount, attacker)
    │
    ├─→ 触发 ON_TAKE_DAMAGE 内功
    │       ├─→ 闪避？→ 返回 0 伤害
    │       └─→ 减伤？→ 减少伤害值
    │
    ├─→ 护盾吸收
    │       ├─→ shield >= damage → shield -= damage, 返回 0
    │       └─→ shield < damage → damage -= shield, shield = 0
    │
    ├─→ 扣除 HP
    │       hp -= damage
    │
    └─→ 触发攻击者的 ON_DAMAGE 内功
```

---

## 4. 内功系统

### 4.1 内功触发时机

| 时机 | 触发点 | 常见效果 |
|------|--------|----------|
| TURN_START | 回合开始 | 恢复HP/MP、获得护盾 |
| TURN_END | 回合结束 | 持续伤害、恢复 |
| ON_DAMAGE | 造成伤害时 | 额外伤害、吸血 |
| ON_TAKE_DAMAGE | 受到伤害时 | 闪避、减伤、反弹 |
| ON_PLAY_CARD | 使用基础招式 | 额外效果、伤害加成 |
| ON_SKILL_USE | 使用武功招式 | 消耗减少、效果增强 |

### 4.2 内功效果返回值

```gdscript
# 内功效果返回值结构
{
    message: String,          # 日志消息
    bonus_damage: int,        # 额外伤害
    reduced_damage: int,      # 减伤后的伤害
    dodged: bool,             # 是否闪避
    reflect_damage: int       # 反弹伤害
}
```

### 4.3 内功示例

```gdscript
# 北冥神功 - 受到伤害时吸取对方内力
{
    id: "beiming_shengong",
    name: "北冥神功",
    trigger: TriggerTiming.ON_TAKE_DAMAGE,
    effect: func(character, damage):
        if damage > 0:
            return {
                message: "北冥神功发动，吸取对方内力",
                reflect_damage: min(damage, 5)
            }
        return null
}

# 九阳神功 - 回合开始恢复HP
{
    id: "jiuyang_shengong",
    name: "九阳神功",
    trigger: TriggerTiming.TURN_START,
    effect: func(character):
        var heal_amount = 5
        character.heal(heal_amount)
        return { message: "九阳神功发动，恢复{heal_amount}点体力" }
}
```

---

## 5. AI 系统

### 5.1 AI 决策流程

```
execute_turn()
    │
    ├─→ 延迟 800ms（模拟思考）
    │
    └─→ while agility > 0 and is_alive():
            │
            ├─→ decide_action()
            │       │
            │       ├─→ 尝试使用武功招式
            │       │       └─→ 有可用武功？内力足够？目标在范围？
            │       │
            │       ├─→ 尝试防御
            │       │       └─→ HP低？有防御牌？
            │       │
            │       └─→ 使用基础招式
            │               └─→ 选择伤害/效率最高的牌
            │
            ├─→ 执行行动
            │
            ├─→ 检查 should_switch_actor()
            │
            └─→ 延迟 600ms
```

### 5.2 目标选择优先级

1. HP 最低的敌人（可能斩杀）
2. 距离最近的敌人（更容易攻击）

### 5.3 武功使用决策

- 目标 HP <= 15 且内力足够 → 使用高伤害武功
- 内力 >= 50% → 考虑使用武功
- 否则使用基础招式

---

## 6. 事件系统

### 6.1 信号定义

```gdscript
# GameState 发出的信号
signal turn_started(turn_number: int)
signal turn_ended()
signal actor_changed(actor: CharacterState)

signal card_drawn(character: CharacterState, cards: Array[CardState])
signal card_played(character: CharacterState, card: CardState)

signal skill_used(character: CharacterState, skill: SkillState)

signal damage_dealt(target: CharacterState, amount: int)
signal shield_gained(character: CharacterState, amount: int)
signal character_healed(character: CharacterState, amount: int)

signal passive_triggered(character: CharacterState, passive: PassiveState)

signal game_ended(player_won: bool)

signal log_message(text: String)
```

### 6.2 UI 响应

| 信号 | UI 响应 |
|------|---------|
| turn_started | 显示回合数特效 |
| actor_changed | 更新行动指示器 |
| card_drawn | 播放抽牌动画 |
| damage_dealt | 显示伤害数字、角色抖动 |
| shield_gained | 显示护盾数字 |
| passive_triggered | 高亮内功名称 |
| game_ended | 切换到结果场景 |

---

## 7. 文件结构

```
scripts/game/
├── types.gd              # 类型定义（枚举、结构体）
├── game_state.gd         # GameState 工厂函数
├── character_state.gd    # CharacterState 工厂函数
├── card_state.gd         # CardState 工厂函数
├── skill_state.gd        # SkillState 工厂函数
├── passive_state.gd      # PassiveState 工厂函数
├── effect_processor.gd   # 效果处理器
├── damage_calculator.gd  # 伤害计算
└── ai.gd                 # AI 系统
```

---

## 8. 实现优先级

### Phase 1: 核心状态
1. types.gd - 类型定义
2. card_state.gd - 卡牌状态
3. character_state.gd - 角色状态
4. game_state.gd - 游戏状态

### Phase 2: 战斗流程
1. 回合流程（start_new_turn, end_turn）
2. 行动系统（use_basic_card, use_skill）
3. 行动顺序（decide_turn_order, should_switch_actor）

### Phase 3: 效果系统
1. effect_processor.gd - 效果处理器
2. damage_calculator.gd - 伤害计算
3. 内功触发系统

### Phase 4: AI 系统
1. AI 决策逻辑
2. 目标选择
3. 武功使用策略

### Phase 5: UI 集成
1. 信号连接
2. 动画触发
3. 战斗日志
