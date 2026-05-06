# Systems Index: 武侠卡牌对战游戏

> **Status**: Approved
> **Created**: 2026-04-29
> **Last Updated**: 2026-04-29
> **Source Concept**: design/gdd/game-design.md, design/gdd/game-expansion-design.md

---

## Overview

武侠卡牌对战游戏是一款回合制卡牌对战游戏，核心机制为**基于轻功的行动顺序系统**。游戏系统覆盖战斗核心（轻功、卡牌、武功招式、内功）、多人扩展（距离系统、目标选择）、养成系统（弟子、境界）、门派经营（设施、资源）、江湖世界（地图、势力、事件）以及辅助系统（UI、音频、存档）。当前核心战斗系统和Phase 1多人战斗已完整实现，Phase 2弟子养成部分完成，后续开发重点为资源系统、门派设施和江湖世界。

---

## Systems Enumeration

| # | System Name | Category | Priority | Status | Design Doc | Depends On |
|---|-------------|----------|----------|--------|------------|------------|
| 1 | 渲染系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | — |
| 2 | 场景管理系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | — |
| 3 | 角色系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | — |
| 4 | 卡牌系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | — |
| 5 | 武功招式系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | 卡牌系统 |
| 6 | 内功系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | — |
| 7 | 伤害计算系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | 角色系统 |
| 8 | 状态效果系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | 角色系统 |
| 9 | 回合管理系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | 角色系统 |
| 10 | 轻功行动顺序系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | 回合管理系统, 角色系统 |
| 11 | 战斗流程系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | 回合管理系统, 伤害计算系统 |
| 12 | AI系统 | Core | MVP | ✅ Implemented | design/gdd/game-design.md | 卡牌系统, 武功招式系统, 伤害计算系统 |
| 13 | UI系统 | UI | MVP | ✅ Implemented | design/gdd/game-design.md | 渲染系统, 角色系统, 卡牌系统, 战斗流程系统 |
| 14 | 多人战斗系统 | Gameplay | Phase 1 | ✅ Implemented | design/gdd/game-expansion-design.md | 战斗流程系统 |
| 15 | 距离系统 | Gameplay | Phase 1 | ✅ Implemented | design/gdd/game-expansion-design.md | 多人战斗系统 |
| 16 | 目标选择系统 | Gameplay | Phase 1 | ✅ Implemented | design/gdd/game-expansion-design.md | 距离系统, 武功攻击范围 |
| 17 | 武功攻击范围 | Gameplay | Phase 1 | ✅ Implemented | design/gdd/game-expansion-design.md | 武功招式系统 |
| 18 | 弟子系统 | Progression | Phase 2 | ✅ Implemented | design/gdd/game-expansion-design.md | 角色系统 |
| 19 | 武功学习系统 | Progression | Phase 2 | ✅ Approved | design/gdd/martial-arts-learning-system.md | 弟子系统, 武功招式系统, 门派设施系统, 精力系统 |
| 20 | 境界突破系统 | Progression | Phase 2 | ✅ Approved | design/gdd/realm-breakthrough-system.md | 弟子系统, 资源系统 |
| 21 | 弟子招募系统 | Progression | Phase 2 | ✅ Implemented | design/gdd/game-expansion-design.md | 弟子系统, 资源系统 |
| 22 | 资源系统 | Economy | Alpha | ✅ Approved | design/gdd/resource-system.md | — |
| 23 | 精力系统 | Progression | Alpha | ✅ Approved | design/gdd/vitality-system.md | 弟子系统 | |
| 24 | 门派设施系统 | Economy | Alpha | ✅ Approved | design/gdd/facility-system.md | 弟子系统, 资源系统, 精力系统 |
| 25 | 装备系统 | Economy | Alpha | ✅ Approved | design/gdd/equipment-system.md | 门派设施系统, 精力系统, 弟子系统, 资源系统 |
| 26 | 药品系统 | Economy | Alpha | ✅ Approved | design/gdd/medicine-system.md | 门派设施系统, 精力系统, 资源系统, 弟子系统, 战斗系统 |
| 27 | 合击技系统 | Gameplay | Alpha | 🔲 Not Started | — | 角色系统, 武功招式系统 |
| 28 | 江湖地图系统 | Narrative | Alpha | ✅ Approved | design/gdd/jianghu-map-system.md | — |
| 29 | 门派势力系统 | Narrative | Vertical Slice | ✅ Approved | design/gdd/faction-power-system.md | 江湖地图系统 |
| 30 | 江湖事件系统 | Narrative | Vertical Slice | ✅ Approved | design/gdd/jianghu-event-system.md | 门派势力系统, 资源系统 |
| 31 | 音频系统 | Audio | Full Vision | 🔲 Not Started | — | 战斗流程系统, UI系统 |
| 32 | 存档系统 | Persistence | Full Vision | 🔲 Not Started | — | 角色系统, 弟子系统, 资源系统, 精力系统 |
| 33 | 成就系统 | Meta | Full Vision | 🔲 Not Started | — | 战斗流程系统, 弟子系统 |
| 34 | 多人对战网络 | Meta | Full Vision | 🔲 Not Started | — | 多人战斗系统 |

---

## Categories

| Category | Description | Typical Systems |
|----------|-------------|-----------------|
| **Core** | Foundation systems everything depends on | 渲染、场景管理、角色、卡牌、武功、内功、伤害、状态效果、回合、轻功、战斗流程、AI |
| **Gameplay** | The systems that make the game fun | 多人战斗、距离、目标选择、武功攻击范围、合击技 |
| **Progression** | How the player grows over time | 弟子、武功学习、境界突破、弟子招募 |
| **Economy** | Resource creation and consumption | 资源系统、门派设施、装备系统、药品系统 |
| **Persistence** | Save state and continuity | 存档系统 |
| **UI** | Player-facing information displays | UI系统（角色面板、卡牌渲染、战斗日志、状态栏） |
| **Audio** | Sound and music systems | 音频系统（音效、BGM） |
| **Narrative** | Story and dialogue delivery | 江湖地图、门派势力、江湖事件 |
| **Meta** | Systems outside the core game loop | 成就系统、多人对战网络 |

---

## Priority Tiers

| Tier | Definition | Target Milestone | Design Urgency |
|------|------------|------------------|----------------|
| **MVP** | Required for the core loop to function | 核心战斗原型 | ✅ 已完成 |
| **Phase 1** | 多人战斗扩展 | 多人战斗原型 | ✅ 已完成 |
| **Phase 2** | 弟子养成系统 | 养成系统原型 | ⏳ 部分完成 |
| **Alpha** | 门派经营基础 | Alpha milestone | 🔲 待开发 |
| **Vertical Slice** | 江湖世界完整体验 | Vertical slice / demo | 🔲 待开发 |
| **Full Vision** | Polish and nice-to-haves | Beta / Release | 🔲 待开发 |

---

## Dependency Map

### Foundation Layer (no dependencies)

1. 渲染系统 — PixiJS封装，所有可视系统的底层基础
2. 场景管理系统 — 场景切换和生命周期管理
3. 角色系统 — 独立数据结构，其他系统的基础数据源
4. 卡牌系统 — 独立数据结构，武功招式的媒介
5. 内功系统 — 被动触发逻辑，与角色系统松耦合
6. 资源系统 — 独立数据结构（银两、声望、秘籍碎片、灵材）
7. 江湖地图系统 — 独立数据结构（多区域配置）

### Core Layer (depends on foundation)

1. 武功招式系统 — depends on: 卡牌系统（需要特定类型手牌作为媒介）
2. 伤害计算系统 — depends on: 角色系统（需要HP/护盾数据）
3. 状态效果系统 — depends on: 角色系统（需要Debuff/DoT数据结构）
4. 回合管理系统 — depends on: 角色系统（需要轻功值判断行动顺序）
5. 轻功行动顺序系统 — depends on: 回合管理系统, 角色系统
6. 战斗流程系统 — depends on: 回合管理系统, 伤害计算系统
7. AI系统 — depends on: 卡牌系统, 武功招式系统, 伤害计算系统
8. 合击技系统 — depends on: 角色系统, 武功招式系统
9. 精力系统 — depends on: 弟子系统（精力作为弟子属性）

### Feature Layer (depends on core)

1. 多人战斗系统 — depends on: 战斗流程系统
2. 距离系统 — depends on: 多人战斗系统
3. 目标选择系统 — depends on: 距离系统, 武功攻击范围
4. 武功攻击范围 — depends on: 武功招式系统（新增range属性）
5. 弟子系统 — depends on: 角色系统（扩展数据结构）
6. 武功学习系统 — depends on: 弟子系统, 武功招式系统
7. 境界突破系统 — depends on: 弟子系统
8. 门派设施系统 — depends on: 弟子系统, 资源系统, 精力系统（房间恢复精力）
9. 门派势力系统 — depends on: 江湖地图系统
10. 弟子招募系统 — depends on: 弟子系统, 资源系统

### Presentation Layer (depends on features)

1. UI系统 — depends on: 渲染系统, 角色系统, 卡牌系统, 战斗流程系统

### Polish Layer (depends on everything)

1. 音频系统 — depends on: 战斗流程系统, UI系统（音效触发时机）
2. 存档系统 — depends on: 角色系统, 弟子系统, 资源系统（状态持久化）
3. 成就系统 — depends on: 战斗流程系统, 弟子系统（条件检测）
4. 多人对战网络 — depends on: 多人战斗系统（状态同步）
5. 江湖事件系统 — depends on: 门派势力系统, 资源系统（事件触发和奖励）

---

## Recommended Design Order

| Order | System | Priority | Layer | Agent(s) | Est. Effort | Status |
|-------|--------|----------|-------|----------|-------------|--------|
| 1 | 渲染系统 | MVP | Foundation | engine-programmer | S | ✅ |
| 2 | 场景管理系统 | MVP | Foundation | gameplay-programmer | S | ✅ |
| 3 | 角色系统 | MVP | Foundation | game-designer | M | ✅ |
| 4 | 卡牌系统 | MVP | Foundation | game-designer | M | ✅ |
| 5 | 内功系统 | MVP | Foundation | game-designer | M | ✅ |
| 6 | 武功招式系统 | MVP | Core | game-designer | M | ✅ |
| 7 | 伤害计算系统 | MVP | Core | systems-designer | S | ✅ |
| 8 | 状态效果系统 | MVP | Core | systems-designer | S | ✅ |
| 9 | 回合管理系统 | MVP | Core | game-designer | M | ✅ |
| 10 | 轻功行动顺序系统 | MVP | Core | game-designer | L | ✅ |
| 11 | 战斗流程系统 | MVP | Core | game-designer | L | ✅ |
| 12 | AI系统 | MVP | Core | ai-programmer | M | ✅ |
| 13 | UI系统 | MVP | Presentation | ui-programmer | L | ✅ |
| 14 | 多人战斗系统 | Phase 1 | Feature | game-designer | M | ✅ |
| 15 | 距离系统 | Phase 1 | Feature | systems-designer | S | ✅ |
| 16 | 武功攻击范围 | Phase 1 | Feature | game-designer | S | ✅ |
| 17 | 目标选择系统 | Phase 1 | Feature | ui-programmer | M | ✅ |
| 18 | 弟子系统 | Phase 2 | Feature | game-designer | M | ✅ |
| 19 | 武功学习系统 | Phase 2 | Feature | game-designer | M | ✅ |
| 20 | 境界突破系统 | Phase 2 | Feature | game-designer | M | ✅ |
| 21 | 弟子招募系统 | Phase 2 | Feature | game-designer | M | ✅ |
| 22 | 资源系统 | Alpha | Foundation | economy-designer | S | ✅ |
| 23 | 精力系统 | Alpha | Core | game-designer | M | ✅ |
| 24 | 门派设施系统 | Alpha | Feature | game-designer | M | ✅ |
| 25 | 装备系统 | Alpha | Feature | game-designer | M | 🔲 |
| 26 | 药品系统 | Alpha | Feature | game-designer | M | 🔲 |
| 27 | 合击技系统 | Alpha | Core | game-designer | S | 🔲 |
| 28 | 江湖地图系统 | Alpha | Foundation | level-designer | M | 🔲 |
| 29 | 门派势力系统 | Vertical Slice | Feature | world-builder | M | 🔲 |
| 30 | 江湖事件系统 | Vertical Slice | Polish | narrative-director | M | 🔲 |
| 31 | 音频系统 | Full Vision | Polish | audio-director | M | 🔲 |
| 32 | 存档系统 | Full Vision | Polish | gameplay-programmer | S | 🔲 |
| 33 | 成就系统 | Full Vision | Polish | game-designer | S | 🔲 |
| 34 | 多人对战网络 | Full Vision | Polish | network-programmer | L | 🔲 |

---

## Circular Dependencies

- **无循环依赖发现**

依赖图为单向 DAG（有向无环图），设计顺序清晰。

---

## High-Risk Systems

| System | Risk Type | Risk Description | Mitigation |
|--------|-----------|-----------------|------------|
| 角色系统 | Scope | 9个系统依赖它，改动影响范围大 | 保持接口稳定，变更需评审影响 |
| 战斗流程系统 | Design | 4个系统依赖，核心战斗循环 | 已实现并验证，Phase 1扩展已稳定 |
| 回合管理系统 | Design | 行动权切换逻辑，核心创新 | 已实现maxActions保护，防止无限循环 |
| 多人对战网络 | Technical | 状态同步、延迟补偿、反作弊 | 需技术预研，原型验证网络架构 |

---

## Progress Tracker

| Metric | Count |
|--------|-------|
| Total systems identified | 34 |
| MVP systems | 13 (全部完成 ✅) |
| Phase 1 systems | 4 (全部完成 ✅) |
| Phase 2 systems | 4 (全部完成 ✅) |
| Alpha systems | 7 (7设计完成 ✅, 0待开发 🔲) |
| Vertical Slice systems | 2 (2设计完成 ✅, 0待开发 🔲) |
| Full Vision systems | 4 (待开发 🔲) |
| Design docs reviewed | 4 |
| Design docs approved | 12 |

---

## Next Steps

- [x] MVP系统全部实现
- [x] Phase 1多人战斗系统实现
- [x] Phase 2弟子系统基础实现
- [x] 资源系统设计完成（Approved）
- [x] 精力系统设计完成（Approved）
- [x] 门派设施系统设计完成（Approved）
- [x] 武功学习系统设计完成（Approved）
- [x] 境界突破系统设计完成（Approved）
- [x] 装备系统设计完成（Approved）
- [x] 药品系统设计完成（Approved）
- [x] 江湖地图系统设计完成（Approved）
- [x] 门派势力系统设计完成（Approved）
- [x] 江湖事件系统设计完成（Approved）
- [ ] 运行 `/gate-check pre-production` 确认进入生产阶段