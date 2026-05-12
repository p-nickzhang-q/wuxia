## types.gd - 枚举和常量定义
## 此文件包含游戏核心类型定义，不依赖其他游戏模块

class_name Types
extends RefCounted

# ==================== 卡牌类型 ====================
## 卡牌类型 - 对应不同武功媒介
enum CardType {
	EMPTY_HAND,    ## 空手类（拳击、肘击）
	SHORT_WEAPON,  ## 短兵类（刺击）
	LONG_WEAPON,   ## 长兵类（横扫、直刺）
	LEG,           ## 腿法类（前踢、扫腿）
	ANY            ## 任意类型
}

# ==================== 触发时机 ====================
## 内功触发时机
enum TriggerTiming {
	TURN_START,      ## 回合开始
	TURN_END,        ## 回合结束
	ON_DAMAGE,      ## 造成伤害时
	ON_TAKE_DAMAGE, ## 受到伤害时
	ON_PLAY_CARD,   ## 使用基础招式时
	ON_SKILL_USE    ## 使用武功招式时
}

# ==================== 游戏阶段 ====================
## 战斗阶段
enum GamePhase {
	SETUP,             ## 初始化阶段
	SELECTING,         ## 选择行动阶段
	SELECTING_TARGET,  ## 选择目标阶段
	ACTING,            ## 执行行动阶段
	GAME_OVER          ## 游戏结束
}

# ==================== 战斗模式 ====================
## 战斗模式
enum BattleMode {
	TEAM,          ## 队伍对战
	FREE_FOR_ALL   ## 自由混战
}

# ==================== 武功等级 ====================
## 武功等级
enum SkillLevel {
	BEGINNER,     ## 初级
	INTERMEDIATE, ## 中级
	ADVANCED,     ## 高级
	MASTER        ## 大成
}

# ==================== 门派 ====================
## 门派枚举
enum Faction {
	BEGGAR,   ## 丐帮
	SHAOLIN,  ## 少林
	WUDANG,   ## 武当
	EMEI,     ## 峨眉
	HUASHAN,  ## 华山
	MOZU,     ## 魔族
	GUMU,     ## 古墓
	TIANSHAN, ## 天山
	DALI,     ## 大理
	XIAKE,    ## 侠客岛
	QINGCHENG,## 青城
	RIVERSIDE ## 江水帮
}

# ==================== 效果类型 ====================
## 效果类型
enum EffectType {
	DAMAGE,            ## 造成伤害
	SHIELD,            ## 获得护盾
	SELF_DAMAGE,       ## 自伤
	DRAIN_MP,          ## 吸取内力
	REMOVE_MP,         ## 消除内力（造成等量伤害）
	DRAIN_HP,          ## 吸取生命
	DOT,               ## 持续伤害
	DEBUFF_AGILITY,    ## 降低轻功
	DISABLE_CARD_TYPE, ## 禁用卡牌类型
	EXTRA_ACTION,      ## 额外行动
	MIMIC              ## 模仿上一次武功
}

# ==================== 常量 ====================
## 默认手牌上限
const MAX_HAND_SIZE: int = 10

## 默认抽牌数
const DEFAULT_DRAW_COUNT: int = 5

## 默认轻功消耗
const DEFAULT_AGILITY_COST: int = 1

## 默认技能轻功消耗
const DEFAULT_SKILL_AGILITY_COST: int = 2

## 卡牌类型名称映射
const CARD_TYPE_NAMES: Dictionary = {
	CardType.EMPTY_HAND: "空手",
	CardType.SHORT_WEAPON: "短兵",
	CardType.LONG_WEAPON: "长兵",
	CardType.LEG: "腿法",
	CardType.ANY: "任意"
}

## 触发时机名称映射
const TRIGGER_TIMING_NAMES: Dictionary = {
	TriggerTiming.TURN_START: "回合开始",
	TriggerTiming.TURN_END: "回合结束",
	TriggerTiming.ON_DAMAGE: "造成伤害时",
	TriggerTiming.ON_TAKE_DAMAGE: "受到伤害时",
	TriggerTiming.ON_PLAY_CARD: "使用基础招式时",
	TriggerTiming.ON_SKILL_USE: "使用武功招式时"
}

## 门派名称映射
const FACTION_NAMES: Dictionary = {
	Faction.BEGGAR: "丐帮",
	Faction.SHAOLIN: "少林",
	Faction.WUDANG: "武当",
	Faction.EMEI: "峨眉",
	Faction.HUASHAN: "华山",
	Faction.MOZU: "魔族",
	Faction.GUMU: "古墓",
	Faction.TIANSHAN: "天山",
	Faction.DALI: "大理",
	Faction.XIAKE: "侠客岛",
	Faction.QINGCHENG: "青城",
	Faction.RIVERSIDE: "江水帮"
}

## 效果类型名称映射
const EFFECT_TYPE_NAMES: Dictionary = {
	EffectType.DAMAGE: "伤害",
	EffectType.SHIELD: "护盾",
	EffectType.SELF_DAMAGE: "自伤",
	EffectType.DRAIN_MP: "吸取内力",
	EffectType.REMOVE_MP: "消除内力",
	EffectType.DRAIN_HP: "吸取生命",
	EffectType.DOT: "持续伤害",
	EffectType.DEBUFF_AGILITY: "降低轻功",
	EffectType.DISABLE_CARD_TYPE: "禁用卡牌",
	EffectType.EXTRA_ACTION: "额外行动",
	EffectType.MIMIC: "模仿"
}


## 获取卡牌类型名称
static func get_card_type_name(card_type: CardType) -> String:
	return CARD_TYPE_NAMES.get(card_type, "未知")


## 获取触发时机名称
static func get_trigger_timing_name(timing: TriggerTiming) -> String:
	return TRIGGER_TIMING_NAMES.get(timing, "未知")


## 获取门派名称
static func get_faction_name(faction: Faction) -> String:
	return FACTION_NAMES.get(faction, "未知")


## 检查卡牌类型是否匹配
static func is_card_type_match(card_type: CardType, required_type: CardType) -> bool:
	if required_type == CardType.ANY:
		return true
	return card_type == required_type
