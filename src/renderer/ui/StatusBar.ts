import { Container, Graphics, Text } from 'pixi.js'
import { Colors, Renderer } from '../Renderer'
import { LayoutConstants } from '../LayoutConstants'

/**
 * 状态栏组件
 */
export class StatusBar extends Container {
  private background: Graphics
  private turnText: Text
  private phaseText: Text
  private barWidth: number
  private barHeight: number

  constructor(renderer: Renderer) {
    super()
    this.barWidth = LayoutConstants.statusWidth()
    this.barHeight = LayoutConstants.scaleValue(40)

    this.background = renderer.createGraphics()
    this.drawBackground()
    this.addChild(this.background)

    this.turnText = new Text({
      text: '第1回合',
      style: { fontSize: LayoutConstants.scaleValue(14), fill: Colors.TEXT_GOLD }
    })
    this.turnText.x = 10
    this.turnText.y = 12
    this.addChild(this.turnText)

    this.phaseText = new Text({
      text: '选择行动',
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_SECONDARY }
    })
    this.phaseText.x = this.barWidth - 120
    this.phaseText.y = 14
    this.addChild(this.phaseText)
  }

  private drawBackground(): void {
    this.background.clear()
    this.background.roundRect(0, 0, this.barWidth, this.barHeight, 8)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.9 })
    this.background.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })
  }

  setTurn(turn: number): void {
    this.turnText.text = `第${turn}回合`
  }

  setPhase(phase: string): void {
    this.phaseText.text = phase
    this.phaseText.x = this.barWidth - this.phaseText.width - 20
  }

  resize(): void {
    this.barWidth = LayoutConstants.statusWidth()
    this.drawBackground()
  }

  /**
   * 销毁状态栏，清理所有子对象
   */
  destroy(): void {
    this.background.destroy()
    this.turnText.destroy()
    this.phaseText.destroy()
    super.destroy()
  }
}