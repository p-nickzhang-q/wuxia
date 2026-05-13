# Story 004: 轻功行动顺序系统

> **Epic**: 战斗系统
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-002` (轻功行动顺序系统)

**ADR Governing Implementation**: ADR-001
**ADR Decision Summary**: Character 包含 agility 属性，BattleManager 管理行动顺序。

**Engine**: Godot 4.6 | **Risk**: LOW

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [ ] _decide_turn_order() 方法：按当前轻功降序排列存活角色
- [ ] should_switch_actor() 方法：判断当前轻功 ≤ 敌方最高轻功时切换
- [ ] switch_actor() 方法：切换到下一个轻功最高的存活角色
- [ ] 行动消耗：使用卡牌/招式扣除 agility（agilityCost）
- [ ] 回合结束条件：所有角色轻功耗尽或无法行动
- [ ] 轻功相同时按座位顺序行动

---

## Implementation Notes

*Derived from GDD Section 3.3 行动顺序规则:*

```gdscript
func _decide_turn_order() -> void:
    turn_order.clear()
    var all_characters = [player, enemy]  # 多人战斗时扩展
    
    # 按轻功降序排序
    all_characters.sort_custom(func(a, b): return a.current_agility > b.current_agility)
    
    # 只保留存活角色
    for c in all_characters:
        if not c.is_dead():
            turn_order.append(c)

func should_switch_actor() -> bool:
    if current_actor == null:
        return false
    
    # 获取敌方最高轻功
    var enemy_max_agility = 0
    for c in turn_order:
        if _is_enemy(c, current_actor) and c.current_agility > enemy_max_agility:
            enemy_max_agility = c.current_agility
    
    return current_actor.current_agility <= enemy_max_agility

func switch_actor() -> void:
    # 找下一个轻功最高的存活角色
    var next_actor: Character = null
    var max_agility = -1
    
    for c in turn_order:
        if c != current_actor and not c.is_dead() and c.current_agility > max_agility:
            max_agility = c.current_agility
            next_actor = c
    
    if next_actor != null:
        current_actor = next_actor
        emit_signal("turn_changed", current_actor)
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: 卡牌使用扣除轻功的具体实现
- Story 012: 多人战斗的敌方判断逻辑

---

## QA Test Cases

**AC-1**: _decide_turn_order 按轻功排序
- Given: player.agility=8, enemy.agility=5
- When: _decide_turn_order()
- Then: turn_order = [player, enemy]
- Edge cases: 轻功相同，player 先（座位顺序）

**AC-2**: should_switch_actor 判断切换
- Given: current_actor=player, player.agility=3, enemy.agility=5
- When: should_switch_actor()
- Then: 返回 true（player.agility <= enemy.agility）
- Edge cases: player.agility=5, enemy.agility=5 → true（相等也切换）

**AC-3**: switch_actor 切换到敌方
- Given: current_actor=player, player.agility=3, enemy.agility=5
- When: switch_actor()
- Then: current_actor=enemy, 发射 turn_changed 信号
- Edge cases: 只有一个存活角色时不切换

**AC-4**: 轻功消耗后判断
- Given: player.agility=8, 使用 agilityCost=4 的卡牌
- When: 卡牌使用后 player.agility=4, enemy.agility=5
- Then: should_switch_actor() 返回 true
- Edge cases: 无

**AC-5**: 回合结束条件
- Given: 所有角色 agility=0
- When: should_switch_actor() 且无可用行动
- Then: 回合结束，调用 end_turn()
- Edge cases: 有角色存活但无法行动（手牌空）

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/battle_manager_test.gd` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 003 (回合流程)
- Unlocks: Story 005 (卡牌使用), Story 006 (武功招式)