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

    // 计算布局比例 - 根据实际卡片高度动态调整
    const h = this.cardHeight
    const w = this.cardWidth

    // 头像区域（简化为圆形色块）- 约占卡片高度的 30%
    const avatarSize = Math.min(w * 0.3, h * 0.25)
    const avatarY = h * 0.25
    const avatar = this.renderer.createGraphics()
    avatar.circle(w / 2, avatarY, avatarSize)
    // 根据境界显示不同颜色
    const realmColor = this.getRealmColor(this.disciple.realm)
    avatar.fill(realmColor)
    this.addChild(avatar)

    // 境界标识 - 紧贴头像下方
    const badgeWidth = w * 0.35
    const badgeHeight = h * 0.08
    const badgeY = avatarY + avatarSize + 5
    const realmBadge = this.renderer.createGraphics()
    realmBadge.roundRect(w / 2 - badgeWidth / 2, badgeY, badgeWidth, badgeHeight, 3)
    realmBadge.fill({ color: realmColor, alpha: 0.8 })
    this.addChild(realmBadge)

    const fontSizeBadge = Math.max(9, Math.floor(h * 0.06))
    const realmText = new Text({
      text: this.disciple.realm,
      style: createStyle(fontSizeBadge, Colors.TEXT_PRIMARY)
    })
    realmText.x = w / 2
    realmText.y = badgeY + badgeHeight / 2
    realmText.anchor.set(0.5)
    this.addChild(realmText)

    // 弟子名称 - 境界标识下方
    const fontSizeName = Math.max(12, Math.floor(h * 0.09))
    const nameY = badgeY + badgeHeight + 8
    const nameText = new Text({
      text: this.disciple.name,
      style: new TextStyle({
        fontFamily: 'Arial, sans-serif',
        fontSize: fontSizeName,
        fill: Colors.TEXT_GOLD,
        fontWeight: 'bold'
      })
    })
    nameText.x = w / 2
    nameText.y = nameY
    nameText.anchor.set(0.5)
    this.addChild(nameText)

    // 状态指示 - 名称下方
    const fontSizeStatus = Math.max(10, Math.floor(h * 0.07))
    const statusY = nameY + fontSizeName + 5
    const statusColor = this.getStatusColor(this.disciple.status)
    const statusText = new Text({
      text: this.disciple.status,
      style: createStyle(fontSizeStatus, statusColor)
    })
    statusText.x = w / 2
    statusText.y = statusY
    statusText.anchor.set(0.5)
    this.addChild(statusText)

    // 精力条 - 状态下方，约占卡片高度 5%
    const barY = statusY + fontSizeStatus + 5
    this.drawVitalityBar(barY)

    // 属性摘要 - 精力条下方
    const fontSizeAttr = Math.max(9, Math.floor(h * 0.06))
    const attrY = barY + 12
    const attrText = new Text({
      text: `根骨:${this.disciple.root} 悟性:${this.disciple.insight}`,
      style: createStyle(fontSizeAttr, Colors.TEXT_SECONDARY)
    })
    attrText.x = w / 2
    attrText.y = attrY
    attrText.anchor.set(0.5)
    this.addChild(attrText)

    // HP/MP - 属性摘要下方
    const fontSizeHpMp = Math.max(8, Math.floor(h * 0.055))
    const hpMpY = attrY + fontSizeAttr + 3
    const hpMpText = new Text({
      text: `HP:${this.disciple.currentHp}/${this.disciple.maxHp} MP:${this.disciple.currentMp}/${this.disciple.maxMp}`,
      style: createStyle(fontSizeHpMp, Colors.TEXT_SECONDARY)
    })
    hpMpText.x = w / 2
    hpMpText.y = hpMpY
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