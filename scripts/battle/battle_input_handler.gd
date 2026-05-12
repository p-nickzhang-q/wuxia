## battle_input_handler.gd - 战斗输入处理器
## 管理玩家输入状态和操作流程
## 实现设计文档: Task 21 - 输入处理器

class_name BattleInputHandler
extends RefCounted

# ==================== 信号 ====================
## 请求执行行动
signal action_requested(action: Dictionary)

## 目标选择开始
signal target_selection_started(targets: Array)

## 目标已选择
signal target_selected(target)

## 状态已改变
signal state_changed(new_state: int)

# ==================== 枚举 ====================
## 输入状态
enum InputState {
	NONE,              ## 无状态/空闲
	SELECTING_CARD,    ## 选择卡牌中
	SELECTING_SKILL,   ## 选择武功中
	SELECTING_MEDIUM,  ## 选择媒介卡牌中
	SELECTING_TARGET,  ## 选择目标中
	WAITING_AI         ## 等待AI行动
}

# ==================== 属性 ====================
## 当前输入状态
var current_state: InputState = InputState.NONE

## 当前选中的卡牌（手牌索引）
var selected_card: int = -1

## 当前选中的武功（武功列表索引）
var selected_skill: int = -1

## 有效目标列表
var valid_targets: Array = []

## 游戏状态引用（无类型参数，因为 GameState 可能未加载）
var game_state = null

## 当前行动角色
var _current_actor = null

## 媒介卡牌候选列表（用于武功）
var _medium_candidates: Array[int] = []

# ==================== 状态名称映射 ====================
const STATE_NAMES: Dictionary = {
	InputState.NONE: "无状态",
	InputState.SELECTING_CARD: "选择卡牌",
	InputState.SELECTING_SKILL: "选择武功",
	InputState.SELECTING_MEDIUM: "选择媒介",
	InputState.SELECTING_TARGET: "选择目标",
	InputState.WAITING_AI: "等待AI"
}

# ==================== 核心方法 ====================

## 初始化处理器
## @param gs: GameState 引用
func setup(gs) -> void:
	game_state = gs
	reset()


## 重置处理器状态
func reset() -> void:
	current_state = InputState.NONE
	selected_card = -1
	selected_skill = -1
	valid_targets.clear()
	_current_actor = null
	_medium_candidates.clear()


## 设置当前状态
## @param new_state: 新的 InputState
func set_state(new_state: InputState) -> void:
	if current_state == new_state:
		return

	var old_state := current_state
	current_state = new_state

	# 清理旧状态相关数据
	match old_state:
		InputState.SELECTING_CARD, InputState.SELECTING_SKILL:
			selected_card = -1
			selected_skill = -1
		InputState.SELECTING_MEDIUM:
			_medium_candidates.clear()
		InputState.SELECTING_TARGET:
			valid_targets.clear()

	# 发出状态改变信号
	state_changed.emit(new_state)


## 获取状态名称
func get_state_name() -> String:
	return STATE_NAMES.get(current_state, "未知")


## 处理卡牌点击
## @param card_index: 手牌中的卡牌索引
## @return: 是否成功处理
func handle_card_click(card_index: int) -> bool:
	# 检查游戏状态是否有效
	if game_state == null:
		return false

	# 获取当前行动角色
	var actor = game_state.get_current_actor()
	if actor == null:
		return false

	# 根据当前状态处理
	match current_state:
		InputState.NONE, InputState.SELECTING_CARD:
			return _handle_card_selection(card_index, actor)
		InputState.SELECTING_MEDIUM:
			return _handle_medium_selection(card_index, actor)
		_:
			return false


## 处理武功点击
## @param skill_index: 武功列表中的索引
## @return: 是否成功处理
func handle_skill_click(skill_index: int) -> bool:
	# 检查游戏状态是否有效
	if game_state == null:
		return false

	# 获取当前行动角色
	var actor = game_state.get_current_actor()
	if actor == null:
		return false

	# 只在选择武功状态下处理
	if current_state != InputState.NONE and current_state != InputState.SELECTING_SKILL:
		return false

	# 验证武功索引
	if skill_index < 0 or skill_index >= actor.skills.size():
		return false

	var skill = actor.skills[skill_index]

	# 检查武功是否可用
	if not skill.is_available(actor.current_mp, actor.current_agility, actor.hand):
		return false

	# 记录选中的武功
	selected_skill = skill_index
	_current_actor = actor

	# 获取可用媒介卡牌
	_medium_candidates = skill.get_available_card_indices(actor.hand)

	# 如果需要选择媒介卡牌
	if _medium_candidates.size() > 1:
		set_state(InputState.SELECTING_MEDIUM)
		return true
	elif _medium_candidates.size() == 1:
		# 只有一张媒介卡牌，自动选择
		selected_card = _medium_candidates[0]
		return _proceed_to_target_or_execute(actor, skill)
	else:
		# 没有媒介卡牌（不应该发生，因为 is_available 已检查）
		return false


## 处理目标点击
## @param target_index: valid_targets 中的索引
## @return: 是否成功处理
func handle_target_click(target_index: int) -> bool:
	# 只在选择目标状态下处理
	if current_state != InputState.SELECTING_TARGET:
		return false

	# 验证目标索引
	if target_index < 0 or target_index >= valid_targets.size():
		return false

	var target = valid_targets[target_index]

	# 发出目标选择信号
	target_selected.emit(target)

	# 执行行动
	_execute_action(target)

	return true


## 处理结束回合
## @return: 是否成功处理
func handle_end_turn() -> bool:
	# 检查游戏状态是否有效
	if game_state == null:
		return false

	# 只在可操作状态下处理
	match current_state:
		InputState.NONE, InputState.SELECTING_CARD, InputState.SELECTING_SKILL:
			pass
		_:
			return false

	# 发出结束回合行动请求
	action_requested.emit({
		"type": "end_turn"
	})

	# 重置状态
	reset()

	return true


# ==================== 内部方法 ====================

## 处理卡牌选择
func _handle_card_selection(card_index: int, actor) -> bool:
	# 验证卡牌索引
	if card_index < 0 or card_index >= actor.hand.size():
		return false

	var card = actor.hand[card_index]

	# 检查轻功是否足够
	if card.agility_cost > actor.current_agility:
		return false

	# 记录选中的卡牌
	selected_card = card_index
	selected_skill = -1  # 清除武功选择
	_current_actor = actor

	# 如果需要目标，进入目标选择
	if card.requires_target:
		return _start_target_selection(actor)
	else:
		# 不需要目标，直接执行
		_execute_action(null)
		return true


## 处理媒介卡牌选择
func _handle_medium_selection(card_index: int, actor) -> bool:
	# 验证卡牌是否在候选列表中
	if card_index not in _medium_candidates:
		return false

	# 记录选中的媒介卡牌
	selected_card = card_index

	# 获取选中的武功
	var skill = actor.skills[selected_skill]

	# 继续目标选择或执行
	return _proceed_to_target_or_execute(actor, skill)


## 开始目标选择
func _start_target_selection(actor) -> bool:
	# 获取有效目标
	valid_targets = game_state.get_targets_for(actor)

	if valid_targets.is_empty():
		return false

	# 进入目标选择状态
	set_state(InputState.SELECTING_TARGET)

	# 发出目标选择开始信号
	target_selection_started.emit(valid_targets)

	return true


## 继续到目标选择或直接执行
func _proceed_to_target_or_execute(actor, skill) -> bool:
	# 如果武功需要目标
	if skill.requires_target:
		return _start_target_selection(actor)
	else:
		# 不需要目标，直接执行
		_execute_action(null)
		return true


## 执行行动
func _execute_action(target) -> void:
	var action := {
		"type": "unknown",
		"card_index": selected_card,
		"skill_index": selected_skill,
		"target": target
	}

	# 确定行动类型
	if selected_skill >= 0:
		action.type = "use_skill"
	elif selected_card >= 0:
		action.type = "play_card"
	else:
		# 无有效行动
		reset()
		return

	# 发出行动请求信号
	action_requested.emit(action)

	# 重置状态
	reset()


## 进入等待AI状态
func enter_waiting_ai() -> void:
	set_state(InputState.WAITING_AI)


## 退出等待AI状态
func exit_waiting_ai() -> void:
	set_state(InputState.NONE)


## 检查是否可以操作
func can_interact() -> bool:
	match current_state:
		InputState.NONE, InputState.SELECTING_CARD, InputState.SELECTING_SKILL:
			return true
		_:
			return false


## 获取当前选中卡牌
func get_selected_card():
	if game_state == null or selected_card < 0:
		return null

	var actor = game_state.get_current_actor()
	if actor == null or selected_card >= actor.hand.size():
		return null

	return actor.hand[selected_card]


## 获取当前选中武功
func get_selected_skill():
	if game_state == null or selected_skill < 0:
		return null

	var actor = game_state.get_current_actor()
	if actor == null or selected_skill >= actor.skills.size():
		return null

	return actor.skills[selected_skill]


## 获取媒介卡牌候选列表
func get_medium_candidates() -> Array[int]:
	return _medium_candidates.duplicate()


## 检查是否在选择媒介状态
func is_selecting_medium() -> bool:
	return current_state == InputState.SELECTING_MEDIUM


## 检查是否在选择目标状态
func is_selecting_target() -> bool:
	return current_state == InputState.SELECTING_TARGET


## 取消当前选择
func cancel_selection() -> void:
	match current_state:
		InputState.SELECTING_CARD, InputState.SELECTING_SKILL:
			selected_card = -1
			selected_skill = -1
			set_state(InputState.NONE)
		InputState.SELECTING_MEDIUM:
			selected_card = -1
			_medium_candidates.clear()
			set_state(InputState.SELECTING_SKILL)
		InputState.SELECTING_TARGET:
			valid_targets.clear()
			# 返回到卡牌或武功选择状态
			if selected_skill >= 0:
				set_state(InputState.SELECTING_SKILL)
			else:
				set_state(InputState.SELECTING_CARD)
