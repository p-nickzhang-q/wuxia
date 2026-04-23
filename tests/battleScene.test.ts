import { describe, it, expect } from 'vitest'

/**
 * BattleScene 核心逻辑测试
 * 测试游戏流程控制的关键路径
 */
describe('BattleScene Core Logic', () => {
  describe('基本导入测试', () => {
    it('test_import_characters_exists', async () => {
      const { characters } = await import('../src/data/skills')
      expect(characters).toBeDefined()
      expect(characters['qiaoFeng']).toBeDefined()
    })

    it('test_import_character_config_has_methods', async () => {
      const { characters } = await import('../src/data/skills')
      const qiaoFeng = characters['qiaoFeng']
      expect(qiaoFeng.getMaxHp).toBeDefined()
      expect(typeof qiaoFeng.getMaxHp).toBe('function')
    })

    it('test_create_character_success', async () => {
      const { createCharacter } = await import('../src/game/Character')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      const martialArts = getCharacterMartialArts('qiaoFeng')
      const char = createCharacter(characters['qiaoFeng'], martialArts)

      expect(char).toBeDefined()
      expect(char.id).toBe('qiaoFeng')
      expect(char.name).toBe('乔峰')
    })
  })

  describe('游戏初始化测试', () => {
    it('test_create_game_success', async () => {
      const { createCharacter } = await import('../src/game/Character')
      const { createGame } = await import('../src/game/Game')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      const playerMartialArts = getCharacterMartialArts('qiaoFeng')
      const enemyMartialArts = getCharacterMartialArts('duanYu')

      const playerChar = createCharacter(characters['qiaoFeng'], playerMartialArts)
      const enemyChar = createCharacter(characters['duanYu'], enemyMartialArts)

      const game = createGame()
      game.initTeamBattle([playerChar], [enemyChar], 'team')

      expect(game).toBeDefined()
      expect(game.phase).toBeDefined()
    })

    it('test_game_phase_is_selecting_after_init', async () => {
      const { GamePhase } = await import('../src/game/types')
      const { createCharacter } = await import('../src/game/Character')
      const { createGame } = await import('../src/game/Game')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      const playerChar = createCharacter(characters['qiaoFeng'], getCharacterMartialArts('qiaoFeng'))
      const enemyChar = createCharacter(characters['duanYu'], getCharacterMartialArts('duanYu'))

      const game = createGame()
      game.initTeamBattle([playerChar], [enemyChar], 'team')

      expect(game.phase).toBe(GamePhase.SELECTING)
    })
  })

  describe('回合切换测试', () => {
    it('test_should_switch_actor_when_agility_depleted', async () => {
      const { createCharacter } = await import('../src/game/Character')
      const { createGame } = await import('../src/game/Game')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      const playerChar = createCharacter(characters['qiaoFeng'], getCharacterMartialArts('qiaoFeng'))
      const enemyChar = createCharacter(characters['duanYu'], getCharacterMartialArts('duanYu'))

      const game = createGame()
      game.initTeamBattle([playerChar], [enemyChar], 'team')

      const currentActor = game.currentActor!
      currentActor.agility = 0

      expect(game.shouldSwitchActor()).toBe(true)
    })

    it('test_switch_actor_changes_current_actor', async () => {
      const { createCharacter } = await import('../src/game/Character')
      const { createGame } = await import('../src/game/Game')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      const playerChar = createCharacter(characters['qiaoFeng'], getCharacterMartialArts('qiaoFeng'))
      const enemyChar = createCharacter(characters['duanYu'], getCharacterMartialArts('duanYu'))

      const game = createGame()
      game.initTeamBattle([playerChar], [enemyChar], 'team')

      const firstActorId = game.currentActor!.id
      game.currentActor!.agility = 0

      game.switchActor()

      expect(game.currentActor!.id).not.toBe(firstActorId)
    })
  })

  describe('卡牌使用测试', () => {
    it('test_use_basic_card_success', async () => {
      const { createCharacter } = await import('../src/game/Character')
      const { createGame } = await import('../src/game/Game')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      const playerChar = createCharacter(characters['qiaoFeng'], getCharacterMartialArts('qiaoFeng'))
      const enemyChar = createCharacter(characters['duanYu'], getCharacterMartialArts('duanYu'))

      const game = createGame()
      game.initTeamBattle([playerChar], [enemyChar], 'team')

      const currentActor = game.currentActor!
      const card = currentActor.hand[0]

      const result = game.useBasicCard(card.instanceId, enemyChar.id)

      expect(result.success).toBe(true)
    })

    it('test_use_card_reduces_actor_agility', async () => {
      const { createCharacter } = await import('../src/game/Character')
      const { createGame } = await import('../src/game/Game')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      const playerChar = createCharacter(characters['qiaoFeng'], getCharacterMartialArts('qiaoFeng'))
      const enemyChar = createCharacter(characters['duanYu'], getCharacterMartialArts('duanYu'))

      const game = createGame()
      game.initTeamBattle([playerChar], [enemyChar], 'team')

      const currentActor = game.currentActor!
      const initialAgility = currentActor.agility
      const card = currentActor.hand[0]

      game.useBasicCard(card.instanceId, enemyChar.id)

      expect(currentActor.agility).toBeLessThan(initialAgility)
    })
  })

  describe('目标选择测试', () => {
    it('test_get_targets_in_range_returns_enemy', async () => {
      const { createCharacter } = await import('../src/game/Character')
      const { createGame } = await import('../src/game/Game')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      const playerChar = createCharacter(characters['qiaoFeng'], getCharacterMartialArts('qiaoFeng'))
      const enemyChar = createCharacter(characters['duanYu'], getCharacterMartialArts('duanYu'))

      const game = createGame()
      game.initTeamBattle([playerChar], [enemyChar], 'team')

      const targets = game.getTargetsInRange(game.currentActor!, 1)

      expect(targets.length).toBeGreaterThan(0)
      // 目标应该不是当前行动者
      targets.forEach(t => {
        expect(t.id).not.toBe(game.currentActor!.id)
      })
    })
  })

  describe('AI 触发条件测试', () => {
    it('test_ai_trigger_after_player_agility_zero', async () => {
      const { createCharacter } = await import('../src/game/Character')
      const { createGame } = await import('../src/game/Game')
      const { GamePhase } = await import('../src/game/types')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      // 使用乔峰（轻功 10）作为玩家，一灯大师（轻功 8）作为敌人
      // 这样乔峰会先行动
      const playerChar = createCharacter(characters['qiaoFeng'], getCharacterMartialArts('qiaoFeng'))
      const enemyChar = createCharacter(characters['yiDeng'], getCharacterMartialArts('yiDeng'))

      const game = createGame()
      game.initTeamBattle([playerChar], [enemyChar], 'team')

      // 验证乔峰先行动（轻功更高）
      expect(game.currentActor!.id).toBe(playerChar.id)

      // 玩家轻功为 0，敌人轻功保持 > 0，应该切换
      playerChar.agility = 0

      if (game.shouldSwitchActor()) {
        game.switchActor()
      }

      // 现在行动者应该是敌人（一灯大师）
      expect(game.currentActor!.id).toBe(enemyChar.id)
      expect(game.phase).toBe(GamePhase.SELECTING)
    })
  })

  describe('游戏结束测试', () => {
    it('test_game_ends_when_enemy_dead', async () => {
      const { createCharacter } = await import('../src/game/Character')
      const { createGame } = await import('../src/game/Game')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      const playerChar = createCharacter(characters['qiaoFeng'], getCharacterMartialArts('qiaoFeng'))
      const enemyChar = createCharacter(characters['duanYu'], getCharacterMartialArts('duanYu'))

      const game = createGame()
      game.initTeamBattle([playerChar], [enemyChar], 'team')

      // 让敌人 HP 为 0
      enemyChar.hp = 0

      const result = game.checkGameEnd()

      expect(result).toBe(true) // 玩家胜利
    })

    it('test_game_ends_when_player_dead', async () => {
      const { createCharacter } = await import('../src/game/Character')
      const { createGame } = await import('../src/game/Game')
      const { characters, getCharacterMartialArts } = await import('../src/data/skills')

      const playerChar = createCharacter(characters['qiaoFeng'], getCharacterMartialArts('qiaoFeng'))
      const enemyChar = createCharacter(characters['duanYu'], getCharacterMartialArts('duanYu'))

      const game = createGame()
      game.initTeamBattle([playerChar], [enemyChar], 'team')

      // 让玩家 HP 为 0
      playerChar.hp = 0

      const result = game.checkGameEnd()

      expect(result).toBe(true) // 玩家失败
    })
  })
})