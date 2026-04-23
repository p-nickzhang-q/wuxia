import { GameState, CharacterState, Card, MartialArtSkill, GamePhase } from './types'

export class AI {
  private game: GameState

  constructor(game: GameState) {
    this.game = game
  }

  // 执行AI回合
  async executeTurn(): Promise<void> {
    const currentActor = this.game.currentActor!
    const enemies = this.getEnemies(currentActor)

    console.log('AI executeTurn start')
    console.log('actor:', currentActor.name)
    console.log('agility:', currentActor.agility)
    console.log('hp:', currentActor.hp)
    console.log('hand:', currentActor.hand.length)

    await this.delay(800)

    const actionResult = await this.executeActionLoop(currentActor, enemies)

    this.finalizeAITurn(currentActor, actionResult)
  }

  private async executeActionLoop(actor: CharacterState, enemies: CharacterState[]): Promise<{ hadAction: boolean }> {
    let hadAction = false
    let actionCount = 0
    const maxActions = 10

    while (actor.agility > 0 && actor.isAlive() && actionCount < maxActions) {
      const aliveEnemies = enemies.filter(e => e.isAlive())
      if (aliveEnemies.length === 0) break

      console.log('AI deciding action, agility:', actor.agility)
      const action = this.decideAction()
      console.log('AI action:', action)

      if (!action) {
        this.game.addLog(`${actor.name}没有可用的招式`)
        break
      }

      hadAction = true
      actionCount++

      await this.executeSingleAction(action)
      if (this.game.phase === GamePhase.GAME_OVER) {
        return { hadAction }
      }

      if (this.game.shouldSwitchActor()) {
        break
      }

      await this.delay(600)
    }

    console.log('AI turn ended, hadAction:', hadAction)
    return { hadAction }
  }

  private async executeSingleAction(action: { type: 'skill' | 'basic'; skillId?: string; cardId: string; targetId?: string }): Promise<void> {
    if (action.type === 'skill' && action.skillId) {
      const result = this.game.useSkill(action.skillId, action.cardId, action.targetId)
      if (result.extraAction || result.followUp) {
        await this.delay(500)
      }
    } else {
      this.game.useBasicCard(action.cardId, action.targetId)
    }
  }

  private finalizeAITurn(actor: CharacterState, actionResult: { hadAction: boolean }): void {
    if (this.game.phase !== GamePhase.GAME_OVER) {
      if (this.game.shouldSwitchActor()) {
        this.game.switchActor()
        this.game.addLog(`轮到${this.game.currentActor!.name}行动`)
        this.game.phase = GamePhase.SELECTING
      } else if (actor.agility <= 0 || !actionResult.hadAction) {
        this.game.endTurn()
      }
    }
  }

  // 决定行动
  decideAction(): { type: 'skill' | 'basic'; skillId?: string; cardId: string; targetId?: string } | null {
    const context = this.buildDecisionContext()
    if (!context.availableCards.length || !context.aliveEnemies.length) {
      return null
    }

    const target = this.selectBestTarget(context.actor, context.aliveEnemies)
    if (!target) return null

    const skillAction = this.trySkillAction(context.actor, target, context.currentAgility)
    if (skillAction) {
      return { ...skillAction, targetId: target.id }
    }

    const defendAction = this.tryDefendAction(context.actor, context.aliveEnemies, context.availableCards)
    if (defendAction) {
      return { ...defendAction, targetId: target.id }
    }

    return this.getDefaultAction(context.actor, context.availableCards, target)
  }

  private buildDecisionContext(): { actor: CharacterState; currentAgility: number; availableCards: Card[]; aliveEnemies: CharacterState[] } {
    const actor = this.game.currentActor!
    const currentAgility = actor.agility
    const availableCards = actor.getAvailableCards(currentAgility)
    const enemies = this.getEnemies(actor)
    const aliveEnemies = enemies.filter(e => e.isAlive())

    return { actor, currentAgility, availableCards, aliveEnemies }
  }

  private trySkillAction(actor: CharacterState, target: CharacterState, currentAgility: number): { type: 'skill'; skillId: string; cardId: string } | null {
    return this.tryUseSkill(actor, target, currentAgility)
  }

  private tryDefendAction(actor: CharacterState, aliveEnemies: CharacterState[], availableCards: Card[]): { type: 'basic'; cardId: string } | null {
    if (this.shouldDefend(actor, aliveEnemies)) {
      const defendCard = this.selectDefendCard(availableCards)
      if (defendCard) {
        return { type: 'basic', cardId: defendCard.instanceId }
      }
    }
    return null
  }

  private getDefaultAction(actor: CharacterState, availableCards: Card[], target: CharacterState): { type: 'basic'; cardId: string; targetId: string } | null {
    const attackCard = this.selectAttackCard(availableCards, actor, target)
    if (attackCard) {
      return { type: 'basic', cardId: attackCard.instanceId, targetId: target.id }
    }

    const card = this.selectLowestCostCard(availableCards)
    return card ? { type: 'basic', cardId: card.instanceId, targetId: target.id } : null
  }

  // 获取敌人列表
  private getEnemies(actor: CharacterState): CharacterState[] {
    const allChars = this.game.getAllCharacters()
    return allChars.filter(c => {
      if (c === actor) return false
      if (!c.isAlive()) return false
      const actorTeam = actor.battlePosition?.team
      const charTeam = c.battlePosition?.team
      if (this.game.battleMode === 'freeforall') return true
      return actorTeam !== charTeam
    })
  }

  // 选择最佳目标
  private selectBestTarget(actor: CharacterState, enemies: CharacterState[]): CharacterState | null {
    if (enemies.length === 0) return null

    // 按优先级排序：
    // 1. 血量最低的（可能斩杀）
    // 2. 距离最近的（更容易攻击）
    return enemies.sort((a, b) => {
      // 优先攻击血量低的目标
      if (a.hp !== b.hp) {
        return a.hp - b.hp
      }
      // 然后考虑距离
      const distA = this.game.getActualDistance(actor, a)
      const distB = this.game.getActualDistance(actor, b)
      return distA - distB
    })[0]
  }

  // 尝试使用武功招式
  private tryUseSkill(actor: CharacterState, target: CharacterState, currentAgility: number): { type: 'skill'; skillId: string; cardId: string } | null {
    if (!actor.skills || actor.skills.length === 0) {
      return null
    }

    // 遍历所有武功招式，找到可用的
    for (const skill of actor.skills) {
      // 检查 MP 和轻功消耗
      if (actor.mp < skill.mpCost || currentAgility < skill.agilityCost) {
        continue
      }

      // 检查目标是否在攻击范围内
      const distance = this.game.getActualDistance(actor, target)
      if (distance > skill.range) {
        continue
      }

      // 检查是否有对应的手牌
      const validCards = actor.hand.filter(card => {
        const typeMatch = skill.requiredCardType === 'any' || card.type === skill.requiredCardType
        return typeMatch && card.agilityCost <= currentAgility
      })

      if (validCards.length > 0) {
        // 决定是否使用这个武功招式
        if (this.shouldUseSkillNow(actor, target, skill)) {
          const card = validCards[0]
          return { type: 'skill', skillId: skill.id, cardId: card.instanceId }
        }
      }
    }

    return null
  }

  // 判断是否应该现在使用武功招式
  private shouldUseSkillNow(actor: CharacterState, target: CharacterState, skill: MartialArtSkill): boolean {
    // 目标血量低时，用武功招式斩杀
    if (target.hp <= 15 && actor.mp >= skill.mpCost) {
      return true
    }

    // 内力充足时使用
    const mpRatio = actor.mp / actor.maxMp
    if (mpRatio >= 0.5) {
      return true
    }

    return false
  }

  // 判断是否应该防御
  private shouldDefend(actor: CharacterState, enemies: CharacterState[]): boolean {
    const hpRatio = actor.hp / actor.maxHp
    // 计算敌人的平均血量比例
    const avgEnemyHpRatio = enemies.reduce((sum, e) => sum + e.hp / e.maxHp, 0) / enemies.length
    return hpRatio < 0.4 && actor.shield < 3 && avgEnemyHpRatio > 0.5
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
  private selectAttackCard(cards: Card[], actor: CharacterState, target: CharacterState): Card | null {
    const distance = this.game.getActualDistance(actor, target)
    // 过滤出能打到目标的攻击卡牌
    const attackCards = cards.filter(c => c.baseDamage > 0 && c.range >= distance)
    if (attackCards.length === 0) {
      // 如果没有能打到的攻击卡牌，返回任意一张可用卡牌
      return cards[0] || null
    }

    if (target.shield > 0) {
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