extends Control

@onready var result_label: Label = $VBoxContainer/ResultLabel
@onready var back_button: Button = $VBoxContainer/BackButton


func _ready():
	back_button.pressed.connect(_on_back_pressed)
	_show_result()


func _show_result():
	var player_data = GameManager.get_character_data(GameManager.player_character_id)
	var enemy_data = GameManager.get_character_data(GameManager.enemy_character_id)

	# 简单判断胜负（实际应该从 BattleManager 获取）
	result_label.text = "战斗结束!\n%s vs %s" % [player_data.get("name", "玩家"), enemy_data.get("name", "敌人")]


func _on_back_pressed():
	GameManager.change_state(GameManager.GameScene.MENU)
