import { Scene } from './Scene'
import { Renderer, Colors, TextStyles } from '../renderer/Renderer'
import { Button } from '../renderer/UIComponents'
import { Text } from 'pixi.js'

// 结果场景
export class ResultScene extends Scene {
  private playerWon: boolean = false
  private onRestart?: () => void
  private onBackToSelect?: () => void

  constructor(renderer: Renderer) {
    super(renderer)
  }

  // 设置结果
  setResult(playerWon: boolean): void {
    this.playerWon = playerWon
  }

  onEnter(): void {
    this.createUI()
  }

  onExit(): void {
    this.clear()
  }

  update(_delta: number): void {
    // 无需更新
  }

  // 创建 UI
  private createUI(): void {
    const size = this.renderer.getSize()

    // 背景
    const bg = this.renderer.createGraphics()
    bg.rect(0, 0, size.width, size.height)
    bg.fill({ color: Colors.BACKGROUND, alpha: 0.95 })
    this.addChild(bg)

    // 结果文本
    const resultText = this.playerWon ? '胜利！' : '失败...'
    const resultColor = this.playerWon ? Colors.TEXT_GOLD : Colors.TEXT_RED

    const result = new Text({
      text: resultText,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 64,
        fill: resultColor,
        fontWeight: 'bold',
        dropShadow: { color: 0x000000, blur: 8, distance: 4 }
      }
    })
    result.anchor.set(0.5)
    result.x = size.width / 2
    result.y = size.height / 2 - 80
    this.addChild(result)

    // 副标题
    const subtitle = this.playerWon
      ? '你战胜了对手，名震江湖！'
      : '江湖险恶，来日再战！'

    const subtitleText = new Text({
      text: subtitle,
      style: TextStyles.SUBTITLE
    })
    subtitleText.style.fontSize = 20
    subtitleText.anchor.set(0.5)
    subtitleText.x = size.width / 2
    subtitleText.y = size.height / 2
    this.addChild(subtitleText)

    // 重新开始按钮
    const restartBtn = new Button('再来一局', 150, 50, this.renderer)
    restartBtn.x = size.width / 2 - 160
    restartBtn.y = size.height / 2 + 80
    restartBtn.setOnClick(() => {
      if (this.onRestart) {
        this.onRestart()
      }
    })
    this.addChild(restartBtn)

    // 返回选择按钮
    const backBtn = new Button('选择角色', 150, 50, this.renderer)
    backBtn.x = size.width / 2 + 10
    backBtn.y = size.height / 2 + 80
    backBtn.setOnClick(() => {
      if (this.onBackToSelect) {
        this.onBackToSelect()
      }
    })
    this.addChild(backBtn)
  }

  // 设置回调
  setOnRestart(callback: () => void): void {
    this.onRestart = callback
  }

  setOnBackToSelect(callback: () => void): void {
    this.onBackToSelect = callback
  }
}