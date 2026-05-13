# Story 007: 伤害计算与护盾系统

> **Epic**: 战斗系统
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-006` (伤害计算与护盾系统)

**ADR Governing Implementation**: ADR-001
**ADR Decision Summary**: Character 提供 take_damage 方法，BattleManager 计算伤害并应用。

**Engine**: Godot 4.6 | **Risk**: LOW

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [ ] 基础伤害计算：baseDamage * strengthMultiplier
- [ ] 力量加成公式：strengthMultiplier = 1 + (strength - 1) * 0.05
- [ ] 护盾吸收：伤害先扣除护盾，剩余伤害扣除 HP
- [ ] 无视护盾伤害：直接扣除 HP（ignoreShield=true）
- [ ] 伤害为 0 时不触发伤害相关内功
- [ ] 护盾不跨回合保留（reset_for_new_turn 清除）
- [ ] selfDamage 处理：自身伤害不触发内功
- [ ] 发射 damage_dealt 信号

---

## Implementation Notes

*Derived from GDD Section 4 Formulas:*

```gdscript
# Character.gd
func take_damage(amount: int, ignore_shield: bool = false) -> int:
    var actual_damage = amount
    
    if not ignore_shield and shield > 0:
        if shield >= actual_damage:
            shield -= actual_damage
            return 0  # 护盾完全吸收
        else:
            actual_damage -= shield
            shield = 0
    
    current_hp -= actual_damage
    if current_hp < 0:
        current_hp = 0
    
    return actual_damage

# BattleManager.gd
func _calculate_damage(base_damage: int, actor: Character) -> int:
    var strength = actor.strength  # 从角色数据获取
    var multiplier = 1.0 + (strength - 1) * 0.05
    return int(base_damage * multiplier)

func _apply_damage(target: Character, base_damage: int, actor: Character, ignore_shield: bool = false) -> int:
    var damage = _calculate_damage(base_damage, actor)
    var actual = target.take_damage(damage, ignore_shield)
    
    if actual > 0:
        emit_signal("damage_dealt", target, actual)
    
    return actual
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 008: 内功 ON_DAMAGE, ON_TAKE_DAMAGE 触发
- Story 009: DoT 伤害处理

---

## QA Test Cases

**AC-1**: 力量加成计算
- Given: base_damage=10, strength=5
- When: _calculate_damage(10, actor)
- Then: damage = 10 * (1 + (5-1)*0.05) = 10 * 1.2 = 12
- Edge cases: strength=1 → multiplier=1.0, strength=10 → multiplier=1.45

**AC-2**: 护盾吸收全部伤害
- Given: target.shield=5, damage=3
- When: take_damage(3)
- Then: shield=2, current_hp 不变, 返回 0
- Edge cases: 无

**AC-3**: 护盾部分吸收
- Given: target.shield=3, damage=5
- When: take_damage(5)
- Then: shield=0, current_hp 减少 2, 返回 2
- Edge cases: 无

**AC-4**: 无视护盾伤害
- Given: target.shield=10, damage=5, ignore_shield=true
- When: take_damage(5, true)
- Then: shield=10（不变），current_hp 减少 5
- Edge cases: 无

**AC-5**: 伤害为 0 不触发信号
- Given: damage=0
- When: _apply_damage(...)
- Then: 不发射 damage_dealt 信号
- Edge cases: 护盾完全吸收时也不触发

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/character_test.gd` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 001 (Character), Story 002 (BattleManager)
- Unlocks: Story 005 (卡牌效果), Story 006 (武功效果), Story 008 (内功触发), Story 009 (状态效果)