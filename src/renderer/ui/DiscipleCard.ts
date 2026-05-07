import { Container, Graphics, TextStyle, Text } from 'pixi.js'
import { Colors, Renderer } from '../Renderer'
import { SectorDisciple, SectorDiscipleStatus, DiscipleRealm } from '../../game/types'

// 辅助函数：创建简单 TextStyle
function createStyle(fontSize: number, fill: number): TextStyle {
  return new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize,
    fill
  })
}

/**
 * 弟子卡片组件
 */
export class DiscipleCard extends Container {
  private disciple: SectorDisciple
  private cardWidth: number
  private cardHeight: number
  private renderer: Renderer
  private onClick?: () => void
  private background: Graphics

  constructor(
    disciple: SectorDisciple,
    width: number,
    height: number,
    renderer: Renderer
  ) {
    super()
    this.disciple = disciple
    this.cardWidth = width
    this.cardHeight = height
    this.renderer = renderer
    this.background = renderer.createGraphics()

    this.createCard()
    this.setupInteraction()
  }

  private createCard(): void {
    // 背景
    this.drawBackground()
    this.addChild(this.background)

    // 头像区域（简化为圆形色块）
    const avatar = this.renderer.createGraphics()
    const avatarSize = 50
    avatar.circle(this.cardWidth / 2, 45, avatarSize)
    // 根据境界显示不同颜色
    const realmColor = this.getRealmColor(this.disciple.realm)
    avatar.fill(realmColor)
    this.addChild(avatar)

    // 境界标识
    const realmBadge = this.renderer.createGraphics()
    realmBadge.roundRect(this.cardWidth / 2 - 25, 85, 50, 20, 5)
    realmBadge.fill({ color: realmColor, alpha: 0.8 })
    this.addChild(realmBadge)

    const realmText = new Text({
      text: this.disciple.realm,
      style: createStyle(11, Colors.TEXT_PRIMARY)
    })
    realmText.x = this.cardWidth / 2
    realmText.y = 95
    realmText.anchor.set(0.5)
    this.addChild(realmText)

    // 弟子名称
    const nameText = new Text({
      text: this.disciple.name,
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: 14,
        fill: Colors.TEXT_GOLD,
        fontWeight: 'bold'
      })
    })
    nameText.x = this.cardWidth / 2
    nameText.y = 115
    nameText.anchor.set(0.5)
    this.addChild(nameText)

    // 状态指示
    const statusY = 140
    const statusColor = this.getStatusColor(this.disciple.status)
    const statusText = new Text({
      text: this.disciple.status,
      style: createStyle(12, statusColor)
    })
    statusText.x = this.cardWidth / 2
    statusText.y = statusY
    statusText.anchor.set(0.5)
    this.addChild(statusText)

    // 精力条
    this.drawVitalityBar(160)

    // 属性摘要
    const attrY = 185
    const attrText = new Text({
      text: `根骨:${this.disciple.root} 悟性:${this.disciple.insight}`,
      style: createStyle(10, Colors.TEXT_SECONDARY)
    })
    attrText.x = this.cardWidth / 2
    attrText.y = attrY
    attrText.anchor.set(0.5)
    this.addChild(attrText)

    // HP/MP
    const hpMpText = new Text({
      text: `HP:${this.disciple.currentHp}/${this.disciple.maxHp} MP:${this.disciple.currentMp}/${this.disciple.maxMp}`,
      style: createStyle(10, Colors.TEXT_SECONDARY)
    })
    hpMpText.x = this.cardWidth / 2
    hpMpText.y = attrY + 20
    hpMpText.anchor.set(0.5)
    this.addChild(hpMpText)
  }

  private drawBackground(): void {
    this.background.clear()

    // 根据状态决定边框颜色
    let borderColor = Colors.TEXT_SECONDARY
    if (this.disciple.status === SectorDiscipleStatus.HEALTHY) {
      borderColor = Colors.TEXT_GOLD
    } else if (this.disciple.status === SectorDiscipleStatus.INJURED) {
      borderColor = Colors.TEXT_RED
    }

    this.background.roundRect(0, 0, this.cardWidth, this.cardHeight, 10)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.9 })
    this.background.stroke({ color: borderColor, width: 2 })
  }

  private drawVitalityBar(y: number): void {
    const barWidth = this.cardWidth - 20
    const barHeight = 8
    const x = 10

    // 背景
    const barBg = this.renderer.createGraphics()
    barBg.roundRect(x, y, barWidth, barHeight, 4)
    barBg.fill({ color: Colors.BACKGROUND })
    this.addChild(barBg)

    // 精力进度
    const fillWidth = barWidth * (this.disciple.vitality / this.disciple.maxVitality)
    const barFill = this.renderer.createGraphics()
    barFill.roundRect(x, y, fillWidth, barHeight, 4)

    // 根据精力值显示颜色
    let vitalityColor = Colors.TEXT_PRIMARY
    if (this.disciple.vitality < 30) {
      vitalityColor = Colors.TEXT_RED
    } else if (this.disciple.vitality < 60) {
      vitalityColor = Colors.TEXT_SECONDARY
    }

    barFill.fill(vitalityColor)
    this.addChild(barFill)

    // 精力数值
    const vitalityText = new Text({
      text: `${this.disciple.vitality}`,
      style: createStyle(9, Colors.TEXT_PRIMARY)
    })
    vitalityText.x = this.cardWidth / 2
    vitalityText.y = y + 4
    vitalityText.anchor.set(0.5)
    this.addChild(vitalityText)
  }

  private getRealmColor(realm: DiscipleRealm): number {
    const colors: Record<DiscipleRealm, number> = {
      [DiscipleRealm.OUTER]: 0x8B4513,    // 外门 - 棕色
      [DiscipleRealm.INNER]: 0x4169E1,    // 内门 - 蓝色
      [DiscipleRealm.DISCIPLE]: 0x9932CC, // 亲传 - 紫色
      [DiscipleRealm.ELDER]: 0xFFD700     // 长老 - 金色
    }
    return colors[realm] || Colors.TEXT_PRIMARY
  }

  private getStatusColor(status: SectorDiscipleStatus): number {
    const colors: Record<SectorDiscipleStatus, number> = {
      [SectorDiscipleStatus.HEALTHY]: Colors.TEXT_PRIMARY,
      [SectorDiscipleStatus.INJURED]: Colors.TEXT_RED,
      [SectorDiscipleStatus.TRAINING]: Colors.TEXT_GOLD,
      [SectorDiscipleStatus.RESTING]: Colors.TEXT_SECONDARY,
      [SectorDiscipleStatus.EXPLORING]: Colors.TEXT_GOLD
    }
    return colors[status] || Colors.TEXT_SECONDARY
  }

  private setupInteraction(): void {
    this.eventMode = 'static'
    this.cursor = 'pointer'

    this.on('pointerdown', () => {
      if (this.onClick) {
        this.onClick()
      }
    })

    this.on('pointerover', () => {
      this.background.clear()
      this.background.roundRect(0, 0, this.cardWidth, this.cardHeight, 10)
      this.background.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
      this.background.stroke({ color: Colors.TEXT_GOLD, width: 3 })
    })

    this.on('pointerout', () => {
      this.drawBackground()
    })
  }

  setOnClick(callback: () => void): void {
    this.onClick = callback
  }

  /**
   * 更新弟子数据
   */
  update(disciple: SectorDisciple): void {
    this.disciple = disciple
    this.clear()
    this.createCard()
    this.setupInteraction()
  }

  /**
   * 清理卡片内容
   */
  clear(): void {
    this.removeChildren()
    this.background = this.renderer.createGraphics()
  }

  destroy(): void {
    this.off('pointerdown')
    this.off('pointerover')
    this.off('pointerout')
    super.destroy()
  }
}