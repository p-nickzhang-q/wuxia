import { Container } from 'pixi.js'
import { Renderer } from '../renderer/Renderer'
import { CardRenderer, getCardDimensions } from '../renderer/CardRenderer'
import { Button, SkillButton, BattleLog, StatusBar, VerticalAgilityAxis } from '../renderer/UIComponents'
import { CharacterState, GamePhase, MartialArtSkill } from '../game/types'
import { LayoutConstants } from '../renderer/LayoutConstants'
import { tweenManager, Easing } from '../utils/TweenManager'
import { BattleSceneInterface } from './types/BattleSceneInterface'

/**
 * 手牌更新上下文
 */
interface HandUpdateContext {
  currentActor: CharacterState
  hand: any[]
  agility: number
  availableCards: any[]
  selectedCardId: string | null
  deckX: number
  deckY: number
  startX: number
  cardY: number
  needsAnimation: boolean
  pendingDrawAnimations: string[]
}

/**
 * 技能更新上下文
 */
interface SkillUpdateContext {
  currentActor: CharacterState
  skills: MartialArtSkill[]
  mp: number
  agility: number
  hand: any[]
  selectedSkillId: string | null
}

/**
 * 战斗 UI 状态管理器
 * 管理 UI 组件的状态同步和更新
 */
export class BattleUIManager {
  private scene: BattleSceneInterface
  private renderer: Renderer
  private container: Container

  // UI 组件
  private statusBar: StatusBar | null = null
  private battleLog: BattleLog | null = null
  private agilityAxis: VerticalAgilityAxis | null = null
  private confirmButton: Button | null = null
  private cancelButton: Button | null = null
  private endTurnButton: Button | null = null

  // 渲染器列表
  private cardRenderers: CardRenderer[] = []
  private skillButtons: SkillButton[] = []

  // 状态标记
  private isFirstHandUpdate: boolean = true
  private pendingDrawAnimations: string[] = []

  constructor(
    scene: BattleSceneInterface,
    renderer: Renderer,
    container: Container
  ) {
    this.scene = scene
    this.renderer = renderer
    this.container = container
  }

  /**
   * 创建完整 UI
   */
  createUI(): void {
    this.createStatusBar()
    this.createBattleLog()
    this.createAgilityAxis()
    this.createActionButtons()
  }

  /**
   * 创建状态栏
   */
  private createStatusBar(): void {
    const size = this.renderer.getSize()
    const sidebarWidth = LayoutConstants.sidebarWidth()
    const statusWidth = LayoutConstants.statusWidth()

    this.statusBar = new StatusBar(this.renderer)
    this.statusBar.x = (size.width - sidebarWidth) / 2 - statusWidth / 2
    this.statusBar.y = size.height * 0.02
    this.container.addChild(this.statusBar)
  }

  /**
   * 创建战斗日志
   */
  private createBattleLog(): void {
    const size = this.renderer.getSize()
    const sidebarWidth = LayoutConstants.sidebarWidth()
    const logWidth = LayoutConstants.logWidth()

    const sidebarX = size.width - sidebarWidth

    this.battleLog = new BattleLog(this.renderer)
    this.battleLog.x = sidebarX + (sidebarWidth - logWidth) / 2
    this.battleLog.y = size.height * 0.02
    this.container.addChild(this.battleLog)
  }

  /**
   * 创建轻功轴
   */
  private createAgilityAxis(): void {
    const size = this.renderer.getSize()
    const sidebarWidth = LayoutConstants.sidebarWidth()
    const logHeight = LayoutConstants.logHeight()
    const axisWidth = LayoutConstants.agilityAxisWidth()

    const sidebarX = size.width - sidebarWidth

    this.agilityAxis = new VerticalAgilityAxis(this.renderer)
    this.agilityAxis.x = sidebarX + (sidebarWidth - axisWidth) / 2
    this.agilityAxis.y = size.height * 0.02 + logHeight + 15
    this.container.addChild(this.agilityAxis)
  }

  /**
   * 创建动作按钮
   */
  private createActionButtons(): void {
    const size = this.renderer.getSize()
    const sidebarWidth = LayoutConstants.sidebarWidth()
    const buttonHeight = LayoutConstants.buttonHeight()
    const panelMarginH = size.width * 0.02

    // 结束回合按钮
    const endTurnBtnWidth = LayoutConstants.scaleValue(130)
    this.endTurnButton = new Button('结束回合', endTurnBtnWidth, buttonHeight, this.renderer)
    this.endTurnButton.x = size.width - sidebarWidth - endTurnBtnWidth - panelMarginH
    this.endTurnButton.y = size.height - buttonHeight - 15
    this.endTurnButton.setOnClick(() => this.scene.endTurn())
    this.container.addChild(this.endTurnButton)

    // 确认按钮
    const actionBtnWidth = LayoutConstants.scaleValue(100)
    this.confirmButton = new Button('确认', actionBtnWidth, buttonHeight, this.renderer)
    this.confirmButton.x = (size.width - sidebarWidth) / 2 - actionBtnWidth - 10
    this.confirmButton.y = size.height - buttonHeight - 15
    this.confirmButton.setOnClick(() => this.scene.executeAction(
      this.scene.pendingSkillId,
      this.scene.pendingCardId,
      this.scene.selectedTargetId || ''
    ))
    this.container.addChild(this.confirmButton)

    // 取消按钮
    this.cancelButton = new Button('取消', actionBtnWidth, buttonHeight, this.renderer)
    this.cancelButton.x = (size.width - sidebarWidth) / 2 + 10
    this.cancelButton.y = size.height - buttonHeight - 15
    this.cancelButton.setOnClick(() => this.scene.clearTargetSelection())
    this.container.addChild(this.cancelButton)
  }

  /**
   * 更新所有 UI 状态
   */
  updateUI(): void {
    this.updateStatusBar()
    this.updateAgilityAxis()
    this.syncBattleLog()
    this.updateHandCards()
    this.updateSkillButtons()
    this.updateActionButtons()

    if (this.scene.game?.phase === GamePhase.GAME_OVER) {
      this.scene.handleGameOver()
    }
  }

  /**
   * 更新状态栏
   */
  private updateStatusBar(): void {
    if (!this.scene.game || !this.statusBar) return

    this.statusBar.setTurn(this.scene.game.currentTurn)
    this.statusBar.setPhase(this.getPhaseText())
  }

  /**
   * 更新轻功轴
   */
  private updateAgilityAxis(): void {
    if (!this.agilityAxis || !this.scene.game) return

    const allChars = this.scene.game.getAllCharacters()
    const currentActor = this.scene.game.currentActor

    const charData = allChars
      .filter(c => c.isAlive())
      .map(c => ({
        id: c.id,
        name: c.name,
        agility: c.agility,
        isPlayer: this.scene.isPlayerTeam(c),
        isAlive: c.isAlive()
      }))

    this.agilityAxis.update(charData, currentActor?.id || null)
  }

  /**
   * 同步战斗日志
   */
  private syncBattleLog(): void {
    if (!this.scene.game || !this.battleLog) return

    const logs = this.scene.game.battleLog
    const uiLogs = this.battleLog.getLogCount()

    if (logs.length > uiLogs) {
      for (let i = uiLogs; i < logs.length; i++) {
        this.battleLog.syncLog(logs[i].text)
      }
    }
  }

  /**
   * 更新手牌显示
   */
  private updateHandCards(): void {
    const context = this.prepareHandUpdateContext()
    if (!context) return

    this.clearOldCards()
    this.renderNewCards(context)
    this.restoreSelectionState(context.selectedCardId)

    this.pendingDrawAnimations = []
    this.isFirstHandUpdate = false
  }

  /**
   * 准备手牌更新上下文
   */
  private prepareHandUpdateContext(): HandUpdateContext | null {
    if (!this.scene.game) return null

    const currentActor = this.scene.game.currentActor
    if (!currentActor || !this.scene.isPlayerControlled(currentActor)) return null

    const size = this.renderer.getSize()
    const cardDims = getCardDimensions()
    const sidebarWidth = LayoutConstants.sidebarWidth()
    const availableWidth = size.width - sidebarWidth

    const hand = currentActor.hand
    const availableCards = currentActor.getAvailableCards(currentActor.agility)

    const cardSpacing = cardDims.width + LayoutConstants.cardSpacing()
    const totalWidth = hand.length * cardSpacing - LayoutConstants.cardSpacing()
    const startX = availableWidth / 2 - totalWidth / 2
    const cardY = size.height - cardDims.height - LayoutConstants.buttonHeight() - 25

    const deckX = availableWidth / 2
    const deckY = size.height / 2

    const selectedCardId = this.scene.selectedCard?.getCard().instanceId ?? null

    return {
      currentActor,
      hand,
      agility: currentActor.agility,
      availableCards,
      selectedCardId: selectedCardId,
      deckX,
      deckY,
      startX,
      cardY,
      needsAnimation: this.isFirstHandUpdate || this.pendingDrawAnimations.length > 0,
      pendingDrawAnimations: this.pendingDrawAnimations
    }
  }

  /**
   * 清空旧卡牌渲染器
   */
  private clearOldCards(): void {
    this.cardRenderers.forEach(card => this.container.removeChild(card))
    this.cardRenderers = []
  }

  /**
   * 渲染新卡牌
   */
  private renderNewCards(context: HandUpdateContext): void {
    const cardSpacing = getCardDimensions().width + LayoutConstants.cardSpacing()

    context.hand.forEach((card, index) => {
      const cardRenderer = new CardRenderer(card, this.renderer)
      const cardX = context.startX + index * cardSpacing

      const needsAnimation = context.needsAnimation || context.pendingDrawAnimations.includes(card.instanceId)

      if (needsAnimation) {
        cardRenderer.x = context.deckX
        cardRenderer.y = context.deckY
        cardRenderer.alpha = 0

        // 延迟动画，让每张牌依次飞入
        setTimeout(() => {
          tweenManager.create(cardRenderer, { x: cardX, y: context.cardY, alpha: 1 }, 300, Easing.easeOutQuad)
        }, index * 100)
      } else {
        cardRenderer.x = cardX
        cardRenderer.y = context.cardY
      }

      cardRenderer.setBaseY(context.cardY)

      const isAvailable = context.availableCards.some(c => c.instanceId === card.instanceId) &&
                         this.scene.isPlayerControlled(context.currentActor) &&
                         this.scene.game !== null &&
                         this.scene.game.phase !== GamePhase.GAME_OVER
      cardRenderer.setPlayable(isAvailable)

      cardRenderer.setOnClick(() => this.scene.handleCardClick(cardRenderer))

      this.container.addChild(cardRenderer)
      this.cardRenderers.push(cardRenderer)
    })
  }

  /**
   * 恢复选中状态
   */
  private restoreSelectionState(selectedCardId: string | null): void {
    if (!selectedCardId) return

    const cardRenderer = this.cardRenderers.find(r => r.getCard().instanceId === selectedCardId)
    if (cardRenderer) {
      cardRenderer.setSelected(true)
    }
  }

  /**
   * 更新技能按钮
   */
  updateSkillButtons(): void {
    this.clearOldSkillButtons()

    const context = this.prepareSkillUpdateContext()
    if (!context) return

    this.renderSkillButtons(context)
  }

  /**
   * 清空旧技能按钮
   */
  private clearOldSkillButtons(): void {
    this.skillButtons.forEach(btn => this.container.removeChild(btn))
    this.skillButtons = []
  }

  /**
   * 准备技能更新上下文
   */
  private prepareSkillUpdateContext(): SkillUpdateContext | null {
    if (!this.scene.game) return null

    const currentActor = this.scene.game.currentActor
    if (!currentActor || !this.scene.isPlayerControlled(currentActor)) return null

    return {
      currentActor,
      skills: currentActor.skills,
      mp: currentActor.mp,
      agility: currentActor.agility,
      hand: currentActor.hand,
      selectedSkillId: this.scene.selectedSkill?.id ?? null
    }
  }

  /**
   * 渲染技能按钮
   */
  private renderSkillButtons(context: SkillUpdateContext): void {
    const size = this.renderer.getSize()
    const cardDims = getCardDimensions()
    const sidebarWidth = LayoutConstants.sidebarWidth()
    const availableWidth = size.width - sidebarWidth
    const skillBtnWidth = LayoutConstants.skillBtnWidth()
    const skillBtnHeight = LayoutConstants.skillBtnHeight()

    const btnSpacing = skillBtnWidth + 10
    const totalWidth = context.skills.length * btnSpacing - 10
    const startX = availableWidth / 2 - totalWidth / 2
    const btnY = size.height - cardDims.height - skillBtnHeight - LayoutConstants.buttonHeight() - 40

    context.skills.forEach((skill, index) => {
      const btn = new SkillButton(
        skill.id,
        skill.name,
        skill.mpCost,
        skill.agilityCost,
        skill.description,
        this.renderer
      )
      btn.x = startX + index * btnSpacing
      btn.y = btnY

      const isPlayerTurn = this.scene.isPlayerControlled(context.currentActor) &&
                          this.scene.game?.phase !== GamePhase.GAME_OVER
      const hasEnoughMp = context.mp >= skill.mpCost
      const hasEnoughAgility = context.agility >= skill.agilityCost
      const hasMatchingCard = context.hand.some(card =>
        skill.requiredCardType === 'any' || card.type === skill.requiredCardType
      )
      const isAvailable = isPlayerTurn && hasEnoughMp && hasEnoughAgility && hasMatchingCard

      btn.setAvailable(isAvailable)

      if (context.selectedSkillId === skill.id) {
        btn.setSelected(true)
      }

      btn.setOnClick((skillId: string) => this.scene.handleSkillClick(skillId))

      this.container.addChild(btn)
      this.skillButtons.push(btn)
    })
  }

  /**
   * 更新动作按钮状态
   */
  updateActionButtons(): void {
    const currentActor = this.scene.game?.currentActor
    const isPlayerTurn = currentActor &&
                         this.scene.isPlayerControlled(currentActor) &&
                         this.scene.game?.phase !== GamePhase.GAME_OVER

    const canConfirm = isPlayerTurn && this.scene.pendingCardId !== null
    this.confirmButton?.setDisabled(!canConfirm)

    const canCancel = isPlayerTurn && (this.scene.pendingCardId !== null || this.scene.pendingSkillId !== null)
    this.cancelButton?.setDisabled(!canCancel)
  }

  /**
   * 设置首次手牌更新标记
   */
  setFirstHandUpdate(value: boolean): void {
    this.isFirstHandUpdate = value
  }

  /**
   * 添加待动画卡牌 ID
   */
  addPendingDrawAnimation(cardId: string): void {
    this.pendingDrawAnimations.push(cardId)
  }

  /**
   * 获取卡牌渲染器列表（供外部访问）
   */
  getCardRenderers(): CardRenderer[] {
    return this.cardRenderers
  }

  /**
   * 获取技能按钮列表（供外部访问）
   */
  getSkillButtons(): SkillButton[] {
    return this.skillButtons
  }

  /**
   * 获取战斗日志组件
   */
  getBattleLog(): BattleLog | null {
    return this.battleLog
  }

  /**
   * 获取状态栏组件
   */
  getStatusBar(): StatusBar | null {
    return this.statusBar
  }

  /**
   * 获取轻功轴组件
   */
  getAgilityAxis(): VerticalAgilityAxis | null {
    return this.agilityAxis
  }

  /**
   * 清理资源
   */
  clear(): void {
    this.cardRenderers.forEach(card => this.container.removeChild(card))
    this.cardRenderers = []

    this.skillButtons.forEach(btn => this.container.removeChild(btn))
    this.skillButtons = []

    if (this.statusBar) {
      this.container.removeChild(this.statusBar)
      this.statusBar = null
    }
    if (this.battleLog) {
      this.container.removeChild(this.battleLog)
      this.battleLog = null
    }
    if (this.agilityAxis) {
      this.container.removeChild(this.agilityAxis)
      this.agilityAxis = null
    }
    if (this.confirmButton) {
      this.container.removeChild(this.confirmButton)
      this.confirmButton = null
    }
    if (this.cancelButton) {
      this.container.removeChild(this.cancelButton)
      this.cancelButton = null
    }
    if (this.endTurnButton) {
      this.container.removeChild(this.endTurnButton)
      this.endTurnButton = null
    }

    this.isFirstHandUpdate = true
    this.pendingDrawAnimations = []
  }

  /**
   * 获取阶段文本
   */
  private getPhaseText(): string {
    if (!this.scene.game) return ''

    if (this.scene.game.phase === GamePhase.SETUP) return '准备中'
    if (this.scene.game.phase === GamePhase.GAME_OVER) return '战斗结束'

    const currentActor = this.scene.game.currentActor
    if (currentActor && this.scene.isPlayerControlled(currentActor)) {
      return `${currentActor.name}的回合`
    } else if (currentActor) {
      return `${currentActor.name}行动中`
    }
    return ''
  }
}