import { reactive } from 'vue'
import { TriggerTiming } from '../data/skills.js'

export function createGame() {
  const game = reactive({
    player: null,
    enemy: null,
    currentTurn: 0,
    currentActor: null,
    phase: 'setup',
    battleLog: [],
    lastUsedSkill: null,
    selectedCard: null,
    extraAction: false,
    followUp: false,

    init(player, enemy) {
      this.player = player
      this.enemy = enemy
      this.currentTurn = 0
      this.phase = 'setup'
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

      this.player.resetForNewTurn()
      this.enemy.resetForNewTurn()

      const playerMessages = this.player.onTurnStart(this)
      const enemyMessages = this.enemy.onTurnStart(this)

      playerMessages.forEach(msg => this.addLog(msg))
      enemyMessages.forEach(msg => this.addLog(msg))

      const playerDrawn = this.player.drawCards(2)
      const enemyDrawn = this.enemy.drawCards(2)
      this.addLog(`${this.player.name}抽了${playerDrawn.length}张牌`)
      this.addLog(`${this.enemy.name}抽了${enemyDrawn.length}张牌`)

      if (!this.player.isAlive() || !this.enemy.isAlive()) {
        this.endGame()
        return
      }

      this.decideTurnOrder()
    },

    decideTurnOrder() {
      if (this.player.getCurrentAgility() >= this.enemy.getCurrentAgility()) {
        this.currentActor = this.player
        this.addLog(`${this.player.name}轻功较高，先行动`)
      } else {
        this.currentActor = this.enemy
        this.addLog(`${this.enemy.name}轻功较高，先行动`)
      }

      this.phase = 'selecting'
    },

    switchActor() {
      this.currentActor = this.currentActor === this.player ? this.enemy : this.player
    },

    shouldSwitchActor() {
      const opponent = this.currentActor === this.player ? this.enemy : this.player
      return this.currentActor.agility <= opponent.agility
    },

    useBasicCard(cardInstanceId) {
      const actor = this.currentActor
      const opponent = actor === this.player ? this.enemy : this.player
      const card = actor.hand.find(c => c.instanceId === cardInstanceId)

      if (!card) {
        return { success: false, message: '未找到该卡牌' }
      }

      if (card.agilityCost > actor.agility) {
        return { success: false, message: '轻功不足' }
      }

      actor.playCard(cardInstanceId)
      actor.agility -= card.agilityCost

      const messages = []
      let totalDamage = card.baseDamage
      let totalShield = card.baseShield

      // 触发所有内功（基础招式加成）
      actor.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.ON_PLAY_CARD) {
          const result = passive.effect(actor, card, totalDamage)
          if (result) {
            if (result.message) messages.push(result.message)
            if (result.bonusDamage) totalDamage += result.bonusDamage
          }
        }
      })

      if (totalDamage > 0) {
        const result = opponent.takeDamage(totalDamage, actor, this)
        messages.push(...result.messages)

        // 触发所有内功（造成伤害）
        actor.passives.forEach(passive => {
          if (passive.trigger === TriggerTiming.ON_DAMAGE) {
            const msg = passive.effect(actor, result.damage)
            if (msg) messages.push(msg)
          }
        })
      }

      if (totalShield > 0) {
        actor.shield += totalShield
        messages.push(`${actor.name}获得${totalShield}点护盾`)
      }

      if (card.selfDamage) {
        actor.hp -= card.selfDamage
        messages.push(`${actor.name}受到${card.selfDamage}点反伤`)
      }

      this.addLog(`${actor.name}使用【${card.name}】`)
      messages.forEach(msg => this.addLog(msg))

      if (!opponent.isAlive()) {
        this.endGame()
        return { success: true, gameOver: true }
      }

      this.checkTurnEnd()

      return { success: true }
    },

    useSkill(skillId, cardInstanceId) {
      const actor = this.currentActor
      const opponent = actor === this.player ? this.enemy : this.player
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
          if (msg) this.addLog(msg)
        }
      })

      actor.playCard(cardInstanceId)
      actor.useMp(skillCopy.mpCost - (skillCopy.mpCostReduction || 0))
      actor.agility -= skillCopy.agilityCost

      this.lastUsedSkill = skillCopy

      const messages = []
      this.addLog(`${actor.name}使用武功【${skillCopy.name}】`)

      let extraAction = false
      let followUp = false

      for (const effect of skillCopy.effects) {
        const result = this.processEffect(effect, actor, opponent, skillCopy)
        if (result.messages) {
          messages.push(...result.messages)
        }
        if (result.extraAction) extraAction = true
        if (result.followUp) followUp = true
      }

      messages.forEach(msg => this.addLog(msg))

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

    processEffect(effect, actor, opponent, skill) {
      const messages = []
      let totalDamage = effect.value || 0

      // 触发所有内功（武功招式伤害加成）
      actor.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.ON_SKILL_USE && effect.type === 'damage') {
          const result = passive.effect(actor, skill, totalDamage)
          if (result) {
            if (result.message) messages.push(result.message)
            if (result.bonusDamage) totalDamage += result.bonusDamage
          }
        }
      })

      switch (effect.type) {
        case 'damage':
          if (effect.ignoreShield) {
            opponent.hp -= totalDamage
            messages.push(`${opponent.name}受到${totalDamage}点伤害（无视护盾）`)
          } else {
            const result = opponent.takeDamage(totalDamage, actor, this)
            messages.push(...result.messages)

            // 触发所有内功（造成伤害）
            actor.passives.forEach(passive => {
              if (passive.trigger === TriggerTiming.ON_DAMAGE) {
                const msg = passive.effect(actor, result.damage)
                if (msg) messages.push(msg)
              }
            })
          }
          break

        case 'shield':
          actor.shield += effect.value
          messages.push(`${actor.name}获得${effect.value}点护盾`)
          break

        case 'selfDamage':
          actor.hp -= effect.value
          messages.push(`${actor.name}失去${effect.value}点体力`)
          break

        case 'drainMp':
          const drainMp = Math.min(effect.value, opponent.mp)
          opponent.mp -= drainMp
          actor.recoverMp(drainMp)
          messages.push(`${actor.name}吸取了${drainMp}点内力`)
          break

        case 'removeMp':
          const removeMp = Math.min(effect.value, opponent.mp)
          opponent.mp -= removeMp
          opponent.takeDamage(removeMp, actor, this)
          messages.push(`${opponent.name}失去${removeMp}点内力并受到等量伤害`)
          break

        case 'drainHp':
          const drainHp = Math.min(effect.value, opponent.hp)
          opponent.hp -= drainHp
          actor.heal(drainHp)
          messages.push(`${actor.name}吸取了${drainHp}点体力`)
          break

        case 'dot':
          opponent.addDot(effect.value, effect.duration)
          messages.push(`${opponent.name}被施加生死符，每回合失去${effect.value}点体力，持续${effect.duration}回合`)
          break

        case 'debuffAgility':
          opponent.addDebuff('agility', effect.value, effect.duration)
          messages.push(`${opponent.name}轻功降低${effect.value}点`)
          break

        case 'disableCardType':
          opponent.addDebuff('disableCardType', effect.cardType, effect.duration)
          messages.push(`${opponent.name}下回合无法使用${effect.cardType}类招式`)
          break

        case 'extraAction':
          return { messages, extraAction: true }

        case 'followUp':
          return { messages, followUp: true }

        case 'mimic':
          if (this.lastUsedSkill && this.lastUsedSkill.id !== 'littleFormless') {
            messages.push(`${actor.name}模仿了【${this.lastUsedSkill.name}】`)
            for (const e of this.lastUsedSkill.effects) {
              const r = this.processEffect(e, actor, opponent, this.lastUsedSkill)
              if (r.messages) messages.push(...r.messages)
            }
          } else {
            messages.push('没有可模仿的武功招式')
          }
          break
      }

      return { messages }
    },

    checkTurnEnd() {
      if (this.shouldSwitchActor()) {
        this.switchActor()

        if (this.currentActor.agility <= 0) {
          this.endTurn()
          return
        }

        this.addLog(`轮到${this.currentActor.name}行动`)

        if (this.currentActor === this.enemy) {
          this.phase = 'acting'
        } else {
          this.phase = 'selecting'
        }
      } else {
        if (this.currentActor.agility <= 0) {
          this.endTurn()
        }
      }
    },

    endTurn() {
      const playerMessages = this.player.onTurnEnd()
      const enemyMessages = this.enemy.onTurnEnd()

      playerMessages.forEach(msg => this.addLog(msg))
      enemyMessages.forEach(msg => this.addLog(msg))

      if (!this.player.isAlive() || !this.enemy.isAlive()) {
        this.endGame()
        return
      }

      this.startNewTurn()
    },

    endGame() {
      this.phase = 'gameOver'
      if (this.player.isAlive()) {
        this.addLog('\n你赢了！')
      } else {
        this.addLog('\n你输了！')
      }
    },

    addLog(message) {
      this.battleLog.push({
        id: Date.now() + Math.random(),
        text: message,
        time: new Date().toLocaleTimeString()
      })
    }
  })

  return game
}

// 保持向后兼容的类
export class Game {
  constructor() {
    return createGame()
  }
}