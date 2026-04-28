import { Container, Graphics, Text } from 'pixi.js'
import { Colors, TextStyles, Renderer } from '../Renderer'
import { LayoutConstants } from '../LayoutConstants'
import { audioManager } from '../../utils/AudioManager'

/**
 * 响应式按钮组件
 */
export class Button extends Container {
  private background: Graphics
  private labelText: Text
  private onClick?: () => void
  private isDisabled: boolean = false
  private btnWidth: number
  private btnHeight: number

  constructor(
    text: string,
    width: number = LayoutConstants.buttonWidth(),
    height: number = LayoutConstants.buttonHeight(),
    renderer: Renderer
  ) {
    super()

    this.btnWidth = width
    this.btnHeight = height

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    this.labelText = renderer.createText(text, TextStyles.BUTTON, 0, 0)
    this.labelText.anchor.set(0.5)
    this.labelText.x = width / 2
    this.labelText.y = height / 2
    this.addChild(this.labelText)

    this.drawBackground(width, height)

    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.on('pointerdown', () => this.handleClick())
    this.on('pointerover', () => this.handleHover(true))
    this.on('pointerout', () => this.handleHover(false))
  }

  private drawBackground(width: number, height: number): void {
    const color = this.isDisabled ? Colors.BUTTON_DISABLED : Colors.BUTTON_NORMAL
    this.background.clear()
    this.background.roundRect(0, 0, width, height, 10)
    this.background.fill(color)
    this.background.stroke({ color: Colors.TEXT_GOLD, width: 2 })
  }

  private handleClick(): void {
    if (!this.isDisabled && this.onClick) {
      audioManager.playSfx('button_click')
      this.onClick()
    }
  }

  private handleHover(isHover: boolean): void {
    if (!this.isDisabled) {
      this.background.clear()
      this.background.roundRect(0, 0, this.btnWidth, this.btnHeight, 10)
      this.background.fill(isHover ? Colors.BUTTON_HOVER : Colors.BUTTON_NORMAL)
      this.background.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    }
  }

  setOnClick(callback: () => void): void {
    this.onClick = callback
  }

  setDisabled(disabled: boolean): void {
    this.isDisabled = disabled
    this.cursor = disabled ? 'not-allowed' : 'pointer'
    this.drawBackground(this.btnWidth, this.btnHeight)
  }

  setEnabled(enabled: boolean): void {
    this.setDisabled(!enabled)
  }

  setHighlighted(highlighted: boolean): void {
    this.background.clear()
    this.background.roundRect(0, 0, this.btnWidth, this.btnHeight, 10)
    this.background.fill(highlighted ? Colors.BUTTON_HOVER : Colors.BUTTON_NORMAL)
    this.background.stroke({ color: highlighted ? Colors.TEXT_GOLD : Colors.TEXT_SECONDARY, width: highlighted ? 3 : 2 })
  }

  setText(text: string): void {
    this.labelText.text = text
  }

  /**
   * 销毁按钮，清理所有子对象和事件监听
   */
  destroy(): void {
    this.off('pointerdown')
    this.off('pointerover')
    this.off('pointerout')

    this.background.destroy()
    this.labelText.destroy()

    this.onClick = undefined
    super.destroy()
  }
}