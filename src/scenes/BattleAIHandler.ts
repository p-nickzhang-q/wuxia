import { AI } from '../game/AI'
import { CharacterState, GamePhase } from '../game/types'

/**
 * 战斗 AI 处理器
 * 管理 AI 角色的行动逻辑
 *
 * 直接依赖 BattleScene 的成员和方法
 */
export class BattleAIHandler {
  private scene: {
    game: ReturnType<typeof import('../game/Game').createGame> | null
    ai: AI | null
    isAIProcessing: boolean
    playerConfigs: CharacterState[]
    isPlayerControlled: (char: CharacterState) => boolean
    pendingCardId: string | null
    updateUI: () => void
    handleGameOver: () => void
    addLog: (message: string) => void
    statusBar: { setPhase: (phase: string) => void } | null
    clearSelection: () => void
  }

  constructor(scene: typeof BattleAIHandler.prototype.scene) {
    this.scene = scene
  }

  /**
   * 检查是否轮到 AI 行动
   */
  checkAITurn(): void {
    if (!this.scene.game) return
    if (this.scene.isAIProcessing) return

    // 如果玩家有待确认的动作，不触发AI
    if (this.scene.pendingCardId) return

    const currentActor = this.scene.game.currentActor

    if (!currentActor) return
    if (this.scene.isPlayerControlled(currentActor)) return
    if (this.scene.game.phase !== GamePhase.SELECTING) return

    this.handleAITurn()
  }

  /**
   * 处理 AI 回合
   */
  handleAITurn(): void {
    if (!this.scene.ai || !this.scene.game || this.scene.isAIProcessing) return

    this.scene.isAIProcessing = true
    this.scene.statusBar?.setPhase('敌方行动中...')

    this.runAI()
  }

  /**
   * 运行 AI 行动循环
   */
  private runAI(): void {
    if (!this.scene.ai || !this.scene.game) return

    if (!this.scene.isAIProcessing) {
      return
    }

    const currentActor = this.scene.game.currentActor!

    // 检查是否可以继续行动
    if (currentActor.agility <= 0 || !currentActor.isAlive()) {
      this.finishAITurn()
      return
    }

    // 获取存活的敌人（玩家队伍）
    const alivePlayerTeam = this.scene.playerConfigs.filter(c => c.isAlive())
    if (alivePlayerTeam.length === 0) {
      // 玩家队伍全灭，游戏结束
      this.scene.game.checkGameEnd()
      this.scene.isAIProcessing = false
      this.scene.handleGameOver()
      return
    }

    // 获取可用行动
    const action = this.scene.ai.decideAction()

    if (!action) {
      this.scene.game.addLog(`${currentActor.name}没有可用的招式`)
      // 没有可用行动，强制结束本轮行动
      currentActor.agility = 0
      this.finishAITurn()
      return
    }

    // 执行行动
    if (action.type === 'skill' && action.skillId) {
      this.scene.game.useSkill(action.skillId, action.cardId, action.targetId)
    } else {
      this.scene.game.useBasicCard(action.cardId, action.targetId)
    }

    // 更新 UI
    this.scene.updateUI()

    // 检查游戏结束
    if (this.scene.game.phase === GamePhase.GAME_OVER) {
      this.scene.isAIProcessing = false
      this.scene.handleGameOver()
      return
    }

    // 检查是否切换行动方
    if (this.scene.game.shouldSwitchActor()) {
      this.finishAITurn()
      return
    }

    // 如果行动者已切换，需要通过 finishAITurn 正确处理
    if (this.scene.game.currentActor !== currentActor) {
      this.finishAITurn()
      return
    }

    // 继续下一个行动
    setTimeout(() => this.runAI(), 600)
  }

  /**
   * 完成 AI 回合
   */
  private finishAITurn(): void {
    if (!this.scene.game) return

    if (this.scene.game.phase !== GamePhase.GAME_OVER) {
      if (this.scene.game.shouldSwitchActor()) {
        this.scene.game.switchActor()
        const newActor = this.scene.game.currentActor!

        // 检查新行动者轻功是否为0
        if (newActor.agility <= 0) {
          this.scene.game.endTurn()
        } else {
          this.scene.game.addLog(`轮到${newActor.name}行动`)
          this.scene.game.phase = GamePhase.SELECTING
          this.scene.clearSelection()
        }
      } else {
        // 当前行动者仍是最高轻功，检查是否轻功耗尽
        const currentActor = this.scene.game.currentActor
        if (currentActor && currentActor.agility <= 0) {
          this.scene.game.endTurn()
        }
      }
    }

    this.scene.isAIProcessing = false
    this.scene.updateUI()

    if (this.scene.game.phase === GamePhase.GAME_OVER) {
      this.scene.handleGameOver()
    }
  }
}