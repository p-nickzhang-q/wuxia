import { Scene } from './Scene'
import { Renderer } from '../renderer/Renderer'
import { CardRenderer, getCardDimensions } from '../renderer/CardRenderer'
import { CharacterRenderer } from '../renderer/CharacterRenderer'
import { Button, SkillButton, BattleLog, StatusBar } from '../renderer/UIComponents'
import { createGame } from '../game/Game'
import { createCharacter } from '../game/Character'
import { AI } from '../game/AI'
import { characters, getCharacterMartialArts } from '../data/skills'
import { CharacterState, GamePhase, MartialArtSkill } from '../game/types'
import { LayoutConstants } from '../renderer/LayoutConstants'

// 战斗场景
export class BattleScene extends Scene {
  private playerConfig: CharacterState | null = null
  private enemyConfig: CharacterState | null = null
  private game: ReturnType<typeof createGame> | null = null
  private ai: AI | null = null

  // 渲染组件
  private playerRenderer: CharacterRenderer | null = null
  private enemyRenderer: CharacterRenderer | null = null
  private cardRenderers: CardRenderer[] = []
  private skillButtons: SkillButton[] = []
  private battleLog: BattleLog | null = null
  private statusBar: StatusBar | null = null
  private endTurnButton: Button | null = null
  private confirmButton: Button | null = null
  private cancelButton: Button | null = null

  // 交互状态
  private selectedCard: CardRenderer | null = null
  private selectedSkill: MartialArtSkill | null = null
  private isAIProcessing: boolean = false
  private isGameOver: boolean = false  // 防止重复处理游戏结束

  // 回调
  private onBattleEnd?: (playerWon: boolean) => void

  constructor(renderer: Renderer) {
    super(renderer)
  }

  // 初始化战斗
  init(playerCharacterId: string): void {
    // 创建玩家角色
    const playerMartialArts = getCharacterMartialArts(playerCharacterId)
    this.playerConfig = createCharacter(characters[playerCharacterId], playerMartialArts)

    // 随机选择敌人
    const characterKeys = Object.keys(characters).filter(k => k !== playerCharacterId)
    const randomKey = characterKeys[Math.floor(Math.random() * characterKeys.length)]
    const enemyMartialArts = getCharacterMartialArts(randomKey)
    this.enemyConfig = createCharacter(characters[randomKey], enemyMartialArts)

    // 创建游戏
    this.game = createGame()
    this.game.init(this.playerConfig, this.enemyConfig)

    // 创建 AI
    this.ai = new AI(this.game)

    // 重置状态
    this.isAIProcessing = false
    this.selectedCard = null
    this.isGameOver = false
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

    // 检查是否轮到 AI 行动
    this.checkAITurn()
  }

  onExit(): void {
    // 移除resize回调
    this.renderer.offResize(() => this.handleResize())
    this.clear()
    this.playerConfig = null
    this.enemyConfig = null
    this.game = null
    this.ai = null
    this.isAIProcessing = false
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
    if (this.game.currentActor !== this.game.enemy) return
    if (this.game.phase !== GamePhase.SELECTING) return

    this.handleAITurn()
  }

  // 创建 UI
  private createUI(): void {
    const size = this.renderer.getSize()
    const cardDims = getCardDimensions()
    const skillBtnHeight = LayoutConstants.skillBtnHeight()
    const buttonHeight = LayoutConstants.buttonHeight()

    // 计算底部操作区域高度
    const bottomAreaHeight = cardDims.height + skillBtnHeight + buttonHeight + 50

    // 状态栏 - 顶部居中
    const statusWidth = LayoutConstants.statusWidth()
    this.statusBar = new StatusBar(this.renderer)
    this.statusBar.x = size.width / 2 - statusWidth / 2
    this.statusBar.y = size.height * 0.02
    this.addChild(this.statusBar)

    // 战斗日志 - 顶部中央（状态栏下方）
    const logWidth = LayoutConstants.logWidth()
    this.battleLog = new BattleLog(this.renderer)
    this.battleLog.x = size.width / 2 - logWidth / 2
    this.battleLog.y = size.height * 0.02 + LayoutConstants.statusHeight() + 10
    this.addChild(this.battleLog)

    // 玩家面板 - 左下角
    this.playerRenderer = new CharacterRenderer(this.playerConfig!, false, this.renderer)
    const playerPanelSize = this.playerRenderer.getSize()
    const panelMarginH = size.width * 0.03  // 水平边距 3%
    this.playerRenderer.x = panelMarginH
    this.playerRenderer.y = size.height - playerPanelSize.height - bottomAreaHeight - 20
    this.addChild(this.playerRenderer)

    // 敌人面板 - 右下角（对称）
    this.enemyRenderer = new CharacterRenderer(this.enemyConfig!, true, this.renderer)
    const enemyPanelSize = this.enemyRenderer.getSize()
    this.enemyRenderer.x = size.width - enemyPanelSize.width - panelMarginH
    this.enemyRenderer.y = size.height - enemyPanelSize.height - bottomAreaHeight - 20
    this.addChild(this.enemyRenderer)

    // 结束回合按钮 - 右下角
    const endTurnBtnWidth = LayoutConstants.scaleValue(130)
    this.endTurnButton = new Button('结束回合', endTurnBtnWidth, buttonHeight, this.renderer)
    this.endTurnButton.x = size.width - endTurnBtnWidth - panelMarginH
    this.endTurnButton.y = size.height - buttonHeight - 15
    this.endTurnButton.setOnClick(() => this.handleEndTurn())
    this.addChild(this.endTurnButton)

    // 确认按钮 - 底部中央偏左
    const actionBtnWidth = LayoutConstants.scaleValue(100)
    this.confirmButton = new Button('确认', actionBtnWidth, buttonHeight, this.renderer)
    this.confirmButton.x = size.width / 2 - actionBtnWidth - 10
    this.confirmButton.y = size.height - buttonHeight - 15
    this.confirmButton.setOnClick(() => this.handleConfirm())
    this.addChild(this.confirmButton)

    // 取消按钮 - 底部中央偏右
    this.cancelButton = new Button('取消', actionBtnWidth, buttonHeight, this.renderer)
    this.cancelButton.x = size.width / 2 + 10
    this.cancelButton.y = size.height - buttonHeight - 15
    this.cancelButton.setOnClick(() => this.handleCancel())
    this.addChild(this.cancelButton)
  }

  // 更新 UI
  private updateUI(): void {
    if (!this.game) return

    // 更新状态栏
    this.statusBar?.setTurn(this.game.currentTurn)
    this.statusBar?.setPhase(this.getPhaseText())

    // 更新角色面板
    this.playerRenderer?.update(this.playerConfig!)
    this.enemyRenderer?.update(this.enemyConfig!)

    // 同步战斗日志到UI
    this.syncBattleLog()

    // 更新手牌
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

  // 更新确认/取消按钮状态
  private updateActionButtons(): void {
    const isPlayerTurn = this.game?.currentActor === this.game?.player &&
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

    if (!this.game || !this.playerConfig) return

    const size = this.renderer.getSize()
    const cardDims = getCardDimensions()
    const hand = this.playerConfig.hand
    const availableCards = this.playerConfig.getAvailableCards(this.playerConfig.agility)
    const availableIds = availableCards.map(c => c.instanceId)

    // 手牌在底部中央
    const cardSpacing = cardDims.width + LayoutConstants.cardSpacing()
    const totalWidth = hand.length * cardSpacing - LayoutConstants.cardSpacing()
    const startX = (size.width - totalWidth) / 2
    const y = size.height - cardDims.height - LayoutConstants.buttonHeight() - 25

    hand.forEach((card, index) => {
      const cardRenderer = new CardRenderer(card, this.renderer)
      const cardX = startX + index * cardSpacing
      const cardY = y
      cardRenderer.x = cardX
      cardRenderer.y = cardY
      cardRenderer.setBaseY(cardY)  // 设置基础Y位置

      // 设置是否可用
      const isAvailable = availableIds.includes(card.instanceId) &&
                         this.game!.currentActor === this.game!.player &&
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
  }

  // 更新技能按钮
  private updateSkillButtons(): void {
    // 清除旧的技能按钮
    this.skillButtons.forEach(btn => this.removeChild(btn))
    this.skillButtons = []

    if (!this.game || !this.playerConfig) return

    const skills = this.playerConfig.skills
    const size = this.renderer.getSize()
    const cardDims = getCardDimensions()
    const skillBtnWidth = LayoutConstants.skillBtnWidth()
    const skillBtnHeight = LayoutConstants.skillBtnHeight()

    // 技能按钮在底部手牌上方，居中显示
    const btnSpacing = skillBtnWidth + 10
    const totalWidth = skills.length * btnSpacing - 10
    const startX = (size.width - totalWidth) / 2
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
      const isPlayerTurn = this.game!.currentActor === this.game!.player &&
                          this.game!.phase !== GamePhase.GAME_OVER
      const hasEnoughMp = this.playerConfig!.mp >= skill.mpCost
      const hasEnoughAgility = this.playerConfig!.agility >= skill.agilityCost
      const hasMatchingCard = this.playerConfig!.hand.some(card =>
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
    if (!this.game || this.game.currentActor !== this.game.player) return

    // 如果已经选中这张卡，取消选中
    if (this.selectedCard === cardRenderer) {
      cardRenderer.setSelected(false)
      this.selectedCard = null
    } else {
      // 取消之前的选择
      if (this.selectedCard) {
        this.selectedCard.setSelected(false)
      }
      // 选中新卡牌
      cardRenderer.setSelected(true)
      this.selectedCard = cardRenderer
    }

    this.updateActionButtons()
  }

  // 处理技能点击
  private handleSkillClick(skillId: string): void {
    if (!this.game || this.game.currentActor !== this.game.player) return

    const skill = this.playerConfig?.skills.find(s => s.id === skillId)
    if (!skill) return

    // 如果已经选中这个技能，取消选中
    if (this.selectedSkill && this.selectedSkill.id === skillId) {
      this.selectedSkill = null
    } else {
      // 选中新技能
      this.selectedSkill = skill
    }

    this.updateSkillButtons()
    this.updateActionButtons()
  }

  // 处理确认
  private handleConfirm(): void {
    if (!this.game || !this.selectedCard) return

    const card = this.selectedCard.getCard()

    if (this.selectedSkill) {
      // 使用武功招式
      const typeMatch = this.selectedSkill.requiredCardType === 'any' || card.type === this.selectedSkill.requiredCardType
      if (typeMatch) {
        this.useSkill(this.selectedSkill.id, card.instanceId)
      }
    } else {
      // 使用基础招式
      this.useBasicCard(card.instanceId)
    }

    // 清空选择
    this.clearSelection()
  }

  // 处理取消
  private handleCancel(): void {
    this.clearSelection()
  }

  // 清空选择状态
  private clearSelection(): void {
    if (this.selectedCard) {
      this.selectedCard.setSelected(false)
      this.selectedCard = null
    }
    this.selectedSkill = null
    this.updateSkillButtons()
    this.updateActionButtons()
  }

  // 使用基础招式
  private useBasicCard(cardInstanceId: string): void {
    if (!this.game) return

    const result = this.game.useBasicCard(cardInstanceId)

    if (result.success) {
      this.updateUI()

      if (result.gameOver) {
        this.handleGameOver()
      }
    }
  }

  // 使用武功招式
  private useSkill(skillId: string, cardInstanceId: string): void {
    if (!this.game) return

    const result = this.game.useSkill(skillId, cardInstanceId)

    if (result.success) {
      this.updateUI()

      if (result.gameOver) {
        this.handleGameOver()
      }
    }
  }

  // 处理结束回合
  private handleEndTurn(): void {
    if (!this.game || this.game.currentActor !== this.game.player) return

    // 清空当前行动者的轻功
    this.playerConfig!.agility = 0

    // 检查是否需要切换行动方
    if (this.game.shouldSwitchActor()) {
      this.game.switchActor()
      this.addLog(`轮到${this.game.currentActor!.name}行动`)
    }

    // 如果双方都没有轻功了，结束回合
    if (this.playerConfig!.agility <= 0 && this.enemyConfig!.agility <= 0) {
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

    const enemy = this.game.enemy!
    const player = this.game.player!

    // 检查是否可以继续行动
    if (enemy.agility <= 0 || !enemy.isAlive() || !player.isAlive()) {
      this.finishAITurn()
      return
    }

    // 获取可用行动
    const action = this.ai.decideAction()

    if (!action) {
      this.game.addLog(`${enemy.name}没有可用的招式`)
      this.finishAITurn()
      return
    }

    // 执行行动
    if (action.type === 'skill' && action.skillId) {
      this.game.useSkill(action.skillId, action.cardId)
    } else {
      this.game.useBasicCard(action.cardId)
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

    const playerWon = this.playerConfig?.isAlive() ?? false

    // 显示结果
    this.addLog(playerWon ? '你赢了！' : '你输了！')

    // 创建重新开始按钮
    const size = this.renderer.getSize()
    const btnWidth = LayoutConstants.scaleValue(180)
    const btnHeight = LayoutConstants.scaleValue(60)
    const restartBtn = new Button('重新开始', btnWidth, btnHeight, this.renderer)
    restartBtn.x = size.width / 2 - btnWidth / 2
    restartBtn.y = size.height / 2
    restartBtn.setOnClick(() => {
      if (this.onBattleEnd) {
        this.onBattleEnd(playerWon)
      }
    })
    this.addChild(restartBtn)
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

    if (this.game.currentActor === this.game.player) {
      return '你的回合'
    } else {
      return '敌方回合'
    }
  }

  // 设置战斗结束回调
  setOnBattleEnd(callback: (playerWon: boolean) => void): void {
    this.onBattleEnd = callback
  }
}