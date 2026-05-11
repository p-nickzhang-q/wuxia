extends Control

## 主菜单场景

@onready var start_button: Button = $VBoxContainer/StartButton
@onready var quit_button: Button = $VBoxContainer/QuitButton


func _ready() -> void:
	start_button.pressed.connect(_on_start_pressed)
	quit_button.pressed.connect(_on_quit_pressed)


func _on_start_pressed() -> void:
	"""开始游戏 - 进入角色选择"""
	GameManager.change_state(GameManager.GameState.CHARACTER_SELECT)


func _on_quit_pressed() -> void:
	"""退出游戏"""
	get_tree().quit()
