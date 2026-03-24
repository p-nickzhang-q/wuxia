import { Container, Graphics, Text, Sprite, Assets } from 'pixi.js'
import { CharacterState } from '../game/types'
import { Colors, TextStyles, Renderer } from './Renderer'

// 角色面板尺寸 - 根据立绘比例设计
// 图片比例 2730:1535 ≈ 1.78:1
const PORTRAIT_WIDTH = 180
const PORTRAIT_HEIGHT = Math.round(PORTRAIT_WIDTH / 1.78)  // 约101
const INFO_WIDTH = 200
const PANEL_WIDTH = PORTRAIT_WIDTH + INFO_WIDTH  // 380
const BASE_PANEL_HEIGHT = PORTRAIT_HEIGHT + 20  // 立绘高度 + 边距
const BAR_WIDTH = 180
const BAR_HEIGHT = 12
const BAR_X = PORTRAIT_WIDTH + 10  // 条形图X偏移
const PASSIVE_LINE_HEIGHT = 20  // 每个内功行高

// 角色渲染器
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

    // 角色立绘
    this.loadPortrait(character.name)

    // 角色名称 - 立绘上方
    this.nameText = renderer.createText(character.name, TextStyles.CHARACTER_NAME, 5, 5)
    this.addChild(this.nameText)

    // 角色称号 - 立绘上方
    this.titleText = renderer.createText(character.title, TextStyles.CHARACTER_TITLE, 5, 25)
    this.addChild(this.titleText)

    // HP 条 - 右侧信息区
    this.hpBar = renderer.createGraphics()
    this.hpBar.y = 10
    this.addChild(this.hpBar)

    // HP 标签
    this.hpText = new Text({
      text: '',
      style: { fontSize: 10, fill: Colors.TEXT_PRIMARY }
    })
    this.hpBar.addChild(this.hpText)

    // MP 条
    this.mpBar = renderer.createGraphics()
    this.mpBar.y = 28
    this.addChild(this.mpBar)

    // MP 标签
    this.mpText = new Text({
      text: '',
      style: { fontSize: 10, fill: Colors.TEXT_PRIMARY }
    })
    this.mpBar.addChild(this.mpText)

    // 护盾和轻功
    this.shieldText = renderer.createText('', TextStyles.STATS, BAR_X, 48)
    this.shieldText.style.fill = Colors.TEXT_GREEN
    this.addChild(this.shieldText)

    this.agilityText = renderer.createText('', TextStyles.STATS, BAR_X + 90, 48)
    this.agilityText.style.fill = Colors.AGILITY_BAR
    this.addChild(this.agilityText)

    // 武功信息
    this.martialArtsText = renderer.createText('', TextStyles.SKILL_NAME, BAR_X, 70)
    this.martialArtsText.style.fontSize = 9
    this.addChild(this.martialArtsText)

    // 内功容器
    this.passiveContainer = new Container()
    this.passiveContainer.x = BAR_X
    this.passiveContainer.y = 88
    this.addChild(this.passiveContainer)

    // 初始绘制
    this.update(character)
  }

  // 加载角色立绘
  private async loadPortrait(name: string): Promise<void> {
    try {
      const texture = await Assets.load(`/assets/characters/${name}.png`)
      this.portrait = new Sprite(texture)
      this.portrait.x = 0
      this.portrait.y = 45  // 放在名字下方
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
    // 更新 HP 条
    const hpPercent = character.hp / character.maxHp
    this.hpBar.clear()
    this.hpBar.rect(BAR_X, 0, BAR_WIDTH, BAR_HEIGHT)
    this.hpBar.fill(0x333333)
    if (hpPercent > 0) {
      this.hpBar.rect(BAR_X, 0, BAR_WIDTH * hpPercent, BAR_HEIGHT)
      this.hpBar.fill(Colors.HP_BAR)
    }
    this.hpBar.stroke({ color: 0x555555, width: 1 })

    this.hpText.text = `HP: ${character.hp}/${character.maxHp}`
    this.hpText.x = BAR_X + 3
    this.hpText.y = 0

    // 更新 MP 条
    const mpPercent = character.mp / character.maxMp
    this.mpBar.clear()
    this.mpBar.rect(BAR_X, 0, BAR_WIDTH, BAR_HEIGHT)
    this.mpBar.fill(0x333333)
    if (mpPercent > 0) {
      this.mpBar.rect(BAR_X, 0, BAR_WIDTH * mpPercent, BAR_HEIGHT)
      this.mpBar.fill(Colors.MP_BAR)
    }
    this.mpBar.stroke({ color: 0x555555, width: 1 })

    this.mpText.text = `MP: ${character.mp}/${character.maxMp}`
    this.mpText.x = BAR_X + 3
    this.mpText.y = 0

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
        style: { fontSize: 9, fill: Colors.MP_BAR, wordWrap: true, wordWrapWidth: INFO_WIDTH - 15 }
      })
      nameText.x = 0
      nameText.y = yPos
      this.passiveContainer.addChild(nameText)

      yPos += PASSIVE_LINE_HEIGHT
    }

    // 面板高度 = 立绘高度 + 上边距 + 内功区域
    const passivesHeight = passives.length * PASSIVE_LINE_HEIGHT
    const panelHeight = Math.max(BASE_PANEL_HEIGHT, 45 + PORTRAIT_HEIGHT + 10 + passivesHeight)
    this.drawBackground(panelHeight)
  }

  // 获取面板尺寸
  getSize(): { width: number; height: number } {
    return { width: PANEL_WIDTH, height: this.currentPanelHeight }
  }
}