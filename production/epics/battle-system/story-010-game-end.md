# Story 010: 游戏结束条件判断

> **Epic**: 战斗系统
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-011` (游戏结束条件判断)

**ADR Governing Implementation**: ADR-001
**ADR Decision Summary**: BattleManager 检测游戏结束条件，发射 battle_ended 信号。

**Engine**: Godot 4.6 | **Risk**: LOW

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [ ] 玩家队伍全灭 → 玩家失败
- [ ] 敌方队伍全灭 → 玩家胜利
- [ ] 双方同时全灭 → 平局
- [ ] check_game_end() 在每次伤害后、回合结束时调用
- [ ] end_game() 发射 battle_ended 信号，设置游戏状态为 GAME_OVER
- [ ] 游戏结束后禁止任何行动

---

## Implementation Notes

*Derived from GDD Section 3.7 游戏结束条件:*

```gdscript
# BattleManager.gd
enum GamePhase { SETUP, SELECTING, ACTING, GAME_OVER }
var current_phase: GamePhase = GamePhase.SETUP

func check_game_end() -> bool:
    var player_alive = not player.is_dead()
    var enemy_alive = not enemy.is_dead()
    
    if not player_alive and not enemy_alive:
        end_game(null, null)  # 平局
        return true
    elif not player_alive:
        end_game(enemy, player)
        return true
    elif not enemy_alive:
        end_game(player, enemy)
        return true
    
    return false

func end_game(winner: Character, loser: Character) -> void:
    current_phase = GamePhase.GAME_OVER
    emit_signal("battle_ended", winner, loser)

func is_game_over() -> bool:
    return current_phase == GamePhase.GAME_OVER
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 012: 多人战斗的队伍存活判断
- Story 014: UI 层响应 battle_ended 信号

---

## QA Test Cases

**AC-1**: 玩家胜利
- Given: player.hp=5, enemy.hp=0
- When: check_game_end()
- Then: 返回 true, end_game(player, enemy), 发射 battle_ended(player, enemy)
- Edge cases: 无

**AC-2**: 玩家失败
- Given: player.hp=0, enemy.hp=5
- When: check_game_end()
- Then: 返回 true, end_game(enemy, player)
- Edge cases: 无

**AC-3**: 平局
- Given: player.hp=0, enemy.hp=0
- When: check_game_end()
- Then: 返回 true, end_game(null, null)
- Edge cases: 无

**AC-4**: 游戏结束后禁止行动
- Given: current_phase=GAME_OVER
- When: use_basic_card(...)
- Then: 返回 {"success": false, "message": "游戏已结束"}
- Edge cases: 无

**AC-5**: 伤害后检查游戏结束
- Given: enemy.hp=3, damage=5
- When: _apply_damage(enemy, 5, ...)
- Then: enemy.hp=0, check_game_end() 被调用, 游戏结束
- Edge cases: 无

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/battle_manager_test.gd` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003 (回合流程)
- Unlocks: Story 012 (多人战斗), Story 014 (信号集成)