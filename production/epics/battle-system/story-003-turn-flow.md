# Story 003: 回合流程管理

> **Epic**: 战斗系统
> **Status**: Done
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-001` (回合流程管理)

**ADR Governing Implementation**: ADR-001, ADR-003
**ADR Decision Summary**: BattleManager 管理回合流程，使用信号通知 UI 层状态变化。

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: 信号替代 EventManager

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [x] start_new_turn() 方法：重置角色状态、触发 TURN_START 内功、抽牌、决定行动顺序
- [x] 抽牌逻辑：每个存活角色抽牌（DEFAULT_DRAW_COUNT = 5）
- [x] check_game_end() 方法：检查是否有一方全灭（is_battle_over()）
- [x] end_turn() 方法：触发 TURN_END 内功、检查游戏结束、开始新回合
- [x] 回合流程：SETUP → SELECTING → GAME_OVER
- [x] 游戏结束调用 _end_game()，发射 game_ended 信号

---

## Implementation Notes

*Derived from GDD Section 3.2 回合流程:*

```gdscript
func start_new_turn() -> void:
    current_turn += 1
    
    # 重置所有角色状态
    for character in [player, enemy]:
        if not character.is_dead():
            character.reset_for_new_turn()
            character.draw_cards(2)
    
    # 触发回合开始内功 (Story 008)
    _trigger_turn_start_passives()
    
    # 检查游戏结束
    if check_game_end():
        return
    
    # 决定行动顺序
    _decide_turn_order()
    current_actor = turn_order[0]
    emit_signal("turn_changed", current_actor)

func check_game_end() -> bool:
    var player_alive = not player.is_dead()
    var enemy_alive = not enemy.is_dead()
    
    if not player_alive and not enemy_alive:
        # 平局处理
        end_game(null, null)
        return true
    elif not player_alive:
        end_game(enemy, player)
        return true
    elif not enemy_alive:
        end_game(player, enemy)
        return true
    
    return false

func end_turn() -> void:
    # 触发回合结束内功 (Story 008)
    _trigger_turn_end_passives()
    
    if not check_game_end():
        start_new_turn()
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 004: 行动切换逻辑（switch_actor, should_switch_actor）
- Story 005: 卡牌使用
- Story 008: 内功触发具体实现

---

## QA Test Cases

**AC-1**: start_new_turn 重置状态并抽牌
- Given: player.hand=[], player.deck=["c1","c2","c3"], current_turn=1
- When: start_new_turn()
- Then: current_turn=2, player.hand 有 2 张牌, player.shield=0, player.agility 重置
- Edge cases: 牌组不足 2 张时洗入弃牌堆

**AC-2**: check_game_end 检测胜利
- Given: player.hp=10, enemy.hp=0
- When: check_game_end()
- Then: 返回 true, 发射 battle_ended(player, enemy)
- Edge cases: 双方同时死亡（平局）

**AC-3**: end_turn 开始新回合
- Given: current_turn=1, 双方存活
- When: end_turn()
- Then: current_turn=2, 触发 TURN_END 内功, 开始新回合
- Edge cases: 游戏结束时不再开始新回合

**AC-4**: 抽牌上限
- Given: player.hand 已有 6 张牌
- When: start_new_turn() 抽 2 张牌
- Then: player.hand 保持 7 张（上限），多余牌不抽
- Edge cases: hand 满时跳过抽牌

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/turn_flow_test.gd` — must exist and pass
**Status**: [x] Created

### Implementation Notes

**Existing Implementation**: `scripts/game/game_state.gd`

现有实现已完整包含所有回合流程功能：

- `start_new_turn()` (第96-127行): 重置轻功、触发内功、抽牌、确定先手
- `end_turn()` (第131-148行): 触发内功、处理 DoT、检查游戏结束、开始新回合
- `is_battle_over()` (第327-328行): 检查双方存活状态
- `_end_game()` (第561-577行): 设置 GAME_OVER 状态、发射 game_ended 信号

---

## Dependencies

- Depends on: Story 001 (Character), Story 002 (BattleManager)
- Unlocks: Story 004 (行动顺序), Story 010 (游戏结束), Story 014 (信号集成)