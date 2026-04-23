import { CardRenderer } from '../renderer/CardRenderer'
import { GamePhase, MartialArtSkill } from '../game/types'
import { BattleSceneInterface } from './types/BattleSceneInterface'

/**
 * 战斗输入处理器
 * 处理玩家交互逻辑
 *
 * 通过 BattleSceneInterface 与 BattleScene 通信
 */
export class BattleInputHandler {
  private scene: BattleSceneInterface

  constructor(scene: BattleSceneInterface) {
    this.scene = scene
  }

  /**
   * 处理卡牌点击
   */
  handleCardClick(cardRenderer: CardRenderer): void {
    if (!this.scene.game) return

    const currentActor = this.scene.game.currentActor
    if (!currentActor || !this.scene.isPlayerControlled(currentActor)) return

    // 如果在目标选择阶段，点击卡牌取消目标选择
    if (this.scene.game.phase === GamePhase.SELECTING_TARGET) {
      this.scene.clearTargetSelection()
    }

    // 如果已经选中这张卡，取消选中
    if (this.scene.selectedCard === cardRenderer) {
      cardRenderer.setSelected(false)
      this.scene.selectedCard = null
      this.scene.targetableIds = []
      this.scene.selectedTargetId = null
      this.scene.pendingSkillId = null
      this.scene.pendingCardId = null
      this.scene.updateTargetHighlights()
    } else {
      // 取消之前的选择
      if (this.scene.selectedCard) {
        this.scene.selectedCard.setSelected(false)
      }
      // 选中新卡牌
      cardRenderer.setSelected(true)
      this.scene.selectedCard = cardRenderer

      // 选中后直接进入目标选择模式
      const card = cardRenderer.getCard()
      if (this.scene.selectedSkill) {
        // 使用武功招式 - 进入目标选择
        const typeMatch = this.scene.selectedSkill.requiredCardType === 'any' || card.type === this.scene.selectedSkill.requiredCardType
        if (typeMatch) {
          this.scene.enterTargetSelection(this.scene.selectedSkill.id, card.instanceId)
        }
      } else {
        // 使用基础招式 - 进入目标选择
        this.scene.enterTargetSelection(null, card.instanceId)
      }
    }

    this.scene.updateActionButtons()
  }

  /**
   * 处理技能点击
   */
  handleSkillClick(skillId: string): void {
    if (!this.scene.game) return

    const currentActor = this.scene.game.currentActor
    if (!currentActor || !this.scene.isPlayerControlled(currentActor)) return

    const skill = currentActor.skills.find((s: MartialArtSkill) => s.id === skillId)
    if (!skill) return

    // 如果在目标选择阶段，点击技能取消目标选择
    if (this.scene.game.phase === GamePhase.SELECTING_TARGET) {
      this.scene.clearTargetSelection()
    }

    // 如果已经选中这个技能，取消选中
    if (this.scene.selectedSkill && this.scene.selectedSkill.id === skillId) {
      this.scene.selectedSkill = null
    } else {
      // 选中新技能
      this.scene.selectedSkill = skill

      // 如果已有选中的手牌，直接进入目标选择
      if (this.scene.selectedCard) {
        const card = this.scene.selectedCard.getCard()
        const typeMatch = skill.requiredCardType === 'any' || card.type === skill.requiredCardType
        if (typeMatch) {
          this.scene.enterTargetSelection(skill.id, card.instanceId)
        }
      }
    }

    this.scene.updateSkillButtons()
    this.scene.updateActionButtons()
  }

  /**
   * 处理确认
   */
  handleConfirm(): void {
    if (!this.scene.game) return

    // 如果在目标选择阶段，确认目标
    if (this.scene.game.phase === GamePhase.SELECTING_TARGET) {
      this.confirmTarget()
      return
    }

    // 如果已有待执行的动作（1v1模式）
    if (this.scene.pendingCardId && this.scene.selectedTargetId) {
      this.scene.executeAction(this.scene.pendingSkillId, this.scene.pendingCardId, this.scene.selectedTargetId)
      return
    }

    // 如果没有选中卡牌，返回
    if (!this.scene.selectedCard) return

    const card = this.scene.selectedCard.getCard()

    if (this.scene.selectedSkill) {
      // 使用武功招式 - 进入目标选择
      const typeMatch = this.scene.selectedSkill.requiredCardType === 'any' || card.type === this.scene.selectedSkill.requiredCardType
      if (typeMatch) {
        this.scene.enterTargetSelection(this.scene.selectedSkill.id, card.instanceId)
      }
    } else {
      // 使用基础招式
      this.scene.enterTargetSelection(null, card.instanceId)
    }
  }

  /**
   * 确认目标选择
   */
  private confirmTarget(): void {
    if (!this.scene.selectedTargetId) return

    this.scene.executeAction(this.scene.pendingSkillId, this.scene.pendingCardId, this.scene.selectedTargetId)
  }

  /**
   * 处理取消
   */
  handleCancel(): void {
    if (this.scene.game?.phase === GamePhase.SELECTING_TARGET) {
      this.scene.clearTargetSelection()
    } else {
      this.scene.clearSelection()
    }
  }

  /**
   * 处理结束回合
   */
  handleEndTurn(): void {
    if (!this.scene.game) return

    const currentActor = this.scene.game.currentActor
    if (!currentActor || !this.scene.isPlayerControlled(currentActor)) return

    // 清空当前行动者的轻功
    currentActor.agility = 0

    // 清除选择状态
    if (this.scene.selectedCard) {
      this.scene.selectedCard.setSelected(false)
      this.scene.selectedCard = null
      this.scene.pendingCardId = null
    }
    this.scene.selectedSkill = null
    this.scene.pendingSkillId = null

    this.scene.endTurn()
  }

  /**
   * 处理目标点击
   */
  handleTargetClick(targetId: string): void {
    if (this.scene.game?.phase !== GamePhase.SELECTING_TARGET) return
    if (!this.scene.targetableIds.includes(targetId)) return

    this.scene.selectedTargetId = targetId
    this.scene.updateTargetHighlights()
  }

  /**
   * 获取待执行的卡牌ID（用于检查是否有待确认动作）
   */
  getPendingCardId(): string | null {
    return this.scene.pendingCardId
  }
}