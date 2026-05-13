## layout_constants.gd - 布局常量定义
## 定义战斗界面的所有尺寸、间距、颜色等常量
## 基于 1280x720 基准分辨率

class_name LayoutConstants
extends RefCounted

# ==================== 基准分辨率 ====================
const DESIGN_WIDTH: int = 1280
const DESIGN_HEIGHT: int = 720

# ==================== TopBar ====================
const TOP_BAR_HEIGHT: int = 50

# ==================== BottomBar ====================
const BOTTOM_BAR_HEIGHT: int = 220
const CARD_AREA_HEIGHT: int = 140
const SKILL_AREA_HEIGHT: int = 75
const BUTTON_AREA_HEIGHT: int = 45

# ==================== Sidebar ====================
const SIDEBAR_WIDTH: int = 280

# ==================== CharacterPanel ====================
const STANDARD_PANEL_WIDTH: int = 300
const STANDARD_PANEL_HEIGHT: int = 269
const PORTRAIT_WIDTH: int = 300
const PORTRAIT_HEIGHT: int = 169
const BAR_WIDTH: int = 280
const BAR_HEIGHT: int = 20

# ==================== MiniCharacterPanel ====================
const MINI_PANEL_WIDTH: int = 180
const MINI_PANEL_HEIGHT: int = 130
const MINI_AVATAR_SIZE: int = 50
const MINI_BAR_WIDTH: int = 100
const MINI_BAR_HEIGHT: int = 8

# ==================== CardUI ====================
const CARD_WIDTH: int = 100
const CARD_HEIGHT: int = 140
const CARD_RADIUS: int = 10
const CARD_SPACING: int = 15

# ==================== SkillButton ====================
const SKILL_BUTTON_WIDTH: int = 170
const SKILL_BUTTON_HEIGHT: int = 75

# ==================== AgilityAxis ====================
const AGILITY_AXIS_WIDTH: int = 60
const AGILITY_AXIS_HEIGHT: int = 280
const AGILITY_MARKER_SIZE: int = 12

# ==================== BattleLog ====================
const BATTLE_LOG_WIDTH: int = 260
const BATTLE_LOG_HEIGHT: int = 300

# ==================== StatusBar ====================
const STATUS_BAR_WIDTH: int = 240
const STATUS_BAR_HEIGHT: int = 42

# ==================== Action Buttons =================###
const CONFIRM_BUTTON_WIDTH: int = 100
const CANCEL_BUTTON_WIDTH: int = 100
const END_TURN_BUTTON_WIDTH: int = 130
const ACTION_BUTTON_HEIGHT: int = 45

# ==================== 间距 ====================
const PANEL_MARGIN_H: int = 20
const PANEL_MARGIN_V: int = 20
const COMPONENT_SPACING: int = 8
const CARD_HAND_SPACING: int = 15

# ==================== 颜色定义 ====================
## 面板背景色
const COLOR_PANEL_BG: Color = Color(0.1, 0.1, 0.15, 0.9)

## 文字颜色
const COLOR_TEXT_PRIMARY: Color = Color.WHITE
const COLOR_TEXT_SECONDARY: Color = Color(0.7, 0.7, 0.7, 1.0)
const COLOR_TEXT_GOLD: Color = Color(1.0, 0.85, 0.0, 1.0)
const COLOR_TEXT_RED: Color = Color(1.0, 0.3, 0.3, 1.0)
const COLOR_TEXT_BLUE: Color = Color(0.3, 0.5, 1.0, 1.0)
const COLOR_TEXT_GREEN: Color = Color(0.3, 1.0, 0.3, 1.0)

## HP/MP 条颜色
const COLOR_HP_BAR: Color = Color(0.8, 0.2, 0.2, 1.0)
const COLOR_HP_BAR_BG: Color = Color(0.3, 0.1, 0.1, 1.0)
const COLOR_MP_BAR: Color = Color(0.2, 0.4, 0.8, 1.0)
const COLOR_MP_BAR_BG: Color = Color(0.1, 0.15, 0.3, 1.0)
const COLOR_SHIELD_BAR: Color = Color(0.6, 0.6, 0.8, 1.0)

## 卡牌类型颜色
const COLOR_CARD_EMPTY_HAND_BG: Color = Color(0.165, 0.227, 0.369, 1.0)
const COLOR_CARD_EMPTY_HAND_BORDER: Color = Color(0.290, 0.416, 0.620, 1.0)
const COLOR_CARD_SHORT_WEAPON_BG: Color = Color(0.227, 0.165, 0.306, 1.0)
const COLOR_CARD_SHORT_WEAPON_BORDER: Color = Color(0.416, 0.290, 0.557, 1.0)
const COLOR_CARD_LONG_WEAPON_BG: Color = Color(0.227, 0.290, 0.180, 1.0)
const COLOR_CARD_LONG_WEAPON_BORDER: Color = Color(0.416, 0.541, 0.306, 1.0)
const COLOR_CARD_LEG_BG: Color = Color(0.306, 0.165, 0.227, 1.0)
const COLOR_CARD_LEG_BORDER: Color = Color(0.557, 0.290, 0.416, 1.0)

## 选中/目标高亮颜色
const COLOR_SELECTED_BORDER: Color = Color(1.0, 0.85, 0.0, 1.0)  # 金色
const COLOR_TARGETABLE_BORDER: Color = Color(1.0, 0.5, 0.0, 1.0)  # 橙色
const COLOR_TARGETED_BORDER: Color = Color(1.0, 0.0, 0.0, 1.0)  # 红色

## 禁用状态颜色
const COLOR_DISABLED_BG: Color = Color(0.2, 0.2, 0.2, 1.0)
const COLOR_DISABLED_BORDER: Color = Color(0.333, 0.333, 0.333, 1.0)

# ==================== 字体大小 ====================
const FONT_SIZE_TITLE: int = 38
const FONT_SIZE_SUBTITLE: int = 20
const FONT_SIZE_CHARACTER_NAME: int = 22
const FONT_SIZE_CHARACTER_TITLE: int = 14
const FONT_SIZE_CARD_NAME: int = 16
const FONT_SIZE_CARD_TYPE: int = 13
const FONT_SIZE_CARD_STATS: int = 14
const FONT_SIZE_STATS: int = 16
const FONT_SIZE_BUTTON: int = 18
const FONT_SIZE_LOG: int = 14
const FONT_SIZE_SKILL_NAME: int = 14

# ==================== 动画时长 ====================
const ANIM_DURATION_FAST: float = 0.15
const ANIM_DURATION_NORMAL: float = 0.3
const ANIM_DURATION_SLOW: float = 0.5

# ==================== 辅助方法 ====================

## 获取卡牌类型对应的背景色
static func get_card_bg_color(card_type: Types.CardType) -> Color:
	match card_type:
		Types.CardType.EMPTY_HAND:
			return COLOR_CARD_EMPTY_HAND_BG
		Types.CardType.SHORT_WEAPON:
			return COLOR_CARD_SHORT_WEAPON_BG
		Types.CardType.LONG_WEAPON:
			return COLOR_CARD_LONG_WEAPON_BG
		Types.CardType.LEG:
			return COLOR_CARD_LEG_BG
		_:
			return COLOR_CARD_EMPTY_HAND_BG


## 获取卡牌类型对应的边框色
static func get_card_border_color(card_type: Types.CardType) -> Color:
	match card_type:
		Types.CardType.EMPTY_HAND:
			return COLOR_CARD_EMPTY_HAND_BORDER
		Types.CardType.SHORT_WEAPON:
			return COLOR_CARD_SHORT_WEAPON_BORDER
		Types.CardType.LONG_WEAPON:
			return COLOR_CARD_LONG_WEAPON_BORDER
		Types.CardType.LEG:
			return COLOR_CARD_LEG_BORDER
		_:
			return COLOR_CARD_EMPTY_HAND_BORDER


## 计算手牌区域总宽度
static func calculate_hand_width(card_count: int) -> int:
	if card_count <= 0:
		return 0
	return card_count * CARD_WIDTH + (card_count - 1) * CARD_SPACING


## 计算技能按钮区域总宽度
static func calculate_skills_width(skill_count: int) -> int:
	if skill_count <= 0:
		return 0
	return skill_count * SKILL_BUTTON_WIDTH + (skill_count - 1) * COMPONENT_SPACING
