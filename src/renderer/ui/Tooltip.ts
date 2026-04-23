import { Container, Graphics, Text } from 'pixi.js'
import { Colors, Renderer } from '../Renderer'
import { LayoutConstants } from '../LayoutConstants'

/**
 * 提示框组件
 */
export class Tooltip extends Container {
  private background: Graphics
  private text: Text
  private tipWidth: number = 200
  private tipHeight: number = 60

  constructor(renderer: Renderer, content: string = '') {
    super()
    this.visible = false

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    this.text = new Text({
      text: content,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY, wordWrap: true, wordWrapWidth: this.tipWidth - 20 }
    })
    this.text.x = 10
    this.text.y = 10
    this.addChild(this.text)

    this.drawBackground()
  }

  private drawBackground(): void {
    const textHeight = this.text.height + 20
    this.tipHeight = Math.max(40, textHeight)

    this.background.clear()
    this.background.roundRect(0, 0, this.tipWidth, this.tipHeight, 6)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    this.background.stroke({ color: Colors.TEXT_GOLD, width: 1 })
  }

  show(x: number, y: number, content: string): void {
    this.text.text = content
    this.drawBackground()
    this.x = x
    this.y = y
    this.visible = true
  }

  hide(): void {
    this.visible = false
  }
}