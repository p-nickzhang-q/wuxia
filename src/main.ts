import { Renderer } from './renderer/Renderer'
import { TitleScene } from './scenes/TitleScene'
import { CharacterSelectScene, BattleConfig } from './scenes/CharacterSelectScene'
import { BattleScene } from './scenes/BattleScene'
import { ResultScene } from './scenes/ResultScene'
import { SkillListScene } from './scenes/SkillListScene'
import { DiscipleRecruitScene } from './scenes/DiscipleRecruitScene'
import { Scene } from './scenes/Scene'
import { tweenManager } from './utils/TweenManager'
import { audioManager } from './utils/AudioManager'
import { characters } from './data/skills'

// 游戏主类
class Game {
  private renderer: Renderer
  private currentScene: Scene | null = null
  private titleScene: TitleScene | null = null
  private characterSelectScene: CharacterSelectScene | null = null
  private battleScene: BattleScene | null = null
  private resultScene: ResultScene | null = null
  private skillListScene: SkillListScene | null = null
  private discipleRecruitScene: DiscipleRecruitScene | null = null
  private battleConfig: BattleConfig | null = null

  constructor() {
    this.renderer = new Renderer()
  }

  // 初始化游戏
  async init(container: HTMLElement): Promise<void> {
    await this.renderer.init(container)

    // 创建场景
    this.titleScene = new TitleScene(this.renderer)
    this.characterSelectScene = new CharacterSelectScene(this.renderer)
    this.battleScene = new BattleScene(this.renderer)
    this.resultScene = new ResultScene(this.renderer)
    this.skillListScene = new SkillListScene(this.renderer)
    this.discipleRecruitScene = new DiscipleRecruitScene(this.renderer)

    // 标题场景回调
    this.titleScene.setOnBattleMode(() => {
      this.showCharacterSelect()
    })

    this.titleScene.setOnViewSkills(() => {
      this.showSkillList()
    })

    this.titleScene.setOnRecruitDisciple(() => {
      this.showDiscipleRecruit()
    })

    this.titleScene.setOnExit(() => {
      // 浏览器环境下无法真正退出，显示提示
      alert('感谢游玩！')
    })

    // 角色选择场景回调
    this.characterSelectScene.setOnGameStart((config: BattleConfig) => {
      this.battleConfig = config
      // 用户交互后初始化音频
      this.initAudio()
      this.startBattle()
    })

    this.characterSelectScene.setOnBackToTitle(() => {
      this.showTitle()
    })

    this.skillListScene.setOnBack(() => {
      this.showTitle()
    })

    this.discipleRecruitScene.setOnBack(() => {
      this.showTitle()
    })

    this.discipleRecruitScene.setOnDiscipleRecruited((disciple) => {
      console.log('招募弟子:', disciple.name, disciple)
    })

    this.battleScene.setOnBattleEnd((playerWon) => {
      this.showResult(playerWon)
    })

    this.resultScene.setOnRestart(() => {
      this.startBattle()
    })

    this.resultScene.setOnBackToSelect(() => {
      this.showCharacterSelect()
    })

    // 显示标题场景
    this.showTitle()

    // 开始游戏循环
    this.startGameLoop()
  }

  // 显示标题场景
  private showTitle(): void {
    if (this.currentScene) {
      this.currentScene.onExit()
      this.renderer.getStage().removeChild(this.currentScene)
    }

    this.currentScene = this.titleScene
    if (this.currentScene) {
      this.renderer.getStage().addChild(this.currentScene)
      this.currentScene.onEnter()
    }
  }

  // 显示角色选择场景
  private showCharacterSelect(): void {
    if (this.currentScene) {
      this.currentScene.onExit()
      this.renderer.getStage().removeChild(this.currentScene)
    }

    this.currentScene = this.characterSelectScene
    if (this.currentScene) {
      this.renderer.getStage().addChild(this.currentScene)
      this.currentScene.onEnter()
    }
  }

  // 开始战斗
  private startBattle(): void {
    if (!this.battleConfig) return

    if (this.currentScene) {
      this.currentScene.onExit()
      this.renderer.getStage().removeChild(this.currentScene)
    }

    const config = this.battleConfig
    const playerId = config.playerId

    if (config.mode === '1v1') {
      // 1v1 模式
      this.battleScene!.init(playerId)
    } else {
      // 多人模式 - 玩家控制一个角色，其他队友和敌人随机分配
      const allCharacterIds = Object.keys(characters)
      const usedIds = [playerId]

      // 随机选择队友 (teamSize - 1 个)
      const teammateIds: string[] = []
      const availableForTeammates = allCharacterIds.filter(id => !usedIds.includes(id))
      const shuffledTeammates = availableForTeammates.sort(() => Math.random() - 0.5)
      for (let i = 0; i < config.teamSize - 1 && i < shuffledTeammates.length; i++) {
        teammateIds.push(shuffledTeammates[i])
        usedIds.push(shuffledTeammates[i])
      }

      // 随机选择敌人
      const availableForEnemies = allCharacterIds.filter(id => !usedIds.includes(id))
      const shuffledEnemies = availableForEnemies.sort(() => Math.random() - 0.5)
      const enemyIds = shuffledEnemies.slice(0, config.enemySize)

      // 完整的玩家队伍（玩家控制的角色在前，队友在后）
      const playerTeam = [playerId, ...teammateIds]

      this.battleScene!.initTeamBattle(playerTeam, enemyIds, config.mode, playerId)
    }

    this.currentScene = this.battleScene
    if (this.currentScene) {
      this.renderer.getStage().addChild(this.currentScene)
      this.currentScene.onEnter()
    }
  }

  // 初始化音频
  private async initAudio(): Promise<void> {
    await audioManager.init()
    audioManager.resume()
  }

  // 显示结果
  private showResult(playerWon: boolean): void {
    if (this.currentScene) {
      this.currentScene.onExit()
      this.renderer.getStage().removeChild(this.currentScene)
    }

    this.resultScene!.setResult(playerWon)
    this.currentScene = this.resultScene
    if (this.currentScene) {
      this.renderer.getStage().addChild(this.currentScene)
      this.currentScene.onEnter()
    }
  }

  // 显示武功列表
  private showSkillList(): void {
    if (this.currentScene) {
      this.currentScene.onExit()
      this.renderer.getStage().removeChild(this.currentScene)
    }

    this.currentScene = this.skillListScene
    if (this.currentScene) {
      this.renderer.getStage().addChild(this.currentScene)
      this.currentScene.onEnter()
    }
  }

  // 显示弟子招募场景
  private showDiscipleRecruit(): void {
    if (this.currentScene) {
      this.currentScene.onExit()
      this.renderer.getStage().removeChild(this.currentScene)
    }

    this.currentScene = this.discipleRecruitScene
    if (this.currentScene) {
      this.renderer.getStage().addChild(this.currentScene)
      this.currentScene.onEnter()
    }
  }

  // 开始游戏循环
  private startGameLoop(): void {
    const app = this.renderer.getApp()

    app.ticker.add((ticker) => {
      if (this.currentScene) {
        this.currentScene.update(ticker.deltaTime)
      }
      // 更新全局 tween 管理器
      tweenManager.update(ticker.deltaTime)
    })
  }

  // 销毁游戏
  destroy(): void {
    if (this.currentScene) {
      this.currentScene.onExit()
    }
    this.renderer.destroy()
  }
}

// 创建游戏实例
const game = new Game()

// 启动游戏
async function main(): Promise<void> {
  const container = document.getElementById('game-container')
  if (!container) {
    console.error('Game container not found')
    return
  }

  await game.init(container)
}

// 等待 DOM 加载完成
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main)
} else {
  main()
}