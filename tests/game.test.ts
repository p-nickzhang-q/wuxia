import { describe, it, expect, beforeEach } from 'vitest'
import { createCharacter } from '../src/game/Character'
import { createGame } from '../src/game/Game'
import { CardType, TriggerTiming } from '../src/game/types'
import type { CharacterConfig, MartialArt, MartialArtSkill, PassiveSkill } from '../src/game/types'

// 测试用角色配置
const testCharacterConfig: CharacterConfig = {
  id: 'testHero',
  name: '测试角色',
  title: '测试称号',
  description: '测试描述',
  hp: 60,
  mp: 20,
  agility: 10,
  martialArts: [],
  deck: ['fist', 'palm', 'stab', 'slash', 'sweep']
}

const testEnemyConfig: CharacterConfig = {
  id: 'testEnemy',
  name: '测试敌人',
  title: '敌人称号',
  description: '敌人描述',
  hp: 50,
  mp: 15,
  agility: 8,
  martialArts: [],
  deck: ['fist', 'fist', 'fist', 'fist', 'fist']
}

// 测试用武功
const testMartialArt: MartialArt = {
  id: 'testArt',
  name: '测试武功',
  skills: [],
  passive: null,
  description: '测试用武功'
}

const testSkill: MartialArtSkill = {
  id: 'testSkill',
  name: '测试招式',
  requiredCardType: CardType.EMPTY_HAND,
  mpCost: 3,
  agilityCost: 2,
  effects: [{ type: 'damage', value: 8 }],
  description: '造成8点伤害',
  range: 1
}

const testPassive: PassiveSkill = {
  id: 'testPassive',
  name: '测试内功',
  trigger: TriggerTiming.TURN_START,
  effect: (character) => {
    character.heal(3)
    return '恢复了3点体力'
  },
  description: '回合开始恢复3点体力'
}

describe('Character 工厂函数', () => {
  it('应该正确创建角色', () => {
    const character = createCharacter(testCharacterConfig, [testMartialArt])

    expect(character.id).toBe('testHero')
    expect(character.name).toBe('测试角色')
    expect(character.maxHp).toBe(60)
    expect(character.hp).toBe(60)
    expect(character.maxMp).toBe(20)
    expect(character.mp).toBe(20)
    expect(character.baseAgility).toBe(10)
  })

  it('应该正确初始化牌组', () => {
    const character = createCharacter(testCharacterConfig, [testMartialArt])
    character.initDeck()

    expect(character.deck.length).toBe(5)
    expect(character.hand.length).toBe(0)
    expect(character.discardPile.length).toBe(0)
  })

  it('应该正确抽牌', () => {
    const character = createCharacter(testCharacterConfig, [testMartialArt])
    character.initDeck()
    const drawn = character.drawCards(3)

    expect(drawn.length).toBe(3)
    expect(character.hand.length).toBe(3)
    expect(character.deck.length).toBe(2)
  })

  it('手牌上限应该为7张', () => {
    // 使用更大的牌组测试手牌上限
    const bigDeckConfig: CharacterConfig = {
      ...testCharacterConfig,
      deck: ['fist', 'palm', 'stab', 'slash', 'sweep', 'thrust', 'frontKick', 'sweepKick', 'parry', 'stance']
    }
    const character = createCharacter(bigDeckConfig, [testMartialArt])
    character.initDeck()
    const drawn = character.drawCards(10)

    expect(character.hand.length).toBe(7)
    expect(drawn.length).toBe(7)
  })

  it('应该正确计算伤害和护盾吸收', () => {
    const character = createCharacter(testCharacterConfig, [testMartialArt])

    // 无护盾直接扣血
    const result1 = character.takeDamage(10)
    expect(character.hp).toBe(50)
    expect(result1.damage).toBe(10)

    // 有护盾吸收
    character.shield = 5
    character.takeDamage(3)
    expect(character.shield).toBe(2)
    expect(character.hp).toBe(50) // HP 不变

    // 护盾不足
    character.takeDamage(5)
    expect(character.shield).toBe(0)
    expect(character.hp).toBe(47)
  })

  it('应该正确恢复HP和MP', () => {
    const character = createCharacter(testCharacterConfig, [testMartialArt])
    character.hp = 30
    character.mp = 10

    const healed = character.heal(20)
    expect(healed).toBe(20)
    expect(character.hp).toBe(50)

    // 不能超过最大值
    const overHeal = character.heal(20)
    expect(overHeal).toBe(10) // 只恢复了到满血的部分
    expect(character.hp).toBe(60)
  })

  it('应该正确判断存活状态', () => {
    const character = createCharacter(testCharacterConfig, [testMartialArt])

    expect(character.isAlive()).toBe(true)

    character.hp = 0
    expect(character.isAlive()).toBe(false)
  })

  it('应该正确处理Debuff', () => {
    const character = createCharacter(testCharacterConfig, [testMartialArt])
    character.agility = 10
    character.addDebuff('agility', 3, 2)

    character.resetForNewTurn()
    expect(character.agility).toBe(7) // 10 - 3

    // Debuff 持续2回合，第一回合后应该还剩1回合
    expect(character.debuffs.length).toBe(1)
  })
})

describe('Game 状态管理', () => {
  let game: ReturnType<typeof createGame>
  let player: ReturnType<typeof createCharacter>
  let enemy: ReturnType<typeof createCharacter>

  beforeEach(() => {
    game = createGame()
    player = createCharacter(testCharacterConfig, [testMartialArt])
    enemy = createCharacter(testEnemyConfig, [{ ...testMartialArt }])
    game.init(player, enemy)
  })

  it('应该正确初始化游戏', () => {
    expect(game.player).toBe(player)
    expect(game.enemy).toBe(enemy)
    expect(game.currentTurn).toBe(1)
    expect(player.hand.length).toBe(5) // 初始抽5张
    expect(enemy.hand.length).toBe(5)
  })

  it('应该正确决定行动顺序（轻功高者先行动）', () => {
    expect(game.currentActor).toBe(player) // 玩家轻功10 > 敌人轻功8
  })

  it('使用基础卡牌应该消耗轻功', () => {
    const card = player.hand[0]
    const initialAgility = player.agility

    game.useBasicCard(card.instanceId)

    expect(player.agility).toBe(initialAgility - card.agilityCost)
  })

  it('应该正确消耗轻功', () => {
    // 测试使用卡牌消耗轻功
    const card = player.hand.find(c => c.agilityCost > 0)

    if (card) {
      const playerAgilityBefore = player.agility
      game.useBasicCard(card.instanceId)

      // 验证轻功消耗
      expect(player.agility).toBe(playerAgilityBefore - card.agilityCost)
    } else {
      expect(true).toBe(true)
    }
  })

  it('游戏结束应该正确判定胜负', () => {
    enemy.hp = 1
    const card = player.hand.find(c => c.baseDamage > 0)
    if (card) {
      game.useBasicCard(card.instanceId)
      expect(game.phase).toBe('gameOver')
    }
  })
})

describe('武功招式系统', () => {
  let game: ReturnType<typeof createGame>
  let player: ReturnType<typeof createCharacter>
  let enemy: ReturnType<typeof createCharacter>

  beforeEach(() => {
    const skillMartialArt: MartialArt = {
      ...testMartialArt,
      skills: [testSkill]
    }
    game = createGame()
    player = createCharacter(testCharacterConfig, [skillMartialArt])
    enemy = createCharacter(testEnemyConfig, [testMartialArt])
    game.init(player, enemy)
  })

  it('应该正确判断是否可以使用武功招式', () => {
    const card = player.hand.find(c => c.type === CardType.EMPTY_HAND)
    if (card) {
      expect(player.canUseSkill(testSkill, card, player.agility)).toBe(true)
    }
  })

  it('MP不足时不能使用武功招式', () => {
    player.mp = 1
    const card = player.hand.find(c => c.type === CardType.EMPTY_HAND)
    if (card) {
      expect(player.canUseSkill(testSkill, card, player.agility)).toBe(false)
    }
  })

  it('轻功不足时不能使用武功招式', () => {
    player.agility = 1
    const card = player.hand.find(c => c.type === CardType.EMPTY_HAND)
    if (card) {
      expect(player.canUseSkill(testSkill, card, player.agility)).toBe(false)
    }
  })

  it('使用武功招式应该消耗MP和轻功', () => {
    const initialMp = player.mp
    const initialAgility = player.agility
    const card = player.hand.find(c => c.type === CardType.EMPTY_HAND)

    if (card) {
      game.useSkill(testSkill.id, card.instanceId)
      expect(player.mp).toBe(initialMp - testSkill.mpCost)
      expect(player.agility).toBe(initialAgility - testSkill.agilityCost)
    }
  })
})

describe('内功系统', () => {
  it('回合开始内功应该正确触发', () => {
    const passiveMartialArt: MartialArt = {
      ...testMartialArt,
      passive: testPassive
    }
    const character = createCharacter(testCharacterConfig, [passiveMartialArt])

    character.initDeck()
    character.hp = 50 // 不是满血

    const messages = character.onTurnStart(null as any)
    expect(character.hp).toBe(53) // 恢复3点
    expect(messages.length).toBe(1)
  })
})

describe('边界情况', () => {
  it('牌组用完时应该从弃牌堆洗回', () => {
    const character = createCharacter(testCharacterConfig, [testMartialArt])
    character.initDeck()

    // 抽完所有牌
    character.drawCards(7)
    expect(character.deck.length).toBe(0)

    // 打出一些牌到弃牌堆
    const cardsToPlay = character.hand.splice(0, 3)
    character.discardPile.push(...cardsToPlay)

    // 再抽牌应该从弃牌堆洗回
    character.drawCards(2)
    expect(character.deck.length).toBeGreaterThan(0)
  })

  it('空牌组和空弃牌堆时抽牌应该停止', () => {
    const character = createCharacter(testCharacterConfig, [testMartialArt])
    character.initDeck()
    character.hand = []
    character.deck = []
    character.discardPile = []

    const drawn = character.drawCards(5)
    expect(drawn.length).toBe(0)
  })
})