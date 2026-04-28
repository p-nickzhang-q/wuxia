import { CharacterState, GameState, GamePhase, MartialArtSkill, SkillEffect, TriggerTiming, GameEventType, BattleMode, Card } from './types'
import { eventManager, EventManager } from '../utils/EventManager'
import { getTargetsInRange, assignSeats, calculateActualDistance } from './DistanceSystem'
import { calculateStrengthBonus } from './Disciple'

/**
 * 创建游戏状态实例
 * 管理回合流程、卡牌使用、武功招式效果、内功触发等战斗逻辑
 * @param customEventManager 可选的自定义事件管理器，用于测试注入
 * @returns GameState 游戏状态对象
 */
export function createGame(customEventManager?: EventManager): GameState {
  // 使用闭包存储事件管理器，不修改接口
  const emitter = customEventManager || eventManager
  const state: GameState = {
    // 事件管理器引用（用于依赖注入）
    _events: emitter,

    // 1v1 模式（向后兼容）
    player: null,
    enemy: null,

    // 多人战斗模式
    battleMode: 'team',
    playerTeam: [],
    enemyTeam: [],
    totalSeats: 0,
    selectedTarget: null,

    // 通用状态
    currentTurn: 0,
    currentActor: null,
    phase: GamePhase.SETUP,
    battleLog: [],
    lastUsedSkill: null,
    selectedCard: null,
    extraAction: false,
    followUp: false,

    // ==================== 初始化方法 ====================

    // 1v1 初始化（向后兼容）
    init(player: CharacterState, enemy: CharacterState) {
      this.player = player
      this.enemy = enemy
      this.playerTeam = [player]
      this.enemyTeam = [enemy]
      this.battleMode = 'team'
      this.totalSeats = 2
      this.currentTurn = 0
      this.phase = GamePhase.SETUP
      this.battleLog = []
      this.lastUsedSkill = null
      this.selectedCard = null
      this.selectedTarget = null

      // 分配座位
      player.battlePosition = { seatIndex: 1, team: 'player' }
      enemy.battlePosition = { seatIndex: 0, team: 'enemy' }

      player.initDeck()
      enemy.initDeck()

      player.drawCards(5)
      enemy.drawCards(5)

      this.addLog('战斗开始！')
      this.startNewTurn()
    },

    // 多人战斗初始化
    initTeamBattle(playerTeam: CharacterState[], enemyTeam: CharacterState[], mode: BattleMode) {
      this.playerTeam = playerTeam
      this.enemyTeam = enemyTeam
      this.battleMode = mode
      this.totalSeats = playerTeam.length + enemyTeam.length
      this.currentTurn = 0
      this.phase = GamePhase.SETUP
      this.battleLog = []
      this.lastUsedSkill = null
      this.selectedCard = null
      this.selectedTarget = null

      // 向后兼容
      this.player = playerTeam[0] || null
      this.enemy = enemyTeam[0] || null

      // 分配座位
      assignSeats(playerTeam, enemyTeam, mode)

      // 初始化所有角色的牌组
      playerTeam.forEach(char => {
        char.initDeck()
        char.drawCards(5)
      })
      enemyTeam.forEach(char => {
        char.initDeck()
        char.drawCards(5)
      })

      this.addLog('多人战斗开始！')
      this.startNewTurn()
    },

    // ==================== 多人战斗方法 ====================

    getAllCharacters(): CharacterState[] {
      return [...this.playerTeam, ...this.enemyTeam]
    },

    getAliveCharacters(team?: 'player' | 'enemy'): CharacterState[] {
      const allChars = this.getAllCharacters()
      if (!team) {
        return allChars.filter(c => c.isAlive())
      }
      if (team === 'player') {
        return this.playerTeam.filter(c => c.isAlive())
      }
      return this.enemyTeam.filter(c => c.isAlive())
    },

    getTargetsInRange(actor: CharacterState, range: number): CharacterState[] {
      return getTargetsInRange(
        actor,
        range,
        this.getAllCharacters(),
        this.totalSeats,
        this.battleMode
      )
    },

    getActualDistance(actor: CharacterState, target: CharacterState): number {
      if (!actor.battlePosition || !target.battlePosition) return 0
      return calculateActualDistance(
        actor.battlePosition.seatIndex,
        target.battlePosition.seatIndex,
        this.getAllCharacters(),
        this.totalSeats
      )
    },

    selectTarget(target: CharacterState | null): void {
      this.selectedTarget = target
    },

    // ==================== 回合管理 ====================

    /**
     * 开始新回合
     * 重置角色状态、触发回合开始内功、抽牌、决定行动顺序
     */
    startNewTurn() {
      this.currentTurn++
      this.addLog(`\n--- 第${this.currentTurn}回合 ---`)

      const allChars = this.getAllCharacters()

      // 重置所有角色
      allChars.forEach(char => {
        if (char.isAlive()) {
          char.resetForNewTurn()
        }
      })

      // 触发回合开始内功
      allChars.forEach(char => {
        if (char.isAlive()) {
          const messages = char.onTurnStart(this)
          messages.forEach(msg => this.addLog(msg))
        }
      })

      // 所有存活角色抽牌
      allChars.forEach(char => {
        if (char.isAlive()) {
          const drawn = char.drawCards(2)
          if (drawn.length > 0) {
            this.addLog(`${char.name}抽了${drawn.length}张牌`)
          }
        }
      })

      // 检查游戏是否结束
      const alivePlayers = this.getAliveCharacters('player')
      const aliveEnemies = this.getAliveCharacters('enemy')
      if (alivePlayers.length === 0 || aliveEnemies.length === 0) {
        this.endGame()
        return
      }

      // 发出回合开始事件
      this._events.emit(GameEventType.TURN_START, { turnNumber: this.currentTurn })

      this.decideTurnOrder()
    },

    decideTurnOrder() {
      // 获取所有存活角色并按当前轻功排序
      const aliveChars = this.getAliveCharacters()
        .filter(c => c.isAlive())
        .sort((a, b) => b.agility - a.agility)  // 使用当前轻功值排序

      if (aliveChars.length === 0) {
        this.endGame()
        return
      }

      this.currentActor = aliveChars[0]
      this.addLog(`${this.currentActor!.name}轻功最高，先行动`)
      this.phase = GamePhase.SELECTING
    },

    switchActor() {
      const aliveChars = this.getAliveCharacters()
        .filter(c => c.isAlive())
        .sort((a, b) => b.agility - a.agility)  // 使用当前剩余轻功排序

      const currentIndex = aliveChars.findIndex(c => c.id === this.currentActor?.id)
      const nextIndex = (currentIndex + 1) % aliveChars.length
      this.currentActor = aliveChars[nextIndex]
    },

    shouldSwitchActor(): boolean {
      if (!this.currentActor) return false

      const aliveChars = this.getAliveCharacters()
        .filter(c => c.isAlive() && c.id !== this.currentActor?.id)

      // 如果只有一个存活角色，不切换
      if (aliveChars.length === 0) return false

      // 找出轻功最高的对手
      const currentTeam = this.currentActor.battlePosition?.team
      const opponents = aliveChars.filter(c => {
        if (this.battleMode === 'freeforall') return true
        return c.battlePosition?.team !== currentTeam
      })

      if (opponents.length === 0) return false

      const highestOpponentAgility = Math.max(...opponents.map(c => c.agility))
      return this.currentActor.agility <= highestOpponentAgility
    },

    // ==================== 卡牌使用 ====================

    /**
     * 使用基础招式卡牌
     * @param cardInstanceId 卡牌实例ID
     * @param targetId 可选目标ID
     * @returns 使用结果 { success, message?, gameOver? }
     */
    useBasicCard(cardInstanceId: string, targetId?: string) {
      const validation = this.validateBasicCardUse(cardInstanceId, targetId)
      if (!validation.success) return validation

      this.consumeBasicCardResources(validation.card!, validation.actor!)

      const effectResult = this.applyBasicCardEffects(
        validation.actor!,
        validation.target!,
        validation.card!
      )

      this.finalizeBasicCardUse(
        validation.actor!,
        validation.target!,
        validation.card!,
        effectResult
      )

      if (this.checkGameEnd()) {
        return { success: true, gameOver: true }
      }

      this.checkTurnEnd()
      return { success: true }
    },

    validateBasicCardUse(cardInstanceId: string, targetId?: string) {
      const actor = this.currentActor!
      const card = actor.hand.find(c => c.instanceId === cardInstanceId)

      if (!card) {
        return { success: false, message: '未找到该卡牌' }
      }

      if (card.agilityCost > actor.agility) {
        return { success: false, message: '轻功不足' }
      }

      let target: CharacterState
      if (targetId) {
        const foundTarget = this.getAllCharacters().find(c => c.id === targetId)
        if (!foundTarget) {
          return { success: false, message: '未找到目标' }
        }
        target = foundTarget
      } else if (this.selectedTarget) {
        target = this.selectedTarget
      } else if (card.baseShield > 0 && card.baseDamage === 0) {
        target = actor
      } else {
        target = actor === this.player ? this.enemy! : this.player!
      }

      if (card.baseDamage > 0 && target.id !== actor.id) {
        const distance = this.getActualDistance(actor, target)
        if (distance > card.range) {
          return { success: false, message: `目标距离${distance}，超出攻击范围${card.range}` }
        }
      }

      return { success: true, actor, target, card }
    },

    consumeBasicCardResources(card: Card, actor: CharacterState) {
      actor.playCard(card.instanceId)
      actor.agility -= card.agilityCost
    },

    /**
     * 应用基础卡牌效果
     * 计算伤害、触发内功、应用护盾
     */
    applyBasicCardEffects(actor: CharacterState, target: CharacterState, card: Card) {
      const strengthMultiplier = calculateStrengthBonus(actor.strength)
      const baseDamage = Math.floor(card.baseDamage * strengthMultiplier)
      const totalShield = card.baseShield

      const totalDamage = this.triggerOnPlayCardPassives(actor, card, baseDamage)
      const actualDamage = this.applyDamageWithPassives(actor, target, totalDamage)

      return { actualDamage, totalShield }
    },

    triggerOnPlayCardPassives(actor: CharacterState, card: Card, baseDamage: number): number {
      let totalDamage = baseDamage
      actor.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.ON_PLAY_CARD) {
          const result = passive.effect(actor, card, totalDamage)
          if (result) {
            const effectResult = typeof result === 'string' ? { message: result } : result
            if (effectResult.bonusDamage) totalDamage += effectResult.bonusDamage
            if (effectResult.message) {
              this._events.emit(GameEventType.PASSIVE_TRIGGERED, {
                character: actor, passiveId: passive.id, passiveName: passive.name,
                trigger: TriggerTiming.ON_PLAY_CARD, effectResult
              })
            }
          }
        }
      })
      return totalDamage
    },

    applyDamageWithPassives(actor: CharacterState, target: CharacterState, damage: number): number {
      if (damage <= 0) return 0
      const result = target.takeDamage(damage, actor, this)
      actor.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.ON_DAMAGE) {
          const msg = passive.effect(actor, result.damage)
          if (msg) {
            this.addLog(typeof msg === 'string' ? msg : msg.message || '')
            this._events.emit(GameEventType.PASSIVE_TRIGGERED, {
              character: actor, passiveId: passive.id, passiveName: passive.name,
              trigger: TriggerTiming.ON_DAMAGE
            })
          }
        }
      })
      return result.damage
    },

    finalizeBasicCardUse(actor: CharacterState, target: CharacterState, card: Card, effectResult: { actualDamage: number; totalShield: number }) {
      let logMsg = `${actor.name}使用【${card.name}】`
      if (effectResult.actualDamage > 0) {
        logMsg += `，对${target.name}造成${effectResult.actualDamage}点伤害`
      }
      if (effectResult.totalShield > 0) {
        actor.shield += effectResult.totalShield
        logMsg += `，获得${effectResult.totalShield}点护盾`
        this._events.emit(GameEventType.CHARACTER_SHIELD, { character: actor, amount: effectResult.totalShield })
      }
      if (card.selfDamage) {
        actor.hp -= card.selfDamage
        logMsg += `，自身受到${card.selfDamage}点反伤`
      }
      this.addLog(logMsg)
    },

    // ==================== 武功招式 ====================

    useSkill(skillId: string, cardInstanceId: string, targetId?: string) {
      const validation = this.validateSkillUse(skillId, cardInstanceId, targetId)
      if (!validation.success) return validation

      const skillCopy = this.consumeSkillResources(validation.actor!, validation.card!, validation.skill!)

      const effectResult = this.processSkillEffects(validation.actor!, validation.target!, skillCopy)

      this.finalizeSkillUse(validation.actor!, validation.target!, skillCopy, effectResult)

      if (this.checkGameEnd()) {
        return { success: true, gameOver: true }
      }

      if (effectResult.extraAction) {
        this.extraAction = true
        this.addLog(`${validation.actor!.name}可以再行动一次`)
        return { success: true, extraAction: true }
      }

      if (effectResult.followUp) {
        this.followUp = true
        return { success: true, followUp: true }
      }

      this.checkTurnEnd()
      return { success: true }
    },

    validateSkillUse(skillId: string, cardInstanceId: string, targetId?: string) {
      const actor = this.currentActor!

      let target: CharacterState
      if (targetId) {
        const foundTarget = this.getAllCharacters().find(c => c.id === targetId)
        if (!foundTarget) {
          return { success: false, message: '未找到目标' }
        }
        target = foundTarget
      } else if (this.selectedTarget) {
        target = this.selectedTarget
      } else {
        target = actor === this.player ? this.enemy! : this.player!
      }

      const card = actor.hand.find(c => c.instanceId === cardInstanceId)
      const skill = actor.skills?.find(s => s.id === skillId)
      if (!card || !skill) {
        return { success: false, message: '无法使用武功招式' }
      }

      if (!actor.canUseSkill(skill, card, actor.agility)) {
        return { success: false, message: '条件不足' }
      }

      const hasDamageEffect = skill.effects.some(e => e.type === 'damage' || e.type === 'drainHp' || e.type === 'dot')
      if (hasDamageEffect && target.id !== actor.id) {
        const distance = this.getActualDistance(actor, target)
        if (distance > skill.range) {
          return { success: false, message: `目标距离${distance}，超出攻击范围${skill.range}` }
        }
      }

      return { success: true, actor, target, card, skill }
    },

    consumeSkillResources(actor: CharacterState, card: Card, skill: MartialArtSkill): MartialArtSkill {
      const skillCopy = { ...skill }

      actor.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.ON_SKILL_USE) {
          const msg = passive.effect(actor, skillCopy)
          if (msg) {
            const msgText = typeof msg === 'string' ? msg : msg.message || ''
            this.addLog(msgText)
            this._events.emit(GameEventType.PASSIVE_TRIGGERED, {
              character: actor,
              passiveId: passive.id,
              passiveName: passive.name,
              trigger: TriggerTiming.ON_SKILL_USE
            })
          }
        }
      })

      actor.playCard(card.instanceId)
      actor.useMp(skillCopy.mpCost - (skillCopy.mpCostReduction || 0))
      actor.agility -= skillCopy.agilityCost

      this.lastUsedSkill = skillCopy
      return skillCopy
    },

    processSkillEffects(actor: CharacterState, target: CharacterState, skill: MartialArtSkill) {
      let extraAction = false
      let followUp = false
      let actualDamage = 0

      for (const effect of skill.effects) {
        const result = this.processEffect(effect, actor, target, skill)
        if (result.actualDamage) actualDamage += result.actualDamage
        if (result.extraAction) extraAction = true
        if (result.followUp) followUp = true
      }

      return { actualDamage, extraAction, followUp }
    },

    finalizeSkillUse(actor: CharacterState, target: CharacterState, skill: MartialArtSkill, effectResult: { actualDamage: number; extraAction: boolean; followUp: boolean }) {
      let logMsg = `${actor.name}使用武功【${skill.name}】`
      if (effectResult.actualDamage > 0) {
        logMsg += `，对${target.name}造成${effectResult.actualDamage}点伤害`
      }
      this.addLog(logMsg)
    },

    // ==================== 效果处理 ====================

    processEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState, skill: MartialArtSkill) {
      const baseDamage = this.calculateEffectBaseDamage(effect, actor, skill)

      switch (effect.type) {
        case 'damage':
          return this.processDamageEffect(effect, actor, target, baseDamage)
        case 'shield':
          return this.processShieldEffect(effect, actor)
        case 'selfDamage':
          return this.processSelfDamageEffect(effect, actor)
        case 'drainMp':
          return this.processDrainMpEffect(effect, actor, target)
        case 'removeMp':
          return this.processRemoveMpEffect(effect, actor, target)
        case 'drainHp':
          return this.processDrainHpEffect(effect, actor, target)
        case 'dot':
          return this.processDotEffect(effect, target)
        case 'debuffAgility':
          return this.processDebuffEffect(effect, target)
        case 'disableCardType':
          return this.processDisableCardTypeEffect(effect, target)
        case 'extraAction':
          return { actualDamage: 0, extraAction: true }
        case 'followUp':
          return { actualDamage: 0, followUp: true }
        case 'mimic':
          return this.processMimicEffect(actor, target)
        default:
          return { actualDamage: 0 }
      }
    },

    calculateEffectBaseDamage(effect: SkillEffect, actor: CharacterState, skill: MartialArtSkill): number {
      const strengthMultiplier = calculateStrengthBonus(actor.strength)
      let totalDamage = effect.type === 'damage' || effect.type === 'drainHp'
        ? Math.floor((effect.value || 0) * strengthMultiplier)
        : (effect.value || 0)

      if (effect.type === 'damage') {
        actor.passives.forEach(passive => {
          if (passive.trigger === TriggerTiming.ON_SKILL_USE) {
            const result = passive.effect(actor, skill, totalDamage)
            if (result) {
              const effectResult = typeof result === 'string' ? {} : result
              if (effectResult.bonusDamage) totalDamage += effectResult.bonusDamage
              if (effectResult.message) {
                this._events.emit(GameEventType.PASSIVE_TRIGGERED, {
                  character: actor,
                  passiveId: passive.id,
                  passiveName: passive.name,
                  trigger: TriggerTiming.ON_SKILL_USE,
                  effectResult
                })
              }
            }
          }
        })
      }

      return totalDamage
    },

    processDamageEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState, baseDamage: number) {
      let actualDamage = 0

      if (effect.ignoreShield) {
        target.hp -= baseDamage
        actualDamage = baseDamage
        this._events.emit(GameEventType.CHARACTER_DAMAGED, { character: target, damage: actualDamage })
        this.triggerOnDamagePassives(actor, actualDamage)
      } else {
        const result = target.takeDamage(baseDamage, actor, this)
        actualDamage = result.damage
        this.triggerOnDamagePassives(actor, result.damage)
      }

      return { actualDamage }
    },

    triggerOnDamagePassives(actor: CharacterState, damage: number) {
      actor.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.ON_DAMAGE) {
          const msg = passive.effect(actor, damage)
          if (msg) {
            this._events.emit(GameEventType.PASSIVE_TRIGGERED, {
              character: actor,
              passiveId: passive.id,
              passiveName: passive.name,
              trigger: TriggerTiming.ON_DAMAGE
            })
          }
        }
      })
    },

    processShieldEffect(effect: SkillEffect, actor: CharacterState) {
      actor.shield += effect.value!
      this._events.emit(GameEventType.CHARACTER_SHIELD, { character: actor, amount: effect.value! })
      return { actualDamage: 0 }
    },

    processSelfDamageEffect(effect: SkillEffect, actor: CharacterState) {
      actor.hp -= effect.value!
      return { actualDamage: 0 }
    },

    processDrainMpEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState) {
      const drainMp = Math.min(effect.value!, target.mp)
      target.mp -= drainMp
      actor.recoverMp(drainMp)
      return { actualDamage: 0 }
    },

    processRemoveMpEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState) {
      const removeMp = Math.min(effect.value!, target.mp)
      target.mp -= removeMp
      target.takeDamage(removeMp, actor, this)
      return { actualDamage: 0 }
    },

    processDrainHpEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState) {
      const drainHp = Math.min(effect.value!, target.hp)
      target.hp -= drainHp
      actor.heal(drainHp)
      return { actualDamage: drainHp }
    },

    processDotEffect(effect: SkillEffect, target: CharacterState) {
      target.addDot(effect.value!, effect.duration!)
      return { actualDamage: 0 }
    },

    processDebuffEffect(effect: SkillEffect, target: CharacterState) {
      target.addDebuff('agility', effect.value!, effect.duration!)
      return { actualDamage: 0 }
    },

    processDisableCardTypeEffect(effect: SkillEffect, target: CharacterState) {
      target.addDebuff('disableCardType', effect.cardType!, effect.duration!)
      return { actualDamage: 0 }
    },

    processMimicEffect(actor: CharacterState, target: CharacterState) {
      let actualDamage = 0
      if (this.lastUsedSkill && this.lastUsedSkill.id !== 'littleFormless') {
        for (const e of this.lastUsedSkill.effects) {
          const r = this.processEffect(e, actor, target, this.lastUsedSkill)
          if (r.actualDamage) actualDamage += r.actualDamage
        }
      }
      return { actualDamage }
    },

    // ==================== 回合结束检查 ====================

    checkTurnEnd() {
      if (this.shouldSwitchActor()) {
        this.switchActor()

        if (this.currentActor!.agility <= 0) {
          this.endTurn()
          return
        }

        this.addLog(`轮到${this.currentActor!.name}行动`)
        this.phase = GamePhase.SELECTING
      } else {
        if (this.currentActor!.agility <= 0) {
          this.endTurn()
        }
      }
    },

    endTurn() {
      const allChars = this.getAllCharacters()

      // 触发回合结束内功
      allChars.forEach(char => {
        if (char.isAlive()) {
          const messages = char.onTurnEnd()
          messages.forEach(msg => this.addLog(msg))
        }
      })

      // 检查游戏结束
      if (this.checkGameEnd()) {
        return
      }

      this.startNewTurn()
    },

    // 检查游戏是否结束
    checkGameEnd(): boolean {
      const alivePlayers = this.getAliveCharacters('player')
      const aliveEnemies = this.getAliveCharacters('enemy')

      if (alivePlayers.length === 0 || aliveEnemies.length === 0) {
        this.endGame()
        return true
      }
      return false
    },

    endGame() {
      this.phase = GamePhase.GAME_OVER
      const alivePlayers = this.getAliveCharacters('player')
      const playerWon = alivePlayers.length > 0

      if (playerWon) {
        this.addLog('\n你赢了！')
      } else {
        this.addLog('\n你输了！')
      }
      this._events.emit(GameEventType.GAME_END, { playerWon })
    },

    addLog(message: string) {
      const logEntry = {
        id: Date.now() + Math.random(),
        text: message,
        time: new Date().toLocaleTimeString()
      }
      this.battleLog.push(logEntry)
      // === 调试日志 ===
      // console.log('[战斗日志]', message)
      this._events.emit(GameEventType.LOG_MESSAGE, logEntry)
    }
  }

  return state
}

// 保持向后兼容的类
export class Game {
  constructor() {
    return createGame()
  }
}