import { Container, Graphics, Text } from 'pixi.js'
import { Scene } from './Scene'
import { Renderer, Colors, TextStyles } from '../renderer/Renderer'
import { Button } from '../renderer/UIComponents'
import { characters, getCharacterMartialArts } from '../data/skills'
import { CharacterConfig } from '../game/types'
import { LayoutConstants } from '../renderer/LayoutConstants'

// 角色选择项
interface CharacterSelectItem {
  config: CharacterConfig
  container: Container
  bg: Graphics
}

// 角色选择场景 - 响应式设计，支持滚动
export class CharacterSelectScene extends Scene {
  private characterItems: CharacterSelectItem[] = []
  private selectedCharacterId: string | null = null
  private detailPanel: Container | null = null
  private startButton: Button | null = null
  private onCharacterSelected?: (characterId: string) => void
  private onGameStart?: (characterId: string) => void

  // 滚动相关
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
  private detailPanelHeight: number = 0

  // DOM事件绑定引用
  private boundWheelHandler: (e: WheelEvent) => void
  private boundPointerDownHandler: (e: PointerEvent) => void
  private boundPointerMoveHandler: (e: PointerEvent) => void
  private boundPointerUpHandler: (e: PointerEvent) => void

  constructor(renderer: Renderer) {
    super(renderer)

    // 绑定事件处理器
    this.boundWheelHandler = this.handleWheel.bind(this)
    this.boundPointerDownHandler = this.handlePointerDown.bind(this)
    this.boundPointerMoveHandler = this.handlePointerMove.bind(this)
    this.boundPointerUpHandler = this.handlePointerUp.bind(this)
  }

  onEnter(): void {
    // 注册resize回调
    this.renderer.onResize(() => this.handleResize())

    this.createUI()

    // 使用 DOM 事件监听滚轮
    window.addEventListener('wheel', this.boundWheelHandler, { passive: false })

    // 使用 DOM 事件监听拖拽
    window.addEventListener('pointerdown', this.boundPointerDownHandler)
    window.addEventListener('pointermove', this.boundPointerMoveHandler)
    window.addEventListener('pointerup', this.boundPointerUpHandler)

    // 注册resize回调后标记初始化
    this.isInitialized = true
  }

  onExit(): void {
    // 移除 DOM 事件监听
    window.removeEventListener('wheel', this.boundWheelHandler)
    window.removeEventListener('pointerdown', this.boundPointerDownHandler)
    window.removeEventListener('pointermove', this.boundPointerMoveHandler)
    window.removeEventListener('pointerup', this.boundPointerUpHandler)

    this.renderer.offResize(() => this.handleResize())
    this.clear()
  }

  // 处理滚轮事件
  private handleWheel(e: WheelEvent): void {
    if (!this.scrollContent) return

    // 检查是否需要滚动
    if (this.maxScrollY <= 0) return

    e.preventDefault()
    const delta = e.deltaY || 0
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.scrollY + delta * 0.8))
    this.updateScrollPosition()
  }

  // 处理拖拽开始
  private handlePointerDown(e: PointerEvent): void {
    if (!this.scrollContent) return

    const size = this.renderer.getSize()
    const titleHeight = size.height * 0.02 + LayoutConstants.scaleValue(80)
    const scrollAreaY = titleHeight

    // 检查是否在详情面板区域
    const detailPanelTop = this.detailPanel ? (size.height - this.detailPanelHeight) : size.height
    if (this.detailPanel && e.clientY >= detailPanelTop) {
      // 在详情面板区域，不处理拖拽
      return
    }

    // 在滚动区域内允许拖拽
    if (e.clientY >= scrollAreaY && e.clientY < detailPanelTop) {
      this.isDragging = true
      this.dragStartY = e.clientY
      this.dragStartScrollY = this.scrollY
    }
  }

  // 处理拖拽移动
  private handlePointerMove(e: PointerEvent): void {
    if (!this.isDragging || !this.scrollContent) return

    const deltaY = this.dragStartY - e.clientY
    this.scrollY = Math.max(0, Math.min(this.maxScrollY, this.dragStartScrollY + deltaY))
    this.updateScrollPosition()
  }

  // 处理拖拽结束
  private handlePointerUp(_e: PointerEvent): void {
    this.isDragging = false
  }

  // 更新滚动位置
  private updateScrollPosition(): void {
    if (!this.scrollContent || !this.scrollbar) return

    this.scrollContent.y = -this.scrollY

    // 更新滚动条位置
    this.updateScrollbar()
  }

  // 更新滚动条
  private updateScrollbar(): void {
    if (!this.scrollbar || this.contentHeight <= this.viewHeight) {
      if (this.scrollbar) this.scrollbar.visible = false
      return
    }

    this.scrollbar.visible = true
    const size = this.renderer.getSize()
    const titleHeight = size.height * 0.02 + LayoutConstants.scaleValue(80)
    const scrollAreaY = titleHeight
    const scrollAreaHeight = size.height - scrollAreaY

    // 滚动条高度比例
    const scrollbarHeight = Math.max(40, (this.viewHeight / this.contentHeight) * scrollAreaHeight)
    const scrollbarY = scrollAreaY + (this.scrollY / this.maxScrollY) * (scrollAreaHeight - scrollbarHeight)

    this.scrollbar.clear()
    // 滚动条背景轨道
    this.scrollbar.roundRect(0, scrollAreaY, 10, scrollAreaHeight, 5)
    this.scrollbar.fill({ color: 0x333333, alpha: 0.5 })
    // 滚动条滑块
    this.scrollbar.roundRect(0, scrollbarY, 10, scrollbarHeight, 5)
    this.scrollbar.fill({ color: Colors.TEXT_GOLD, alpha: 0.8 })
    this.scrollbar.x = size.width - 20
  }

  // 处理窗口resize
  private handleResize(): void {
    this.clear()
    this.createUI()
    // 恢复选中状态
    if (this.selectedCharacterId) {
      const item = this.characterItems.find(i => i.config.id === this.selectedCharacterId)
      if (item) {
        this.highlightCard(item.bg, true)
        this.showCharacterDetail(this.selectedCharacterId)
      }
    }
  }

  private createUI(): void {
    this.createTitle()
    this.createScrollableCharacterGrid()
  }

  update(_delta: number): void {
    // 无需每帧更新
  }

  // 创建标题
  private createTitle(): void {
    const size = this.renderer.getSize()
    const titleY = size.height * 0.02

    const title = this.renderer.createText('武侠卡牌对战', TextStyles.TITLE, 0, titleY)
    title.anchor.set(0.5, 0)
    title.x = size.width / 2
    this.addChild(title)

    // 副标题
    const subtitle = this.renderer.createText('选择你的角色', TextStyles.SUBTITLE, 0, titleY + LayoutConstants.scaleValue(50))
    subtitle.anchor.set(0.5, 0)
    subtitle.x = size.width / 2
    this.addChild(subtitle)
  }

  // 创建可滚动的角色网格
  private createScrollableCharacterGrid(): void {
    const size = this.renderer.getSize()

    // 滚动区域参数 - 占据剩余98%空间
    const titleHeight = size.height * 0.02 + LayoutConstants.scaleValue(80)
    const scrollAreaY = titleHeight
    this.viewHeight = size.height - scrollAreaY

    // 创建滚动容器（带遮罩）
    this.scrollContainer = this.renderer.createContainer(0, scrollAreaY)
    this.addChild(this.scrollContainer)

    // 创建遮罩
    this.scrollMask = this.renderer.createGraphics()
    this.scrollMask.rect(0, 0, size.width, this.viewHeight)
    this.scrollMask.fill({ color: 0xffffff, alpha: 0 })
    this.scrollContainer.addChild(this.scrollMask)

    // 内容容器
    this.scrollContent = this.renderer.createContainer()
    this.scrollContent.mask = this.scrollMask
    this.scrollContainer.addChild(this.scrollContent)

    // 创建滚动条
    this.scrollbar = this.renderer.createGraphics()
    this.addChild(this.scrollbar)

    // 填充角色卡片
    this.fillCharacterGrid()

    // 计算滚动范围
    this.maxScrollY = Math.max(0, this.contentHeight - this.viewHeight)
    this.scrollY = 0
    this.updateScrollbar()
  }

  // 填充角色网格
  private fillCharacterGrid(): void {
    if (!this.scrollContent) return

    const size = this.renderer.getSize()
    const allCharacters = Object.entries(characters)

    // 响应式卡片尺寸
    const cardWidth = LayoutConstants.scaleValue(220)
    const cardHeight = LayoutConstants.scaleValue(170)
    const spacing = LayoutConstants.scaleValue(18)

    // 根据屏幕宽度动态计算列数
    const minColumns = 4
    const maxColumns = 8
    const availableWidth = size.width * 0.95
    const calculatedColumns = Math.floor((availableWidth + spacing) / (cardWidth + spacing))
    const columns = Math.max(minColumns, Math.min(maxColumns, calculatedColumns))

    // 计算网格起始位置
    const gridWidth = columns * (cardWidth + spacing) - spacing
    const startX = (size.width - gridWidth) / 2
    const startY = 0

    let row = 0
    let col = 0

    for (const [id, config] of allCharacters) {
      const x = startX + col * (cardWidth + spacing)
      const y = startY + row * (cardHeight + spacing)

      const item = this.createCharacterCard(id, config, x, y, cardWidth, cardHeight)
      this.characterItems.push(item)
      this.scrollContent.addChild(item.container)

      col++
      if (col >= columns) {
        col = 0
        row++
      }
    }

    // 计算内容高度
    const totalRows = Math.ceil(allCharacters.length / columns)
    this.contentHeight = totalRows * (cardHeight + spacing) - spacing
  }

  // 创建角色卡片
  private createCharacterCard(id: string, config: CharacterConfig, x: number, y: number, cardWidth: number, cardHeight: number): CharacterSelectItem {
    const container = this.renderer.createContainer(x, y)

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, cardWidth, cardHeight, 12)
    bg.fill({ color: Colors.CARD_BG })
    bg.stroke({ color: Colors.TEXT_SECONDARY, width: 2 })
    container.addChild(bg)

    const padding = LayoutConstants.scaleValue(14)

    // 名称
    const name = new Text({
      text: config.name,
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

    // 称号
    const title = new Text({
      text: config.title,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCharacterTitle(),
        fill: Colors.TEXT_SECONDARY
      }
    })
    title.x = padding
    title.y = padding + LayoutConstants.fontCharacterName() + 6
    container.addChild(title)

    // 分隔线
    const divider = this.renderer.createGraphics()
    divider.moveTo(padding, title.y + LayoutConstants.fontCharacterTitle() + 10)
    divider.lineTo(cardWidth - padding, title.y + LayoutConstants.fontCharacterTitle() + 10)
    divider.stroke({ color: Colors.TEXT_SECONDARY, alpha: 0.3, width: 1 })
    container.addChild(divider)

    // 属性
    const statsY = title.y + LayoutConstants.fontCharacterTitle() + 20
    const statsText = `体力: ${config.hp}  内力: ${config.mp}  轻功: ${config.agility}`
    const stats = new Text({
      text: statsText,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontStats(),
        fill: Colors.TEXT_GOLD
      }
    })
    stats.x = padding
    stats.y = statsY
    container.addChild(stats)

    // 武功
    const martialArtsList = getCharacterMartialArts(id)
    const artsText = martialArtsList.map(a => a.name).join('、')
    const arts = new Text({
      text: `武功: ${artsText}`,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCardType(),
        fill: Colors.TEXT_RED,
        wordWrap: true,
        wordWrapWidth: cardWidth - padding * 2
      }
    })
    arts.x = padding
    arts.y = statsY + LayoutConstants.fontStats() + 10
    container.addChild(arts)

    // 交互
    container.eventMode = 'static'
    container.cursor = 'pointer'
    container.on('pointerdown', () => this.selectCharacter(id, bg))

    return { config, container, bg }
  }

  // 选择角色
  private selectCharacter(id: string, bg: Graphics): void {
    // 取消之前的选择
    if (this.selectedCharacterId) {
      const prevItem = this.characterItems.find(item => item.config.id === this.selectedCharacterId)
      if (prevItem) {
        this.highlightCard(prevItem.bg, false)
      }
    }

    // 高亮选中
    this.selectedCharacterId = id
    this.highlightCard(bg, true)

    // 显示详情（包含开始战斗按钮）
    this.showCharacterDetail(id)

    if (this.onCharacterSelected) {
      this.onCharacterSelected(id)
    }
  }

  // 高亮/取消高亮卡片
  private highlightCard(bg: Graphics, selected: boolean): void {
    const cardWidth = LayoutConstants.scaleValue(220)
    const cardHeight = LayoutConstants.scaleValue(170)

    bg.clear()
    bg.roundRect(0, 0, cardWidth, cardHeight, 12)
    bg.fill({ color: selected ? Colors.CARD_HOVER : Colors.CARD_BG })
    bg.stroke({ color: selected ? Colors.TEXT_GOLD : Colors.TEXT_SECONDARY, width: selected ? 4 : 2 })
  }

  // 显示角色详情
  private showCharacterDetail(id: string): void {
    // 移除旧详情
    if (this.detailPanel) {
      this.removeChild(this.detailPanel)
    }

    const size = this.renderer.getSize()
    const config = characters[id]
    const martialArtsList = getCharacterMartialArts(id)

    // 响应式面板尺寸
    const panelWidth = Math.min(size.width * 0.75, LayoutConstants.scaleValue(800))
    const lineHeight = LayoutConstants.scaleValue(28)
    const baseHeight = LayoutConstants.scaleValue(50)

    let totalLines = 0
    martialArtsList.forEach(art => {
      totalLines++
      if (art.passive) totalLines++
    })

    // 面板高度包含开始战斗按钮
    const buttonHeight = LayoutConstants.scaleValue(50)
    const buttonPadding = LayoutConstants.scaleValue(20)
    const panelHeight = baseHeight + totalLines * lineHeight + LayoutConstants.scaleValue(30) + buttonHeight + buttonPadding

    // 存储面板高度
    this.detailPanelHeight = panelHeight

    // 详情面板固定在屏幕底部
    this.detailPanel = this.renderer.createContainer(size.width / 2 - panelWidth / 2, size.height - panelHeight)

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, panelWidth, panelHeight, 12)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 3 })
    this.detailPanel.addChild(bg)

    const padding = LayoutConstants.scaleValue(20)

    // 标题
    const title = new Text({
      text: `${config.name} - 武功详情`,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCharacterName(),
        fill: Colors.TEXT_GOLD,
        fontWeight: 'bold'
      }
    })
    title.x = padding
    title.y = LayoutConstants.scaleValue(12)
    this.detailPanel.addChild(title)

    // 关闭按钮 - 右上角
    const closeBtn = this.renderer.createGraphics()
    closeBtn.circle(panelWidth - padding - 15, LayoutConstants.scaleValue(25), 15)
    closeBtn.fill({ color: Colors.TEXT_RED, alpha: 0.8 })
    closeBtn.eventMode = 'static'
    closeBtn.cursor = 'pointer'
    closeBtn.on('pointerdown', () => this.closeDetailPanel())

    // 关闭按钮的X符号
    const closeX = new Text({
      text: '×',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 20,
        fill: Colors.TEXT_PRIMARY,
        fontWeight: 'bold'
      }
    })
    closeX.anchor.set(0.5)
    closeX.x = panelWidth - padding - 15
    closeX.y = LayoutConstants.scaleValue(25)

    this.detailPanel.addChild(closeBtn)
    this.detailPanel.addChild(closeX)

    // 武功列表
    let yPos = baseHeight
    for (const art of martialArtsList) {
      const artText = new Text({
        text: `【${art.name}】`,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: LayoutConstants.fontStats(),
          fill: Colors.TEXT_GOLD
        }
      })
      artText.x = padding
      artText.y = yPos
      this.detailPanel.addChild(artText)

      const descText = new Text({
        text: art.description,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: LayoutConstants.fontCardType(),
          fill: Colors.TEXT_SECONDARY
        }
      })
      descText.x = padding + LayoutConstants.scaleValue(150)
      descText.y = yPos
      this.detailPanel.addChild(descText)

      yPos += lineHeight

      // 显示内功效果
      if (art.passive) {
        const passiveIcon = new Text({
          text: '◈',
          style: {
            fontFamily: 'Arial, sans-serif',
            fontSize: LayoutConstants.fontCardType(),
            fill: Colors.MP_BAR
          }
        })
        passiveIcon.x = padding + LayoutConstants.scaleValue(20)
        passiveIcon.y = yPos
        this.detailPanel.addChild(passiveIcon)

        const passiveName = new Text({
          text: art.passive.name,
          style: {
            fontFamily: 'Arial, sans-serif',
            fontSize: LayoutConstants.fontCardType(),
            fill: Colors.MP_BAR
          }
        })
        passiveName.x = padding + LayoutConstants.scaleValue(45)
        passiveName.y = yPos
        this.detailPanel.addChild(passiveName)

        const passiveDesc = new Text({
          text: art.passive.description,
          style: {
            fontFamily: 'Arial, sans-serif',
            fontSize: LayoutConstants.fontCardType(),
            fill: Colors.TEXT_SECONDARY
          }
        })
        passiveDesc.x = padding + LayoutConstants.scaleValue(150)
        passiveDesc.y = yPos
        this.detailPanel.addChild(passiveDesc)

        yPos += lineHeight
      }
    }

    // 开始战斗按钮 - 放在详情面板底部
    const btnWidth = LayoutConstants.scaleValue(180)
    const btnHeight = LayoutConstants.scaleValue(50)
    this.startButton = new Button('开始战斗', btnWidth, btnHeight, this.renderer)
    this.startButton.x = panelWidth / 2 - btnWidth / 2
    this.startButton.y = panelHeight - btnHeight - LayoutConstants.scaleValue(15)
    this.startButton.setOnClick(() => {
      if (this.selectedCharacterId && this.onGameStart) {
        this.onGameStart(this.selectedCharacterId)
      }
    })
    this.detailPanel.addChild(this.startButton)

    this.addChild(this.detailPanel)
  }

  // 设置回调
  setOnCharacterSelected(callback: (characterId: string) => void): void {
    this.onCharacterSelected = callback
  }

  setOnGameStart(callback: (characterId: string) => void): void {
    this.onGameStart = callback
  }

  // 获取选中的角色
  getSelectedCharacter(): string | null {
    return this.selectedCharacterId
  }

  // 关闭详情面板
  private closeDetailPanel(): void {
    // 取消选中状态
    if (this.selectedCharacterId) {
      const item = this.characterItems.find(i => i.config.id === this.selectedCharacterId)
      if (item) {
        this.highlightCard(item.bg, false)
      }
    }
    this.selectedCharacterId = null

    // 移除详情面板
    if (this.detailPanel) {
      this.removeChild(this.detailPanel)
      this.detailPanel = null
      this.detailPanelHeight = 0
    }
  }
}