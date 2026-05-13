## battle_ui_manager.gd - 战斗UI协调管理器
## 协调所有UI组件，连接GameState信号到UI更新，管理UI状态

class_name BattleUIManager
extends RefCounted

# ==================== 信号 ====================
## UI刷新请求信号
signal ui_refresh_requested()
## 目标选择模式改变信号
signal target_selection_changed(enabled: bool)
## 行动确认信号
signal action_confirmed(card_index: int, skill_index: int, target_id: String)
## 行动取消信号
signal action_cancelled()

# ==================== 引用 ====================
## 游戏状态
var game_state: GameState = null
## 战斗UI
var battle_ui: Control = null
## 输入处理器
var input_handler: BattleInputHandler = null
## 动画器
var animator: BattleAnimator = null

# ==================== UI状态 ====================
## 选中的卡牌索引
var selected_card_index: int = -1
## 选中的技能索引
var selected_skill_index: int = -1
## 是否处于目标选择模式
var is_target_selection_mode: bool = false
## 有效目标列表
var valid_targets: Array = []
## 选中的目标ID
var selected_target_id: String = ""

# ==================== 内部状态 ====================
## 玩家角色
var _player_character: Dictionary = {}
## 敌人角色
var _enemy_character: Dictionary = {}


## 设置管理器
func setup(gs: GameState, ui: Control, handler: BattleInputHandler = null, anim: BattleAnimator = null) -> void:
	game_state = gs
	battle_ui = ui
	input_handler = handler
	animator = anim

	# 获取角色引用
	_update_character_references()

	# 连接信号
	_connect_signals()


## 更新角色引用
func _update_character_references() -> void:
	if game_state == null:
		return

	_player_character = game_state.player
	_enemy_character = game_state.enemy


## 连接信号
func _connect_signals() -> void:
	if game_state == null:
		return

	# 连接GameState信号
	game_state.turn_started.connect(_on_turn_started)
	game_state.turn_ended.connect(_on_turn_ended)
	game_state.actor_changed.connect(_on_actor_changed)
	game_state.card_played.connect(_on_card_played)
	game_state.skill_used.connect(_on_skill_used)
	game_state.damage_dealt.connect(_on_damage_dealt)
	game_state.shield_gained.connect(_on_shield_gained)
	game_state.character_healed.connect(_on_character_healed)
	game_state.passive_triggered.connect(_on_passive_triggered)
	game_state.game_ended.connect(_on_game_ended)
	game_state.log_message.connect(_on_log_message)

	# 连接UI信号
	if battle_ui:
		if battle_ui.has_signal("card_clicked"):
			battle_ui.card_clicked.connect(_on_ui_card_clicked)
		if battle_ui.has_signal("skill_clicked"):
			battle_ui.skill_clicked.connect(_on_ui_skill_clicked)
		if battle_ui.has_signal("character_panel_clicked"):
			battle_ui.character_panel_clicked.connect(_on_ui_character_clicked)
		if battle_ui.has_signal("end_turn_pressed"):
			battle_ui.end_turn_pressed.connect(_on_ui_end_turn_pressed)


# ==================== GameState信号处理 ====================

func _on_turn_started(turn_number: int) -> void:
	_update_character_references()
	_refresh_ui()
	_add_log("第 %d 回合开始" % turn_number, LayoutConstants.COLOR_TEXT_GOLD)


func _on_turn_ended() -> void:
	_clear_selection()


func _on_actor_changed(actor: Dictionary) -> void:
	_refresh_ui()
	var actor_name: String = actor.get("name", "未知")
	_add_log("轮到 %s 行动" % actor_name)


func _on_card_played(character: Dictionary, card: CardState) -> void:
	_refresh_ui()
	var char_name: String = character.get("name", "未知")
	_add_log("%s 使用了 %s" % [char_name, card.name])


func _on_skill_used(character: Dictionary, skill: SkillState) -> void:
	_refresh_ui()
	var char_name: String = character.get("name", "未知")
	_add_log("%s 施展了 %s" % [char_name, skill.name])


func _on_damage_dealt(target: Dictionary, amount: int, _source: Dictionary) -> void:
	var target_name: String = target.get("name", "未知")
	_add_log("%s 受到 %d 点伤害" % [target_name, amount], LayoutConstants.COLOR_TEXT_RED)

	# 显示伤害数字
	_show_damage_number(target, amount)


func _on_shield_gained(character: Dictionary, amount: int) -> void:
	var char_name: String = character.get("name", "未知")
	_add_log("%s 获得 %d 点护盾" % [char_name, amount], LayoutConstants.COLOR_TEXT_BLUE)


func _on_character_healed(character: Dictionary, amount: int) -> void:
	var char_name: String = character.get("name", "未知")
	_add_log("%s 恢复 %d 点生命" % [char_name, amount], LayoutConstants.COLOR_TEXT_GREEN)


func _on_passive_triggered(character: Dictionary, passive: PassiveState, _result: Dictionary) -> void:
	var char_name: String = character.get("name", "未知")
	_add_log("%s 的 %s 触发" % [char_name, passive.name], LayoutConstants.COLOR_TEXT_GOLD)


func _on_game_ended(_winner: Dictionary, _loser: Dictionary) -> void:
	_refresh_ui()


func _on_log_message(text: String) -> void:
	_add_log(text)


# ==================== UI信号处理 ====================

func _on_ui_card_clicked(card_data: Dictionary, _card_ui: CardUI) -> void:
	if game_state == null or battle_ui == null:
		return

	# 检查是否是玩家回合
	var current_actor: Dictionary = game_state.get_current_actor()
	if current_actor != _player_character:
		return

	# 获取卡牌索引
	var card_instance_id: String = card_data.get("instance_id", "")
	selected_card_index = _find_card_index(card_instance_id)

	if selected_card_index < 0:
		return

	# 如果已选中技能，尝试使用武功
	if selected_skill_index >= 0:
		_enter_target_selection_for_skill()
	else:
		# 使用基础招式
		_enter_target_selection_for_card()


func _on_ui_skill_clicked(skill: SkillState, _button: SkillButton) -> void:
	if game_state == null or battle_ui == null:
		return

	# 检查是否是玩家回合
	var current_actor: Dictionary = game_state.get_current_actor()
	if current_actor != _player_character:
		return

	# 获取技能索引
	selected_skill_index = _find_skill_index(skill.skill_id)

	# 如果已选中卡牌，尝试使用武功
	if selected_card_index >= 0:
		_enter_target_selection_for_skill()


func _on_ui_character_clicked(character: Dictionary) -> void:
	if not is_target_selection_mode:
		return

	var char_id: String = character.get("id", "")

	# 验证是否为有效目标
	if char_id in valid_targets or valid_targets.is_empty():
		selected_target_id = char_id
		_set_target_highlight(char_id)


func _on_ui_end_turn_pressed() -> void:
	if game_state == null:
		return

	# 检查是否是玩家回合
	var current_actor: Dictionary = game_state.get_current_actor()
	if current_actor != _player_character:
		return

	# 清除选择状态
	_clear_selection()

	# 结束回合
	game_state.pass_turn()


# ==================== 目标选择 ====================

func _enter_target_selection_for_card() -> void:
	if game_state == null or selected_card_index < 0:
		return

	# 获取目标列表
	var targets: Array = game_state.get_targets_for(_player_character)

	if targets.is_empty():
		# 无目标，取消选择
		_clear_selection()
		return

	if targets.size() == 1:
		# 单目标，直接执行
		_execute_action(targets[0].get("id", ""))
		return

	# 多目标，进入目标选择模式
	_enter_target_selection(targets)


func _enter_target_selection_for_skill() -> void:
	if game_state == null or selected_skill_index < 0 or selected_card_index < 0:
		return

	# 获取目标列表
	var targets: Array = game_state.get_targets_for(_player_character)

	if targets.is_empty():
		_clear_selection()
		return

	if targets.size() == 1:
		_execute_action(targets[0].get("id", ""))
		return

	_enter_target_selection(targets)


func _enter_target_selection(targets: Array) -> void:
	is_target_selection_mode = true
	valid_targets = targets
	selected_target_id = ""

	# 设置UI目标选择模式
	if battle_ui and battle_ui.has_method("set_target_selection_mode"):
		battle_ui.set_target_selection_mode(true)

	target_selection_changed.emit(true)


func _set_target_highlight(target_id: String) -> void:
	if battle_ui == null:
		return

	# 更新目标高亮
	var panels: Dictionary = battle_ui.character_panels if battle_ui.has("character_panels") else {}
	for char_id: String in panels:
		var panel = panels[char_id]
		if panel and panel.has_method("set_targeted"):
			panel.set_targeted(char_id == target_id)


func _execute_action(target_id: String) -> void:
	if game_state == null:
		return

	var result: Dictionary

	if selected_skill_index >= 0 and selected_card_index >= 0:
		# 使用武功
		result = game_state.use_skill(selected_skill_index, selected_card_index)
	elif selected_card_index >= 0:
		# 使用基础招式
		result = game_state.use_basic_card(selected_card_index)

	_clear_selection()

	if not result.get("success", false):
		var error: String = result.get("error", "unknown_error")
		_add_log("行动失败: %s" % error, LayoutConstants.COLOR_TEXT_RED)


func confirm_action() -> void:
	if not is_target_selection_mode or selected_target_id.is_empty():
		return

	_execute_action(selected_target_id)


func cancel_action() -> void:
	_clear_selection()


func _clear_selection() -> void:
	selected_card_index = -1
	selected_skill_index = -1
	is_target_selection_mode = false
	valid_targets = []
	selected_target_id = ""

	# 清除UI目标选择模式
	if battle_ui and battle_ui.has_method("set_target_selection_mode"):
		battle_ui.set_target_selection_mode(false)

	# 清除目标高亮
	if battle_ui:
		var panels: Dictionary = battle_ui.character_panels if battle_ui.has("character_panels") else {}
		for panel in panels.values():
			if panel and panel.has_method("set_targeted"):
				panel.set_targeted(false)

	target_selection_changed.emit(false)


# ==================== 辅助方法 ====================

func _refresh_ui() -> void:
	if battle_ui and battle_ui.has_method("refresh"):
		battle_ui.refresh()
	ui_refresh_requested.emit()


func _add_log(text: String, color: Color = Color.WHITE) -> void:
	if battle_ui and battle_ui.has_method("add_battle_log"):
		battle_ui.add_battle_log(text, color)


func _show_damage_number(target: Dictionary, amount: int) -> void:
	# TODO: 实现伤害数字显示
	pass


func _find_card_index(instance_id: String) -> int:
	if _player_character.is_empty():
		return -1

	var hand: Array = _player_character.get("hand", [])
	for i in range(hand.size()):
		var card: CardState = hand[i]
		if card and card.instance_id == instance_id:
			return i

	return -1


func _find_skill_index(skill_id: String) -> int:
	if _player_character.is_empty():
		return -1

	var skills: Array = _player_character.get("skills", [])
	for i in range(skills.size()):
		var skill: SkillState = skills[i]
		if skill and skill.skill_id == skill_id:
			return i

	return -1


# ==================== 公共API ====================

## 获取当前选中的卡牌索引
func get_selected_card_index() -> int:
	return selected_card_index


## 获取当前选中的技能索引
func get_selected_skill_index() -> int:
	return selected_skill_index


## 是否处于目标选择模式
func is_in_target_selection() -> bool:
	return is_target_selection_mode


## 是否可以确认行动
func can_confirm() -> bool:
	return is_target_selection_mode and not selected_target_id.is_empty()


## 是否可以取消行动
func can_cancel() -> bool:
	return selected_card_index >= 0 or selected_skill_index >= 0 or is_target_selection_mode
