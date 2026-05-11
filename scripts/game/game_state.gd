## game_state.gd - 游戏状态管理类
## 管理整个战斗的状态，包含所有角色、当前阶段、行动历史等

class_name GameState
extends RefCounted

# ==================== 属性 ====================
## 所有参与战斗的角色
var characters: Array[Character] = []

## 当前游戏阶段
var current_phase: Types.GamePhase = Types.GamePhase.SETUP

## 当前回合数
var turn_number: int = 1

## 当前行动角色索引
var current_actor_index: int = 0

## 行动历史记录
var action_history: Array[Dictionary] = []

## 距离系统（可选，用于支持距离机制）
var distance_system = null  # DistanceSystem 类型，待实现


# ==================== 核心方法 ====================

## 获取当前行动角色
func get_current_actor() -> Character:
	if characters.is_empty() or current_actor_index < 0 or current_actor_index >= characters.size():
		return null
	return characters[current_actor_index]


## 获取下一个行动角色
## 基于轻功值决定行动顺序：轻功高者优先行动
func get_next_actor() -> Character:
	if characters.is_empty():
		return null

	if characters.size() == 1:
		return characters[0]

	# 如果只有一个存活角色，返回该角色
	var alive_characters := _get_alive_characters()
	if alive_characters.size() == 1:
		return alive_characters[0]

	# 比较轻功值，轻功高者下一个行动
	var current := get_current_actor()
	if current == null:
		return characters[0]

	# 找到存活的其他角色中轻功最高的
	var next_actor: Character = null
	var highest_agility := -1

	for character in alive_characters:
		if character == current:
			continue
		if character.current_agility > highest_agility:
			highest_agility = character.current_agility
			next_actor = character

	# 如果没有其他存活角色，返回当前角色
	if next_actor == null:
		return current

	return next_actor


## 推进回合
## 回合数+1，重置角色轻功，确定新的先手角色
func advance_turn() -> void:
	turn_number += 1

	# 重置所有角色的回合状态
	for character in characters:
		character.reset_turn()

	# 根据轻功值确定新的先手角色
	_determine_first_actor()

	# 更新阶段
	if current_phase == Types.GamePhase.SETUP:
		current_phase = Types.GamePhase.SELECTING


## 检查战斗是否结束
## 当任意角色死亡时战斗结束
func is_battle_over() -> bool:
	var alive_count := 0
	for character in characters:
		if not character.is_dead():
			alive_count += 1
	return alive_count <= 1


## 获取胜利者
## 返回存活的角色，如果没有则返回null
func get_winner() -> Character:
	if not is_battle_over():
		return null

	for character in characters:
		if not character.is_dead():
			return character

	return null


## 记录行动到历史
func record_action(action: Dictionary) -> void:
	# 添加时间戳和回合信息
	var record := action.duplicate()
	record["turn"] = turn_number
	record["timestamp"] = Time.get_ticks_msec()

	action_history.append(record)


## 获取指定角色可攻击的目标
## 在对战模式下返回对手
func get_targets_for(character: Character) -> Array[Character]:
	var targets: Array[Character] = []

	for c in characters:
		if c != character and not c.is_dead():
			targets.append(c)

	return targets


# ==================== 辅助方法 ====================

## 获取所有存活角色
func _get_alive_characters() -> Array[Character]:
	var alive: Array[Character] = []
	for character in characters:
		if not character.is_dead():
			alive.append(character)
	return alive


## 根据轻功值确定先手角色
func _determine_first_actor() -> void:
	var alive_characters := _get_alive_characters()
	if alive_characters.is_empty():
		current_actor_index = 0
		return

	var first_actor: Character = alive_characters[0]
	var highest_agility := first_actor.current_agility

	for character in alive_characters:
		if character.current_agility > highest_agility:
			highest_agility = character.current_agility
			first_actor = character

	# 更新索引
	var index := characters.find(first_actor)
	if index >= 0:
		current_actor_index = index


## 切换到下一个行动角色
## 当当前角色轻功低于对手时调用
func switch_to_next_actor() -> void:
	var next := get_next_actor()
	if next != null:
		var index := characters.find(next)
		if index >= 0:
			current_actor_index = index


## 获取当前角色的对手（在对战模式下）
func get_opponent(character: Character) -> Character:
	var targets := get_targets_for(character)
	if targets.is_empty():
		return null
	return targets[0]


## 检查是否轮到指定角色行动
func is_character_turn(character: Character) -> bool:
	return get_current_actor() == character


## 获取角色索引
func get_character_index(character: Character) -> int:
	return characters.find(character)


## 添加角色到战斗
func add_character(character: Character) -> void:
	if character != null and not characters.has(character):
		characters.append(character)


## 移除角色从战斗
func remove_character(character: Character) -> void:
	var index := characters.find(character)
	if index >= 0:
		characters.remove_at(index)
		# 调整当前行动索引
		if current_actor_index >= characters.size():
			current_actor_index = maxi(0, characters.size() - 1)


## 清除所有角色
func clear_characters() -> void:
	characters.clear()
	current_actor_index = 0


## 重置战斗状态
func reset() -> void:
	characters.clear()
	current_phase = Types.GamePhase.SETUP
	turn_number = 1
	current_actor_index = 0
	action_history.clear()

	if distance_system != null and distance_system.has_method("reset"):
		distance_system.reset()


## 开始战斗
func start_battle() -> void:
	current_phase = Types.GamePhase.SELECTING

	# 初始化所有角色
	for character in characters:
		character.reset_for_battle()

	# 确定先手
	_determine_first_actor()

	# 记录战斗开始
	record_action({
		"type": "battle_start",
		"characters": characters.size()
	})


## 结束战斗
func end_battle() -> void:
	current_phase = Types.GamePhase.GAME_OVER

	var winner := get_winner()
	record_action({
		"type": "battle_end",
		"winner": winner.name if winner else "none",
		"turns": turn_number
	})


## 获取战斗摘要
func get_battle_summary() -> Dictionary:
	var winner := get_winner()
	return {
		"winner": winner.name if winner else "none",
		"turns": turn_number,
		"actions": action_history.size(),
		"characters": _get_characters_status()
	}


## 获取所有角色状态
func _get_characters_status() -> Array[Dictionary]:
	var status: Array[Dictionary] = []
	for character in characters:
		status.append({
			"name": character.name,
			"hp": character.current_hp,
			"max_hp": character.max_hp,
			"is_alive": not character.is_dead()
		})
	return status


## 转换为字典（用于序列化/保存）
func to_dict() -> Dictionary:
	var characters_data: Array[Dictionary] = []
	for character in characters:
		characters_data.append(character.to_dict())

	var history_data: Array[Dictionary] = []
	for action in action_history:
		history_data.append(action)

	return {
		"turn_number": turn_number,
		"current_actor_index": current_actor_index,
		"current_phase": current_phase,
		"characters": characters_data,
		"action_history": history_data
	}


## 从字典加载状态
static func from_dict(data: Dictionary) -> GameState:
	var state := GameState.new()
	state.turn_number = data.get("turn_number", 1)
	state.current_actor_index = data.get("current_actor_index", 0)

	var phase_value: int = data.get("current_phase", Types.GamePhase.SETUP)
	state.current_phase = phase_value as Types.GamePhase

	# 注意：角色需要单独加载，因为需要从资源文件重建
	# action_history 可以直接加载
	var history_data: Array = data.get("action_history", [])
	for action in history_data:
		if action is Dictionary:
			state.action_history.append(action)

	return state