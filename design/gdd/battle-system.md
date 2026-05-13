# 战斗系统设计文档

> **Status**: Approved
> **Created**: 2026-05-13
> **Last Updated**: 2026-05-13
> **Source Code**: src/game/Game.ts, src/game/Character.ts, src/game/AI.ts, src/game/DistanceSystem.ts

---

## 1. Overview

### 1.1 系统定义

战斗系统是武侠卡牌对战游戏的核心玩法系统，负责管理回合制卡牌对战的完整流程。系统采用**基于轻功的行动顺序**作为核心创新机制，结合武功招式、内功被动、距离系统等元素，构建策略深度。

### 1.2 核心体验

- **轻功决定先手**：轻功高的角色先行动，使用招式消耗轻功，轻功耗尽则回合结束
- **卡牌作为媒介**：基础招式卡牌既是攻击手段，也是武功招式的触发媒介
- **内功自动触发**：内功被动在特定时机自动激活，提供战术优势
- **多人战斗策略**：距离系统、目标选择、武功范围增加团队配合深度

### 1.3 系统边界

| 包含 | 不包含 |
|------|--------|
| 回合流程管理 | 角色属性定义（角色系统） |
| 行动顺序计算 | 卡牌数据定义（卡牌系统） |
| 伤害计算与应用 | 武功招式定义（武功系统） |
| 护盾系统 | 内功定义（内功系统） |
| 状态效果（DoT/Debuff） | AI决策逻辑（AI系统） |
| 多人战斗距离计算 | UI渲染（UI系统） |
| 目标选择验证 | 存档持久化（存档系统） |

---

## 2. Player Fantasy

### 2.1 核心幻想

**"轻功高手先发制人，内功深厚后发制胜"**

玩家体验武侠小说中的战斗节奏：
- 身法敏捷者抢占先机，连续出招
- 内功深厚者以静制动，被动触发反击
- 武功招式配合手牌，打出连招组合
- 多人战斗中，距离和站位成为关键策略

### 2.2 关键时刻

1. **回合开始**：轻功值决定行动顺序，高轻功角色获得先手优势
2. **卡牌选择**：权衡伤害、护盾、轻功消耗，选择最优出牌
3. **武功释放**：消耗内力和手牌，释放强力武功招式
4. **内功触发**：被动效果在关键时刻激活，扭转战局
5. **行动切换**：轻功消耗后，判断是否切换行动方
6. **多人战斗**：计算距离，选择最佳目标

---

## 3. Detailed Rules

### 3.1 战斗模式

| 模式 | 描述 | 座位布局 |
|------|------|----------|
| 1v1 | 单人对决 | 2座位，左右分布 |
| 阵营对战 (team) | 多人组队战斗 | 左右分布，队友相邻 |
| 混战 (freeforall) | 所有人互为敌人 | 圆形交错分布 |

### 3.2 回合流程

```
回合开始
  ├── 重置所有角色状态（轻功恢复、Debuff递减）
  ├── 触发回合开始内功（TURN_START）
  ├── 所有存活角色抽2张牌
  ├── 检查游戏结束条件
  └── 决定行动顺序（按当前轻功排序）

行动阶段
  ├── 当前行动方选择行动
  │   ├── 使用基础招式卡牌
  │   │   ├── 验证：轻功足够、目标在范围内
  │   │   ├── 消耗：轻功值、手牌
  │   │   ├── 效果：伤害/护盾、触发内功
  │   │   └── 检查：游戏结束、行动切换
  │   └── 使用武功招式
  │       ├── 验证：轻功足够、内力足够、手牌类型匹配、目标在范围内
  │       ├── 消耗：轻功值、内力、手牌
  │       ├── 效果：武功效果列表、触发内功
  │       └── 检查：游戏结束、额外行动、追击、行动切换
  ├── 判断是否切换行动方
  │   ├── 条件：当前轻功 ≤ 敌方最高轻功
  │   └── 切换到下一个轻功最高的角色
  └── 循环直到回合结束

回合结束
  ├── 触发回合结束内功（TURN_END）
  ├── 检查游戏结束条件
  └── 开始新回合
```

### 3.3 行动顺序规则

**核心机制**：轻功值决定行动顺序

1. **回合开始排序**：所有存活角色按当前轻功值降序排列
2. **行动消耗**：使用卡牌/招式消耗轻功值（agilityCost）
3. **切换判断**：
   - 当前行动方轻功 ≤ 敌方最高轻功时，切换行动方
   - 切换到下一个轻功最高的存活角色
4. **回合结束**：所有角色轻功耗尽或无法行动

### 3.4 卡牌使用规则

#### 基础招式卡牌

| 验证条件 | 描述 |
|----------|------|
| 轻功足够 | `actor.agility >= card.agilityCost` |
| 目标有效 | 目标存在且存活 |
| 距离合法 | 攻击卡牌：`distance <= card.range` |

**效果处理**：
1. 计算伤害：`baseDamage * strengthMultiplier`
2. 触发出牌内功：`ON_PLAY_CARD`
3. 应用伤害：触发受击内功 `ON_TAKE_DAMAGE`，护盾吸收
4. 触发造成伤害内功：`ON_DAMAGE`
5. 应用护盾：`actor.shield += card.baseShield`
6. 处理自伤：`actor.hp -= card.selfDamage`

#### 武功招式

| 验证条件 | 描述 |
|----------|------|
| 轻功足够 | `actor.agility >= skill.agilityCost` |
| 内力足够 | `actor.mp >= skill.mpCost` |
| 手牌类型匹配 | `card.type === skill.requiredCardType` 或 `requiredCardType === 'any'` |
| 目标有效 | 目标存在且存活 |
| 距离合法 | 有伤害效果时：`distance <= skill.range` |

**效果类型**：

| 效果类型 | 描述 | 参数 |
|----------|------|------|
| damage | 直接伤害 | value, ignoreShield |
| shield | 获得护盾 | value |
| selfDamage | 自身伤害 | value |
| drainMp | 吸取内力 | value |
| removeMp | 消除内力并造成等量伤害 | value |
| drainHp | 吸取体力 | value |
| dot | 持续伤害 | value, duration |
| debuffAgility | 降低轻功 | value, duration |
| disableCardType | 禁用卡牌类型 | cardType, duration |
| extraAction | 额外行动一次 | — |
| followUp | 可追击一次 | — |
| mimic | 模仿上次武功 | — |

### 3.5 内功触发时机

| 触发时机 | 描述 | 常见效果 |
|----------|------|----------|
| TURN_START | 回合开始 | 恢复体力/内力、获得护盾、提升轻功 |
| TURN_END | 回合结束 | 恢复体力/内力 |
| ON_DAMAGE | 造成伤害时 | 恢复体力/内力、增加伤害 |
| ON_TAKE_DAMAGE | 受到伤害时 | 减伤、闪避、反弹 |
| ON_PLAY_CARD | 使用基础招式时 | 增加伤害 |
| ON_SKILL_USE | 使用武功招式时 | 减少消耗、增加伤害 |

### 3.6 距离系统（多人战斗）

**圆形布局**：
- 座位按圆形排列，索引0到N-1
- 距离计算：`min(|seatA - seatB|, totalSeats - |seatA - seatB|)`
- 死亡角色不计入距离

**攻击范围**：
- 空手类卡牌：range = 1（相邻）
- 短兵类卡牌：range = 2
- 长兵类卡牌：range = 3
- 武功招式：自定义 range 属性

### 3.7 游戏结束条件

| 条件 | 结果 |
|------|------|
| 玩家队伍全灭 | 玩家失败 |
| 敌方队伍全灭 | 玩家胜利 |

---

## 4. Formulas

### 4.1 伤害计算

```
基础伤害 = card.baseDamage 或 skill.effects[].value
力量加成 = floor(基础伤害 * strengthMultiplier)
strengthMultiplier = 1 + (strength - 1) * 0.05  // strength: 1-10

实际伤害 = 基础伤害 × 力量加成
```

**力量加成表**：

| strength | 倍率 | 示例（基础伤害10） |
|----------|------|-------------------|
| 1 | 1.00 | 10 |
| 5 | 1.20 | 12 |
| 8 | 1.35 | 13 |
| 10 | 1.45 | 14 |

### 4.2 护盾计算

```
护盾值 = card.baseShield 或 skill.effects[].value (type=shield)
护盾吸收：damage先扣除护盾，剩余伤害扣除HP
护盾不跨回合保留
```

### 4.3 轻功计算

```
初始轻功 = baseAgility + agilityBonus
回合恢复轻功 = 初始轻功（每回合开始重置）
Debuff减益：agility -= debuff.value（回合开始时应用）
```

### 4.4 距离计算

```
物理距离 = min(|seatA - seatB|, totalSeats - |seatA - seatB|)
实际距离 = 跳过死亡角色后的最短路径
```

### 4.5 卡牌/武功范围验证

```
isValidTarget = distance <= card.range 或 distance <= skill.range
```

---

## 5. Edge Cases

### 5.1 卡牌系统边界

| 边界情况 | 处理方式 |
|----------|----------|
| 手牌为空 | 无法行动，回合结束 |
| 手牌超过7张 | 无法再抽牌 |
| 牌组为空 | 弃牌堆洗入牌组 |
| 弃牌堆也为空 | 无法抽牌，跳过 |

### 5.2 伤害系统边界

| 边界情况 | 处理方式 |
|----------|----------|
| 伤害为0 | 不触发伤害相关内功 |
| 护盾大于伤害 | 护盾吸收全部伤害，剩余护盾保留 |
| 无视护盾伤害 | 直接扣除HP，不经过护盾 |
| 目标已死亡 | 不应用效果，检查游戏结束 |

### 5.3 内功系统边界

| 边界情况 | 处理方式 |
|----------|----------|
| 多个内功同时触发 | 按内功在passives数组中的顺序依次触发 |
| 闪避成功 | 不受伤害，可触发反弹效果 |
| 反弹伤害 | 对攻击者造成伤害，不计入闪避者输出 |

### 5.4 行动顺序边界

| 边界情况 | 处理方式 |
|----------|----------|
| 所有角色轻功相同 | 按座位顺序行动 |
| 只有一个存活角色 | 不切换行动方，回合结束 |
| 额外行动 | 不消耗额外轻功，继续当前回合 |
| 追击 | 允许再使用一次招式 |

### 5.5 多人战斗边界

| 边界情况 | 处理方式 |
|----------|----------|
| 目标超出范围 | 返回错误，不执行行动 |
| 目标已死亡 | 需重新选择目标 |
| 队友攻击 | 阵营对战模式禁止，混战模式允许 |

---

## 6. Dependencies

### 6.1 上游依赖

| 系统 | 依赖内容 | 接口 |
|------|----------|------|
| 角色系统 | 角色状态、属性、方法 | `CharacterState` |
| 卡牌系统 | 基础招式卡牌数据 | `Card`, `createBasicCard()` |
| 武功系统 | 武功招式、内功定义 | `MartialArtSkill`, `PassiveSkill` |
| 事件系统 | 事件发射器 | `EventManager`, `GameEventType` |

### 6.2 下游依赖

| 系统 | 使用内容 | 接口 |
|------|----------|------|
| AI系统 | 战斗状态、行动方法 | `GameState.useBasicCard()`, `GameState.useSkill()` |
| UI系统 | 战斗日志、状态变化事件 | `GameEventType.*` |
| 存档系统 | 战斗状态序列化 | `GameState` JSON |

### 6.3 内部模块

| 模块 | 文件 | 职责 |
|------|------|------|
| Game | Game.ts | 战斗状态管理、回合流程 |
| Character | Character.ts | 角色状态、内功触发 |
| AI | AI.ts | AI决策逻辑 |
| DistanceSystem | DistanceSystem.ts | 距离计算、座位分配 |
| types | types.ts | 类型定义 |

---

## 7. Tuning Knobs

### 7.1 平衡参数

| 参数 | 当前值 | 安全范围 | 影响方面 |
|------|--------|----------|----------|
| 初始手牌数 | 5 | 3-7 | 起手策略深度 |
| 每回合抽牌数 | 2 | 1-3 | 资源获取节奏 |
| 手牌上限 | 7 | 5-10 | 资源管理压力 |
| 力量伤害加成 | 5%/点 | 3-7%/点 | 属性价值 |

### 7.2 卡牌消耗参数

| 参数 | 当前范围 | 安全范围 | 影响方面 |
|------|----------|----------|----------|
| 基础招式轻功消耗 | 2-4 | 1-5 | 行动频率 |
| 武功招式轻功消耗 | 2-4 | 1-6 | 武功使用频率 |
| 武功招式内力消耗 | 2-5 | 1-8 | 内力资源压力 |

### 7.3 伤害参数

| 参数 | 当前范围 | 安全范围 | 影响方面 |
|------|----------|----------|----------|
| 基础招式伤害 | 2-5 | 1-8 | 基础战斗节奏 |
| 武功招式伤害 | 5-12 | 3-20 | 武功价值感 |
| 护盾值 | 2-6 | 1-10 | 防御策略深度 |

### 7.4 距离参数

| 参数 | 当前值 | 安全范围 | 影响方面 |
|------|--------|----------|----------|
| 空手攻击范围 | 1 | 1-2 | 近战定位 |
| 短兵攻击范围 | 2 | 1-3 | 中距离定位 |
| 长兵攻击范围 | 3 | 2-4 | 远距离定位 |

---

## 8. Acceptance Criteria

### 8.1 功能验收

- [ ] 1v1战斗完整流程可执行
- [ ] 多人战斗（3v3）正常进行
- [ ] 混战模式正常进行
- [ ] 轻功行动顺序正确计算
- [ ] 卡牌使用验证正确（轻功、距离、类型）
- [ ] 武功招式使用验证正确（内力、手牌类型）
- [ ] 所有武功效果类型正常工作
- [ ] 所有内功触发时机正常触发
- [ ] 护盾系统正确吸收伤害
- [ ] DoT/Debuff正确应用和递减
- [ ] 游戏结束条件正确判断

### 8.2 性能验收

- [ ] 单次行动响应时间 < 100ms
- [ ] 回合开始处理时间 < 200ms
- [ ] 10人战斗无性能问题

### 8.3 边界验收

- [ ] 空手牌时正确处理
- [ ] 牌组耗尽时正确洗牌
- [ ] 护盾溢出时正确处理
- [ ] 多内功同时触发时顺序正确
- [ ] 死亡角色不计入距离计算

### 8.4 测试用例

```typescript
// TC-BATTLE-001: 轻功行动顺序
// 预期：轻功高的角色先行动
test('Agility determines turn order', () => {
  const game = createGame()
  game.init(player, enemy)
  expect(game.currentActor).toBe(player) // player.agility > enemy.agility
})

// TC-BATTLE-002: 卡牌轻功消耗
// 预期：使用卡牌后轻功减少
test('Card usage consumes agility', () => {
  const game = createGame()
  game.init(player, enemy)
  const initialAgility = player.agility
  game.useBasicCard(card.instanceId)
  expect(player.agility).toBe(initialAgility - card.agilityCost)
})

// TC-BATTLE-003: 武功招式验证
// 预期：手牌类型不匹配时无法使用武功
test('Skill requires matching card type', () => {
  const game = createGame()
  game.init(player, enemy)
  const skill = skills.dragonPalm // requires EMPTY_HAND
  const card = cards.stab // SHORT_WEAPON
  const result = game.useSkill(skill.id, card.instanceId)
  expect(result.success).toBe(false)
})

// TC-BATTLE-004: 距离验证
// 预期：超出范围时无法攻击
test('Attack fails when target out of range', () => {
  const game = createGame()
  game.initTeamBattle([player], [enemy], 'team')
  // 设置距离为3，卡牌范围为1
  const result = game.useBasicCard(shortRangeCard.instanceId, enemy.id)
  expect(result.success).toBe(false)
  expect(result.message).toContain('超出攻击范围')
})
```

---

## Appendix A: 武功效果类型详解

### A.1 伤害类效果

| 效果 | 参数 | 示例 |
|------|------|------|
| damage | value, ignoreShield? | 降龙十八掌：10点伤害 |
| drainHp | value | 擒龙手：6伤害+3吸血 |
| dot | value, duration | 生死符：3伤害/回合×3回合 |

### A.2 控制类效果

| 效果 | 参数 | 示例 |
|------|------|------|
| debuffAgility | value, duration | 醉仙望月步：轻功-2持续1回合 |
| disableCardType | cardType, duration | 打狗棒法：禁用腿法1回合 |

### A.3 资源类效果

| 效果 | 参数 | 示例 |
|------|------|------|
| drainMp | value | 北冥神功：吸取6内力 |
| removeMp | value | — |

### A.4 特殊效果

| 效果 | 参数 | 示例 |
|------|------|------|
| extraAction | — | 葵花宝典：再行动一次 |
| followUp | — | 天山折梅手：可追击 |
| mimic | — | 小无相功：模仿上次武功 |
| shield | value | 太极拳：4护盾 |
| selfDamage | value | 七伤拳：自伤2点 |

---

## Appendix B: 内功触发时机详解

### B.1 TURN_START

**触发时机**：回合开始，重置状态后

**常见效果**：
- 恢复体力：九阳神功（4点）、玉女心经（2点）
- 恢复内力：易筋经（3点）、混天功（2点）
- 获得护盾：金钟罩（6点）、蛤蟆功（4点）
- 提升轻功：凌波微步（+2）、段氏内功（+1）

### B.2 ON_DAMAGE

**触发时机**：造成伤害后

**常见效果**：
- 恢复体力：吸星大法（50%伤害转化）
- 恢复内力：北冥神功（50%伤害转化）
- 恢复体力：丐帮内功（固定3点）

### B.3 ON_TAKE_DAMAGE

**触发时机**：受到伤害前（可修改伤害）

**常见效果**：
- 减伤：太极心法（减25%）
- 闪避+反弹：乾坤大挪移（20%几率）、斗转星移（25%几率）

### B.4 ON_PLAY_CARD

**触发时机**：使用基础招式时

**常见效果**：
- 增加伤害：龙象般若功（+3点）

### B.5 ON_SKILL_USE

**触发时机**：使用武功招式时

**常见效果**：
- 增加伤害：华山心法（+15%）、紫霞神功（+15%）、先天功（+20%）
- 减少消耗：九阴真经（内力-1）

---

## Appendix C: 代码架构

### C.1 核心类/函数

```
Game.ts
├── createGame() → GameState
│   ├── init() / initTeamBattle()
│   ├── startNewTurn()
│   ├── decideTurnOrder()
│   ├── switchActor()
│   ├── shouldSwitchActor()
│   ├── useBasicCard()
│   │   ├── validateBasicCardUse()
│   │   ├── consumeBasicCardResources()
│   │   ├── applyBasicCardEffects()
│   │   └── finalizeBasicCardUse()
│   ├── useSkill()
│   │   ├── validateSkillUse()
│   │   ├── consumeSkillResources()
│   │   ├── processSkillEffects()
│   │   └── finalizeSkillUse()
│   ├── processEffect()
│   ├── checkTurnEnd()
│   ├── checkGameEnd()
│   └── endGame()

Character.ts
├── createCharacter() → CharacterState
│   ├── initDeck()
│   ├── drawCards()
│   ├── playCard()
│   ├── resetForNewTurn()
│   ├── onTurnStart()
│   ├── onTurnEnd()
│   ├── takeDamage()
│   │   ├── processDamagePassives()
│   │   ├── applyShieldAbsorption()
│   │   └── applyFinalDamage()
│   ├── heal()
│   ├── recoverMp()
│   ├── getAvailableCards()
│   ├── canUseSkill()
│   └── getAvailableSkills()

AI.ts
├── AI
│   ├── executeTurn()
│   ├── decideAction()
│   ├── selectBestTarget()
│   ├── tryUseSkill()
│   ├── shouldDefend()
│   ├── selectDefendCard()
│   └── selectAttackCard()

DistanceSystem.ts
├── calculateDistance()
├── calculateActualDistance()
├── isEnemy()
├── getTargetsInRange()
├── assignSeats()
└── getSeatPosition()
```

### C.2 状态流转

```
GamePhase.SETUP → GamePhase.SELECTING → GamePhase.ACTING → GamePhase.SELECTING
                                    ↓
                              GamePhase.GAME_OVER
```

### C.3 事件系统

```typescript
enum GameEventType {
  GAME_START, GAME_END,
  TURN_START, TURN_END,
  CHARACTER_DAMAGED, CHARACTER_HEALED, CHARACTER_SHIELD, CHARACTER_DEATH,
  CARD_DRAWN, CARD_PLAYED, CARD_DISCARDED,
  SKILL_USED, PASSIVE_TRIGGERED,
  UI_UPDATE, LOG_MESSAGE
}
```
