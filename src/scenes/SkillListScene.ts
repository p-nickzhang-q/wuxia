import { Container, Graphics, Text } from 'pixi.js'
import { Scene } from './Scene'
import { Renderer, Colors, TextStyles } from '../renderer/Renderer'
import { Button } from '../renderer/UIComponents'
import { martialArtSkills, passiveSkills } from '../data/skills'
import { CardType, MartialArtSkill, PassiveSkill, TriggerTiming } from '../game/types'
import { LayoutConstants } from '../renderer/LayoutConstants'

// 卡牌类型名称映射
const CardTypeNames: Record<string, string> = {
  [CardType.EMPTY_HAND]: '空手',
  [CardType.SHORT_WEAPON]: '短兵',
  [CardType.LONG_WEAPON]: '长兵',
  [CardType.LEG]: '腿法',
  'any': '特殊'
}

// 触发时机名称映射
const TriggerTimingNames: Record<TriggerTiming, string> = {
  [TriggerTiming.TURN_START]: '回合开始',
  [TriggerTiming.TURN_END]: '回合结束',
  [TriggerTiming.ON_DAMAGE]: '造成伤害时',
  [TriggerTiming.ON_TAKE_DAMAGE]: '受到伤害时',
  [TriggerTiming.ON_PLAY_CARD]: '使用基础招式时',
  [TriggerTiming.ON_SKILL_USE]: '使用武功招式时'
}

// 武功查看场景
export class SkillListScene extends Scene {
  private scrollContainer: Container | null = null
  private scrollMask: Graphics | null = null
  private scrollContent: Container | null = null
  private scrollbar: Graphics | null = null
  private scrollY: number = 0
  private maxScrollY: number = 0
  private isDragging: boolean = false
  private dragStartY: number = 0
  private dragStartScrollY: number = 0
  private contentHeight: number = 0
  private viewHeight: number = 0

  private currentTab: 'skill' | 'passive' = 'skill'
  private tabButtons: { skill: Button | null; passive: Button | null } = { skill: null, passive: null }
  private onBack?: () => void

  // DOM事件绑定引用
  private boundWheelHandler: (e: WheelEvent) => void
  private boundPointerDownHandler: (e: PointerEvent) => void
  private boundPointerMoveHandler: (e: PointerEvent) => void
  private boundPointerUpHandler: (e: PointerEvent) => void

  constructor(renderer: Renderer) {
    super(renderer)

    this.boundWheelHandler = this.handleWheel.bind(this)
    this.boundPointerDownHandler = this.handlePointerDown.bind(this)
    this.boundPointerMoveHandler = this.handlePointerMove.bind(this)
    this.boundPointerUpHandler = this.handlePointerUp.bind(this)
  }

  onEnter(): void {
    this.renderer.onResize(() => this.handleResize())
    this.createUI()

    window.addEventListener('wheel', this.boundWheelHandler, { passive: false })
    window.addEventListener('pointerdown', this.boundPointerDownHandler)
    window.addEventListener('pointermove', this.boundPointerMoveHandler)
    window.addEventListener('pointerup', this.boundPointerUpHandler)

    this.isInitialized = true
  }

  onExit(): void {
    window.removeEventListener('wheel', this.boundWheelHandler)
    window.removeEventListener('pointerdown', this.boundPointerDownHandler)
    window.removeEventListener('pointermove', this.boundPointerMoveHandler)
    window.removeEventListener('pointerup', this.boundPointerUpHandler)

    this.renderer.offResize(() => this.handleResize())
    this.clear()
  }

  private handleResize(): void {
    this.clear()
    this.createUI()
  }

  private handleWheel(e: WheelEvent): void {
    if (!this.scrollContent || this.maxScrollY <= 0) return
    e.preventDefault()
    const delta = e.deltaY || 0
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + delta * 0.8))
    this.updateScrollPosition()
  }

  private handlePointerDown(e: PointerEvent): void {
    if (!this.scrollContent) return
    const size = this.renderer.getSize()
    const titleHeight = size.height * 0.02 + LayoutConstants.scaleValue(80)
    const tabHeight = LayoutConstants.scaleValue(50)

    if (e.clientY >= titleHeight + tabHeight && this.maxScrollY > 0) {
      this.isDragging = true
      this.dragStartY = e.clientY
      this.dragStartScrollY = this.scrollY
    }
  }

  private handlePointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.scrollContent) return
    const deltaY = this.dragStartY - e.clientY
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.dragStartScrollY + deltaY))
    this.updateScrollPosition()
  }

  private handlePointerUp(): void {
    this.isDragging = false
  }

  private updateScrollPosition(): void {
    if (!this.scrollContent || !this.scrollbar) return
    this.scrollContent.y = -this.scrollY
    this.updateScrollbar()
  }

  private updateScrollbar(): void {
    if (!this.scrollbar || this.contentHeight <= this.viewHeight) {
      if (this.scrollbar) this.scrollbar.visible = false
      return
    }

    this.scrollbar.visible = true
    const size = this.renderer.getSize()
    const titleHeight = size.height * 0.02 + LayoutConstants.scaleValue(80)
    const tabHeight = LayoutConstants.scaleValue(50)
    const scrollAreaY = titleHeight + tabHeight
    const scrollAreaHeight = size.height - scrollAreaY - LayoutConstants.scaleValue(70)

    const scrollbarHeight = Math.max(40, (this.viewHeight / this.contentHeight) * scrollAreaHeight)
    const scrollbarY = scrollAreaY + (this.scrollY / this.maxScrollY) * (scrollAreaHeight - scrollbarHeight)

    this.scrollbar.clear()
    this.scrollbar.roundRect(0, scrollAreaY, 10, scrollAreaHeight, 5)
    this.scrollbar.fill({ color: 0x333333, alpha: 0.5 })
    this.scrollbar.roundRect(0, scrollbarY, 10, scrollbarHeight, 5)
    this.scrollbar.fill({ color: Colors.TEXT_GOLD, alpha: 0.8 })
    this.scrollbar.x = size.width - 20
  }

  update(_delta: number): void {}

  private createUI(): void {
    this.createTitle()
    this.createTabs()
    this.createScrollableList()
    this.createBackButton()
  }

  private createTitle(): void {
    const size = this.renderer.getSize()
    const titleY = size.height * 0.02

    const title = this.renderer.createText('武功秘籍', TextStyles.TITLE, 0, titleY)
    title.anchor.set(0.5, 0)
    title.x = size.width / 2
    this.addChild(title)

    const subtitle = this.renderer.createText('浏览所有武功招式与内功心法', TextStyles.SUBTITLE, 0, titleY + LayoutConstants.scaleValue(50))
    subtitle.anchor.set(0.5, 0)
    subtitle.x = size.width / 2
    this.addChild(subtitle)
  }

  private createTabs(): void {
    const size = this.renderer.getSize()
    const tabY = size.height * 0.02 + LayoutConstants.scaleValue(80)
    const tabWidth = LayoutConstants.scaleValue(150)
    const tabHeight = LayoutConstants.scaleValue(40)
    const spacing = LayoutConstants.scaleValue(20)

    const totalWidth = tabWidth * 2 + spacing
    const startX = (size.width - totalWidth) / 2

    // 武功招式标签
    this.tabButtons.skill = new Button('武功招式', tabWidth, tabHeight, this.renderer)
    this.tabButtons.skill.x = startX
    this.tabButtons.skill.y = tabY
    this.tabButtons.skill.setOnClick(() => this.switchTab('skill'))
    this.addChild(this.tabButtons.skill)

    // 内功心法标签
    this.tabButtons.passive = new Button('内功心法', tabWidth, tabHeight, this.renderer)
    this.tabButtons.passive.x = startX + tabWidth + spacing
    this.tabButtons.passive.y = tabY
    this.tabButtons.passive.setOnClick(() => this.switchTab('passive'))
    this.addChild(this.tabButtons.passive)

    this.updateTabStyles()
  }

  private switchTab(tab: 'skill' | 'passive'): void {
    if (this.currentTab === tab) return
    this.currentTab = tab
    this.updateTabStyles()
    this.refreshList()
  }

  private updateTabStyles(): void {
    // 简单的标签样式切换 - 通过alpha区分选中状态
    if (this.tabButtons.skill) {
      this.tabButtons.skill.alpha = this.currentTab === 'skill' ? 1 : 0.6
    }
    if (this.tabButtons.passive) {
      this.tabButtons.passive.alpha = this.currentTab === 'passive' ? 1 : 0.6
    }
  }

  private createScrollableList(): void {
    const size = this.renderer.getSize()
    const titleHeight = size.height * 0.02 + LayoutConstants.scaleValue(80)
    const tabHeight = LayoutConstants.scaleValue(50)
    const scrollAreaY = titleHeight + tabHeight
    this.viewHeight = size.height - scrollAreaY - LayoutConstants.scaleValue(70)

    this.scrollContainer = this.renderer.createContainer(0, scrollAreaY)
    this.addChild(this.scrollContainer)

    this.scrollMask = this.renderer.createGraphics()
    this.scrollMask.rect(0, 0, size.width, this.viewHeight)
    this.scrollMask.fill({ color: 0xffffff, alpha: 0 })
    this.scrollContainer.addChild(this.scrollMask)

    this.scrollContent = this.renderer.createContainer()
    this.scrollContent.mask = this.scrollMask
    this.scrollContainer.addChild(this.scrollContent)

    this.scrollbar = this.renderer.createGraphics()
    this.addChild(this.scrollbar)

    this.fillList()
  }

  private refreshList(): void {
    if (!this.scrollContent) return
    this.scrollContent.removeChildren()
    this.scrollY = 0
    this.fillList()
    this.updateScrollbar()
  }

  private fillList(): void {
    if (!this.scrollContent) return

    if (this.currentTab === 'skill') {
      this.fillSkillList()
    } else {
      this.fillPassiveList()
    }
  }

  private fillSkillList(): void {
    if (!this.scrollContent) return

    const size = this.renderer.getSize()
    const skills = Object.values(martialArtSkills)

    const cardWidth = LayoutConstants.scaleValue(280)
    const cardHeight = LayoutConstants.scaleValue(140)
    const spacing = LayoutConstants.scaleValue(15)

    const minColumns = 3
    const maxColumns = 5
    const availableWidth = size.width * 0.95
    const calculatedColumns = Math.floor((availableWidth + spacing) / (cardWidth + spacing))
    const columns = Math.max(minColumns, Math.min(maxColumns, calculatedColumns))

    const gridWidth = columns * (cardWidth + spacing) - spacing
    const startX = (size.width - gridWidth) / 2
    const startY = 0

    let row = 0
    let col = 0

    for (const skill of skills) {
      const x = startX + col * (cardWidth + spacing)
      const y = startY + row * (cardHeight + spacing)

      const card = this.createSkillCard(skill, x, y, cardWidth, cardHeight)
      this.scrollContent.addChild(card)

      col++
      if (col >= columns) {
        col = 0
        row++
      }
    }

    const totalRows = Math.ceil(skills.length / columns)
    this.contentHeight = totalRows * (cardHeight + spacing) - spacing
    this.maxScrollY = Math.max(0, this.contentHeight - this.viewHeight)
  }

  private createSkillCard(skill: MartialArtSkill, x: number, y: number, cardWidth: number, cardHeight: number): Container {
    const container = this.renderer.createContainer(x, y)

    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, cardWidth, cardHeight, 10)
    bg.fill({ color: Colors.CARD_BG })
    bg.stroke({ color: Colors.TEXT_SECONDARY, width: 2 })
    container.addChild(bg)

    const padding = LayoutConstants.scaleValue(12)

    // 武功名称
    const name = new Text({
      text: skill.name,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCharacterName(),
        fill: Colors.TEXT_GOLD,
        fontWeight: 'bold'
      }
    })
    name.x = padding
    name.y = padding
    container.addChild(name)

    // 类型标签
    const typeName = CardTypeNames[skill.requiredCardType] || '特殊'
    const typeText = new Text({
      text: `[${typeName}]`,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCardType(),
        fill: Colors.MP_BAR
      }
    })
    typeText.x = cardWidth - typeText.width - padding
    typeText.y = padding
    container.addChild(typeText)

    // 消耗信息
    const costText = `MP: ${skill.mpCost}  轻功: ${skill.agilityCost}`
    const cost = new Text({
      text: costText,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontStats(),
        fill: Colors.TEXT_PRIMARY
      }
    })
    cost.x = padding
    cost.y = padding + LayoutConstants.fontCharacterName() + 10
    container.addChild(cost)

    // 效果描述
    const desc = new Text({
      text: skill.description,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCardType(),
        fill: Colors.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: cardWidth - padding * 2
      }
    })
    desc.x = padding
    desc.y = cost.y + LayoutConstants.fontStats() + 15
    container.addChild(desc)

    return container
  }

  private fillPassiveList(): void {
    if (!this.scrollContent) return

    const size = this.renderer.getSize()
    const passives = Object.values(passiveSkills)

    const cardWidth = LayoutConstants.scaleValue(350)
    const cardHeight = LayoutConstants.scaleValue(120)
    const spacing = LayoutConstants.scaleValue(15)

    const minColumns = 2
    const maxColumns = 4
    const availableWidth = size.width * 0.95
    const calculatedColumns = Math.floor((availableWidth + spacing) / (cardWidth + spacing))
    const columns = Math.max(minColumns, Math.min(maxColumns, calculatedColumns))

    const gridWidth = columns * (cardWidth + spacing) - spacing
    const startX = (size.width - gridWidth) / 2
    const startY = 0

    let row = 0
    let col = 0

    for (const passive of passives) {
      const x = startX + col * (cardWidth + spacing)
      const y = startY + row * (cardHeight + spacing)

      const card = this.createPassiveCard(passive, x, y, cardWidth, cardHeight)
      this.scrollContent.addChild(card)

      col++
      if (col >= columns) {
        col = 0
        row++
      }
    }

    const totalRows = Math.ceil(passives.length / columns)
    this.contentHeight = totalRows * (cardHeight + spacing) - spacing
    this.maxScrollY = Math.max(0, this.contentHeight - this.viewHeight)
  }

  private createPassiveCard(passive: PassiveSkill, x: number, y: number, cardWidth: number, cardHeight: number): Container {
    const container = this.renderer.createContainer(x, y)

    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, cardWidth, cardHeight, 10)
    bg.fill({ color: Colors.CARD_BG })
    bg.stroke({ color: Colors.MP_BAR, width: 2 })
    container.addChild(bg)

    const padding = LayoutConstants.scaleValue(12)

    // 内功名称
    const name = new Text({
      text: passive.name,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCharacterName(),
        fill: Colors.MP_BAR,
        fontWeight: 'bold'
      }
    })
    name.x = padding
    name.y = padding
    container.addChild(name)

    // 触发时机
    const triggerName = TriggerTimingNames[passive.trigger] || '特殊'
    const trigger = new Text({
      text: `[${triggerName}]`,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCardType(),
        fill: Colors.TEXT_GOLD
      }
    })
    trigger.x = padding
    trigger.y = padding + LayoutConstants.fontCharacterName() + 8
    container.addChild(trigger)

    // 效果描述
    const desc = new Text({
      text: passive.description,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCardType(),
        fill: Colors.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: cardWidth - padding * 2
      }
    })
    desc.x = padding
    desc.y = trigger.y + LayoutConstants.fontCardType() + 10
    container.addChild(desc)

    return container
  }

  private createBackButton(): void {
    const size = this.renderer.getSize()
    const btnWidth = LayoutConstants.scaleValue(150)
    const btnHeight = LayoutConstants.scaleValue(45)

    const backBtn = new Button('返回', btnWidth, btnHeight, this.renderer)
    backBtn.x = size.width - btnWidth - LayoutConstants.scaleValue(20)
    backBtn.y = size.height - btnHeight - LayoutConstants.scaleValue(15)
    backBtn.setOnClick(() => {
      if (this.onBack) this.onBack()
    })
    this.addChild(backBtn)
  }

  setOnBack(callback: () => void): void {
    this.onBack = callback
  }
}