extends Control

## 战斗场景

@onready var player_hp_bar: ProgressBar = $BattleUI/TopPanel/PlayerPanel/HPBar
@onready var player_mp_bar: ProgressBar = $BattleUI/TopPanel/PlayerPanel/MPBar
@onready var player_hp_label: Label = $BattleUI/TopPanel/PlayerPanel/HPLabel
@onready var player_mp_label: Label = $BattleUI/TopPanel/PlayerPanel/MPLabel
@onready var player_shield_label: Label = $BattleUI/TopPanel/PlayerPanel/ShieldLabel
@onready var player_agility_label: Label = $BattleUI/TopPanel/PlayerPanel/AgilityLabel

@onready var enemy_hp_bar: ProgressBar = $BattleUI/TopPanel/EnemyPanel/HPBar
@onready var enemy_mp_bar: ProgressBar = $BattleUI/TopPanel/EnemyPanel/MPBar
@onready var enemy_hp_label: Label = $BattleUI/TopPanel/EnemyPanel/HPLabel
@onready var enemy_mp_label: Label = $BattleUI/TopPanel/EnemyPanel/MPLabel
@onready var enemy_shield_label: Label = $BattleUI/TopPanel/EnemyPanel/ShieldLabel
@onready var enemy_agility_label: Label = $BattleUI/TopPanel/EnemyPanel/AgilityLabel

@onready var hand_container: HBoxContainer = $BattleUI/HandContainer
@onready var turn_label: Label = $BattleUI/TurnLabel
@onready var log_label: Label = $BattleUI/LogLabel
@onready var end_turn_button: Button = $BattleUI/EndTurnButton

var battle_manager: BattleManager
var selected_card_index: int = -1


func _ready():
	end_turn_button.pressed.connect(_on_end_turn_pressed)
	_start_battle()


func _start_battle():
	var player_data = GameManager.get_character_data(GameManager.player_character_id)
	var enemy_data = GameManager.get_character_data(GameManager.enemy_character_id)

	battle_manager = BattleManager.new()
	battle_manager.turn_changed.connect(_on_turn_changed)
	battle_manager.damage_dealt.connect(_on_damage_dealt)
	battle_manager.battle_ended.connect(_on_battle_ended)
	add_child(battle_manager)

	battle_manager.start_battle(player_data, enemy_data)
	_update_ui()
	_render_hand()


func _update_ui():
	# 更新玩家面板
	var p = battle_manager.player
	player_hp_bar.max_value = p.max_hp
	player_hp_bar.value = p.current_hp
	player_hp_label.text = "HP: %d/%d" % [p.current_hp, p.max_hp]
	player_mp_bar.max_value = p.max_mp
	player_mp_bar.value = p.current_mp
	player_mp_label.text = "MP: %d/%d" % [p.current_mp, p.max_mp]
	player_shield_label.text = "护盾: %d" % p.shield
	player_agility_label.text = "轻功: %d" % p.current_agility

	# 更新敌人面板
	var e = battle_manager.enemy
	enemy_hp_bar.max_value = e.max_hp
	enemy_hp_bar.value = e.current_hp
	enemy_hp_label.text = "HP: %d/%d" % [e.current_hp, e.max_hp]
	enemy_mp_bar.max_value = e.max_mp
	enemy_mp_bar.value = e.current_mp
	enemy_mp_label.text = "MP: %d/%d" % [e.current_mp, e.max_mp]
	enemy_shield_label.text = "护盾: %d" % e.shield
	enemy_agility_label.text = "轻功: %d" % e.current_agility

	turn_label.text = "回合 %d - %s行动" % [battle_manager.current_turn, "玩家" if battle_manager.current_actor == battle_manager.player else "敌人"]


func _render_hand():
	# 清空手牌容器
	for child in hand_container.get_children():
		child.queue_free()

	# 渲染手牌
	var hand = battle_manager.player.hand
	for i in range(hand.size()):
		var card_id = hand[i]
		var card_data = GameManager.cards_data.get(card_id, {})
		var card_button = Button.new()
		card_button.text = "%s\n伤害:%d" % [card_data.get("name", card_id), card_data.get("damage", 0)]
		card_button.custom_minimum_size = Vector2(80, 100)
		card_button.pressed.connect(_on_card_pressed.bind(i))
		hand_container.add_child(card_button)


func _on_card_pressed(index: int):
	if battle_manager.current_actor != battle_manager.player:
		_log("现在不是你的回合!")
		return

	var result = battle_manager.play_card(index)
	if result.success:
		_log("打出卡牌: %s" % result.card_id)
		_update_ui()
		_render_hand()
	else:
		_log("无法出牌: %s" % result.reason)


func _on_end_turn_pressed():
	if battle_manager.current_actor != battle_manager.player:
		return

	battle_manager.end_turn()
	_update_ui()
	_render_hand()


func _on_turn_changed(actor_id: String):
	_log("轮到 %s 行动" % ("玩家" if actor_id == battle_manager.player.id else "敌人"))


func _on_damage_dealt(target: Character, amount: int):
	_log("%s 受到 %d 点伤害" % [target.name, amount])


func _on_battle_ended(winner: Character, loser: Character):
	_log("%s 获胜!" % winner.name)
	await get_tree().create_timer(2.0).timeout
	GameManager.change_state(GameManager.GameScene.RESULT)


func _log(message: String):
	log_label.text = message
	print(message)
