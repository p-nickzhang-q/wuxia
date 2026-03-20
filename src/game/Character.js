import { reactive } from 'vue'
import { createBasicCard } from '../data/cards.js'
import { passiveSkills, TriggerTiming } from '../data/skills.js'

export function createCharacter(characterConfig, martialArtsList) {
  // 收集所有武功招式和内功
  const skills = []
  const passives = []

  martialArtsList.forEach(art => {
    if (art.skill) skills.push(art.skill)
    if (art.passive) passives.push(art.passive)
  })

  const character = reactive({
    name: characterConfig.name,
    title: characterConfig.title,
    description: characterConfig.description,
    maxHp: characterConfig.hp,
    hp: characterConfig.hp,
    maxMp: characterConfig.mp,
    mp: characterConfig.mp,
    baseAgility: characterConfig.agility,
    agility: characterConfig.agility,
    agilityBonus: 0,
    shield: 0,

    // 武功配置
    skills: skills,        // 武功招式列表
    passives: passives,    // 内功列表
    martialArtsNames: martialArtsList.map(a => a.name),

    // 卡组
    deckTemplate: characterConfig.deck,
    deck: [],
    hand: [],
    discardPile: [],

    // 状态效果
    debuffs: [],
    dots: [],

    // 方法
    initDeck() {
      this.deck = []
      this.hand = []
      this.discardPile = []

      this.deckTemplate.forEach((cardId, index) => {
        const card = createBasicCard(cardId, `${this.name}_${cardId}_${index}`)
        if (card) {
          this.deck.push(card)
        }
      })

      this.shuffleDeck()
    },

    shuffleDeck() {
      for (let i = this.deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[this.deck[i], this.deck[j]] = [this.deck[j], this.deck[i]]
      }
    },

    drawCards(count) {
      const drawn = []
      for (let i = 0; i < count; i++) {
        if (this.deck.length === 0) {
          if (this.discardPile.length === 0) break
          this.deck = [...this.discardPile]
          this.discardPile = []
          this.shuffleDeck()
        }

        if (this.deck.length > 0 && this.hand.length < 7) {
          const card = this.deck.pop()
          this.hand.push(card)
          drawn.push(card)
        }
      }
      return drawn
    },

    playCard(cardInstanceId) {
      const index = this.hand.findIndex(c => c.instanceId === cardInstanceId)
      if (index !== -1) {
        const card = this.hand.splice(index, 1)[0]
        this.discardPile.push(card)
        return card
      }
      return null
    },

    getCurrentAgility() {
      return this.baseAgility + this.agilityBonus
    },

    resetForNewTurn() {
      this.agility = this.getCurrentAgility()
      this.debuffs = this.debuffs.filter(debuff => {
        if (debuff.type === 'agility') {
          this.agility = Math.max(0, this.agility - debuff.value)
        }
        debuff.duration--
        return debuff.duration > 0
      })
    },

    onTurnStart(game) {
      const messages = []

      this.dots = this.dots.filter(dot => {
        this.hp -= dot.value
        messages.push(`${this.name}受到生死符效果，失去${dot.value}点体力`)
        dot.duration--
        return dot.duration > 0
      })

      // 触发所有内功
      this.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.TURN_START) {
          const msg = passive.effect(this)
          if (msg) messages.push(msg)
        }
      })

      return messages
    },

    onTurnEnd() {
      const messages = []

      this.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.TURN_END) {
          const msg = passive.effect(this)
          if (msg) messages.push(msg)
        }
      })

      return messages
    },

    takeDamage(damage, attacker = null, game = null) {
      let messages = []
      let actualDamage = damage

      // 触发所有内功（伤害减免/闪避）
      this.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.ON_TAKE_DAMAGE) {
          const result = passive.effect(this, damage)
          if (result) {
            if (result.message) messages.push(result.message)
            if (result.dodged) {
              if (result.reflectDamage && attacker) {
                attacker.hp -= result.reflectDamage
                messages.push(`${attacker.name}受到反弹伤害${result.reflectDamage}点`)
              }
              actualDamage = 0
              return { damage: 0, messages }
            }
            if (result.reducedDamage !== undefined) {
              actualDamage = result.reducedDamage
            }
          }
        }
      })

      if (actualDamage === 0) {
        return { damage: 0, messages }
      }

      // 护盾吸收
      if (this.shield > 0) {
        if (this.shield >= actualDamage) {
          this.shield -= actualDamage
          messages.push(`${this.name}的护盾吸收了${actualDamage}点伤害`)
          actualDamage = 0
        } else {
          const absorbed = this.shield
          actualDamage -= this.shield
          this.shield = 0
          messages.push(`${this.name}的护盾吸收了${absorbed}点伤害`)
        }
      }

      this.hp = Math.max(0, this.hp - actualDamage)
      if (actualDamage > 0) {
        messages.push(`${this.name}受到${actualDamage}点伤害`)
      }

      return { damage: actualDamage, messages }
    },

    heal(amount) {
      const actualHeal = Math.min(amount, this.maxHp - this.hp)
      this.hp += actualHeal
      return actualHeal
    },

    recoverMp(amount) {
      const actualRecover = Math.min(amount, this.maxMp - this.mp)
      this.mp += actualRecover
      return actualRecover
    },

    useMp(amount) {
      if (this.mp >= amount) {
        this.mp -= amount
        return true
      }
      return false
    },

    isAlive() {
      return this.hp > 0
    },

    addDot(value, duration) {
      this.dots.push({ value, duration })
    },

    addDebuff(type, value, duration) {
      this.debuffs.push({ type, value, duration })
    },

    getHandCards() {
      return [...this.hand]
    },

    getAvailableCards(currentAgility) {
      return this.hand.filter(card => {
        if (card.agilityCost > currentAgility) return false
        const disabledType = this.debuffs.find(d => d.type === 'disableCardType')
        if (disabledType && card.type === disabledType.value) return false
        return true
      })
    },

    // 检查是否可以使用某个武功招式
    canUseSkill(skill, card, currentAgility) {
      if (!skill) return false

      const requiredType = skill.requiredCardType
      const typeMatch = requiredType === 'any' || card.type === requiredType
      const mpEnough = this.mp >= skill.mpCost
      const agilityEnough = currentAgility >= skill.agilityCost

      return typeMatch && mpEnough && agilityEnough
    },

    // 获取可用于某个武功招式的手牌
    getSkillCards(skill, currentAgility) {
      if (!skill) return []

      return this.hand.filter(card => this.canUseSkill(skill, card, currentAgility))
    },

    // 获取所有可用的武功招式（有对应手牌且资源足够）
    getAvailableSkills(currentAgility) {
      return this.skills.filter(skill => {
        const hasCard = this.hand.some(card => {
          const typeMatch = skill.requiredCardType === 'any' || card.type === skill.requiredCardType
          return typeMatch && card.agilityCost <= currentAgility
        })
        return hasCard && this.mp >= skill.mpCost && currentAgility >= skill.agilityCost
      })
    },

    // 触发内功效果（用于武功招式使用时）
    triggerPassives(triggerTiming, ...args) {
      const messages = []
      this.passives.forEach(passive => {
        if (passive.trigger === triggerTiming) {
          const result = passive.effect(this, ...args)
          if (result) {
            if (typeof result === 'string') {
              messages.push(result)
            } else if (result.message) {
              messages.push(result.message)
            }
          }
        }
      })
      return messages
    }
  })

  // 初始化内功效果
  character.passives.forEach(passive => {
    if (passive.initEffect) {
      passive.initEffect(character)
    }
  })

  return character
}

// 保持向后兼容的类
export class Character {
  constructor(config, martialArtsList) {
    const char = createCharacter(config, martialArtsList)
    Object.assign(this, char)
  }
}