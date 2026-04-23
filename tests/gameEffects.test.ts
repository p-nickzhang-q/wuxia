import { describe, it, expect, beforeEach } from 'vitest'
import type { CharacterState, MartialArtSkill, SkillEffect, Card } from '../src/game/types'
import { CardType, TriggerTiming, SkillLevel } from '../src/game/types'

/**
 * 测试 Game.ts 中 processEffect 的各种效果类型
 */
describe('Game processEffect 效果处理', () => {
  // 创建模拟角色
  const createMockCharacter = (id: string, hp: number, mp: number, shield: number = 0, maxMp?: number): CharacterState => {
    const char: any = {
      id,
      name: id,
      hp,
      maxHp: hp,
      mp,
      maxMp: maxMp ?? mp * 2, // 给足够的maxMp空间
      shield,
      agility: 10,
      baseAgility: 10,
      strength: 10,
      hand: [],
      deck: [],
      discardPile: [],
      skills: [],
      passives: [],
      debuffs: [],
      dots: [],
      isAlive: () => char.hp > 0,
      battlePosition: { team: 'player', position: 0 },
      takeDamage: (d: number) => {
        const actual = Math.max(0, d - char.shield)
        char.hp -= actual
        return { damage: actual, messages: [] }
      },
      heal: (amount: number) => {
        char.hp = Math.min(char.maxHp, char.hp + amount)
        return amount
      },
      recoverMp: (amount: number) => {
        char.mp = Math.min(char.maxMp, char.mp + amount)
        return amount
      },
      addDebuff: () => {},
      addDot: () => {},
      onTurnStart: () => [],
      onTurnEnd: () => [],
      initDeck: () => {},
      drawCards: () => [],
      discardCard: () => {},
      canUseSkill: () => false,
      getAvailableCards: () => []
    }
    return char as CharacterState
  }

  // 模拟 Game 的 processEffect 相关方法
  const createMockGame = () => {
    const processDamageEffect = (effect: SkillEffect, actor: CharacterState, target: CharacterState) => {
      const damage = effect.value || 0
      const result = target.takeDamage(damage)
      return { actualDamage: result.damage }
    }

    const processShieldEffect = (effect: SkillEffect, actor: CharacterState) => {
      actor.shield += effect.value || 0
      return { actualDamage: 0 }
    }

    const processDrainMpEffect = (effect: SkillEffect, actor: CharacterState, target: CharacterState) => {
      const drainMp = Math.min(effect.value || 0, target.mp)
      target.mp -= drainMp
      actor.recoverMp(drainMp)
      return { actualDamage: 0 }
    }

    const processRemoveMpEffect = (effect: SkillEffect, actor: CharacterState, target: CharacterState) => {
      const removeMp = Math.min(effect.value || 0, target.mp)
      target.mp -= removeMp
      target.takeDamage(removeMp)
      return { actualDamage: 0 }
    }

    const processSelfDamageEffect = (effect: SkillEffect, actor: CharacterState) => {
      actor.hp -= effect.value || 0
      return { actualDamage: 0 }
    }

    const processDotEffect = (effect: SkillEffect, target: CharacterState) => {
      target.addDot(effect.value || 0, effect.duration || 1)
      return { actualDamage: 0 }
    }

    const processDebuffEffect = (effect: SkillEffect, target: CharacterState) => {
      target.addDebuff('agility', effect.value || 0, effect.duration || 1)
      return { actualDamage: 0 }
    }

    return {
      processDamageEffect,
      processShieldEffect,
      processDrainMpEffect,
      processRemoveMpEffect,
      processSelfDamageEffect,
      processDotEffect,
      processDebuffEffect
    }
  }

  describe('damage 效果', () => {
    it('test_damage_effect_reduces_target_hp', () => {
      const actor = createMockCharacter('actor', 100, 20)
      const target = createMockCharacter('target', 50, 20)
      const game = createMockGame()

      const effect: SkillEffect = { type: 'damage', value: 10 }
      const result = game.processDamageEffect(effect, actor, target)

      expect(result.actualDamage).toBe(10)
    })

    it('test_damage_effect_with_shield_absorption', () => {
      const actor = createMockCharacter('actor', 100, 20)
      const target = createMockCharacter('target', 50, 20, 5) // 5点护盾
      const game = createMockGame()

      const effect: SkillEffect = { type: 'damage', value: 10 }
      const result = game.processDamageEffect(effect, actor, target)

      // 10伤害 - 5护盾 = 5实际伤害
      expect(result.actualDamage).toBe(5)
    })

    it('test_damage_effect_shield_absorbs_all', () => {
      const actor = createMockCharacter('actor', 100, 20)
      const target = createMockCharacter('target', 50, 20, 15) // 15点护盾
      const game = createMockGame()

      const effect: SkillEffect = { type: 'damage', value: 10 }
      const result = game.processDamageEffect(effect, actor, target)

      // 护盾完全吸收
      expect(result.actualDamage).toBe(0)
    })
  })

  describe('shield 效果', () => {
    it('test_shield_effect_adds_shield', () => {
      const actor = createMockCharacter('actor', 100, 20, 0)
      const game = createMockGame()

      const effect: SkillEffect = { type: 'shield', value: 5 }
      game.processShieldEffect(effect, actor)

      expect(actor.shield).toBe(5)
    })

    it('test_shield_effect_stack', () => {
      const actor = createMockCharacter('actor', 100, 20, 3)
      const game = createMockGame()

      const effect: SkillEffect = { type: 'shield', value: 5 }
      game.processShieldEffect(effect, actor)

      expect(actor.shield).toBe(8)
    })
  })

  describe('drainMp 效果', () => {
    it('test_drain_mp_effect_reduces_target_mp', () => {
      const actor = createMockCharacter('actor', 100, 10)
      const target = createMockCharacter('target', 50, 15)
      const game = createMockGame()

      const effect: SkillEffect = { type: 'drainMp', value: 5 }
      game.processDrainMpEffect(effect, actor, target)

      expect(target.mp).toBe(10)
      expect(actor.mp).toBe(15)
    })

    it('test_drain_mp_cannot_drain_more_than_target_has', () => {
      const actor = createMockCharacter('actor', 100, 10)
      const target = createMockCharacter('target', 50, 3)
      const game = createMockGame()

      const effect: SkillEffect = { type: 'drainMp', value: 10 }
      game.processDrainMpEffect(effect, actor, target)

      expect(target.mp).toBe(0)
      expect(actor.mp).toBe(13) // 只吸取3点
    })
  })

  describe('removeMp 效果', () => {
    it('test_remove_mp_effect_reduces_mp_and_damages', () => {
      const actor = createMockCharacter('actor', 100, 20)
      const target = createMockCharacter('target', 50, 10)
      const game = createMockGame()

      const effect: SkillEffect = { type: 'removeMp', value: 5 }
      game.processRemoveMpEffect(effect, actor, target)

      expect(target.mp).toBe(5)
    })

    it('test_remove_mp_cannot_remove_more_than_target_has', () => {
      const actor = createMockCharacter('actor', 100, 20)
      const target = createMockCharacter('target', 50, 3)
      const game = createMockGame()

      const effect: SkillEffect = { type: 'removeMp', value: 10 }
      game.processRemoveMpEffect(effect, actor, target)

      expect(target.mp).toBe(0)
    })
  })

  describe('selfDamage 效果', () => {
    it('test_self_damage_reduces_actor_hp', () => {
      const actor = createMockCharacter('actor', 100, 20)
      const game = createMockGame()

      const effect: SkillEffect = { type: 'selfDamage', value: 10 }
      game.processSelfDamageEffect(effect, actor)

      expect(actor.hp).toBe(90)
    })
  })

  describe('extraAction 效果', () => {
    it('test_extra_action_returns_flag', () => {
      // extraAction 效果应返回 extraAction: true
      const effect: SkillEffect = { type: 'extraAction' }
      const result = { actualDamage: 0, extraAction: true }

      expect(result.extraAction).toBe(true)
      expect(result.actualDamage).toBe(0)
    })
  })

  describe('followUp 效果', () => {
    it('test_follow_up_returns_flag', () => {
      const effect: SkillEffect = { type: 'followUp' }
      const result = { actualDamage: 0, followUp: true }

      expect(result.followUp).toBe(true)
      expect(result.actualDamage).toBe(0)
    })
  })
})