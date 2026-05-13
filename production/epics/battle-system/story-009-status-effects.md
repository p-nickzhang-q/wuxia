# Story 009: 状态效果系统（DoT/Debuff）

> **Epic**: 战斗系统
> **Status**: Done
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-007` (状态效果)

**ADR Governing Implementation**: ADR-001
**ADR Decision Summary**: Character 管理 dots 和 debuffs 数组，回合开始时处理效果。

**Engine**: Godot 4.6 | **Risk**: LOW

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [x] DoT（持续伤害）：每回合开始时扣除 HP，duration 递减
- [x] DebuffAgility：降低轻功，回合开始时应用，duration 递减
- [x] DisableCardType：禁用特定类型卡牌，duration 递减
- [x] 效果到期后自动移除
- [x] reset_for_new_turn 处理所有状态效果
- [x] 武功招式可添加状态效果（dot, debuffAgility, disableCardType）

---

## Implementation Notes

*Derived from GDD Section 3.4 效果类型:*

```gdscript
# Character.gd
var dots: Array[Dictionary] = []  # [{value: int, duration: int}]
var debuffs: Array[Dictionary] = []  # [{type: String, value: int, duration: int}]

func apply_dot(value: int, duration: int) -> void:
    dots.append({"value": value, "duration": duration})

func apply_debuff(debuff_type: String, value: int, duration: int) -> void:
    debuffs.append({"type": debuff_type, "value": value, "duration": duration})

func process_effects_for_new_turn() -> void:
    # 处理 DoT
    for dot in dots:
        take_damage(dot.value)
        dot.duration -= 1
    
    dots = dots.filter(func(d): return d.duration > 0)
    
    # 处理 Debuff
    for debuff in debuffs:
        if debuff.type == "agility":
            current_agility -= debuff.value
        debuff.duration -= 1
    
    debuffs = debuffs.filter(func(d): return d.duration > 0)

func is_card_type_disabled(card_type: String) -> bool:
    for debuff in debuffs:
        if debuff.type == "disable_" + card_type:
            return true
    return false
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 006: 武功招式添加状态效果的调用点

---

## QA Test Cases

**AC-1**: DoT 每回合扣血
- Given: dots=[{value:3, duration:2}], current_hp=10
- When: process_effects_for_new_turn()
- Then: current_hp=7, dots=[{value:3, duration:1}]
- Edge cases: DoT 伤害可触发 ON_TAKE_DAMAGE 内功

**AC-2**: DoT 到期移除
- Given: dots=[{value:3, duration:1}]
- When: process_effects_for_new_turn()
- Then: current_hp 减少 3, dots=[] (duration=0 后移除)
- Edge cases: 无

**AC-3**: DebuffAgility 降低轻功
- Given: debuffs=[{type:"agility", value:2, duration:1}], base_agility=8
- When: reset_for_new_turn() → process_effects_for_new_turn()
- Then: current_agility=8-2=6, debuffs=[] (到期移除)
- Edge cases: 轻功降到 0 以下时 capped 为 0

**AC-4**: DisableCardType 禁用卡牌
- Given: debuffs=[{type:"disable_fist", duration:2}], hand=["fist_card"]
- When: is_card_type_disabled("fist")
- Then: 返回 true
- Edge cases: duration 递减后解除禁用

**AC-5**: 多状态效果同时处理
- Given: dots=[{value:3, duration:1}], debuffs=[{type:"agility", value:2, duration:2}]
- When: process_effects_for_new_turn()
- Then: DoT 扣血，Debuff 降低轻功，两者 duration 都递减
- Edge cases: 无

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/character_test.gd` — must exist and pass
**Status**: [x] Created at `tests/unit/status_effects_test.gd` — 18 tests passing

---

## Dependencies

- Depends on: Story 007 (伤害计算)
- Unlocks: Story 006 (武功效果添加状态)