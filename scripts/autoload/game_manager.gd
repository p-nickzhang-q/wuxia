extends Node

## 游戏管理器 - 管理全局状态、场景切换、游戏数据

# 当前游戏场景状态
enum GameScene { MENU, CHARACTER_SELECT, BATTLE, RESULT }
var current_scene: GameScene = GameScene.MENU

# 玩家选择的角色
var player_character_id: String = ""
var enemy_character_id: String = ""

# 角色数据缓存
var characters_data: Dictionary = {}
var skills_data: Dictionary = {}
var cards_data: Dictionary = {}
var passives_data: Dictionary = {}


func _ready() -> void:
	load_game_data()


func load_game_data() -> void:
	"""加载游戏数据"""
	# TODO: 从 resources/ 加载角色、武功、卡牌数据
	characters_data = _load_json("res://resources/characters/characters.json")
	skills_data = _load_json("res://resources/skills/skills.json")
	cards_data = _load_json("res://resources/cards/cards.json")
	passives_data = _load_json("res://resources/skills/passives.json")


func _load_json(path: String) -> Dictionary:
	"""加载 JSON 文件"""
	if FileAccess.file_exists(path):
		var file = FileAccess.open(path, FileAccess.READ)
		var json = JSON.new()
		json.parse(file.get_as_text())
		return json.data
	return {}


func change_state(new_state: GameScene) -> void:
	"""切换游戏状态"""
	current_scene = new_state
	match new_state:
		GameScene.MENU:
			get_tree().change_scene_to_file("res://scenes/main.tscn")
		GameScene.CHARACTER_SELECT:
			get_tree().change_scene_to_file("res://scenes/character_select.tscn")
		GameScene.BATTLE:
			get_tree().change_scene_to_file("res://scenes/battle.tscn")
		GameScene.RESULT:
			get_tree().change_scene_to_file("res://scenes/result.tscn")


func get_character_data(character_id: String) -> Dictionary:
	"""获取角色数据"""
	return characters_data.get(character_id, {})


func get_passive_data(passive_id: String) -> Dictionary:
	"""获取内功数据"""
	return passives_data.get(passive_id, {})
