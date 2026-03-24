import { Application, Container, Text, TextStyle, Graphics } from 'pixi.js'
import { LayoutConstants } from './LayoutConstants'

// 颜色常量
export const Colors = {
  BACKGROUND: 0x0a0a1a,
  PANEL_BG: 0x1a1a2e,
  CARD_BG: 0x16213e,
  CARD_HOVER: 0x1f3460,
  CARD_SELECTED: 0x2a4a80,
  TEXT_PRIMARY: 0xffffff,
  TEXT_SECONDARY: 0x888888,
  TEXT_GOLD: 0xffd700,
  TEXT_RED: 0xff6b6b,
  TEXT_GREEN: 0x4ecdc4,
  TEXT_BLUE: 0x4a9eff,
  HP_BAR: 0xff4444,
  MP_BAR: 0x4488ff,
  SHIELD_BAR: 0x44ff88,
  AGILITY_BAR: 0xffaa00,
  BUTTON_NORMAL: 0x4a6ab0,
  BUTTON_HOVER: 0x5a7ac0,
  BUTTON_DISABLED: 0x444444
}

// 文字样式 - 动态生成，基于当前scale
export class TextStyles {

  static get TITLE(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontTitle(),
      fill: Colors.TEXT_GOLD,
      fontWeight: 'bold',
      dropShadow: { color: 0x000000, blur: 4, distance: 2 }
    })
  }

  static get SUBTITLE(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontSubtitle(),
      fill: Colors.TEXT_SECONDARY
    })
  }

  static get CARD_NAME(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontCardName(),
      fill: Colors.TEXT_PRIMARY,
      fontWeight: 'bold'
    })
  }

  static get CARD_TYPE(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontCardType(),
      fill: Colors.TEXT_SECONDARY
    })
  }

  static get CARD_STATS(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontCardStats(),
      fill: Colors.TEXT_GOLD
    })
  }

  static get CHARACTER_NAME(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontCharacterName(),
      fill: Colors.TEXT_GOLD,
      fontWeight: 'bold'
    })
  }

  static get CHARACTER_TITLE(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontCharacterTitle(),
      fill: Colors.TEXT_SECONDARY
    })
  }

  static get STATS(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontStats(),
      fill: Colors.TEXT_PRIMARY
    })
  }

  static get BUTTON(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontButton(),
      fill: Colors.TEXT_PRIMARY,
      fontWeight: 'bold'
    })
  }

  static get LOG(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontLog(),
      fill: Colors.TEXT_SECONDARY,
      wordWrap: true,
      wordWrapWidth: LayoutConstants.logWidth() - 40
    })
  }

  static get SKILL_NAME(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontSkillName(),
      fill: Colors.TEXT_RED,
      fontWeight: 'bold'
    })
  }

  static get SELECT_NAME(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontCharacterName(),
      fill: Colors.TEXT_GOLD,
      fontWeight: 'bold'
    })
  }

  static get SELECT_TITLE(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontCharacterTitle(),
      fill: Colors.TEXT_SECONDARY
    })
  }

  static get SELECT_DESC(): TextStyle {
    return new TextStyle({
      fontFamily: 'Arial, sans-serif',
      fontSize: LayoutConstants.fontCardType(),
      fill: Colors.TEXT_SECONDARY,
      wordWrap: true,
      wordWrapWidth: LayoutConstants.scaleValue(160)
    })
  }
}

// 渲染器类
export class Renderer {
  private app: Application
  private stage: Container
  private width: number
  private height: number
  private scale: number
  private resizeCallbacks: Set<() => void> = new Set()

  constructor() {
    this.app = null as any
    this.stage = null as any
    this.width = 0
    this.height = 0
    this.scale = 1
  }

  // 初始化渲染器
  async init(container: HTMLElement): Promise<void> {
    this.width = container.clientWidth || 1280
    this.height = container.clientHeight || 720

    // 计算并设置初始scale
    this.scale = Math.min(this.width / LayoutConstants.BASE_WIDTH, this.height / LayoutConstants.BASE_HEIGHT)
    LayoutConstants.scale = this.scale

    this.app = new Application()

    // 强制使用 Canvas2D 渲染器
    const preferences: ('webgl' | 'webgpu' | 'canvas')[] = ['canvas', 'webgl']
    let initialized = false

    for (const pref of preferences) {
      try {
        await this.app.init({
          width: this.width,
          height: this.height,
          backgroundColor: Colors.BACKGROUND,
          antialias: true,
          resolution: window.devicePixelRatio || 1,
          autoDensity: true,
          preference: pref,
          autoStart: true  // 自动开始渲染循环
        })
        initialized = true
        console.log(`Renderer initialized with ${pref}`)
        break
      } catch (e) {
        console.warn(`Failed to initialize with ${pref}:`, e)
      }
    }

    if (!initialized) {
      throw new Error('Failed to initialize renderer with any backend')
    }

    container.appendChild(this.app.canvas)
    this.stage = this.app.stage

    // 响应窗口大小变化
    window.addEventListener('resize', () => this.handleResize(container))
  }

  // 处理窗口大小变化
  private handleResize(container: HTMLElement): void {
    this.width = container.clientWidth || 1280
    this.height = container.clientHeight || 720

    this.app.renderer.resize(this.width, this.height)
    this.scale = Math.min(this.width / LayoutConstants.BASE_WIDTH, this.height / LayoutConstants.BASE_HEIGHT)

    // 更新LayoutConstants
    LayoutConstants.scale = this.scale

    // 通知所有注册的回调
    this.resizeCallbacks.forEach(cb => cb())
  }

  // 注册resize回调
  onResize(callback: () => void): void {
    this.resizeCallbacks.add(callback)
  }

  // 移除resize回调
  offResize(callback: () => void): void {
    this.resizeCallbacks.delete(callback)
  }

  // 获取舞台
  getStage(): Container {
    return this.stage
  }

  // 获取应用实例
  getApp(): Application {
    return this.app
  }

  // 获取尺寸
  getSize(): { width: number; height: number; scale: number } {
    return { width: this.width, height: this.height, scale: this.scale }
  }

  // 清空舞台
  clearStage(): void {
    this.stage.removeChildren()
  }

  // 创建容器
  createContainer(x: number = 0, y: number = 0): Container {
    const container = new Container()
    container.x = x
    container.y = y
    return container
  }

  // 创建文本
  createText(text: string, style: TextStyle, x: number = 0, y: number = 0): Text {
    const textObj = new Text({ text, style })
    textObj.x = x
    textObj.y = y
    return textObj
  }

  // 创建图形
  createGraphics(): Graphics {
    return new Graphics()
  }

  // 绘制圆角矩形
  drawRoundRect(
    graphics: Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    radius: number,
    fillColor: number,
    strokeColor?: number,
    strokeWidth: number = 2
  ): void {
    graphics.roundRect(x, y, width, height, radius)
    graphics.fill(fillColor)
    if (strokeColor) {
      graphics.stroke({ color: strokeColor, width: strokeWidth })
    }
  }

  // 绘制进度条
  drawBar(
    graphics: Graphics,
    x: number,
    y: number,
    width: number,
    height: number,
    percent: number,
    bgColor: number,
    fillColor: number,
    radius: number = 3
  ): void {
    // 背景
    graphics.roundRect(x, y, width, height, radius)
    graphics.fill(bgColor)

    // 填充
    const fillWidth = Math.max(0, (width - 4) * percent)
    if (fillWidth > 0) {
      graphics.roundRect(x + 2, y + 2, fillWidth, height - 4, radius - 1)
      graphics.fill(fillColor)
    }
  }

  // 添加点击事件
  addClickHandler(target: Container, callback: () => void): void {
    target.eventMode = 'static'
    target.cursor = 'pointer'
    target.on('pointerdown', callback)
  }

  // 添加悬停效果
  addHoverEffect(target: Container, normalAlpha: number = 1, hoverAlpha: number = 0.8): void {
    target.eventMode = 'static'
    target.on('pointerover', () => target.alpha = hoverAlpha)
    target.on('pointerout', () => target.alpha = normalAlpha)
  }

  // 销毁
  destroy(): void {
    if (this.app) {
      this.app.destroy(true)
    }
  }
}