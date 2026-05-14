# Story 012: 多人战斗距离系统

> **Epic**: 战斗系统
> **Status**: Done
> **Layer**: Feature
> **Type**: Logic
> **Manifest Version**: N/A (control-manifest 不存在)

## Context

**GDD**: `design/gdd/battle-system.md`
**Requirement**: `BATTLE-008` (多人战斗距离系统)

**ADR Governing Implementation**: ADR-001
**ADR Decision Summary**: DistanceSystem 类管理座位分配和距离计算。

**Engine**: Godot 4.6 | **Risk**: LOW

---

## Acceptance Criteria

*From GDD `design/gdd/battle-system.md`, scoped to this story:*

- [x] DistanceSystem 类定义完成
- [x] assign_seats(characters, mode) 方法：按战斗模式分配座位
- [x] calculate_distance(seat_a, seat_b, total_seats) 方法：计算物理距离
- [x] calculate_actual_distance(seat_a, seat_b, characters) 方法：跳过死亡角色计算实际距离
- [x] get_targetsInRange(actor, range, characters) 方法：返回范围内目标列表
- [x] 圆形布局：座位按圆形排列，索引 0 到 N-1
- [x] 死亡角色不计入距离计算
- [x] 战斗模式：team（阵营对战）、freeforall（混战）

---

## Implementation Notes

*Derived from GDD Section 3.6 距离系统:*

```gdscript
class_name DistanceSystem
extends RefCounted

enum BattleMode { TEAM, FREE_FOR_ALL }

var seats: Array[Character] = []  # 座位顺序

func assign_seats(characters: Array[Character], mode: BattleMode) -> void:
    seats.clear()
    
    if mode == BattleMode.TEAM:
        # 左右分布，队友相邻
        var team_a: Array[Character] = []
        var team_b: Array[Character] = []
        for c in characters:
            if c.team == "A":
                team_a.append(c)
            else:
                team_b.append(c)
        
        # 交替排列：A1, B1, A2, B2, ...
        for i in range(max(team_a.size(), team_b.size()):
            if i < team_a.size():
                seats.append(team_a[i])
            if i < team_b.size():
                seats.append(team_b[i])
    
    elif mode == BattleMode.FREE_FOR_ALL:
        # 圆形交错分布
        seats = characters.duplicate()

func calculate_distance(seat_a: int, seat_b: int, total_seats: int) -> int:
    var direct = abs(seat_a - seat_b)
    var wrap = total_seats - direct
    return min(direct, wrap)

func calculate_actual_distance(seat_a: int, seat_b: int, characters: Array[Character]) -> int:
    # 跳过死亡角色计算最短路径
    var path_count = 0
    var start = min(seat_a, seat_b)
    var end = max(seat_a, seat_b)
    
    # 正向路径
    for i in range(start, end):
        if not characters[i].is_dead():
            path_count += 1
    
    # 反向路径（绕圈）
    var wrap_count = 0
    for i in range(end, characters.size()):
        if not characters[i].is_dead():
            wrap_count += 1
    for i in range(0, start):
        if not characters[i].is_dead():
            wrap_count += 1
    
    return min(path_count, wrap_count)

func get_targets_in_range(actor: Character, range_val: int, characters: Array[Character]) -> Array[Character]:
    var targets: Array[Character] = []
    var actor_seat = seats.find(actor)
    
    for c in characters:
        if c != actor and not c.is_dead():
            var distance = calculate_actual_distance(actor_seat, seats.find(c), characters)
            if distance <= range_val:
                targets.append(c)
    
    return targets
```

---

## Out of Scope

*Handled by neighbouring stories — do not implement here:*

- Story 013: 目标选择验证（使用距离结果）

---

## QA Test Cases

**AC-1**: 圆形布局距离计算
- Given: 6 座位，seat_a=0, seat_b=4
- When: calculate_distance(0, 4, 6)
- Then: min(4, 6-4) = min(4, 2) = 2
- Edge cases: seat_b=3 → distance=3

**AC-2**: 死亡角色跳过
- Given: seats=[A, B, C, D], B.is_dead()=true, seat_a=0, seat_b=3
- When: calculate_actual_distance(0, 3, characters)
- Then: 正向路径跳过 B，实际距离=2
- Edge cases: 多个死亡角色

**AC-3**: 阵营对战座位分配
- Given: team_a=[A1, A2], team_b=[B1, B2]
- When: assign_seats(characters, TEAM)
- Then: seats=[A1, B1, A2, B2]（交替排列）
- Edge cases: 队伍人数不等

**AC-4**: 获取范围内目标
- Given: actor 在 seat 0, range=2, seats=[A, B, C, D, E]
- When: get_targets_in_range(A, 2, characters)
- Then: 返回 [B, C, E]（距离 1, 2, 2）
- Edge cases: 无目标在范围内时返回空数组

**AC-5**: 混战模式座位
- Given: characters=[A, B, C, D]
- When: assign_seats(characters, FREE_FOR_ALL)
- Then: seats=[A, B, C, D]（原顺序）
- Edge cases: 无

---

## Test Evidence

**Story Type**: Logic
**Required evidence**: `tests/unit/distance_system_test.gd` — must exist and pass
**Status**: [x] Created at `tests/unit/distance_system_test.gd` — 22 tests passing

---

## Dependencies

- Depends on: Story 010 (游戏结束判断)
- Unlocks: Story 013 (目标选择验证)