## distance_system.gd - 距离系统
## 管理角色间的位置关系，影响武功招式的可用性

class_name DistanceSystem
extends RefCounted

## 最大距离
const MAX_DISTANCE: int = 5

## 角色位置字典 (character_id -> int 位置 0-5)
var positions: Dictionary = {}


## 设置角色位置
## @param character_id: 角色ID
## @param position: 目标位置 (0-MAX_DISTANCE)
func set_position(character_id: String, position: int) -> void:
	# 确保位置在有效范围内
	var clamped_position := clampi(position, 0, MAX_DISTANCE)
	positions[character_id] = clamped_position


## 获取角色位置
## @param character_id: 角色ID
## @return: 角色位置，如果角色不存在返回 0
func get_position(character_id: String) -> int:
	return positions.get(character_id, 0)


## 获取两个角色之间的距离
## @param char_a: 角色A的ID
## @param char_b: 角色B的ID
## @return: 两角色间的距离，如果任一角色不存在返回 MAX_DISTANCE
func get_distance(char_a: String, char_b: String) -> int:
	# 如果任一角色不存在，返回最大距离
	if not positions.has(char_a) or not positions.has(char_b):
		return MAX_DISTANCE

	var pos_a: int = positions[char_a]
	var pos_b: int = positions[char_b]
	return absi(pos_a - pos_b)


## 获取指定范围内的所有角色
## @param from_id: 起始角色ID
## @param range_val: 搜索范围
## @return: 在范围内的角色ID数组
func get_characters_in_range(from_id: String, range_val: int) -> Array[String]:
	var result: Array[String] = []

	if not positions.has(from_id):
		return result

	var from_pos: int = positions[from_id]

	for char_id in positions:
		if char_id == from_id:
			continue  # 跳过自己

		var char_pos: int = positions[char_id]
		var distance := absi(from_pos - char_pos)

		if distance <= range_val:
			result.append(char_id)

	return result


## 移动角色位置
## @param character_id: 角色ID
## @param delta: 移动量（正数向右，负数向左）
## @return: 是否移动成功
func move_character(character_id: String, delta: int) -> bool:
	if not positions.has(character_id):
		return false

	var current_pos: int = positions[character_id]
	var new_pos := current_pos + delta

	# 检查新位置是否在有效范围内
	if new_pos < 0 or new_pos > MAX_DISTANCE:
		return false

	positions[character_id] = new_pos
	return true


## 获取相邻角色（距离为1的角色）
## @param character_id: 角色ID
## @return: 相邻角色ID数组
func get_adjacent_characters(character_id: String) -> Array[String]:
	return get_characters_in_range(character_id, 1)


## 移除角色位置记录
## @param character_id: 角色ID
func remove_character(character_id: String) -> void:
	positions.erase(character_id)


## 检查角色是否在指定范围内
## @param char_a: 角色A的ID
## @param char_b: 角色B的ID
## @param range_val: 目标范围
## @return: 是否在范围内
func is_in_range(char_a: String, char_b: String, range_val: int) -> bool:
	return get_distance(char_a, char_b) <= range_val


## 检查武功招式是否可用（基于距离）
## @param attacker_id: 攻击者ID
## @param target_id: 目标ID
## @param skill_range: 武功所需距离（0表示任意距离）
## @return: 武功是否可用
func can_use_skill(attacker_id: String, target_id: String, skill_range: int) -> bool:
	# skill_range 为 0 表示任意距离都可用
	if skill_range == 0:
		return true

	var distance := get_distance(attacker_id, target_id)
	return distance <= skill_range


## 获取所有角色位置
## @return: 位置字典的副本
func get_all_positions() -> Dictionary:
	return positions.duplicate()


## 清空所有位置记录
func clear() -> void:
	positions.clear()


## 获取角色数量
## @return: 当前记录的角色数量
func get_character_count() -> int:
	return positions.size()


## 将角色移动到指定角色的相邻位置
## @param mover_id: 移动者ID
## @param target_id: 目标角色ID
## @param prefer_left: 是否优先向左移动
## @return: 是否移动成功
func move_adjacent_to(mover_id: String, target_id: String, prefer_left: bool = true) -> bool:
	if not positions.has(target_id):
		return false

	var target_pos: int = positions[target_id]
	var mover_pos: int = positions.get(mover_id, -1)

	if mover_pos < 0:
		return false

	# 计算相邻位置
	var left_pos := target_pos - 1
	var right_pos := target_pos + 1

	# 检查边界
	var can_left := left_pos >= 0
	var can_right := right_pos <= MAX_DISTANCE

	# 如果已经在相邻位置，不需要移动
	if absi(mover_pos - target_pos) == 1:
		return true

	# 选择移动方向
	if prefer_left:
		if can_left:
			return move_character(mover_id, left_pos - mover_pos)
		elif can_right:
			return move_character(mover_id, right_pos - mover_pos)
	else:
		if can_right:
			return move_character(mover_id, right_pos - mover_pos)
		elif can_left:
			return move_character(mover_id, left_pos - mover_pos)

	return false


## 转换为字典（用于序列化）
func to_dict() -> Dictionary:
	return {
		"positions": positions.duplicate(),
		"max_distance": MAX_DISTANCE
	}


## 从字典加载（用于反序列化）
## @param data: 包含位置数据的字典
func from_dict(data: Dictionary) -> void:
	clear()
	var pos_data: Dictionary = data.get("positions", {})
	for char_id in pos_data:
		positions[char_id] = pos_data[char_id]