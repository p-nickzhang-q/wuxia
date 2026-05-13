# Story 002: BattleManager 类基础实现

> **Epic**: 战斗系统
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-001` (回合流程管理)

**ADR Governing Implementation**: ADR-001: Entity Class Design Pattern
**ADR Decision Summary**: 使用 `class_name` 定义 BattleManager 类，继承 Node，可添加到场景树，发射信号。

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: 继承 Node 以支持信号发射和场景树管理

**Control Manifest Rules (this layer)**:
- Required: 使用 `class_name BattleManager extends Node`
- Forbidden: 不继承 RefCounted（需要信号功能）
- Guardrail: 无性能限制

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [ ] BattleManager 类定义完成，继承 Node
- [ ] 信号声明：turn_changed, damage_dealt, battle_ended, card_played, skill_used
- [ ] 状态属性：player, enemy, current_turn, current_actor, turn_order
- [ ] start_battle(player_data, enemy_data) 方法：初始化双方角色
- [ ] get_current_actor() 方法：返回当前行动角色
- [ ] get_turn_order() 方法：返回按轻功排序的角色列表
- [ ] 基础场景集成：可添加到 battle.tscn 场景

---

## Implementation Notes

*Derived from ADR-001 Implementation Guidelines:*

```gdscript
class_name BattleManager
extends Node

# 信号声明
signal turn_changed(current_actor: Character)
signal damage_dealt(target: Character, amount: int)
signal battle_ended(winner: Character, loser: Character)
signal card_played(actor: Character, card_id: String)
signal skill_used(actor: Character, skill_id: String)

# 状态
var player: Character
var enemy: Character
var current_turn: int = 0
var current_actor: Character
var turn_order: Array[Character] = []

# 初始化战斗
func start_battle(player_data: Dictionary, enemy_data: Dictionary) -> void:
    player = Character.new(player_data)
    enemy = Character.new(enemy_data)
    current_turn = 1
    _decide_turn_order()
    current_actor = turn_order[0]
    emit_signal("turn_changed", current_actor)
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: 回合流程完整逻辑（start_new_turn, end_turn）
- Story 004: 轻功行动顺序切换（switch_actor）
- Story 005: 卡牌使用验证和效果

---

## QA Test Cases

**AC-1**: BattleManager 信号声明
- Given: BattleManager 实例
- When: 检查信号列表
- Then: 存在 turn_changed, damage_dealt, battle_ended, card_played, skill_used 信号
- Edge cases: 无

**AC-2**: start_battle 初始化角色
- Given: player_data={"id":"hero"}, enemy_data={"id":"enemy"}
- When: start_battle(player_data, enemy_data)
- Then: player.id="hero", enemy.id="enemy", current_turn=1
- Edge cases: 空数据字典

**AC-3**: get_turn_order 按轻功排序
- Given: player.agility=8, enemy.agility=5
- When: get_turn_order()
- Then: 返回 [player, enemy]（降序）
- Edge cases: 轻功相同时按座位顺序

**AC-4**: 场景集成
- Given: battle.tscn 场景
- When: 添加 BattleManager 作为子节点
- Then: BattleManager 在场景树中正常工作
- Edge cases: 无

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/battle_manager_test.gd` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 (Character 类)
- Unlocks: Story 003 (回合流程), Story 007 (伤害计算), Story 008 (内功触发)