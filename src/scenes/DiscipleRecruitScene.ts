import { Container, Graphics, Text } from 'pixi.js'
import { Scene } from './Scene'
import { Renderer, Colors, TextStyles } from '../renderer/Renderer'
import { Button } from '../renderer/UIComponents'
import { discipleTemplates } from '../data/disciples'
import { DiscipleTemplate } from '../game/types'
import { LayoutConstants } from '../renderer/LayoutConstants'
import { createDisciple, recruitDisciple, DiscipleState } from '../game/Disciple'

// 弟子招募场景 - 草图版
export class DiscipleRecruitScene extends Scene {
  private discipleItems: DiscipleSelectItem[] = []
  private selectedTemplateId: string | null = null
  private detailPanel: Container | null = null
  private recruitButton: Button | null = null
  private recruitedDisciples: DiscipleState[] = []
  private silverAmount: number = 1000  // 当前银两（模拟）
  private reputationAmount: number = 100  // 当前声望（模拟）

  private onDiscipleRecruited?: (disciple: DiscipleState) => void
  private onBack?: () => void

  constructor(renderer: Renderer) {
    super(renderer)
  }

  onEnter(): void {
    this.renderer.onResize(() => this.handleResize())
    this.createUI()
    this.isInitialized = true
  }

  onExit(): void {
    this.renderer.offResize(() => this.handleResize())
    this.clear()
  }

  private handleResize(): void {
    this.clear()
    this.createUI()
    if (this.selectedTemplateId) {
      this.showDiscipleDetail(this.selectedTemplateId)
    }
  }

  private createUI(): void {
    this.createTitle()
    this.createDiscipleGrid()
    this.createRecruitedList()
  }

  update(_delta: number): void {}

  // 创建标题和资源显示
  private createTitle(): void {
    const size = this.renderer.getSize()
    const titleY = size.height * 0.02

    // 标题
    const title = this.renderer.createText('招募弟子', TextStyles.TITLE, 0, titleY)
    title.anchor.set(0.5, 0)
    title.x = size.width / 2
    this.addChild(title)

    // 返回按钮
    const backBtn = new Button('返回', LayoutConstants.scaleValue(80), LayoutConstants.scaleValue(35), this.renderer)
    backBtn.x = LayoutConstants.scaleValue(20)
    backBtn.y = titleY + LayoutConstants.scaleValue(10)
    backBtn.setOnClick(() => {
      if (this.onBack) this.onBack()
    })
    this.addChild(backBtn)

    // 资源显示（右上角）
    const resourceY = titleY + LayoutConstants.scaleValue(10)
    const resourceX = size.width - LayoutConstants.scaleValue(200)

    const silverText = new Text({
      text: `银两: ${this.silverAmount}`,
      style: { fontSize: LayoutConstants.fontStats(), fill: Colors.TEXT_GOLD }
    })
    silverText.x = resourceX
    silverText.y = resourceY
    this.addChild(silverText)

    const repText = new Text({
      text: `声望: ${this.reputationAmount}`,
      style: { fontSize: LayoutConstants.fontStats(), fill: Colors.TEXT_PRIMARY }
    })
    repText.x = resourceX
    repText.y = resourceY + LayoutConstants.scaleValue(25)
    this.addChild(repText)

    // 提示文字
    const subtitle = this.renderer.createText('选择弟子进行招募', TextStyles.SUBTITLE, 0, titleY + LayoutConstants.scaleValue(60))
    subtitle.anchor.set(0.5, 0)
    subtitle.x = size.width / 2
    this.addChild(subtitle)
  }

  // 创建弟子网格
  private createDiscipleGrid(): void {
    const size = this.renderer.getSize()
    const startY = size.height * 0.12
    const gridHeight = size.height * 0.55

    // 网格区域背景
    const gridBg = this.renderer.createGraphics()
    gridBg.rect(0, startY, size.width, gridHeight)
    gridBg.fill({ color: Colors.PANEL_BG, alpha: 0.3 })
    this.addChild(gridBg)

    // 卡片尺寸
    const cardWidth = LayoutConstants.scaleValue(280)
    const cardHeight = LayoutConstants.scaleValue(180)
    const spacing = LayoutConstants.scaleValue(20)

    // 计算列数
    const availableWidth = size.width * 0.9
    const columns = Math.max(3, Math.min(6, Math.floor((availableWidth + spacing) / (cardWidth + spacing))))
    const gridWidth = columns * (cardWidth + spacing) - spacing
    const startX = (size.width - gridWidth) / 2

    let row = 0
    let col = 0

    for (const [id, template] of Object.entries(discipleTemplates)) {
      const x = startX + col * (cardWidth + spacing)
      const y = startY + LayoutConstants.scaleValue(20) + row * (cardHeight + spacing)

      const item = this.createDiscipleCard(id, template, x, y, cardWidth, cardHeight)
      this.discipleItems.push(item)
      this.addChild(item.container)

      col++
      if (col >= columns) {
        col = 0
        row++
      }
    }
  }

  // 创建弟子卡片
  private createDiscipleCard(id: string, template: DiscipleTemplate, x: number, y: number, cardWidth: number, cardHeight: number): DiscipleSelectItem {
    const container = this.renderer.createContainer(x, y)

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, cardWidth, cardHeight, 12)
    bg.fill({ color: Colors.CARD_BG })
    bg.stroke({ color: Colors.TEXT_SECONDARY, width: 2 })
    container.addChild(bg)

    const padding = LayoutConstants.scaleValue(15)

    // 名称
    const name = new Text({
      text: template.name,
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

    // 描述（截断）
    const desc = new Text({
      text: template.description.length > 30 ? template.description.substring(0, 30) + '...' : template.description,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCardType(),
        fill: Colors.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: cardWidth - padding * 2
      }
    })
    desc.x = padding
    desc.y = padding + LayoutConstants.fontCharacterName() + 8
    container.addChild(desc)

    // 属性范围预览
    const statsY = desc.y + LayoutConstants.fontCardType() + 12
    const statsText = [
      `根骨: ${template.rootRange[0]}-${template.rootRange[1]}`,
      `悟性: ${template.insightRange[0]}-${template.insightRange[1]}`,
      `臂力: ${template.strengthRange[0]}-${template.strengthRange[1]}`
    ].join('  ')
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

    // 招募条件
    const costY = statsY + LayoutConstants.fontStats() + 12
    const costText = `招募: ${template.recruitCost}银两  需要: ${template.minReputation}声望`
    const cost = new Text({
      text: costText,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCardType(),
        fill: template.recruitCost > this.silverAmount || template.minReputation > this.reputationAmount
          ? Colors.TEXT_RED
          : Colors.MP_BAR
      }
    })
    cost.x = padding
    cost.y = costY
    container.addChild(cost)

    // 交互
    container.eventMode = 'static'
    container.cursor = 'pointer'
    container.on('pointerdown', () => this.selectDisciple(id, bg))

    return { template, container, bg }
  }

  // 选择弟子
  private selectDisciple(id: string, bg: Graphics): void {
    // 取消之前的选择
    if (this.selectedTemplateId) {
      const prevItem = this.discipleItems.find(item => {
        const templateId = Object.keys(discipleTemplates).find(key => discipleTemplates[key] === item.template)
        return templateId === this.selectedTemplateId
      })
      if (prevItem) this.highlightCard(prevItem.bg, false)
    }

    this.selectedTemplateId = id
    this.highlightCard(bg, true)
    this.showDiscipleDetail(id)
  }

  // 高亮卡片
  private highlightCard(bg: Graphics, selected: boolean): void {
    const cardWidth = LayoutConstants.scaleValue(280)
    const cardHeight = LayoutConstants.scaleValue(180)

    bg.clear()
    bg.roundRect(0, 0, cardWidth, cardHeight, 12)
    bg.fill({ color: selected ? Colors.CARD_HOVER : Colors.CARD_BG })
    bg.stroke({ color: selected ? Colors.TEXT_GOLD : Colors.TEXT_SECONDARY, width: selected ? 4 : 2 })
  }

  // 显示弟子详情
  private showDiscipleDetail(id: string): void {
    if (this.detailPanel) {
      this.removeChild(this.detailPanel)
    }

    const template = discipleTemplates[id]
    const size = this.renderer.getSize()

    const panelWidth = Math.min(size.width * 0.8, LayoutConstants.scaleValue(600))
    const panelHeight = LayoutConstants.scaleValue(300)
    const panelY = size.height - panelHeight - LayoutConstants.scaleValue(80)

    this.detailPanel = this.renderer.createContainer(size.width / 2 - panelWidth / 2, panelY)

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, panelWidth, panelHeight, 12)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 3 })
    this.detailPanel.addChild(bg)

    const padding = LayoutConstants.scaleValue(20)

    // 名称和描述
    const name = new Text({
      text: template.name,
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

    const desc = new Text({
      text: template.description,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCardType(),
        fill: Colors.TEXT_SECONDARY,
        wordWrap: true,
        wordWrapWidth: panelWidth - padding * 2
      }
    })
    desc.x = padding
    desc.y = padding + LayoutConstants.fontCharacterName() + 10
    this.detailPanel.addChild(desc)

    // 属性详情（两行）
    const stats1Y = desc.y + LayoutConstants.fontCardType() + 20
    const stats1Text = [
      `根骨: ${template.rootRange[0]}~${template.rootRange[1]}  (成长潜力)`,
      `悟性: ${template.insightRange[0]}~${template.insightRange[1]}  (学习速度)`
    ].join('\n')
    const stats1 = new Text({
      text: stats1Text,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontStats(),
        fill: Colors.TEXT_GOLD
      }
    })
    stats1.x = padding
    stats1.y = stats1Y
    this.detailPanel.addChild(stats1)

    const stats2Y = stats1Y + LayoutConstants.fontStats() * 2 + 10
    const stats2Text = [
      `定力: ${template.willRange[0]}~${template.willRange[1]}  (内功效果)`,
      `臂力: ${template.strengthRange[0]}~${template.strengthRange[1]}  (伤害加成)`,
      `身法: ${template.agilityRange[0]}~${template.agilityRange[1]}  (轻功值)`
    ].join('\n')
    const stats2 = new Text({
      text: stats2Text,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontStats(),
        fill: Colors.TEXT_GOLD
      }
    })
    stats2.x = padding
    stats2.y = stats2Y
    this.detailPanel.addChild(stats2)

    // 初始武功
    const skillsY = stats2Y + LayoutConstants.fontStats() * 3 + 15
    const skillsText = `初始武功: ${template.initialSkills.length > 0 ? template.initialSkills.join(', ') : '无'}`
    const skills = new Text({
      text: skillsText,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCardType(),
        fill: Colors.TEXT_RED
      }
    })
    skills.x = padding
    skills.y = skillsY
    this.detailPanel.addChild(skills)

    // 招募按钮
    const btnWidth = LayoutConstants.scaleValue(150)
    const btnHeight = LayoutConstants.scaleValue(45)
    this.recruitButton = new Button('招募', btnWidth, btnHeight, this.renderer)

    // 检查是否可以招募
    const canRecruit = template.recruitCost <= this.silverAmount && template.minReputation <= this.reputationAmount

    this.recruitButton.x = panelWidth - padding - btnWidth
    this.recruitButton.y = panelHeight - padding - btnHeight

    if (canRecruit) {
      this.recruitButton.setOnClick(() => this.recuteDiscipleAction(id))
    } else {
      this.recruitButton.setDisabled(true)
    }

    this.detailPanel.addChild(this.recruitButton)

    // 招募花费提示
    const costText = `花费: ${template.recruitCost} 银两`
    const cost = new Text({
      text: costText,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontCardType(),
        fill: canRecruit ? Colors.MP_BAR : Colors.TEXT_RED
      }
    })
    cost.x = panelWidth - padding - btnWidth - LayoutConstants.scaleValue(120)
    cost.y = panelHeight - padding - btnHeight + LayoutConstants.scaleValue(12)
    this.detailPanel.addChild(cost)

    this.addChild(this.detailPanel)
  }

  // 招募弟子
  private recuteDiscipleAction(templateId: string): void {
    const template = discipleTemplates[templateId]

    // 检查资源
    if (template.recruitCost > this.silverAmount || template.minReputation > this.reputationAmount) {
      return
    }

    // 创建弟子
    let disciple = createDisciple(templateId)
    disciple = recruitDisciple(disciple)

    // 扣除银两
    this.silverAmount -= template.recruitCost

    // 添加到已招募列表
    this.recruitedDisciples.push(disciple)

    // 刷新 UI
    this.clear()
    this.createUI()

    // 回调
    if (this.onDiscipleRecruited) {
      this.onDiscipleRecruited(disciple)
    }
  }

  // 创建已招募弟子列表（底部）
  private createRecruitedList(): void {
    const size = this.renderer.getSize()
    const listY = size.height - LayoutConstants.scaleValue(60)
    const listHeight = LayoutConstants.scaleValue(50)

    // 背景
    const listBg = this.renderer.createGraphics()
    listBg.rect(0, listY, size.width, listHeight)
    listBg.fill({ color: Colors.PANEL_BG, alpha: 0.5 })
    this.addChild(listBg)

    // 已招募人数
    const countText = new Text({
      text: `已招募弟子: ${this.recruitedDisciples.length}人`,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: LayoutConstants.fontStats(),
        fill: Colors.TEXT_GOLD
      }
    })
    countText.x = LayoutConstants.scaleValue(20)
    countText.y = listY + LayoutConstants.scaleValue(15)
    this.addChild(countText)

    // 弟子名称列表
    if (this.recruitedDisciples.length > 0) {
      const namesText = this.recruitedDisciples.slice(0, 5).map(d => d.name).join(', ')
      const names = new Text({
        text: namesText.length > 40 ? namesText.substring(0, 40) + '...' : namesText,
        style: {
          fontFamily: 'Arial, sans-serif',
          fontSize: LayoutConstants.fontCardType(),
          fill: Colors.TEXT_PRIMARY
        }
      })
      names.x = LayoutConstants.scaleValue(200)
      names.y = listY + LayoutConstants.scaleValue(15)
      this.addChild(names)
    }
  }

  // 设置回调
  setOnDiscipleRecruited(callback: (disciple: DiscipleState) => void): void {
    this.onDiscipleRecruited = callback
  }

  setOnBack(callback: () => void): void {
    this.onBack = callback
  }

  // 获取已招募弟子
  getRecruitedDisciples(): DiscipleState[] {
    return this.recruitedDisciples
  }
}

// 弟子选择项
interface DiscipleSelectItem {
  template: DiscipleTemplate
  container: Container
  bg: Graphics
}