# Story 005: 基础招式卡牌使用验证

> **Epic**: 战斗系统
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-003` (基础招式卡牌使用验证)

**ADR Governing Implementation**: ADR-001
**ADR Decision Summary**: BattleManager 提供 use_basic_card 方法，验证并执行卡牌使用。

**Engine**: Godot 4.6 | **Risk**: LOW

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [ ] use_basic_card(card_index, target_id) 方法
- [ ] 验证条件：轻功足够 (actor.agility >= card.agilityCost)
- [ ] 验证条件：目标有效（存在且存活）
- [ ] 验证条件：距离合法（攻击卡牌：distance <= card.range）
- [ ] 消耗：轻功值、手牌
- [ ] 效果：伤害/护盾、触发内功
- [ ] 返回 Dictionary：{success: bool, message: String, effects: Array}
- [ ] 失败时返回错误信息，不执行行动

---

## Implementation Notes

*Derived from GDD Section 3.4 卡牌使用规则:*

```gdscript
func use_basic_card(card_index: int, target_id: String) -> Dictionary:
    var result = {"success": false, "message": "", "effects": []}
    
    # 验证卡牌索引
    if card_index < 0 or card_index >= current_actor.hand.size():
        result.message = "无效的卡牌索引"
        return result
    
    var card_id = current_actor.hand[card_index]
    var card_data = GameManager.get_card_data(card_id)
    
    # 验证轻功
    if current_actor.current_agility < card_data.agility_cost:
        result.message = "轻功不足"
        return result
    
    # 验证目标
    var target = _get_character_by_id(target_id)
    if target == null or target.is_dead():
        result.message = "目标无效"
        return result
    
    # 验证距离（攻击卡牌）
    if card_data.base_damage > 0:
        var distance = _calculate_distance(current_actor, target)
        if distance > card_data.range:
            result.message = "超出攻击范围"
            return result
    
    # 执行卡牌使用
    _consume_basic_card_resources(card_index, card_data)
    _apply_basic_card_effects(target, card_data, result)
    
    result.success = true
    emit_signal("card_played", current_actor, card_id)
    
    # 检查行动切换
    if should_switch_actor():
        switch_actor()
    
    return result
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 006: 武功招式使用
- Story 007: 伤害计算详细逻辑
- Story 008: 内功触发具体实现
- Story 013: 多人战斗距离计算

---

## QA Test Cases

**AC-1**: 轻功不足验证
- Given: player.agility=2, card.agility_cost=4
- When: use_basic_card(0, "enemy")
- Then: success=false, message="轻功不足"
- Edge cases: agility=0 时任何卡牌都无法使用

**AC-2**: 目标无效验证
- Given: enemy.is_dead()=true
- When: use_basic_card(0, "enemy")
- Then: success=false, message="目标无效"
- Edge cases: 目标 ID 不存在

**AC-3**: 距离超出验证
- Given: distance=3, card.range=1
- When: use_basic_card(0, "enemy")
- Then: success=false, message="超出攻击范围"
- Edge cases: 防御卡牌（无伤害）不检查距离

**AC-4**: 成功使用卡牌
- Given: player.agility=5, card.agility_cost=2, card.base_damage=3
- When: use_basic_card(0, "enemy")
- Then: success=true, player.agility=3, enemy.hp 减少, 发射 card_played 信号
- Edge cases: 无

**AC-5**: 护盾卡牌效果
- Given: card.base_shield=4, card.base_damage=0
- When: use_basic_card(0, "player")  # 自身目标
- Then: player.shield=4
- Edge cases: 护盾叠加

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/battle_manager_test.gd` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: Story 004 (行动顺序)
- Unlocks: Story 006 (武功招式), Story 007 (伤害计算)