import { Container, Graphics, Text, Sprite, Assets } from 'pixi.js'
import { CharacterState } from '../game/types'
import { Colors, TextStyles, Renderer } from './Renderer'

// 角色面板尺寸 - 放大立绘，优化布局
// 图片比例 2730:1535 ≈ 1.78:1
const PORTRAIT_WIDTH = 220
const PORTRAIT_HEIGHT = Math.round(PORTRAIT_WIDTH / 1.78)  // 约124
const INFO_WIDTH = 160
const PANEL_WIDTH = Math.max(PORTRAIT_WIDTH, INFO_WIDTH)  // 220
const BASE_PANEL_HEIGHT = PORTRAIT_HEIGHT + 80  // 立绘高度 + 状态条区域
const BAR_WIDTH = 150
const BAR_HEIGHT = 16
const PASSIVE_LINE_HEIGHT = 18  // 每个内功行高

// 角色渲染器 - 新布局：立绘在上，信息在下
export class CharacterRenderer extends Container {
  private isEnemy: boolean

  private background: Graphics
  private portrait: Sprite | null = null
  private nameText: Text
  private titleText: Text

  private hpBar: Graphics
  private hpText: Text
  private mpBar: Graphics
  private mpText: Text
  private shieldText: Text
  private agilityText: Text
  private martialArtsText: Text

  // 内功相关
  private passiveContainer: Container
  private currentPanelHeight: number = BASE_PANEL_HEIGHT

  constructor(character: CharacterState, isEnemy: boolean, renderer: Renderer) {
    super()

    this.isEnemy = isEnemy

    // 背景
    this.background = renderer.createGraphics()
    this.addChild(this.background)

    // 角色立绘 - 上方
    this.loadPortrait(character.name)

    // 角色名称 - 立绘下方
    this.nameText = renderer.createText(character.name, TextStyles.CHARACTER_NAME, 0, PORTRAIT_HEIGHT + 5)
    this.nameText.x = (PANEL_WIDTH - this.nameText.width) / 2
    this.addChild(this.nameText)

    // 角色称号
    this.titleText = renderer.createText(character.title, TextStyles.CHARACTER_TITLE, 0, PORTRAIT_HEIGHT + 28)
    this.addChild(this.titleText)

    // HP 条
    this.hpBar = renderer.createGraphics()
    this.hpBar.y = PORTRAIT_HEIGHT + 45
    this.addChild(this.hpBar)

    // HP 标签
    this.hpText = new Text({
      text: '',
      style: { fontSize: 11, fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
    })
    this.hpBar.addChild(this.hpText)

    // MP 条
    this.mpBar = renderer.createGraphics()
    this.mpBar.y = PORTRAIT_HEIGHT + 65
    this.addChild(this.mpBar)

    // MP 标签
    this.mpText = new Text({
      text: '',
      style: { fontSize: 11, fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
    })
    this.mpBar.addChild(this.mpText)

    // 护盾和轻功 - 同一行显示
    this.shieldText = renderer.createText('', TextStyles.STATS, 10, PORTRAIT_HEIGHT + 88)
    this.shieldText.style.fill = Colors.TEXT_GREEN
    this.shieldText.style.fontSize = 12
    this.addChild(this.shieldText)

    this.agilityText = renderer.createText('', TextStyles.STATS, 100, PORTRAIT_HEIGHT + 88)
    this.agilityText.style.fill = Colors.AGILITY_BAR
    this.agilityText.style.fontSize = 12
    this.addChild(this.agilityText)

    // 武功信息
    this.martialArtsText = renderer.createText('', TextStyles.SKILL_NAME, 10, PORTRAIT_HEIGHT + 105)
    this.martialArtsText.style.fontSize = 9
    this.addChild(this.martialArtsText)

    // 内功容器
    this.passiveContainer = new Container()
    this.passiveContainer.x = 10
    this.passiveContainer.y = PORTRAIT_HEIGHT + 120
    this.addChild(this.passiveContainer)

    // 初始绘制
    this.update(character)
  }

  // 加载角色立绘
  private async loadPortrait(name: string): Promise<void> {
    try {
      const texture = await Assets.load(`/assets/characters/${name}.png`)
      this.portrait = new Sprite(texture)
      this.portrait.x = (PANEL_WIDTH - PORTRAIT_WIDTH) / 2  // 居中
      this.portrait.y = 5  // 顶部留小边距
      this.portrait.width = PORTRAIT_WIDTH
      this.portrait.height = PORTRAIT_HEIGHT
      this.addChildAt(this.portrait, 1)
    } catch (error) {
      console.warn(`无法加载角色立绘: ${name}`, error)
    }
  }

  // 绘制背景
  private drawBackground(height: number): void {
    this.currentPanelHeight = height
    this.background.clear()
    this.background.roundRect(0, 0, PANEL_WIDTH, height, 10)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.9 })
    this.background.stroke({ color: this.isEnemy ? Colors.TEXT_RED : Colors.TEXT_BLUE, width: 2 })
  }

  // 更新角色状态
  update(character: CharacterState): void {
    const barX = (PANEL_WIDTH - BAR_WIDTH) / 2  // 条形图居中

    // 更新 HP 条
    const hpPercent = character.hp / character.maxHp
    this.hpBar.clear()
    this.hpBar.rect(barX, 0, BAR_WIDTH, BAR_HEIGHT)
    this.hpBar.fill(0x333333)
    if (hpPercent > 0) {
      this.hpBar.rect(barX, 0, BAR_WIDTH * hpPercent, BAR_HEIGHT)
      this.hpBar.fill(Colors.HP_BAR)
    }
    this.hpBar.stroke({ color: 0x555555, width: 1 })

    this.hpText.text = `HP ${character.hp}/${character.maxHp}`
    this.hpText.x = barX + 5
    this.hpText.y = 1

    // 更新 MP 条
    const mpPercent = character.mp / character.maxMp
    this.mpBar.clear()
    this.mpBar.rect(barX, 0, BAR_WIDTH, BAR_HEIGHT)
    this.mpBar.fill(0x333333)
    if (mpPercent > 0) {
      this.mpBar.rect(barX, 0, BAR_WIDTH * mpPercent, BAR_HEIGHT)
      this.mpBar.fill(Colors.MP_BAR)
    }
    this.mpBar.stroke({ color: 0x555555, width: 1 })

    this.mpText.text = `MP ${character.mp}/${character.maxMp}`
    this.mpText.x = barX + 5
    this.mpText.y = 1

    // 更新称号位置（居中）
    this.titleText.x = (PANEL_WIDTH - this.titleText.width) / 2

    // 更新护盾和轻功
    this.shieldText.text = character.shield > 0 ? `护盾:${character.shield}` : ''
    this.agilityText.text = `轻功:${character.agility}`

    // 更新武功信息
    if (character.martialArtsNames && character.martialArtsNames.length > 0) {
      this.martialArtsText.text = `武功: ${character.martialArtsNames.join(', ')}`
    }

    // 更新内功
    this.updatePassives(character)
  }

  // 更新内功显示
  private updatePassives(character: CharacterState): void {
    this.passiveContainer.removeChildren()

    const passives = character.passives || []

    let yPos = 0
    for (const passive of passives) {
      // 内功名称
      const nameText = new Text({
        text: `◈ ${passive.name}: ${passive.description}`,
        style: { fontSize: 9, fill: Colors.MP_BAR, wordWrap: true, wordWrapWidth: PANEL_WIDTH - 20 }
      })
      nameText.x = 0
      nameText.y = yPos
      this.passiveContainer.addChild(nameText)

      yPos += PASSIVE_LINE_HEIGHT
    }

    // 面板高度 = 立绘高度 + 状态区 + 内功区域
    const passivesHeight = passives.length * PASSIVE_LINE_HEIGHT
    const panelHeight = BASE_PANEL_HEIGHT + passivesHeight
    this.drawBackground(panelHeight)
  }

  // 获取面板尺寸
  getSize(): { width: number; height: number } {
    return { width: PANEL_WIDTH, height: this.currentPanelHeight }
  }
}