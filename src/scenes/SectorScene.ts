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
  endTurn,
  TurnSummary,
  DiscipleStatusChange,
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
  private turnSummaryPopup: Container | null = null

  // 回调
  private onEnterBattle?: (discipleIds: string[]) => void
  private onBackToTitle?: () => void
  private onTraining?: () => void
  private onDiplomacy?: () => void

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
   * 创建完整UI - 按照设计文档布局
   */
  private createUI(): void {
    const size = this.renderer.getSize()

    // 背景
    const bg = this.renderer.createGraphics()
    bg.rect(0, 0, size.width, size.height)
    bg.fill({ color: Colors.BACKGROUND })
    this.addChild(bg)

    // ═════════════════════════════════════════════════
    // 顶部状态栏：门派名称 | 声望星级 | 财富 | 弟子数
    // ═════════════════════════════════════════════════
    const headerBar = this.createHeaderBar()
    headerBar.y = 10
    this.addChild(headerBar)

    // ═════════════════════════════════════════════════
    // 左侧：门派设施区域
    // ═════════════════════════════════════════════════
    this.facilityContainer = this.createFacilityPanel()
    this.facilityContainer.x = 20
    this.facilityContainer.y = 70
    this.addChild(this.facilityContainer)

    // ═════════════════════════════════════════════════
    // 右侧：势力地图
    // ═════════════════════════════════════════════════
    this.factionMapContainer = this.createFactionMap()
    const mapWidth = 280
    this.factionMapContainer.x = size.width - mapWidth - 20
    this.factionMapContainer.y = 70
    this.addChild(this.factionMapContainer)

    // ═════════════════════════════════════════════════
    // 弟子列表区域
    // ═════════════════════════════════════════════════
    this.discipleListContainer = this.createDiscipleList()
    this.discipleListContainer.y = size.height - 220
    this.addChild(this.discipleListContainer)

    // ═════════════════════════════════════════════════
    // 底部操作按钮：修炼 | 外交 | 挑战 | 结束回合
    // ═════════════════════════════════════════════════
    const buttonBar = this.createButtonBar()
    buttonBar.y = size.height - 55
    this.addChild(buttonBar)
  }

  /**
   * 顶部状态栏
   */
  private createHeaderBar(): Container {
    const container = new Container()
    const size = this.renderer.getSize()
    const barWidth = size.width - 40
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
   * 门派设施面板
   */
  private createFacilityPanel(): Container {
    const container = new Container()
    const panelWidth = 450
    const panelHeight = 350

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

    // 设施卡片
    const facilityWidth = 140
    const facilityHeight = 100
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
  private createFactionMap(): Container {
    const container = new Container()
    const mapWidth = 280
    const mapHeight = 350

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

    // 门派节点
    const factions = [
      { name: '丐帮', relation: 'self' },
      { name: '武当', relation: 'hostile' },
      { name: '华山', relation: 'friendly' },
      { name: '明教', relation: 'neutral' },
      { name: '少林', relation: 'friendly' },
      { name: '魔教', relation: 'hostile' }
    ]

    const nodeWidth = 80
    const nodeHeight = 60
    const startX = 30
    const startY = 40
    const colPadding = 90
    const rowPadding = 70

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
   * 弟子列表面板
   */
  private createDiscipleList(): Container {
    const container = new Container()
    const size = this.renderer.getSize()
    const listWidth = size.width - 40
    const listHeight = 160

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

    // 弟子卡片
    this.discipleCards = []
    const cardWidth = 100
    const cardHeight = 110
    const startX = 20
    const startY = 35
    const padding = 10

    this.sector.disciples.forEach((disciple, index) => {
      const card = new DiscipleCard(disciple, cardWidth, cardHeight, this.renderer)
      card.x = startX + index * (cardWidth + padding)
      card.y = startY
      card.setOnClick(() => this.showDiscipleDetail(disciple))
      container.addChild(card)
      this.discipleCards.push(card)
    })

    // 招募新弟子按钮
    const recruitBtn = new Button('招募新弟子', 120, 30, this.renderer)
    recruitBtn.x = listWidth - 130
    recruitBtn.y = 10
    recruitBtn.setOnClick(() => this.showMessage('招募功能开发中...'))
    container.addChild(recruitBtn)

    return container
  }

  /**
   * 底部按钮栏：修炼 | 外交 | 挑战 | 结束回合
   */
  private createButtonBar(): Container {
    const container = new Container()
    const size = this.renderer.getSize()
    const btnWidth = 120
    const btnHeight = 45
    const startX = (size.width - 4 * btnWidth - 3 * 15) / 2

    // 修炼按钮
    const trainingBtn = new Button('修炼', btnWidth, btnHeight, this.renderer)
    trainingBtn.x = startX
    trainingBtn.setOnClick(() => this.onTraining?.() || this.showMessage('修炼功能开发中...'))
    container.addChild(trainingBtn)

    // 外交按钮
    const diplomacyBtn = new Button('外交', btnWidth, btnHeight, this.renderer)
    diplomacyBtn.x = startX + btnWidth + 15
    diplomacyBtn.setOnClick(() => this.onDiplomacy?.() || this.showMessage('外交功能开发中...'))
    container.addChild(diplomacyBtn)

    // 挑战按钮
    const challengeBtn = new Button('挑战', btnWidth, btnHeight, this.renderer)
    challengeBtn.x = startX + 2 * (btnWidth + 15)
    challengeBtn.setOnClick(() => this.handleChallenge())
    container.addChild(challengeBtn)

    // 结束回合按钮
    const endTurnBtn = new Button('结束回合', btnWidth, btnHeight, this.renderer)
    endTurnBtn.x = startX + 3 * (btnWidth + 15)
    endTurnBtn.setOnClick(() => this.handleEndTurn())
    container.addChild(endTurnBtn)

    // 返回按钮（单独放左边）
    const backBtn = new Button('返回', 80, 35, this.renderer)
    backBtn.x = 20
    backBtn.y = 5
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
   * 显示弟子详情
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

    const popupWidth = 350
    const popupHeight = 400
    const px = size.width / 2 - popupWidth / 2
    const py = size.height / 2 - popupHeight / 2

    // 弹窗背景
    const popupBg = this.renderer.createGraphics()
    popupBg.roundRect(px, py, popupWidth, popupHeight, 15)
    popupBg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    popupBg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    this.detailPopup!.addChild(popupBg)

    // 弟子名称
    const nameText = new Text({
      text: disciple.name,
      style: createStyle(20, Colors.TEXT_GOLD)
    })
    nameText.anchor.set(0.5)
    nameText.x = size.width / 2
    nameText.y = py + 30
    this.detailPopup!.addChild(nameText)

    // 境界等级
    const realmText = new Text({
      text: `${disciple.realm} · 等级 ${disciple.level}`,
      style: createStyle(14, Colors.TEXT_SECONDARY)
    })
    realmText.anchor.set(0.5)
    realmText.x = size.width / 2
    realmText.y = py + 55
    this.detailPopup!.addChild(realmText)

    // 状态
    const statusColor = disciple.status === SectorDiscipleStatus.HEALTHY
      ? Colors.TEXT_PRIMARY
      : disciple.status === SectorDiscipleStatus.INJURED
        ? Colors.TEXT_RED
        : Colors.TEXT_SECONDARY
    const statusText = new Text({
      text: `状态: ${disciple.status}`,
      style: createStyle(14, statusColor)
    })
    statusText.x = px + 20
    statusText.y = py + 80
    this.detailPopup!.addChild(statusText)

    // 属性
    const attrs = [
      `根骨: ${disciple.root}`,
      `悟性: ${disciple.insight}`,
      `定力: ${disciple.will}`,
      `臂力: ${disciple.strength}`,
      `身法: ${disciple.agility}`
    ]
    attrs.forEach((attr, i) => {
      const text = new Text({ text: attr, style: createStyle(12, Colors.TEXT_PRIMARY) })
      text.x = px + 20
      text.y = py + 110 + i * 22
      this.detailPopup!.addChild(text)
    })

    // 战斗属性
    const battleAttrs = [
      `HP: ${disciple.currentHp}/${disciple.maxHp}`,
      `MP: ${disciple.currentMp}/${disciple.maxMp}`,
      `精力: ${disciple.vitality}/${disciple.maxVitality}`,
      `忠诚: ${disciple.loyalty}`
    ]
    battleAttrs.forEach((attr, i) => {
      const text = new Text({ text: attr, style: createStyle(12, Colors.TEXT_SECONDARY) })
      text.x = px + 180
      text.y = py + 110 + i * 22
      this.detailPopup!.addChild(text)
    })

    // 操作按钮
    const assignBtn = new Button('分配任务', 100, 35, this.renderer)
    assignBtn.x = px + 25
    assignBtn.y = py + popupHeight - 55
    assignBtn.setOnClick(() => this.showMessage('任务分配功能开发中...'))
    this.detailPopup!.addChild(assignBtn)

    const trainBtn = new Button('修炼武功', 100, 35, this.renderer)
    trainBtn.x = px + 130
    trainBtn.y = py + popupHeight - 55
    trainBtn.setOnClick(() => this.showMessage('武功修炼功能开发中...'))
    this.detailPopup!.addChild(trainBtn)

    const closeBtn = new Button('返回', 100, 35, this.renderer)
    closeBtn.x = px + 235
    closeBtn.y = py + popupHeight - 55
    closeBtn.setOnClick(() => {
      this.removeChild(this.detailPopup!)
      this.detailPopup = null
    })
    this.detailPopup!.addChild(closeBtn)

    this.addChild(this.detailPopup)
  }

  /**
   * 处理挑战
   */
  private handleChallenge(): void {
    const availableDisciples = this.sector.disciples
      .filter(d => d.status === SectorDiscipleStatus.HEALTHY && d.vitality >= 20)

    if (availableDisciples.length === 0) {
      this.showMessage('没有精力充足的弟子可出战')
      return
    }

    if (this.onEnterBattle) {
      this.onEnterBattle([availableDisciples[0].id])
    }
  }

  /**
   * 处理结束回合
   */
  private handleEndTurn(): void {
    const result = endTurn(this.sector)
    this.sector = result.sector
    this.showTurnSummary(result.summary)
  }

  /**
   * 显示回合结算
   */
  private showTurnSummary(summary: TurnSummary): void {
    const size = this.renderer.getSize()

    if (this.turnSummaryPopup) {
      this.removeChild(this.turnSummaryPopup)
    }

    this.turnSummaryPopup = new Container()

    // 遮罩
    const mask = this.renderer.createGraphics()
    mask.rect(0, 0, size.width, size.height)
    mask.fill({ color: 0x000000, alpha: 0.5 })
    mask.eventMode = 'static'
    this.turnSummaryPopup!.addChild(mask)

    const popupWidth = 450
    const popupHeight = 350
    const px = size.width / 2 - popupWidth / 2
    const py = size.height / 2 - popupHeight / 2

    // 弹窗背景
    const popupBg = this.renderer.createGraphics()
    popupBg.roundRect(px, py, popupWidth, popupHeight, 15)
    popupBg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    popupBg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    this.turnSummaryPopup!.addChild(popupBg)

    // 标题
    const titleText = new Text({
      text: `【回合结算】第 ${this.sector.turn - 1} 回合`,
      style: createStyle(18, Colors.TEXT_GOLD)
    })
    titleText.anchor.set(0.5)
    titleText.x = size.width / 2
    titleText.y = py + 30
    this.turnSummaryPopup!.addChild(titleText)

    // 资源变化
    const resourceTitle = new Text({
      text: '资源变化:',
      style: createStyle(14, Colors.TEXT_PRIMARY)
    })
    resourceTitle.x = px + 20
    resourceTitle.y = py + 60
    this.turnSummaryPopup!.addChild(resourceTitle)

    if (summary.silverChange > 0) {
      const silverText = new Text({
        text: `银两: +${summary.silverChange}`,
        style: createStyle(12, Colors.TEXT_GOLD)
      })
      silverText.x = px + 40
      silverText.y = py + 85
      this.turnSummaryPopup!.addChild(silverText)
    }

    if (summary.reputationChange > 0) {
      const repText = new Text({
        text: `声望: +${summary.reputationChange}`,
        style: createStyle(12, Colors.TEXT_GOLD)
      })
      repText.x = px + 40
      repText.y = py + 105
      this.turnSummaryPopup!.addChild(repText)
    }

    // 弟子变化
    if (summary.discipleStatusChanges.length > 0) {
      const discipleTitle = new Text({
        text: '弟子变化:',
        style: createStyle(14, Colors.TEXT_PRIMARY)
      })
      discipleTitle.x = px + 20
      discipleTitle.y = py + 130
      this.turnSummaryPopup!.addChild(discipleTitle)

      let lineY = py + 155
      summary.discipleStatusChanges.forEach((change: DiscipleStatusChange) => {
        const text = new Text({
          text: `${change.discipleName}: ${change.changes.join(', ')}`,
          style: createStyle(11, Colors.TEXT_SECONDARY)
        })
        text.x = px + 40
        text.y = lineY
        this.turnSummaryPopup!.addChild(text)
        lineY += 20
      })
    }

    // 确认按钮
    const confirmBtn = new Button('进入下一回合', 150, 40, this.renderer)
    confirmBtn.x = size.width / 2 - 75
    confirmBtn.y = py + popupHeight - 55
    confirmBtn.setOnClick(() => {
      this.removeChild(this.turnSummaryPopup!)
      this.turnSummaryPopup = null
      this.clear()
      this.createUI()
    })
    this.turnSummaryPopup!.addChild(confirmBtn)

    this.addChild(this.turnSummaryPopup)
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
    this.onEnterBattle = callback
  }

  setOnBackToTitle(callback: () => void): void {
    this.onBackToTitle = callback
  }

  setOnTraining(callback: () => void): void {
    this.onTraining = callback
  }

  setOnDiplomacy(callback: () => void): void {
    this.onDiplomacy = callback
  }

  getSector(): SectorState {
    return this.sector
  }
}