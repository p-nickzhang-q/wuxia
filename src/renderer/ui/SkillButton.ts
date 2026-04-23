import { Container, Graphics, Text } from 'pixi.js'
import { Colors, TextStyles, Renderer } from '../Renderer'
import { LayoutConstants } from '../LayoutConstants'

/**
 * 技能按钮组件
 */
export class SkillButton extends Container {
  private background: Graphics
  private nameLabel: Text
  private costLabel: Text
  private descLabel: Text
  private skillId: string
  private onClick?: (skillId: string) => void
  private isAvailable: boolean = true
  private isSelected: boolean = false
  private btnWidth: number
  private btnHeight: number

  constructor(
    skillId: string,
    name: string,
    mpCost: number,
    agilityCost: number,
    description: string,
    renderer: Renderer
  ) {
    super()
    this.skillId = skillId
    this.btnWidth = LayoutConstants.skillBtnWidth()
    this.btnHeight = LayoutConstants.skillBtnHeight()

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    this.nameLabel = renderer.createText(name, TextStyles.SKILL_NAME, 8, 6)
    this.nameLabel.style.fontSize = LayoutConstants.fontSkillName()
    this.addChild(this.nameLabel)

    this.costLabel = renderer.createText(`MP:${mpCost} 轻功:${agilityCost}`, TextStyles.CARD_STATS, 8, 28)
    this.costLabel.style.fontSize = LayoutConstants.fontCardType()
    this.addChild(this.costLabel)

    this.descLabel = renderer.createText(description, TextStyles.CARD_TYPE, 8, 48)
    this.descLabel.style.fontSize = LayoutConstants.fontCardType()
    this.descLabel.style.wordWrap = true
    this.descLabel.style.wordWrapWidth = this.btnWidth - 16
    this.addChild(this.descLabel)

    this.drawBackground()

    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.on('pointerdown', () => this.handleClick())
    this.on('pointerover', () => this.handleHover(true))
    this.on('pointerout', () => this.handleHover(false))
  }

  private drawBackground(): void {
    let color: number
    let borderColor: number
    let borderWidth: number

    if (this.isSelected) {
      color = 0x5a3a6e
      borderColor = Colors.TEXT_GOLD
      borderWidth = 4
    } else if (this.isAvailable) {
      color = 0x3a2a4e
      borderColor = Colors.TEXT_RED
      borderWidth = 2
    } else {
      color = 0x333333
      borderColor = 0x555555
      borderWidth = 1
    }

    this.background.clear()
    this.background.roundRect(0, 0, this.btnWidth, this.btnHeight, 8)
    this.background.fill(color)
    this.background.stroke({ color: borderColor, width: borderWidth })
  }

  private handleClick(): void {
    if (this.onClick) {
      this.onClick(this.skillId)
    }
  }

  private handleHover(isHover: boolean): void {
    if (!this.isSelected) {
      let color: number
      if (this.isAvailable) {
        color = isHover ? 0x4a3a5e : 0x3a2a4e
      } else {
        color = isHover ? 0x444444 : 0x333333
      }
      this.background.clear()
      this.background.roundRect(0, 0, this.btnWidth, this.btnHeight, 8)
      this.background.fill(color)
      const borderColor = this.isAvailable ? Colors.TEXT_RED : 0x555555
      this.background.stroke({ color: borderColor, width: this.isAvailable ? 2 : 1 })
    }
  }

  setOnClick(callback: (skillId: string) => void): void {
    this.onClick = callback
  }

  setAvailable(available: boolean): void {
    this.isAvailable = available
    this.cursor = available ? 'pointer' : 'not-allowed'
    this.drawBackground()
  }

  setSelected(selected: boolean): void {
    this.isSelected = selected
    this.drawBackground()
  }

  getSkillId(): string {
    return this.skillId
  }
}