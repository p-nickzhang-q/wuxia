# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

武侠卡牌对战游戏 - 基于 PixiJS 8 + TypeScript 的回合制卡牌游戏，核心机制为基于轻功的行动顺序系统。

## 常用命令

```bash
npm run dev      # 启动开发服务器 (localhost:5173)
npm run build    # 构建生产版本
npm run preview  # 预览构建结果
```

## 架构概览

### 核心模块 (`src/game/`)

- **Game.ts**: 游戏状态管理，工厂函数模式。负责回合流程、伤害处理、武功招式效果执行
- **Character.ts**: 角色工厂函数，管理 HP/MP/护盾/轻功、卡组、内功被动触发
- **AI.ts**: AI 决策逻辑，包含武功招式使用、防御判断、攻击效率计算
- **types.ts**: TypeScript 类型定义，包含所有接口和枚举

### 数据定义 (`src/data/`)

- **skills.ts**: 四层结构
  - `martialArtSkills`: 武功招式（主动技能，需要特定类型手牌作为媒介）
  - `passiveSkills`: 内功（被动效果，按触发时机自动激活）
  - `martialArts`: 武功配置（支持 `skills[]` 数组，可包含多个武功招式和一个内功）
  - `characters`: 24个角色定义，含属性、武功列表、卡组
- **cards.ts**: 基础招式卡牌（空手/短兵/长兵/腿法四类）

### 场景系统 (`src/scenes/`)

- **Scene.ts**: 场景基类，继承自 PixiJS Container
- **CharacterSelectScene.ts**: 角色选择场景
- **BattleScene.ts**: 战斗场景，管理游戏UI和玩家交互
- **ResultScene.ts**: 结果场景

### 渲染层 (`src/renderer/`)

- **Renderer.ts**: PixiJS Application 封装，支持多渲染器后端（Canvas2D/WebGL）
- **CardRenderer.ts**: 卡牌渲染组件
- **CharacterRenderer.ts**: 角色面板渲染
- **UIComponents.ts**: UI组件（按钮、技能按钮、战斗日志、状态栏）

## 核心机制

### 行动顺序

轻功值决定回合内行动顺序。每回合开始时比较双方轻功，高者先行动。使用卡牌/招式消耗轻功值，当当前行动方轻功低于对方时切换行动方。

### 武功招式系统

武功招式需要对应类型的手牌作为媒介：
- 空手类武功招式需要空手类手牌
- 短兵类武功招式需要短兵类手牌
- 长兵类武功招式需要长兵类手牌
- `requiredCardType: 'any'` 表示任意类型手牌都可

### 内功触发时机 (TriggerTiming)

```typescript
TURN_START    // 回合开始
TURN_END      // 回合结束
ON_DAMAGE     // 造成伤害时
ON_TAKE_DAMAGE // 受到伤害时
ON_PLAY_CARD  // 使用基础招式时
ON_SKILL_USE  // 使用武功招式时
```

### 武功配置结构

每个武功可包含多个武功招式和一个内功：
```typescript
martialArts: {
  artId: {
    id: 'artId',
    name: '武功名',
    skills: [martialArtSkills.skill1, martialArtSkills.skill2], // 多个招式
    passive: passiveSkills.passive1, // 可选内功
    description: '描述'
  }
}
```

### 添加新角色

在 `skills.ts` 的 `characters` 对象中添加配置：
```typescript
newCharacter: {
  id: 'newCharacter',
  name: '角色名',
  title: '称号',
  description: '描述',
  hp: 60, mp: 20, agility: 10,
  martialArts: ['martialArtId1', 'martialArtId2'], // 引用 martialArts 中的武功
  deck: ['fist', 'palm', ...]    // 引用 cards.ts 中的卡牌ID
}
```

### 添加新武功招式/内功

1. 在 `martialArtSkills` 或 `passiveSkills` 中定义
2. 在 `martialArts` 中创建武功配置，关联武功招式和/或内功
3. 角色通过 `martialArts` 数组引用

## 当前角色列表 (24个)

乔峰、段誉、虚竹、郭靖、黄蓉、洪七公、欧阳锋、黄药师、一灯大师、杨过、小龙女、金轮法王、张无忌、张三丰、谢逊、令狐冲、任我行、东方不败、风清扬、鸠摩智、慕容复、袁承志、狄云、石破天

## 技术栈

- TypeScript 5.x
- PixiJS 8.x
- Vite 5.x