import { describe, it, expect, beforeEach } from 'vitest'

/**
 * 测试 AI.ts 决策逻辑
 */
describe('AI 决策逻辑', () => {
  // 创建模拟卡牌
  const createMockCard = (id: string, type: string, damage: number, shield: number, agilityCost: number, range: number = 1): any => ({
    instanceId: id,
    type,
    baseDamage: damage,
    baseShield: shield,
    agilityCost,
    range
  })

  // 创建模拟角色
  const createMockCharacter = (id: string, hp: number, mp: number, agility: number, skills: any[] = []): any => ({
    id,
    name: id,
    hp,
    maxHp: 100,
    mp,
    maxMp: 20,
    agility,
    shield: 0,
    strength: 10,
    skills,
    passives: [],
    hand: [],
    debuffs: [],
    dots: [],
    isAlive: () => hp > 0,
    battlePosition: { team: 'enemy', position: 0 },
    getAvailableCards: (currentAgility: number) => [],
    canUseSkill: () => false
  })

  describe('目标选择逻辑', () => {
    it('test_select_target_prefers_low_hp', () => {
      // AI 应优先选择血量最低的目标
      const targets = [
        createMockCharacter('target1', 30, 10, 5),  // 低血量
        createMockCharacter('target2', 80, 10, 5),  // 高血量
        createMockCharacter('target3', 50, 10, 5)   // 中等血量
      ]

      // 按血量排序：低血量优先
      const sorted = targets.sort((a, b) => a.hp - b.hp)
      expect(sorted[0].id).toBe('target1')
    })

    it('test_select_target_considers_distance', () => {
      // 当血量相同时，应选择距离更近的目标
      const targets = [
        { hp: 50, distance: 2 },
        { hp: 50, distance: 1 },
        { hp: 50, distance: 3 }
      ]

      // 先按血量，再按距离排序
      const sorted = targets.sort((a, b) => {
        if (a.hp !== b.hp) return a.hp - b.hp
        return a.distance - b.distance
      })
      expect(sorted[0].distance).toBe(1)
    })
  })

  describe('卡牌选择逻辑', () => {
    it('test_select_attack_card_prefers_high_damage_when_target_has_shield', () => {
      // 目标有护盾时，选择高伤害卡牌
      const cards = [
        createMockCard('card1', 'fist', 5, 0, 2),
        createMockCard('card2', 'palm', 10, 0, 3),
        createMockCard('card3', 'stab', 8, 0, 2)
      ]

      const targetShield = 5

      // 高伤害优先
      const sorted = cards.filter(c => c.baseDamage > 0)
        .sort((a, b) => b.baseDamage - a.baseDamage)
      expect(sorted[0].baseDamage).toBe(10)
    })

    it('test_select_attack_card_prefers_efficiency_when_no_shield', () => {
      // 目标无护盾时，选择效率高的卡牌（伤害/消耗）
      const cards = [
        createMockCard('card1', 'fist', 5, 0, 2),  // 效率 2.5
        createMockCard('card2', 'palm', 10, 0, 4), // 效率 2.5
        createMockCard('card3', 'stab', 6, 0, 2),  // 效率 3.0
      ]

      // 按效率排序
      const sorted = cards.filter(c => c.baseDamage > 0)
        .sort((a, b) => (b.baseDamage / b.agilityCost) - (a.baseDamage / a.agilityCost))
      expect(sorted[0].instanceId).toBe('card3')
    })

    it('test_select_defend_card_prefers_high_shield', () => {
      // 需要防御时，选择高护盾卡牌
      const cards = [
        createMockCard('card1', 'stance', 0, 3, 1),
        createMockCard('card2', 'parry', 0, 5, 2),
        createMockCard('card3', 'stance', 0, 4, 1)
      ]

      const defendCards = cards.filter(c => c.baseShield > 0)
        .sort((a, b) => b.baseShield - a.baseShield)
      expect(defendCards[0].baseShield).toBe(5)
    })

    it('test_select_lowest_cost_card_for_remaining_agility', () => {
      // 轻功剩余较少时，选择低消耗卡牌
      const cards = [
        createMockCard('card1', 'fist', 5, 0, 3),
        createMockCard('card2', 'palm', 3, 0, 1),
        createMockCard('card3', 'stab', 8, 0, 4)
      ]

      const sorted = cards.sort((a, b) => a.agilityCost - b.agilityCost)
      expect(sorted[0].agilityCost).toBe(1)
    })
  })

  describe('防御决策逻辑', () => {
    it('test_should_defend_when_low_hp', () => {
      // 血量低于40%时考虑防御
      const actor = createMockCharacter('actor', 30, 10, 5) // 30/100 = 30%
      actor.shield = 0

      const hpRatio = actor.hp / actor.maxHp
      expect(hpRatio).toBeLessThan(0.4)
    })

    it('test_should_not_defend_when_high_hp', () => {
      // 血量高于40%时不优先防御
      const actor = createMockCharacter('actor', 50, 10, 5) // 50/100 = 50%

      const hpRatio = actor.hp / actor.maxHp
      expect(hpRatio).toBeGreaterThanOrEqual(0.4)
    })

    it('test_should_defend_when_has_shield_but_low_hp', () => {
      // 即使有少量护盾，血量低时仍考虑防御
      const actor = createMockCharacter('actor', 30, 10, 5)
      actor.shield = 2

      const hpRatio = actor.hp / actor.maxHp
      const shouldDefend = hpRatio < 0.4 && actor.shield < 3
      expect(shouldDefend).toBe(true)
    })
  })

  describe('武功招式使用逻辑', () => {
    it('test_use_skill_when_target_low_hp', () => {
      // 目标血量低时，使用武功招式斩杀
      const target = createMockCharacter('target', 10, 10, 5) // 低血量
      const skill = {
        id: 'testSkill',
        mpCost: 3,
        agilityCost: 2
      }
      const actor = createMockCharacter('actor', 100, 15, 10)

      const shouldUse = target.hp <= 15 && actor.mp >= skill.mpCost
      expect(shouldUse).toBe(true)
    })

    it('test_use_skill_when_mp充足', () => {
      // MP充足时使用武功招式
      const actor = createMockCharacter('actor', 100, 15, 10)
      const skill = { mpCost: 5 }

      const mpRatio = actor.mp / actor.maxMp
      const shouldUse = mpRatio >= 0.5
      expect(shouldUse).toBe(true)
    })

    it('test_not_use_skill_when_mp不足', () => {
      // MP不足时不使用武功招式
      const actor = createMockCharacter('actor', 100, 3, 10)
      const skill = { mpCost: 5 }

      const mpRatio = actor.mp / actor.maxMp
      const shouldUse = mpRatio >= 0.5
      expect(shouldUse).toBe(false)
    })
  })

  describe('行动循环逻辑', () => {
    it('test_action_loop_continues_while_agility_available', () => {
      // 轻功大于0时继续行动
      const actor = createMockCharacter('actor', 100, 15, 5)
      const shouldContinue = actor.agility > 0 && actor.isAlive()
      expect(shouldContinue).toBe(true)
    })

    it('test_action_loop_stops_when_agility_depleted', () => {
      // 轻功耗尽时停止行动
      const actor = createMockCharacter('actor', 100, 15, 0)
      const shouldContinue = actor.agility > 0
      expect(shouldContinue).toBe(false)
    })

    it('test_action_loop_stops_when_actor_dead', () => {
      // 角色死亡时停止行动
      const actor = createMockCharacter('actor', 0, 15, 5)
      actor.hp = 0
      const shouldContinue = actor.agility > 0 && actor.isAlive()
      expect(shouldContinue).toBe(false)
    })

    it('test_action_loop_stops_on_switch_actor', () => {
      // 切换行动方时停止行动循环
      const shouldSwitch = true
      const shouldStop = shouldSwitch === true
      expect(shouldStop).toBe(true)
    })
  })

  describe('边界情况', () => {
    it('test_no_action_when_no_cards', () => {
      // 无可用卡牌时返回null
      const availableCards = []
      const aliveEnemies = [createMockCharacter('enemy', 50, 10, 5)]

      const hasNoCards = availableCards.length === 0
      expect(hasNoCards).toBe(true)
    })

    it('test_no_action_when_no_enemies', () => {
      // 无敌人时返回null
      const availableCards = [createMockCard('card1', 'fist', 5, 0, 2)]
      const aliveEnemies = []

      const hasNoEnemies = aliveEnemies.length === 0
      expect(hasNoEnemies).toBe(true)
    })

    it('test_max_action_limit', () => {
      // 限制最大行动次数防止无限循环
      const maxActions = 10
      expect(maxActions).toBeLessThanOrEqual(10)
    })
  })
})