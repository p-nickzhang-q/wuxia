import { Container, Graphics, Text } from 'pixi.js'
import { Colors, TextStyles, Renderer } from './Renderer'
import { LayoutConstants } from './LayoutConstants'

// 按钮类 - 使用响应式尺寸
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
    this.background.roundRect(0, 0, width, height, 10)
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

  setText(text: string): void {
    this.labelText.text = text
  }
}

// 技能按钮类 - 使用响应式尺寸
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

    // 技能名称
    this.nameLabel = renderer.createText(name, TextStyles.SKILL_NAME, 8, 6)
    this.nameLabel.style.fontSize = LayoutConstants.fontSkillName()
    this.addChild(this.nameLabel)

    // 消耗
    this.costLabel = renderer.createText(`MP:${mpCost} 轻功:${agilityCost}`, TextStyles.CARD_STATS, 8, 28)
    this.costLabel.style.fontSize = LayoutConstants.fontCardType()
    this.addChild(this.costLabel)

    // 描述
    this.descLabel = renderer.createText(description, TextStyles.CARD_TYPE, 8, 48)
    this.descLabel.style.fontSize = LayoutConstants.fontCardType()
    this.descLabel.style.wordWrap = true
    this.descLabel.style.wordWrapWidth = this.btnWidth - 16
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

// 战斗日志组件 - 使用响应式尺寸
export class BattleLog extends Container {
  private logContainer: Container
  private logs: Array<{ text: Text; container: Container; targetX: number; targetY: number; animating: boolean }> = []
  private renderer: Renderer
  private clipMask: Graphics
  private scrollBar: Graphics
  private scrollY: number = 0
  private contentHeight: number = 0
  private userScrolled: boolean = false

  private panelWidth: number
  private panelHeight: number
  private readonly padding: number

  // 日志动画
  private logAnimating: boolean = false

  constructor(renderer: Renderer) {
    super()
    this.renderer = renderer
    this.panelWidth = LayoutConstants.logWidth()
    this.panelHeight = LayoutConstants.logHeight()
    this.padding = LayoutConstants.scaleValue(12)

    // 背景
    const bg = renderer.createGraphics()
    bg.roundRect(0, 0, this.panelWidth, this.panelHeight, 10)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.85 })
    bg.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })
    this.addChild(bg)

    // 标题
    const title = renderer.createText('战斗日志', TextStyles.STATS, this.padding, 6)
    title.style.fill = Colors.TEXT_GOLD
    title.style.fontSize = LayoutConstants.fontStats()
    this.addChild(title)

    const titleHeight = LayoutConstants.scaleValue(28)

    // 遮罩
    this.clipMask = renderer.createGraphics()
    this.clipMask.rect(0, titleHeight, this.panelWidth - 25, this.panelHeight - titleHeight - 12)
    this.clipMask.fill(0xffffff)
    this.addChild(this.clipMask)

    // 日志容器
    this.logContainer = renderer.createContainer(this.padding, titleHeight + 3)
    this.logContainer.mask = this.clipMask
    this.addChild(this.logContainer)

    // 滚动条背景
    const scrollBg = renderer.createGraphics()
    scrollBg.rect(this.panelWidth - 18, titleHeight, 12, this.panelHeight - titleHeight - 12)
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
        fontSize: LayoutConstants.fontLog(),
        fill: Colors.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: this.panelWidth - 45
      }
    })

    const container = this.renderer.createContainer(0, 0)
    container.addChild(text)
    // 初始位置：右侧+透明
    container.x = this.panelWidth
    container.alpha = 0
    this.logContainer.addChild(container)

    // 计算目标位置
    const targetY = this.calculateNewY()
    this.logs.push({ text, container, targetX: 0, targetY, animating: true })

    // 用户未手动滚动，动画中会自动滚动到底
    this.userScrolled = false

    // 启动滑入动画
    this.startLogAnimation()
  }

  syncLog(message: string): void {
    const text = new Text({
      text: message,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontLog(),
        fill: Colors.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: this.panelWidth - 45
      }
    })

    const container = this.renderer.createContainer(0, 0)
    container.addChild(text)
    // 初始位置：右侧+透明
    container.x = this.panelWidth
    container.alpha = 0
    this.logContainer.addChild(container)

    // 计算目标位置
    const targetY = this.calculateNewY()
    this.logs.push({ text, container, targetX: 0, targetY, animating: true })

    // 启动滑入动画（如果用户未手动滚动，动画中会自动滚动到底）
    this.startLogAnimation()
  }

  // 计算新日志的目标Y位置
  private calculateNewY(): number {
    let y = 0
    for (const log of this.logs) {
      if (!log.animating) {
        y += log.text.height + 5
      }
    }
    return y
  }

  // 启动日志动画
  private startLogAnimation(): void {
    if (!this.logAnimating) {
      this.logAnimating = true
      this.animateLogs()
    }
  }

  // 日志滑入动画
  private animateLogs(): void {
    const animationSpeed = 0.15
    let stillAnimating = false

    // 更新每条正在动画的日志
    for (let i = 0; i < this.logs.length; i++) {
      const log = this.logs[i]
      if (log.animating) {
        // X 滑入
        if (log.container.x !== log.targetX) {
          const diff = log.targetX - log.container.x
          log.container.x += diff * animationSpeed
          if (Math.abs(diff) < 1) {
            log.container.x = log.targetX
          } else {
            stillAnimating = true
          }
        }

        // Alpha 淡入
        if (log.container.alpha < 1) {
          log.container.alpha += (1 - log.container.alpha) * animationSpeed
          if (log.container.alpha > 0.95) {
            log.container.alpha = 1
          } else {
            stillAnimating = true
          }
        }

        // Y 位置跟随
        if (log.container.y !== log.targetY) {
          const diff = log.targetY - log.container.y
          log.container.y += diff * animationSpeed
          if (Math.abs(diff) < 1) {
            log.container.y = log.targetY
          } else {
            stillAnimating = true
          }
        }

        // 检查是否完成
        if (log.container.x === log.targetX &&
            log.container.alpha === 1 &&
            log.container.y === log.targetY) {
          log.animating = false
        }
      }
    }

    // 更新后续日志的目标位置（为新日志腾出空间）
    this.updateTargetPositions()

    // 动画过程中持续滚动到底部（如果用户没有手动滚动）
    if (!this.userScrolled) {
      this.scrollToBottomAnimated()
    }

    // 继续动画或结束
    if (stillAnimating) {
      requestAnimationFrame(() => this.animateLogs())
    } else {
      this.logAnimating = false
      this.contentHeight = this.calculateContentHeight()
      this.updateScrollBar()
      // 动画结束后确保滚动到底部
      if (!this.userScrolled) {
        this.scrollToBottom()
      }
    }
  }

  // 平滑滚动到底部
  private scrollToBottomAnimated(): void {
    const titleHeight = LayoutConstants.scaleValue(28)
    const viewHeight = this.panelHeight - titleHeight - 12
    const maxScroll = Math.max(0, this.calculateContentHeight() - viewHeight)

    // 平滑滚动
    const scrollDiff = maxScroll - this.scrollY
    if (scrollDiff > 0) {
      this.scrollY += scrollDiff * 0.2
      this.logContainer.y = titleHeight + 3 - this.scrollY
      this.updateScrollBar()
    }
  }

  // 更新所有日志的目标Y位置
  private updateTargetPositions(): void {
    let y = 0
    for (const log of this.logs) {
      log.targetY = y
      // 如果不是正在动画的日志，直接设置位置
      if (!log.animating) {
        log.container.y = y
      }
      y += log.text.height + 5
    }
  }

  // 计算内容总高度
  private calculateContentHeight(): number {
    let y = 0
    for (const log of this.logs) {
      y += log.text.height + 5
    }
    return y
  }

  private updateScrollBar(): void {
    const titleHeight = LayoutConstants.scaleValue(28)
    const viewHeight = this.panelHeight - titleHeight - 12
    const scrollBarHeight = Math.max(30, (viewHeight / Math.max(this.contentHeight, viewHeight)) * viewHeight)

    this.scrollBar.clear()
    if (this.contentHeight > viewHeight) {
      const maxScroll = this.contentHeight - viewHeight
      const scrollRatio = maxScroll > 0 ? this.scrollY / maxScroll : 0
      const scrollBarY = titleHeight + scrollRatio * (viewHeight - scrollBarHeight)

      this.scrollBar.rect(this.panelWidth - 18, scrollBarY, 12, scrollBarHeight)
      this.scrollBar.fill(Colors.TEXT_GOLD)
    }
  }

  private handleWheel(e: WheelEvent): void {
    const titleHeight = LayoutConstants.scaleValue(28)
    const viewHeight = this.panelHeight - titleHeight - 12
    const maxScroll = Math.max(0, this.contentHeight - viewHeight)

    this.scrollY += e.deltaY * 0.5
    this.scrollY = Math.max(0, Math.min(this.scrollY, maxScroll))

    this.logContainer.y = titleHeight + 3 - this.scrollY
    this.updateScrollBar()

    if (this.scrollY < maxScroll) {
      this.userScrolled = true
    }
  }

  private scrollToBottom(): void {
    const titleHeight = LayoutConstants.scaleValue(28)
    const viewHeight = this.panelHeight - titleHeight - 12
    const maxScroll = Math.max(0, this.contentHeight - viewHeight)
    this.scrollY = maxScroll
    this.logContainer.y = titleHeight + 3 - this.scrollY
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

// 状态栏组件 - 使用响应式尺寸
export class StatusBar extends Container {
  private background: Graphics
  private turnText: Text
  private phaseText: Text

  constructor(renderer: Renderer) {
    super()

    const width = LayoutConstants.statusWidth()
    const height = LayoutConstants.statusHeight()

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    this.turnText = renderer.createText('回合 1', TextStyles.STATS, 12, 8)
    this.turnText.style.fill = Colors.TEXT_GOLD
    this.turnText.style.fontSize = LayoutConstants.fontStats()
    this.addChild(this.turnText)

    this.phaseText = renderer.createText('选择阶段', TextStyles.STATS, 110, 8)
    this.phaseText.style.fontSize = LayoutConstants.fontStats()
    this.addChild(this.phaseText)

    this.drawBackground(width, height)
  }

  private drawBackground(width: number, height: number): void {
    this.background.clear()
    this.background.roundRect(0, 0, width, height, 8)
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

// 提示框组件 - 使用响应式尺寸
export class Tooltip extends Container {
  private background: Graphics
  private tooltipText: Text

  constructor(renderer: Renderer) {
    super()
    this.visible = false

    this.background = renderer.createGraphics()
    this.addChild(this.background)

    this.tooltipText = renderer.createText('', TextStyles.LOG, 12, 8)
    this.tooltipText.style.wordWrapWidth = LayoutConstants.scaleValue(220)
    this.addChild(this.tooltipText)
  }

  show(message: string, x: number, y: number): void {
    this.tooltipText.text = message

    const width = Math.min(this.tooltipText.width + 24, LayoutConstants.scaleValue(240))
    const height = this.tooltipText.height + 20

    this.background.clear()
    this.background.roundRect(0, 0, width, height, 6)
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

// 轻功轴组件 - 显示行动顺序
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

  // 动画状态
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

    // 背景
    this.background = renderer.createGraphics()
    this.addChild(this.background)

    // 轴线
    this.axisLine = renderer.createGraphics()
    this.addChild(this.axisLine)

    // 玩家标记
    this.playerMarker = renderer.createGraphics()
    this.addChild(this.playerMarker)

    // 敌人标记
    this.enemyMarker = renderer.createGraphics()
    this.addChild(this.enemyMarker)

    // 玩家名字
    this.playerNameText = renderer.createText('', TextStyles.STATS, 0, 0)
    this.playerNameText.anchor.set(0.5)
    this.playerNameText.style.fill = Colors.TEXT_RED
    this.addChild(this.playerNameText)

    // 敌人名字
    this.enemyNameText = renderer.createText('', TextStyles.STATS, 0, 0)
    this.enemyNameText.anchor.set(0.5)
    this.enemyNameText.style.fill = Colors.TEXT_BLUE
    this.addChild(this.enemyNameText)

    // 玩家轻功数值
    this.playerAgilityText = renderer.createText('', TextStyles.CARD_STATS, 0, 0)
    this.playerAgilityText.anchor.set(0.5)
    this.addChild(this.playerAgilityText)

    // 敌人轻功数值
    this.enemyAgilityText = renderer.createText('', TextStyles.CARD_STATS, 0, 0)
    this.enemyAgilityText.anchor.set(0.5)
    this.addChild(this.enemyAgilityText)

    // 当前行动箭头
    this.turnArrow = renderer.createGraphics()
    this.addChild(this.turnArrow)

    // 初始化动画位置
    this.animatedPlayerX = this.padding
    this.animatedEnemyX = this.padding
    this.targetPlayerX = this.padding
    this.targetEnemyX = this.padding

    this.drawStaticElements()
  }

  private drawStaticElements(): void {
    const markerSize = LayoutConstants.agilityMarkerSize()
    const axisY = this.axisHeight * 0.55

    // 背景
    this.background.clear()
    this.background.roundRect(0, 0, this.axisWidth, this.axisHeight, 8)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.85 })
    this.background.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })

    // 轴线
    this.axisLine.clear()
    this.axisLine.moveTo(this.padding, axisY)
    this.axisLine.lineTo(this.axisWidth - this.padding, axisY)
    this.axisLine.stroke({ color: Colors.TEXT_SECONDARY, width: 2 })

    // 刻度 0
    const zeroText = this.renderer.createText('0', TextStyles.CARD_STATS, this.padding, axisY + 5)
    zeroText.anchor.set(0.5, 0)
    zeroText.style.fill = Colors.TEXT_SECONDARY
    zeroText.style.fontSize = LayoutConstants.fontCardType()
    this.addChild(zeroText)

    // 刻度 max
    const maxText = this.renderer.createText(`${this.maxAgility}`, TextStyles.CARD_STATS, this.axisWidth - this.padding, axisY + 5)
    maxText.anchor.set(0.5, 0)
    maxText.style.fill = Colors.TEXT_SECONDARY
    maxText.style.fontSize = LayoutConstants.fontCardType()
    this.addChild(maxText)

    // 玩家标记（红色圆形）
    this.playerMarker.clear()
    this.playerMarker.circle(0, axisY, markerSize)
    this.playerMarker.fill(Colors.TEXT_RED)
    this.playerMarker.stroke({ color: Colors.TEXT_PRIMARY, width: 2 })

    // 敌人标记（蓝色圆形）
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

    // 更新角色名
    this.playerNameText.text = playerName
    this.enemyNameText.text = enemyName

    // 计算目标位置
    this.targetPlayerX = this.padding + Math.min(playerAgility / this.maxAgility, 1) * axisLength
    this.targetEnemyX = this.padding + Math.min(enemyAgility / this.maxAgility, 1) * axisLength
    this.currentActor = currentActor

    // 更新轻功数值文本
    this.playerAgilityText.text = `${playerAgility}`
    this.enemyAgilityText.text = `${enemyAgility}`

    // 如果位置有变化，启动动画
    if (this.animatedPlayerX !== this.targetPlayerX || this.animatedEnemyX !== this.targetEnemyX) {
      if (!this.animating) {
        this.animating = true
        this.animate()
      }
    } else {
      // 位置相同，直接更新
      this.updatePositions()
    }
  }

  // 平滑动画
  private animate(): void {
    const animationSpeed = 0.12

    // 计算新位置
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

    // 更新显示位置
    this.updatePositions()

    // 继续动画或结束
    if (this.animatedPlayerX !== this.targetPlayerX || this.animatedEnemyX !== this.targetEnemyX) {
      requestAnimationFrame(() => this.animate())
    } else {
      this.animating = false
    }
  }

  // 更新显示位置
  private updatePositions(): void {
    const markerSize = LayoutConstants.agilityMarkerSize()
    const axisY = this.axisHeight * 0.55

    const playerX = this.animatedPlayerX
    const enemyX = this.animatedEnemyX

    // 更新标记位置
    this.playerMarker.x = playerX
    this.enemyMarker.x = enemyX

    // 更新名字位置（标记上方）
    this.playerNameText.x = playerX
    this.playerNameText.y = axisY - markerSize - 18
    this.enemyNameText.x = enemyX
    this.enemyNameText.y = axisY - markerSize - 18

    // 更新轻功数值位置（标记下方）
    this.playerAgilityText.x = playerX
    this.playerAgilityText.y = axisY + markerSize + 8
    this.enemyAgilityText.x = enemyX
    this.enemyAgilityText.y = axisY + markerSize + 8

    // 更新当前行动箭头
    this.turnArrow.clear()
    this.turnArrow.removeChildren()
    if (this.currentActor !== null) {
      const turnX = this.targetPlayerX >= this.targetEnemyX ? playerX : enemyX
      this.turnArrow.x = turnX
      this.turnArrow.y = axisY - markerSize - 28

      // 绘制向下箭头
      const arrowSize = LayoutConstants.scaleValue(8)
      this.turnArrow.moveTo(-arrowSize, -arrowSize)
      this.turnArrow.lineTo(0, 0)
      this.turnArrow.lineTo(arrowSize, -arrowSize)
      this.turnArrow.stroke({ color: Colors.TEXT_GOLD, width: 3 })

      // "当前行动"文字
      const turnText = this.renderer.createText('当前行动', TextStyles.CARD_STATS, 0, -arrowSize * 2 - 2)
      turnText.anchor.set(0.5, 1)
      turnText.style.fill = Colors.TEXT_GOLD
      turnText.style.fontSize = LayoutConstants.fontCardType()
      this.turnArrow.addChild(turnText)
    }
  }
}