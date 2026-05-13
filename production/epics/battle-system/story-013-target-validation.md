# Story 013: 目标选择与攻击范围验证

> **Epic**: 战斗系统
> **Status**: Ready
> **Layer**: Feature
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-009` (目标选择与攻击范围验证)

**ADR Governing Implementation**: ADR-001
**ADR Decision Summary**: BattleManager 验证目标选择，集成 DistanceSystem。

**Engine**: Godot 4.6 | **Risk**: LOW

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [ ] 目标超出范围时返回错误，不执行行动
- [ ] 目标已死亡时需重新选择目标
- [ ] 阵营对战模式禁止队友攻击
- [ ] 混战模式允许攻击任何人
- [ ] 武功招式自定义 range 属性
- [ ] 基础招式卡牌 range 属性：空手=1, 短兵=2, 长兵=3
- [ ] get_valid_targets(actor, card_or_skill) 方法：返回有效目标列表

---

## Implementation Notes

*Derived from GDD Section 3.6-3.7:*

```gdscript
# BattleManager.gd
var distance_system: DistanceSystem
var battle_mode: DistanceSystem.BattleMode

func _is_valid_target(actor: Character, target: Character, range_val: int) -> bool:
    if target.is_dead():
        return false
    
    # 阵营对战禁止队友攻击
    if battle_mode == DistanceSystem.BattleMode.TEAM:
        if actor.team == target.team:
            return false
    
    # 距离验证
    var distance = distance_system.calculate_actual_distance(
        distance_system.seats.find(actor),
        distance_system.seats.find(target),
        _get_all_characters()
    )
    
    return distance <= range_val

func get_valid_targets(actor: Character, card_or_skill: Dictionary) -> Array[Character]:
    var range_val = card_or_skill.get("range", 1)
    var targets: Array[Character] = []
    
    for c in _get_all_characters():
        if c != actor and _is_valid_target(actor, c, range_val):
            targets.append(c)
    
    return targets

func _validate_target(actor: Character, target: Character, range_val: int) -> Dictionary:
    var result = {"valid": false, "message": ""}
    
    if target.is_dead():
        result.message = "目标已死亡"
        return result
    
    if battle_mode == DistanceSystem.BattleMode.TEAM and actor.team == target.team:
        result.message = "不能攻击队友"
        return result
    
    var distance = distance_system.calculate_actual_distance(
        distance_system.seats.find(actor),
        distance_system.seats.find(target),
        _get_all_characters()
    )
    
    if distance > range_val:
        result.message = "超出攻击范围（距离:" + str(distance) + "，范围:" + str(range_val) + "）"
        return result
    
    result.valid = true
    return result
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 005: 基础招式验证调用目标验证
- Story 006: 武功招式验证调用目标验证
- Story 011: AI 目标选择逻辑

---

## QA Test Cases

**AC-1**: 目标超出范围
- Given: distance=3, card.range=1
- When: _validate_target(actor, target, 1)
- Then: valid=false, message="超出攻击范围..."
- Edge cases: distance=1, range=1 → valid=true

**AC-2**: 目标已死亡
- Given: target.is_dead()=true
- When: _validate_target(actor, target, 1)
- Then: valid=false, message="目标已死亡"
- Edge cases: 无

**AC-3**: 阵营对战禁止队友攻击
- Given: battle_mode=TEAM, actor.team="A", target.team="A"
- When: _validate_target(actor, target, 1)
- Then: valid=false, message="不能攻击队友"
- Edge cases: target.team="B" → valid=true（距离足够时）

**AC-4**: 混战模式允许攻击任何人
- Given: battle_mode=FREE_FOR_ALL, actor.team="A", target.team="A"
- When: _validate_target(actor, target, 1)
- Then: valid=true（距离足够时）
- Edge cases: 无

**AC-5**: get_valid_targets 返回列表
- Given: actor 在 seat 0, card.range=2, seats=[A, B, C, D]
- When: get_valid_targets(A, card)
- Then: 返回 [B, C]（距离 1, 2）
- Edge cases: 无有效目标时返回空数组

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/battle_manager_test.gd` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 012 (距离系统)
- Unlocks: Story 005 (卡牌验证), Story 006 (武功验证), Story 011 (AI)