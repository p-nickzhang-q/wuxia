# Story 011: AI 决策逻辑

> **Epic**: 战斗系统
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-010` (AI 决策逻辑)

**ADR Governing Implementation**: ADR-001
**ADR Decision Summary**: AI 类继承 RefCounted，提供决策方法供 BattleManager 调用。

**Engine**: Godot 4.6 | **Risk**: LOW

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [ ] AI 类定义完成，包含 execute_turn, decide_action, select_best_target 方法
- [ ] execute_turn(battle_manager) 方法：执行完整回合
- [ ] decide_action(battle_manager) 方法：选择最优行动（武功优先、防御次之、攻击最后）
- [ ] try_use_skill(battle_manager) 方法：尝试使用武功招式
- [ ] should_defend(battle_manager) 方法：判断是否需要防御（HP 低、无攻击牌）
- [ ] select_defend_card(battle_manager) 方法：选择防御卡牌
- [ ] select_attack_card(battle_manager) 方法：选择攻击卡牌
- [ ] select_best_target(battle_manager) 方法：选择最优目标（HP 最低、距离最近）

---

## Implementation Notes

*Derived from GDD Appendix C:*

```gdscript
class_name AI
extends RefCounted

func execute_turn(battle_manager: BattleManager) -> void:
    while battle_manager.current_actor == battle_manager.enemy and not battle_manager.is_game_over():
        var action = decide_action(battle_manager)
        
        if action.type == "skill":
            battle_manager.use_skill(action.skill_id, action.card_index, action.target_id)
        elif action.type == "card":
            battle_manager.use_basic_card(action.card_index, action.target_id)
        elif action.type == "end_turn":
            battle_manager.end_turn()
            break

func decide_action(battle_manager: BattleManager) -> Dictionary:
    # 优先尝试武功
    var skill_action = try_use_skill(battle_manager)
    if skill_action.success:
        return skill_action
    
    # 判断是否防御
    if should_defend(battle_manager):
        var defend_card = select_defend_card(battle_manager)
        if defend_card.index >= 0:
            return {"type": "card", "card_index": defend_card.index, "target_id": battle_manager.enemy.id}
    
    # 选择攻击卡牌
    var attack_card = select_attack_card(battle_manager)
    if attack_card.index >= 0:
        var target = select_best_target(battle_manager)
        return {"type": "card", "card_index": attack_card.index, "target_id": target.id}
    
    # 无法行动，回合结束
    return {"type": "end_turn"}

func select_best_target(battle_manager: BattleManager) -> Character:
    # 选择 HP 最低的敌方目标
    var targets = [battle_manager.player]  # 多人战斗时扩展
    targets.sort_custom(func(a, b): return a.current_hp < b.current_hp)
    return targets[0]
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 012: 多人战斗的目标选择逻辑
- Story 013: 距离验证

---

## QA Test Cases

**AC-1**: AI 优先使用武功
- Given: enemy 有可用武功（内力足够、手牌匹配）
- When: decide_action()
- Then: 返回 {"type": "skill", ...}
- Edge cases: 无可用武功时跳过

**AC-2**: AI 低 HP 时防御
- Given: enemy.hp=3, enemy.max_hp=20, hand 有护盾卡牌
- When: should_defend() → true
- Then: 选择护盾卡牌
- Edge cases: 无护盾卡牌时选择攻击

**AC-3**: AI 选择 HP 最低目标
- Given: player.hp=10, enemy2.hp=5（多人战斗）
- When: select_best_target()
- Then: 返回 enemy2
- Edge cases: 1v1 时返回 player

**AC-4**: AI 无法行动时结束回合
- Given: enemy.hand=[], enemy.agility=0
- When: decide_action()
- Then: 返回 {"type": "end_turn"}
- Edge cases: 无

**AC-5**: execute_turn 完整执行
- Given: battle_manager.current_actor=enemy
- When: execute_turn(battle_manager)
- Then: AI 执行多次行动直到回合结束或切换行动方
- Edge cases: 游戏结束时停止

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/ai_test.gd` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 006 (武功验证), Story 007 (伤害计算)
- Unlocks: None (AI 系统独立)