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
  agilityBonus: number
  shield: number

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
}

// ==================== 角色配置 ====================
export interface CharacterConfig {
  id: string
  name: string
  title: string
  description: string
  hp: number
  mp: number
  agility: number
  martialArts: string[]
  deck: string[]
}

// ==================== 战斗日志 ====================
export interface BattleLogEntry {
  id: number
  text: string
  time: string
}

// ==================== 游戏状态接口 ====================
export interface GameState {
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