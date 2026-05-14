# Epic: 战斗系统

> **Layer**: Core + Feature
> **GDD**: design/gdd/battle-system.md
> **Architecture Module**: BattleManager
> **Status**: Complete
> **Stories**: All 14 stories completed

## Overview

战斗系统是武侠卡牌对战游戏的核心玩法系统，负责管理回合制卡牌对战的完整流程。系统采用**基于轻功的行动顺序**作为核心创新机制，结合武功招式、内功被动、距离系统等元素，构建策略深度。本 Epic 涵盖从 PixiJS/TypeScript 到 Godot 4.6/GDScript 的完整迁移实现。

## Governing ADRs

| ADR | Decision Summary | Engine Risk |
|-----|-----------------|-------------|
| ADR-001: Entity Class Design Pattern | 使用 `class_name` 定义 Character/BattleManager 类 | LOW |
| ADR-003: Event-Driven Architecture | 使用 Godot 信号系统替代 EventManager | LOW |
| ADR-004: Engine Migration to Godot | 引擎从 PixiJS 迁移到 Godot 4.6 | LOW |

## GDD Requirements

| ID | Requirement | ADR Coverage |
|----|-------------|--------------|
| BATTLE-001 | 回合流程管理（开始、行动、结束） | ADR-001 ✅ |
| BATTLE-002 | 轻功行动顺序系统 | ADR-001 ✅ |
| BATTLE-003 | 基础招式卡牌使用验证 | ADR-001 ✅ |
| BATTLE-004 | 武功招式使用验证（内力、手牌类型） | ADR-001 ✅ |
| BATTLE-005 | 内功触发时机（TURN_START/END, ON_DAMAGE 等） | ADR-003 ✅ |
| BATTLE-006 | 伤害计算与护盾系统 | ADR-001 ✅ |
| BATTLE-007 | 状态效果（DoT、Debuff） | ADR-001 ✅ |
| BATTLE-008 | 多人战斗距离系统 | ADR-001 ✅ |
| BATTLE-009 | 目标选择与攻击范围验证 | ADR-001 ✅ |
| BATTLE-010 | AI 决策逻辑 | ADR-001 ✅ |
| BATTLE-011 | 游戏结束条件判断 | ADR-001 ✅ |

## Subsystems

| 子系统 | Layer | 依赖系统 | 优先级 |
|--------|-------|----------|--------|
| 轻功行动顺序系统 | Core | 回合管理系统, 角色系统 | MVP |
| 战斗流程系统 | Core | 回合管理系统, 伤害计算系统 | MVP |
| AI系统 | Core | 卡牌系统, 武功招式系统, 伤害计算系统 | MVP |
| 多人战斗系统 | Feature | 战斗流程系统 | Phase 1 |
| 距离系统 | Feature | 多人战斗系统 | Phase 1 |
| 目标选择系统 | Feature | 距离系统, 武功攻击范围 | Phase 1 |

## Definition of Done

This epic is complete when:
- 所有 Stories 已实现、审查并通过 `/story-done` 关闭
- `design/gdd/battle-system.md` 中所有验收标准已验证通过
- 所有 Logic 和 Integration stories 有通过的测试文件在 `tests/` 目录
- 所有 Visual/Feel 和 UI stories 有证据文档并在 `production/qa/evidence/` 获得签字
- 1v1 战斗完整流程可执行
- 多人战斗（3v3）正常进行
- 轻功行动顺序正确计算
- 所有武功效果类型正常工作
- 所有内功触发时机正常触发

## Technical Notes

### Godot 迁移要点

1. **Character 类**: 继承 `RefCounted`，作为轻量级数据容器
2. **BattleManager 类**: 继承 `Node`，可添加到场景树，发射信号
3. **信号系统**: 替代原 EventManager，使用 Godot 内置信号
4. **类型注解**: 使用 GDScript 静态类型（`var x: int`）

### 关键文件

```
scripts/game/
├── character.gd       # 角色状态、内功触发
├── battle_manager.gd  # 战斗流程管理
├── ai.gd              # AI决策逻辑
└── distance_system.gd # 距离计算（多人战斗）
```

## Stories

| # | Story | Type | Status | ADR |
|---|-------|------|--------|-----|
| 001 | Character 类基础实现 | Logic | Done | ADR-001 |
| 002 | BattleManager 类基础实现 | Logic | Done | ADR-001 |
| 003 | 回合流程管理 | Logic | Done | ADR-001, ADR-003 |
| 004 | 轻功行动顺序系统 | Logic | Done | ADR-001 |
| 005 | 基础招式卡牌使用验证 | Logic | Done | ADR-001 |
| 006 | 武功招式使用验证 | Logic | Done | ADR-001 |
| 007 | 伤害计算与护盾系统 | Logic | Done | ADR-001 |
| 008 | 内功触发时机系统 | Integration | Done | ADR-003 |
| 009 | 状态效果系统（DoT/Debuff） | Logic | Done | ADR-001 |
| 010 | 游戏结束条件判断 | Logic | Done | ADR-001 |
| 011 | AI 决策逻辑 | Logic | Done | ADR-001 |
| 012 | 多人战斗距离系统 | Logic | Done | ADR-001 |
| 013 | 目标选择与攻击范围验证 | Logic | Done | ADR-001 |
| 014 | 战斗信号系统集成 | Integration | Done | ADR-003 |

## Next Step

All stories completed. Run `/team-qa sprint` for full QA cycle verification.
