import { Container, Graphics, Text } from 'pixi.js'
import { Colors, TextStyles, Renderer } from './Renderer'

// 按钮类
export class Button extends Container {
  private background: Graphics
  private labelText: Text
  private onClick?: () => void
  private isDisabled: boolean = false
  private btnWidth: number
  private btnHeight: number

  constructor(
    text: string,
    width: number = 120,
    height: number = 40,
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

    // 交互
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.on('pointerdown', () => this.handleClick())
    this.on('pointerover', () => this.handleHover(true))
    this.on('pointerout', () => this.handleHover(false))
  }

  private drawBackground(width: number, height: number): void {
    const color = this.isDisabled ? Colors.BUTTON_DISABLED : Colors.BUTTON_NORMAL
    this.background.clear()
    this.background.roundRect(0, 0, width, height, 8)
    this.background.fill(color)
    this.background.stroke({ color: Colors.TEXT_GOLD, width: 2 })
  }

  private handleClick(): void {
    if (!this.isDisabled && this.onClick) {
      this.onClick()
    }
  }

  private handleHover(isHover: boolean): void {
    if (!this.isDisabled) {
      this.background.clear()
      this.background.roundRect(0, 0, this.btnWidth, this.btnHeight, 8)
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

  setText(text: string): void {
    this.labelText.text = text
  }
}

// 技能按钮类
export class SkillButton extends Container {
  private background: Graphics
  private nameLabel: Text
  private costLabel: Text
  private descLabel: Text
  private skillId: string
  private onClick?: (skillId: string) => void
  private isAvailable: boolean = true
  private isSelected: boolean = false
  private btnWidth: number = 140
  private btnHeight: number = 60

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

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    // 技能名称
    this.nameLabel = renderer.createText(name, TextStyles.SKILL_NAME, 5, 5)
    this.nameLabel.style.fontSize = 12
    this.addChild(this.nameLabel)

    // 消耗
    this.costLabel = renderer.createText(`MP:${mpCost} 轻功:${agilityCost}`, TextStyles.CARD_STATS, 5, 22)
    this.costLabel.style.fontSize = 10
    this.addChild(this.costLabel)

    // 描述
    this.descLabel = renderer.createText(description, TextStyles.CARD_TYPE, 5, 38)
    this.descLabel.style.fontSize = 9
    this.descLabel.style.wordWrap = true
    this.descLabel.style.wordWrapWidth = this.btnWidth - 10
    this.addChild(this.descLabel)

    this.drawBackground()

    // 交互
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
      borderWidth = 3
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
    this.background.roundRect(0, 0, this.btnWidth, this.btnHeight, 6)
    this.background.fill(color)
    this.background.stroke({ color: borderColor, width: borderWidth })
  }

  private handleClick(): void {
    // 即使不可用也可以点击选中
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
      this.background.roundRect(0, 0, this.btnWidth, this.btnHeight, 6)
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

// 战斗日志组件
export class BattleLog extends Container {
  private logContainer: Container
  private logs: Array<{ text: Text; container: Container }> = []
  private renderer: Renderer
  private clipMask: Graphics
  private scrollBar: Graphics
  private scrollY: number = 0
  private contentHeight: number = 0
  private userScrolled: boolean = false  // 用户是否手动滚动过

  private readonly panelWidth: number = 380
  private readonly panelHeight: number = 280
  private readonly padding: number = 10

  constructor(renderer: Renderer) {
    super()
    this.renderer = renderer

    // 背景
    const bg = renderer.createGraphics()
    bg.roundRect(0, 0, this.panelWidth, this.panelHeight, 8)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.9 })
    bg.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })
    this.addChild(bg)

    // 标题
    const title = renderer.createText('战斗日志', TextStyles.STATS, this.padding, 5)
    title.style.fill = Colors.TEXT_GOLD
    this.addChild(title)

    // 遮罩
    this.clipMask = renderer.createGraphics()
    this.clipMask.rect(0, 25, this.panelWidth - 20, this.panelHeight - 35)
    this.clipMask.fill(0xffffff)
    this.addChild(this.clipMask)

    // 日志容器
    this.logContainer = renderer.createContainer(this.padding, 28)
    this.logContainer.mask = this.clipMask
    this.addChild(this.logContainer)

    // 滚动条背景
    const scrollBg = renderer.createGraphics()
    scrollBg.rect(this.panelWidth - 15, 25, 10, this.panelHeight - 35)
    scrollBg.fill(0x333333)
    this.addChild(scrollBg)

    // 滚动条
    this.scrollBar = renderer.createGraphics()
    this.addChild(this.scrollBar)

    // 滚轮事件
    this.eventMode = 'static'
    this.on('wheel', (e: WheelEvent) => this.handleWheel(e))
  }

  addLog(message: string): void {
    const text = new Text({
      text: message,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
        fill: Colors.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: this.panelWidth - 40
      }
    })

    const container = this.renderer.createContainer(0, 0)
    container.addChild(text)
    this.logContainer.addChild(container)

    this.logs.push({ text, container })

    // 更新位置
    this.updatePositions()

    // 新日志添加时重置用户滚动状态并滚动到底部
    this.userScrolled = false
    this.scrollToBottom()
  }

  // 同步日志（不自动滚动）
  syncLog(message: string): void {
    const text = new Text({
      text: message,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 12,
        fill: Colors.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: this.panelWidth - 40
      }
    })

    const container = this.renderer.createContainer(0, 0)
    container.addChild(text)
    this.logContainer.addChild(container)

    this.logs.push({ text, container })

    this.updatePositions()

    // 只有用户没有手动滚动时才自动滚动
    if (!this.userScrolled) {
      this.scrollToBottom()
    }
  }

  private updatePositions(): void {
    let y = 0
    for (const log of this.logs) {
      log.container.y = y
      y += log.text.height + 5
    }
    this.contentHeight = y
    this.updateScrollBar()
  }

  private updateScrollBar(): void {
    const viewHeight = this.panelHeight - 35
    const scrollBarHeight = Math.max(30, (viewHeight / Math.max(this.contentHeight, viewHeight)) * viewHeight)

    this.scrollBar.clear()
    if (this.contentHeight > viewHeight) {
      const maxScroll = this.contentHeight - viewHeight
      const scrollRatio = maxScroll > 0 ? this.scrollY / maxScroll : 0
      const scrollBarY = 25 + scrollRatio * (viewHeight - scrollBarHeight)

      this.scrollBar.rect(this.panelWidth - 15, scrollBarY, 10, scrollBarHeight)
      this.scrollBar.fill(Colors.TEXT_GOLD)
    }
  }

  private handleWheel(e: WheelEvent): void {
    const viewHeight = this.panelHeight - 35
    const maxScroll = Math.max(0, this.contentHeight - viewHeight)

    this.scrollY += e.deltaY * 0.5
    this.scrollY = Math.max(0, Math.min(this.scrollY, maxScroll))

    this.logContainer.y = 28 - this.scrollY
    this.updateScrollBar()

    // 标记用户手动滚动
    if (this.scrollY < maxScroll) {
      this.userScrolled = true
    }
  }

  private scrollToBottom(): void {
    const viewHeight = this.panelHeight - 35
    const maxScroll = Math.max(0, this.contentHeight - viewHeight)
    this.scrollY = maxScroll
    this.logContainer.y = 28 - this.scrollY
    this.updateScrollBar()
  }

  clear(): void {
    this.logs = []
    this.logContainer.removeChildren()
    this.scrollY = 0
    this.contentHeight = 0
    this.userScrolled = false
    this.updateScrollBar()
  }

  getLogCount(): number {
    return this.logs.length
  }
}

// 状态栏组件
export class StatusBar extends Container {
  private background: Graphics
  private turnText: Text
  private phaseText: Text

  constructor(renderer: Renderer) {
    super()

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    this.turnText = renderer.createText('回合 1', TextStyles.STATS, 10, 8)
    this.turnText.style.fill = Colors.TEXT_GOLD
    this.addChild(this.turnText)

    this.phaseText = renderer.createText('选择阶段', TextStyles.STATS, 100, 8)
    this.addChild(this.phaseText)

    this.drawBackground()
  }

  private drawBackground(): void {
    this.background.clear()
    this.background.roundRect(0, 0, 200, 35, 6)
    this.background.fill(Colors.PANEL_BG)
    this.background.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })
  }

  setTurn(turn: number): void {
    this.turnText.text = `回合 ${turn}`
  }

  setPhase(phase: string): void {
    this.phaseText.text = phase
  }
}

// 提示框组件
export class Tooltip extends Container {
  private background: Graphics
  private tooltipText: Text

  constructor(renderer: Renderer) {
    super()
    this.visible = false

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    this.tooltipText = renderer.createText('', TextStyles.LOG, 10, 8)
    this.tooltipText.style.wordWrapWidth = 200
    this.addChild(this.tooltipText)
  }

  show(message: string, x: number, y: number): void {
    this.tooltipText.text = message

    // 计算尺寸
    const width = Math.min(this.tooltipText.width + 20, 220)
    const height = this.tooltipText.height + 16

    this.background.clear()
    this.background.roundRect(0, 0, width, height, 4)
    this.background.fill({ color: 0x000000, alpha: 0.9 })
    this.background.stroke({ color: Colors.TEXT_GOLD, width: 1 })

    this.x = x
    this.y = y
    this.visible = true
  }

  hide(): void {
    this.visible = false
  }
}