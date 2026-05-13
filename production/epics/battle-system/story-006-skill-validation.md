# Story 006: 武功招式使用验证

> **Epic**: 战斗系统
> **Status**: Done
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-004` (武功招式使用验证)

**ADR Governing Implementation**: ADR-001
**ADR Decision Summary**: BattleManager 提供 use_skill 方法，验证内力、手牌类型匹配、距离等条件。

**Engine**: Godot 4.6 | **Risk**: LOW

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [x] use_skill(skill_id, card_index, target_id) 方法
- [x] 验证条件：轻功足够 (actor.agility >= skill.agilityCost)
- [x] 验证条件：内力足够 (actor.mp >= skill.mpCost)
- [x] 验证条件：手牌类型匹配 (card.type === skill.requiredCardType 或 requiredCardType === 'any')
- [x] 验证条件：目标有效且存活
- [x] 验证条件：距离合法（有伤害效果时：distance <= skill.range） — 1v1 模式下跳过距离检查
- [x] 消耗：轻功值、内力、手牌
- [x] 处理武功效果列表（damage, shield, drainMp, dot, debuffAgility 等）
- [x] 处理特殊效果（extraAction, followUp, mimic）
- [x] 返回 Dictionary：{success: bool, message: String, effects: Array}

---

## Implementation Notes

*Derived from GDD Section 3.4 武功招式:*

```gdscript
func use_skill(skill_id: String, card_index: int, target_id: String) -> Dictionary:
    var result = {"success": false, "message": "", "effects": []}
    
    var skill_data = GameManager.get_skill_data(skill_id)
    
    # 验证轻功
    if current_actor.current_agility < skill_data.agility_cost:
        result.message = "轻功不足"
        return result
    
    # 验证内力
    if current_actor.current_mp < skill_data.mp_cost:
        result.message = "内力不足"
        return result
    
    # 验证手牌类型
    if card_index < 0 or card_index >= current_actor.hand.size():
        result.message = "无效的卡牌索引"
        return result
    
    var card_id = current_actor.hand[card_index]
    var card_data = GameManager.get_card_data(card_id)
    
    if skill_data.required_card_type != "any" and card_data.type != skill_data.required_card_type:
        result.message = "手牌类型不匹配"
        return result
    
    # 验证目标
    var target = _get_character_by_id(target_id)
    if target == null or target.is_dead():
        result.message = "目标无效"
        return result
    
    # 验证距离（有伤害效果时）
    if _has_damage_effect(skill_data):
        var distance = _calculate_distance(current_actor, target)
        if distance > skill_data.range:
            result.message = "超出攻击范围"
            return result
    
    # 执行武功使用
    _consume_skill_resources(card_index, skill_data)
    _process_skill_effects(target, skill_data, result)
    
    result.success = true
    emit_signal("skill_used", current_actor, skill_id)
    
    # 处理特殊效果
    _handle_special_effects(skill_data, result)
    
    return result

func _process_skill_effects(target: Character, skill_data: Dictionary, result: Dictionary) -> void:
    for effect in skill_data.effects:
        _apply_effect(target, effect, result)
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 007: 伤害计算详细公式
- Story 009: 状态效果（DoT/Debuff）应用逻辑
- Story 008: 内功 ON_SKILL_USE 触发

---

## QA Test Cases

**AC-1**: 内力不足验证
- Given: player.mp=2, skill.mp_cost=5
- When: use_skill("dragon_palm", 0, "enemy")
- Then: success=false, message="内力不足"
- Edge cases: mp=0

**AC-2**: 手牌类型不匹配
- Given: skill.required_card_type="fist", card.type="short_weapon"
- When: use_skill(skill_id, 0, "enemy")
- Then: success=false, message="手牌类型不匹配"
- Edge cases: required_card_type="any" 时任何类型都可用

**AC-3**: 成功使用武功
- Given: player.mp=5, skill.mp_cost=3, card.type="fist", skill.required_card_type="fist"
- When: use_skill("dragon_palm", 0, "enemy")
- Then: success=true, player.mp=2, card 从 hand 移除, 发射 skill_used 信号
- Edge cases: 无

**AC-4**: 多效果处理
- Given: skill.effects=[{type:"damage", value:10}, {type:"shield", value:4}]
- When: use_skill(...)
- Then: enemy.hp 减少 10, player.shield=4
- Edge cases: 效果顺序按数组顺序执行

**AC-5**: extraAction 特殊效果
- Given: skill.effects 包含 {type:"extraAction"}
- When: use_skill(...)
- Then: 不消耗额外轻功，可再行动一次
- Edge cases: extraAction 后回合不结束

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/skill_validation_test.gd` — must exist and pass
**Status**: [x] Created

### Implementation Notes

**Existing Implementation**: `scripts/game/game_state.gd`

修改 `use_skill` 方法签名：
- 添加 `target_id` 参数（可选，默认自动选择对手）
- 添加目标验证（存在且存活）
- 返回 `error` 字段用于错误信息

**距离验证说明**：
- Story 012/013 负责多人战斗距离计算
- 当前 1v1 模式下，距离始终为近身（有效），跳过距离检查

---

## Dependencies

- Depends on: Story 005 (基础招式验证)
- Unlocks: Story 007 (伤害计算), Story 009 (状态效果), Story 011 (AI)