# 武功系统重构计划

## 背景

当前武功系统限制：
1. 每个武功只能包含一个武功招式 + 一个内功
2. 武功招式只能消耗一张基础手牌

需要重构为更灵活的结构。

## 重构目标

### 新的武功结构

**武功 = 招式集合（可多个） + 内功（最多一个）**

一个武功可以包含：
- 多个武功招式 + 一个内功
- 多个武功招式（无内功）
- 单个内功（无招式）

### 武功招式消耗多张手牌

武功招式可以消耗多张基础手牌作为媒介：
- `requiredCards`: 数组，定义需要的手牌类型和数量
- 例如：需要2张空手牌 + 1张腿法牌

### 数据结构变更

**当前结构** (`src/data/skills.js`):
```javascript
martialArtSkills: {
  dragonPalm: {
    requiredCardType: CardType.EMPTY_HAND,  // 单个类型
    // ...
  }
}
```

**新结构**:
```javascript
martialArtSkills: {
  dragonPalm: {
    // 方式1：兼容旧格式（单张手牌）
    requiredCardType: CardType.EMPTY_HAND,  // 默认数量为1

    // 方式2：新格式（多张手牌）
    requiredCards: [
      { type: CardType.EMPTY_HAND, count: 2 },  // 2张空手牌
      { type: CardType.LEG, count: 1 }          // 1张腿法牌
    ],
    // ...
  }
}
```

### 武功配置新结构

```javascript
martialArts: {
  dragonPalm: {
    name: '降龙掌',
    skills: [                              // 武功招式数组（可多个）
      martialArtSkills.dragonPalm,
      martialArtSkills.eighteenDragon      // 可添加更多招式
    ],
    passive: passiveSkills.congenital      // 内功（最多一个，可为null）
  },
  // 仅武功招式的武功
  pureSkill: {
    name: '纯外功',
    skills: [martialArtSkills.someSkill],
    passive: null
  },
  // 仅内功的武功
  purePassive: {
    name: '纯内功',
    skills: [],
    passive: passiveSkills.goldenBell
  }
}
```

## 需要修改的文件

### 1. `src/data/skills.js`
- 修改 `martialArtSkills`，支持 `requiredCards[]` 多手牌消耗
- 修改 `martialArts` 数据结构，将 `skill` 改为 `skills[]` 数组
- `passive` 保持单个（可为 null）

### 2. `src/game/Character.js`
- 修改 `createCharacter()` 函数，收集多个招式
```javascript
martialArtsList.forEach(art => {
  if (art.skills) skills.push(...art.skills)
  if (art.passive) passives.push(art.passive)
})
```
- 新增 `canUseSkill()` 方法，检查是否有多张所需手牌
- 新增 `getSkillCards()` 方法，返回可用于某武功招式的手牌组合

### 3. `src/game/Game.js`
- 修改 `useSkill()` 方法，支持消耗多张手牌
- 处理多张手牌的弃牌逻辑

### 4. `src/game/AI.js`
- 修改 `tryUseSkill()` 方法，检查多手牌消耗条件

### 5. `src/components/GameBoard.vue`
- 修改技能选择模式，支持选择多张手牌
- 显示武功招式需要的手牌数量

### 6. `src/App.vue`
- `getMartialArtSkill()` 改为 `getMartialArtSkills()` 返回数组
- 更新武功详情显示

## 多手牌消耗逻辑

### 检查是否可用
```javascript
canUseSkill(skill, hand, agility) {
  // 兼容旧格式
  if (skill.requiredCardType) {
    return hand.some(card => card.type === skill.requiredCardType)
  }

  // 新格式：检查每种类型的手牌数量
  if (skill.requiredCards) {
    for (const req of skill.requiredCards) {
      const count = hand.filter(c => c.type === req.type && c.agilityCost <= agility).length
      if (count < req.count) return false
    }
  }
  return true
}
```

### 获取可用手牌组合
```javascript
getSkillCardOptions(skill, hand, agility) {
  const availableCards = hand.filter(c => c.agilityCost <= agility)

  if (skill.requiredCardType) {
    return availableCards.filter(c => c.type === skill.requiredCardType).map(c => [c])
  }

  if (skill.requiredCards) {
    // 返回所有可能的手牌组合
    // ...
  }
}
```

## 示例配置

### 多招式 + 单内功
```javascript
dragonPalmArts: {
  name: '降龙掌',
  skills: [
    { id: 'dragonPalm', name: '降龙十八掌', requiredCardType: '空手', ... },
    { id: 'dragonSubduing', name: '见龙在田', requiredCards: [{ type: '空手', count: 2 }], ... }
  ],
  passive: { id: 'congenital', name: '先天功', ... }
}
```

### 多手牌消耗武功招式
```javascript
ultimateStrike: {
  name: '绝杀',
  requiredCards: [
    { type: CardType.EMPTY_HAND, count: 2 },
    { type: CardType.LEG, count: 1 }
  ],
  mpCost: 8,
  agilityCost: 5,
  effects: [{ type: 'damage', value: 20 }],
  description: '消耗2张空手牌+1张腿法牌，造成20点伤害'
}
```

## 验证步骤

1. 启动开发服务器：`npm run dev`
2. 选择角色，检查武功详情显示多个招式
3. 进入战斗，验证单手牌武功招式正常使用
4. 测试多手牌消耗武功招式
5. 验证内功被动效果正确触发
6. AI 对战测试，验证 AI 能正确处理多手牌消耗

---

## 当前代码分析

### 现有数据结构 (`src/data/skills.js`)

**武功招式** (`martialArtSkills`):
- `requiredCardType`: 单个手牌类型（或 `'any'`）
- `mpCost`: 内力消耗
- `agilityCost`: 轻功消耗
- `effects`: 效果数组

**内功** (`passiveSkills`):
- `trigger`: 触发时机
- `effect`: 效果函数
- `initEffect`: 初始化效果（可选）

**武功配置** (`martialArts`):
- `skill`: 单个武功招式（可为 null）
- `passive`: 单个内功（可为 null）

### 现有逻辑 (`src/game/Character.js`)

```javascript
// 收集武功招式和内功
martialArtsList.forEach(art => {
  if (art.skill) skills.push(art.skill)    // 单个skill
  if (art.passive) passives.push(art.passive)
})

// 检查是否可使用武功招式
canUseSkill(skill, card, currentAgility) {
  const requiredType = skill.requiredCardType
  const typeMatch = requiredType === 'any' || card.type === requiredType
  // ...
}

// 获取可用于武功招式的手牌
getSkillCards(skill, currentAgility) {
  return this.hand.filter(card => this.canUseSkill(skill, card, currentAgility))
}
```

### 现有逻辑 (`src/game/Game.js`)

```javascript
useSkill(skillId, cardInstanceId) {
  const card = actor.hand.find(c => c.instanceId === cardInstanceId)
  // ...
  actor.playCard(cardInstanceId)  // 弃掉一张手牌
  actor.useMp(skillCopy.mpCost)
  actor.agility -= skillCopy.agilityCost
  // ...
}
```

## 实施顺序

1. **数据层修改** - `src/data/skills.js`
   - 添加 `requiredCards[]` 支持
   - 将 `skill` 改为 `skills[]`

2. **角色层修改** - `src/game/Character.js`
   - 收集多个武功招式
   - 支持多手牌消耗检查

3. **游戏层修改** - `src/game/Game.js`
   - 支持消耗多张手牌

4. **AI层修改** - `src/game/AI.js`
   - AI决策支持多手牌

5. **UI层修改** - `src/components/GameBoard.vue`, `src/App.vue`
   - 显示和交互更新