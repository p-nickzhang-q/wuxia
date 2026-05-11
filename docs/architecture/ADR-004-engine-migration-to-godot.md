# ADR-004: Engine Migration from PixiJS to Godot

## Status

Accepted

## Date

2026-05-11

## Context

### Problem Statement

项目最初基于 PixiJS 8 + TypeScript 开发，已完成核心战斗系统（约 7,200 行代码）。开发者希望学习 Godot 游戏引擎，同时发现 PixiJS 作为渲染库需要大量自行实现游戏功能（场景管理、动画系统、音频、输入处理等），而 Godot 作为完整游戏引擎提供开箱即用的工具链。

### Constraints

- **学习目标**: 开发者主要动机是学习 Godot 引擎
- **时间成本**: 需要重写所有代码（TypeScript → GDScript）
- **功能对等**: 迁移后需保持原有游戏功能不变
- **数据保留**: 设计文档、角色/武功数据需复用

### Requirements

- 必须支持完整的回合制战斗系统
- 必须支持 24+ 角色和武功招式
- 必须支持跨平台导出（Windows/Linux/Mac）
- 必须复用现有 JSON 数据格式

## Decision

**将项目从 PixiJS + TypeScript 迁移到 Godot 4.6 + GDScript。**

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Godot 4.6 Engine                         │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │  Autoload   │  │   Scenes    │  │   Scripts/Game      │ │
│  │ GameManager │  │  main.tscn  │  │  character.gd       │ │
│  │             │  │  battle.tscn│  │  battle_manager.gd │ │
│  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Resources (JSON Data)                   │   │
│  │  characters.json │ skills.json │ cards.json          │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Key Interfaces

```gdscript
# GameManager (Autoload Singleton)
# 全局状态管理、场景切换、数据加载
class_name GameManager extends Node

enum GameState { MENU, CHARACTER_SELECT, BATTLE, RESULT }

var characters_data: Dictionary  # 从 JSON 加载
var skills_data: Dictionary
var cards_data: Dictionary

func change_state(new_state: GameState) -> void
func get_character_data(character_id: String) -> Dictionary

# Character
# 角色类 - 管理 HP/MP/护盾/轻功/卡组
class_name Character extends RefCounted

var id: String
var name: String
var current_hp: int
var current_mp: int
var shield: int
var current_agility: int
var hand: Array[String]

func draw_cards(count: int) -> Array[String]
func play_card(card_index: int) -> String
func take_damage(amount: int) -> int

# BattleManager
# 战斗管理器 - 回合流程、行动顺序、伤害处理
class_name BattleManager extends Node

signal turn_changed(current_actor: String)
signal damage_dealt(target: Character, amount: int)
signal battle_ended(winner: Character, loser: Character)

var player: Character
var enemy: Character
var current_turn: int
var current_actor: Character

func start_battle(player_data: Dictionary, enemy_data: Dictionary) -> void
func play_card(card_index: int) -> Dictionary
func end_turn() -> void
```

## Alternatives Considered

### Alternative 1: 继续 PixiJS 开发

- **Description**: 保持现有代码，继续用 PixiJS 实现功能
- **Pros**:
  - 无需重写代码
  - 已有 7,200 行可用代码
  - Web 发布更简单
- **Cons**:
  - 需要自行实现场景管理、动画、音频等系统
  - 无可视化编辑器
  - 无原生导出支持
  - 不符合学习 Godot 的目标
- **Rejection Reason**: 开发者明确希望学习 Godot，且 PixiJS 需要造太多轮子

### Alternative 2: Godot + C#

- **Description**: 使用 Godot 但选择 C# 作为脚本语言
- **Pros**:
  - TypeScript 开发者更容易上手
  - 更强的类型系统
  - 可复用部分 TypeScript 设计模式
- **Cons**:
  - 需要配置 .NET 环境
  - 社区资源以 GDScript 为主
  - 学习曲线更陡（同时学 Godot + C# 绑定）
- **Rejection Reason**: GDScript 更适合学习 Godot，社区资源丰富

### Alternative 3: 其他游戏引擎（Unity, Phaser）

- **Description**: 迁移到 Unity 或 Phaser
- **Pros**:
  - Unity: 成熟生态、强大功能
  - Phaser: Web 优先、JavaScript 友好
- **Cons**:
  - Unity: 许可费用、学习曲线陡
  - Phaser: 同样是库而非完整引擎
- **Rejection Reason**: 开发者明确选择 Godot，符合学习目标

## Consequences

### Positive

- ✅ **完整游戏引擎**: 场景管理、动画、音频、输入开箱即用
- ✅ **可视化编辑器**: 拖拽式 UI 设计，实时预览
- ✅ **原生导出**: 一键导出到 Windows/Linux/Mac/Mobile
- ✅ **学习目标达成**: 满足学习 Godot 的主要动机
- ✅ **性能优化**: Godot 底层 C++，比 PixiJS 更高效
- ✅ **社区资源**: GDScript 教程和资源丰富

### Negative

- ❌ **代码重写**: 全部 TypeScript 代码需转换为 GDScript
- ❌ **时间成本**: 估计 2-4 周全职工作完成迁移
- ❌ **Web 发布**: 不如 PixiJS 方便（需导出为 Web）
- ❌ **学习曲线**: 需要学习 Godot 节点系统和 GDScript

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 迁移过程中功能遗漏 | 中 | 高 | 对照原代码逐功能验证 |
| GDScript 语法不熟悉 | 中 | 中 | 参考 Godot 官方文档和教程 |
| 性能问题（WSL 环境） | 低 | 中 | 使用 Wayland 后端运行 Godot |
| 设计文档与代码不同步 | 低 | 中 | 更新 ADR-001 等架构文档 |

## Performance Implications

- **CPU**: Godot 底层 C++ 比 PixiJS JavaScript 更高效
- **Memory**: Godot 资源管理更严格，内存占用可控
- **Load Time**: JSON 数据加载方式相同，无明显差异
- **Network**: 无网络功能（本地单机）

## Migration Plan

### Phase 1: 项目初始化 ✅

1. 创建 Godot 项目结构
2. 配置 Autoload（GameManager）
3. 创建基础场景（main, character_select, battle, result）
4. 迁移 JSON 数据文件

### Phase 2: 核心系统迁移 ✅

1. 实现 Character 类
2. 实现 BattleManager 类
3. 实现场景脚本（main.gd, character_select.gd, battle.gd, result.gd）

### Phase 3: 功能验证 ⏳

1. 测试完整游戏流程
2. 实现 AI 系统
3. 验证战斗逻辑正确性

### Phase 4: 扩展功能 🔲

1. 音频系统
2. 存档系统
3. 门派经营场景

## Validation Criteria

- [ ] 主菜单 → 角色选择 → 战斗 → 结果 流程完整
- [ ] 战斗系统功能与 PixiJS 版本对等
- [ ] 24 个角色数据正确加载
- [ ] AI 能自动出牌
- [ ] 无严重 bug

## Related Decisions

- **Supersedes**: ADR-001（工厂函数模式 → class_name 类模式）
- **Related**: ADR-002（场景生命周期，仍适用）
- **Related**: ADR-003（事件驱动架构，对应 Godot 信号系统）
- **Related**: `technical-preferences.md`（已更新为 Godot 配置）

## References

- `project.godot` — Godot 项目配置
- `scripts/autoload/game_manager.gd` — 全局状态管理
- `scripts/game/character.gd` — 角色类
- `scripts/game/battle_manager.gd` — 战斗管理器
- `resources/` — JSON 数据文件
