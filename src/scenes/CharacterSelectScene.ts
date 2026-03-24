import { Container, Graphics, Text } from 'pixi.js'
import { Scene } from './Scene'
import { Renderer, Colors, TextStyles } from '../renderer/Renderer'
import { Button } from '../renderer/UIComponents'
import { characters, getCharacterMartialArts } from '../data/skills'
import { CharacterConfig } from '../game/types'

// 角色选择项
interface CharacterSelectItem {
  config: CharacterConfig
  container: Container
}

// 角色选择场景
export class CharacterSelectScene extends Scene {
  private characterItems: CharacterSelectItem[] = []
  private selectedCharacterId: string | null = null
  private detailPanel: Container | null = null
  private startButton: Button | null = null
  private onCharacterSelected?: (characterId: string) => void
  private onGameStart?: (characterId: string) => void

  constructor(renderer: Renderer) {
    super(renderer)
  }

  onEnter(): void {
    if (this.isInitialized) return

    this.createTitle()
    this.createCharacterGrid()
    this.createStartButton()

    this.isInitialized = true
  }

  onExit(): void {
    this.clear()
  }

  update(_delta: number): void {
    // 无需每帧更新
  }

  // 创建标题
  private createTitle(): void {
    const title = this.renderer.createText('武侠卡牌对战', TextStyles.TITLE, 0, 30)
    title.anchor.set(0.5, 0)

    const size = this.renderer.getSize()
    title.x = size.width / 2

    this.addChild(title)

    // 副标题
    const subtitle = this.renderer.createText('选择你的角色', TextStyles.SUBTITLE, 0, 75)
    subtitle.anchor.set(0.5, 0)
    subtitle.x = size.width / 2

    this.addChild(subtitle)
  }

  // 创建角色网格
  private createCharacterGrid(): void {
    const size = this.renderer.getSize()
    const startY = 120
    const cardWidth = 180
    const cardHeight = 140
    const spacing = 15
    const columns = 7

    // 计算网格宽度
    const gridWidth = columns * (cardWidth + spacing) - spacing
    const startX = (size.width - gridWidth) / 2

    let row = 0
    let col = 0

    for (const [id, config] of Object.entries(characters)) {
      const x = startX + col * (cardWidth + spacing)
      const y = startY + row * (cardHeight + spacing)

      const item = this.createCharacterCard(id, config, x, y)
      this.characterItems.push(item)
      this.addChild(item.container)

      col++
      if (col >= columns) {
        col = 0
        row++
      }
    }
  }

  // 创建角色卡片
  private createCharacterCard(id: string, config: CharacterConfig, x: number, y: number): CharacterSelectItem {
    const container = this.renderer.createContainer(x, y)

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, 180, 140, 10)
    bg.fill({ color: Colors.CARD_BG })
    bg.stroke({ color: Colors.TEXT_SECONDARY, width: 2 })
    container.addChild(bg)

    // 名称
    const name = new Text({
      text: config.name,
      style: TextStyles.SELECT_NAME
    })
    name.x = 10
    name.y = 8
    container.addChild(name)

    // 称号
    const title = new Text({
      text: config.title,
      style: TextStyles.SELECT_TITLE
    })
    title.x = 10
    title.y = 28
    container.addChild(title)

    // 描述
    const desc = new Text({
      text: config.description,
      style: TextStyles.SELECT_DESC
    })
    desc.x = 10
    desc.y = 45
    container.addChild(desc)

    // 属性
    const statsText = `体力:${config.hp}  内力:${config.mp}  轻功:${config.agility}`
    const stats = new Text({
      text: statsText,
      style: { fontSize: 11, fill: Colors.TEXT_GOLD }
    })
    stats.x = 10
    stats.y = 70
    container.addChild(stats)

    // 武功
    const martialArtsList = getCharacterMartialArts(id)
    const artsText = martialArtsList.map(a => a.name).join(', ')
    const arts = new Text({
      text: artsText,
      style: { fontSize: 10, fill: Colors.TEXT_RED, wordWrap: true, wordWrapWidth: 160 }
    })
    arts.x = 10
    arts.y = 90
    container.addChild(arts)

    // 交互
    container.eventMode = 'static'
    container.cursor = 'pointer'
    container.on('pointerdown', () => this.selectCharacter(id, bg))

    return { config, container }
  }

  // 选择角色
  private selectCharacter(id: string, bg: Graphics): void {
    // 取消之前的选择
    if (this.selectedCharacterId) {
      const prevItem = this.characterItems.find(item => {
        const config = item.config as CharacterConfig
        return config.id === this.selectedCharacterId
      })
      if (prevItem) {
        const prevBg = prevItem.container.getChildAt(0) as Graphics
        prevBg.clear()
        prevBg.roundRect(0, 0, 180, 140, 10)
        prevBg.fill(Colors.CARD_BG)
        prevBg.stroke({ color: Colors.TEXT_SECONDARY, width: 2 })
      }
    }

    // 高亮选中
    this.selectedCharacterId = id
    bg.clear()
    bg.roundRect(0, 0, 180, 140, 10)
    bg.fill({ color: Colors.CARD_HOVER })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 3 })

    // 显示详情
    this.showCharacterDetail(id)

    // 启用开始按钮
    if (this.startButton) {
      this.startButton.setDisabled(false)
    }

    if (this.onCharacterSelected) {
      this.onCharacterSelected(id)
    }
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

    // 计算面板高度：基础高度 + 武功数量 * 行高
    const lineHeight = 22
    const baseHeight = 40
    let totalLines = 0
    martialArtsList.forEach(art => {
      totalLines++ // 武功名称
      if (art.passive) totalLines++ // 内功效果
    })
    const panelHeight = baseHeight + totalLines * lineHeight + 20

    // 详情面板放在角色网格下方，按钮上方
    this.detailPanel = this.renderer.createContainer(size.width / 2 - 250, size.height - 280)

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, 500, panelHeight, 10)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.9 })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    this.detailPanel.addChild(bg)

    // 标题
    const title = new Text({
      text: `${config.name} - 武功详情`,
      style: TextStyles.CHARACTER_NAME
    })
    title.x = 15
    title.y = 10
    this.detailPanel.addChild(title)

    // 武功列表
    let yPos = 40
    for (const art of martialArtsList) {
      const artText = new Text({
        text: `【${art.name}】`,
        style: { fontSize: 13, fill: Colors.TEXT_GOLD }
      })
      artText.x = 15
      artText.y = yPos
      this.detailPanel.addChild(artText)

      const descText = new Text({
        text: art.description,
        style: { fontSize: 11, fill: Colors.TEXT_SECONDARY }
      })
      descText.x = 120
      descText.y = yPos
      this.detailPanel.addChild(descText)

      yPos += lineHeight

      // 显示内功效果
      if (art.passive) {
        const passiveIcon = new Text({
          text: '◈',
          style: { fontSize: 11, fill: Colors.MP_BAR }
        })
        passiveIcon.x = 25
        passiveIcon.y = yPos
        this.detailPanel.addChild(passiveIcon)

        const passiveName = new Text({
          text: art.passive.name,
          style: { fontSize: 11, fill: Colors.MP_BAR }
        })
        passiveName.x = 40
        passiveName.y = yPos
        this.detailPanel.addChild(passiveName)

        const passiveDesc = new Text({
          text: art.passive.description,
          style: { fontSize: 10, fill: Colors.TEXT_SECONDARY }
        })
        passiveDesc.x = 120
        passiveDesc.y = yPos
        this.detailPanel.addChild(passiveDesc)

        yPos += lineHeight
      }
    }

    this.addChild(this.detailPanel)
  }

  // 创建开始按钮
  private createStartButton(): void {
    const size = this.renderer.getSize()

    this.startButton = new Button('开始战斗', 150, 50, this.renderer)
    this.startButton.x = size.width / 2 - 75
    this.startButton.y = size.height - 100
    this.startButton.setDisabled(true)
    this.startButton.setOnClick(() => {
      if (this.selectedCharacterId && this.onGameStart) {
        this.onGameStart(this.selectedCharacterId)
      }
    })

    this.addChild(this.startButton)
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
}