import { Container, Graphics, Text, Sprite, Assets } from 'pixi.js'
import { CharacterState } from '../game/types'
import { Colors, TextStyles, Renderer } from './Renderer'

// 角色面板尺寸
const PANEL_WIDTH = 320
const BASE_PANEL_HEIGHT = 155  // 基础高度（无内功时）
const BAR_WIDTH = 170
const BAR_HEIGHT = 12
const BAR_X = 130  // 条形图X偏移（给立绘留空间）
const PASSIVE_LINE_HEIGHT = 22  // 每个内功行高
const PORTRAIT_SIZE = 120  // 立绘尺寸

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

  // 内功相关 - 使用容器动态管理
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

    // 角色名称
    this.nameText = renderer.createText(character.name, TextStyles.CHARACTER_NAME, BAR_X, 8)
    this.addChild(this.nameText)

    // 角色称号
    this.titleText = renderer.createText(character.title, TextStyles.CHARACTER_TITLE, BAR_X, 28)
    this.addChild(this.titleText)

    // HP 条
    this.hpBar = renderer.createGraphics()
    this.hpBar.y = 50
    this.addChild(this.hpBar)

    // HP 标签
    this.hpText = new Text({
      text: '',
      style: { fontSize: 10, fill: Colors.TEXT_PRIMARY }
    })
    this.hpBar.addChild(this.hpText)

    // MP 条
    this.mpBar = renderer.createGraphics()
    this.mpBar.y = 70
    this.addChild(this.mpBar)

    // MP 标签
    this.mpText = new Text({
      text: '',
      style: { fontSize: 10, fill: Colors.TEXT_PRIMARY }
    })
    this.mpBar.addChild(this.mpText)

    // 护盾显示
    this.shieldText = renderer.createText('', TextStyles.STATS, BAR_X, 95)
    this.shieldText.style.fill = Colors.TEXT_GREEN
    this.addChild(this.shieldText)

    // 轻功显示
    this.agilityText = renderer.createText('', TextStyles.STATS, BAR_X + 80, 95)
    this.agilityText.style.fill = Colors.AGILITY_BAR
    this.addChild(this.agilityText)

    // 武功信息
    this.martialArtsText = renderer.createText('', TextStyles.SKILL_NAME, BAR_X, 115)
    this.martialArtsText.style.fontSize = 10
    this.addChild(this.martialArtsText)

    // 内功容器
    this.passiveContainer = new Container()
    this.passiveContainer.x = BAR_X
    this.passiveContainer.y = 135
    this.addChild(this.passiveContainer)

    // 初始绘制
    this.update(character)
  }

  // 加载角色立绘
  private async loadPortrait(name: string): Promise<void> {
    try {
      const texture = await Assets.load(`/assets/characters/${name}.png`)
      this.portrait = new Sprite(texture)
      this.portrait.x = 5
      this.portrait.y = 5
      this.portrait.width = PORTRAIT_SIZE
      this.portrait.height = PORTRAIT_SIZE
      this.addChildAt(this.portrait, 1)  // 插入到背景之后
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

    // 更新 HP 文字
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

    // 更新 MP 文字
    this.mpText.text = `MP: ${character.mp}/${character.maxMp}`
    this.mpText.x = BAR_X + 3
    this.mpText.y = 0

    // 更新护盾
    this.shieldText.text = character.shield > 0 ? `护盾: ${character.shield}` : ''

    // 更新轻功
    this.agilityText.text = `轻功: ${character.agility}`

    // 更新武功信息
    if (character.martialArtsNames && character.martialArtsNames.length > 0) {
      this.martialArtsText.text = `武功: ${character.martialArtsNames.join(', ')}`
    }

    // 更新内功信息 - 显示名称和效果
    this.updatePassives(character)
  }

  // 更新内功显示
  private updatePassives(character: CharacterState): void {
    // 清除旧的内功显示
    this.passiveContainer.removeChildren()

    const passives = character.passives || []
    if (passives.length === 0) {
      this.drawBackground(BASE_PANEL_HEIGHT)
      return
    }

    let yPos = 0
    for (const passive of passives) {
      // 内功名称
      const nameText = new Text({
        text: `◈ ${passive.name}`,
        style: { fontSize: 10, fill: Colors.MP_BAR }
      })
      nameText.x = 0
      nameText.y = yPos
      this.passiveContainer.addChild(nameText)

      // 内功效果描述
      const descText = new Text({
        text: passive.description,
        style: { fontSize: 9, fill: Colors.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: 170 }
      })
      descText.x = 20
      descText.y = yPos + 12
      this.passiveContainer.addChild(descText)

      yPos += PASSIVE_LINE_HEIGHT + 12
    }

    // 根据内功数量调整面板高度
    const panelHeight = BASE_PANEL_HEIGHT + passives.length * (PASSIVE_LINE_HEIGHT + 12)
    this.drawBackground(panelHeight)
  }

  // 获取面板尺寸
  getSize(): { width: number; height: number } {
    return { width: PANEL_WIDTH, height: this.currentPanelHeight }
  }
}