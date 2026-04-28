import { Card, CharacterState, MartialArtSkill, PassiveSkill, TriggerTiming, GameState, MartialArt, GameEventType } from './types'
import { CharacterConfig } from './CharacterConfig'
import { createBasicCard } from '../data/cards'
import { eventManager, EventManager } from '../utils/EventManager'

/**
 * 创建角色状态实例
 * @param config 角色配置
 * @param martialArtsList 武功列表
 * @param customEventManager 可选的自定义事件管理器，用于测试注入
 * @returns CharacterState 角色状态对象
 */
export function createCharacter(config: CharacterConfig, martialArtsList: MartialArt[], customEventManager?: EventManager): CharacterState {
  const emitter = customEventManager || eventManager
  // 收集所有武功招式和内功
  const skills: MartialArtSkill[] = []
  const passives: PassiveSkill[] = []

  martialArtsList.forEach(art => {
    // 支持多个武功招式
    if (art.skills && art.skills.length > 0) {
      skills.push(...art.skills)
    }
    if (art.passive) passives.push(art.passive)
  })

  // 使用 CharacterConfig 类的方法获取计算后的属性
  const maxHp = config.getMaxHp()
  const maxMp = config.getMaxMp()
  const baseAgility = config.getBaseAgility()

  const character: CharacterState = {
    _events: emitter,
    id: config.id,
    name: config.name,
    title: config.title,
    description: config.description,
    maxHp,
    hp: maxHp,
    maxMp,
    mp: maxMp,
    baseAgility,
    agility: baseAgility,
    agilityBonus: config.agilityBonus,
    shield: 0,

    // 弟子属性
    root: config.root,
    insight: config.insight,
    will: config.will,
    strength: config.strength,

    skills: skills,
    passives: passives,
    martialArtsNames: martialArtsList.map(a => a.name),

    deckTemplate: config.deck,
    deck: [],
    hand: [],
    discardPile: [],

    debuffs: [],
    dots: [],

    battlePosition: null,

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

    drawCards(count: number) {
      const drawn: Card[] = []
      for (let i = 0; i < count; i++) {
        if (this.deck.length === 0) {
          if (this.discardPile.length === 0) break
          this.deck = [...this.discardPile]
          this.discardPile = []
          this.shuffleDeck()
        }

        if (this.deck.length > 0 && this.hand.length < 7) {
          const card = this.deck.pop()!
          this.hand.push(card)
          drawn.push(card)
        }
      }
      // 发出抽牌事件
      if (drawn.length > 0) {
        this._events.emit(GameEventType.CARD_DRAWN, { character: this, cards: drawn })
      }
      return drawn
    },

    playCard(cardInstanceId: string) {
      const index = this.hand.findIndex(c => c.instanceId === cardInstanceId)
      if (index !== -1) {
        const card = this.hand.splice(index, 1)[0]
        this.discardPile.push(card)
        return card
      }
      return null
    },

    getCurrentAgility() {
      return this.baseAgility  // baseAgility 已包含身法加成
    },

    resetForNewTurn() {
      this.agility = this.getCurrentAgility()
      this.debuffs = this.debuffs.filter(debuff => {
        if (debuff.type === 'agility') {
          this.agility = Math.max(0, this.agility - (debuff.value as number))
        }
        debuff.duration--
        return debuff.duration > 0
      })
    },

    onTurnStart(_game: GameState) {
      const messages: string[] = []

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
          if (msg) {
            messages.push(typeof msg === 'string' ? msg : msg.message || '')
            // 发出内功触发事件
            this._events.emit(GameEventType.PASSIVE_TRIGGERED, {
              character: this,
              passiveId: passive.id,
              passiveName: passive.name,
              trigger: TriggerTiming.TURN_START
            })
          }
        }
      })

      return messages
    },

    onTurnEnd() {
      const messages: string[] = []

      this.passives.forEach(passive => {
        if (passive.trigger === TriggerTiming.TURN_END) {
          const msg = passive.effect(this)
          if (msg) {
            messages.push(typeof msg === 'string' ? msg : msg.message || '')
            // 发出内功触发事件
            this._events.emit(GameEventType.PASSIVE_TRIGGERED, {
              character: this,
              passiveId: passive.id,
              passiveName: passive.name,
              trigger: TriggerTiming.TURN_END
            })
          }
        }
      })

      return messages
    },

    takeDamage(damage: number, attacker: CharacterState | null = null, _game: GameState | null = null) {
      const passiveResult = this.processDamagePassives(damage, attacker)
      if (passiveResult.dodged) {
        return { damage: 0, messages: passiveResult.messages }
      }

      const shieldResult = this.applyShieldAbsorption(passiveResult.actualDamage)
      const finalMessages = [...passiveResult.messages, ...shieldResult.messages]

      this.applyFinalDamage(shieldResult.remainingDamage, finalMessages)

      return { damage: shieldResult.remainingDamage, messages: finalMessages }
    },

    processDamagePassives(damage: number, attacker: CharacterState | null): { dodged: boolean; actualDamage: number; messages: string[] } {
      const messages: string[] = []
      let actualDamage = damage

      for (const passive of this.passives) {
        if (passive.trigger === TriggerTiming.ON_TAKE_DAMAGE) {
          const result = passive.effect(this, damage)
          if (result) {
            const effectResult = typeof result === 'string' ? { message: result } : result
            if (effectResult.message) {
              messages.push(effectResult.message)
              this._events.emit(GameEventType.PASSIVE_TRIGGERED, {
                character: this,
                passiveId: passive.id,
                passiveName: passive.name,
                trigger: TriggerTiming.ON_TAKE_DAMAGE,
                effectResult
              })
            }
            if (effectResult.dodged) {
              if (effectResult.reflectDamage && attacker) {
                attacker.hp -= effectResult.reflectDamage
                messages.push(`${attacker.name}受到反弹伤害${effectResult.reflectDamage}点`)
              }
              return { dodged: true, actualDamage: 0, messages }
            }
            if (effectResult.reducedDamage !== undefined) {
              actualDamage = effectResult.reducedDamage
            }
          }
        }
      }

      return { dodged: false, actualDamage, messages }
    },

    applyShieldAbsorption(damage: number): { remainingDamage: number; messages: string[] } {
      const messages: string[] = []
      let remainingDamage = damage

      if (this.shield > 0 && remainingDamage > 0) {
        if (this.shield >= remainingDamage) {
          this.shield -= remainingDamage
          messages.push(`${this.name}的护盾吸收了${remainingDamage}点伤害`)
          this._events.emit(GameEventType.CHARACTER_DAMAGED, { character: this, damage: remainingDamage, absorbed: true })
          remainingDamage = 0
        } else {
          const absorbed = this.shield
          remainingDamage -= this.shield
          this.shield = 0
          messages.push(`${this.name}的护盾吸收了${absorbed}点伤害`)
        }
      }

      return { remainingDamage, messages }
    },

    applyFinalDamage(damage: number, messages: string[]) {
      if (damage > 0) {
        this.hp = Math.max(0, this.hp - damage)
        messages.push(`${this.name}受到${damage}点伤害`)
        this._events.emit(GameEventType.CHARACTER_DAMAGED, { character: this, damage })
      }
    },

    heal(amount: number) {
      const actualHeal = Math.min(amount, this.maxHp - this.hp)
      this.hp += actualHeal
      return actualHeal
    },

    recoverMp(amount: number) {
      const actualRecover = Math.min(amount, this.maxMp - this.mp)
      this.mp += actualRecover
      return actualRecover
    },

    useMp(amount: number) {
      if (this.mp >= amount) {
        this.mp -= amount
        return true
      }
      return false
    },

    isAlive() {
      return this.hp > 0
    },

    addDot(value: number, duration: number) {
      this.dots.push({ value, duration })
    },

    addDebuff(type: 'agility' | 'disableCardType', value: number | import('./types').CardType, duration: number) {
      this.debuffs.push({ type, value, duration })
    },

    getHandCards() {
      return [...this.hand]
    },

    getAvailableCards(currentAgility: number) {
      return this.hand.filter(card => {
        if (card.agilityCost > currentAgility) return false
        const disabledType = this.debuffs.find(d => d.type === 'disableCardType')
        if (disabledType && card.type === disabledType.value) return false
        return true
      })
    },

    canUseSkill(skill: MartialArtSkill, card: Card, currentAgility: number) {
      if (!skill) return false

      const requiredType = skill.requiredCardType
      const typeMatch = requiredType === 'any' || card.type === requiredType
      const mpEnough = this.mp >= skill.mpCost
      const agilityEnough = currentAgility >= skill.agilityCost

      return typeMatch && mpEnough && agilityEnough
    },

    getSkillCards(skill: MartialArtSkill, currentAgility: number) {
      if (!skill) return []

      return this.hand.filter(card => this.canUseSkill(skill, card, currentAgility))
    },

    getAvailableSkills(currentAgility: number) {
      return this.skills.filter(skill => {
        const hasCard = this.hand.some(card => {
          const typeMatch = skill.requiredCardType === 'any' || card.type === skill.requiredCardType
          return typeMatch && card.agilityCost <= currentAgility
        })
        return hasCard && this.mp >= skill.mpCost && currentAgility >= skill.agilityCost
      })
    },

    getDistanceTo(target: CharacterState, totalSeats: number): number {
      if (!this.battlePosition || !target.battlePosition) return 0
      const diff = Math.abs(this.battlePosition.seatIndex - target.battlePosition.seatIndex)
      return Math.min(diff, totalSeats - diff)
    }
  }

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
  constructor(config: CharacterConfig, martialArtsList: MartialArt[]) {
    const char = createCharacter(config, martialArtsList)
    Object.assign(this, char)
  }
}