# ADR-001: Entity Class Design Pattern

## Status

Superseded by ADR-004

## Date

- **Original**: 2026-04-01 (PixiJS/TypeScript)
- **Updated**: 2026-05-11 (Godot/GDScript)

## Context

### Problem Statement

游戏核心实体（Character, BattleManager）需要创建和管理状态。需要选择合适的设计模式来组织代码结构。

### Historical Context (PixiJS)

在 PixiJS + TypeScript 时期，采用工厂函数模式创建游戏实体，使用闭包封装私有状态。

### Current Context (Godot)

迁移到 Godot 4.6 后，GDScript 提供了 `class_name` 关键字来定义全局可访问的类，配合 `extends` 实现继承。Godot 的节点系统天然支持类继承，工厂函数模式不再适用。

### Constraints

- **Godot 约定**: GDScript 推荐使用 `class_name` 定义类
- **类型系统**: GDScript 支持静态类型，类定义提供更好的类型提示
- **节点继承**: BattleManager 继承 Node，Character 继承 RefCounted
- **全局访问**: `class_name` 使类在全局可用，无需手动导入

### Requirements

- 必须支持 Godot 节点继承体系
- 必须提供清晰的类型定义
- 必须支持信号（signal）声明
- 必须与其他 Godot 资源兼容

## Decision

**在 Godot 项目中采用 `class_name` 类模式定义游戏实体。**

### Architecture

```
┌─────────────────────────────────────────────────┐
│                 Godot Class Hierarchy            │
├─────────────────────────────────────────────────┤
│                                                  │
│   RefCounted (Godot 内置)                        │
│       └── Character (class_name)                 │
│           - 数据容器，不依赖节点                   │
│           - HP/MP/护盾/轻功/卡组                   │
│                                                  │
│   Node (Godot 内置)                              │
│       └── BattleManager (class_name)             │
│           - 可添加到场景树                        │
│           - 发射信号（turn_changed 等）           │
│           - 管理战斗流程                          │
│                                                  │
└─────────────────────────────────────────────────┘
```

### Key Interfaces

```gdscript
# Character - 继承 RefCounted（轻量级数据类）
class_name Character
extends RefCounted

# 基础属性
var id: String
var name: String
var max_hp: int
var current_hp: int
var shield: int = 0
var current_agility: int

# 卡组
var deck: Array[String] = []
var hand: Array[String] = []

# 构造函数
func _init(data: Dictionary) -> void:
    id = data.get("id", "")
    name = data.get("name", "")
    ...

# 方法
func draw_cards(count: int) -> Array[String]
func play_card(card_index: int) -> String
func take_damage(amount: int) -> int
func is_dead() -> bool


# BattleManager - 继承 Node（可添加到场景）
class_name BattleManager
extends Node

# 信号声明
signal turn_changed(current_actor: String)
signal damage_dealt(target: Character, amount: int)
signal battle_ended(winner: Character, loser: Character)

# 状态
var player: Character
var enemy: Character
var current_turn: int = 0
var current_actor: Character

# 方法
func start_battle(player_data: Dictionary, enemy_data: Dictionary) -> void
func play_card(card_index: int) -> Dictionary
func end_turn() -> void
```

## Alternatives Considered

### Alternative 1: 保持工厂函数模式

- **Description**: 在 GDScript 中模拟工厂函数，返回字典或对象
- **Pros**: 与原 TypeScript 代码风格一致
- **Cons**:
  - 无法使用 `class_name`，类型提示弱
  - 无法继承 Node，无法发射信号
  - 不符合 Godot 约定
- **Rejection Reason**: Godot 节点系统依赖类继承，工厂函数不兼容

### Alternative 2: 纯节点脚本（无 class_name）

- **Description**: 每个脚本直接附加到节点，不使用 `class_name`
- **Pros**: 简单直接
- **Cons**:
  - 类型无法全局访问
  - 无法在其他脚本中直接引用类型
  - 无法创建独立实例（不附加节点）
- **Rejection Reason**: 需要全局类型访问，`class_name` 提供更好的代码组织

### Alternative 3: C# 类模式

- **Description**: 使用 Godot C# 绑定，保持类风格
- **Pros**: TypeScript 开发者熟悉，类型系统更强
- **Cons**: 需配置 .NET，社区资源少
- **Rejection Reason**: 选择 GDScript（见 ADR-004）

## Consequences

### Positive

- ✅ **类型全局可用**: `class_name` 使 Character/BattleManager 全局可访问
- ✅ **信号支持**: BattleManager 可发射信号，符合 Godot 事件驱动模式
- ✅ **节点兼容**: BattleManager 可添加到场景树，与其他节点交互
- ✅ **静态类型**: GDScript 类型提示提供更好的 IDE 支持
- ✅ **Godot 约定**: 符合官方推荐的最佳实践

### Negative

- ❌ **与原代码风格不同**: 工厂函数 → 类继承
- ❌ **需要学习 GDScript**: TypeScript 开发者需适应新语法
- ❌ **RefCounted 限制**: Character 不能直接发射信号（需通过 BattleManager）

### Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| 类继承层次复杂化 | 低 | 中 | 保持简单继承（RefCounted/Node） |
| GDScript 类型系统限制 | 低 | 低 | 使用 Array[String] 等类型注解 |

## Performance Implications

- **CPU**: 类实例化开销与工厂函数相当
- **Memory**: RefCounted 自动管理内存，无手动释放
- **Load Time**: `class_name` 在启动时注册，开销极小

## Migration Plan

已完成迁移：

| 原 TypeScript | 新 GDScript | 状态 |
|---------------|-------------|------|
| `createCharacter()` 工厂函数 | `class_name Character extends RefCounted` | ✅ 完成 |
| `createGame()` 工厂函数 | `class_name BattleManager extends Node` | ✅ 完成 |
| `createDisciple()` 工厂函数 | 待实现 | 🔲 待开发 |

## Validation Criteria

- [x] Character 类可通过 `class_name` 全局访问
- [x] BattleManager 可发射信号
- [x] BattleManager 可添加到场景树（`add_child(battle_manager)`）
- [x] 类型提示在 IDE 中正常工作

## Related Decisions

- **Superseded by**: ADR-004（引擎迁移决策）
- **Related**: ADR-003（事件驱动架构 → Godot 信号系统）
- **References**: `scripts/game/character.gd`, `scripts/game/battle_manager.gd`

## Historical Reference (Original ADR)

以下为原 PixiJS 时期的工厂函数模式记录，供参考：

---

### Original Decision (PixiJS/TypeScript)

采用工厂函数模式创建核心游戏实体：

- `createGame()` — 游戏状态管理工厂函数
- `createCharacter()` — 角色实体工厂函数
- `createDisciple()` — 弟子实体工厂函数

不使用ES6类，而是使用闭包封装私有状态，返回公共接口对象。

### Original Rationale

1. **简洁性** — 工厂函数比类更简洁，无需构造函数语法
2. **封装性** — 闭包自动封装私有变量，无需`private`修饰符
3. **灵活性** — 易于组合多个工厂函数，构建复杂对象
4. **测试性** — 工厂函数返回的对象易于mock和测试
5. **PixiJS兼容** — PixiJS容器使用类继承，游戏逻辑层保持独立风格

### Original Implementation

```typescript
// src/game/Character.ts
export function createCharacter(config: CharacterConfig): Character {
  let hp = config.hp
  let mp = config.mp
  let agility = config.agility

  return {
    id: config.id,
    name: config.name,
    get hp() { return hp },
    takeDamage: (amount) => { hp -= amount },
    // ...
  }
}
```

---

*This ADR was updated to reflect the Godot migration. Original content preserved for historical reference.*