# Phase 1 多人战斗系统 - 技术实现记录

**日期**: 2026-04-02  
**分支**: pixi  
**状态**: 核心功能完成，待添加目标选择UI

---

## 一、实现概述

将现有 1v1 卡牌战斗系统扩展为支持多人战斗（>=2人），并引入圆形距离系统（参考三国杀）。

---

## 二、文件改动清单

### 2.1 新增文件

| 文件 | 说明 |
|------|------|
| `src/game/DistanceSystem.ts` | 距离计算和座位分配系统 |

### 2.2 修改文件

| 文件 | 主要改动 |
|------|---------|
| `src/game/types.ts` | 添加 BattleMode, BattlePosition 类型，武功添加 range |
| `src/game/Game.ts` | 完全重写，支持多人战斗 |
| `src/game/Character.ts` | 添加 battlePosition 属性和 getDistanceTo 方法 |
| `src/game/AI.ts` | 重构支持多目标决策 |
| `src/scenes/BattleScene.ts` | 重构支持圆形布局和多人战斗 |
| `src/data/skills.ts` | 所有武功招式添加 range 属性 |
| `tests/game.test.ts` | 测试武功添加 range 属性 |

---

## 三、核心类型定义

### 3.1 战斗模式

```typescript
export type BattleMode = 'team' | 'freeforall'
// team: 阵营对战 - 友方坐在一起
// freeforall: 混战模式 - 座位交替分配
```

### 3.2 战斗位置

```typescript
export interface BattlePosition {
  seatIndex: number      // 座位编号（0-N，圆形排列）
  team: 'player' | 'enemy' | null  // 混战时为null
}
```

### 3.3 武功攻击范围

```typescript
export interface MartialArtSkill {
  // ... 现有属性
  range: number  // 攻击范围 1-3
}
```

---

## 四、距离计算规则

### 4.1 圆形距离公式

```typescript
function calculateDistance(seatA: number, seatB: number, totalSeats: number): number {
  const diff = Math.abs(seatA - seatB)
  return Math.min(diff, totalSeats - diff)
}
```

### 4.2 距离示例

| 座位关系 | 距离值 |
|---------|-------|
| 相邻 | 1 |
| 隔1人 | 2 |
| 隔2人 | 3 |

### 4.3 武功攻击范围

| 武功类型 | 攻击范围 |
|---------|---------|
| 空手基础招式（拳/掌/肘） | 1 |
| 降龙十八掌、黯然销魂掌 | 1 |
| 弹指神通、一阳指、打狗棒法 | 2 |
| 六脉神剑、生死符 | 3 |

---

## 五、座位分配规则

### 5.1 阵营对战 (team mode)

```
示例：3v3

		座位0 (敌人1)
	  ↗              ↘
  座位5              座位1
 (敌人3)            (敌人2)
	 ↑                 ↓
  座位4              座位2
 (玩家3)            (玩家1)
	  ↖              ↙
		座位3 (玩家2)

敌人占座位 0,1,2（连续）
玩家占座位 3,4,5（连续）
```

### 5.2 混战模式 (freeforall)

```
示例：6人混战

		座位0 (玩家A)
	  ↗              ↘
  座位5              座位1
 (玩家F)            (玩家B)
	 ↑                 ↓
  座位4              座位2
 (玩家E)            (玩家C)
	  ↖              ↙
		座位3 (玩家D)

座位交替分配，无固定队友
```

---

## 六、API 变更

### 6.1 Game.ts 初始化

```typescript
// 1v1 向后兼容
game.init(player, enemy)

// 多人战斗
game.initTeamBattle(playerTeam, enemyTeam, mode)
```

### 6.2 新增方法

```typescript
// 获取所有角色
game.getAllCharacters(): CharacterState[]

// 获取存活角色
game.getAliveCharacters(team?: 'player' | 'enemy'): CharacterState[]

// 获取范围内目标
game.getTargetsInRange(actor: CharacterState, range: number): CharacterState[]

// 选择目标
game.selectTarget(target: CharacterState | null): void
```

---

## 七、布局策略

### 7.1 1v1 模式

- 保持传统左右布局
- 玩家在左边，敌人在右边
- 与现有 UI 兼容

### 7.2 多人模式

- 圆形布局，角色围绕圆心分布
- 动态计算半径适应屏幕
- 避开顶部状态栏和底部操作区

---

## 八、待完成功能

### 8.1 目标选择UI

- 使用武功时显示可选目标
- 高亮显示范围内的敌人
- 点击选择目标确认攻击

### 8.2 合击技系统（暂不开发）

---

## 九、测试验证

- [x] `npm run build` 编译通过
- [x] `npm test` 20/20 测试通过
- [ ] 启动游戏验证多人布局
- [ ] 验证距离计算正确
- [ ] 验证目标选择（待UI完成）

---

## 十、回滚指南

如需回滚，可使用 git:

```bash
git log --oneline  # 查看提交历史
git revert <commit>  # 回滚指定提交
```

主要改动在以下提交中：
- `feat(game): 添加多人战斗和距离系统`
