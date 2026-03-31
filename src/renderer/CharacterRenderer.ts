import { Container, Graphics, Text, Sprite, Assets } from 'pixi.js'
import { CharacterState } from '../game/types'
import { Colors, TextStyles, Renderer } from './Renderer'
import { LayoutConstants } from './LayoutConstants'

// 角色渲染器 - 使用响应式尺寸
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
  private currentPanelHeight: number

  constructor(character: CharacterState, isEnemy: boolean, renderer: Renderer) {
    super()

    this.isEnemy = isEnemy

    const portraitHeight = LayoutConstants.portraitHeight()
    const panelWidth = LayoutConstants.panelWidth()
    const barHeight = LayoutConstants.barHeight()

    // 初始化面板高度
    this.currentPanelHeight = portraitHeight + 100

    // 背景
    this.background = renderer.createGraphics()
    this.addChild(this.background)

    // 角色立绘 - 上方
    this.loadPortrait(character.name)

    // 角色名称 - 立绘下方
    this.nameText = renderer.createText(character.name, TextStyles.CHARACTER_NAME, 0, portraitHeight + 5)
    this.addChild(this.nameText)

    // 角色称号
    this.titleText = renderer.createText(character.title, TextStyles.CHARACTER_TITLE, 0, portraitHeight + 32)
    this.addChild(this.titleText)

    // HP 条
    this.hpBar = renderer.createGraphics()
    this.hpBar.y = portraitHeight + 55
    this.addChild(this.hpBar)

    // HP 标签
    this.hpText = new Text({
      text: '',
      style: { fontSize: LayoutConstants.fontStats(), fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
    })
    this.hpBar.addChild(this.hpText)

    // MP 条
    this.mpBar = renderer.createGraphics()
    this.mpBar.y = portraitHeight + 55 + barHeight + 5
    this.addChild(this.mpBar)

    // MP 标签
    this.mpText = new Text({
      text: '',
      style: { fontSize: LayoutConstants.fontStats(), fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
    })
    this.mpBar.addChild(this.mpText)

    // 护盾和轻功 - 同一行显示
    this.shieldText = renderer.createText('', TextStyles.STATS, 10, portraitHeight + 55 + (barHeight + 5) * 2 + 8)
    this.shieldText.style.fill = Colors.TEXT_GREEN
    this.addChild(this.shieldText)

    this.agilityText = renderer.createText('', TextStyles.STATS, panelWidth / 2 + 10, portraitHeight + 55 + (barHeight + 5) * 2 + 8)
    this.agilityText.style.fill = Colors.AGILITY_BAR
    this.addChild(this.agilityText)

    // 武功信息
    this.martialArtsText = renderer.createText('', TextStyles.SKILL_NAME, 10, portraitHeight + 55 + (barHeight + 5) * 2 + 30)
    this.addChild(this.martialArtsText)

    // 内功容器
    this.passiveContainer = new Container()
    this.passiveContainer.x = 10
    this.passiveContainer.y = portraitHeight + 55 + (barHeight + 5) * 2 + 50
    this.addChild(this.passiveContainer)

    // 初始绘制
    this.update(character)
  }

  // 加载角色立绘
  private async loadPortrait(name: string): Promise<void> {
    try {
      const texture = await Assets.load(`/assets/characters/${name}.png`)
      this.portrait = new Sprite(texture)
      const portraitWidth = LayoutConstants.portraitWidth()
      const portraitHeight = LayoutConstants.portraitHeight()
      const panelWidth = LayoutConstants.panelWidth()
      this.portrait.x = (panelWidth - portraitWidth) / 2  // 居中
      this.portrait.y = 5  // 顶部留小边距
      this.portrait.width = portraitWidth
      this.portrait.height = portraitHeight
      this.addChildAt(this.portrait, 1)
    } catch (error) {
      console.warn(`无法加载角色立绘: ${name}`, error)
    }
  }

  // 绘制背景
  private drawBackground(height: number): void {
    this.currentPanelHeight = height
    const panelWidth = LayoutConstants.panelWidth()
    this.background.clear()
    this.background.roundRect(0, 0, panelWidth, height, 12)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.9 })
    this.background.stroke({ color: this.isEnemy ? Colors.TEXT_RED : Colors.TEXT_BLUE, width: 3 })
  }

  // 更新角色状态
  update(character: CharacterState): void {
    const panelWidth = LayoutConstants.panelWidth()
    const barWidth = LayoutConstants.barWidth()
    const barHeight = LayoutConstants.barHeight()
    const barX = (panelWidth - barWidth) / 2  // 条形图居中

    // 更新 HP 条
    const hpPercent = character.hp / character.maxHp
    this.hpBar.clear()
    this.hpBar.rect(barX, 0, barWidth, barHeight)
    this.hpBar.fill(0x333333)
    if (hpPercent > 0) {
      this.hpBar.rect(barX, 0, barWidth * hpPercent, barHeight)
      this.hpBar.fill(Colors.HP_BAR)
    }
    this.hpBar.stroke({ color: 0x555555, width: 1 })

    this.hpText.text = `HP ${character.hp}/${character.maxHp}`
    this.hpText.x = barX + 8
    this.hpText.y = 2

    // 更新 MP 条
    const mpPercent = character.mp / character.maxMp
    this.mpBar.clear()
    this.mpBar.rect(barX, 0, barWidth, barHeight)
    this.mpBar.fill(0x333333)
    if (mpPercent > 0) {
      this.mpBar.rect(barX, 0, barWidth * mpPercent, barHeight)
      this.mpBar.fill(Colors.MP_BAR)
    }
    this.mpBar.stroke({ color: 0x555555, width: 1 })

    this.mpText.text = `MP ${character.mp}/${character.maxMp}`
    this.mpText.x = barX + 8
    this.mpText.y = 2

    // 更新名称位置（居中）
    this.nameText.x = (panelWidth - this.nameText.width) / 2

    // 更新称号位置（居中）
    this.titleText.x = (panelWidth - this.titleText.width) / 2

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
    const panelWidth = LayoutConstants.panelWidth()

    const passiveLineHeight = LayoutConstants.scaleValue(22)
    let yPos = 0
    for (const passive of passives) {
      // 内功名称
      const nameText = new Text({
        text: `◈ ${passive.name}: ${passive.description}`,
        style: {
          fontSize: LayoutConstants.fontCharacterTitle(),
          fill: Colors.MP_BAR,
          wordWrap: true,
          wordWrapWidth: panelWidth - 20
        }
      })
      nameText.x = 0
      nameText.y = yPos
      this.passiveContainer.addChild(nameText)

      yPos += passiveLineHeight
    }

    // 面板高度 = 立绘高度 + 状态区 + 内功区域
    const passivesHeight = passives.length * passiveLineHeight
    const portraitHeight = LayoutConstants.portraitHeight()
    const baseHeight = portraitHeight + 55 + (LayoutConstants.barHeight() + 5) * 2 + 50
    const panelHeight = baseHeight + passivesHeight + 10
    this.drawBackground(panelHeight)
  }

  // 获取面板尺寸
  getSize(): { width: number; height: number } {
    return { width: LayoutConstants.panelWidth(), height: this.currentPanelHeight }
  }

  // 公开方法：获取HP条用于特效
  getHpBar(): Graphics {
    return this.hpBar
  }

  // 公开方法：获取护盾显示文本用于特效
  getShieldText(): Text {
    return this.shieldText
  }

  // 公开方法：面板震动
  shake(intensity: number = 10, duration: number = 300): Promise<void> {
    return new Promise(resolve => {
      const originalX = this.x
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = elapsed / duration

        if (progress < 1) {
          this.x = originalX + Math.sin(progress * Math.PI * 8) * intensity * (1 - progress)
          requestAnimationFrame(animate)
        } else {
          this.x = originalX
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  // 公开方法：HP条闪烁
  flashHpBar(color: number = Colors.HP_BAR, flashCount: number = 3, interval: number = 100): Promise<void> {
    return new Promise(resolve => {
      let flash = true
      let count = 0

      const flashInterval = setInterval(() => {
        flash = !flash
        if (flash) {
          this.hpBar.clear()
          this.hpBar.rect(0, 0, LayoutConstants.barWidth(), LayoutConstants.barHeight())
          this.hpBar.fill(color)
        } else {
          this.updateCharacterState()
        }

        count++
        if (count >= flashCount * 2) {
          clearInterval(flashInterval)
          this.updateCharacterState()
          resolve()
        }
      }, interval)
    })
  }

  // 私有辅助方法：重新更新角色状态以恢复HP条颜色
  private updateCharacterState(): void {
    // 这个方法将在 updateCharacterState 方法中实现
  }
}
