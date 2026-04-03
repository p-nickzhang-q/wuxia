import { Graphics, Text, Container } from 'pixi.js'
import { Scene } from './Scene'
import { Renderer } from '../renderer/Renderer'
import { Button } from '../renderer/UIComponents'
import { LayoutConstants } from '../renderer/LayoutConstants'

// 标题场景
export class TitleScene extends Scene {
  private buttons: Container[] = []
  private onBattleMode?: () => void
  private onViewSkills?: () => void
  private onExitGame?: () => void

  constructor(renderer: Renderer) {
    super(renderer)
  }

  // 设置回调
  setOnBattleMode(callback: () => void): void {
    this.onBattleMode = callback
  }

  setOnViewSkills(callback: () => void): void {
    this.onViewSkills = callback
  }

  setOnExit(callback: () => void): void {
    this.onExitGame = callback
  }

  onEnter(): void {
    if (this.isInitialized) return
    this.isInitialized = true

    const size = this.renderer.getSize()
    const width = size.width
    const height = size.height

    // 背景
    const background = new Graphics()
    background.rect(0, 0, width, height)
    background.fill({ color: 0x1a1a2e })
    this.addChild(background)

    // 游戏标题
    const title = new Text({
      text: '武侠卡牌',
      style: {
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontSize: LayoutConstants.fontTitle() * 1.5,
        fill: 0xffd700,
        fontWeight: 'bold',
        dropShadow: {
          alpha: 0.5,
          angle: Math.PI / 6,
          blur: 4,
          color: 0x000000,
          distance: 3
        }
      }
    })
    title.anchor.set(0.5)
    title.x = width / 2
    title.y = height * 0.25
    this.addChild(title)

    // 副标题
    const subtitle = new Text({
      text: '回合制卡牌对战',
      style: {
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontSize: LayoutConstants.fontSubtitle(),
        fill: 0xaaaaaa
      }
    })
    subtitle.anchor.set(0.5)
    subtitle.x = width / 2
    subtitle.y = height * 0.32
    this.addChild(subtitle)

    // 菜单按钮
    const btnWidth = LayoutConstants.scaleValue(200)
    const btnHeight = LayoutConstants.scaleValue(50)
    const buttonY = height * 0.5
    const buttonSpacing = LayoutConstants.scaleValue(70)

    // 战斗模式按钮
    const battleBtn = new Button('战斗模式', btnWidth, btnHeight, this.renderer)
    battleBtn.x = width / 2 - btnWidth / 2
    battleBtn.y = buttonY
    battleBtn.setOnClick(() => this.onBattleMode?.())
    this.addChild(battleBtn)

    // 武功图鉴按钮
    const skillBtn = new Button('武功图鉴', btnWidth, btnHeight, this.renderer)
    skillBtn.x = width / 2 - btnWidth / 2
    skillBtn.y = buttonY + buttonSpacing
    skillBtn.setOnClick(() => this.onViewSkills?.())
    this.addChild(skillBtn)

    // 设置按钮（暂未实现）
    const settingsBtn = new Button('设置', btnWidth, btnHeight, this.renderer)
    settingsBtn.x = width / 2 - btnWidth / 2
    settingsBtn.y = buttonY + buttonSpacing * 2
    settingsBtn.setOnClick(() => {})
    this.addChild(settingsBtn)

    // 退出按钮
    const exitBtn = new Button('退出', btnWidth, btnHeight, this.renderer)
    exitBtn.x = width / 2 - btnWidth / 2
    exitBtn.y = buttonY + buttonSpacing * 3
    exitBtn.setOnClick(() => this.onExitGame?.())
    this.addChild(exitBtn)

    // 版本信息
    const version = new Text({
      text: 'v1.0.0-alpha',
      style: {
        fontFamily: 'Microsoft YaHei, Arial, sans-serif',
        fontSize: LayoutConstants.scaleValue(14),
        fill: 0x666666
      }
    })
    version.anchor.set(0.5)
    version.x = width / 2
    version.y = height - 30
    this.addChild(version)
  }

  onExit(): void {
    // 清理
  }

  update(_delta: number): void {
    // 暂无动画
  }
}