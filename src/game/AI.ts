import { GameState, CharacterState, Card, MartialArtSkill, GamePhase } from './types'

export class AI {
  private game: GameState

  constructor(game: GameState) {
    this.game = game
  }

  // 执行AI回合
  async executeTurn(): Promise<void> {
    const enemy = this.game.enemy!
    const player = this.game.player!

    console.log('AI executeTurn start')
    console.log('enemy agility:', enemy.agility)
    console.log('enemy hp:', enemy.hp)
    console.log('enemy hand:', enemy.hand.length)

    await this.delay(800)

    let hadAction = false
    let actionCount = 0
    const maxActions = 10 // 防止无限循环

    while (enemy.agility > 0 && enemy.isAlive() && player.isAlive() && actionCount < maxActions) {
      console.log('AI deciding action, agility:', enemy.agility)
      const action = this.decideAction()
      console.log('AI action:', action)

      if (!action) {
        this.game.addLog(`${enemy.name}没有可用的招式`)
        break
      }

      hadAction = true
      actionCount++

      if (action.type === 'skill' && action.skillId) {
        const result = this.game.useSkill(action.skillId, action.cardId)
        if (result.extraAction || result.followUp) {
          await this.delay(500)
          continue
        }
      } else {
        this.game.useBasicCard(action.cardId)
      }

      if (this.game.phase === GamePhase.GAME_OVER) {
        return
      }

      if (this.game.shouldSwitchActor()) {
        break
      }

      await this.delay(600)
    }

    console.log('AI turn ended, hadAction:', hadAction)

    if (this.game.phase !== GamePhase.GAME_OVER) {
      if (this.game.shouldSwitchActor()) {
        this.game.switchActor()
        this.game.addLog(`轮到${this.game.currentActor!.name}行动`)
        this.game.phase = GamePhase.SELECTING
      } else if (enemy.agility <= 0 || !hadAction) {
        this.game.endTurn()
      }
    }
  }

  // 决定行动
  decideAction(): { type: 'skill' | 'basic'; skillId?: string; cardId: string } | null {
    const enemy = this.game.enemy!
    const player = this.game.player!
    const currentAgility = enemy.agility

    const availableCards = enemy.getAvailableCards(currentAgility)
    if (availableCards.length === 0) {
      return null
    }

    // 检查是否可以使用武功招式
    const skillAction = this.tryUseSkill(enemy, player, currentAgility)
    if (skillAction) {
      return skillAction
    }

    // 检查是否需要防御
    if (this.shouldDefend(enemy, player)) {
      const defendCard = this.selectDefendCard(availableCards)
      if (defendCard) {
        return { type: 'basic', cardId: defendCard.instanceId }
      }
    }

    // 选择攻击卡牌
    const attackCard = this.selectAttackCard(availableCards, player)
    if (attackCard) {
      return { type: 'basic', cardId: attackCard.instanceId }
    }

    // 默认使用最低消耗的卡牌
    const card = this.selectLowestCostCard(availableCards)
    return card ? { type: 'basic', cardId: card.instanceId } : null
  }

  // 尝试使用武功招式
  private tryUseSkill(enemy: CharacterState, player: CharacterState, currentAgility: number): { type: 'skill'; skillId: string; cardId: string } | null {
    if (!enemy.skills || enemy.skills.length === 0) {
      return null
    }

    // 遍历所有武功招式，找到可用的
    for (const skill of enemy.skills) {
      if (enemy.mp < skill.mpCost || currentAgility < skill.agilityCost) {
        continue
      }

      // 检查是否有对应的手牌
      const validCards = enemy.hand.filter(card => {
        const typeMatch = skill.requiredCardType === 'any' || card.type === skill.requiredCardType
        return typeMatch && card.agilityCost <= currentAgility
      })

      if (validCards.length > 0) {
        // 决定是否使用这个武功招式
        if (this.shouldUseSkillNow(enemy, player, skill)) {
          const card = validCards[0]
          return { type: 'skill', skillId: skill.id, cardId: card.instanceId }
        }
      }
    }

    return null
  }

  // 判断是否应该现在使用武功招式
  private shouldUseSkillNow(enemy: CharacterState, player: CharacterState, skill: MartialArtSkill): boolean {
    // 玩家血量低时，用武功招式斩杀
    if (player.hp <= 15 && enemy.mp >= skill.mpCost) {
      return true
    }

    // 内力充足时使用
    const mpRatio = enemy.mp / enemy.maxMp
    if (mpRatio >= 0.5) {
      return true
    }

    return false
  }

  // 判断是否应该防御
  private shouldDefend(enemy: CharacterState, player: CharacterState): boolean {
    const hpRatio = enemy.hp / enemy.maxHp
    const playerHpRatio = player.hp / player.maxHp
    return hpRatio < 0.4 && enemy.shield < 3 && playerHpRatio > 0.5
  }

  // 选择防御卡牌
  private selectDefendCard(cards: Card[]): Card | null {
    const defendCards = cards.filter(c => c.baseShield > 0)
    if (defendCards.length > 0) {
      return defendCards.sort((a, b) => {
        if (a.baseShield !== b.baseShield) {
          return b.baseShield - a.baseShield
        }
        return a.agilityCost - b.agilityCost
      })[0]
    }
    return null
  }

  // 选择攻击卡牌
  private selectAttackCard(cards: Card[], player: CharacterState): Card | null {
    const attackCards = cards.filter(c => c.baseDamage > 0)
    if (attackCards.length === 0) {
      return cards[0] || null
    }

    if (player.shield > 0) {
      return attackCards.sort((a, b) => b.baseDamage - a.baseDamage)[0]
    }

    return attackCards.sort((a, b) => {
      const efficiencyA = a.baseDamage / a.agilityCost
      const efficiencyB = b.baseDamage / b.agilityCost
      return efficiencyB - efficiencyA
    })[0]
  }

  // 选择最低消耗卡牌
  private selectLowestCostCard(cards: Card[]): Card | null {
    if (!cards || cards.length === 0) return null
    return cards.sort((a, b) => a.agilityCost - b.agilityCost)[0]
  }

  // 延迟函数
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}