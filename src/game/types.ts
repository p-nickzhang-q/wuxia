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
  ACTING = 'acting',
  GAME_OVER = 'gameOver'
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
  requiredCardType: CardType | 'any'
  mpCost: number
  agilityCost: number
  effects: SkillEffect[]
  description: string
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
  trigger: TriggerTiming
  effect: (character: CharacterState, ...args: any[]) => string | PassiveEffectResult | null
  initEffect?: (character: CharacterState) => void
  description: string
}

// ==================== 武功配置 ====================
export interface MartialArt {
  id: string
  name: string
  skill: MartialArtSkill | null
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
  player: CharacterState | null
  enemy: CharacterState | null
  currentTurn: number
  currentActor: CharacterState | null
  phase: GamePhase
  battleLog: BattleLogEntry[]
  lastUsedSkill: MartialArtSkill | null
  selectedCard: Card | null
  extraAction: boolean
  followUp: boolean

  init(player: CharacterState, enemy: CharacterState): void
  startNewTurn(): void
  decideTurnOrder(): void
  switchActor(): void
  shouldSwitchActor(): boolean
  useBasicCard(cardInstanceId: string): { success: boolean; message?: string; gameOver?: boolean }
  useSkill(skillId: string, cardInstanceId: string): { success: boolean; message?: string; gameOver?: boolean; extraAction?: boolean; followUp?: boolean }
  processEffect(effect: SkillEffect, actor: CharacterState, opponent: CharacterState, skill: MartialArtSkill): { actualDamage: number; extraAction?: boolean; followUp?: boolean }
  checkTurnEnd(): void
  endTurn(): void
  endGame(): void
  addLog(message: string): void
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