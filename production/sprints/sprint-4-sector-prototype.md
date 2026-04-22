# Sprint 4 — 门派经营原型

**时间**: 2026-04-22 ~ 2026-05-06 (2周，弹性)

## 冲刺目标

实现门派经营系统最小原型，验证核心循环：门派主界面 → 弟子管理 → 回合结算 → 门派战入口

---

## 背景

基于已完成的设计文档：
- `docs/SECTOR-MANAGEMENT-DESIGN.md` — 门派经营概念框架
- `docs/SECTOR-UI-DESIGN.md` — UI 设计草图

---

## 容量

- **总时间**: 业余开发，弹性安排
- **缓冲**: 充足，不设硬性期限
- **可用时间**: 按实际进度调整

---

## 任务

### 必须完成 (Must Have)

| ID | 任务 | 负责人 | 预估 | 依赖 | 验收标准 |
|----|------|--------|------|------|----------|
| **数据层** |||||
| S4-1 | 门派数据结构定义 | - | 2h | 无 | `Sector` 接口（声望、财富、弟子列表、设施列表） |
| S4-2 | 门派状态管理 | - | 2h | S4-1 | `SectorManager` 工厂函数，支持回合推进 |
| S4-3 | 扩展弟子结构 | - | 1h | Sprint3-P2-1 | 添加忠诚度、资质、状态属性 |
| **UI层** |||||
| S4-4 | 门派主界面场景 | - | 4h | S4-2 | `SectorScene.ts` 基础布局（状态栏 + 弟子列表） |
| S4-5 | 弟子卡片组件 | - | 3h | S4-3 | `DiscipleCard.ts` 显示弟子头像、状态、武功 |
| S4-6 | 状态栏组件 | - | 2h | S4-2 | 显示声望、财富、回合数 |
| S4-7 | 回合结算按钮 | - | 1h | S4-4 | "结束回合"按钮，触发结算流程 |
| **流程** |||||
| S4-8 | 回合结算逻辑 | - | 2h | S4-2 | 资源收入、弟子状态恢复、事件触发（简化） |
| S4-9 | 回合结算界面 | - | 2h | S4-8 | 显示本回合变化的弹窗 |

### 应该完成 (Should Have)

| ID | 任务 | 负责人 | 预估 | 依赖 | 验收标准 |
|----|------|--------|------|------|----------|
| B1 | 门派挑战入口 | - | 2h | S4-4 | 点击"挑战"按钮 → 进入战斗选择 |
| B2 | 目标门派数据 | - | 2h | S4-1 | 3个对手门派配置（丐帮对手、武当、华山） |
| B3 | 门派战选择界面 | - | 3h | B1,B2 | 选择出战弟子 → 进入 BattleScene |
| B4 | 弟子详情弹窗 | - | 2h | S4-5 | 点击弟子卡片显示详细信息 |

### 可以完成 (Nice to Have)

| ID | 任务 | 负责人 | 预估 | 依赖 | 验收标准 |
|----|------|--------|------|------|----------|
| N1 | 简易事件系统 | - | 3h | S4-8 | 2-3个固定事件（如"发现秘籍"） |
| N2 | 势力地图简化版 | - | 3h | B2 | 显示各门派位置和关系状态 |
| N3 | 设施建设入口 | - | 2h | S4-4 | 点击设施区域显示建设选项（无实际功能） |

---

## 上次冲刺结转

| 任务 | 原因 | 新预估 |
|------|------|--------|
| Sprint3-P2-1 弟子数据结构 | 未完成 | 1h（合并到 S4-3） |
| Sprint1-A4 音效资源 | 音频暂停 | 不纳入 |

---

## 风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| UI布局复杂度高 | 中 | 中 | 先实现 ASCII 布局的核心部分 |
| 场景切换流程设计 | 低 | 中 | 复用现有 Scene 基类 |
| 数据结构与战斗系统集成 | 中 | 高 | 弟子数据兼容现有 Character 类型 |
| 事件系统设计决策点多 | 中 | 低 | 第一版使用固定事件 |

---

## 外部依赖

- 无新增外部依赖
- 复用现有：PixiJS、Scene 系统、UIComponents

---

## 完成定义

- [ ] 所有 Must Have 任务完成
- [ ] 门派主界面可显示并交互
- [ ] 弟子列表可查看
- [ ] 点击"结束回合"触发结算
- [ ] 结算界面显示资源变化
- [ ] 无相关 console 错误
- [ ] 更新 milestone 进度

---

## 技术方案预览

### 数据结构

```typescript
// src/game/Sector.ts
interface Sector {
  id: string
  name: string           // 门派名称
  reputation: number     // 声望
  wealth: number         // 银两
  disciples: Disciple[]  // 弟子列表
  facilities: Facility[] // 设施列表
  turn: number           // 当前回合
}

interface Disciple extends Character {
  loyalty: number        // 忠诚度
  aptitude: number       // 资质
  status: 'healthy' | 'injured' | 'training'
  trainingTask?: string  // 当前修炼任务
}

interface Facility {
  id: string
  name: string
  level: number
  capacity: number
}
```

### 场景结构

```typescript
// src/scenes/SectorScene.ts
class SectorScene extends Scene {
  - statusBar: SectorStatusBar
  - discipleList: DiscipleCard[]
  - actionButtons: Button[]
  - onTurnEnd(): void
}
```

---

## 后续规划

完成本冲刺后：
- **Sprint 5**: 设施建设系统、弟子修炼分配
- **Sprint 6**: 事件系统、门派外交
- **Sprint 7**: 门派战完整流程（多弟子出战）

---

## 备注

- 业余开发，进度弹性调整
- 目标是验证核心循环，界面可先简陋
- 数据先静态配置，后续改为动态生成
- 与现有战斗系统紧密集成，确保弟子数据兼容