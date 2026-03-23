# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

武侠卡牌对战游戏 - 基于 Vue 3 的回合制卡牌游戏，核心机制为基于轻功的行动顺序系统。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (localhost:5173)
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```

## 架构概览

### 核心模块 (`src/game/`)

- **Game.js**: 游戏状态管理，使用 `reactive()` 工厂函数。负责回合流程、伤害处理、武功招式效果执行
- **Character.js**: 角色工厂函数，管理 HP/MP/护盾/轻功、卡组、内功被动触发
- **AI.js**: AI 决策逻辑，包含武功招式使用、防御判断、攻击效率计算

### 数据定义 (`src/data/`)

- **skills.js**: 三层结构
  - `martialArtSkills`: 武功招式（主动技能，需要特定类型手牌作为媒介）
  - `passiveSkills`: 内功（被动效果，按触发时机自动激活）
  - `martialArts`: 武功配置（可包含武功招式、内功或两者）
  - `characters`: 14个角色定义，含属性、武功列表、卡组
- **cards.js**: 基础招式卡牌（空手/短兵/长兵/腿法四类）

### Vue 组件 (`src/components/`)

- **GameBoard.vue**: 主游戏界面，管理游戏状态和玩家交互
- **CharacterPanel.vue**: 角色状态面板（HP/MP/护盾/轻功/武功信息）
- **CardHand.vue**: 手牌显示区域
- **Card.vue**: 单张卡牌组件
- **ActionBar.vue**: 可用武功招式按钮
- **BattleLog.vue**: 战斗日志滚动显示

## 核心机制

### 行动顺序

轻功值决定回合内行动顺序。每回合开始时比较双方轻功，高者先行动。使用卡牌/招式消耗轻功值，当当前行动方轻功低于对方时切换行动方。

### 武功招式系统

武功招式需要对应类型的手牌作为媒介：
- 空手类武功招式需要空手类手牌
- 短兵类武功招式需要短兵类手牌
- `requiredCardType: 'any'` 表示任意类型手牌都可

### 内功触发时机 (TriggerTiming)

```javascript
TURN_START    // 回合开始
TURN_END      // 回合结束
ON_DAMAGE     // 造成伤害时
ON_TAKE_DAMAGE // 受到伤害时
ON_PLAY_CARD  // 使用基础招式时
ON_SKILL_USE  // 使用武功招式时
```

### Vue 响应式注意事项

必须使用 `reactive()` 而非 `shallowRef()`，否则嵌套属性更新不会触发视图重渲染。角色和游戏状态通过工厂函数创建并返回 reactive 对象。

### 添加新角色

在 `skills.js` 的 `characters` 对象中添加配置：
```javascript
newCharacter: {
  id: 'newCharacter',
  name: '角色名',
  title: '称号',
  description: '描述',
  hp: 60, mp: 20, agility: 10,
  martialArts: ['martialArtId'], // 引用 martialArts 中的武功
  deck: ['fist', 'palm', ...]    // 引用 basicCards 中的卡牌ID
}
```

### 添加新武功招式/内功

1. 在 `martialArtSkills` 或 `passiveSkills` 中定义
2. 在 `martialArts` 中创建武功配置，关联武功招式和/或内功
3. 角色通过 `martialArts` 数组引用