import { Container, Graphics, Text } from 'pixi.js'
import { Colors, TextStyles, Renderer } from '../Renderer'
import { LayoutConstants } from '../LayoutConstants'

/**
 * 横向轻功轴组件 - 显示行动顺序
 */
export class AgilityAxis extends Container {
  private background: Graphics
  private axisLine: Graphics
  private playerMarker: Graphics
  private enemyMarker: Graphics
  private playerNameText: Text
  private enemyNameText: Text
  private playerAgilityText: Text
  private enemyAgilityText: Text
  private turnArrow: Graphics
  private renderer: Renderer
  private axisWidth: number
  private axisHeight: number
  private maxAgility: number = 50
  private readonly padding: number

  private animatedPlayerX: number = 0
  private animatedEnemyX: number = 0
  private targetPlayerX: number = 0
  private targetEnemyX: number = 0
  private animating: boolean = false
  private currentActor: 'player' | 'enemy' | null = null

  constructor(renderer: Renderer) {
    super()
    this.renderer = renderer
    this.axisWidth = LayoutConstants.agilityAxisWidth()
    this.axisHeight = LayoutConstants.agilityAxisHeight()
    this.padding = LayoutConstants.scaleValue(40)

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    this.axisLine = renderer.createGraphics()
    this.addChild(this.axisLine)

    this.playerMarker = renderer.createGraphics()
    this.addChild(this.playerMarker)

    this.enemyMarker = renderer.createGraphics()
    this.addChild(this.enemyMarker)

    this.playerNameText = renderer.createText('', TextStyles.STATS, 0, 0)
    this.playerNameText.anchor.set(0.5)
    this.playerNameText.style.fill = Colors.TEXT_RED
    this.addChild(this.playerNameText)

    this.enemyNameText = renderer.createText('', TextStyles.STATS, 0, 0)
    this.enemyNameText.anchor.set(0.5)
    this.enemyNameText.style.fill = Colors.TEXT_BLUE
    this.addChild(this.enemyNameText)

    this.playerAgilityText = renderer.createText('', TextStyles.CARD_STATS, 0, 0)
    this.playerAgilityText.anchor.set(0.5)
    this.addChild(this.playerAgilityText)

    this.enemyAgilityText = renderer.createText('', TextStyles.CARD_STATS, 0, 0)
    this.enemyAgilityText.anchor.set(0.5)
    this.addChild(this.enemyAgilityText)

    this.turnArrow = renderer.createGraphics()
    this.addChild(this.turnArrow)

    this.animatedPlayerX = this.padding
    this.animatedEnemyX = this.padding
    this.targetPlayerX = this.padding
    this.targetEnemyX = this.padding

    this.drawStaticElements()
  }

  private drawStaticElements(): void {
    const markerSize = LayoutConstants.agilityMarkerSize()
    const axisY = this.axisHeight * 0.55

    this.background.clear()
    this.background.roundRect(0, 0, this.axisWidth, this.axisHeight, 8)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.85 })
    this.background.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })

    this.axisLine.clear()
    this.axisLine.moveTo(this.padding, axisY)
    this.axisLine.lineTo(this.axisWidth - this.padding, axisY)
    this.axisLine.stroke({ color: Colors.TEXT_SECONDARY, width: 2 })

    const zeroText = this.renderer.createText('0', TextStyles.CARD_STATS, this.padding, axisY + 5)
    zeroText.anchor.set(0.5, 0)
    zeroText.style.fill = Colors.TEXT_SECONDARY
    zeroText.style.fontSize = LayoutConstants.fontCardType()
    this.addChild(zeroText)

    const maxText = this.renderer.createText(`${this.maxAgility}`, TextStyles.CARD_STATS, this.axisWidth - this.padding, axisY + 5)
    maxText.anchor.set(0.5, 0)
    maxText.style.fill = Colors.TEXT_SECONDARY
    maxText.style.fontSize = LayoutConstants.fontCardType()
    this.addChild(maxText)

    this.playerMarker.clear()
    this.playerMarker.circle(0, axisY, markerSize)
    this.playerMarker.fill(Colors.TEXT_RED)
    this.playerMarker.stroke({ color: Colors.TEXT_PRIMARY, width: 2 })

    this.enemyMarker.clear()
    this.enemyMarker.circle(0, axisY, markerSize)
    this.enemyMarker.fill(Colors.TEXT_BLUE)
    this.enemyMarker.stroke({ color: Colors.TEXT_PRIMARY, width: 2 })
  }

  update(
    playerName: string,
    playerAgility: number,
    enemyName: string,
    enemyAgility: number,
    currentActor: 'player' | 'enemy' | null
  ): void {
    const axisLength = this.axisWidth - this.padding * 2

    this.playerNameText.text = playerName
    this.enemyNameText.text = enemyName

    this.targetPlayerX = this.padding + Math.min(playerAgility / this.maxAgility, 1) * axisLength
    this.targetEnemyX = this.padding + Math.min(enemyAgility / this.maxAgility, 1) * axisLength
    this.currentActor = currentActor

    this.playerAgilityText.text = `${playerAgility}`
    this.enemyAgilityText.text = `${enemyAgility}`

    if (this.animatedPlayerX !== this.targetPlayerX || this.animatedEnemyX !== this.targetEnemyX) {
      if (!this.animating) {
        this.animating = true
        this.animate()
      }
    } else {
      this.updatePositions()
    }
  }

  private animate(): void {
    const animationSpeed = 0.12

    if (this.animatedPlayerX !== this.targetPlayerX) {
      const diff = this.targetPlayerX - this.animatedPlayerX
      this.animatedPlayerX += diff * animationSpeed
      if (Math.abs(diff) < 0.5) {
        this.animatedPlayerX = this.targetPlayerX
      }
    }

    if (this.animatedEnemyX !== this.targetEnemyX) {
      const diff = this.targetEnemyX - this.animatedEnemyX
      this.animatedEnemyX += diff * animationSpeed
      if (Math.abs(diff) < 0.5) {
        this.animatedEnemyX = this.targetEnemyX
      }
    }

    this.updatePositions()

    if (this.animatedPlayerX !== this.targetPlayerX || this.animatedEnemyX !== this.targetEnemyX) {
      requestAnimationFrame(() => this.animate())
    } else {
      this.animating = false
    }
  }

  private updatePositions(): void {
    const markerSize = LayoutConstants.agilityMarkerSize()
    const axisY = this.axisHeight * 0.55

    const playerX = this.animatedPlayerX
    const enemyX = this.animatedEnemyX

    this.playerMarker.x = playerX
    this.enemyMarker.x = enemyX

    this.playerNameText.x = playerX
    this.playerNameText.y = axisY - markerSize - 18
    this.enemyNameText.x = enemyX
    this.enemyNameText.y = axisY - markerSize - 18

    this.playerAgilityText.x = playerX
    this.playerAgilityText.y = axisY + markerSize + 8
    this.enemyAgilityText.x = enemyX
    this.enemyAgilityText.y = axisY + markerSize + 8

    this.turnArrow.clear()
    this.turnArrow.removeChildren()
    if (this.currentActor !== null) {
      const turnX = this.targetPlayerX >= this.targetEnemyX ? playerX : enemyX
      this.turnArrow.x = turnX
      this.turnArrow.y = axisY - markerSize - 28

      const arrowSize = LayoutConstants.scaleValue(8)
      this.turnArrow.moveTo(-arrowSize, -arrowSize)
      this.turnArrow.lineTo(0, 0)
      this.turnArrow.lineTo(arrowSize, -arrowSize)
      this.turnArrow.stroke({ color: Colors.TEXT_GOLD, width: 3 })

      const turnText = this.renderer.createText('当前行动', TextStyles.CARD_STATS, 0, -arrowSize * 2 - 2)
      turnText.anchor.set(0.5, 1)
      turnText.style.fill = Colors.TEXT_GOLD
      turnText.style.fontSize = LayoutConstants.fontCardType()
      this.turnArrow.addChild(turnText)
    }
  }

  /**
   * 销毁轻功轴，清理所有子对象
   */
  destroy(): void {
    this.animating = false

    this.background.destroy()
    this.axisLine.destroy()
    this.playerMarker.destroy()
    this.enemyMarker.destroy()
    this.playerNameText.destroy()
    this.enemyNameText.destroy()
    this.playerAgilityText.destroy()
    this.enemyAgilityText.destroy()
    this.turnArrow.destroy()

    super.destroy()
  }
}