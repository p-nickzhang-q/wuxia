import { CharacterState, GameState, GamePhase, MartialArtSkill, SkillEffect, TriggerTiming, GameEventType, BattleMode } from './types'
import { eventManager } from '../utils/EventManager'
import { getTargetsInRange, assignSeats } from './DistanceSystem'

// 创建游戏状态
export function createGame(): GameState {
  const state: GameState = {
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

    selectTarget(target: CharacterState | null): void {
      this.selectedTarget = target
    },

    // ==================== 回合管理 ====================

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
      eventManager.emit(GameEventType.TURN_START, { turnNumber: this.currentTurn })

      this.decideTurnOrder()
    },

    decideTurnOrder() {
      // 获取所有存活角色并按轻功排序
      const aliveChars = this.getAliveCharacters()
        .filter(c => c.isAlive())
        .sort((a, b) => b.getCurrentAgility() - a.getCurrentAgility())

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
        .sort((a, b) => b.getCurrentAgility() - a.getCurrentAgility())

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

    useBasicCard(cardInstanceId: string, targetId?: string) {
      const actor = this.currentActor!

      const card = actor.hand.find(c => c.instanceId === cardInstanceId)

      if (!card) {
        return { success: false, message: '未找到该卡牌' }
      }

      if (card.agilityCost > actor.agility) {
        return { success: false, message: '轻功不足' }
      }

      // 确定目标
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
        // 纯防御卡牌（如格挡），目标是自己
        target = actor
      } else {
        // 向后兼容：默认攻击敌人
        target = actor === this.player ? this.enemy! : this.player!
      }

      actor.playCard(cardInstanceId)
      actor.agility -= card.agilityCost

      let totalDamage = card.baseDamage
      let totalShield = card.baseShield
      let actualDamage = 0

      // 触发所有内功（基础招式加成）
      actor.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.ON_PLAY_CARD) {
          const result = passive.effect(actor, card, totalDamage)
          if (result) {
            const effectResult = typeof result === 'string' ? { message: result } : result
            if (effectResult.bonusDamage) totalDamage += effectResult.bonusDamage
            if (effectResult.message) {
              eventManager.emit(GameEventType.PASSIVE_TRIGGERED, {
                character: actor,
                passiveId: passive.id,
                passiveName: passive.name,
                trigger: TriggerTiming.ON_PLAY_CARD,
                effectResult
              })
            }
          }
        }
      })

      if (totalDamage > 0) {
        const result = target.takeDamage(totalDamage, actor, this)
        actualDamage = result.damage

        // 触发所有内功（造成伤害）
        actor.passives.forEach(passive => {
          if (passive.trigger === TriggerTiming.ON_DAMAGE) {
            const msg = passive.effect(actor, result.damage)
            if (msg) {
              this.addLog(typeof msg === 'string' ? msg : msg.message || '')
              eventManager.emit(GameEventType.PASSIVE_TRIGGERED, {
                character: actor,
                passiveId: passive.id,
                passiveName: passive.name,
                trigger: TriggerTiming.ON_DAMAGE
              })
            }
          }
        })
      }

      // 统一日志格式
      let logMsg = `${actor.name}使用【${card.name}】`
      if (actualDamage > 0) {
        logMsg += `，对${target.name}造成${actualDamage}点伤害`
      }
      if (totalShield > 0) {
        actor.shield += totalShield
        logMsg += `，获得${totalShield}点护盾`
        eventManager.emit(GameEventType.CHARACTER_SHIELD, { character: actor, amount: totalShield })
      }
      if (card.selfDamage) {
        actor.hp -= card.selfDamage
        logMsg += `，自身受到${card.selfDamage}点反伤`
      }
      this.addLog(logMsg)

      // 检查游戏结束
      if (this.checkGameEnd()) {
        return { success: true, gameOver: true }
      }

      this.checkTurnEnd()
      return { success: true }
    },

    // ==================== 武功招式 ====================

    useSkill(skillId: string, cardInstanceId: string, targetId?: string) {
      const actor = this.currentActor!

      // 确定目标
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
        // 向后兼容：默认攻击敌人
        target = actor === this.player ? this.enemy! : this.player!
      }

      const card = actor.hand.find(c => c.instanceId === cardInstanceId)

      // 查找指定的武功招式
      const skill = actor.skills?.find(s => s.id === skillId)
      if (!card || !skill) {
        return { success: false, message: '无法使用武功招式' }
      }

      if (!actor.canUseSkill(skill, card, actor.agility)) {
        return { success: false, message: '条件不足' }
      }

      const skillCopy = { ...skill }

      // 触发所有内功（武功招式消耗减免）
      actor.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.ON_SKILL_USE) {
          const msg = passive.effect(actor, skillCopy)
          if (msg) {
            const msgText = typeof msg === 'string' ? msg : msg.message || ''
            this.addLog(msgText)
            eventManager.emit(GameEventType.PASSIVE_TRIGGERED, {
              character: actor,
              passiveId: passive.id,
              passiveName: passive.name,
              trigger: TriggerTiming.ON_SKILL_USE
            })
          }
        }
      })

      actor.playCard(cardInstanceId)
      actor.useMp(skillCopy.mpCost - (skillCopy.mpCostReduction || 0))
      actor.agility -= skillCopy.agilityCost

      this.lastUsedSkill = skillCopy

      let extraAction = false
      let followUp = false
      let actualDamage = 0

      for (const effect of skillCopy.effects) {
        const result = this.processEffect(effect, actor, target, skillCopy)
        if (result.actualDamage) actualDamage += result.actualDamage
        if (result.extraAction) extraAction = true
        if (result.followUp) followUp = true
      }

      // 统一日志格式
      let logMsg = `${actor.name}使用武功【${skillCopy.name}】`
      if (actualDamage > 0) {
        logMsg += `，对${target.name}造成${actualDamage}点伤害`
      }
      this.addLog(logMsg)

      // 检查游戏结束
      if (this.checkGameEnd()) {
        return { success: true, gameOver: true }
      }

      if (extraAction) {
        this.extraAction = true
        this.addLog(`${actor.name}可以再行动一次`)
        return { success: true, extraAction: true }
      }

      if (followUp) {
        this.followUp = true
        return { success: true, followUp: true }
      }

      this.checkTurnEnd()
      return { success: true }
    },

    // ==================== 效果处理 ====================

    processEffect(effect: SkillEffect, actor: CharacterState, target: CharacterState, skill: MartialArtSkill) {
      let totalDamage = effect.value || 0
      let actualDamage = 0

      // 触发所有内功（武功招式伤害加成）
      actor.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.ON_SKILL_USE && effect.type === 'damage') {
          const result = passive.effect(actor, skill, totalDamage)
          if (result) {
            const effectResult = typeof result === 'string' ? {} : result
            if (effectResult.bonusDamage) totalDamage += effectResult.bonusDamage
            if (effectResult.message) {
              eventManager.emit(GameEventType.PASSIVE_TRIGGERED, {
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

      switch (effect.type) {
        case 'damage':
          if (effect.ignoreShield) {
            target.hp -= totalDamage
            actualDamage = totalDamage
            eventManager.emit(GameEventType.CHARACTER_DAMAGED, { character: target, damage: actualDamage })

            actor.passives.forEach(passive => {
              if (passive.trigger === TriggerTiming.ON_DAMAGE) {
                const msg = passive.effect(actor, actualDamage)
                if (msg) {
                  eventManager.emit(GameEventType.PASSIVE_TRIGGERED, {
                    character: actor,
                    passiveId: passive.id,
                    passiveName: passive.name,
                    trigger: TriggerTiming.ON_DAMAGE
                  })
                }
              }
            })
          } else {
            const result = target.takeDamage(totalDamage, actor, this)
            actualDamage = result.damage

            actor.passives.forEach(passive => {
              if (passive.trigger === TriggerTiming.ON_DAMAGE) {
                const msg = passive.effect(actor, result.damage)
                if (msg) {
                  eventManager.emit(GameEventType.PASSIVE_TRIGGERED, {
                    character: actor,
                    passiveId: passive.id,
                    passiveName: passive.name,
                    trigger: TriggerTiming.ON_DAMAGE
                  })
                }
              }
            })
          }
          break

        case 'shield':
          actor.shield += effect.value!
          eventManager.emit(GameEventType.CHARACTER_SHIELD, { character: actor, amount: effect.value! })
          break

        case 'selfDamage':
          actor.hp -= effect.value!
          break

        case 'drainMp':
          const drainMp = Math.min(effect.value!, target.mp)
          target.mp -= drainMp
          actor.recoverMp(drainMp)
          break

        case 'removeMp':
          const removeMp = Math.min(effect.value!, target.mp)
          target.mp -= removeMp
          target.takeDamage(removeMp, actor, this)
          break

        case 'drainHp':
          const drainHp = Math.min(effect.value!, target.hp)
          target.hp -= drainHp
          actor.heal(drainHp)
          break

        case 'dot':
          target.addDot(effect.value!, effect.duration!)
          break

        case 'debuffAgility':
          target.addDebuff('agility', effect.value!, effect.duration!)
          break

        case 'disableCardType':
          target.addDebuff('disableCardType', effect.cardType!, effect.duration!)
          break

        case 'extraAction':
          return { actualDamage, extraAction: true }

        case 'followUp':
          return { actualDamage, followUp: true }

        case 'mimic':
          if (this.lastUsedSkill && this.lastUsedSkill.id !== 'littleFormless') {
            for (const e of this.lastUsedSkill.effects) {
              const r = this.processEffect(e, actor, target, this.lastUsedSkill)
              if (r.actualDamage) actualDamage += r.actualDamage
            }
          }
          break
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
      eventManager.emit(GameEventType.GAME_END, { playerWon })
    },

    addLog(message: string) {
      this.battleLog.push({
        id: Date.now() + Math.random(),
        text: message,
        time: new Date().toLocaleTimeString()
      })
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