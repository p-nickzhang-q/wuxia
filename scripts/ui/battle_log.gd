## battle_log.gd - 战斗日志组件
## 显示战斗中的事件记录，支持不同类型的消息和颜色

class_name BattleLog
extends ScrollContainer

# ==================== 导出属性 ====================
## 最大日志条目数
@export var max_entries: int = 100

# ==================== 消息颜色常量 ====================
## 默认消息颜色
const COLOR_DEFAULT: Color = Color.WHITE
## 伤害消息颜色（红色）
const COLOR_DAMAGE: Color = Color(1.0, 0.3, 0.3, 1.0)
## 治疗消息颜色（绿色）
const COLOR_HEAL: Color = Color(0.3, 1.0, 0.3, 1.0)
## 护盾消息颜色（蓝色）
const COLOR_SHIELD: Color = Color(0.3, 0.7, 1.0, 1.0)
## 回合消息颜色（黄色）
const COLOR_TURN: Color = Color(1.0, 1.0, 0.3, 1.0)
## 死亡消息颜色（灰色）
const COLOR_DEATH: Color = Color(0.6, 0.6, 0.6, 1.0)

# ==================== 子节点引用 ====================
## 日志容器
@onready var log_container: VBoxContainer = $LogContainer

# ==================== 内部变量 ====================
## 当前日志条目数
var _entry_count: int = 0


func _ready() -> void:
	# 确保滚动条在底部
	horizontal_scroll_mode = ScrollContainer.SCROLL_MODE_DISABLED
	vertical_scroll_mode = ScrollContainer.SCROLL_MODE_AUTO


## 添加普通消息
## @param text: 消息文本
## @param color: 消息颜色（可选，默认白色）
func add_message(text: String, color: Color = COLOR_DEFAULT) -> void:
	_create_entry(text, color)


## 添加伤害消息
## @param source: 伤害来源角色名
## @param target: 受伤角色名
## @param amount: 伤害数值
## @param damage_type: 伤害类型（可选，如"内伤"、"外伤"）
func add_damage_message(source: String, target: String, amount: int, damage_type: String = "") -> void:
	var text: String
	if damage_type.is_empty():
		text = "%s 对 %s 造成 %d 点伤害" % [source, target, amount]
	else:
		text = "%s 对 %s 造成 %d 点%s伤害" % [source, target, amount, damage_type]
	_create_entry(text, COLOR_DAMAGE)


## 添加治疗消息
## @param target: 被治疗角色名
## @param amount: 治疗数值
## @param source: 治疗来源（可选，如"内功"、"药品"）
func add_heal_message(target: String, amount: int, source: String = "") -> void:
	var text: String
	if source.is_empty():
		text = "%s 恢复了 %d 点生命" % [target, amount]
	else:
		text = "%s 通过%s恢复了 %d 点生命" % [target, source, amount]
	_create_entry(text, COLOR_HEAL)


## 添加护盾消息
## @param target: 获得护盾的角色名
## @param amount: 护盾数值
## @param source: 护盾来源（可选）
func add_shield_message(target: String, amount: int, source: String = "") -> void:
	var text: String
	if source.is_empty():
		text = "%s 获得了 %d 点护盾" % [target, amount]
	else:
		text = "%s 通过%s获得了 %d 点护盾" % [target, source, amount]
	_create_entry(text, COLOR_SHIELD)


## 添加回合消息
## @param turn_number: 回合数
## @param actor_name: 当前行动角色名
func add_turn_message(turn_number: int, actor_name: String) -> void:
	var text: String = "=== 第 %d 回合 === %s 行动" % [turn_number, actor_name]
	_create_entry(text, COLOR_TURN)


## 添加死亡消息
## @param character_name: 死亡角色名
## @param killer: 击杀者（可选）
func add_death_message(character_name: String, killer: String = "") -> void:
	var text: String
	if killer.is_empty():
		text = "%s 已阵亡" % character_name
	else:
		text = "%s 被 %s 击败" % [character_name, killer]
	_create_entry(text, COLOR_DEATH)


## 清空日志
func clear_log() -> void:
	if not log_container:
		return

	# 删除所有子节点
	for child in log_container.get_children():
		child.queue_free()

	_entry_count = 0


## 滚动到底部
func scroll_to_bottom() -> void:
	# 延迟一帧执行，确保布局已更新
	call_deferred("_do_scroll_to_bottom")


## 实际执行滚动
func _do_scroll_to_bottom() -> void:
	if not is_inside_tree():
		return

	var scrollbar: VScrollBar = get_v_scroll_bar()
	if scrollbar:
		scrollbar.value = scrollbar.max_value


## 创建日志条目
## @param text: 条目文本
## @param color: 条目颜色
func _create_entry(text: String, color: Color) -> void:
	if not log_container:
		push_warning("BattleLog: log_container not found")
		return

	# 创建标签
	var entry := Label.new()
	entry.text = text
	entry.add_theme_color_override("font_color", color)
	entry.add_theme_font_size_override("font_size", 12)
	entry.autowrap_mode = TextServer.AUTOWRAP_WORD_SMART
	entry.size_flags_horizontal = Control.SIZE_EXPAND_FILL
	entry.custom_minimum_size.y = 20  # 设置最小高度避免重叠

	# 添加到容器
	log_container.add_child(entry)
	_entry_count += 1

	# 检查是否超过最大条目数
	_prune_old_entries()

	# 延迟滚动到底部，确保布局已更新
	call_deferred("scroll_to_bottom")


## 删除过旧的条目
func _prune_old_entries() -> void:
	if not log_container:
		return

	# 删除超过最大数量的旧条目
	while _entry_count > max_entries:
		var first_child: Node = log_container.get_child(0)
		if first_child:
			first_child.queue_free()
			_entry_count -= 1
		else:
			break
