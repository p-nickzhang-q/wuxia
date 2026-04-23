import { Container, Text } from 'pixi.js'
import { CharacterState, MartialArtSkill, PassiveSkill } from '../game/types'
import { Colors, Renderer } from './Renderer'
import { LayoutConstants } from './LayoutConstants'

/**
 * 角色详情浮层组件
 */
export class CharacterDetailPopup extends Container {
  private character: CharacterState
  private renderer: Renderer

  constructor(character: CharacterState, renderer: Renderer) {
    super()
    this.character = character
    this.renderer = renderer
    this.createContent()
  }

  private createContent(): void {
    const popupWidth = LayoutConstants.scaleValue(280)
    const padding = LayoutConstants.scaleValue(10)
    const lineHeight = LayoutConstants.scaleValue(18)

    const skills = this.character.skills || []
    const passives = this.character.passives || []

    const totalLines = 1 + skills.length * 2 + (passives.length > 0 ? 1 + passives.length * 2 : 0)
    const popupHeight = padding * 2 + totalLines * lineHeight

    const bg = this.renderer.createGraphics()
    bg.roundRect(0, 0, popupWidth, popupHeight, 8)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    this.addChild(bg)

    let y = padding

    // 武功标题
    const skillTitle = new Text({
      text: '【武功招式】',
      style: { fontSize: LayoutConstants.scaleValue(14), fill: Colors.TEXT_GOLD, fontWeight: 'bold' }
    })
    skillTitle.x = padding
    skillTitle.y = y
    this.addChild(skillTitle)
    y += lineHeight + 2

    // 武功列表
    skills.forEach(skill => {
      const nameText = new Text({
        text: `${skill.name} (${skill.mpCost}内力, 范围${skill.range})`,
        style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
      })
      nameText.x = padding + 5
      nameText.y = y
      this.addChild(nameText)
      y += lineHeight

      const descText = new Text({
        text: skill.description,
        style: { fontSize: LayoutConstants.scaleValue(11), fill: Colors.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: popupWidth - padding * 2 - 10 }
      })
      descText.x = padding + 10
      descText.y = y
      this.addChild(descText)
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
      this.addChild(passiveTitle)
      y += lineHeight + 2

      passives.forEach(passive => {
        const nameText = new Text({
          text: passive.name,
          style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY, fontWeight: 'bold' }
        })
        nameText.x = padding + 5
        nameText.y = y
        this.addChild(nameText)
        y += lineHeight

        const descText = new Text({
          text: passive.description,
          style: { fontSize: LayoutConstants.scaleValue(11), fill: Colors.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: popupWidth - padding * 2 - 10 }
        })
        descText.x = padding + 10
        descText.y = y
        this.addChild(descText)
        y += lineHeight + 2
      })
    }

    bg.eventMode = 'static'
    bg.on('pointerdown', (e) => {
      e.stopPropagation()
    })
  }

  /**
   * 创建武功详情浮层
   */
  static createSkillPopup(skill: MartialArtSkill, renderer: Renderer, onClose: () => void): Container {
    const popup = new Container()
    const popupWidth = LayoutConstants.scaleValue(260)
    const padding = LayoutConstants.scaleValue(10)
    const lineHeight = LayoutConstants.scaleValue(18)

    const lines = 4
    const popupHeight = padding * 2 + lines * lineHeight

    const bg = renderer.createGraphics()
    bg.roundRect(0, 0, popupWidth, popupHeight, 8)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    bg.stroke({ color: Colors.TEXT_GOLD, width: 2 })
    popup.addChild(bg)

    let y = padding

    const nameText = new Text({
      text: `【${skill.name}】`,
      style: { fontSize: LayoutConstants.scaleValue(14), fill: Colors.TEXT_GOLD, fontWeight: 'bold' }
    })
    nameText.x = padding
    nameText.y = y
    popup.addChild(nameText)
    y += lineHeight

    const mpText = new Text({
      text: `内力消耗: ${skill.mpCost}  轻功消耗: ${skill.agilityCost}`,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY }
    })
    mpText.x = padding
    mpText.y = y
    popup.addChild(mpText)
    y += lineHeight

    const rangeText = new Text({
      text: `攻击范围: ${skill.range}`,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY }
    })
    rangeText.x = padding
    rangeText.y = y
    popup.addChild(rangeText)
    y += lineHeight

    const descText = new Text({
      text: skill.description,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: popupWidth - padding * 2 }
    })
    descText.x = padding
    descText.y = y
    popup.addChild(descText)

    bg.eventMode = 'static'
    bg.on('pointerdown', (e) => {
      e.stopPropagation()
      onClose()
    })

    return popup
  }

  /**
   * 创建内功详情浮层
   */
  static createPassivePopup(passive: PassiveSkill, renderer: Renderer, onClose: () => void): Container {
    const popup = new Container()
    const popupWidth = LayoutConstants.scaleValue(260)
    const padding = LayoutConstants.scaleValue(10)
    const lineHeight = LayoutConstants.scaleValue(18)

    const lines = 3
    const popupHeight = padding * 2 + lines * lineHeight

    const bg = renderer.createGraphics()
    bg.roundRect(0, 0, popupWidth, popupHeight, 8)
    bg.fill({ color: Colors.PANEL_BG, alpha: 0.95 })
    bg.stroke({ color: Colors.MP_BAR, width: 2 })
    popup.addChild(bg)

    let y = padding

    const nameText = new Text({
      text: `【${passive.name}】`,
      style: { fontSize: LayoutConstants.scaleValue(14), fill: Colors.MP_BAR, fontWeight: 'bold' }
    })
    nameText.x = padding
    nameText.y = y
    popup.addChild(nameText)
    y += lineHeight

    const triggerText = new Text({
      text: `触发时机: ${CharacterDetailPopup.getTriggerTimingText(passive.trigger)}`,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_PRIMARY }
    })
    triggerText.x = padding
    triggerText.y = y
    popup.addChild(triggerText)
    y += lineHeight

    const descText = new Text({
      text: passive.description,
      style: { fontSize: LayoutConstants.scaleValue(12), fill: Colors.TEXT_SECONDARY, wordWrap: true, wordWrapWidth: popupWidth - padding * 2 }
    })
    descText.x = padding
    descText.y = y
    popup.addChild(descText)

    bg.eventMode = 'static'
    bg.on('pointerdown', (e) => {
      e.stopPropagation()
      onClose()
    })

    return popup
  }

  static getTriggerTimingText(trigger: string): string {
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
}