import { Container, Graphics, Text } from 'pixi.js'
import { Colors, TextStyles, Renderer } from '../Renderer'
import { LayoutConstants } from '../LayoutConstants'

/**
 * 竖向轻功轴组件 - 显示行动顺序（右侧边栏）
 */
export class VerticalAgilityAxis extends Container {
  private background: Graphics
  private axisLine: Graphics
  private markers: Array<{ marker: Graphics; nameText: Text; agilityText: Text; charId: string }> = []
  private renderer: Renderer
  private axisWidth: number
  private axisHeight: number
  private maxAgility: number = 50
  private readonly padding: number

  constructor(renderer: Renderer) {
    super()
    this.renderer = renderer
    this.axisWidth = LayoutConstants.agilityAxisWidth()
    this.axisHeight = LayoutConstants.agilityAxisHeight()
    this.padding = LayoutConstants.scaleValue(15)

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    this.axisLine = renderer.createGraphics()
    this.addChild(this.axisLine)

    this.drawStaticElements()
  }

  private drawStaticElements(): void {
    this.background.clear()
    this.background.roundRect(0, 0, this.axisWidth, this.axisHeight, 8)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.85 })
    this.background.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })

    const title = this.renderer.createText('轻功', TextStyles.CARD_STATS, this.axisWidth / 2, 8)
    title.anchor.set(0.5, 0)
    title.style.fill = Colors.TEXT_GOLD
    this.addChild(title)

    const axisX = this.axisWidth / 2
    const startY = this.padding + 20
    const endY = this.axisHeight - this.padding

    this.axisLine.clear()
    this.axisLine.moveTo(axisX, startY)
    this.axisLine.lineTo(axisX, endY)
    this.axisLine.stroke({ color: Colors.TEXT_SECONDARY, width: 2 })

    const zeroText = this.renderer.createText('0', TextStyles.CARD_STATS, axisX + 12, endY)
    zeroText.anchor.set(0, 0.5)
    zeroText.style.fill = Colors.TEXT_SECONDARY
    zeroText.style.fontSize = LayoutConstants.fontCardType()
    this.addChild(zeroText)

    const maxText = this.renderer.createText(`${this.maxAgility}`, TextStyles.CARD_STATS, axisX + 12, startY)
    maxText.anchor.set(0, 0.5)
    maxText.style.fill = Colors.TEXT_SECONDARY
    maxText.style.fontSize = LayoutConstants.fontCardType()
    this.addChild(maxText)
  }

  update(characters: Array<{ id: string; name: string; agility: number; isPlayer: boolean; isAlive: boolean }>, currentActorId: string | null): void {
    this.markers.forEach(m => {
      this.removeChild(m.marker)
      this.removeChild(m.nameText)
      this.removeChild(m.agilityText)
    })
    this.markers = []

    const axisX = this.axisWidth / 2
    const startY = this.padding + 20
    const endY = this.axisHeight - this.padding
    const axisLength = endY - startY
    const markerSize = LayoutConstants.agilityMarkerSize()

    const sortedChars = [...characters].filter(c => c.isAlive).sort((a, b) => b.agility - a.agility)

    sortedChars.forEach((char) => {
      const y = startY + (1 - Math.min(char.agility / this.maxAgility, 1)) * axisLength

      const marker = this.renderer.createGraphics()
      marker.circle(0, 0, markerSize)
      marker.fill(char.isPlayer ? Colors.TEXT_RED : Colors.TEXT_BLUE)
      marker.stroke({ color: currentActorId === char.id ? Colors.TEXT_GOLD : Colors.TEXT_PRIMARY, width: currentActorId === char.id ? 3 : 2 })
      marker.x = axisX
      marker.y = y
      this.addChild(marker)

      const nameText = this.renderer.createText(char.name.slice(0, 2), TextStyles.CARD_STATS, axisX - markerSize - 5, y)
      nameText.anchor.set(1, 0.5)
      nameText.style.fill = char.isPlayer ? Colors.TEXT_RED : Colors.TEXT_BLUE
      nameText.style.fontSize = LayoutConstants.fontCardType()
      this.addChild(nameText)

      const agilityText = this.renderer.createText(`${char.agility}`, TextStyles.CARD_STATS, axisX + markerSize + 5, y)
      agilityText.anchor.set(0, 0.5)
      agilityText.style.fill = Colors.TEXT_PRIMARY
      agilityText.style.fontSize = LayoutConstants.fontCardType()
      this.addChild(agilityText)

      this.markers.push({ marker, nameText, agilityText, charId: char.id })
    })
  }
}