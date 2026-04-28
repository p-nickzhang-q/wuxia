import { Container, Graphics, Text } from 'pixi.js'
import { Card, CardType } from '../game/types'
import { Colors, TextStyles, Renderer } from './Renderer'
import { LayoutConstants } from './LayoutConstants'

// 卡牌渲染器 - 使用响应式尺寸
export class CardRenderer extends Container {
  private card: Card
  private background: Graphics
  private nameText: Text
  private typeText: Text
  private statsText: Text
  private costText: Text
  private isPlayable: boolean = true
  private isSelected: boolean = false
  private isHovering: boolean = false
  private baseY: number = 0  // 存储原始Y位置
  private onCardClick?: (cardRenderer: CardRenderer) => void

  // 悬停动画状态
  private hoverAnimating: boolean = false
  private animatedScale: number = 1
  private animatedY: number = 0
  private targetScale: number = 1
  private targetY: number = 0

  constructor(card: Card, renderer: Renderer) {
    super()

    this.card = card

    const cardWidth = LayoutConstants.cardWidth()
    const cardHeight = LayoutConstants.cardHeight()

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    // 卡牌名称
    this.nameText = renderer.createText(card.name, TextStyles.CARD_NAME, 10, 10)
    this.addChild(this.nameText)

    // 卡牌类型
    this.typeText = renderer.createText(card.type, TextStyles.CARD_TYPE, 10, 35)
    this.addChild(this.typeText)

    // 属性统计
    let statsStr = ''
    if (card.baseDamage > 0) statsStr += `伤害:${card.baseDamage} `
    if (card.baseShield > 0) statsStr += `护盾:${card.baseShield} `
    if (card.selfDamage) statsStr += `反伤:${card.selfDamage}`

    this.statsText = renderer.createText(statsStr.trim(), TextStyles.CARD_STATS, 10, cardHeight - 50)
    this.addChild(this.statsText)

    // 轻功消耗
    this.costText = renderer.createText(`${card.agilityCost}`, TextStyles.STATS, cardWidth - 35, cardHeight - 30)
    this.costText.style.fontSize = LayoutConstants.fontTitle()
    this.costText.style.fill = Colors.TEXT_GOLD
    this.addChild(this.costText)

    // 绘制卡牌背景
    this.drawBackground()

    // 设置交互
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.on('pointerdown', () => this.handleClick())
    this.on('pointerover', () => this.handleHover(true))
    this.on('pointerout', () => this.handleHover(false))
  }

  // 绘制卡牌背景
  private drawBackground(): void {
    const cardWidth = LayoutConstants.cardWidth()
    const cardHeight = LayoutConstants.cardHeight()
    const cardRadius = LayoutConstants.cardRadius()

    const colors = this.getCardColors()
    const bgColor = this.isPlayable ? colors.bg : 0x333333
    let borderColor = this.isPlayable ? colors.border : 0x555555

    // 选中时金色边框，悬停时高亮边框
    if (this.isSelected) {
      borderColor = Colors.TEXT_GOLD
    } else if (this.isHovering && this.isPlayable) {
      borderColor = 0xffffff  // 白色高亮
    }

    this.background.clear()
    this.background.roundRect(0, 0, cardWidth, cardHeight, cardRadius)
    this.background.fill(bgColor)
    this.background.stroke({ color: borderColor, width: this.isSelected ? 4 : 2 })

    // 如果不可用，添加遮罩效果
    if (!this.isPlayable) {
      this.background.rect(0, 0, cardWidth, cardHeight)
      this.background.fill({ color: 0x000000, alpha: 0.3 })
    }
  }

  // 获取卡牌颜色配置
  private getCardColors(): { bg: number; border: number } {
    const cardColors: Record<CardType, { bg: number; border: number }> = {
      [CardType.EMPTY_HAND]: { bg: 0x2a3a5e, border: 0x4a6a9e },
      [CardType.SHORT_WEAPON]: { bg: 0x3a2a4e, border: 0x6a4a8e },
      [CardType.LONG_WEAPON]: { bg: 0x3a4a2e, border: 0x6a8a4e },
      [CardType.LEG]: { bg: 0x4e2a3a, border: 0x8e4a6a }
    }
    return cardColors[this.card.type] || cardColors[CardType.EMPTY_HAND]
  }

  // 处理点击
  private handleClick(): void {
    if (this.onCardClick && this.isPlayable) {
      this.onCardClick(this)
    }
  }

  // 处理悬停
  private handleHover(isHover: boolean): void {
    this.isHovering = isHover

    // 计算目标状态
    if (this.isSelected) {
      // 选中状态不受悬停影响
      this.targetScale = 1
      this.targetY = this.baseY - 20
    } else if (isHover && this.isPlayable) {
      // 悬停且可用：放大+上移
      this.targetScale = 1.1
      this.targetY = this.baseY - 10
      this.cursor = 'pointer'
    } else {
      // 正常状态
      this.targetScale = 1
      this.targetY = this.baseY
      this.cursor = this.isPlayable ? 'pointer' : 'not-allowed'
    }

    // 启动动画
    if (!this.hoverAnimating) {
      this.hoverAnimating = true
      this.animateHover()
    }

    // 更新边框颜色
    this.drawBackground()
  }

  // 悬停动画
  private animateHover(): void {
    const animationSpeed = 0.15

    // 计算新值
    if (this.animatedScale !== this.targetScale) {
      const diff = this.targetScale - this.animatedScale
      this.animatedScale += diff * animationSpeed
      if (Math.abs(diff) < 0.01) {
        this.animatedScale = this.targetScale
      }
    }

    if (this.animatedY !== this.targetY) {
      const diff = this.targetY - this.animatedY
      this.animatedY += diff * animationSpeed
      if (Math.abs(diff) < 0.5) {
        this.animatedY = this.targetY
      }
    }

    // 应用变换
    this.scale.set(this.animatedScale, this.animatedScale)
    this.y = this.animatedY

    // 继续动画或结束
    if (this.animatedScale !== this.targetScale || this.animatedY !== this.targetY) {
      requestAnimationFrame(() => this.animateHover())
    } else {
      this.hoverAnimating = false
    }
  }

  // 更新卡牌数据
  setBaseY(y: number): void {
    this.baseY = y
    this.animatedY = y
    this.targetY = y
    this.y = y
  }

  // 设置点击回调
  setOnClick(callback: (cardRenderer: CardRenderer) => void): void {
    this.onCardClick = callback
  }

  // 设置是否可用
  setPlayable(playable: boolean): void {
    this.isPlayable = playable
    this.drawBackground()
    this.cursor = playable ? 'pointer' : 'not-allowed'
  }

  // 设置选中状态
  setSelected(selected: boolean): void {
    this.isSelected = selected

    // 更新目标状态
    if (selected) {
      this.targetScale = 1
      this.targetY = this.baseY - 20
    } else {
      this.targetScale = this.isHovering && this.isPlayable ? 1.1 : 1
      this.targetY = this.isHovering && this.isPlayable ? this.baseY - 10 : this.baseY
    }

    // 启动动画
    if (!this.hoverAnimating) {
      this.hoverAnimating = true
      this.animateHover()
    }

    this.drawBackground()
  }

  // 获取卡牌数据
  getCard(): Card {
    return this.card
  }

  // 更新卡牌数据
  update(card: Card): void {
    this.card = card
    const cardWidth = LayoutConstants.cardWidth()
    const cardHeight = LayoutConstants.cardHeight()

    this.nameText.text = card.name
    this.typeText.text = card.type

    let statsStr = ''
    if (card.baseDamage > 0) statsStr += `伤害:${card.baseDamage} `
    if (card.baseShield > 0) statsStr += `护盾:${card.baseShield} `
    if (card.selfDamage) statsStr += `反伤:${card.selfDamage}`

    this.statsText.text = statsStr.trim()
    this.statsText.y = cardHeight - 50
    this.costText.text = `${card.agilityCost}`
    this.costText.x = cardWidth - 35
    this.costText.y = cardHeight - 30
    this.drawBackground()
  }

  // 播放攻击动画
  async playAttackAnimation(): Promise<void> {
    const originalY = this.y
    const originalX = this.x

    // 向前移动
    await this.animateTo(originalX + 50, originalY - 30, 150)
    await this.delay(100)
    // 返回原位
    await this.animateTo(originalX, originalY, 150)
  }

  // 播放弃牌动画
  async playDiscardAnimation(): Promise<void> {
    this.alpha = 1
    await this.fadeOut(200)
  }

  // 动画移动
  private animateTo(x: number, y: number, duration: number): Promise<void> {
    return new Promise(resolve => {
      const startX = this.x
      const startY = this.y
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        this.x = startX + (x - startX) * progress
        this.y = startY + (y - startY) * progress

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  // 淡出动画
  private fadeOut(duration: number): Promise<void> {
    return new Promise(resolve => {
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)

        this.alpha = 1 - progress

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  // 延迟
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * 销毁卡牌渲染器，清理所有子对象和事件监听
   */
  destroy(): void {
    // 移除事件监听
    this.off('pointerdown')
    this.off('pointerover')
    this.off('pointerout')

    // 销毁子对象
    this.background.destroy()
    this.nameText.destroy()
    this.typeText.destroy()
    this.statsText.destroy()
    this.costText.destroy()

    // 清理回调引用
    this.onCardClick = undefined

    // 调用父类销毁
    super.destroy()
  }
}

// 导出获取卡牌尺寸的函数（供外部使用）
export function getCardDimensions(): { width: number; height: number } {
  return {
    width: LayoutConstants.cardWidth(),
    height: LayoutConstants.cardHeight()
  }
}