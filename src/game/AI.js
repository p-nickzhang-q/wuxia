export class AI {
  constructor(game) {
    this.game = game
  }

  // 执行AI回合
  async executeTurn() {
    const enemy = this.game.enemy
    const player = this.game.player

    await this.delay(800)

    let hadAction = false

    while (enemy.agility > 0 && enemy.isAlive() && player.isAlive()) {
      const action = this.decideAction()

      if (!action) {
        this.game.addLog(`${enemy.name}没有可用的招式`)
        break
      }

      hadAction = true

      if (action.type === 'skill') {
        const result = this.game.useSkill(action.skillId, action.cardId)
        if (result.extraAction || result.followUp) {
          await this.delay(500)
          continue
        }
      } else {
        this.game.useBasicCard(action.cardId)
      }

      if (this.game.phase === 'gameOver') {
        return
      }

      if (this.game.shouldSwitchActor()) {
        break
      }

      await this.delay(600)
    }

    if (this.game.phase !== 'gameOver') {
      if (this.game.shouldSwitchActor()) {
        this.game.switchActor()
        this.game.addLog(`轮到${this.game.currentActor.name}行动`)
        this.game.phase = 'selecting'
      } else if (enemy.agility <= 0 || !hadAction) {
        this.game.endTurn()
      }
    }
  }

  // 决定行动
  decideAction() {
    const enemy = this.game.enemy
    const player = this.game.player
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
    const attackCard = this.selectAttackCard(availableCards, enemy, player)
    if (attackCard) {
      return { type: 'basic', cardId: attackCard.instanceId }
    }

    // 默认使用最低消耗的卡牌
    const card = this.selectLowestCostCard(availableCards)
    return card ? { type: 'basic', cardId: card.instanceId } : null
  }

  // 尝试使用武功招式
  tryUseSkill(enemy, player, currentAgility) {
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
  shouldUseSkillNow(enemy, player, skill) {
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
  shouldDefend(enemy, player) {
    const hpRatio = enemy.hp / enemy.maxHp
    const playerHpRatio = player.hp / player.maxHp
    return hpRatio < 0.4 && enemy.shield < 3 && playerHpRatio > 0.5
  }

  // 选择防御卡牌
  selectDefendCard(cards) {
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
  selectAttackCard(cards, enemy, player) {
    const attackCards = cards.filter(c => c.baseDamage > 0)
    if (attackCards.length === 0) {
      return cards[0]
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
  selectLowestCostCard(cards) {
    if (!cards || cards.length === 0) return null
    return cards.sort((a, b) => a.agilityCost - b.agilityCost)[0]
  }

  // 延迟函数
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}