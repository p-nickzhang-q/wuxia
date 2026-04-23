import { Scene } from './Scene'
import { Renderer, Colors } from '../renderer/Renderer'
import { CardRenderer, getCardDimensions } from '../renderer/CardRenderer'
import { CharacterRenderer } from '../renderer/CharacterRenderer'
import { MiniCharacterRenderer } from '../renderer/MiniCharacterRenderer'
import { SkillButton, BattleLog, StatusBar, VerticalAgilityAxis } from '../renderer/UIComponents'
import { createGame } from '../game/Game'
import { createCharacter } from '../game/Character'
import { AI } from '../game/AI'
import { characters, getCharacterMartialArts } from '../data/skills'
import { CharacterState, GamePhase, MartialArtSkill, GameEventType, BattleMode } from '../game/types'
import { LayoutConstants } from '../renderer/LayoutConstants'
import { effectManager } from '../utils/EffectManager'
import { eventManager } from '../utils/EventManager'
import { tweenManager, Easing } from '../utils/TweenManager'
import { Text, TextStyle } from 'pixi.js'
import { BattleInputHandler } from './BattleInputHandler'
import { BattleAIHandler } from './BattleAIHandler'
import { BattleLayoutManager } from './BattleLayoutManager'
import { BattleUIManager } from './BattleUIManager'
import { BattleSceneInterface } from './types/BattleSceneInterface'

// 战斗场景
export class BattleScene extends Scene implements BattleSceneInterface {
  // 多人战斗配置
  public playerConfigs: CharacterState[] = []
  private enemyConfigs: CharacterState[] = []

  public game: ReturnType<typeof createGame> | null = null
  public ai: AI | null = null

  // 处理器
  private inputHandler: BattleInputHandler | null = null
  private aiHandler: BattleAIHandler | null = null
  private layoutManager: BattleLayoutManager | null = null
  private uiManager: BattleUIManager | null = null

  // 渲染组件 - 多人支持
  public characterRenderers: Map<string, CharacterRenderer | MiniCharacterRenderer> = new Map()

  // UI 组件通过 uiManager 管理，这里提供 getter 供接口使用
  public get statusBar(): StatusBar | null { return this.uiManager?.getStatusBar() ?? null }
  public get battleLog(): BattleLog | null { return this.uiManager?.getBattleLog() ?? null }
  public get agilityAxis(): VerticalAgilityAxis | null { return this.uiManager?.getAgilityAxis() ?? null }

  // 卡牌和技能渲染器（供外部访问）
  public get cardRenderers(): CardRenderer[] { return this.uiManager?.getCardRenderers() ?? [] }
  public get skillButtons(): SkillButton[] { return this.uiManager?.getSkillButtons() ?? [] }

  // 交互状态
  public selectedCard: CardRenderer | null = null
  public selectedSkill: MartialArtSkill | null = null
  public isAIProcessing: boolean = false
  private isGameOver: boolean = false  // 防止重复处理游戏结束

  // 目标选择状态
  public targetableIds: string[] = []           // 可选目标ID列表
  public selectedTargetId: string | null = null // 已选中目标ID
  public pendingSkillId: string | null = null   // 待执行的武功ID
  public pendingCardId: string | null = null    // 待执行的卡牌ID

  // 内功特效队列（用于延迟显示第一回合的内功特效）
  private pendingPassiveHighlights: Array<{characterId: string, passiveId: string}> = []

  // 玩家控制的角色ID
  private playerControlledId: string | null = null

  // 回调
  private onBattleEnd?: (playerWon: boolean) => void

  constructor(renderer: Renderer) {
    super(renderer)
  }

  // 初始化战斗（1v1向后兼容）
  init(playerCharacterId: string): void {
    this.initTeamBattle([playerCharacterId], [this.getRandomEnemy(playerCharacterId)], 'team', playerCharacterId)
  }

  // 多人战斗初始化
  initTeamBattle(playerIds: string[], enemyIds: string[], mode: BattleMode, playerControlledId?: string): void {
    // 重置状态（必须在注册事件监听器之前）
    this.isAIProcessing = false
    this.selectedCard = null
    this.selectedSkill = null
    this.isGameOver = false
    this.pendingPassiveHighlights = []
    this.playerControlledId = playerControlledId || playerIds[0]  // 默认第一个是玩家控制

    // 添加特效管理器到场景
    this.addChild(effectManager)

    // 注册事件监听器（必须在 game.init 之前注册）
    this.registerEventListeners()

    // 创建玩家队伍
    this.playerConfigs = playerIds.map(id => {
      const martialArts = getCharacterMartialArts(id)
      return createCharacter(characters[id], martialArts)
    })

    // 创建敌人队伍
    this.enemyConfigs = enemyIds.map(id => {
      const martialArts = getCharacterMartialArts(id)
      return createCharacter(characters[id], martialArts)
    })

    // 创建游戏
    this.game = createGame()
    this.game.initTeamBattle(this.playerConfigs, this.enemyConfigs, mode)

    // 创建 AI（后续需要重构支持多目标）
    this.ai = new AI(this.game)
  }

  // 随机选择敌人
  private getRandomEnemy(excludeId: string): string {
    const characterKeys = Object.keys(characters).filter(k => k !== excludeId)
    return characterKeys[Math.floor(Math.random() * characterKeys.length)]
  }

  onEnter(): void {
    if (!this.game) {
      console.error('Battle scene not initialized')
      return
    }

    // 初始化处理器
    this.initHandlers()

    this.isAIProcessing = false
    this.selectedCard = null
    this.selectedSkill = null
    this.isGameOver = false

    // 创建 UI（委托给 uiManager）
    this.uiManager?.createUI()

    // 创建角色面板
    this.createCharacterPanels()

    // 更新 UI 状态
    this.uiManager?.updateUI()

    // 注册resize回调
    this.renderer.onResize(() => this.handleResize())

    // 把 effectManager 移到最顶层（确保特效显示在所有 UI 之上）
    this.setChildIndex(effectManager, this.children.length - 1)

    // 处理队列中的内功高亮（第一回合的内功在 init 中触发，但那时 renderer 还没创建）
    this.pendingPassiveHighlights.forEach(({ characterId, passiveId }) => {
      const renderer = this.characterRenderers.get(characterId)
      renderer?.highlightPassive(passiveId)
    })
    this.pendingPassiveHighlights = []

    // 检查是否轮到 AI 行动
    this.checkAITurn()
  }

  /**
   * 初始化处理器
   */
  private initHandlers(): void {
    // 创建 UI 管理器 - 传入 this 作为 scene 引用
    this.uiManager = new BattleUIManager(this, this.renderer, this)

    // 创建布局管理器
    this.layoutManager = new BattleLayoutManager(this.renderer, this, this.characterRenderers)

    // 创建输入处理器 - 传入 this 作为 scene 引用
    this.inputHandler = new BattleInputHandler(this)

    // 创建 AI 处理器 - 传入 this 作为 scene 引用
    this.aiHandler = new BattleAIHandler(this)
  }

  onExit(): void {
    // 移除resize回调
    this.renderer.offResize(() => this.handleResize())
    // 移除事件监听器
    this.unregisterEventListeners()

    // 清理资源
    effectManager.destroy()
    tweenManager.clear()

    // 清理所有渲染器
    this.characterRenderers.forEach(renderer => {
      renderer.destroy()
    })

    // 移除特效管理器
    this.removeChild(effectManager)
    this.clear()
    this.playerConfigs = []
    this.enemyConfigs = []
    this.characterRenderers.clear()
    this.game = null
    this.ai = null
    this.isAIProcessing = false
    this.pendingPassiveHighlights = []
  }

  // 移除事件监听器
  private unregisterEventListeners(): void {
    eventManager.off(GameEventType.CHARACTER_DAMAGED, this.onCharacterDamaged)
    eventManager.off(GameEventType.CHARACTER_SHIELD, this.onCharacterShield)
    eventManager.off(GameEventType.TURN_START, this.onTurnStart)
    eventManager.off(GameEventType.CARD_DRAWN, this.onCardDrawn)
    eventManager.off(GameEventType.PASSIVE_TRIGGERED, this.onPassiveTriggered)
  }

  // 处理窗口resize
  private handleResize(): void {
    // 重新创建UI
    this.clear()
    this.uiManager?.createUI()
    this.createCharacterPanels()
    this.uiManager?.updateUI()
  }

  update(_delta: number): void {
    // 每帧检查是否轮到 AI 行动
    this.checkAITurn()
  }

  // 检查是否轮到 AI 行动
  private checkAITurn(): void {
    this.aiHandler?.checkAITurn()
  }

  // 注册事件监听器
  private registerEventListeners(): void {
    // 伤害事件
    eventManager.on(GameEventType.CHARACTER_DAMAGED, this.onCharacterDamaged.bind(this))
    // 护盾事件
    eventManager.on(GameEventType.CHARACTER_SHIELD, this.onCharacterShield.bind(this))
    // 回合开始事件
    eventManager.on(GameEventType.TURN_START, this.onTurnStart.bind(this))
    // 抽牌事件
    eventManager.on(GameEventType.CARD_DRAWN, this.onCardDrawn.bind(this))
    // 内功触发事件
    eventManager.on(GameEventType.PASSIVE_TRIGGERED, this.onPassiveTriggered.bind(this))
  }

  // 伤害事件回调
  private onCharacterDamaged(event: { data?: { character?: any; damage?: number } }): void {
    if (!this.game) return

    const character = event.data?.character
    const damage = event.data?.damage

    if (!character || !damage) return

    // 从 Map 中获取对应的渲染器
    const targetRenderer = this.characterRenderers.get(character.id)
    if (!targetRenderer) return

    // 计算伤害数字显示位置
    const panelCenterX = targetRenderer.x + LayoutConstants.panelWidth() / 2
    const panelCenterY = targetRenderer.y + LayoutConstants.portraitHeight() / 2

    // 播放特效（并行执行）
    effectManager.shakeCharacter(targetRenderer, 10, 300)
    effectManager.showDamageNumber(damage, panelCenterX, panelCenterY)
  }

  // 护盾事件回调
  private onCharacterShield(event: { data?: { character?: any; amount?: number } }): void {
    if (!this.game) return

    const character = event.data?.character
    const amount = event.data?.amount

    if (!character || !amount || amount <= 0) return

    // 从 Map 中获取对应的渲染器
    const targetRenderer = this.characterRenderers.get(character.id)
    if (!targetRenderer) return

    // 计算护盾数字显示位置
    const panelCenterX = targetRenderer.x + LayoutConstants.panelWidth() / 2
    const panelCenterY = targetRenderer.y + LayoutConstants.portraitHeight() / 2

    // 显示护盾数字
    effectManager.showShieldNumber(amount, panelCenterX, panelCenterY)
  }

  // 回合开始事件回调
  private onTurnStart(event: { data?: { turnNumber?: number } }): void {
    const turnNumber = event.data?.turnNumber
    if (!turnNumber) return

    // 清除之前的选择状态
    this.clearSelection()

    // 显示回合数字特效（屏幕上方居中）
    const size = this.renderer.getSize()
    this.showTurnNumberEffect(turnNumber, size.width / 2, size.height * 0.15)
  }

  // 抽牌事件回调
  private onCardDrawn(event: { data?: { character?: any; cards?: any[] } }): void {
    if (this.playerConfigs.length === 0) return

    const character = event.data?.character
    const cards = event.data?.cards

    // 只处理玩家队伍的抽牌动画
    const isPlayerTeam = this.playerConfigs.some(p => p === character)
    if (!isPlayerTeam || !cards) return

    // 记录需要动画的新牌ID（委托给 uiManager）
    cards.forEach(card => {
      this.uiManager?.addPendingDrawAnimation(card.instanceId)
    })
  }

  // 内功触发事件回调
  private onPassiveTriggered(event: { data?: { character?: any; passiveId?: string; passiveName?: string; trigger?: any } }): void {
    if (!this.game) return

    const character = event.data?.character
    const passiveId = event.data?.passiveId
    const passiveName = event.data?.passiveName
    const trigger = event.data?.trigger

    if (!character || !passiveId || !passiveName || !trigger) return

    // 从 Map 中获取对应的渲染器
    const targetRenderer = this.characterRenderers.get(character.id)

    // 如果 renderer 还没创建，加入队列延迟处理
    if (!targetRenderer) {
      this.pendingPassiveHighlights.push({ characterId: character.id, passiveId })
      return
    }

    // 调用 CharacterRenderer 的高亮方法
    targetRenderer.highlightPassive(passiveId)
  }

  // 显示回合开始特效
  private showTurnNumberEffect(turnNumber: number, x: number, y: number): void {
    const style = new TextStyle({
      fontSize: LayoutConstants.scaleValue(48),
      fill: Colors.TEXT_GOLD,
      fontWeight: 'bold'
    })
    const text = new Text(`第${turnNumber}回合`, style)
    text.x = x
    text.y = y
    text.anchor.set(0.5)
    text.alpha = 0
    this.addChild(text)

    // 淡入 → 缩放 → 淡出
    tweenManager.create(text, { alpha: 1 }, 200, Easing.easeOutQuad)
    tweenManager.create(text, { scaleX: 1.2, scaleY: 1.2 }, 200, Easing.easeOutBack)

    setTimeout(() => {
      tweenManager.create(text, { alpha: 0 }, 300, Easing.easeOutQuad, () => {
        this.removeChild(text)
      })
    }, 800)
  }

  // 创建角色面板
  private createCharacterPanels(): void {
    if (!this.game || !this.layoutManager) return

    const cardDims = getCardDimensions()
    const skillBtnHeight = LayoutConstants.skillBtnHeight()
    const buttonHeight = LayoutConstants.buttonHeight()
    const sidebarWidth = LayoutConstants.sidebarWidth()
    const bottomAreaHeight = cardDims.height + skillBtnHeight + buttonHeight + 50

    const allChars = this.game.getAllCharacters()
    const totalSeats = this.game.totalSeats
    const isMultiBattle = totalSeats > 2

    this.layoutManager.createCharacterPanels(
      allChars,
      bottomAreaHeight,
      sidebarWidth,
      isMultiBattle,
      this.isPlayerTeam.bind(this),
      (charId: string) => this.handleCharacterClick(charId)
    )
  }

  // 处理角色面板点击
  private handleCharacterClick(charId: string): void {
    if (this.game?.phase === GamePhase.SELECTING_TARGET) {
      this.inputHandler?.handleTargetClick(charId)
    }
  }

  // 处理卡牌点击（供 BattleUIManager 使用）
  public handleCardClick(cardRenderer: CardRenderer): void {
    this.inputHandler?.handleCardClick(cardRenderer)
  }

  // 处理技能点击（供 BattleUIManager 使用）
  public handleSkillClick(skillId: string): void {
    this.inputHandler?.handleSkillClick(skillId)
  }

  // 更新角色面板（不包含在 uiManager 中）
  public updateUI(): void {
    if (!this.game) return

    // 更新所有角色面板
    this.characterRenderers.forEach((renderer, charId) => {
      const char = this.game!.getAllCharacters().find(c => c.id === charId)
      if (char) {
        renderer.update(char)
      }
    })

    // 更新 UI（委托给 uiManager）
    this.uiManager?.updateUI()
  }

  // 判断角色是否属于玩家队伍
  // 判断角色是否由玩家控制
  public isPlayerControlled(char: CharacterState): boolean {
    return this.playerControlledId === char.id
  }

  // 判断角色是否属于玩家队伍（用于显示布局）
  public isPlayerTeam(char: CharacterState): boolean {
    return this.playerConfigs.some(p => p.id === char.id)
  }

  // 更新动作按钮状态 - 委托给 uiManager
  public updateActionButtons(): void {
    this.uiManager?.updateActionButtons()
  }

  // 更新技能按钮状态 - 委托给 uiManager
  public updateSkillButtons(): void {
    this.uiManager?.updateSkillButtons()
  }

  // 进入目标选择模式（供 BattleInputHandler 使用）
  public enterTargetSelection(skillId: string | null, cardInstanceId: string): void {
    if (!this.game) return

    const currentActor = this.game.currentActor
    if (!currentActor) return

    // 获取卡牌信息
    const card = currentActor.hand.find(c => c.instanceId === cardInstanceId)

    // 检查是否是纯防御卡牌（有护盾无伤害）
    if (card && card.baseShield > 0 && card.baseDamage === 0 && !skillId) {
      // 纯防御卡牌不需要选择目标，直接保存状态等待确认
      this.targetableIds = [currentActor.id]  // 目标是自己
      this.selectedTargetId = currentActor.id
      this.pendingSkillId = null
      this.pendingCardId = cardInstanceId
      this.updateTargetHighlights()
      return
    }

    // 获取攻击范围
    let range = 1  // 默认范围
    if (skillId) {
      const skill = currentActor.skills.find(s => s.id === skillId)
      range = skill?.range || 1
    } else if (card) {
      // 基础招式使用卡牌的攻击范围
      range = card.range
    }

    // 获取范围内的敌方目标（不含友方）
    const targets = this.game.getTargetsInRange(currentActor, range)

    if (targets.length === 0) {
      // 没有可用目标，取消操作
      this.clearSelection()
      return
    }

    if (targets.length === 1) {
      // 只有一个目标，保存状态等待确认（1v1模式）
      this.targetableIds = targets.map(t => t.id)
      this.selectedTargetId = targets[0].id
      this.pendingSkillId = skillId
      this.pendingCardId = cardInstanceId
      // 不切换到目标选择阶段，等待用户点击确认
      this.updateTargetHighlights()
      return
    }

    // 多个目标，进入目标选择模式
    this.targetableIds = targets.map(t => t.id)
    this.selectedTargetId = null
    this.pendingSkillId = skillId
    this.pendingCardId = cardInstanceId
    this.game.phase = GamePhase.SELECTING_TARGET

    // 更新UI显示高亮
    this.updateTargetHighlights()
    this.statusBar?.setPhase('选择目标')
  }

  // 更新目标高亮显示
  public updateTargetHighlights(): void {
    this.characterRenderers.forEach((renderer, charId) => {
      const isTargetable = this.targetableIds.includes(charId)
      const isTargeted = this.selectedTargetId === charId
      renderer.setTargetable(isTargetable)
      renderer.setTargeted(isTargeted)
    })
  }

  // 清除目标选择状态（供 BattleInputHandler 使用）
  public clearTargetSelection(): void {
    this.targetableIds = []
    this.selectedTargetId = null
    this.pendingSkillId = null
    this.pendingCardId = null
    this.updateTargetHighlights()
    this.clearSelection()
    if (this.game) {
      this.game.phase = GamePhase.SELECTING
    }
  }

  // 清空选择状态
  public clearSelection(): void {
    if (this.selectedCard) {
      this.selectedCard.setSelected(false)
      this.selectedCard = null
    }
    this.selectedSkill = null
    // 清除待执行状态
    this.targetableIds = []
    this.selectedTargetId = null
    this.pendingSkillId = null
    this.pendingCardId = null
    this.updateTargetHighlights()
    this.updateSkillButtons()
    this.updateActionButtons()
  }

  // 执行动作（供 BattleInputHandler 使用）
  public executeAction(skillId: string | null, cardInstanceId: string | null, targetId: string): void {
    if (skillId && cardInstanceId) {
      this.useSkill(skillId, cardInstanceId, targetId)
    } else if (cardInstanceId) {
      this.useBasicCard(cardInstanceId, targetId)
    }

    this.clearTargetSelection()
  }

  // 使用基础招式（供 BattleInputHandler 使用）
  private useBasicCard(cardInstanceId: string, targetId?: string): void {
    if (!this.game) return

    const result = this.game.useBasicCard(cardInstanceId, targetId)

    if (result.success) {
      this.uiManager?.updateUI()

      if (result.gameOver) {
        this.handleGameOver()
      }
    }
  }

  // 使用武功招式（供 BattleInputHandler 使用）
  private useSkill(skillId: string, cardInstanceId: string, targetId?: string): void {
    if (!this.game) return

    const result = this.game.useSkill(skillId, cardInstanceId, targetId)

    if (result.success) {
      this.uiManager?.updateUI()

      if (result.gameOver) {
        this.handleGameOver()
      }
    }
  }

  // 处理回合切换逻辑（供 BattleInputHandler 使用）
  public endTurn(): void {
    if (!this.game) return

    const currentActor = this.game.currentActor
    if (!currentActor || !this.isPlayerControlled(currentActor)) return

    // 清空当前行动者的轻功
    currentActor.agility = 0

    // 检查是否需要切换行动方
    if (this.game.shouldSwitchActor()) {
      this.game.switchActor()
      this.addLog(`轮到${this.game.currentActor!.name}行动`)
    }

    // 如果所有角色的轻功都耗尽，结束回合
    const allChars = this.game.getAllCharacters()
    const allAgilityDepleted = allChars.every(c => !c.isAlive() || c.agility <= 0)
    if (allAgilityDepleted) {
      this.game.endTurn()
    }

    this.uiManager?.updateUI()
  }

  // 处理游戏结束
  public handleGameOver(): void {
    if (this.isGameOver) return  // 防止重复调用
    this.isGameOver = true

    // 判断胜负：玩家队伍是否还有存活角色
    const playerWon = this.playerConfigs.some(p => p.isAlive())

    // 显示结果
    this.addLog(playerWon ? '你赢了！' : '你输了！')

    // 延迟后自动切换到结果场景
    setTimeout(() => {
      if (this.onBattleEnd) {
        this.onBattleEnd(playerWon)
      }
    }, 1500)
  }

  // 添加日志
  public addLog(message: string): void {
    this.battleLog?.addLog(message)
    if (this.game) {
      this.game.addLog(message)
    }
  }

  // 设置战斗结束回调
  setOnBattleEnd(callback: (playerWon: boolean) => void): void {
    this.onBattleEnd = callback
  }
}