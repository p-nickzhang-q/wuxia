## distance_system.gd - 多人战斗距离系统
## 管理座位分配和距离计算
## 设计原则：支持圆形布局，跳过死亡角色计算实际距离

class_name DistanceSystem
extends RefCounted

# ==================== 枚举定义 ====================

## 战斗模式
enum BattleMode {
	TEAM,          # 阵营对战：队友相邻
	FREE_FOR_ALL   # 混战：圆形交错分布
}

# ==================== 属性 ====================

## 座位顺序（存储角色状态字典的引用）
var seats: Array = []


# ==================== 座位分配 ====================

## 分配座位
## characters: 角色状态字典数组
## mode: 战斗模式
func assign_seats(characters: Array, mode: BattleMode) -> void:
	seats.clear()

	if characters.is_empty():
		return

	if mode == BattleMode.TEAM:
		# 左右分布，队友相邻
		var team_a: Array = []
		var team_b: Array = []

		for c in characters:
			var team: String = c.get("team", "A")
			if team == "A":
				team_a.append(c)
			else:
				team_b.append(c)

		# 交替排列：A1, B1, A2, B2, ...
		var max_size := maxi(team_a.size(), team_b.size())
		for i in range(max_size):
			if i < team_a.size():
				seats.append(team_a[i])
			if i < team_b.size():
				seats.append(team_b[i])

	elif mode == BattleMode.FREE_FOR_ALL:
		# 圆形交错分布：保持原顺序
		seats = characters.duplicate()


## 获取角色的座位索引
func get_seat_index(character: Dictionary) -> int:
	return seats.find(character)


# ==================== 距离计算 ====================

## 计算物理距离（不考虑死亡角色）
## seat_a: 座位索引 A
## seat_b: 座位索引 B
## total_seats: 总座位数
static func calculate_distance(seat_a: int, seat_b: int, total_seats: int) -> int:
	if total_seats <= 0:
		return 0

	var direct := absi(seat_a - seat_b)
	var wrap := total_seats - direct
	return mini(direct, wrap)


## 计算实际距离（跳过死亡角色）
## seat_a: 座位索引 A
## seat_b: 座位索引 B
## characters: 角色状态字典数组
static func calculate_actual_distance(seat_a: int, seat_b: int, characters: Array) -> int:
	if characters.is_empty():
		return 0

	# 如果两个座位相同，距离为 0
	if seat_a == seat_b:
		return 0

	var total_seats := characters.size()

	# 正向路径计数
	var forward_count := 0
	var start := mini(seat_a, seat_b)
	var end := maxi(seat_a, seat_b)

	for i in range(start, end):
		if i < characters.size():
			var c: Dictionary = characters[i]
			if not CharacterState.is_dead(c):
				forward_count += 1

	# 反向路径计数（绕圈）
	var wrap_count := 0

	# 从 end 到末尾
	for i in range(end, total_seats):
		var c: Dictionary = characters[i]
		if not CharacterState.is_dead(c):
			wrap_count += 1

	# 从开头到 start
	for i in range(0, start):
		var c: Dictionary = characters[i]
		if not CharacterState.is_dead(c):
			wrap_count += 1

	return mini(forward_count, wrap_count)


## 获取范围内的目标
## actor: 行动角色
## range_val: 攻击范围
## characters: 所有角色列表
func get_targets_in_range(actor: Dictionary, range_val: int, characters: Array) -> Array:
	var targets: Array = []
	var actor_seat := get_seat_index(actor)

	if actor_seat < 0:
		return targets

	for c in characters:
		if c == actor:
			continue
		if CharacterState.is_dead(c):
			continue

		var target_seat := get_seat_index(c)
		if target_seat < 0:
			continue

		var distance := calculate_actual_distance(actor_seat, target_seat, characters)
		if distance <= range_val:
			targets.append(c)

	return targets


## 获取所有存活角色
static func get_alive_characters(characters: Array) -> Array:
	var alive: Array = []
	for c in characters:
		if not CharacterState.is_dead(c):
			alive.append(c)
	return alive


## 获取指定座位的相邻座位
static func get_adjacent_seats(seat_index: int, total_seats: int) -> Array[int]:
	var adjacent: Array[int] = []

	if total_seats <= 1:
		return adjacent

	# 左邻居
	var left := (seat_index - 1 + total_seats) % total_seats
	adjacent.append(left)

	# 右邻居
	var right := (seat_index + 1) % total_seats
	adjacent.append(right)

	return adjacent


## 检查两个座位是否相邻
static func are_adjacent(seat_a: int, seat_b: int, total_seats: int) -> bool:
	return calculate_distance(seat_a, seat_b, total_seats) == 1
