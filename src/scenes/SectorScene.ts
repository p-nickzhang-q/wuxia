import { Scene } from './Scene'
import { Renderer, Colors } from '../renderer/Renderer'
import { Button } from '../renderer/ui/Button'
import { Container, Text, TextStyle } from 'pixi.js'
import {
  SectorState,
  SectorDisciple,
  SectorDiscipleStatus,
  Facility,
  Faction
} from '../game/types'
import {
  createSector,
  upgradeFacility
} from '../game/Sector'
import { DiscipleCard } from '../renderer/ui/DiscipleCard'

// 辅助函数：创建简单 TextStyle
function createStyle(fontSize: number, fill: number): TextStyle {
  return new TextStyle({
    fontFamily: 'Arial, sans-serif',
    fontSize,
    fill
  })
}

// 门派关系颜色
const FACTION_COLORS = {
  self: 0xffd700,     // 金色
  friendly: 0x4ecdc4, // 绿色
  neutral: 0xaaaaaa,  // 黄色（灰）
  hostile: 0xff6b6b   // 红色
}

/**
 * 门派管理场景 - 按照设计文档实现
 */
export class SectorScene extends Scene {
  private sector: SectorState

  // UI 容器
  private facilityContainer: Container | null = null
  private factionMapContainer: Container | null = null
  private discipleListContainer: Container | null = null
  private discipleCards: DiscipleCard[] = []

  // 弹窗
  private detailPopup: Container | null = null

  // 回调（探索事件触发战斗时使用）
  private _onEnterBattle?: (discipleIds: string[]) => void
  private onBackToTitle?: () => void
  private onTraining?: () => void

  constructor(renderer: Renderer) {
    super(renderer)
    this.sector = createSector(Faction.BEGGAR, '丐帮')
  }

  setSector(faction: Faction, name?: string): void {
    this.sector = createSector(faction, name)
  }

  onEnter(): void {
    this.clear()
    this.createUI()
  }

  onExit(): void {
    this.clear()
  }

  update(_delta: number): void {}

  /**
   * 创建完整UI - 按照设计文档布局（居中响应式）
   *
   * 新布局：弟子列表右侧垂直排列操作按钮（修炼/训练/探索/返回）
   */
  private createUI(): void {
    const size = this.renderer.getSize()

    // 背景
    const bg = this.renderer.createGraphics()
    bg.rect(0, 0, size.width, size.height)
    bg.fill({ color: Colors.BACKGROUND })
    this.addChild(bg)

    // ═════════════════════════════════════════════════
    // 布局计算 - 居中分布
    // ═════════════════════════════════════════════════
    const margin = 20          // 边距
    const gap = 20             // 面板间距
    const mapWidth = 280       // 势力地图固定宽度
    const actionBtnWidth = 120 // 右侧操作按钮宽度

    // 计算设施面板宽度（响应式）
    const availableWidth = size.width - margin * 2 - gap - mapWidth
    const facilityPanelWidth = Math.min(availableWidth * 0.65, 550)

    // 弟子列表宽度 = 设施面板宽度（左侧对齐）
    // 右侧操作按钮宽度 = actionBtnWidth
    const discipleListWidth = facilityPanelWidth
    const totalContentWidth = facilityPanelWidth + gap + mapWidth
    const startX = (size.width - totalContentWidth) / 2

    // ═════════════════════════════════════════════════
    // 顶部状态栏：门派名称 | 声望星级 | 财富 | 弟子数
    // ═════════════════════════════════════════════════
    const headerBar = this.createHeaderBar()
    headerBar.x = startX
    headerBar.y = 10
    this.addChild(headerBar)

    // ═════════════════════════════════════════════════
    // 高度分配
    // ═════════════════════════════════════════════════
    const headerHeight = 65
    const discipleListHeight = 200

    // 底部区域：弟子列表 + 右侧操作按钮（垂直排列）
    const actionPanelHeight = discipleListHeight
    const bottomSectionY = size.height - margin - discipleListHeight

    const facilityPanelHeight = bottomSectionY - headerHeight - margin

    // ═════════════════════════════════════════════════
    // 左侧：门派设施区域（居中）
    // ═════════════════════════════════════════════════
    this.facilityContainer = this.createFacilityPanel(facilityPanelWidth, facilityPanelHeight)
    this.facilityContainer.x = startX
    this.facilityContainer.y = headerHeight
    this.addChild(this.facilityContainer)

    // ═════════════════════════════════════════════════
    // 右侧：势力地图（居中）
    // ═════════════════════════════════════════════════
    this.factionMapContainer = this.createFactionMap(mapWidth, facilityPanelHeight)
    this.factionMapContainer.x = startX + facilityPanelWidth + gap
    this.factionMapContainer.y = headerHeight
    this.addChild(this.factionMapContainer)

    // ═════════════════════════════════════════════════
    // 弟子列表区域（左侧）
    // ═════════════════════════════════════════════════
    this.discipleListContainer = this.createDiscipleList(discipleListWidth)
    this.discipleListContainer.x = startX
    this.discipleListContainer.y = bottomSectionY
    this.addChild(this.discipleListContainer)

    // ═════════════════════════════════════════════════
    // 右侧操作按钮（垂直排列）- 学习武功 | 训练武功 | 江湖探索 | 返回
    // ═════════════════════════════════════════════════
    const actionPanel = this.createActionButtons(actionBtnWidth, actionPanelHeight)
    actionPanel.x = startX + discipleListWidth + gap
    actionPanel.y = bottomSectionY
    this.addChild(actionPanel)
  }

  /**
   * 顶部状态栏
   */
  private createHeaderBar(): Container {
    const container = new Container()
    const size = this.renderer.getSize()
    const barWidth = size.width - 40  // 响应式宽度
    const barHeight = 55

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, barWidth, barHeight, 10)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    container.addChild(bg)

    // 门派名称（居中）
    const nameText = new Text({
      text: `【${this.sector.name}】`,
      style: createStyle(20, Colors.TEXT_GOLD)
    })
    nameText.anchor.set(0.5)
    nameText.x = barWidth / 2
    nameText.y = 12
    container.addChild(nameText)

    // 声望星级
    const reputationStars = this.getReputationStars(this.sector.reputation)
    const repText = new Text({
      text: `声望: ${reputationStars} (${this.sector.reputation})`,
      style: createStyle(14, Colors.TEXT_GOLD)
    })
    repText.x = 20
    repText.y = 35
    container.addChild(repText)

    // 财富
    const wealthText = new Text({
      text: `财富: ${this.sector.silver}银两`,
      style: createStyle(14, Colors.TEXT_PRIMARY)
    })
    wealthText.x = 200
    wealthText.y = 35
    container.addChild(wealthText)

    // 弟子数
    const discipleText = new Text({
      text: `弟子: ${this.sector.disciples.length}人`,
      style: createStyle(14, Colors.TEXT_PRIMARY)
    })
    discipleText.x = 350
    discipleText.y = 35
    container.addChild(discipleText)

    // 回合数（右侧）
    const turnText = new Text({
      text: `第 ${this.sector.turn} 回合`,
      style: createStyle(14, Colors.TEXT_GOLD)
    })
    turnText.x = barWidth - 100
    turnText.y = 35
    container.addChild(turnText)

    return container
  }

  /**
   * 声望星级显示
   */
  private getReputationStars(reputation: number): string {
    const fullStars = Math.floor(reputation / 200)
    const halfStar = reputation % 200 >= 100 ? 1 : 0
    const emptyStars = 5 - fullStars - halfStar
    return '★'.repeat(fullStars) + (halfStar ? '☆' : '') + '☆'.repeat(emptyStars)
  }

  /**
   * 门派设施面板（响应式宽度）
   */
  private createFacilityPanel(panelWidth: number, panelHeight: number): Container {
    const container = new Container()

    // 面板背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, panelWidth, panelHeight, 10)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.9 })
    bg.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })
    container.addChild(bg)

    // 标题
    const title = new Text({
      text: '【门派设施】',
      style: createStyle(16, Colors.TEXT_GOLD)
    })
    title.x = 15
    title.y = 10
    container.addChild(title)

    // 设施卡片 - 响应式布局
    const facilityWidth = Math.min(140, panelWidth * 0.3)   // 设施卡片宽度响应面板宽度
    const facilityHeight = Math.min(100, panelHeight * 0.35)
    const startX = 15
    const startY = 40
    const padding = 10

    this.sector.facilities.forEach((facility, index) => {
      const col = index % 3
      const row = Math.floor(index / 3)
      const card = this.createFacilityCard(facility, facilityWidth, facilityHeight)
      card.x = startX + col * (facilityWidth + padding)
      card.y = startY + row * (facilityHeight + padding)
      container.addChild(card)
    })

    return container
  }

  /**
   * 设施卡片
   */
  private createFacilityCard(facility: Facility, width: number, height: number): Container {
    const container = new Container()

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, width, height, 8)
    bg.fill({ color: Colors.CARD_BG, alpha: 0.9 })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 1 })
    container.addChild(bg)

    // 设施名称
    const nameText = new Text({
      text: facility.name,
      style: createStyle(14, Colors.TEXT_GOLD)
    })
    nameText.anchor.set(0.5)
    nameText.x = width / 2
    nameText.y = 15
    container.addChild(nameText)

    // 等级
    const levelText = new Text({
      text: `Lv.${facility.level}`,
      style: createStyle(12, Colors.TEXT_PRIMARY)
    })
    levelText.anchor.set(0.5)
    levelText.x = width / 2
    levelText.y = 35
    container.addChild(levelText)

    // 容纳人数
    const capacityText = new Text({
      text: `容纳: ${facility.occupants.length}/${facility.capacity}`,
      style: createStyle(11, Colors.TEXT_SECONDARY)
    })
    capacityText.anchor.set(0.5)
    capacityText.x = width / 2
    capacityText.y = 55
    container.addChild(capacityText)

    // 点击交互
    container.eventMode = 'static'
    container.cursor = 'pointer'
    container.on('pointerdown', () => {
      this.showFacilityDetail(facility)
    })

    return container
  }

  /**
   * 势力地图面板
   */
  private createFactionMap(mapWidth: number, mapHeight: number): Container {
    const container = new Container()

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, mapWidth, mapHeight, 10)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.9 })
    bg.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })
    container.addChild(bg)

    // 标题
    const title = new Text({
      text: '【势力地图】',
      style: createStyle(16, Colors.TEXT_GOLD)
    })
    title.x = 15
    title.y = 10
    container.addChild(title)

    // 门派节点 - 响应式布局
    const factions = [
      { name: '丐帮', relation: 'self' },
      { name: '武当', relation: 'hostile' },
      { name: '华山', relation: 'friendly' },
      { name: '明教', relation: 'neutral' },
      { name: '少林', relation: 'friendly' },
      { name: '魔教', relation: 'hostile' }
    ]

    const nodeWidth = Math.min(80, mapWidth * 0.28)
    const nodeHeight = Math.min(60, mapHeight * 0.12)
    const startX = 30
    const startY = 40
    const colPadding = Math.min(90, mapWidth * 0.32)
    const rowPadding = Math.min(70, mapHeight * 0.18)

    factions.forEach((faction, index) => {
      const col = index % 2
      const row = Math.floor(index / 2)
      const node = this.createFactionNode(faction, nodeWidth, nodeHeight)
      node.x = startX + col * colPadding
      node.y = startY + row * rowPadding
      container.addChild(node)
    })

    // 提示文字
    const hint = new Text({
      text: '[点击查看详情]',
      style: createStyle(11, Colors.TEXT_SECONDARY)
    })
    hint.x = mapWidth / 2 - 50
    hint.y = mapHeight - 30
    container.addChild(hint)

    return container
  }

  /**
   * 门派节点
   */
  private createFactionNode(faction: { name: string; relation: string }, width: number, height: number): Container {
    const container = new Container()
    const color = FACTION_COLORS[faction.relation as keyof typeof FACTION_COLORS] || FACTION_COLORS.neutral

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, width, height, 8)
    bg.fill({ color: Colors.CARD_BG, alpha: 0.9 })
    bg.stroke({ color, width: 2 })
    container.addChild(bg)

    // 门派名称
    const nameText = new Text({
      text: faction.name,
      style: createStyle(12, color)
    })
    nameText.anchor.set(0.5)
    nameText.x = width / 2
    nameText.y = 20
    container.addChild(nameText)

    // 关系状态
    const relationLabels = {
      self: '自己',
      friendly: '友好',
      neutral: '中立',
      hostile: '敌对'
    }
    const relationText = new Text({
      text: relationLabels[faction.relation as keyof typeof relationLabels] || '中立',
      style: createStyle(10, Colors.TEXT_SECONDARY)
    })
    relationText.anchor.set(0.5)
    relationText.x = width / 2
    relationText.y = 40
    container.addChild(relationText)

    // 点击交互
    container.eventMode = 'static'
    container.cursor = 'pointer'
    container.on('pointerdown', () => {
      if (faction.relation !== 'self') {
        this.showFactionDetail(faction.name, faction.relation)
      }
    })

    return container
  }

  /**
   * 弟子列表面板（响应式宽度）
   */
  private createDiscipleList(listWidth: number): Container {
    const container = new Container()
    const listHeight = 200   // 增加高度以容纳卡片

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, listWidth, listHeight, 10)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.9 })
    bg.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })
    container.addChild(bg)

    // 标题
    const title = new Text({
      text: '【弟子列表】',
      style: createStyle(16, Colors.TEXT_GOLD)
    })
    title.x = 15
    title.y = 10
    container.addChild(title)

    // 弟子卡片 - 响应式尺寸，确保在容器高度内
    this.discipleCards = []
    const cardWidth = Math.min(130, listWidth * 0.15)    // 卡片宽度响应列表宽度
    const cardHeight = 155                               // 卡片高度固定，确保内容可见
    const startX = 20
    const startY = 35                                    // 标题占35px
    const padding = 15

    // 计算每行能放多少卡片
    const cardsPerRow = Math.floor((listWidth - startX - 20) / (cardWidth + padding))

    this.sector.disciples.forEach((disciple, index) => {
      const col = index % cardsPerRow
      const row = Math.floor(index / cardsPerRow)
      const card = new DiscipleCard(disciple, cardWidth, cardHeight, this.renderer)
      card.x = startX + col * (cardWidth + padding)
      card.y = startY + row * (cardHeight + 5)
      card.setOnClick(() => this.showDiscipleDetail(disciple))
      container.addChild(card)
      this.discipleCards.push(card)
    })

    // 招募新弟子按钮（右下角）
    const recruitBtn = new Button('招募新弟子', 120, 30, this.renderer)
    recruitBtn.x = listWidth - 130
    recruitBtn.y = 10
    recruitBtn.setOnClick(() => this.showMessage('招募功能开发中...'))
    container.addChild(recruitBtn)

    return container
  }

  /**
   * 右侧操作按钮（垂直排列）- 按照SECTOR-UI-DESIGN.md布局
   * 按钮顺序：【修炼】→【训练】→【探索】→【返回】
   */
  private createActionButtons(panelWidth: number, panelHeight: number): Container {
    const container = new Container()

    // 按钮尺寸
    const btnWidth = panelWidth
    const btnHeight = 45
    const btnGap = 10

    // 计算按钮位置（垂直居中排列）
    const totalButtonsHeight = 4 * btnHeight + 3 * btnGap
    const startY = (panelHeight - totalButtonsHeight) / 2

    // 【修炼】按钮 - 学习武功
    const learnBtn = new Button('【修炼】\n学习武功', btnWidth, btnHeight, this.renderer)
    learnBtn.x = 0
    learnBtn.y = startY
    learnBtn.setOnClick(() => this.onTraining?.() || this.showMessage('修炼功能开发中...'))
    container.addChild(learnBtn)

    // 【训练】按钮 - 训练武功
    const trainBtn = new Button('【训练】\n训练武功', btnWidth, btnHeight, this.renderer)
    trainBtn.x = 0
    trainBtn.y = startY + btnHeight + btnGap
    trainBtn.setOnClick(() => this.showMessage('训练功能开发中...'))
    container.addChild(trainBtn)

    // 【探索】按钮 - 江湖探索
    const exploreBtn = new Button('【探索】\n江湖探索', btnWidth, btnHeight, this.renderer)
    exploreBtn.x = 0
    exploreBtn.y = startY + 2 * (btnHeight + btnGap)
    exploreBtn.setOnClick(() => this.showMessage('探索功能开发中...'))
    container.addChild(exploreBtn)

    // 【返回】按钮 - 返回标题界面
    const backBtn = new Button('【返回】\n标题界面', btnWidth, btnHeight, this.renderer)
    backBtn.x = 0
    backBtn.y = startY + 3 * (btnHeight + btnGap)
    backBtn.setOnClick(() => this.onBackToTitle?.())
    container.addChild(backBtn)

    return container
  }

  /**
   * 显示设施详情
   */
  private showFacilityDetail(facility: Facility): void {
    const size = this.renderer.getSize()

    // 清理旧弹窗
    if (this.detailPopup) {
      this.removeChild(this.detailPopup)
    }

    this.detailPopup = new Container()

    // 遮罩
    const mask = this.renderer.createGraphics()
    mask.rect(0, 0, size.width, size.height)
    mask.fill({ color: 0x000000, alpha: 0.5 })
    mask.eventMode = 'static'
    mask.on('pointerdown', () => {
      this.removeChild(this.detailPopup!)
      this.detailPopup = null
    })
    this.detailPopup!.addChild(mask)

    // 弹窗背景
    const popupWidth = 300
    const popupHeight = 200
    const popupBg = this.renderer.createGraphics()
    popupBg.roundRect(size.width / 2 - popupWidth / 2, size.height / 2 - popupHeight / 2, popupWidth, popupHeight, 15)
    popupBg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    popupBg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    this.detailPopup!.addChild(popupBg)

    // 设施名称
    const nameText = new Text({
      text: facility.name,
      style: createStyle(18, Colors.TEXT_GOLD)
    })
    nameText.anchor.set(0.5)
    nameText.x = size.width / 2
    nameText.y = size.height / 2 - popupHeight / 2 + 30
    this.detailPopup!.addChild(nameText)

    // 等级
    const levelText = new Text({
      text: `等级: ${facility.level} / 容量: ${facility.capacity}`,
      style: createStyle(14, Colors.TEXT_PRIMARY)
    })
    levelText.anchor.set(0.5)
    levelText.x = size.width / 2
    levelText.y = size.height / 2 - popupHeight / 2 + 60
    this.detailPopup!.addChild(levelText)

    // 使用者
    const occupantText = new Text({
      text: `当前使用: ${facility.occupants.length}人`,
      style: createStyle(12, Colors.TEXT_SECONDARY)
    })
    occupantText.anchor.set(0.5)
    occupantText.x = size.width / 2
    occupantText.y = size.height / 2 - popupHeight / 2 + 85
    this.detailPopup!.addChild(occupantText)

    // 升级按钮
    const upgradeBtn = new Button('升级', 100, 35, this.renderer)
    upgradeBtn.x = size.width / 2 - 55
    upgradeBtn.y = size.height / 2 - popupHeight / 2 + 120
    upgradeBtn.setOnClick(() => {
      const result = upgradeFacility(this.sector, facility.id)
      if (result.success) {
        this.sector = result.sector
        this.showMessage(result.message)
        this.removeChild(this.detailPopup!)
        this.detailPopup = null
        this.clear()
        this.createUI()
      } else {
        this.showMessage(result.message)
      }
    })
    this.detailPopup!.addChild(upgradeBtn)

    // 关闭按钮
    const closeBtn = new Button('关闭', 100, 35, this.renderer)
    closeBtn.x = size.width / 2 + 55
    closeBtn.y = size.height / 2 - popupHeight / 2 + 120
    closeBtn.setOnClick(() => {
      this.removeChild(this.detailPopup!)
      this.detailPopup = null
    })
    this.detailPopup!.addChild(closeBtn)

    this.addChild(this.detailPopup)
  }

  /**
   * 显示门派详情
   */
  private showFactionDetail(name: string, relation: string): void {
    const relationLabels = {
      friendly: '友好',
      neutral: '中立',
      hostile: '敌对'
    }
    this.showMessage(`${name} - 关系: ${relationLabels[relation as keyof typeof relationLabels]}`)
  }

  /**
   * 显示弟子详情（响应式弹窗）
   */
  private showDiscipleDetail(disciple: SectorDisciple): void {
    const size = this.renderer.getSize()

    if (this.detailPopup) {
      this.removeChild(this.detailPopup)
    }

    this.detailPopup = new Container()

    // 遮罩
    const mask = this.renderer.createGraphics()
    mask.rect(0, 0, size.width, size.height)
    mask.fill({ color: 0x000000, alpha: 0.5 })
    mask.eventMode = 'static'
    mask.on('pointerdown', () => {
      this.removeChild(this.detailPopup!)
      this.detailPopup = null
    })
    this.detailPopup!.addChild(mask)

    // 弹窗尺寸响应屏幕大小（最大不超过屏幕的85%）
    const maxPopupWidth = Math.min(350, size.width * 0.85)
    const maxPopupHeight = Math.min(400, size.height * 0.85)
    const popupWidth = maxPopupWidth
    const popupHeight = maxPopupHeight
    const px = (size.width - popupWidth) / 2
    const py = (size.height - popupHeight) / 2

    // 弹窗背景
    const popupBg = this.renderer.createGraphics()
    popupBg.roundRect(px, py, popupWidth, popupHeight, 15)
    popupBg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    popupBg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    this.detailPopup!.addChild(popupBg)

    // 弟子名称
    const nameText = new Text({
      text: disciple.name,
      style: createStyle(18, Colors.TEXT_GOLD)
    })
    nameText.anchor.set(0.5)
    nameText.x = px + popupWidth / 2
    nameText.y = py + 25
    this.detailPopup!.addChild(nameText)

    // 境界等级
    const realmText = new Text({
      text: `${disciple.realm} · 等级 ${disciple.level}`,
      style: createStyle(12, Colors.TEXT_SECONDARY)
    })
    realmText.anchor.set(0.5)
    realmText.x = px + popupWidth / 2
    realmText.y = py + 48
    this.detailPopup!.addChild(realmText)

    // 状态
    const statusColor = disciple.status === SectorDiscipleStatus.HEALTHY
      ? Colors.TEXT_PRIMARY
      : disciple.status === SectorDiscipleStatus.INJURED
        ? Colors.TEXT_RED
        : Colors.TEXT_SECONDARY
    const statusText = new Text({
      text: `状态: ${disciple.status}`,
      style: createStyle(12, statusColor)
    })
    statusText.x = px + 15
    statusText.y = py + 70
    this.detailPopup!.addChild(statusText)

    // 属性 - 左侧
    const attrColX = px + 15
    const attrStartY = py + 95
    const attrLineHeight = 18
    const attrs = [
      `根骨: ${disciple.root}`,
      `悟性: ${disciple.insight}`,
      `定力: ${disciple.will}`,
      `臂力: ${disciple.strength}`,
      `身法: ${disciple.agility}`
    ]
    attrs.forEach((attr, i) => {
      const text = new Text({ text: attr, style: createStyle(11, Colors.TEXT_PRIMARY) })
      text.x = attrColX
      text.y = attrStartY + i * attrLineHeight
      this.detailPopup!.addChild(text)
    })

    // 战斗属性 - 右侧（根据弹窗宽度调整位置）
    const battleColX = px + popupWidth * 0.52
    const battleAttrs = [
      `HP: ${disciple.currentHp}/${disciple.maxHp}`,
      `MP: ${disciple.currentMp}/${disciple.maxMp}`,
      `精力: ${disciple.vitality}/${disciple.maxVitality}`,
      `忠诚: ${disciple.loyalty}`
    ]
    battleAttrs.forEach((attr, i) => {
      const text = new Text({ text: attr, style: createStyle(11, Colors.TEXT_SECONDARY) })
      text.x = battleColX
      text.y = attrStartY + i * attrLineHeight
      this.detailPopup!.addChild(text)
    })

    // 操作按钮 - 响应式宽度（设为出战 | 修炼武功 | 返回）
    const btnWidth = Math.min(100, popupWidth * 0.28)
    const btnHeight = 32
    const btnY = py + popupHeight - 50
    const btnGap = 10
    const totalBtnWidth = 3 * btnWidth + 2 * btnGap
    const btnStartX = px + (popupWidth - totalBtnWidth) / 2

    const setBattleBtn = new Button('设为出战', btnWidth, btnHeight, this.renderer)
    setBattleBtn.x = btnStartX
    setBattleBtn.y = btnY
    setBattleBtn.setOnClick(() => {
      if (disciple.status === SectorDiscipleStatus.HEALTHY && disciple.vitality >= 20) {
        this._onEnterBattle?.([disciple.id])
        this.removeChild(this.detailPopup!)
        this.detailPopup = null
      } else {
        this.showMessage('弟子状态不适合出战')
      }
    })
    this.detailPopup!.addChild(setBattleBtn)

    const trainBtn = new Button('修炼武功', btnWidth, btnHeight, this.renderer)
    trainBtn.x = btnStartX + btnWidth + btnGap
    trainBtn.y = btnY
    trainBtn.setOnClick(() => this.showMessage('武功修炼功能开发中...'))
    this.detailPopup!.addChild(trainBtn)

    const closeBtn = new Button('返回', btnWidth, btnHeight, this.renderer)
    closeBtn.x = btnStartX + 2 * (btnWidth + btnGap)
    closeBtn.y = btnY
    closeBtn.setOnClick(() => {
      this.removeChild(this.detailPopup!)
      this.detailPopup = null
    })
    this.detailPopup!.addChild(closeBtn)

    this.addChild(this.detailPopup)
  }

  /**
   * 显示消息提示
   */
  private showMessage(message: string): void {
    const size = this.renderer.getSize()

    const popup = this.renderer.createGraphics()
    popup.roundRect(size.width / 2 - 150, size.height / 2 - 30, 300, 60, 10)
    popup.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    popup.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    this.addChild(popup)

    const text = new Text({
      text: message,
      style: createStyle(14, Colors.TEXT_PRIMARY)
    })
    text.anchor.set(0.5)
    text.x = size.width / 2
    text.y = size.height / 2
    this.addChild(text)

    setTimeout(() => {
      this.removeChild(popup)
      this.removeChild(text)
    }, 2000)
  }

  // 回调设置
  setOnEnterBattle(callback: (discipleIds: string[]) => void): void {
    this._onEnterBattle = callback
  }

  setOnBackToTitle(callback: () => void): void {
    this.onBackToTitle = callback
  }

  setOnTraining(callback: () => void): void {
    this.onTraining = callback
  }

  getSector(): SectorState {
    return this.sector
  }
}