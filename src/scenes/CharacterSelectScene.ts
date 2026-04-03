import { Container, Graphics, Text, Sprite, Assets } from 'pixi.js'
import { Scene } from './Scene'
import { Renderer, Colors, TextStyles } from '../renderer/Renderer'
import { Button } from '../renderer/UIComponents'
import { characters, getCharacterMartialArts } from '../data/skills'
import { CharacterConfig } from '../game/types'
import { LayoutConstants } from '../renderer/LayoutConstants'

// 战斗配置
export interface BattleConfig {
  mode: '1v1' | 'team' | 'freeforall'
  playerId: string       // 玩家控制的角色
  teamSize: number       // 己方总人数（含玩家）
  enemySize: number      // 敌方人数
}

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
  private onGameStart?: (config: BattleConfig) => void
  private onBackToTitle?: () => void

  // 战斗模式状态
  private battleMode: '1v1' | 'team' | 'freeforall' = '1v1'
  private teamSize: number = 1
  private enemySize: number = 1
  private readonly MAX_TOTAL = 6  // 总人数上限

  // 模式相关UI组件
  private modeButtons: Map<string, Button> = new Map()
  private teamSizeText: Text | null = null
  private enemySizeText: Text | null = null
  private totalSizeText: Text | null = null
  private sizeControlContainer: Container | null = null

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
    const titleHeight = size.height * 0.02 + LayoutConstants.scaleValue(150)  // 模式选择区域增加高度
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
    const titleHeight = size.height * 0.02 + LayoutConstants.scaleValue(150)  // 模式选择区域增加高度
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

    // 重建人数调节 UI
    if (this.battleMode !== '1v1') {
      this.createSizeControls()
    }
  }

  private createUI(): void {
    this.createTitle()
    this.createScrollableCharacterGrid()
  }

  update(_delta: number): void {
    // 无需每帧更新
  }

  // 创建标题和模式选择
  private createTitle(): void {
    const size = this.renderer.getSize()
    const titleY = size.height * 0.02

    const title = this.renderer.createText('选择角色', TextStyles.TITLE, 0, titleY)
    title.anchor.set(0.5, 0)
    title.x = size.width / 2
    this.addChild(title)

    // 返回按钮 - 左上角
    const btnWidth = LayoutConstants.scaleValue(80)
    const btnHeight = LayoutConstants.scaleValue(35)
    const backBtn = new Button('返回', btnWidth, btnHeight, this.renderer)
    backBtn.x = LayoutConstants.scaleValue(20)
    backBtn.y = titleY + LayoutConstants.scaleValue(10)
    backBtn.setOnClick(() => {
      if (this.onBackToTitle) this.onBackToTitle()
    })
    this.addChild(backBtn)

    // 模式选择区域 - 标题下方
    const modeY = titleY + LayoutConstants.scaleValue(55)

    // 模式选择标签
    const modeLabel = this.renderer.createText('模式选择:', TextStyles.SUBTITLE, size.width / 2 - LayoutConstants.scaleValue(280), modeY)
    this.addChild(modeLabel)

    // 模式按钮
    const modes: ('1v1' | 'team' | 'freeforall')[] = ['1v1', 'team', 'freeforall']
    const modeLabels = ['1v1对战', '队伍对战', '混战模式']
    const modeBtnWidth = LayoutConstants.scaleValue(100)
    const modeBtnHeight = LayoutConstants.scaleValue(30)

    modes.forEach((mode, index) => {
      const btn = new Button(modeLabels[index], modeBtnWidth, modeBtnHeight, this.renderer)
      btn.x = size.width / 2 - LayoutConstants.scaleValue(180) + index * (modeBtnWidth + LayoutConstants.scaleValue(10))
      btn.y = modeY
      btn.setOnClick(() => this.switchMode(mode))
      this.addChild(btn)
      this.modeButtons.set(mode, btn)
    })

    // 更新模式按钮高亮
    this.updateModeButtons()

    // 人数调节容器
    this.sizeControlContainer = this.renderer.createContainer(size.width / 2 - LayoutConstants.scaleValue(280), modeY + LayoutConstants.scaleValue(40))
    this.addChild(this.sizeControlContainer)

    // 创建人数调节 UI
    this.createSizeControls()

    // 副标题（选择角色提示）
    const subtitle = this.renderer.createText('选择你的角色', TextStyles.SUBTITLE, 0, modeY + LayoutConstants.scaleValue(80))
    subtitle.anchor.set(0.5, 0)
    subtitle.x = size.width / 2
    this.addChild(subtitle)
  }

  // 创建人数调节 UI
  private createSizeControls(): void {
    if (!this.sizeControlContainer) return

    // 清空容器
    this.sizeControlContainer.removeChildren()

    const btnSize = LayoutConstants.scaleValue(30)
    const textSize = LayoutConstants.scaleValue(16)

    const isFreeForAll = this.battleMode === 'freeforall'

    // 我方人数（混战模式下隐藏，固定为1）
    if (!isFreeForAll) {
      const teamLabel = new Text({
        text: '我方人数:',
        style: { fontSize: textSize, fill: Colors.TEXT_PRIMARY }
      })
      this.sizeControlContainer.addChild(teamLabel)

      const teamMinusBtn = new Button('-', btnSize, btnSize, this.renderer)
      teamMinusBtn.x = LayoutConstants.scaleValue(80)
      teamMinusBtn.setOnClick(() => this.adjustTeamSize(-1))
      this.sizeControlContainer.addChild(teamMinusBtn)

      this.teamSizeText = new Text({
        text: `${this.teamSize}`,
        style: { fontSize: textSize, fill: Colors.TEXT_GOLD, fontWeight: 'bold' }
      })
      this.teamSizeText.x = LayoutConstants.scaleValue(115)
      this.sizeControlContainer.addChild(this.teamSizeText)

      const teamPlusBtn = new Button('+', btnSize, btnSize, this.renderer)
      teamPlusBtn.x = LayoutConstants.scaleValue(135)
      teamPlusBtn.setOnClick(() => this.adjustTeamSize(1))
      this.sizeControlContainer.addChild(teamPlusBtn)
    }

    // 敌方人数（混战模式下显示为"总人数"）
    const enemyLabelX = isFreeForAll ? 0 : LayoutConstants.scaleValue(180)
    const enemyLabelText = isFreeForAll ? '总人数:' : '敌方人数:'

    const enemyLabel = new Text({
      text: enemyLabelText,
      style: { fontSize: textSize, fill: Colors.TEXT_PRIMARY }
    })
    enemyLabel.x = enemyLabelX
    this.sizeControlContainer.addChild(enemyLabel)

    const enemyMinusBtn = new Button('-', btnSize, btnSize, this.renderer)
    enemyMinusBtn.x = enemyLabelX + LayoutConstants.scaleValue(80)
    enemyMinusBtn.setOnClick(() => this.adjustEnemySize(-1))
    this.sizeControlContainer.addChild(enemyMinusBtn)

    this.enemySizeText = new Text({
      text: `${this.enemySize}`,
      style: { fontSize: textSize, fill: Colors.TEXT_GOLD, fontWeight: 'bold' }
    })
    this.enemySizeText.x = enemyLabelX + LayoutConstants.scaleValue(115)
    this.sizeControlContainer.addChild(this.enemySizeText)

    const enemyPlusBtn = new Button('+', btnSize, btnSize, this.renderer)
    enemyPlusBtn.x = enemyLabelX + LayoutConstants.scaleValue(135)
    this.sizeControlContainer.addChild(enemyPlusBtn)
    enemyPlusBtn.setOnClick(() => this.adjustEnemySize(1))

    // 总人数提示
    const total = isFreeForAll ? (1 + this.enemySize) : (this.teamSize + this.enemySize)
    this.totalSizeText = new Text({
      text: `总人数: ${total}人 (最大${this.MAX_TOTAL}人)`,
      style: { fontSize: textSize, fill: Colors.TEXT_SECONDARY }
    })
    this.totalSizeText.x = enemyLabelX + LayoutConstants.scaleValue(180)
    this.sizeControlContainer.addChild(this.totalSizeText)

    // 1v1模式隐藏人数调节
    if (this.battleMode === '1v1') {
      this.sizeControlContainer.visible = false
    }
  }

  // 创建可滚动的角色网格
  private createScrollableCharacterGrid(): void {
    const size = this.renderer.getSize()

    // 滚动区域参数 - 模式选择区域增加高度
    const titleHeight = size.height * 0.02 + LayoutConstants.scaleValue(150)  // 增加50像素给模式选择区域
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

    // 清空之前的角色列表
    this.characterItems = []

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

    // 响应式面板尺寸 - 缩小弹窗
    const panelWidth = Math.min(size.width * 0.75, LayoutConstants.scaleValue(700))
    const lineHeight = LayoutConstants.scaleValue(28)
    const baseHeight = LayoutConstants.scaleValue(50)

    // 立绘区域 - 放右侧，约占一半宽度
    const portraitWidth = Math.floor(panelWidth * 0.45)
    const portraitHeight = LayoutConstants.scaleValue(350)

    let totalLines = 0
    martialArtsList.forEach(art => {
      totalLines++
      if (art.passive) totalLines++
    })

    // 面板高度
    const minContentHeight = baseHeight + totalLines * lineHeight + LayoutConstants.scaleValue(30)
    const buttonHeight = LayoutConstants.scaleValue(50)
    const buttonPadding = LayoutConstants.scaleValue(20)
    const contentHeight = Math.max(minContentHeight, portraitHeight + LayoutConstants.scaleValue(20))
    const panelHeight = contentHeight + buttonHeight + buttonPadding

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

    // 左侧：角色信息区域
    const infoWidth = panelWidth - portraitWidth - padding * 3

    // 角色名称（左侧顶部）
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
    this.detailPanel.addChild(name)

    // 角色称号
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
    this.detailPanel.addChild(title)

    // 分隔线
    const divider = this.renderer.createGraphics()
    divider.moveTo(padding, title.y + LayoutConstants.fontCharacterTitle() + 10)
    divider.lineTo(infoWidth + padding, title.y + LayoutConstants.fontCharacterTitle() + 10)
    divider.stroke({ color: Colors.TEXT_SECONDARY, alpha: 0.3, width: 1 })
    this.detailPanel.addChild(divider)

    // 角色属性
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
    this.detailPanel.addChild(stats)

    // 武功详情标题
    const detailTitle = new Text({
      text: '武功详情',
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCharacterName(),
        fill: Colors.TEXT_GOLD,
        fontWeight: 'bold'
      }
    })
    detailTitle.x = padding
    detailTitle.y = statsY + LayoutConstants.fontStats() + 15
    this.detailPanel.addChild(detailTitle)

    // 武功列表
    let yPos = statsY + LayoutConstants.fontStats() + 50
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
          fill: Colors.TEXT_SECONDARY,
          wordWrap: true,
          wordWrapWidth: infoWidth - LayoutConstants.scaleValue(130)
        }
      })
      descText.x = padding + LayoutConstants.scaleValue(130)
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
        passiveIcon.x = padding + LayoutConstants.scaleValue(15)
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
        passiveName.x = padding + LayoutConstants.scaleValue(35)
        passiveName.y = yPos
        this.detailPanel.addChild(passiveName)

        const passiveDesc = new Text({
          text: art.passive.description,
          style: {
            fontFamily: 'Arial, sans-serif',
            fontSize: LayoutConstants.fontCardType(),
            fill: Colors.TEXT_SECONDARY,
            wordWrap: true,
            wordWrapWidth: infoWidth - LayoutConstants.scaleValue(130)
          }
        })
        passiveDesc.x = padding + LayoutConstants.scaleValue(130)
        passiveDesc.y = yPos
        this.detailPanel.addChild(passiveDesc)

        yPos += lineHeight
      }
    }

    // 右侧：角色立绘区域
    const portraitX = panelWidth - portraitWidth - padding
    const portraitY = padding

    // 立绘背景框
    const portraitBg = this.renderer.createGraphics()
    portraitBg.roundRect(portraitX, portraitY, portraitWidth, portraitHeight, 8)
    portraitBg.fill({ color: 0x2a2a4e, alpha: 0.3 })
    portraitBg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    this.detailPanel.addChild(portraitBg)

    // 加载角色立绘
    this.loadPortrait(config.name, portraitX, portraitY, portraitWidth, portraitHeight)

    // 开始战斗按钮
    const btnWidth = LayoutConstants.scaleValue(180)
    const btnHeight = LayoutConstants.scaleValue(50)
    this.startButton = new Button('开始战斗', btnWidth, btnHeight, this.renderer)
    this.startButton.x = panelWidth / 2 - btnWidth / 2
    this.startButton.y = panelHeight - btnHeight - LayoutConstants.scaleValue(15)
    this.startButton.setOnClick(() => {
      if (this.selectedCharacterId && this.onGameStart) {
        const config: BattleConfig = {
          mode: this.battleMode,
          playerId: this.selectedCharacterId,
          teamSize: this.teamSize,
          enemySize: this.enemySize
        }
        this.onGameStart(config)
      }
    })
    this.detailPanel.addChild(this.startButton)

    this.addChild(this.detailPanel)
  }

  // 显示队伍详情（多人模式）
  // 加载角色立绘
  private async loadPortrait(name: string, x: number, y: number, maxWidth: number, maxHeight: number): Promise<void> {
    try {
      const texture = await Assets.load(`/assets/characters/${name}.png`)
      if (!this.detailPanel) return

      const portrait = new Sprite(texture)

      // 根据图片比例计算实际显示尺寸
      const originalWidth = texture.width
      const originalHeight = texture.height
      const aspectRatio = originalWidth / originalHeight

      let displayWidth: number
      let displayHeight: number

      // 保持比例，适应最大尺寸
      if (aspectRatio > maxWidth / maxHeight) {
        displayWidth = maxWidth
        displayHeight = maxWidth / aspectRatio
      } else {
        displayHeight = maxHeight
        displayWidth = maxHeight * aspectRatio
      }

      portrait.width = displayWidth
      portrait.height = displayHeight

      // 居中显示
      portrait.x = x + (maxWidth - displayWidth) / 2
      portrait.y = y + (maxHeight - displayHeight) / 2

      // 插入到背景之后
      const bgIndex = this.detailPanel.children.findIndex(c => c instanceof Graphics)
      if (bgIndex >= 0) {
        this.detailPanel.addChildAt(portrait, bgIndex + 1)
      } else {
        this.detailPanel.addChild(portrait)
      }
    } catch (error) {
      // 立绘加载失败时显示占位文字
      const placeholder = new Text({
        text: name,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: LayoutConstants.fontTitle(),
          fill: Colors.TEXT_SECONDARY,
          fontWeight: 'bold'
        }
      })
      placeholder.anchor.set(0.5)
      placeholder.x = x + maxWidth / 2
      placeholder.y = y + maxHeight / 2
      this.detailPanel?.addChild(placeholder)
    }
  }

  // 切换战斗模式
  private switchMode(mode: '1v1' | 'team' | 'freeforall'): void {
    this.battleMode = mode

    // 1v1模式固定人数
    if (mode === '1v1') {
      this.teamSize = 1
      this.enemySize = 1
      if (this.sizeControlContainer) {
        this.sizeControlContainer.visible = false
      }
    } else if (mode === 'freeforall') {
      // 混战模式：玩家只能选择1个角色
      this.teamSize = 1
      if (this.sizeControlContainer) {
        this.sizeControlContainer.visible = true
      }
    } else {
      // 队伍对战模式
      if (this.sizeControlContainer) {
        this.sizeControlContainer.visible = true
      }
    }

    // 清除之前的选择
    if (this.selectedCharacterId) {
      const item = this.characterItems.find(i => i.config.id === this.selectedCharacterId)
      if (item) this.highlightCard(item.bg, false)
      this.selectedCharacterId = null
    }

    this.updateModeButtons()
    this.updateSizeDisplay()
    this.recreateSizeControls()
    this.closeDetailPanel()
  }

  // 重建人数调节UI
  private recreateSizeControls(): void {
    this.createSizeControls()
  }

  // 更新模式按钮高亮
  private updateModeButtons(): void {
    this.modeButtons.forEach((btn, mode) => {
      if (mode === this.battleMode) {
        btn.setHighlighted(true)
      } else {
        btn.setHighlighted(false)
      }
    })
  }

  // 调节己方人数
  private adjustTeamSize(delta: number): void {
    const newSize = this.teamSize + delta
    // 约束: 1 <= teamSize, teamSize + enemySize <= MAX_TOTAL
    if (newSize >= 1 && newSize + this.enemySize <= this.MAX_TOTAL) {
      this.teamSize = newSize
      this.updateSizeDisplay()
    }
  }

  // 调节敌方人数
  private adjustEnemySize(delta: number): void {
    const newSize = this.enemySize + delta
    if (newSize >= 1 && this.teamSize + newSize <= this.MAX_TOTAL) {
      this.enemySize = newSize
      this.updateSizeDisplay()
    }
  }

  // 更新人数显示
  private updateSizeDisplay(): void {
    const isFreeForAll = this.battleMode === 'freeforall'

    if (this.teamSizeText && !isFreeForAll) {
      this.teamSizeText.text = `${this.teamSize}`
    }
    if (this.enemySizeText) {
      this.enemySizeText.text = `${this.enemySize}`
    }
    if (this.totalSizeText) {
      const total = isFreeForAll ? (1 + this.enemySize) : (this.teamSize + this.enemySize)
      this.totalSizeText.text = `总人数: ${total}人 (最大${this.MAX_TOTAL}人)`
    }
  }

  // 设置回调
  setOnCharacterSelected(callback: (characterId: string) => void): void {
    this.onCharacterSelected = callback
  }

  setOnGameStart(callback: (config: BattleConfig) => void): void {
    this.onGameStart = callback
  }

  setOnBackToTitle(callback: () => void): void {
    this.onBackToTitle = callback
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