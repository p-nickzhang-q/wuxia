extends Control

## 主菜单场景

func _ready():
	print("Main menu ready!")

func _on_start_pressed():
	print("Start button pressed!")
	GameManager.change_state(GameManager.GameState.CHARACTER_SELECT)

func _on_quit_pressed():
	print("Quit button pressed!")
	get_tree().quit()
