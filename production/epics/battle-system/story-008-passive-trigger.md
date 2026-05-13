# Story 008: 内功触发时机系统

> **Epic**: 战斗系统
> **Status**: Done
> **Layer**: Core
> **Type**: Integration
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-005` (内功触发时机)

**ADR Governing Implementation**: ADR-003: Event-Driven Architecture
**ADR Decision Summary**: 使用 Godot 信号系统触发内功被动效果，替代原 EventManager。

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: 内功触发时机通过信号或直接调用实现

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [x] TURN_START 触发：回合开始，重置状态后
- [x] TURN_END 触发：回合结束
- [x] ON_DAMAGE 触发：造成伤害后
- [x] ON_TAKE_DAMAGE 触发：受到伤害前（可修改伤害）
- [x] ON_PLAY_CARD 触发：使用基础招式时
- [x] ON_SKILL_USE 触发：使用武功招式时
- [x] 多内功同时触发时按 passives 数组顺序依次触发
- [x] 内功效果类型：恢复体力/内力、获得护盾、提升轻功、减伤、闪避、反弹、增加伤害

---

## Implementation Notes

*Derived from GDD Section 3.5 内功触发时机:*

```gdscript
# Character.gd
var passives: Array[Dictionary] = []  # 内功被动列表

func trigger_passives(trigger_type: String, context: Dictionary = {}) -> void:
    for passive in passives:
        if passive.trigger == trigger_type:
            _apply_passive_effect(passive, context)

func _apply_passive_effect(passive: Dictionary, context: Dictionary) -> void:
    var effect_type = passive.get("effect", "")
    var value = passive.get("value", 0)
    
    match effect_type:
        "heal":
            heal(value)
        "recover_mp":
            recover_mp(value)
        "shield":
            shield += value
        "agility_boost":
            current_agility += value
        "reduce_damage":
            if context.has("damage"):
                context["damage"] = int(context["damage"] * (1 - value / 100.0))
        "dodge":
            if randf() < value / 100.0:
                context["dodged"] = true
        "reflect":
            if context.has("attacker") and randf() < value / 100.0:
                context["reflect_damage"] = context.get("damage", 0)

# BattleManager.gd
func _trigger_turn_start_passives() -> void:
    for c in [player, enemy]:
        if not c.is_dead():
            c.trigger_passives("TURN_START")

func _trigger_turn_end_passives() -> void:
    for c in [player, enemy]:
        if not c.is_dead():
            c.trigger_passives("TURN_END")

func _trigger_on_damage_passive(actor: Character, damage: int) -> void:
    actor.trigger_passives("ON_DAMAGE", {"damage": damage})

func _trigger_on_take_damage_passive(target: Character, damage: int, attacker: Character) -> Dictionary:
    var context = {"damage": damage, "attacker": attacker}
    target.trigger_passives("ON_TAKE_DAMAGE", context)
    return context
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: ON_PLAY_CARD 触发点调用
- Story 006: ON_SKILL_USE 触发点调用

---

## QA Test Cases

**AC-1**: TURN_START 恢复体力
- Given: passive={trigger:"TURN_START", effect:"heal", value:4}, current_hp=10, max_hp=20
- When: trigger_passives("TURN_START")
- Then: current_hp=14
- Edge cases: heal 超过 max_hp 时 capped

**AC-2**: ON_TAKE_DAMAGE 减伤
- Given: passive={trigger:"ON_TAKE_DAMAGE", effect:"reduce_damage", value:25}, damage=10
- When: trigger_passives("ON_TAKE_DAMAGE", {"damage":10})
- Then: context["damage"]=7.5 → 7 (int)
- Edge cases: 减伤后 damage=0

**AC-3**: ON_TAKE_DAMAGE 闪避
- Given: passive={trigger:"ON_TAKE_DAMAGE", effect:"dodge", value:20}
- When: trigger_passives("ON_TAKE_DAMAGE", {"damage":10})
- Then: 20% 概率 context["dodged"]=true
- Edge cases: 多次测试验证概率

**AC-4**: ON_DAMAGE 恢复
- Given: passive={trigger:"ON_DAMAGE", effect:"heal", value:3}, actor 造成 10 伤害
- When: trigger_passives("ON_DAMAGE", {"damage":10})
- Then: actor.hp += 3
- Edge cases: 无

**AC-5**: 多内功顺序触发
- Given: passives=[{trigger:"TURN_START", effect:"heal", value:2}, {trigger:"TURN_START", effect:"shield", value:4}]
- When: trigger_passives("TURN_START")
- Then: 先 heal 2，再 shield 4，顺序按数组顺序
- Edge cases: 无

---

## Test Evidence

**Story Type**: Integration
**Required evidence**: `tests/integration/passive_trigger_test.gd` — must exist and pass
**Status**: [x] Created — 12 tests passing

---

## Dependencies

- Depends on: Story 001 (Character), Story 007 (伤害计算)
- Unlocks: Story 005 (卡牌触发), Story 006 (武功触发)