/**
 * 颜色配置类
 * 支持自定义颜色主题和依赖注入
 */
export class ColorConfig {
  // 背景颜色
  BACKGROUND: number = 0x0a0a1a
  PANEL_BG: number = 0x1a1a2e

  // 卡牌颜色
  CARD_BG: number = 0x16213e
  CARD_HOVER: number = 0x1f3460
  CARD_SELECTED: number = 0x2a4a80

  // 文字颜色
  TEXT_PRIMARY: number = 0xffffff
  TEXT_SECONDARY: number = 0x888888
  TEXT_GOLD: number = 0xffd700
  TEXT_RED: number = 0xff6b6b
  TEXT_GREEN: number = 0x4ecdc4
  TEXT_BLUE: number = 0x4a9eff

  // 状态条颜色
  HP_BAR: number = 0xff4444
  MP_BAR: number = 0x4488ff
  SHIELD_BAR: number = 0x44ff88
  AGILITY_BAR: number = 0xffaa00

  // 按钮颜色
  BUTTON_NORMAL: number = 0x4a6ab0
  BUTTON_HOVER: number = 0x5a7ac0
  BUTTON_DISABLED: number = 0x444444

  /**
   * 使用自定义颜色配置创建实例
   */
  static create(customColors?: Partial<ColorConfig>): ColorConfig {
    const config = new ColorConfig()
    if (customColors) {
      Object.assign(config, customColors)
    }
    return config
  }
}

/** 默认颜色配置实例（向后兼容） */
export const Colors = new ColorConfig()