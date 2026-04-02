import { CharacterState, GameState, GamePhase, MartialArtSkill, SkillEffect, TriggerTiming, GameEventType } from './types'
import { eventManager } from '../utils/EventManager'

// 创建游戏状态
export function createGame(): GameState {
  const state: GameState = {
    player: null,
    enemy: null,
    currentTurn: 0,
    currentActor: null,
    phase: GamePhase.SETUP,
    battleLog: [],
    lastUsedSkill: null,
    selectedCard: null,
    extraAction: false,
    followUp: false,

    init(player: CharacterState, enemy: CharacterState) {
      this.player = player
      this.enemy = enemy
      this.currentTurn = 0
      this.phase = GamePhase.SETUP
      this.battleLog = []
      this.lastUsedSkill = null
      this.selectedCard = null

      player.initDeck()
      enemy.initDeck()

      player.drawCards(5)
      enemy.drawCards(5)

      this.addLog('战斗开始！')
      this.startNewTurn()
    },

    startNewTurn() {
      this.currentTurn++
      this.addLog(`\n--- 第${this.currentTurn}回合 ---`)

      this.player!.resetForNewTurn()
      this.enemy!.resetForNewTurn()

      const playerMessages = this.player!.onTurnStart(this)
      const enemyMessages = this.enemy!.onTurnStart(this)

      playerMessages.forEach(msg => this.addLog(msg))
      enemyMessages.forEach(msg => this.addLog(msg))

      const playerDrawn = this.player!.drawCards(2)
      const enemyDrawn = this.enemy!.drawCards(2)
      this.addLog(`${this.player!.name}抽了${playerDrawn.length}张牌`)
      this.addLog(`${this.enemy!.name}抽了${enemyDrawn.length}张牌`)

      if (!this.player!.isAlive() || !this.enemy!.isAlive()) {
        this.endGame()
        return
      }

      // 发出回合开始事件
      eventManager.emit(GameEventType.TURN_START, { turnNumber: this.currentTurn })

      this.decideTurnOrder()
    },

    decideTurnOrder() {
      if (this.player!.getCurrentAgility() >= this.enemy!.getCurrentAgility()) {
        this.currentActor = this.player
        this.addLog(`${this.player!.name}轻功较高，先行动`)
      } else {
        this.currentActor = this.enemy
        this.addLog(`${this.enemy!.name}轻功较高，先行动`)
      }

      this.phase = GamePhase.SELECTING
    },

    switchActor() {
      this.currentActor = this.currentActor === this.player ? this.enemy : this.player
    },

    shouldSwitchActor() {
      const opponent = this.currentActor === this.player ? this.enemy : this.player
      return this.currentActor!.agility <= opponent!.agility
    },

    useBasicCard(cardInstanceId: string) {
      const actor = this.currentActor!
      const opponent = actor === this.player ? this.enemy! : this.player!
      const card = actor.hand.find(c => c.instanceId === cardInstanceId)

      if (!card) {
        return { success: false, message: '未找到该卡牌' }
      }

      if (card.agilityCost > actor.agility) {
        return { success: false, message: '轻功不足' }
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
              // 发出内功触发事件
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
        const result = opponent.takeDamage(totalDamage, actor, this)
        actualDamage = result.damage

        // 触发所有内功（造成伤害）
        actor.passives.forEach(passive => {
          if (passive.trigger === TriggerTiming.ON_DAMAGE) {
            const msg = passive.effect(actor, result.damage)
            if (msg) {
              this.addLog(typeof msg === 'string' ? msg : msg.message || '')
              // 发出内功触发事件
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
        logMsg += `，对${opponent.name}造成${actualDamage}点伤害`
      }
      if (totalShield > 0) {
        actor.shield += totalShield
        logMsg += `，获得${totalShield}点护盾`
        // 发出护盾变化事件
        eventManager.emit(GameEventType.CHARACTER_SHIELD, { character: actor, amount: totalShield })
      }
      if (card.selfDamage) {
        actor.hp -= card.selfDamage
        logMsg += `，自身受到${card.selfDamage}点反伤`
      }
      this.addLog(logMsg)

      if (!opponent.isAlive()) {
        this.endGame()
        return { success: true, gameOver: true }
      }

      this.checkTurnEnd()

      return { success: true }
    },

    useSkill(skillId: string, cardInstanceId: string) {
      const actor = this.currentActor!
      const opponent = actor === this.player ? this.enemy! : this.player!
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
            // 发出内功触发事件
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
        const result = this.processEffect(effect, actor, opponent, skillCopy)
        if (result.actualDamage) actualDamage += result.actualDamage
        if (result.extraAction) extraAction = true
        if (result.followUp) followUp = true
      }

      // 统一日志格式
      let logMsg = `${actor.name}使用武功【${skillCopy.name}】`
      if (actualDamage > 0) {
        logMsg += `，对${opponent.name}造成${actualDamage}点伤害`
      }
      this.addLog(logMsg)

      if (!opponent.isAlive()) {
        this.endGame()
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

    processEffect(effect: SkillEffect, actor: CharacterState, opponent: CharacterState, skill: MartialArtSkill) {
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
              // 发出内功触发事件
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
            opponent.hp -= totalDamage
            actualDamage = totalDamage
            // 发出受伤事件（无视护盾的情况）
            eventManager.emit(GameEventType.CHARACTER_DAMAGED, { character: opponent, damage: actualDamage })

            // 触发所有内功（造成伤害）- ignoreShield 情况
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
            const result = opponent.takeDamage(totalDamage, actor, this)
            actualDamage = result.damage

            // 触发所有内功（造成伤害）
            actor.passives.forEach(passive => {
              if (passive.trigger === TriggerTiming.ON_DAMAGE) {
                const msg = passive.effect(actor, result.damage)
                if (msg) {
                  // 发出内功触发事件
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
          const shieldChange = effect.value!
          // 发出护盾变化事件
          eventManager.emit(GameEventType.CHARACTER_SHIELD, { character: actor, amount: shieldChange })
          break

        case 'selfDamage':
          actor.hp -= effect.value!
          break

        case 'drainMp':
          const drainMp = Math.min(effect.value!, opponent.mp)
          opponent.mp -= drainMp
          actor.recoverMp(drainMp)
          break

        case 'removeMp':
          const removeMp = Math.min(effect.value!, opponent.mp)
          opponent.mp -= removeMp
          opponent.takeDamage(removeMp, actor, this)
          break

        case 'drainHp':
          const drainHp = Math.min(effect.value!, opponent.hp)
          opponent.hp -= drainHp
          actor.heal(drainHp)
          break

        case 'dot':
          opponent.addDot(effect.value!, effect.duration!)
          break

        case 'debuffAgility':
          opponent.addDebuff('agility', effect.value!, effect.duration!)
          break

        case 'disableCardType':
          opponent.addDebuff('disableCardType', effect.cardType!, effect.duration!)
          break

        case 'extraAction':
          return { actualDamage, extraAction: true }

        case 'followUp':
          return { actualDamage, followUp: true }

        case 'mimic':
          if (this.lastUsedSkill && this.lastUsedSkill.id !== 'littleFormless') {
            for (const e of this.lastUsedSkill.effects) {
              const r = this.processEffect(e, actor, opponent, this.lastUsedSkill)
              if (r.actualDamage) actualDamage += r.actualDamage
            }
          }
          break
      }

      return { actualDamage }
    },

    checkTurnEnd() {
      if (this.shouldSwitchActor()) {
        this.switchActor()

        if (this.currentActor!.agility <= 0) {
          this.endTurn()
          return
        }

        this.addLog(`轮到${this.currentActor!.name}行动`)

        // 无论是玩家还是敌人，都设置为 SELECTING
        this.phase = GamePhase.SELECTING
      } else {
        if (this.currentActor!.agility <= 0) {
          this.endTurn()
        }
      }
    },

    endTurn() {
      const playerMessages = this.player!.onTurnEnd()
      const enemyMessages = this.enemy!.onTurnEnd()

      playerMessages.forEach(msg => this.addLog(msg))
      enemyMessages.forEach(msg => this.addLog(msg))

      if (!this.player!.isAlive() || !this.enemy!.isAlive()) {
        this.endGame()
        return
      }

      this.startNewTurn()
    },

    endGame() {
      this.phase = GamePhase.GAME_OVER
      const playerWon = this.player!.isAlive()
      if (playerWon) {
        this.addLog('\n你赢了！')
      } else {
        this.addLog('\n你输了！')
      }
      // 发出游戏结束事件
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