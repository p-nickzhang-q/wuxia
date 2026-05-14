# Story 014: 战斗信号系统集成

> **Epic**: 战斗系统
> **Status**: Done
> **Layer**: Core
> **Type**: Integration
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-001, BATTLE-005` (信号系统集成)

**ADR Governing Implementation**: ADR-003: Event-Driven Architecture
**ADR Decision Summary**: 使用 Godot 信号系统替代 EventManager，BattleManager 发射信号，UI 层订阅。

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: 信号连接使用 `connect()` 方法，支持自动断开

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [x] BattleManager 信号完整声明：turn_changed, damage_dealt, battle_ended, card_played, skill_used, hp_changed, shield_changed
- [x] 信号在正确时机发射
- [x] battle.tscn 场景订阅所有必要信号
- [x] 信号参数类型正确（Character, int, String 等）
- [x] 场景退出时断开信号连接（防止内存泄漏）
- [x] 信号驱动 UI 更新（HP 条、护盾显示、战斗日志）

---

## Implementation Notes

*Derived from ADR-003:*

```gdscript
# BattleManager.gd - 信号声明
signal turn_changed(current_actor: Character)
signal damage_dealt(target: Character, amount: int)
signal battle_ended(winner: Character, loser: Character)
signal card_played(actor: Character, card_id: String)
signal skill_used(actor: Character, skill_id: String)
signal hp_changed(character: Character, old_value: int, new_value: int)
signal shield_changed(character: Character, old_value: int, new_value: int)

# battle.gd - 场景脚本订阅信号
extends Node

var battle_manager: BattleManager

func _ready() -> void:
    battle_manager = get_node("BattleManager")
    
    # 连接信号
    battle_manager.turn_changed.connect(_on_turn_changed)
    battle_manager.damage_dealt.connect(_on_damage_dealt)
    battle_manager.battle_ended.connect(_on_battle_ended)
    battle_manager.card_played.connect(_on_card_played)
    battle_manager.skill_used.connect(_on_skill_used)
    battle_manager.hp_changed.connect(_on_hp_changed)
    battle_manager.shield_changed.connect(_on_shield_changed)

func _exit_tree() -> void:
    # 断开信号连接
    if battle_manager:
        battle_manager.turn_changed.disconnect(_on_turn_changed)
        battle_manager.damage_dealt.disconnect(_on_damage_dealt)
        battle_manager.battle_ended.disconnect(_on_battle_ended)
        battle_manager.card_played.disconnect(_on_card_played)
        battle_manager.skill_used.disconnect(_on_skill_used)
        battle_manager.hp_changed.disconnect(_on_hp_changed)
        battle_manager.shield_changed.disconnect(_on_shield_changed)

func _on_turn_changed(current_actor: Character) -> void:
    # 更新行动方指示器
    pass

func _on_damage_dealt(target: Character, amount: int) -> void:
    # 显示伤害动画、更新 HP 条
    pass

func _on_battle_ended(winner: Character, loser: Character) -> void:
    # 切换到结果场景
    pass
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 003: 回合流程发射信号
- Story 007: 伤害计算发射信号
- UI 层具体实现（非战斗系统 Epic）

---

## QA Test Cases

**AC-1**: turn_changed 信号发射
- Given: start_new_turn() 或 switch_actor()
- When: 当前行动方改变
- Then: 发射 turn_changed(current_actor)
- Edge cases: 无

**AC-2**: damage_dealt 信号发射
- Given: _apply_damage() 造成伤害
- When: 实际伤害 > 0
- Then: 发射 damage_dealt(target, amount)
- Edge cases: 伤害=0 不发射

**AC-3**: battle_ended 信号发射
- Given: check_game_end() 检测游戏结束
- When: 一方全灭
- Then: 发射 battle_ended(winner, loser)
- Edge cases: 平局时 winner=null, loser=null

**AC-4**: 信号连接正确
- Given: battle.tscn 场景加载
- When: _ready()
- Then: 所有信号已连接，回调函数可接收信号
- Edge cases: 无

**AC-5**: 信号断开防止内存泄漏
- Given: battle.tscn 场景退出
- When: _exit_tree()
- Then: 所有信号已断开
- Edge cases: 场景重新加载时重新连接

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/signal_integration_test.gd` — must exist and pass
**Status**: [x] Created at `tests/integration/signal_integration_test.gd` — 11 tests passing

---

## Dependencies

- Depends on: Story 003 (回合流程), Story 007 (伤害计算)
- Unlocks: None（UI 层集成）