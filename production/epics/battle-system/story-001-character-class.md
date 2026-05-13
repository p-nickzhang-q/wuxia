# Story 001: Character 类基础实现

> **Epic**: 战斗系统
> **Status**: Ready
> **Layer**: Core
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-001` (回合流程管理依赖角色状态)

**ADR Governing Implementation**: ADR-001: Entity Class Design Pattern
**ADR Decision Summary**: 使用 `class_name` 定义 Character 类，继承 RefCounted 作为轻量级数据容器，支持 HP/MP/护盾/轻功/卡组管理。

**Engine**: Godot 4.6 | **Risk**: LOW
**Engine Notes**: GDScript 静态类型注解，`class_name` 全局可访问

**Control Manifest Rules (this layer)**:
- Required: 使用 `class_name Character extends RefCounted`
- Forbidden: 不继承 Node（Character 不需要场景树功能）
- Guardrail: 无性能限制

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [ ] Character 类定义完成，包含 id, name, max_hp, current_hp, current_mp, shield, current_agility 属性
- [ ] 卡组管理：deck, hand, discard_pile 数组
- [ ] draw_cards(count) 方法：从 deck 抽牌到 hand，牌组空时洗入弃牌堆
- [ ] play_card(card_index) 方法：从 hand 打出卡牌到 discard_pile
- [ ] take_damage(amount) 方法：扣除 HP，返回实际伤害值
- [ ] heal(amount) 方法：恢复 HP，不超过 max_hp
- [ ] recover_mp(amount) 方法：恢复 MP
- [ ] is_dead() 方法：判断 HP <= 0
- [ ] reset_for_new_turn() 方法：重置护盾、恢复轻功、处理 Debuff 递减

---

## Implementation Notes

*Derived from ADR-001 Implementation Guidelines:*

```gdscript
class_name Character
extends RefCounted

# 基础属性
var id: String
var name: String
var max_hp: int
var current_hp: int
var current_mp: int
var shield: int = 0
var base_agility: int
var current_agility: int

# 卡组
var deck: Array[String] = []
var hand: Array[String] = []
var discard_pile: Array[String] = []

# 状态效果
var dots: Array[Dictionary] = []  # {value, duration}
var debuffs: Array[Dictionary] = []  # {type, value, duration}

# 构造函数
func _init(data: Dictionary) -> void:
    id = data.get("id", "")
    name = data.get("name", "")
    max_hp = data.get("hp", 10)
    current_hp = max_hp
    current_mp = data.get("mp", 5)
    base_agility = data.get("agility", 5)
    current_agility = base_agility
    deck = data.get("deck", []).duplicate()
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 002: BattleManager 类（战斗流程管理）
- Story 008: 内功触发时机（passives 数组）
- Story 009: 状态效果详细逻辑（DoT/Debuff 应用）

---

## QA Test Cases

*Written by qa-lead at story creation. The developer implements against these — do not invent new test cases during implementation.*

**AC-1**: Character 属性初始化
- Given: 角色数据 {"id": "hero", "name": "英雄", "hp": 20, "mp": 10, "agility": 8}
- When: 创建 Character 实例
- Then: id="hero", name="英雄", max_hp=20, current_hp=20, current_mp=10, base_agility=8, current_agility=8
- Edge cases: 缺失字段使用默认值

**AC-2**: draw_cards 正常抽牌
- Given: deck=["card1", "card2", "card3"], hand=[], discard_pile=[]
- When: draw_cards(2)
- Then: hand=["card1", "card2"], deck=["card3"]
- Edge cases: deck 空时洗入 discard_pile

**AC-3**: take_damage 扣除 HP
- Given: current_hp=15, shield=0
- When: take_damage(5)
- Then: current_hp=10, 返回 5
- Edge cases: damage > current_hp 时 HP=0, 返回实际扣除值

**AC-4**: heal 不超过 max_hp
- Given: current_hp=15, max_hp=20
- When: heal(10)
- Then: current_hp=20
- Edge cases: heal 值为负数时不处理

**AC-5**: reset_for_new_turn 重置状态
- Given: shield=5, current_agility=3, base_agility=8, debuffs=[{type:"agility", value:2, duration:1}]
- When: reset_for_new_turn()
- Then: shield=0, current_agility=8-2=6, debuffs=[] (duration 递减后移除)
- Edge cases: 无 debuff 时正常重置

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/character_test.gd` — must exist and pass
**Status**: [ ] Not yet created

---

## Dependencies

- Depends on: None
- Unlocks: Story 002 (BattleManager), Story 003 (回合流程), Story 007 (伤害计算)