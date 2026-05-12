## battle_animator.gd - 战斗动画器
## 管理战斗中的动画播放和编排
## 实现设计文档: 战斗动画系统

class_name BattleAnimator
extends RefCounted

# ==================== 信号 ====================
## 动画开始播放
signal animation_started(animation_type: String, data: Dictionary)

## 动画播放完成
signal animation_completed(animation_type: String, data: Dictionary)

## 动画序列开始
signal sequence_started(sequence_id: String)

## 动画序列完成
signal sequence_completed(sequence_id: String)

# ==================== 枚举 ====================
## 动画类型
enum AnimationType {
	NONE,               ## 无动画
	CARD_PLAY,          ## 打出卡牌
	SKILL_USE,          ## 使用武功
	DAMAGE,             ## 造成伤害
	HEAL,               ## 治疗
	SHIELD_GAIN,        ## 获得护盾
	MP_CHANGE,          ## 内力变化
	AGILITY_CHANGE,     ## 轻功变化
	TURN_START,         ## 回合开始
	TURN_END,           ## 回合结束
	ACTOR_SWITCH,       ## 行动方切换
	BATTLE_START,       ## 战斗开始
	BATTLE_END,         ## 战斗结束
	CARD_DRAW,          ## 抽牌
	CARD_DISCARD,       ## 弃牌
	DECK_SHUFFLE,       ## 洗牌
	BUFF_APPLY,         ## 应用增益
	DEBUFF_APPLY,       ## 应用减益
	DEATH,              ## 角色死亡
	VICTORY,            ## 胜利
	DEFEAT              ## 失败
}

## 动画优先级
enum AnimationPriority {
	LOW,       ## 低优先级（背景效果）
	NORMAL,    ## 普通优先级（默认）
	HIGH,      ## 高优先级（重要效果）
	CRITICAL   ## 关键优先级（必须立即播放）
}

# ==================== 属性 ====================
## 是否正在播放动画
var is_playing: bool = false

## 当前动画队列
var _animation_queue: Array[Dictionary] = []

## 当前播放的动画
var _current_animation: Dictionary = {}

## 动画序列计数器
var _sequence_counter: int = 0

## 是否暂停队列处理
var _paused: bool = false

## 默认动画持续时间（秒）
var default_duration: float = 0.5

## 伤害动画持续时间
var damage_duration: float = 0.3

## 治疗动画持续时间
var heal_duration: float = 0.4

## 卡牌动画持续时间
var card_duration: float = 0.25

## 回合切换动画持续时间
var turn_duration: float = 0.6

# ==================== 核心方法 ====================

## 初始化动画器
func setup() -> void:
	clear_queue()
	is_playing = false
	_current_animation = {}
	_sequence_counter = 0
	_paused = false


## 清空动画队列
func clear_queue() -> void:
	_animation_queue.clear()


## 暂停队列处理
func pause() -> void:
	_paused = true


## 恢复队列处理
func resume() -> void:
	_paused = false
	_process_queue()


## 添加动画到队列
## @param type: AnimationType 枚举值
## @param data: 动画数据字典
## @param priority: AnimationPriority 枚举值
## @return: 动画ID
func queue_animation(type: AnimationType, data: Dictionary = {}, priority: AnimationPriority = AnimationPriority.NORMAL) -> String:
	var animation_id := _generate_animation_id()
	var animation := {
		"id": animation_id,
		"type": type,
		"data": data,
		"priority": priority,
		"duration": _get_duration_for_type(type),
		"sequence_id": ""
	}

	# 根据优先级插入队列
	_insert_by_priority(animation)

	# 如果没有在播放，开始处理队列
	if not is_playing and not _paused:
		_process_queue()

	return animation_id


## 立即播放动画（跳过队列）
## @param type: AnimationType 枚举值
## @param data: 动画数据字典
func play_immediate(type: AnimationType, data: Dictionary = {}) -> void:
	# 暂停当前队列处理
	_paused = true

	# 播放动画
	_play_animation(type, data, _get_duration_for_type(type))


## 开始动画序列
## @return: 序列ID
func begin_sequence() -> String:
	_sequence_counter += 1
	var sequence_id := "seq_%d" % _sequence_counter
	sequence_started.emit(sequence_id)
	return sequence_id


## 结束动画序列
## @param sequence_id: 序列ID
func end_sequence(sequence_id: String) -> void:
	# 标记队列中属于该序列的动画
	for animation in _animation_queue:
		if animation.sequence_id == sequence_id:
			animation.sequence_id = ""

	sequence_completed.emit(sequence_id)


## 将动画添加到当前序列
## @param type: AnimationType 枚举值
## @param data: 动画数据字典
## @param sequence_id: 序列ID
## @param priority: AnimationPriority 枚举值
## @return: 动画ID
func queue_in_sequence(type: AnimationType, data: Dictionary, sequence_id: String, priority: AnimationPriority = AnimationPriority.NORMAL) -> String:
	var animation_id := _generate_animation_id()
	var animation := {
		"id": animation_id,
		"type": type,
		"data": data,
		"priority": priority,
		"duration": _get_duration_for_type(type),
		"sequence_id": sequence_id
	}

	_insert_by_priority(animation)

	if not is_playing and not _paused:
		_process_queue()

	return animation_id


## 等待所有动画完成
## @return: 是否成功等待（如果有动画在播放）
func wait_for_completion() -> bool:
	return is_playing or not _animation_queue.is_empty()


# ==================== 便捷方法 ====================

## 播放打出卡牌动画
## @param source: 出牌角色
## @param card: 卡牌数据
## @param target: 目标角色（可选）
func play_card_animation(source, card, target = null) -> String:
	var data := {
		"source": source,
		"card": card,
		"target": target
	}
	return queue_animation(AnimationType.CARD_PLAY, data)


## 播放武功使用动画
## @param source: 使用者
## @param skill: 武功数据
## @param target: 目标角色
func play_skill_animation(source, skill, target) -> String:
	var data := {
		"source": source,
		"skill": skill,
		"target": target
	}
	return queue_animation(AnimationType.SKILL_USE, data, AnimationPriority.HIGH)


## 播放伤害动画
## @param target: 受伤角色
## @param amount: 伤害数值
## @param source: 伤害来源（可选）
func play_damage_animation(target, amount: int, source = null) -> String:
	var data := {
		"target": target,
		"amount": amount,
		"source": source
	}
	return queue_animation(AnimationType.DAMAGE, data, AnimationPriority.HIGH)


## 播放治疗动画
## @param target: 被治疗角色
## @param amount: 治疗数值
## @param source: 治疗来源（可选）
func play_heal_animation(target, amount: int, source = null) -> String:
	var data := {
		"target": target,
		"amount": amount,
		"source": source
	}
	return queue_animation(AnimationType.HEAL, data)


## 播放护盾获得动画
## @param target: 获得护盾的角色
## @param amount: 护盾数值
func play_shield_animation(target, amount: int) -> String:
	var data := {
		"target": target,
		"amount": amount
	}
	return queue_animation(AnimationType.SHIELD_GAIN, data)


## 播放内力变化动画
## @param target: 内力变化的角色
## @param amount: 变化数值（正为增加，负为减少）
func play_mp_change_animation(target, amount: int) -> String:
	var data := {
		"target": target,
		"amount": amount
	}
	return queue_animation(AnimationType.MP_CHANGE, data)


## 播放轻功变化动画
## @param target: 轻功变化的角色
## @param amount: 变化数值
func play_agility_change_animation(target, amount: int) -> String:
	var data := {
		"target": target,
		"amount": amount
	}
	return queue_animation(AnimationType.AGILITY_CHANGE, data)


## 播放回合开始动画
## @param turn_number: 回合数
## @param first_actor: 先手角色
func play_turn_start_animation(turn_number: int, first_actor) -> String:
	var data := {
		"turn_number": turn_number,
		"first_actor": first_actor
	}
	return queue_animation(AnimationType.TURN_START, data, AnimationPriority.HIGH)


## 播放行动方切换动画
## @param old_actor: 原行动方
## @param new_actor: 新行动方
func play_actor_switch_animation(old_actor, new_actor) -> String:
	var data := {
		"old_actor": old_actor,
		"new_actor": new_actor
	}
	return queue_animation(AnimationType.ACTOR_SWITCH, data, AnimationPriority.HIGH)


## 播放抽牌动画
## @param actor: 抽牌角色
## @param cards: 抽到的卡牌列表
func play_draw_animation(actor, cards: Array) -> String:
	var data := {
		"actor": actor,
		"cards": cards
	}
	return queue_animation(AnimationType.CARD_DRAW, data)


## 播放弃牌动画
## @param actor: 弃牌角色
## @param cards: 弃掉的卡牌列表
func play_discard_animation(actor, cards: Array) -> String:
	var data := {
		"actor": actor,
		"cards": cards
	}
	return queue_animation(AnimationType.CARD_DISCARD, data)


## 播放战斗开始动画
## @param player: 玩家角色
## @param enemy: 敌人角色
func play_battle_start_animation(player, enemy) -> String:
	var data := {
		"player": player,
		"enemy": enemy
	}
	return queue_animation(AnimationType.BATTLE_START, data, AnimationPriority.CRITICAL)


## 播放战斗结束动画
## @param winner: 胜利者
## @param loser: 失败者
func play_battle_end_animation(winner, loser) -> String:
	var data := {
		"winner": winner,
		"loser": loser
	}
	return queue_animation(AnimationType.BATTLE_END, data, AnimationPriority.CRITICAL)


## 播放死亡动画
## @param character: 死亡角色
func play_death_animation(character) -> String:
	var data := {
		"character": character
	}
	return queue_animation(AnimationType.DEATH, data, AnimationPriority.CRITICAL)


# ==================== 内部方法 ====================

## 生成动画ID
func _generate_animation_id() -> String:
	return "anim_%d_%d" % [Time.get_ticks_msec(), randi() % 10000]


## 根据优先级插入队列
func _insert_by_priority(animation: Dictionary) -> void:
	var inserted := false
	for i in range(_animation_queue.size()):
		if animation.priority > _animation_queue[i].priority:
			_animation_queue.insert(i, animation)
			inserted = true
			break

	if not inserted:
		_animation_queue.append(animation)


## 获取动画类型对应的持续时间
func _get_duration_for_type(type: AnimationType) -> float:
	match type:
		AnimationType.DAMAGE:
			return damage_duration
		AnimationType.HEAL:
			return heal_duration
		AnimationType.CARD_PLAY, AnimationType.CARD_DRAW, AnimationType.CARD_DISCARD:
			return card_duration
		AnimationType.TURN_START, AnimationType.TURN_END, AnimationType.ACTOR_SWITCH:
			return turn_duration
		AnimationType.BATTLE_START, AnimationType.BATTLE_END:
			return 1.0
		AnimationType.DEATH:
			return 0.8
		_:
			return default_duration


## 处理动画队列
func _process_queue() -> void:
	if _paused or is_playing or _animation_queue.is_empty():
		return

	# 取出下一个动画
	_current_animation = _animation_queue.pop_front()

	# 播放动画
	_play_animation(
		_current_animation.type,
		_current_animation.data,
		_current_animation.duration
	)


## 播放动画
func _play_animation(type: AnimationType, data: Dictionary, duration: float) -> void:
	is_playing = true

	var type_name := _get_type_name(type)
	animation_started.emit(type_name, data)

	# 模拟动画播放时间
	# 实际实现中，这里会调用 UI 层的动画系统
	# 使用 call_deferred 确保不阻塞主线程
	_schedule_completion(type, data, duration)


## 调度动画完成
func _schedule_completion(type: AnimationType, data: Dictionary, duration: float) -> void:
	# 使用 SceneTree 创建延迟调用
	# 由于 RefCounted 无法直接访问 SceneTree，需要通过信号通知外部处理
	# 这里发出一个带持续时间的事件，由外部 UI 系统处理
	var completion_data := {
		"type": type,
		"type_name": _get_type_name(type),
		"data": data,
		"duration": duration
	}

	# 标记为等待完成
	# 外部系统需要在动画完成后调用 on_animation_finished
	_current_animation["completion_data"] = completion_data


## 动画完成回调（由外部调用）
func on_animation_finished() -> void:
	if not is_playing:
		return

	var type: AnimationType = _current_animation.get("type", AnimationType.NONE)
	var data: Dictionary = _current_animation.get("data", {})
	var type_name := _get_type_name(type)

	is_playing = false
	animation_completed.emit(type_name, data)

	# 检查是否属于某个序列
	var sequence_id: String = _current_animation.get("sequence_id", "")
	if not sequence_id.is_empty():
		# 检查序列是否还有未完成的动画
		var has_more := false
		for anim in _animation_queue:
			if anim.sequence_id == sequence_id:
				has_more = true
				break

		if not has_more:
			sequence_completed.emit(sequence_id)

	_current_animation = {}

	# 继续处理队列
	if not _paused:
		_process_queue()


## 获取动画类型名称
func _get_type_name(type: AnimationType) -> String:
	match type:
		AnimationType.NONE:
			return "none"
		AnimationType.CARD_PLAY:
			return "card_play"
		AnimationType.SKILL_USE:
			return "skill_use"
		AnimationType.DAMAGE:
			return "damage"
		AnimationType.HEAL:
			return "heal"
		AnimationType.SHIELD_GAIN:
			return "shield_gain"
		AnimationType.MP_CHANGE:
			return "mp_change"
		AnimationType.AGILITY_CHANGE:
			return "agility_change"
		AnimationType.TURN_START:
			return "turn_start"
		AnimationType.TURN_END:
			return "turn_end"
		AnimationType.ACTOR_SWITCH:
			return "actor_switch"
		AnimationType.BATTLE_START:
			return "battle_start"
		AnimationType.BATTLE_END:
			return "battle_end"
		AnimationType.CARD_DRAW:
			return "card_draw"
		AnimationType.CARD_DISCARD:
			return "card_discard"
		AnimationType.DECK_SHUFFLE:
			return "deck_shuffle"
		AnimationType.BUFF_APPLY:
			return "buff_apply"
		AnimationType.DEBUFF_APPLY:
			return "debuff_apply"
		AnimationType.DEATH:
			return "death"
		AnimationType.VICTORY:
			return "victory"
		AnimationType.DEFEAT:
			return "defeat"
		_:
			return "unknown"


## 获取队列中的动画数量
func get_queue_size() -> int:
	return _animation_queue.size()


## 检查是否有指定类型的动画在队列中
func has_animation_type(type: AnimationType) -> bool:
	for animation in _animation_queue:
		if animation.type == type:
			return true
	return false


## 移除指定ID的动画
## @param animation_id: 动画ID
## @return: 是否成功移除
func remove_animation(animation_id: String) -> bool:
	for i in range(_animation_queue.size()):
		if _animation_queue[i].id == animation_id:
			_animation_queue.remove_at(i)
			return true
	return false


## 获取当前动画信息
func get_current_animation_info() -> Dictionary:
	return _current_animation.duplicate()


## 设置动画持续时间
## @param type: AnimationType 枚举值
## @param duration: 持续时间（秒）
func set_duration_for_type(type: AnimationType, duration: float) -> void:
	match type:
		AnimationType.DAMAGE:
			damage_duration = duration
		AnimationType.HEAL:
			heal_duration = duration
		AnimationType.CARD_PLAY, AnimationType.CARD_DRAW, AnimationType.CARD_DISCARD:
			card_duration = duration
		AnimationType.TURN_START, AnimationType.TURN_END, AnimationType.ACTOR_SWITCH:
			turn_duration = duration
