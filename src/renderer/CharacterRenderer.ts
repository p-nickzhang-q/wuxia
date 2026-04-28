import { Container, Graphics, Text, Sprite, Assets, TextStyle } from 'pixi.js'
import { CharacterState } from '../game/types'
import { Colors, TextStyles, Renderer } from './Renderer'
import { LayoutConstants } from './LayoutConstants'

// 角色渲染器 - 使用响应式尺寸
export class CharacterRenderer extends Container {
  private isEnemy: boolean
  private isSmall: boolean
  private renderer: Renderer  // 保存renderer引用

  // 目标选择状态
  private isTargetable: boolean = false
  private isTargeted: boolean = false

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
  private passiveTexts: Map<string, Text> = new Map() // 存储内功文字引用，key 是 passive.id
  private currentPanelHeight: number

  // HP/MP 动画状态
  private animatedHp: number = 0
  private animatedMp: number = 0
  private targetHp: number = 0
  private targetMp: number = 0
  private hpMpAnimating: boolean = false
  private maxHp: number = 0
  private maxMp: number = 0

  // 尺寸缓存
  private _panelWidth: number
  private _portraitHeight: number
  private _barHeight: number
  private _barWidth: number

  // 详情浮层
  private detailPopup: Container | null = null
  private characterData: CharacterState | null = null

  constructor(character: CharacterState, isEnemy: boolean, renderer: Renderer, isSmall: boolean = false) {
    super()

    this.isEnemy = isEnemy
    this.isSmall = isSmall
    this.renderer = renderer  // 保存renderer引用
    this.characterData = character  // 保存角色数据

    // 根据大小选择尺寸
    this._panelWidth = isSmall ? LayoutConstants.smallPanelWidth() : LayoutConstants.panelWidth()
    this._portraitHeight = isSmall ? LayoutConstants.smallPortraitHeight() : LayoutConstants.portraitHeight()
    this._barHeight = LayoutConstants.barHeight()
    this._barWidth = isSmall ? LayoutConstants.smallBarWidth() : LayoutConstants.barWidth()

    // 初始化面板高度
    this.currentPanelHeight = this._portraitHeight + (isSmall ? 70 : 100)

    // 背景
    this.background = renderer.createGraphics()
    this.addChild(this.background)

    // 角色立绘 - 上方
    this.loadPortrait(character.name)

    // 角色名称 - 立绘下方
    const nameFontSize = isSmall ? LayoutConstants.fontCardName() : LayoutConstants.fontCharacterName()
    this.nameText = renderer.createText(character.name, new TextStyle({ fontSize: nameFontSize, fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }), 0, this._portraitHeight + 3)
    this.addChild(this.nameText)

    // 角色称号
    const titleFontSize = isSmall ? LayoutConstants.fontCardType() : LayoutConstants.fontCharacterTitle()
    this.titleText = renderer.createText(character.title, new TextStyle({ fontSize: titleFontSize, fill: Colors.TEXT_SECONDARY }), 0, this._portraitHeight + (isSmall ? 20 : 32))
    this.addChild(this.titleText)

    // HP 条
    this.hpBar = renderer.createGraphics()
    this.hpBar.y = this._portraitHeight + (isSmall ? 35 : 55)
    this.addChild(this.hpBar)

    // HP 标签
    const statsFontSize = isSmall ? LayoutConstants.fontCardType() : LayoutConstants.fontStats()
    this.hpText = new Text({
      text: '',
      style: { fontSize: statsFontSize, fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
    })
    this.hpBar.addChild(this.hpText)

    // MP 条
    this.mpBar = renderer.createGraphics()
    this.mpBar.y = this._portraitHeight + (isSmall ? 35 : 55) + this._barHeight + 3
    this.addChild(this.mpBar)

    // MP 标签
    this.mpText = new Text({
      text: '',
      style: { fontSize: statsFontSize, fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
    })
    this.mpBar.addChild(this.mpText)

    // 护盾和轻功 - 同一行显示
    const infoY = this._portraitHeight + (isSmall ? 35 : 55) + (this._barHeight + 3) * 2 + 5
    this.shieldText = renderer.createText('', new TextStyle({ fontSize: statsFontSize, fill: Colors.TEXT_GREEN }), 8, infoY)
    this.addChild(this.shieldText)

    this.agilityText = renderer.createText('', new TextStyle({ fontSize: statsFontSize, fill: Colors.AGILITY_BAR }), this._panelWidth / 2 + 8, infoY)
    this.addChild(this.agilityText)

    // 武功信息（小模式不显示）
    if (!isSmall) {
      this.martialArtsText = renderer.createText('', TextStyles.SKILL_NAME, 10, this._portraitHeight + 55 + (this._barHeight + 5) * 2 + 30)
      this.addChild(this.martialArtsText)
    } else {
      this.martialArtsText = new Text({ text: '' })
    }

    // 内功容器
    this.passiveContainer = new Container()
    this.passiveContainer.x = 8
    this.passiveContainer.y = this._portraitHeight + (isSmall ? 55 : 55) + (this._barHeight + 5) * 2 + (isSmall ? 10 : 50)
    this.addChild(this.passiveContainer)

    // 初始绘制
    // 初始化动画值
    this.animatedHp = character.hp
    this.animatedMp = character.mp
    this.targetHp = character.hp
    this.targetMp = character.mp
    this.maxHp = character.maxHp
    this.maxMp = character.maxMp
    this.drawHpMpBars(character)
    this.updatePassives(character)

    // 小模式下添加查看详情按钮
    if (isSmall) {
      this.createInfoButton(renderer)
    }
  }

  // 创建信息按钮（小模式专用）
  private createInfoButton(renderer: Renderer): void {
    const btnSize = LayoutConstants.scaleValue(20)
    const infoBtn = renderer.createGraphics()
    infoBtn.circle(this._panelWidth - btnSize - 5, 5, btnSize / 2)
    infoBtn.fill({ color: Colors.TEXT_GOLD, alpha: 0.8 })
    infoBtn.stroke({ color: Colors.TEXT_PRIMARY, width: 1 })

    // 信息图标 "i"
    const infoIcon = new Text({
      text: 'i',
      style: {
        fontSize: LayoutConstants.scaleValue(14),
        fill: Colors.TEXT_PRIMARY,
        fontWeight: 'bold'
      }
    })
    infoIcon.anchor.set(0.5)
    infoIcon.x = this._panelWidth - btnSize - 5
    infoIcon.y = 5

    // 点击显示详情
    infoBtn.eventMode = 'static'
    infoBtn.cursor = 'pointer'
    infoBtn.on('pointerdown', (e) => {
      e.stopPropagation()
      this.toggleDetailPopup(renderer)
    })

    this.addChild(infoBtn)
    this.addChild(infoIcon)
  }

  // 切换详情浮层显示
  toggleDetailPopup(renderer: Renderer): void {
    if (this.detailPopup) {
      this.removeChild(this.detailPopup)
      this.detailPopup = null
      return
    }

    if (!this.characterData) return

    this.detailPopup = this.createDetailPopup(renderer, this.characterData)
    // 浮层显示在面板右侧
    this.detailPopup.x = this._panelWidth + 10
    this.detailPopup.y = 0
    this.addChild(this.detailPopup)
  }

  // 创建详情浮层
  private createDetailPopup(renderer: Renderer, character: CharacterState): Container {
    const popup = new Container()
    const popupWidth = LayoutConstants.scaleValue(280)
    const padding = LayoutConstants.scaleValue(10)
    const lineHeight = LayoutConstants.scaleValue(18)

    // 武功列表
    const skills = character.skills || []
    const passives = character.passives || []

    // 计算高度（每个武功/内功占2行：名称+描述）
    const totalLines = 1 + skills.length * 2 + (passives.length > 0 ? 1 + passives.length * 2 : 0)
    const popupHeight = padding * 2 + totalLines * lineHeight

    // 背景
    const bg = renderer.createGraphics()
    bg.roundRect(0, 0, popupWidth, popupHeight, 8)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    popup.addChild(bg)

    let y = padding

    // 武功标题
    const skillTitle = new Text({
      text: '【武功招式】',
      style: { fontSize: LayoutConstants.scaleValue(14), fill: Colors.TEXT_GOLD, fontWeight: 'bold' }
    })
    skillTitle.x = padding
    skillTitle.y = y
    popup.addChild(skillTitle)
    y += lineHeight + 2

    // 武功列表
    skills.forEach(skill => {
      // 名称行
      const nameText = new Text({
        text: `${skill.name} (${skill.mpCost}内力, 范围${skill.range})`,
        style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
      })
      nameText.x = padding + 5
      nameText.y = y
      popup.addChild(nameText)
      y += lineHeight

      // 描述行
      const descText = new Text({
        text: skill.description,
        style: { fontSize: LayoutConstants.scaleValue(11), fill: Colors.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: popupWidth - padding * 2 - 10 }
      })
      descText.x = padding + 10
      descText.y = y
      popup.addChild(descText)
      y += lineHeight + 2
    })

    // 内功标题
    if (passives.length > 0) {
      y += 5
      const passiveTitle = new Text({
        text: '【内功】',
        style: { fontSize: LayoutConstants.scaleValue(14), fill: Colors.MP_BAR, fontWeight: 'bold' }
      })
      passiveTitle.x = padding
      passiveTitle.y = y
      popup.addChild(passiveTitle)
      y += lineHeight + 2

      passives.forEach(passive => {
        // 名称行
        const nameText = new Text({
          text: passive.name,
          style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
        })
        nameText.x = padding + 5
        nameText.y = y
        popup.addChild(nameText)
        y += lineHeight

        // 描述行
        const descText = new Text({
          text: passive.description,
          style: { fontSize: LayoutConstants.scaleValue(11), fill: Colors.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: popupWidth - padding * 2 - 10 }
        })
        descText.x = padding + 10
        descText.y = y
        popup.addChild(descText)
        y += lineHeight + 2
      })
    }

    // 点击其他地方关闭
    bg.eventMode = 'static'
    bg.on('pointerdown', (e) => {
      e.stopPropagation()
    })

    return popup
  }

  // 关闭详情浮层
  hideDetailPopup(): void {
    if (this.detailPopup) {
      this.removeChild(this.detailPopup)
      this.detailPopup = null
    }
  }

  // 加载角色立绘
  private async loadPortrait(name: string): Promise<void> {
    try {
      const texture = await Assets.load(`/assets/characters/${name}.png`)
      this.portrait = new Sprite(texture)
      const portraitWidth = this.isSmall ? LayoutConstants.smallPortraitWidth() : LayoutConstants.portraitWidth()
      const portraitHeight = this._portraitHeight
      const panelWidth = this._panelWidth
      this.portrait.x = (panelWidth - portraitWidth) / 2  // 居中
      this.portrait.y = 3  // 顶部留小边距
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
    const panelWidth = this._panelWidth
    this.background.clear()
    this.background.roundRect(0, 0, panelWidth, height, this.isSmall ? 8 : 12)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.9 })

    // 根据目标状态设置边框
    let borderColor: number
    let borderWidth: number

    if (this.isTargeted) {
      borderColor = Colors.TEXT_GOLD
      borderWidth = this.isSmall ? 3 : 4
    } else if (this.isTargetable) {
      borderColor = 0x00ff88  // 绿色高亮表示可选
      borderWidth = this.isSmall ? 3 : 4
    } else {
      borderColor = this.isEnemy ? Colors.TEXT_RED : Colors.TEXT_BLUE
      borderWidth = this.isSmall ? 2 : 3
    }

    this.background.stroke({ color: borderColor, width: borderWidth })
  }

  // 更新角色状态 - 启动平滑动画
  update(character: CharacterState): void {
    // 更新角色数据
    this.characterData = character

    // 设置目标值
    this.targetHp = character.hp
    this.targetMp = character.mp

    // 如果值有变化，启动动画
    if (this.animatedHp !== this.targetHp || this.animatedMp !== this.targetMp) {
      if (!this.hpMpAnimating) {
        this.hpMpAnimating = true
        this.animateHpMp(character)
      }
    } else {
      // 值相同，直接绘制
      this.drawHpMpBars(character)
    }

    const panelWidth = this._panelWidth

    // 更新名称位置（居中）
    this.nameText.x = (panelWidth - this.nameText.width) / 2

    // 更新称号位置（居中）
    this.titleText.x = (panelWidth - this.titleText.width) / 2

    // 更新护盾和轻功
    this.shieldText.text = character.shield > 0 ? `护盾:${character.shield}` : ''
    this.agilityText.text = `轻功:${character.agility}`

    // 更新武功信息（小模式不显示）
    if (!this.isSmall && character.martialArtsNames && character.martialArtsNames.length > 0) {
      this.martialArtsText.text = `武功: ${character.martialArtsNames.join(', ')}`
    }

    // 更新内功
    this.updatePassives(character)
  }

  // HP/MP 平滑动画
  private animateHpMp(character: CharacterState): void {
    const animationSpeed = 0.15 // 动画速度系数

    // 计算新的动画值
    if (this.animatedHp !== this.targetHp) {
      const diff = this.targetHp - this.animatedHp
      this.animatedHp += diff * animationSpeed
      // 接近目标值时直接设置
      if (Math.abs(diff) < 1) {
        this.animatedHp = this.targetHp
      }
    }

    if (this.animatedMp !== this.targetMp) {
      const diff = this.targetMp - this.animatedMp
      this.animatedMp += diff * animationSpeed
      // 接近目标值时直接设置
      if (Math.abs(diff) < 1) {
        this.animatedMp = this.targetMp
      }
    }

    // 使用动画值绘制
    this.drawHpMpBarsWithValues(
      Math.round(this.animatedHp),
      Math.round(this.animatedMp),
      character.maxHp,
      character.maxMp
    )

    // 继续动画或结束
    if (this.animatedHp !== this.targetHp || this.animatedMp !== this.targetMp) {
      requestAnimationFrame(() => this.animateHpMp(character))
    } else {
      this.hpMpAnimating = false
    }
  }

  // 绘制 HP/MP 条（使用角色状态）
  private drawHpMpBars(character: CharacterState): void {
    this.drawHpMpBarsWithValues(character.hp, character.mp, character.maxHp, character.maxMp)
  }

  // 绘制 HP/MP 条（使用指定值）
  private drawHpMpBarsWithValues(hp: number, mp: number, maxHp: number, maxMp: number): void {
    const panelWidth = this._panelWidth
    const barWidth = this._barWidth
    const barHeight = this._barHeight
    const barX = (panelWidth - barWidth) / 2  // 条形图居中

    // 更新 HP 条
    const hpPercent = hp / maxHp
    this.hpBar.clear()
    this.hpBar.rect(barX, 0, barWidth, barHeight)
    this.hpBar.fill(0x333333)
    if (hpPercent > 0) {
      this.hpBar.rect(barX, 0, barWidth * hpPercent, barHeight)
      this.hpBar.fill(Colors.HP_BAR)
    }
    this.hpBar.stroke({ color: 0x555555, width: 1 })

    this.hpText.text = this.isSmall ? `${hp}` : `HP ${hp}/${maxHp}`
    this.hpText.x = barX + 4
    this.hpText.y = 2

    // 更新 MP 条
    const mpPercent = mp / maxMp
    this.mpBar.clear()
    this.mpBar.rect(barX, 0, barWidth, barHeight)
    this.mpBar.fill(0x333333)
    if (mpPercent > 0) {
      this.mpBar.rect(barX, 0, barWidth * mpPercent, barHeight)
      this.mpBar.fill(Colors.MP_BAR)
    }
    this.mpBar.stroke({ color: 0x555555, width: 1 })

    this.mpText.text = this.isSmall ? `${mp}` : `MP ${mp}/${maxMp}`
    this.mpText.x = barX + 4
    this.mpText.y = 2
  }

  // 更新内功显示 - 显示简称标签
  private updatePassives(character: CharacterState): void {
    const skills = character.skills || []
    const passives = character.passives || []

    // 清除旧内容
    this.passiveContainer.removeChildren()
    this.passiveTexts.clear()

    const tagHeight = LayoutConstants.scaleValue(this.isSmall ? 18 : 22)
    const tagGap = LayoutConstants.scaleValue(4)
    let yPos = 0

    // 武功标签
    if (skills.length > 0) {
      // 武功标题
      const skillLabel = new Text({
        text: '武功:',
        style: { fontSize: LayoutConstants.scaleValue(this.isSmall ? 11 : 13), fill: Colors.TEXT_SECONDARY }
      })
      skillLabel.x = 0
      skillLabel.y = yPos
      this.passiveContainer.addChild(skillLabel)

      // 武功简称标签
      let tagX = skillLabel.width + tagGap
      skills.forEach(skill => {
        const shortName = skill.shortName || skill.name.substring(0, 2)
        const tag = this.createSkillTag(shortName, skill)
        tag.x = tagX
        tag.y = yPos
        this.passiveContainer.addChild(tag)
        tagX += tag.width + tagGap
      })

      yPos += tagHeight + tagGap
    }

    // 内功标签
    if (passives.length > 0) {
      // 内功标题
      const passiveLabel = new Text({
        text: '内功:',
        style: { fontSize: LayoutConstants.scaleValue(this.isSmall ? 11 : 13), fill: Colors.TEXT_SECONDARY }
      })
      passiveLabel.x = 0
      passiveLabel.y = yPos
      this.passiveContainer.addChild(passiveLabel)

      // 内功简称标签
      let tagX = passiveLabel.width + tagGap
      passives.forEach(passive => {
        const shortName = passive.shortName || passive.name.substring(0, 2)
        const tag = this.createPassiveTag(shortName, passive)
        tag.x = tagX
        tag.y = yPos
        this.passiveContainer.addChild(tag)
        tagX += tag.width + tagGap
      })

      yPos += tagHeight + tagGap
    }

    // 计算面板高度
    const passivesHeight = yPos > 0 ? yPos : 0
    const portraitHeight = this._portraitHeight
    const baseHeight = portraitHeight + (this.isSmall ? 35 : 55) + (this._barHeight + 3) * 2 + (this.isSmall ? 10 : 30)
    const panelHeight = baseHeight + passivesHeight + 10
    this.drawBackground(panelHeight)
  }

  // 创建武功标签（可点击）
  private createSkillTag(shortName: string, skill: any): Container {
    const tag = new Container()
    const bg = this.renderer.createGraphics()
    const textWidth = LayoutConstants.scaleValue(shortName.length * 14 + 10)
    const textHeight = LayoutConstants.scaleValue(this.isSmall ? 16 : 20)

    bg.roundRect(0, 0, textWidth, textHeight, 4)
    bg.fill({ color: Colors.TEXT_GOLD, alpha: 0.2 })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 1 })
    tag.addChild(bg)

    const text = new Text({
      text: shortName,
      style: { fontSize: LayoutConstants.scaleValue(this.isSmall ? 11 : 13), fill: Colors.TEXT_GOLD, fontWeight: 'bold' }
    })
    text.x = (textWidth - text.width) / 2
    text.y = (textHeight - text.height) / 2
    tag.addChild(text)

    // 点击交互
    tag.eventMode = 'static'
    tag.cursor = 'pointer'
    tag.on('pointerdown', (e) => {
      e.stopPropagation()
      this.showSkillDetail(skill)
    })

    return tag
  }

  // 创建内功标签（可点击）
  private createPassiveTag(shortName: string, passive: any): Container {
    const tag = new Container()
    const bg = this.renderer.createGraphics()
    const textWidth = LayoutConstants.scaleValue(shortName.length * 14 + 10)
    const textHeight = LayoutConstants.scaleValue(this.isSmall ? 16 : 20)

    bg.roundRect(0, 0, textWidth, textHeight, 4)
    bg.fill({ color: Colors.MP_BAR, alpha: 0.2 })
    bg.stroke({ color: Colors.MP_BAR, width: 1 })
    tag.addChild(bg)

    const text = new Text({
      text: shortName,
      style: { fontSize: LayoutConstants.scaleValue(this.isSmall ? 11 : 13), fill: Colors.MP_BAR, fontWeight: 'bold' }
    })
    text.x = (textWidth - text.width) / 2
    text.y = (textHeight - text.height) / 2
    tag.addChild(text)

    // 点击交互
    tag.eventMode = 'static'
    tag.cursor = 'pointer'
    tag.on('pointerdown', (e) => {
      e.stopPropagation()
      this.showPassiveDetail(passive)
    })

    return tag
  }

  // 显示武功详情
  private showSkillDetail(skill: any): void {
    this.hideDetailPopup()

    const popup = new Container()
    const popupWidth = LayoutConstants.scaleValue(260)
    const padding = LayoutConstants.scaleValue(10)
    const lineHeight = LayoutConstants.scaleValue(18)

    // 计算高度
    const lines = 4 // 名称 + 内力消耗 + 范围 + 描述
    const popupHeight = padding * 2 + lines * lineHeight

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, popupWidth, popupHeight, 8)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    popup.addChild(bg)

    let y = padding

    // 名称
    const nameText = new Text({
      text: `【${skill.name}】`,
      style: { fontSize: LayoutConstants.scaleValue(14), fill: Colors.TEXT_GOLD, fontWeight: 'bold' }
    })
    nameText.x = padding
    nameText.y = y
    popup.addChild(nameText)
    y += lineHeight

    // 内力消耗
    const mpText = new Text({
      text: `内力消耗: ${skill.mpCost}  轻功消耗: ${skill.agilityCost}`,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY }
    })
    mpText.x = padding
    mpText.y = y
    popup.addChild(mpText)
    y += lineHeight

    // 攻击范围
    const rangeText = new Text({
      text: `攻击范围: ${skill.range}`,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY }
    })
    rangeText.x = padding
    rangeText.y = y
    popup.addChild(rangeText)
    y += lineHeight

    // 描述
    const descText = new Text({
      text: skill.description,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: popupWidth - padding * 2 }
    })
    descText.x = padding
    descText.y = y
    popup.addChild(descText)

    // 点击关闭
    bg.eventMode = 'static'
    bg.on('pointerdown', (e) => {
      e.stopPropagation()
      this.hideDetailPopup()
    })

    this.detailPopup = popup
    this.detailPopup.x = this._panelWidth + 10
    this.detailPopup.y = 0
    this.addChild(this.detailPopup)
  }

  // 显示内功详情
  private showPassiveDetail(passive: any): void {
    this.hideDetailPopup()

    const popup = new Container()
    const popupWidth = LayoutConstants.scaleValue(260)
    const padding = LayoutConstants.scaleValue(10)
    const lineHeight = LayoutConstants.scaleValue(18)

    // 计算高度
    const lines = 3 // 名称 + 触发时机 + 描述
    const popupHeight = padding * 2 + lines * lineHeight

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, popupWidth, popupHeight, 8)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    bg.stroke({ color: Colors.MP_BAR, width: 2 })
    popup.addChild(bg)

    let y = padding

    // 名称
    const nameText = new Text({
      text: `【${passive.name}】`,
      style: { fontSize: LayoutConstants.scaleValue(14), fill: Colors.MP_BAR, fontWeight: 'bold' }
    })
    nameText.x = padding
    nameText.y = y
    popup.addChild(nameText)
    y += lineHeight

    // 触发时机
    const triggerText = new Text({
      text: `触发时机: ${this.getTriggerTimingText(passive.trigger)}`,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY }
    })
    triggerText.x = padding
    triggerText.y = y
    popup.addChild(triggerText)
    y += lineHeight

    // 描述
    const descText = new Text({
      text: passive.description,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: popupWidth - padding * 2 }
    })
    descText.x = padding
    descText.y = y
    popup.addChild(descText)

    // 点击关闭
    bg.eventMode = 'static'
    bg.on('pointerdown', (e) => {
      e.stopPropagation()
      this.hideDetailPopup()
    })

    this.detailPopup = popup
    this.detailPopup.x = this._panelWidth + 10
    this.detailPopup.y = 0
    this.addChild(this.detailPopup)
  }

  // 获取触发时机文本
  private getTriggerTimingText(trigger: string): string {
    const timingMap: Record<string, string> = {
      'TURN_START': '回合开始',
      'TURN_END': '回合结束',
      'ON_DAMAGE': '造成伤害时',
      'ON_TAKE_DAMAGE': '受到伤害时',
      'ON_PLAY_CARD': '使用卡牌时',
      'ON_SKILL_USE': '使用武功时'
    }
    return timingMap[trigger] || trigger
  }

  // 获取面板尺寸
  getSize(): { width: number; height: number } {
    return { width: this._panelWidth, height: this.currentPanelHeight }
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
          const panelWidth = LayoutConstants.panelWidth()
          const barWidth = LayoutConstants.barWidth()
          const barHeight = LayoutConstants.barHeight()
          const barX = (panelWidth - barWidth) / 2
          this.hpBar.rect(barX, 0, barWidth, barHeight)
          this.hpBar.fill(color)
        } else {
          this.drawHpMpBarsWithValues(
            Math.round(this.animatedHp),
            Math.round(this.animatedMp),
            this.maxHp,
            this.maxMp
          )
        }

        count++
        if (count >= flashCount * 2) {
          clearInterval(flashInterval)
          this.drawHpMpBarsWithValues(
            Math.round(this.animatedHp),
            Math.round(this.animatedMp),
            this.maxHp,
            this.maxMp
          )
          resolve()
        }
      }, interval)
    })
  }

  /**
   * 高亮内功文字特效 - 平滑渐变动画
   * @param passiveId 内功ID
   */
  highlightPassive(passiveId: string): void {
    const text = this.passiveTexts.get(passiveId)
    if (!text) return

    // 如果正在动画中，跳过
    if ((text as any)._animating) return
    ;(text as any)._animating = true

    const originalY = text.y
    const originalScale = 1
    const targetScale = 1.3
    const jumpHeight = 10

    // 颜色渐变：蓝色 -> 金色
    const startColor = { r: 0x44, g: 0x88, b: 0xff } // 蓝色 MP_BAR
    const targetColor = { r: 0xff, g: 0xd7, b: 0x00 } // 金色 TEXT_GOLD

    const startTime = Date.now()
    const phase1Duration = 200  // 放大+变色
    const phase2Duration = 150  // 保持
    const phase3Duration = 250  // 缩回+恢复

    const animate = () => {
      const elapsed = Date.now() - startTime
      const totalDuration = phase1Duration + phase2Duration + phase3Duration

      if (elapsed < phase1Duration) {
        // 阶段1：放大 + 上跳 + 变色
        const progress = elapsed / phase1Duration
        const eased = progress * (2 - progress) // easeOutQuad

        // 缩放
        const scale = originalScale + (targetScale - originalScale) * eased
        text.scale.set(scale, scale)

        // 位置
        text.y = originalY - jumpHeight * eased

        // 颜色渐变
        const r = Math.round(startColor.r + (targetColor.r - startColor.r) * eased)
        const g = Math.round(startColor.g + (targetColor.g - startColor.g) * eased)
        const b = Math.round(startColor.b + (targetColor.b - startColor.b) * eased)
        text.style.fill = (r << 16) | (g << 8) | b

        requestAnimationFrame(animate)
      } else if (elapsed < phase1Duration + phase2Duration) {
        // 阶段2：保持状态（无操作）
        requestAnimationFrame(animate)
      } else if (elapsed < totalDuration) {
        // 阶段3：缩回 + 落下 + 恢复颜色
        const progress = (elapsed - phase1Duration - phase2Duration) / phase3Duration

        // 缩放
        const scale = targetScale + (originalScale - targetScale) * progress
        text.scale.set(scale, scale)

        // 位置
        text.y = originalY - jumpHeight * (1 - progress)

        // 颜色恢复
        const r = Math.round(targetColor.r + (startColor.r - targetColor.r) * progress)
        const g = Math.round(targetColor.g + (startColor.g - targetColor.g) * progress)
        const b = Math.round(targetColor.b + (startColor.b - targetColor.b) * progress)
        text.style.fill = (r << 16) | (g << 8) | b

        requestAnimationFrame(animate)
      } else {
        // 动画结束，确保恢复原始状态
        text.scale.set(originalScale, originalScale)
        text.y = originalY
        text.style.fill = Colors.MP_BAR
        ;(text as any)._animating = false
      }
    }

    requestAnimationFrame(animate)
  }

  // 目标选择状态方法
  setTargetable(targetable: boolean): void {
    this.isTargetable = targetable
    this.redrawBackground()
  }

  setTargeted(targeted: boolean): void {
    this.isTargeted = targeted
    this.redrawBackground()
  }

  // 重绘背景（保持当前高度）
  private redrawBackground(): void {
    this.drawBackground(this.currentPanelHeight)
  }

  /**
   * 销毁角色渲染器，清理所有子对象和动画状态
   */
  destroy(): void {
    // 停止动画
    this.hpMpAnimating = false

    // 清理主要图形对象
    this.background.destroy()
    this.hpBar.destroy()
    this.mpBar.destroy()

    // 清理精灵
    if (this.portrait) {
      this.portrait.destroy()
    }

    // 清理文本对象
    this.nameText.destroy()
    this.titleText.destroy()
    this.hpText.destroy()
    this.mpText.destroy()
    this.shieldText.destroy()
    this.agilityText.destroy()
    this.martialArtsText.destroy()

    // 清理内功容器和文本
    this.passiveTexts.forEach(text => text.destroy())
    this.passiveTexts.clear()
    this.passiveContainer.destroy()

    // 清理详情弹窗
    if (this.detailPopup) {
      this.detailPopup.destroy()
      this.detailPopup = null
    }

    // 调用父类销毁
    super.destroy()
  }
}
