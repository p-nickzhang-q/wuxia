import { Scene } from './Scene'
import { Renderer, Colors } from '../renderer/Renderer'
import { CardRenderer, getCardDimensions } from '../renderer/CardRenderer'
import { CharacterRenderer } from '../renderer/CharacterRenderer'
import { Button, SkillButton, BattleLog, StatusBar, VerticalAgilityAxis } from '../renderer/UIComponents'
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

// 战斗场景
export class BattleScene extends Scene {
  // 多人战斗配置
  private playerConfigs: CharacterState[] = []
  private enemyConfigs: CharacterState[] = []

  private game: ReturnType<typeof createGame> | null = null
  private ai: AI | null = null

  // 渲染组件 - 多人支持
  private characterRenderers: Map<string, CharacterRenderer> = new Map()

  private cardRenderers: CardRenderer[] = []
  private skillButtons: SkillButton[] = []
  private battleLog: BattleLog | null = null
  private statusBar: StatusBar | null = null
  private agilityAxis: VerticalAgilityAxis | null = null
  private endTurnButton: Button | null = null
  private confirmButton: Button | null = null
  private cancelButton: Button | null = null

  // 交互状态
  private selectedCard: CardRenderer | null = null
  private selectedSkill: MartialArtSkill | null = null
  private isAIProcessing: boolean = false
  private isGameOver: boolean = false  // 防止重复处理游戏结束

  // 目标选择状态
  private targetableIds: string[] = []           // 可选目标ID列表
  private selectedTargetId: string | null = null // 已选中目标ID
  private pendingSkillId: string | null = null   // 待执行的武功ID
  private pendingCardId: string | null = null    // 待执行的卡牌ID

  // 抽牌动画相关
  private isFirstHandUpdate: boolean = true // 是否是首次更新手牌
  private pendingDrawAnimations: string[] = [] // 待动画的新牌ID

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
    this.isFirstHandUpdate = true
    this.pendingDrawAnimations = []
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

    this.isAIProcessing = false
    this.selectedCard = null
    this.selectedSkill = null
    this.isGameOver = false
    this.createUI()
    this.updateUI()

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

  onExit(): void {
    // 移除resize回调
    this.renderer.offResize(() => this.handleResize())
    // 移除事件监听器
    this.unregisterEventListeners()
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
    this.createUI()
    this.updateUI()
  }

  update(_delta: number): void {
    // 每帧检查是否轮到 AI 行动
    this.checkAITurn()
  }

  // 检查是否轮到 AI 行动
  private checkAITurn(): void {
    if (!this.game) return
    if (this.isAIProcessing) return

    // 如果玩家有待确认的动作，不触发AI
    if (this.pendingCardId) return

    const currentActor = this.game.currentActor
    // 判断当前行动者是否由玩家控制（AI控制所有非玩家角色，包括队友）
    if (!currentActor || this.isPlayerControlled(currentActor)) return
    if (this.game.phase !== GamePhase.SELECTING) return

    this.handleAITurn()
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

    // 记录需要动画的新牌ID
    cards.forEach(card => {
      this.pendingDrawAnimations.push(card.instanceId)
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

  // 创建 UI
  private createUI(): void {
    const size = this.renderer.getSize()
    const cardDims = getCardDimensions()
    const skillBtnHeight = LayoutConstants.skillBtnHeight()
    const buttonHeight = LayoutConstants.buttonHeight()

    // 右侧边栏宽度
    const sidebarWidth = LayoutConstants.sidebarWidth()

    // 计算底部操作区域高度
    const bottomAreaHeight = cardDims.height + skillBtnHeight + buttonHeight + 50

    // 状态栏 - 顶部居中（避开右侧边栏）
    const statusWidth = LayoutConstants.statusWidth()
    this.statusBar = new StatusBar(this.renderer)
    this.statusBar.x = (size.width - sidebarWidth) / 2 - statusWidth / 2
    this.statusBar.y = size.height * 0.02
    this.addChild(this.statusBar)

    // 右侧边栏 - 战斗日志 + 竖向轻功轴
    const sidebarX = size.width - sidebarWidth

    // 战斗日志 - 右侧边栏上半部分
    const logWidth = LayoutConstants.logWidth()
    const logHeight = LayoutConstants.logHeight()
    this.battleLog = new BattleLog(this.renderer)
    this.battleLog.x = sidebarX + (sidebarWidth - logWidth) / 2
    this.battleLog.y = size.height * 0.02
    this.addChild(this.battleLog)

    // 竖向轻功轴 - 右侧边栏下半部分（战斗日志下方）
    const axisWidth = LayoutConstants.agilityAxisWidth()
    this.agilityAxis = new VerticalAgilityAxis(this.renderer)
    this.agilityAxis.x = sidebarX + (sidebarWidth - axisWidth) / 2
    this.agilityAxis.y = size.height * 0.02 + logHeight + 15
    this.addChild(this.agilityAxis)

    // 创建角色面板 - 左侧区域
    this.createCharacterPanels(bottomAreaHeight, sidebarWidth)

    // 结束回合按钮 - 右下角（边栏下方）
    const panelMarginH = size.width * 0.02
    const endTurnBtnWidth = LayoutConstants.scaleValue(130)
    this.endTurnButton = new Button('结束回合', endTurnBtnWidth, buttonHeight, this.renderer)
    this.endTurnButton.x = size.width - sidebarWidth - endTurnBtnWidth - panelMarginH
    this.endTurnButton.y = size.height - buttonHeight - 15
    this.endTurnButton.setOnClick(() => this.handleEndTurn())
    this.addChild(this.endTurnButton)

    // 确认按钮 - 底部中央偏左
    const actionBtnWidth = LayoutConstants.scaleValue(100)
    this.confirmButton = new Button('确认', actionBtnWidth, buttonHeight, this.renderer)
    this.confirmButton.x = (size.width - sidebarWidth) / 2 - actionBtnWidth - 10
    this.confirmButton.y = size.height - buttonHeight - 15
    this.confirmButton.setOnClick(() => this.handleConfirm())
    this.addChild(this.confirmButton)

    // 取消按钮 - 底部中央偏右
    this.cancelButton = new Button('取消', actionBtnWidth, buttonHeight, this.renderer)
    this.cancelButton.x = (size.width - sidebarWidth) / 2 + 10
    this.cancelButton.y = size.height - buttonHeight - 15
    this.cancelButton.setOnClick(() => this.handleCancel())
    this.addChild(this.cancelButton)
  }

  // 创建角色面板（左侧区域布局）
  private createCharacterPanels(bottomAreaHeight: number, sidebarWidth: number): void {
    if (!this.game) return

    const allChars = this.game.getAllCharacters()
    const totalSeats = this.game.totalSeats
    const size = this.renderer.getSize()

    // 可用区域（去掉右侧边栏）
    const availableWidth = size.width - sidebarWidth

    // 根据人数选择布局
    if (totalSeats === 2) {
      // 1v1 使用较大面板，左右布局
      this.createTraditionalLayout(bottomAreaHeight, sidebarWidth)
      return
    }

    // 多人模式使用缩小面板，左右两侧分布
    const panelWidth = LayoutConstants.smallPanelWidth()
    const panelHeight = LayoutConstants.smallPortraitHeight() + 70  // 立绘 + 状态区
    const panelSpacing = 15

    // 分离玩家队伍和敌人队伍
    const players = allChars.filter(c => this.isPlayerTeam(c))
    const enemies = allChars.filter(c => !this.isPlayerTeam(c))

    // 计算左侧玩家队伍布局
    const leftX = 20
    const leftStartY = (size.height - bottomAreaHeight - (players.length * (panelHeight + panelSpacing) - panelSpacing)) / 2

    players.forEach((char, index) => {
      const renderer = new CharacterRenderer(char, false, this.renderer, true)  // 小面板
      renderer.x = leftX
      renderer.y = leftStartY + index * (panelHeight + panelSpacing)
      this.setupCharacterRendererClick(renderer, char.id)
      this.addChild(renderer)
      this.characterRenderers.set(char.id, renderer)
    })

    // 计算右侧敌人队伍布局（边栏左侧）
    const rightX = availableWidth - panelWidth - 20
    const rightStartY = (size.height - bottomAreaHeight - (enemies.length * (panelHeight + panelSpacing) - panelSpacing)) / 2

    enemies.forEach((char, index) => {
      const renderer = new CharacterRenderer(char, true, this.renderer, true)  // 小面板
      renderer.x = rightX
      renderer.y = rightStartY + index * (panelHeight + panelSpacing)
      this.setupCharacterRendererClick(renderer, char.id)
      this.addChild(renderer)
      this.characterRenderers.set(char.id, renderer)
    })
  }

  // 设置角色面板点击事件
  private setupCharacterRendererClick(renderer: CharacterRenderer, charId: string): void {
    renderer.eventMode = 'static'
    renderer.cursor = 'pointer'
    renderer.on('pointerdown', () => {
      if (this.game?.phase === GamePhase.SELECTING_TARGET) {
        this.handleTargetClick(charId)
      }
    })
  }

  // 传统 1v1 左右布局
  private createTraditionalLayout(bottomAreaHeight: number, sidebarWidth: number): void {
    if (!this.game) return

    const size = this.renderer.getSize()
    const allChars = this.game.getAllCharacters()
    const availableWidth = size.width - sidebarWidth

    // 玩家在左边，敌人在右边
    const player = this.playerConfigs[0]
    const enemy = this.enemyConfigs[0]

    const panelMarginH = availableWidth * 0.05

    // 先创建所有渲染器，获取尺寸
    const renderers: Map<string, { renderer: CharacterRenderer; char: CharacterState }> = new Map()
    let maxPanelHeight = 0

    allChars.forEach(char => {
      const isEnemy = char.battlePosition?.team === 'enemy'
      const renderer = new CharacterRenderer(char, isEnemy, this.renderer, false)  // 正常大小
      const panelSize = renderer.getSize()
      maxPanelHeight = Math.max(maxPanelHeight, panelSize.height)
      renderers.set(char.id, { renderer, char })
    })

    // 使用最大高度计算统一的 Y 坐标（底部对齐）
    const baseY = size.height - maxPanelHeight - bottomAreaHeight - 20

    renderers.forEach(({ renderer, char }) => {
      const panelSize = renderer.getSize()

      if (char === player) {
        // 玩家在左边
        renderer.x = panelMarginH
        renderer.y = baseY
      } else if (char === enemy) {
        // 敌人在右边（边栏左侧）
        renderer.x = availableWidth - panelSize.width - panelMarginH
        renderer.y = baseY
      }

      this.setupCharacterRendererClick(renderer, char.id)
      this.addChild(renderer)
      this.characterRenderers.set(char.id, renderer)
    })
  }

  // 更新 UI
  private updateUI(): void {
    if (!this.game) return

    // 更新状态栏
    this.statusBar?.setTurn(this.game.currentTurn)
    this.statusBar?.setPhase(this.getPhaseText())

    // 更新所有角色面板
    this.characterRenderers.forEach((renderer, charId) => {
      const char = this.game!.getAllCharacters().find(c => c.id === charId)
      if (char) {
        renderer.update(char)
      }
    })

    // 更新轻功轴（多人模式下简化显示）
    this.updateAgilityAxis()

    // 同步战斗日志到UI
    this.syncBattleLog()

    // 更新手牌（只显示当前行动玩家队伍的手牌）
    this.updateHandCards()

    // 更新技能按钮
    this.updateSkillButtons()

    // 更新确认/取消按钮状态
    this.updateActionButtons()

    // 检查游戏结束
    if (this.game.phase === GamePhase.GAME_OVER) {
      this.handleGameOver()
    }
  }

  // 更新轻功轴（竖向显示所有角色）
  private updateAgilityAxis(): void {
    if (!this.agilityAxis || !this.game) return

    // 获取所有存活角色
    const allChars = this.game.getAllCharacters()
    const currentActor = this.game.currentActor

    // 准备角色数据
    const charData = allChars
      .filter(c => c.isAlive())
      .map(c => ({
        id: c.id,
        name: c.name,
        agility: c.agility,
        isPlayer: this.isPlayerTeam(c),
        isAlive: c.isAlive()
      }))

    this.agilityAxis.update(charData, currentActor?.id || null)
  }

  // 判断角色是否属于玩家队伍
  // 判断角色是否由玩家控制
  private isPlayerControlled(char: CharacterState): boolean {
    return this.playerControlledId === char.id
  }

  // 判断角色是否属于玩家队伍（用于显示布局）
  private isPlayerTeam(char: CharacterState): boolean {
    return this.playerConfigs.some(p => p.id === char.id)
  }

  // 更新确认/取消按钮状态
  private updateActionButtons(): void {
    const currentActor = this.game?.currentActor
    const isPlayerTurn = currentActor && this.isPlayerControlled(currentActor) &&
                         this.game?.phase !== GamePhase.GAME_OVER

    // 确认按钮：只有选中手牌时才可用
    const canConfirm = isPlayerTurn && this.selectedCard !== null
    this.confirmButton?.setDisabled(!canConfirm)

    // 取消按钮：有选中状态时才可用
    const canCancel = isPlayerTurn && (this.selectedCard !== null || this.selectedSkill !== null)
    this.cancelButton?.setDisabled(!canCancel)
  }

  // 同步战斗日志
  private syncBattleLog(): void {
    if (!this.game || !this.battleLog) return

    // 获取最新的几条日志
    const logs = this.game.battleLog
    const uiLogs = this.battleLog.getLogCount()

    // 如果有新日志，添加到UI
    if (logs.length > uiLogs) {
      for (let i = uiLogs; i < logs.length; i++) {
        this.battleLog.syncLog(logs[i].text)
      }
    }
  }

  // 更新手牌显示
  private updateHandCards(): void {
    // 保存当前选中的卡牌ID
    const selectedCardId = this.selectedCard?.getCard().instanceId

    // 清除旧的手牌
    this.cardRenderers.forEach(card => this.removeChild(card))
    this.cardRenderers = []

    if (!this.game) return

    // 只显示当前行动角色的手牌（如果是玩家控制的角色）
    const currentActor = this.game.currentActor
    if (!currentActor || !this.isPlayerControlled(currentActor)) return

    const size = this.renderer.getSize()
    const cardDims = getCardDimensions()
    const hand = currentActor.hand
    const availableCards = currentActor.getAvailableCards(currentActor.agility)
    const availableIds = availableCards.map(c => c.instanceId)

    // 右侧边栏宽度
    const sidebarWidth = LayoutConstants.sidebarWidth()
    const availableWidth = size.width - sidebarWidth

    // 手牌在底部中央（避开右侧边栏）
    const cardSpacing = cardDims.width + LayoutConstants.cardSpacing()
    const totalWidth = hand.length * cardSpacing - LayoutConstants.cardSpacing()
    const startX = availableWidth / 2 - totalWidth / 2
    const y = size.height - cardDims.height - LayoutConstants.buttonHeight() - 25

    // 牌堆位置（屏幕中央，避开边栏）
    const deckX = availableWidth / 2
    const deckY = size.height / 2

    hand.forEach((card, index) => {
      const cardRenderer = new CardRenderer(card, this.renderer)
      const cardX = startX + index * cardSpacing
      const cardY = y

      // 检查是否需要抽牌动画（首次更新或待动画列表中的牌）
      const needsAnimation = this.isFirstHandUpdate || this.pendingDrawAnimations.includes(card.instanceId)

      if (needsAnimation) {
        // 从牌堆位置开始
        cardRenderer.x = deckX
        cardRenderer.y = deckY
        cardRenderer.alpha = 0

        // 延迟动画，让每张牌依次飞入
        const delay = index * 100 // 张牌延迟100ms
        setTimeout(() => {
          tweenManager.create(cardRenderer, { x: cardX, y: cardY, alpha: 1 }, 300, Easing.easeOutQuad)
        }, delay)
      } else {
        cardRenderer.x = cardX
        cardRenderer.y = cardY
      }

      cardRenderer.setBaseY(cardY)  // 设置基础Y位置

      // 设置是否可用
      const isAvailable = availableIds.includes(card.instanceId) &&
                         this.isPlayerControlled(currentActor) &&
                         this.game!.phase !== GamePhase.GAME_OVER
      cardRenderer.setPlayable(isAvailable)

      // 恢复选中状态
      if (card.instanceId === selectedCardId) {
        cardRenderer.setSelected(true)
        this.selectedCard = cardRenderer
      }

      // 设置点击回调
      cardRenderer.setOnClick(() => this.handleCardClick(cardRenderer))

      this.addChild(cardRenderer)
      this.cardRenderers.push(cardRenderer)
    })

    // 清空待动画列表，标记首次更新完成
    this.pendingDrawAnimations = []
    this.isFirstHandUpdate = false
  }

  // 更新技能按钮
  private updateSkillButtons(): void {
    // 清除旧的技能按钮
    this.skillButtons.forEach(btn => this.removeChild(btn))
    this.skillButtons = []

    if (!this.game) return

    // 只显示当前行动角色的技能（如果是玩家控制的角色）
    const currentActor = this.game.currentActor
    if (!currentActor || !this.isPlayerControlled(currentActor)) return

    const skills = currentActor.skills
    const size = this.renderer.getSize()
    const cardDims = getCardDimensions()
    const skillBtnWidth = LayoutConstants.skillBtnWidth()
    const skillBtnHeight = LayoutConstants.skillBtnHeight()

    // 右侧边栏宽度
    const sidebarWidth = LayoutConstants.sidebarWidth()
    const availableWidth = size.width - sidebarWidth

    // 技能按钮在底部手牌上方，居中显示（避开右侧边栏）
    const btnSpacing = skillBtnWidth + 10
    const totalWidth = skills.length * btnSpacing - 10
    const startX = availableWidth / 2 - totalWidth / 2
    const y = size.height - cardDims.height - skillBtnHeight - LayoutConstants.buttonHeight() - 40

    skills.forEach((skill, index) => {
      const btn = new SkillButton(
        skill.id,
        skill.name,
        skill.mpCost,
        skill.agilityCost,
        skill.description,
        this.renderer
      )
      btn.x = startX + index * btnSpacing
      btn.y = y

      // 判断技能是否可用
      const isPlayerTurn = this.isPlayerControlled(currentActor) &&
                          this.game!.phase !== GamePhase.GAME_OVER
      const hasEnoughMp = currentActor.mp >= skill.mpCost
      const hasEnoughAgility = currentActor.agility >= skill.agilityCost
      const hasMatchingCard = currentActor.hand.some(card =>
        skill.requiredCardType === 'any' || card.type === skill.requiredCardType
      )
      const isAvailable = isPlayerTurn && hasEnoughMp && hasEnoughAgility && hasMatchingCard

      btn.setAvailable(isAvailable)

      // 设置选中状态
      if (this.selectedSkill && this.selectedSkill.id === skill.id) {
        btn.setSelected(true)
      }

      // 设置点击回调（即使不可用也可以点击选中）
      btn.setOnClick((skillId) => this.handleSkillClick(skillId))

      this.addChild(btn)
      this.skillButtons.push(btn)
    })
  }

  // 处理卡牌点击
  private handleCardClick(cardRenderer: CardRenderer): void {
    if (!this.game) return

    const currentActor = this.game.currentActor
    if (!currentActor || !this.isPlayerControlled(currentActor)) return

    // 如果在目标选择阶段，点击卡牌取消目标选择
    if (this.game.phase === GamePhase.SELECTING_TARGET) {
      this.clearTargetSelection()
    }

    // 如果已经选中这张卡，取消选中
    if (this.selectedCard === cardRenderer) {
      cardRenderer.setSelected(false)
      this.selectedCard = null
      // 清除目标选择状态
      this.targetableIds = []
      this.selectedTargetId = null
      this.pendingSkillId = null
      this.pendingCardId = null
      this.updateTargetHighlights()
    } else {
      // 取消之前的选择
      if (this.selectedCard) {
        this.selectedCard.setSelected(false)
      }
      // 选中新卡牌
      cardRenderer.setSelected(true)
      this.selectedCard = cardRenderer

      // 选中后直接进入目标选择模式
      const card = cardRenderer.getCard()
      if (this.selectedSkill) {
        // 使用武功招式 - 进入目标选择
        const typeMatch = this.selectedSkill.requiredCardType === 'any' || card.type === this.selectedSkill.requiredCardType
        if (typeMatch) {
          this.enterTargetSelection(this.selectedSkill.id, card.instanceId)
        }
      } else {
        // 使用基础招式 - 进入目标选择
        this.enterTargetSelection(null, card.instanceId)
      }
    }

    this.updateActionButtons()
  }

  // 处理技能点击
  private handleSkillClick(skillId: string): void {
    if (!this.game) return

    const currentActor = this.game.currentActor
    if (!currentActor || !this.isPlayerControlled(currentActor)) return

    const skill = currentActor.skills.find(s => s.id === skillId)
    if (!skill) return

    // 如果在目标选择阶段，点击技能取消目标选择
    if (this.game.phase === GamePhase.SELECTING_TARGET) {
      this.clearTargetSelection()
    }

    // 如果已经选中这个技能，取消选中
    if (this.selectedSkill && this.selectedSkill.id === skillId) {
      this.selectedSkill = null
    } else {
      // 选中新技能
      this.selectedSkill = skill

      // 如果已有选中的手牌，直接进入目标选择
      if (this.selectedCard) {
        const card = this.selectedCard.getCard()
        const typeMatch = skill.requiredCardType === 'any' || card.type === skill.requiredCardType
        if (typeMatch) {
          this.enterTargetSelection(skill.id, card.instanceId)
        }
      }
    }

    this.updateSkillButtons()
    this.updateActionButtons()
  }

  // 处理确认
  private handleConfirm(): void {
    if (!this.game) return

    // 如果在目标选择阶段，确认目标
    if (this.game.phase === GamePhase.SELECTING_TARGET) {
      this.confirmTarget()
      return
    }

    // 如果已有待执行的动作（1v1模式，选中手牌后设置了pendingCardId）
    if (this.pendingCardId && this.selectedTargetId) {
      this.executeAction(this.pendingSkillId, this.pendingCardId, this.selectedTargetId)
      return
    }

    // 兼容旧流程：如果没有 pendingCardId，进入目标选择
    if (!this.selectedCard) return

    const card = this.selectedCard.getCard()

    if (this.selectedSkill) {
      // 使用武功招式 - 进入目标选择
      const typeMatch = this.selectedSkill.requiredCardType === 'any' || card.type === this.selectedSkill.requiredCardType
      if (typeMatch) {
        this.enterTargetSelection(this.selectedSkill.id, card.instanceId)
      }
    } else {
      // 使用基础招式
      this.enterTargetSelection(null, card.instanceId)
    }
  }

  // 进入目标选择模式
  private enterTargetSelection(skillId: string | null, cardInstanceId: string): void {
    if (!this.game) return

    const currentActor = this.game.currentActor
    if (!currentActor) return

    // 获取攻击范围
    let range = 1  // 基础招式默认范围
    if (skillId) {
      const skill = currentActor.skills.find(s => s.id === skillId)
      range = skill?.range || 1
    }

    // 获取范围内目标
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

  // 处理目标点击
  private handleTargetClick(targetId: string): void {
    if (this.game?.phase !== GamePhase.SELECTING_TARGET) return
    if (!this.targetableIds.includes(targetId)) return

    // 选中目标（等待确认）
    this.selectedTargetId = targetId
    this.updateTargetHighlights()
  }

  // 确认目标选择
  private confirmTarget(): void {
    if (!this.selectedTargetId) return

    this.executeAction(this.pendingSkillId, this.pendingCardId, this.selectedTargetId)
  }

  // 执行动作
  private executeAction(skillId: string | null, cardInstanceId: string | null, targetId: string): void {
    if (skillId && cardInstanceId) {
      this.useSkill(skillId, cardInstanceId, targetId)
    } else if (cardInstanceId) {
      this.useBasicCard(cardInstanceId, targetId)
    }

    this.clearTargetSelection()
  }

  // 更新目标高亮显示
  private updateTargetHighlights(): void {
    this.characterRenderers.forEach((renderer, charId) => {
      const isTargetable = this.targetableIds.includes(charId)
      const isTargeted = this.selectedTargetId === charId
      renderer.setTargetable(isTargetable)
      renderer.setTargeted(isTargeted)
    })
  }

  // 清除目标选择状态
  private clearTargetSelection(): void {
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

  // 处理取消
  private handleCancel(): void {
    if (this.game?.phase === GamePhase.SELECTING_TARGET) {
      // 取消目标选择
      this.clearTargetSelection()
    } else {
      this.clearSelection()
    }
  }

  // 清空选择状态
  private clearSelection(): void {
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

  // 使用基础招式
  private useBasicCard(cardInstanceId: string, targetId?: string): void {
    if (!this.game) return

    const result = this.game.useBasicCard(cardInstanceId, targetId)

    if (result.success) {
      this.updateUI()

      if (result.gameOver) {
        this.handleGameOver()
      }
    }
  }

  // 使用武功招式
  private useSkill(skillId: string, cardInstanceId: string, targetId?: string): void {
    if (!this.game) return

    const result = this.game.useSkill(skillId, cardInstanceId, targetId)

    if (result.success) {
      this.updateUI()

      if (result.gameOver) {
        this.handleGameOver()
      }
    }
  }

  // 处理结束回合
  private handleEndTurn(): void {
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

    this.updateUI()
  }

  // 处理 AI 回合
  private handleAITurn(): void {
    if (!this.ai || !this.game || this.isAIProcessing) return

    this.isAIProcessing = true
    this.statusBar?.setPhase('敌方行动中...')

    // 使用 setTimeout 避免异步问题
    this.runAI()
  }

  private runAI(): void {
    if (!this.ai || !this.game) return

    const currentActor = this.game.currentActor!

    // 检查是否可以继续行动
    if (currentActor.agility <= 0 || !currentActor.isAlive()) {
      this.finishAITurn()
      return
    }

    // 获取存活的敌人（玩家队伍）
    const alivePlayerTeam = this.playerConfigs.filter(c => c.isAlive())
    if (alivePlayerTeam.length === 0) {
      this.finishAITurn()
      return
    }

    // 获取可用行动
    const action = this.ai.decideAction()

    if (!action) {
      this.game.addLog(`${currentActor.name}没有可用的招式`)
      this.finishAITurn()
      return
    }

    // 执行行动
    if (action.type === 'skill' && action.skillId) {
      this.game.useSkill(action.skillId, action.cardId, action.targetId)
    } else {
      this.game.useBasicCard(action.cardId, action.targetId)
    }

    // 更新 UI
    this.updateUI()

    // 检查游戏结束
    if (this.game.phase === GamePhase.GAME_OVER) {
      this.isAIProcessing = false
      this.handleGameOver()
      return
    }

    // 检查是否切换行动方
    if (this.game.shouldSwitchActor()) {
      this.finishAITurn()
      return
    }

    // 继续下一个行动
    setTimeout(() => this.runAI(), 600)
  }

  private finishAITurn(): void {
    if (!this.game) return

    if (this.game.phase !== GamePhase.GAME_OVER) {
      if (this.game.shouldSwitchActor()) {
        this.game.switchActor()
        this.game.addLog(`轮到${this.game.currentActor!.name}行动`)
        this.game.phase = GamePhase.SELECTING
        // 清除之前的选择状态
        this.clearSelection()
      } else {
        this.game.endTurn()
      }
    }

    this.isAIProcessing = false
    this.updateUI()

    if (this.game.phase === GamePhase.GAME_OVER) {
      this.handleGameOver()
    }
  }

  // 处理游戏结束
  private handleGameOver(): void {
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
  private addLog(message: string): void {
    this.battleLog?.addLog(message)
    if (this.game) {
      this.game.addLog(message)
    }
  }

  // 获取阶段文本
  private getPhaseText(): string {
    if (!this.game) return ''

    if (this.game.phase === GamePhase.SETUP) return '准备中'
    if (this.game.phase === GamePhase.GAME_OVER) return '战斗结束'

    const currentActor = this.game.currentActor
    if (currentActor && this.isPlayerControlled(currentActor)) {
      return `${currentActor.name}的回合`
    } else if (currentActor) {
      return `${currentActor.name}行动中`
    } else {
      return ''
    }
  }

  // 设置战斗结束回调
  setOnBattleEnd(callback: (playerWon: boolean) => void): void {
    this.onBattleEnd = callback
  }
}