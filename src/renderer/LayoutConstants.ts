// 布局常量 - 基于基准分辨率(1280x720)的比例尺寸
export class LayoutConstants {
  // 基准分辨率
  static readonly BASE_WIDTH = 1280
  static readonly BASE_HEIGHT = 720

  // 角色面板基准尺寸
  static readonly BASE_PORTRAIT_WIDTH = 300    // 立绘宽度
  static readonly BASE_PORTRAIT_HEIGHT = 169   // 立绘高度 (比例 1.78:1)
  static readonly BASE_PANEL_WIDTH = 300       // 面板宽度
  static readonly BASE_BAR_WIDTH = 280         // HP/MP条宽度
  static readonly BASE_BAR_HEIGHT = 20         // HP/MP条高度

  // 卡牌基准尺寸
  static readonly BASE_CARD_WIDTH = 100
  static readonly BASE_CARD_HEIGHT = 140
  static readonly BASE_CARD_RADIUS = 10
  static readonly BASE_CARD_SPACING = 15       // 卡牌间距

  // 按钮基准尺寸
  static readonly BASE_BUTTON_WIDTH = 120
  static readonly BASE_BUTTON_HEIGHT = 45
  static readonly BASE_SKILL_BTN_WIDTH = 170
  static readonly BASE_SKILL_BTN_HEIGHT = 75

  // 战斗日志基准尺寸
  static readonly BASE_LOG_WIDTH = 450
  static readonly BASE_LOG_HEIGHT = 220

  // 状态栏基准尺寸
  static readonly BASE_STATUS_WIDTH = 240
  static readonly BASE_STATUS_HEIGHT = 42

  // 轻功轴基准尺寸
  static readonly BASE_AGILITY_AXIS_WIDTH = 600
  static readonly BASE_AGILITY_AXIS_HEIGHT = 60
  static readonly BASE_AGILITY_MARKER_SIZE = 14

  // 字体基准大小
  static readonly BASE_FONT_TITLE = 38
  static readonly BASE_FONT_SUBTITLE = 20
  static readonly BASE_FONT_CHARACTER_NAME = 22
  static readonly BASE_FONT_CHARACTER_TITLE = 14
  static readonly BASE_FONT_CARD_NAME = 16
  static readonly BASE_FONT_CARD_TYPE = 13
  static readonly BASE_FONT_CARD_STATS = 14
  static readonly BASE_FONT_STATS = 16
  static readonly BASE_FONT_BUTTON = 18
  static readonly BASE_FONT_LOG = 14
  static readonly BASE_FONT_SKILL_NAME = 14

  // 缩放因子
  private static _scale: number = 1

  static get scale(): number {
    return this._scale
  }

  static set scale(value: number) {
    this._scale = value
  }

  // 角色面板尺寸
  static portraitWidth(): number { return Math.round(this.BASE_PORTRAIT_WIDTH * this._scale) }
  static portraitHeight(): number { return Math.round(this.BASE_PORTRAIT_HEIGHT * this._scale) }
  static panelWidth(): number { return Math.round(this.BASE_PANEL_WIDTH * this._scale) }
  static barWidth(): number { return Math.round(this.BASE_BAR_WIDTH * this._scale) }
  static barHeight(): number { return Math.round(this.BASE_BAR_HEIGHT * this._scale) }

  // 卡牌尺寸
  static cardWidth(): number { return Math.round(this.BASE_CARD_WIDTH * this._scale) }
  static cardHeight(): number { return Math.round(this.BASE_CARD_HEIGHT * this._scale) }
  static cardRadius(): number { return Math.round(this.BASE_CARD_RADIUS * this._scale) }
  static cardSpacing(): number { return Math.round(this.BASE_CARD_SPACING * this._scale) }

  // 按钮尺寸
  static buttonWidth(): number { return Math.round(this.BASE_BUTTON_WIDTH * this._scale) }
  static buttonHeight(): number { return Math.round(this.BASE_BUTTON_HEIGHT * this._scale) }
  static skillBtnWidth(): number { return Math.round(this.BASE_SKILL_BTN_WIDTH * this._scale) }
  static skillBtnHeight(): number { return Math.round(this.BASE_SKILL_BTN_HEIGHT * this._scale) }

  // 战斗日志尺寸
  static logWidth(): number { return Math.round(this.BASE_LOG_WIDTH * this._scale) }
  static logHeight(): number { return Math.round(this.BASE_LOG_HEIGHT * this._scale) }

  // 状态栏尺寸
  static statusWidth(): number { return Math.round(this.BASE_STATUS_WIDTH * this._scale) }
  static statusHeight(): number { return Math.round(this.BASE_STATUS_HEIGHT * this._scale) }

  // 轻功轴尺寸
  static agilityAxisWidth(): number { return Math.round(this.BASE_AGILITY_AXIS_WIDTH * this._scale) }
  static agilityAxisHeight(): number { return Math.round(this.BASE_AGILITY_AXIS_HEIGHT * this._scale) }
  static agilityMarkerSize(): number { return Math.round(this.BASE_AGILITY_MARKER_SIZE * this._scale) }

  // 字体大小
  static fontTitle(): number { return Math.round(this.BASE_FONT_TITLE * this._scale) }
  static fontSubtitle(): number { return Math.round(this.BASE_FONT_SUBTITLE * this._scale) }
  static fontCharacterName(): number { return Math.round(this.BASE_FONT_CHARACTER_NAME * this._scale) }
  static fontCharacterTitle(): number { return Math.round(this.BASE_FONT_CHARACTER_TITLE * this._scale) }
  static fontCardName(): number { return Math.round(this.BASE_FONT_CARD_NAME * this._scale) }
  static fontCardType(): number { return Math.round(this.BASE_FONT_CARD_TYPE * this._scale) }
  static fontCardStats(): number { return Math.round(this.BASE_FONT_CARD_STATS * this._scale) }
  static fontStats(): number { return Math.round(this.BASE_FONT_STATS * this._scale) }
  static fontButton(): number { return Math.round(this.BASE_FONT_BUTTON * this._scale) }
  static fontLog(): number { return Math.round(this.BASE_FONT_LOG * this._scale) }
  static fontSkillName(): number { return Math.round(this.BASE_FONT_SKILL_NAME * this._scale) }

  // 通用缩放方法
  static scaleValue(value: number): number {
    return Math.round(value * this._scale)
  }
}