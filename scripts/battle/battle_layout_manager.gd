## battle_layout_manager.gd - 战斗布局管理器
## 计算1v1和多人战斗的角色面板位置

class_name BattleLayoutManager
extends RefCounted

# ==================== 布局常量 ====================
## 标准面板尺寸
const STANDARD_PANEL_WIDTH: int = 300
const STANDARD_PANEL_HEIGHT: int = 280

## 迷你面板尺寸
const MINI_PANEL_WIDTH: int = 180
const MINI_PANEL_HEIGHT: int = 130

## 面板间距
const PANEL_SPACING: int = 16

## 圆形布局参数
const CIRCLE_RADIUS_RATIO: float = 0.35  # 相对于战斗区域的比例
const MIN_CIRCLE_RADIUS: int = 150
const MAX_CIRCLE_RADIUS: int = 300

## 战斗区域边距
const BATTLE_MARGIN_TOP: int = 60
const BATTLE_MARGIN_BOTTOM: int = 220
const BATTLE_MARGIN_LEFT: int = 20
const BATTLE_MARGIN_RIGHT: int = 300  # 右侧边栏宽度


# ==================== 布局模式 ====================
enum LayoutMode {
	STANDARD_1V1,    ## 1v1 标准模式（大面板，左右布局）
	CIRCULAR_MULTI   ## 多人圆形布局
}


# ==================== 公共方法 ====================

## 计算角色面板位置
## 返回: Array[Dictionary] 每个元素包含 {character_id, position, size, rotation}
static func calculate_positions(
	characters: Array,
	screen_size: Vector2,
	mode: LayoutMode = LayoutMode.STANDARD_1V1
) -> Array:
	match mode:
		LayoutMode.STANDARD_1V1:
			return _calculate_1v1_positions(characters, screen_size)
		LayoutMode.CIRCULAR_MULTI:
			return _calculate_circular_positions(characters, screen_size)
		_:
			return _calculate_1v1_positions(characters, screen_size)


## 自动检测布局模式
static func detect_layout_mode(characters: Array) -> LayoutMode:
	if characters.size() <= 2:
		return LayoutMode.STANDARD_1V1
	else:
		return LayoutMode.CIRCULAR_MULTI


## 获取战斗区域尺寸
static func get_battle_area(screen_size: Vector2) -> Rect2:
	var area_width: float = screen_size.x - BATTLE_MARGIN_LEFT - BATTLE_MARGIN_RIGHT
	var area_height: float = screen_size.y - BATTLE_MARGIN_TOP - BATTLE_MARGIN_BOTTOM
	return Rect2(
		BATTLE_MARGIN_LEFT,
		BATTLE_MARGIN_TOP,
		max(area_width, 400),
		max(area_height, 300)
	)


# ==================== 1v1 布局 ====================

static func _calculate_1v1_positions(characters: Array, screen_size: Vector2) -> Array:
	var result: Array = []
	var battle_area: Rect2 = get_battle_area(screen_size)

	# 分离玩家和敌人
	var players: Array = []
	var enemies: Array = []

	for character in characters:
		var is_player: bool = character.get("is_player", false)
		if is_player:
			players.append(character)
		else:
			enemies.append(character)

	# 敌人面板（右侧）
	for i in range(enemies.size()):
		var character: Dictionary = enemies[i]
		var pos: Vector2 = Vector2(
			battle_area.position.x + battle_area.size.x - STANDARD_PANEL_WIDTH - 20,
			battle_area.position.y + (battle_area.size.height - STANDARD_PANEL_HEIGHT) / 2 - 50
		)
		result.append({
			"character_id": character.get("id", ""),
			"position": pos,
			"size": Vector2(STANDARD_PANEL_WIDTH, STANDARD_PANEL_HEIGHT),
			"rotation": 0,
			"is_player": false,
			"index": i
		})

	# 玩家面板（左侧）
	for i in range(players.size()):
		var character: Dictionary = players[i]
		var pos: Vector2 = Vector2(
			battle_area.position.x + 20,
			battle_area.position.y + (battle_area.size.height - STANDARD_PANEL_HEIGHT) / 2 + 50
		)
		result.append({
			"character_id": character.get("id", ""),
			"position": pos,
			"size": Vector2(STANDARD_PANEL_WIDTH, STANDARD_PANEL_HEIGHT),
			"rotation": 0,
			"is_player": true,
			"index": i
		})

	return result


# ==================== 圆形布局 ====================

static func _calculate_circular_positions(characters: Array, screen_size: Vector2) -> Array:
	var result: Array = []
	var battle_area: Rect2 = get_battle_area(screen_size)

	# 分离玩家和敌人
	var players: Array = []
	var enemies: Array = []

	for character in characters:
		var is_player: bool = character.get("is_player", false)
		if is_player:
			players.append(character)
		else:
			enemies.append(character)

	# 计算圆心
	var center: Vector2 = battle_area.position + battle_area.size / 2

	# 计算半径
	var radius: int = int(min(battle_area.size.width, battle_area.size.height) * CIRCLE_RADIUS_RATIO)
	radius = clampi(radius, MIN_CIRCLE_RADIUS, MAX_CIRCLE_RADIUS)

	# 敌人在上半圆（角度从 -180° 到 0°，即上半部分）
	var enemy_count: int = enemies.size()
	if enemy_count > 0:
		var angle_step: float = PI / max(enemy_count + 1, 2)  # 上半圆范围
		var start_angle: float = -PI + angle_step  # 从左侧开始

		for i in range(enemy_count):
			var character: Dictionary = enemies[i]
			var angle: float = start_angle + angle_step * (i + 0.5)
			var pos: Vector2 = center + Vector2(cos(angle), sin(angle)) * radius

			# 调整位置使面板中心对齐计算点
			pos.x -= MINI_PANEL_WIDTH / 2
			pos.y -= MINI_PANEL_HEIGHT / 2

			result.append({
				"character_id": character.get("id", ""),
				"position": pos,
				"size": Vector2(MINI_PANEL_WIDTH, MINI_PANEL_HEIGHT),
				"rotation": 0,
				"is_player": false,
				"index": i
			})

	# 玩家在下半圆（角度从 0° 到 180°，即下半部分）
	var player_count: int = players.size()
	if player_count > 0:
		var angle_step: float = PI / max(player_count + 1, 2)  # 下半圆范围
		var start_angle: float = angle_step  # 从左侧开始

		for i in range(player_count):
			var character: Dictionary = players[i]
			var angle: float = start_angle + angle_step * (i + 0.5)
			var pos: Vector2 = center + Vector2(cos(angle), sin(angle)) * radius

			# 调整位置使面板中心对齐计算点
			pos.x -= MINI_PANEL_WIDTH / 2
			pos.y -= MINI_PANEL_HEIGHT / 2

			result.append({
				"character_id": character.get("id", ""),
				"position": pos,
				"size": Vector2(MINI_PANEL_WIDTH, MINI_PANEL_HEIGHT),
				"rotation": 0,
				"is_player": true,
				"index": i
			})

	return result


# ==================== 辅助方法 ====================

## 获取面板尺寸
static func get_panel_size(mode: LayoutMode) -> Vector2:
	match mode:
		LayoutMode.STANDARD_1V1:
			return Vector2(STANDARD_PANEL_WIDTH, STANDARD_PANEL_HEIGHT)
		LayoutMode.CIRCULAR_MULTI:
			return Vector2(MINI_PANEL_WIDTH, MINI_PANEL_HEIGHT)
		_:
			return Vector2(STANDARD_PANEL_WIDTH, STANDARD_PANEL_HEIGHT)


## 计算目标选择高亮位置
static func get_target_highlight_position(panel_position: Vector2, panel_size: Vector2) -> Rect2:
	var margin: int = 4
	return Rect2(
		panel_position.x - margin,
		panel_position.y - margin,
		panel_size.x + margin * 2,
		panel_size.y + margin * 2
	)


## 计算伤害数字显示位置
static func get_damage_number_position(panel_position: Vector2, panel_size: Vector2) -> Vector2:
	# 显示在面板中心偏上
	return Vector2(
		panel_position.x + panel_size.x / 2,
		panel_position.y + panel_size.y * 0.3
	)
