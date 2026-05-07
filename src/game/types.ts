// ==================== 武功等级 ====================
export enum SkillLevel {
  BEGINNER = '初级',
  INTERMEDIATE = '中级',
  ADVANCED = '高级',
  MASTER = '顶级'
}

// ==================== 门派 ====================
export enum Faction {
  BEGGAR = '丐帮',
  SHAOLIN = '少林',
  WUDANG = '武当',
  EMEI = '峨眉',
  HUASHAN = '华山',
  MOZU = '魔教',
  GUMU = '古墓派',
  TIANSHAN = '天山派',
  DALI = '大理段氏',
  XIAKE = '侠客岛',
  QINGCHENG = '青城派',
  RIVERSIDE = '江湖散人'  // 无门派
}

// ==================== 卡牌类型 ====================
export enum CardType {
  EMPTY_HAND = '空手',
  SHORT_WEAPON = '短兵',
  LONG_WEAPON = '长兵',
  LEG = '腿法'
}

// ==================== 触发时机 ====================
export enum TriggerTiming {
  TURN_START = 'TURN_START',
  TURN_END = 'TURN_END',
  ON_DAMAGE = 'ON_DAMAGE',
  ON_TAKE_DAMAGE = 'ON_TAKE_DAMAGE',
  ON_PLAY_CARD = 'ON_PLAY_CARD',
  ON_SKILL_USE = 'ON_SKILL_USE'
}

// ==================== 游戏阶段 ====================
export enum GamePhase {
  SETUP = 'setup',
  SELECTING = 'selecting',
  SELECTING_TARGET = 'selectingTarget',  // 选择目标
  ACTING = 'acting',
  GAME_OVER = 'gameOver'
}

// ==================== 战斗模式 ====================
export type BattleMode = 'team' | 'freeforall'  // 阵营对战 / 混战

// ==================== 战斗位置 ====================
export interface BattlePosition {
  seatIndex: number      // 座位编号（0-N，圆形排列）
  team: 'player' | 'enemy' | null  // 混战时为null
}

// ==================== 事件类型 ====================
export enum GameEventType {
  // 游戏事件
  GAME_START = 'gameStart',
  GAME_END = 'gameEnd',
  TURN_START = 'turnStart',
  TURN_END = 'turnEnd',

  // 角色事件
  CHARACTER_DAMAGED = 'characterDamaged',
  CHARACTER_HEALED = 'characterHealed',
  CHARACTER_SHIELD = 'characterShield',
  CHARACTER_DEATH = 'characterDeath',

  // 卡牌事件
  CARD_DRAWN = 'cardDrawn',
  CARD_PLAYED = 'cardPlayed',
  CARD_DISCARDED = 'cardDiscarded',

  // 技能事件
  SKILL_USED = 'skillUsed',
  PASSIVE_TRIGGERED = 'passiveTriggered',

  // UI 事件
  UI_UPDATE = 'uiUpdate',
  LOG_MESSAGE = 'logMessage'
}

// ==================== 卡牌接口 ====================
export interface Card {
  id: string
  instanceId: string
  name: string
  type: CardType
  baseDamage: number
  baseShield: number
  agilityCost: number
  selfDamage?: number
  range: number  // 攻击距离
  isBasicCard: true
}

// ==================== 武功招式效果 ====================
export interface SkillEffect {
  type: 'damage' | 'shield' | 'selfDamage' | 'drainMp' | 'removeMp' | 'drainHp' |
        'dot' | 'debuffAgility' | 'disableCardType' | 'extraAction' | 'followUp' | 'mimic'
  value?: number
  duration?: number
  cardType?: CardType
  ignoreShield?: boolean
}

// ==================== 武功招式接口 ====================
export interface MartialArtSkill {
  id: string
  name: string
  shortName?: string  // 简称（2-3个字），可选
  level: SkillLevel   // 武功等级
  faction?: Faction   // 所属门派，可选（江湖散人武功无门派）
  requiredCardType: CardType | 'any'
  mpCost: number
  agilityCost: number
  effects: SkillEffect[]
  description: string
  range: number  // 攻击范围 1-3，默认1
  mpCostReduction?: number
}

// ==================== 内功效果返回值 ====================
export interface PassiveEffectResult {
  message?: string
  bonusDamage?: number
  reducedDamage?: number
  dodged?: boolean
  reflectDamage?: number
}

// ==================== 内功接口 ====================
export interface PassiveSkill {
  id: string
  name: string
  shortName?: string  // 简称（2-3个字），可选
  level: SkillLevel   // 内功等级
  faction?: Faction   // 所属门派，可选
  trigger: TriggerTiming
  effect: (character: CharacterState, ...args: any[]) => string | PassiveEffectResult | null
  initEffect?: (character: CharacterState) => void
  description: string
}

// ==================== 武功配置 ====================
export interface MartialArt {
  id: string
  name: string
  skills: MartialArtSkill[]  // 支持多个武功招式
  passive: PassiveSkill | null
  description: string
}

// ==================== 减益效果 ====================
export interface Debuff {
  type: 'agility' | 'disableCardType'
  value: number | CardType
  duration: number
}

// ==================== 持续伤害 ====================
export interface Dot {
  value: number
  duration: number
}

// ==================== 角色状态接口 ====================
export interface CharacterState {
  // 内部事件管理器引用（可选，用于依赖注入）
  _events?: any

  id: string
  name: string
  title: string
  description: string
  maxHp: number
  hp: number
  maxMp: number
  mp: number
  baseAgility: number
  agility: number
  agilityBonus: number // 身法属性值 (1-10)，用于计算轻功
  shield: number

  // 弟子属性（战斗时可访问）
  root: number       // 根骨 (1-10)
  insight: number    // 悟性 (1-10)
  will: number       // 定力 (1-10)
  strength: number   // 臂力 (1-10)，用于伤害加成计算

  // 战斗位置
  battlePosition: BattlePosition | null

  skills: MartialArtSkill[]
  passives: PassiveSkill[]
  martialArtsNames: string[]

  deckTemplate: string[]
  deck: Card[]
  hand: Card[]
  discardPile: Card[]

  debuffs: Debuff[]
  dots: Dot[]

  // 方法
  initDeck(): void
  shuffleDeck(): void
  drawCards(count: number): Card[]
  playCard(cardInstanceId: string): Card | null
  getCurrentAgility(): number
  resetForNewTurn(): void
  onTurnStart(game: GameState): string[]
  onTurnEnd(): string[]
  takeDamage(damage: number, attacker?: CharacterState | null, game?: GameState | null): { damage: number; messages: string[] }
  heal(amount: number): number
  recoverMp(amount: number): number
  useMp(amount: number): boolean
  isAlive(): boolean
  addDot(value: number, duration: number): void
  addDebuff(type: 'agility' | 'disableCardType', value: number | CardType, duration: number): void
  getHandCards(): Card[]
  getAvailableCards(currentAgility: number): Card[]
  canUseSkill(skill: MartialArtSkill, card: Card, currentAgility: number): boolean
  getSkillCards(skill: MartialArtSkill, currentAgility: number): Card[]
  getAvailableSkills(currentAgility: number): MartialArtSkill[]
  getDistanceTo(target: CharacterState, totalSeats: number): number

  // 内部实现方法（拆分后的子方法）
  processDamagePassives(damage: number, attacker: CharacterState | null): { dodged: boolean; actualDamage: number; messages: string[] }
  applyShieldAbsorption(damage: number): { remainingDamage: number; messages: string[] }
  applyFinalDamage(damage: number, messages: string[]): void
}

// ==================== 角色配置 ====================
// CharacterConfig 类已移至 CharacterConfig.ts
// 重新导出以保持向后兼容
export { CharacterConfig } from './CharacterConfig'
export type { CharacterConfigData } from './CharacterConfig'

// ==================== 战斗日志 ====================
export interface BattleLogEntry {
  id: number
  text: string
  time: string
}

// ==================== 游戏状态接口 ====================
export interface GameState {
  // 内部事件管理器引用（可选，用于依赖注入）
  _events?: any

  // 1v1 模式（向后兼容）
  player: CharacterState | null
  enemy: CharacterState | null

  // 多人战斗模式
  battleMode: BattleMode
  playerTeam: CharacterState[]
  enemyTeam: CharacterState[]
  totalSeats: number
  selectedTarget: CharacterState | null

  // 通用状态
  currentTurn: number
  currentActor: CharacterState | null
  phase: GamePhase
  battleLog: BattleLogEntry[]
  lastUsedSkill: MartialArtSkill | null
  selectedCard: Card | null
  extraAction: boolean
  followUp: boolean

  // 1v1 初始化（向后兼容）
  init(player: CharacterState, enemy: CharacterState): void

  // 多人战斗初始化
  initTeamBattle(playerTeam: CharacterState[], enemyTeam: CharacterState[], mode: BattleMode): void

  // 通用方法
  startNewTurn(): void
  decideTurnOrder(): void
  switchActor(): void
  shouldSwitchActor(): boolean
  useBasicCard(cardInstanceId: string, targetId?: string): { success: boolean; message?: string; gameOver?: boolean }
  useSkill(skillId: string, cardInstanceId: string, targetId?: string): { success: boolean; message?: string; gameOver?: boolean; extraAction?: boolean; followUp?: boolean }
  processEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState, skill: MartialArtSkill): { actualDamage: number; extraAction?: boolean; followUp?: boolean }
  checkTurnEnd(): void
  checkGameEnd(): boolean
  endTurn(): void
  endGame(): void
  addLog(message: string): void

  // 多人战斗方法
  getAllCharacters(): CharacterState[]
  getAliveCharacters(team?: 'player' | 'enemy'): CharacterState[]
  getTargetsInRange(actor: CharacterState, range: number): CharacterState[]
  getActualDistance(actor: CharacterState, target: CharacterState): number
  selectTarget(target: CharacterState | null): void

  // 内部实现方法（拆分后的子方法）
  validateBasicCardUse(cardInstanceId: string, targetId?: string): { success: boolean; message?: string; actor?: CharacterState; target?: CharacterState; card?: Card }
  consumeBasicCardResources(card: Card, actor: CharacterState): void
  applyBasicCardEffects(actor: CharacterState, target: CharacterState, card: Card): { actualDamage: number; totalShield: number }
  triggerOnPlayCardPassives(actor: CharacterState, card: Card, baseDamage: number): number
  applyDamageWithPassives(actor: CharacterState, target: CharacterState, damage: number): number
  finalizeBasicCardUse(actor: CharacterState, target: CharacterState, card: Card, effectResult: { actualDamage: number; totalShield: number }): void
  validateSkillUse(skillId: string, cardInstanceId: string, targetId?: string): { success: boolean; message?: string; actor?: CharacterState; target?: CharacterState; card?: Card; skill?: MartialArtSkill }
  consumeSkillResources(actor: CharacterState, card: Card, skill: MartialArtSkill): MartialArtSkill
  processSkillEffects(actor: CharacterState, target: CharacterState, skill: MartialArtSkill): { actualDamage: number; extraAction: boolean; followUp: boolean }
  finalizeSkillUse(actor: CharacterState, target: CharacterState, skill: MartialArtSkill, effectResult: { actualDamage: number; extraAction: boolean; followUp: boolean }): void
  calculateEffectBaseDamage(effect: SkillEffect, actor: CharacterState, skill: MartialArtSkill): number
  processDamageEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState, baseDamage: number): { actualDamage: number }
  triggerOnDamagePassives(actor: CharacterState, damage: number): void
  processShieldEffect(effect: SkillEffect, actor: CharacterState): { actualDamage: number }
  processSelfDamageEffect(effect: SkillEffect, actor: CharacterState): { actualDamage: number }
  processDrainMpEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState): { actualDamage: number }
  processRemoveMpEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState): { actualDamage: number }
  processDrainHpEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState): { actualDamage: number }
  processDotEffect(effect: SkillEffect, target: CharacterState): { actualDamage: number }
  processDebuffEffect(effect: SkillEffect, target: CharacterState): { actualDamage: number }
  processDisableCardTypeEffect(effect: SkillEffect, target: CharacterState): { actualDamage: number }
  processMimicEffect(actor: CharacterState, target: CharacterState): { actualDamage: number }
}

// ==================== 基础卡牌模板 ====================
export interface BasicCardTemplate {
  id: string
  name: string
  type: CardType
  baseDamage: number
  baseShield: number
  agilityCost: number
  selfDamage?: number
  range: number  // 攻击距离
  description: string
}

// ==================== 动画配置 ====================
export interface AnimationConfig {
  duration: number
  easing?: (t: number) => number
}

// ==================== 布局配置 ====================
export interface LayoutConfig {
  canvasWidth: number
  canvasHeight: number
  cardWidth: number
  cardHeight: number
  cardSpacing: number
  characterPanelHeight: number
  actionBarHeight: number
}

// ==================== 弟子境界 ====================
export enum DiscipleRealm {
  OUTER = '外门',      // 外门弟子
  INNER = '内门',      // 内门弟子
  DISCIPLE = '亲传',   // 亲传弟子
  ELDER = '长老'       // 长老
}

// ==================== 弟子状态 ====================
export interface DiscipleState {
  id: string
  name: string

  // 基础属性（先天属性，创建时确定）
  root: number       // 根骨 - 成长潜力 (1-10)
  insight: number    // 悟性 - 学习速度 (1-10)
  will: number       // 定力 - 内功效果 (1-10)
  strength: number   // 臂力 - 伤害加成 (1-10)
  agility: number    // 身法 - 轻功值 (1-10)

  // 战斗属性（后天属性，随境界提升）
  maxHp: number
  maxMp: number
  baseAgility: number

  // 境界与等级
  realm: DiscipleRealm
  level: number      // 当前境界内的等级 (1-10)
  exp: number        // 当前等级经验值

  // 武功掌握
  learnedSkills: string[]     // 已学会的武功招式ID
  masteredSkills: string[]    // 已精通的武功招式ID
  equippedSkills: string[]    // 装备的武功招式ID（战斗可用）
  passiveSkill: string | null // 装备的内功ID

  // 状态
  isRecruited: boolean        // 是否已招募
  recruitCost: number         // 招募花费（银两）
}

// ==================== 弟子模板 ====================
export interface DiscipleTemplate {
  id: string
  name: string
  description: string

  // 基础属性范围
  rootRange: [number, number]      // 根骨范围
  insightRange: [number, number]   // 悟性范围
  willRange: [number, number]      // 定力范围
  strengthRange: [number, number]  // 臂力范围
  agilityRange: [number, number]   // 身法范围

  // 初始武功
  initialSkills: string[]          // 初始可学会的武功招式ID
  initialPassive: string | null    // 初始内功ID

  // 招募条件
  recruitCost: number              // 基础招募花费
  minReputation: number            // 需要的最低声望
}

// ==================== 门派管理弟子状态 ====================
export enum SectorDiscipleStatus {
  HEALTHY = '健康',
  INJURED = '受伤',
  TRAINING = '修炼中',
  RESTING = '休息中',
  EXPLORING = '探索中'
}

// ==================== 门派弟子（扩展 DiscipleState）====================
export interface SectorDisciple extends DiscipleState {
  // 门派管理专属属性
  vitality: number           // 精力 (0-100)
  maxVitality: number        // 最大精力
  loyalty: number            // 忠诚度 (0-100)
  status: SectorDiscipleStatus
  trainingTask?: string      // 当前修炼任务（武功ID或设施ID）
  currentHp: number          // 当前HP
  currentMp: number          // 当前MP
}

// ==================== 设施类型 ====================
export enum FacilityType {
  TRAINING_HALL = '练功房',
  REST_ROOM = '休息室',
  LIBRARY = '藏经阁',
  ALCHEMY_ROOM = '炼丹房',
  FORGE = '锻造房'
}

// ==================== 设施接口 ====================
export interface Facility {
  id: string
  name: string
  type: FacilityType
  level: number              // 设施等级 (1-5)
  capacity: number           // 容纳人数
  occupants: string[]        // 当前使用者ID列表
}

// ==================== 门派资源 ====================
export interface SectorResources {
  wood: number               // 木材
  metal: number              // 金属
  herb: number               // 药材
}

// ==================== 门派状态 ====================
export interface SectorState {
  id: string
  name: string               // 门派名称
  faction: Faction           // 门派归属

  // 资源
  silver: number             // 银两
  reputation: number         // 声望
  resources: SectorResources // 材料

  // 弟子
  disciples: SectorDisciple[]
  maxDisciples: number       // 最大弟子数量

  // 设施
  facilities: Facility[]

  // 时间
  turn: number               // 当前回合

  // 门派关系（与各门派的关系值）
  factionRelations: Record<string, number>
}