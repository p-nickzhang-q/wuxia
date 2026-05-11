extends Control

## 角色选择场景

const GRID_COLUMNS: int = 4
const CARD_SIZE: Vector2 = Vector2(150, 200)

@onready var grid_container: GridContainer = $VBoxContainer/ScrollContainer/GridContainer
@onready var confirm_button: Button = $VBoxContainer/HBoxContainer/ConfirmButton
@onready var back_button: Button = $VBoxContainer/HBoxContainer/BackButton
@onready var player_info: Label = $VBoxContainer/PlayerInfo

var selected_character_id: String = ""
var character_cards: Dictionary = {}


func _ready() -> void:
	confirm_button.pressed.connect(_on_confirm_pressed)
	back_button.pressed.connect(_on_back_pressed)
	confirm_button.disabled = true

	_load_characters()


func _load_characters() -> void:
	"""加载角色列表"""
	var characters = GameManager.characters_data

	for character_id in characters:
		var character_data = characters[character_id]
		_create_character_card(character_id, character_data)


func _create_character_card(character_id: String, data: Dictionary) -> void:
	"""创建角色卡片"""
	var card = Button.new()
	card.custom_minimum_size = CARD_SIZE
	card.toggle_mode = true

	# 创建卡片内容
	var vbox = VBoxContainer.new()
	vbox.alignment = BoxContainer.ALIGNMENT_CENTER

	var name_label = Label.new()
	name_label.text = data.get("name", "???")
	name_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	vbox.add_child(name_label)

	var title_label = Label.new()
	title_label.text = data.get("title", "")
	title_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	title_label.add_theme_font_size_override("font_size", 12)
	vbox.add_child(title_label)

	var stats_label = Label.new()
	stats_label.text = "HP:%d MP:%d 轻功:%d" % [
		data.get("hp", 60),
		data.get("mp", 20),
		data.get("agility", 10)
	]
	stats_label.horizontal_alignment = HORIZONTAL_ALIGNMENT_CENTER
	stats_label.add_theme_font_size_override("font_size", 10)
	vbox.add_child(stats_label)

	card.add_child(vbox)

	# 连接点击事件
	card.pressed.connect(_on_character_selected.bind(character_id, card))

	character_cards[character_id] = card
	grid_container.add_child(card)


func _on_character_selected(character_id: String, card: Button) -> void:
	"""角色被选中"""
	# 取消其他选中
	for id in character_cards:
		if id != character_id:
			character_cards[id].button_pressed = false

	selected_character_id = character_id
	confirm_button.disabled = false

	# 更新信息显示
	var data = GameManager.get_character_data(character_id)
	player_info.text = "已选择: %s - %s" % [data.get("name", ""), data.get("title", "")]


func _on_confirm_pressed() -> void:
	"""确认选择，开始战斗"""
	if selected_character_id.is_empty():
		return

	GameManager.player_character_id = selected_character_id
	# 随机选择敌方角色
	var all_ids = GameManager.characters_data.keys()
	all_ids.erase(selected_character_id)
	GameManager.enemy_character_id = all_ids.pick_random()

	GameManager.change_state(GameManager.GameState.BATTLE)


func _on_back_pressed() -> void:
	"""返回主菜单"""
	GameManager.change_state(GameManager.GameState.MENU)
