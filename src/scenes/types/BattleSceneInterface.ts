import { CardRenderer } from '../../renderer/CardRenderer'
import { CharacterRenderer } from '../../renderer/CharacterRenderer'
import { MiniCharacterRenderer } from '../../renderer/MiniCharacterRenderer'
import { StatusBar } from '../../renderer/UIComponents'
import { BattleLog } from '../../renderer/UIComponents'
import { VerticalAgilityAxis } from '../../renderer/UIComponents'
import { AI } from '../../game/AI'
import { CharacterState, MartialArtSkill } from '../../game/types'

/**
 * BattleScene 对 handlers 暴露的接口
 * 包含 handlers 需要访问的所有方法和属性
 *
 * 用于 BattleInputHandler 和 BattleAIHandler 与 BattleScene 通信
 */
export interface BattleSceneInterface {
  // ==================== Game 状态 ====================

  /** 游戏状态实例 */
  game: ReturnType<typeof import('../../game/Game').createGame> | null

  /** AI 决策实例 */
  ai: AI | null

  // ==================== 状态标记 ====================

  /** AI 是否正在处理 */
  isAIProcessing: boolean

  /** 玩家队伍配置 */
  playerConfigs: CharacterState[]

  /** 待执行的卡牌 ID */
  pendingCardId: string | null

  /** 待执行的武功 ID */
  pendingSkillId: string | null

  // ==================== 选择状态 ====================

  /** 当前选中的卡牌渲染器 */
  selectedCard: CardRenderer | null

  /** 当前选中的武功招式 */
  selectedSkill: MartialArtSkill | null

  /** 可选目标 ID 列表 */
  targetableIds: string[]

  /** 已选中的目标 ID */
  selectedTargetId: string | null

  // ==================== 渲染组件引用 ====================

  /** 状态栏组件 */
  statusBar: StatusBar | null

  /** 战斗日志组件 */
  battleLog: BattleLog | null

  /** 轻功轴组件 */
  agilityAxis: VerticalAgilityAxis | null

  /** 角色渲染器映射 */
  characterRenderers: Map<string, CharacterRenderer | MiniCharacterRenderer>

  // ==================== 判断方法 ====================

  /** 判断角色是否由玩家控制 */
  isPlayerControlled: (char: CharacterState) => boolean

  /** 判断角色是否属于玩家队伍 */
  isPlayerTeam: (char: CharacterState) => boolean

  // ==================== UI 更新方法 ====================

  /** 更新所有 UI 状态 */
  updateUI: () => void

  /** 更新目标高亮显示 */
  updateTargetHighlights: () => void

  /** 更新动作按钮状态 */
  updateActionButtons: () => void

  /** 更新技能按钮状态 */
  updateSkillButtons: () => void

  // ==================== 状态管理方法 ====================

  /** 清空所有选择状态 */
  clearSelection: () => void

  /** 清除目标选择状态 */
  clearTargetSelection: () => void

  /** 进入目标选择模式 */
  enterTargetSelection: (skillId: string | null, cardInstanceId: string) => void

  /** 执行动作 */
  executeAction: (skillId: string | null, cardInstanceId: string | null, targetId: string) => void

  /** 结束当前回合 */
  endTurn: () => void

  // ==================== 点击处理方法 ====================

  /** 处理卡牌点击 */
  handleCardClick: (cardRenderer: CardRenderer) => void

  /** 处理技能点击 */
  handleSkillClick: (skillId: string) => void

  // ==================== 日志和事件 ====================

  /** 添加战斗日志 */
  addLog: (message: string) => void

  /** 处理游戏结束 */
  handleGameOver: () => void
}