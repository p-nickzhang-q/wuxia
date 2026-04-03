import { Container, Graphics, Text, Sprite, Assets } from 'pixi.js'
import { CharacterState, MartialArtSkill, PassiveSkill } from '../game/types'
import { Colors, Renderer } from './Renderer'
import { LayoutConstants } from './LayoutConstants'

/**
 * 迷你角色渲染器 - 用于多人战斗圆形布局
 */
export class MiniCharacterRenderer extends Container {
  private renderer: Renderer
  private characterData: CharacterState | null = null
  private isEnemy: boolean

  // UI组件
  private background: Graphics
  private avatarContainer: Container
  private avatar: Sprite | null = null
  private avatarMask: Graphics | null = null
  private nameText: Text
  private hpBar: Graphics
  private mpBar: Graphics
  private statsText: Text
  private tagsContainer: Container
  private tagsScrollContainer: Container | null = null

  // 详情浮层
  private detailPopup: Container | null = null

  // 目标选择状态
  private isTargetable: boolean = false
  private isTargeted: boolean = false

  constructor(character: CharacterState, isEnemy: boolean, renderer: Renderer) {
    super()

    this.renderer = renderer
    this.characterData = character
    this.isEnemy = isEnemy

    const avatarSize = LayoutConstants.miniAvatarSize()

    // 背景
    this.background = renderer.createGraphics()
    this.addChild(this.background)

    // 头像容器（左侧）
    this.avatarContainer = new Container()
    this.avatarContainer.x = 8
    this.avatarContainer.y = 8
    this.addChild(this.avatarContainer)

    // 创建圆形遮罩
    this.avatarMask = renderer.createGraphics()
    this.avatarMask.circle(avatarSize / 2, avatarSize / 2, avatarSize / 2)
    this.avatarMask.fill({ color: 0xffffff })
    this.avatarContainer.addChild(this.avatarMask)

    // 加载头像
    this.loadAvatar(character.name)

    // 角色名称
    this.nameText = new Text({
      text: character.name,
      style: {
        fontSize: LayoutConstants.scaleValue(14),
        fill: Colors.TEXT_PRIMARY,
        fontWeight: 'bold'
      }
    })
    this.nameText.x = avatarSize + 16
    this.nameText.y = 8
    this.addChild(this.nameText)

    // HP 条
    this.hpBar = renderer.createGraphics()
    this.hpBar.x = avatarSize + 16
    this.hpBar.y = 26
    this.addChild(this.hpBar)

    // MP 条
    this.mpBar = renderer.createGraphics()
    this.mpBar.x = avatarSize + 16
    this.mpBar.y = 38
    this.addChild(this.mpBar)

    // 轻功/护盾文字
    this.statsText = new Text({
      text: '',
      style: {
        fontSize: LayoutConstants.scaleValue(11),
        fill: Colors.TEXT_SECONDARY
      }
    })
    this.statsText.x = avatarSize + 16
    this.statsText.y = 52
    this.addChild(this.statsText)

    // 武功/内功标签容器
    this.tagsContainer = new Container()
    this.tagsContainer.x = 8
    this.tagsContainer.y = avatarSize + 16
    this.addChild(this.tagsContainer)

    // 初始绘制
    this.update(character)

    // 点击交互
    this.eventMode = 'static'
    this.cursor = 'pointer'
    this.on('pointerdown', (e) => {
      e.stopPropagation()
      this.toggleDetailPopup()
    })
  }

  // 加载头像
  private async loadAvatar(name: string): Promise<void> {
    const avatarSize = LayoutConstants.miniAvatarSize()

    try {
      const texture = await Assets.load(`/assets/characters/${name}.png`)
      this.avatar = new Sprite(texture)
      this.avatar.width = avatarSize
      this.avatar.height = avatarSize
      this.avatar.mask = this.avatarMask
      this.avatarContainer.addChildAt(this.avatar, 0)
    } catch {
      // 如果加载失败，显示默认头像
      const defaultAvatar = this.renderer.createGraphics()
      defaultAvatar.circle(avatarSize / 2, avatarSize / 2, avatarSize / 2)
      defaultAvatar.fill({ color: this.isEnemy ? Colors.TEXT_RED : Colors.TEXT_BLUE })
      this.avatarContainer.addChildAt(defaultAvatar, 0)
    }
  }

  // 更新角色状态
  update(character: CharacterState): void {
    this.characterData = character

    const panelWidth = LayoutConstants.miniPanelWidth()
    const avatarSize = LayoutConstants.miniAvatarSize()
    const barWidth = panelWidth - avatarSize - 32

    // 绘制背景
    this.drawBackground()

    // 更新 HP 条
    const hpPercent = character.hp / character.maxHp
    this.hpBar.clear()
    this.hpBar.rect(0, 0, barWidth, 10)
    this.hpBar.fill(0x333333)
    if (hpPercent > 0) {
      this.hpBar.rect(0, 0, barWidth * hpPercent, 10)
      this.hpBar.fill(Colors.HP_BAR)
    }

    // 更新 MP 条
    const mpPercent = character.mp / character.maxMp
    this.mpBar.clear()
    this.mpBar.rect(0, 0, barWidth, 10)
    this.mpBar.fill(0x333333)
    if (mpPercent > 0) {
      this.mpBar.rect(0, 0, barWidth * mpPercent, 10)
      this.mpBar.fill(Colors.MP_BAR)
    }

    // 更新轻功/护盾
    const stats: string[] = []
    stats.push(`轻功:${character.agility}`)
    if (character.shield > 0) {
      stats.push(`护盾:${character.shield}`)
    }
    this.statsText.text = stats.join(' ')

    // 更新武功/内功标签
    this.updateTags(character)
  }

  // 绘制背景
  private drawBackground(): void {
    const panelWidth = LayoutConstants.miniPanelWidth()
    const panelHeight = LayoutConstants.miniPanelHeight()

    this.background.clear()
    this.background.roundRect(0, 0, panelWidth, panelHeight, 8)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.9 })

    // 边框颜色根据状态变化
    let borderColor: number
    let borderWidth: number

    if (this.isTargeted) {
      borderColor = Colors.TEXT_GOLD
      borderWidth = 3
    } else if (this.isTargetable) {
      borderColor = 0x00ff88
      borderWidth = 3
    } else {
      borderColor = this.isEnemy ? Colors.TEXT_RED : Colors.TEXT_BLUE
      borderWidth = 2
    }

    this.background.stroke({ color: borderColor, width: borderWidth })
  }

  // 更新武功/内功标签
  private updateTags(character: CharacterState): void {
    this.tagsContainer.removeChildren()

    const skills = character.skills || []
    const passives = character.passives || []
    const tagHeight = LayoutConstants.miniTagHeight()
    const maxTagWidth = LayoutConstants.miniPanelWidth() - 16

    let y = 0

    // 武功标签
    if (skills.length > 0) {
      const label = new Text({
        text: '武:',
        style: { fontSize: LayoutConstants.scaleValue(11), fill: Colors.TEXT_SECONDARY }
      })
      label.y = y
      this.tagsContainer.addChild(label)

      const tagsRow = this.createScrollableTags(skills, maxTagWidth, tagHeight)
      tagsRow.x = 20
      tagsRow.y = y
      this.tagsContainer.addChild(tagsRow)

      y += tagHeight + 4
    }

    // 内功标签
    if (passives.length > 0) {
      const label = new Text({
        text: '内:',
        style: { fontSize: LayoutConstants.scaleValue(11), fill: Colors.TEXT_SECONDARY }
      })
      label.y = y
      this.tagsContainer.addChild(label)

      const tagsRow = this.createScrollableTags(passives, maxTagWidth, tagHeight, true)
      tagsRow.x = 20
      tagsRow.y = y
      this.tagsContainer.addChild(tagsRow)
    }
  }

  // 创建可滚动的标签行
  private createScrollableTags(
    items: (MartialArtSkill | PassiveSkill)[],
    maxWidth: number,
    tagHeight: number,
    isPassive: boolean = false
  ): Container {
    const container = new Container()

    // 创建遮罩
    const mask = this.renderer.createGraphics()
    mask.rect(0, 0, maxWidth - 24, tagHeight)
    mask.fill({ color: 0xffffff })
    container.addChild(mask)

    // 创建滚动容器
    const scrollContainer = new Container()
    scrollContainer.mask = mask
    container.addChild(scrollContainer)
    this.tagsScrollContainer = scrollContainer

    let x = 0
    items.forEach(item => {
      const shortName = item.shortName || item.name.substring(0, 2)
      const tag = this.createTag(shortName, tagHeight, isPassive)
      tag.x = x
      scrollContainer.addChild(tag)
      x += tag.width + 4
    })

    // 如果超出宽度，添加滚动指示
    if (x > maxWidth - 24) {
      const indicator = new Text({
        text: '→',
        style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_SECONDARY }
      })
      indicator.x = maxWidth - 20
      indicator.y = 2
      container.addChild(indicator)

      // 鼠标滚轮滚动
      container.eventMode = 'static'
      container.on('wheel', (e: any) => {
        if (this.tagsScrollContainer) {
          const maxScroll = maxWidth - 24 - x
          const newX = this.tagsScrollContainer.x - e.deltaX
          this.tagsScrollContainer.x = Math.max(maxScroll, Math.min(0, newX))
        }
      })
    }

    return container
  }

  // 创建单个标签
  private createTag(text: string, height: number, isPassive: boolean): Container {
    const tag = new Container()
    const tagWidth = LayoutConstants.scaleValue(text.length * 12 + 8)
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, tagWidth, height, 3)
    bg.fill({ color: isPassive ? Colors.MP_BAR : Colors.TEXT_GOLD, alpha: 0.3 })
    bg.stroke({ color: isPassive ? Colors.MP_BAR : Colors.TEXT_GOLD, width: 1 })
    tag.addChild(bg)

    const label = new Text({
      text,
      style: {
        fontSize: LayoutConstants.scaleValue(11),
        fill: isPassive ? Colors.MP_BAR : Colors.TEXT_GOLD,
        fontWeight: 'bold'
      }
    })
    label.x = (tagWidth - label.width) / 2
    label.y = (height - label.height) / 2
    tag.addChild(label)

    return tag
  }

  // 切换详情浮层
  private toggleDetailPopup(): void {
    if (this.detailPopup) {
      this.hideDetailPopup()
    } else {
      this.showDetailPopup()
    }
  }

  // 显示详情浮层
  private showDetailPopup(): void {
    if (!this.characterData) return

    const popup = new Container()
    const popupWidth = LayoutConstants.scaleValue(220)
    const padding = LayoutConstants.scaleValue(8)
    const lineHeight = LayoutConstants.scaleValue(16)

    const skills = this.characterData.skills || []
    const passives = this.characterData.passives || []

    // 计算高度
    let lines = 4 // 名称 + HP/MP + 轻功/护盾 + 武功标题
    lines += skills.length * 2
    if (passives.length > 0) {
      lines += 1 + passives.length * 2
    }
    const popupHeight = padding * 2 + lines * lineHeight

    // 背景
    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, popupWidth, popupHeight, 8)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    bg.stroke({ color: this.isEnemy ? Colors.TEXT_RED : Colors.TEXT_BLUE, width: 2 })
    popup.addChild(bg)

    let y = padding

    // 名称
    const nameText = new Text({
      text: `【${this.characterData.name}】`,
      style: { fontSize: LayoutConstants.scaleValue(14), fill: Colors.TEXT_GOLD, fontWeight: 'bold' }
    })
    nameText.x = padding
    nameText.y = y
    popup.addChild(nameText)
    y += lineHeight

    // HP/MP
    const hpMpText = new Text({
      text: `HP: ${this.characterData.hp}/${this.characterData.maxHp}  MP: ${this.characterData.mp}/${this.characterData.maxMp}`,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY }
    })
    hpMpText.x = padding
    hpMpText.y = y
    popup.addChild(hpMpText)
    y += lineHeight

    // 轻功/护盾
    const statsText = new Text({
      text: `轻功: ${this.characterData.agility}  护盾: ${this.characterData.shield}`,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY }
    })
    statsText.x = padding
    statsText.y = y
    popup.addChild(statsText)
    y += lineHeight + 4

    // 武功列表
    if (skills.length > 0) {
      const skillTitle = new Text({
        text: '— 武功招式 —',
        style: { fontSize: LayoutConstants.scaleValue(11), fill: Colors.TEXT_GOLD }
      })
      skillTitle.x = padding
      skillTitle.y = y
      popup.addChild(skillTitle)
      y += lineHeight

      for (const skill of skills) {
        const sName = new Text({
          text: `${skill.name} (${skill.mpCost}内力)`,
          style: { fontSize: LayoutConstants.scaleValue(11), fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
        })
        sName.x = padding + 4
        sName.y = y
        popup.addChild(sName)
        y += lineHeight

        const sDesc = new Text({
          text: skill.description,
          style: { fontSize: LayoutConstants.scaleValue(10), fill: Colors.TEXT_SECONDARY }
        })
        sDesc.x = padding + 8
        sDesc.y = y
        popup.addChild(sDesc)
        y += lineHeight
      }
    }

    // 内功列表
    if (passives.length > 0) {
      y += 2
      const passiveTitle = new Text({
        text: '— 内功 —',
        style: { fontSize: LayoutConstants.scaleValue(11), fill: Colors.MP_BAR }
      })
      passiveTitle.x = padding
      passiveTitle.y = y
      popup.addChild(passiveTitle)
      y += lineHeight

      for (const passive of passives) {
        const pName = new Text({
          text: passive.name,
          style: { fontSize: LayoutConstants.scaleValue(11), fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
        })
        pName.x = padding + 4
        pName.y = y
        popup.addChild(pName)
        y += lineHeight

        const pDesc = new Text({
          text: passive.description,
          style: { fontSize: LayoutConstants.scaleValue(10), fill: Colors.TEXT_SECONDARY }
        })
        pDesc.x = padding + 8
        pDesc.y = y
        popup.addChild(pDesc)
        y += lineHeight
      }
    }

    // 点击关闭
    bg.eventMode = 'static'
    bg.on('pointerdown', (e) => {
      e.stopPropagation()
      this.hideDetailPopup()
    })

    // 定位浮层
    const panelWidth = LayoutConstants.miniPanelWidth()
    popup.x = panelWidth + 10
    popup.y = 0

    this.detailPopup = popup
    this.addChild(popup)
  }

  // 隐藏详情浮层
  private hideDetailPopup(): void {
    if (this.detailPopup) {
      this.removeChild(this.detailPopup)
      this.detailPopup = null
    }
  }

  // 设置目标选择状态
  setTargetable(targetable: boolean): void {
    this.isTargetable = targetable
    this.drawBackground()
  }

  setTargeted(targeted: boolean): void {
    this.isTargeted = targeted
    this.drawBackground()
  }

  // 内功高亮（兼容接口）
  highlightPassive(_passiveId: string): void {
    // 迷你面板不实现内功高亮特效
  }

  // 获取面板尺寸
  getSize(): { width: number; height: number } {
    return {
      width: LayoutConstants.miniPanelWidth(),
      height: LayoutConstants.miniPanelHeight()
    }
  }
}