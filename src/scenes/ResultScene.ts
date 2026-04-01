import { Scene } from './Scene'
import { Renderer, Colors, TextStyles } from '../renderer/Renderer'
import { Button } from '../renderer/UIComponents'
import { Text, Graphics, Container } from 'pixi.js'

// 结果场景
export class ResultScene extends Scene {
  private playerWon: boolean = false
  private onRestart?: () => void
  private onBackToSelect?: () => void

  // 特效元素
  private resultText: Text | null = null
  private subtitleText: Text | null = null
  private effectContainer: Container | null = null
  private raysGraphics: Graphics | null = null
  private restartBtn: Button | null = null
  private backBtn: Button | null = null
  private particles: Array<{ graphics: Graphics; x: number; y: number; vx: number; vy: number; life: number; maxLife: number }> = []
  private baseTextY: number = 0

  // 动画状态
  private animationTime: number = 0
  private animationDuration: number = 1500
  private isAnimating: boolean = false

  constructor(renderer: Renderer) {
    super(renderer)
  }

  // 设置结果
  setResult(playerWon: boolean): void {
    this.playerWon = playerWon
  }

  onEnter(): void {
    this.clear()
    this.particles = []
    this.animationTime = 0
    this.isAnimating = true
    this.createUI()
  }

  onExit(): void {
    this.isAnimating = false
    this.particles = []
    this.clear()
  }

  update(delta: number): void {
    if (!this.isAnimating) return

    const deltaTime = delta * (1000 / 60)  // 转换为毫秒
    this.animationTime += deltaTime

    const progress = Math.min(this.animationTime / this.animationDuration, 1)

    // 结果文字动画
    if (this.resultText) {
      if (this.playerWon) {
        // 胜利：放大 + 弹跳效果
        const scaleProgress = this.easeOutBack(Math.min(progress * 1.5, 1))
        this.resultText.scale.set(scaleProgress, scaleProgress)
      } else {
        // 失败：抖动 + 下沉
        const centerX = this.renderer.getSize().width / 2
        if (progress < 0.5) {
          // 抖动阶段
          const shake = Math.sin(progress * Math.PI * 10) * 5 * (1 - progress * 2)
          this.resultText.x = centerX + shake
          const scaleVal = this.easeOutQuad(progress * 2)
          this.resultText.scale.set(scaleVal, scaleVal)
        } else {
          // 下沉阶段
          this.resultText.x = centerX
          this.resultText.scale.set(1, 1)
          const fallProgress = (progress - 0.5) * 2
          this.resultText.y = this.baseTextY + fallProgress * 30
          this.resultText.rotation = fallProgress * 0.15
        }
      }
    }

    // 副标题淡入
    if (this.subtitleText) {
      this.subtitleText.alpha = Math.max(0, (progress - 0.3) * 2)
    }

    // 按钮淡入
    if (this.restartBtn) {
      this.restartBtn.alpha = Math.max(0, (progress - 0.5) * 2)
    }
    if (this.backBtn) {
      this.backBtn.alpha = Math.max(0, (progress - 0.5) * 2)
    }

    // 光芒效果（胜利）
    if (this.playerWon && this.raysGraphics) {
      this.drawRays(progress)
    }

    // 粒子效果（胜利）
    if (this.playerWon && this.effectContainer) {
      this.updateParticles()
      if (progress < 0.8 && Math.random() < 0.3) {
        this.spawnParticle()
      }
    }

    // 动画完成
    if (progress >= 1) {
      this.isAnimating = false
    }
  }

  // 创建 UI
  private createUI(): void {
    const size = this.renderer.getSize()

    // 背景
    const bg = this.renderer.createGraphics()
    bg.rect(0, 0, size.width, size.height)
    bg.fill({ color: Colors.BACKGROUND, alpha: 0.95 })
    this.addChild(bg)

    // 特效容器
    this.effectContainer = new Container()
    this.addChild(this.effectContainer)

    // 光芒效果（胜利时）
    if (this.playerWon) {
      this.raysGraphics = this.renderer.createGraphics()
      this.raysGraphics.x = size.width / 2
      this.raysGraphics.y = size.height / 2 - 80
      this.effectContainer.addChild(this.raysGraphics)
    }

    // 结果文本
    const resultTextContent = this.playerWon ? '胜利！' : '失败...'
    const resultColor = this.playerWon ? Colors.TEXT_GOLD : Colors.TEXT_RED

    this.resultText = new Text({
      text: resultTextContent,
      style: {
        fontFamily: 'Arial, sans-serif',
        fontSize: 64,
        fill: resultColor,
        fontWeight: 'bold',
        dropShadow: { color: 0x000000, blur: 8, distance: 4 }
      }
    })
    this.resultText.anchor.set(0.5)
    this.resultText.x = size.width / 2
    this.baseTextY = size.height / 2 - 80
    this.resultText.y = this.baseTextY
    this.resultText.scale.set(0.01, 0.01)
    this.addChild(this.resultText)

    // 副标题
    const subtitle = this.playerWon
      ? '你战胜了对手，名震江湖！'
      : '江湖险恶，来日再战！'

    this.subtitleText = new Text({
      text: subtitle,
      style: TextStyles.SUBTITLE
    })
    this.subtitleText.style.fontSize = 20
    this.subtitleText.anchor.set(0.5)
    this.subtitleText.x = size.width / 2
    this.subtitleText.y = size.height / 2
    this.subtitleText.alpha = 0
    this.addChild(this.subtitleText)

    // 重新开始按钮
    this.restartBtn = new Button('再来一局', 150, 50, this.renderer)
    this.restartBtn.x = size.width / 2 - 160
    this.restartBtn.y = size.height / 2 + 80
    this.restartBtn.alpha = 0
    this.restartBtn.setOnClick(() => {
      if (this.onRestart) {
        this.onRestart()
      }
    })
    this.addChild(this.restartBtn)

    // 返回选择按钮
    this.backBtn = new Button('选择角色', 150, 50, this.renderer)
    this.backBtn.x = size.width / 2 + 10
    this.backBtn.y = size.height / 2 + 80
    this.backBtn.alpha = 0
    this.backBtn.setOnClick(() => {
      if (this.onBackToSelect) {
        this.onBackToSelect()
      }
    })
    this.addChild(this.backBtn)
  }

  // 绘制光芒
  private drawRays(progress: number): void {
    if (!this.raysGraphics) return

    const rayCount = 12
    const maxLength = 200
    const currentLength = maxLength * Math.min(progress * 1.5, 1)
    const alpha = Math.max(0, 1 - progress * 0.5)

    this.raysGraphics.clear()
    for (let i = 0; i < rayCount; i++) {
      const angle = (i / rayCount) * Math.PI * 2 + progress * Math.PI
      const rayWidth = 15 + Math.sin(progress * Math.PI * 4 + i) * 5

      this.raysGraphics.moveTo(0, 0)
      const endX = Math.cos(angle) * currentLength
      const endY = Math.sin(angle) * currentLength
      this.raysGraphics.lineTo(endX, endY)
      this.raysGraphics.stroke({
        color: Colors.TEXT_GOLD,
        width: rayWidth,
        alpha: alpha * 0.3
      })
    }
  }

  // 生成粒子
  private spawnParticle(): void {
    if (!this.effectContainer) return

    const size = this.renderer.getSize()
    const centerX = size.width / 2
    const centerY = size.height / 2 - 80

    const particle = this.renderer.createGraphics()
    const particleSize = 3 + Math.random() * 4
    particle.circle(0, 0, particleSize)
    particle.fill(Colors.TEXT_GOLD)

    const angle = Math.random() * Math.PI * 2
    const speed = 2 + Math.random() * 3

    const pData = {
      graphics: particle,
      x: centerX,
      y: centerY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 1,
      life: 0,
      maxLife: 60 + Math.random() * 40
    }

    this.particles.push(pData)
    this.effectContainer.addChild(particle)
  }

  // 更新粒子
  private updateParticles(): void {
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i]
      p.x += p.vx
      p.y += p.vy
      p.vy += 0.05
      p.life++

      const lifeRatio = p.life / p.maxLife
      p.graphics.x = p.x
      p.graphics.y = p.y
      p.graphics.alpha = 1 - lifeRatio
      p.graphics.scale.set(1 - lifeRatio * 0.5, 1 - lifeRatio * 0.5)

      if (p.life >= p.maxLife) {
        this.effectContainer!.removeChild(p.graphics)
        this.particles.splice(i, 1)
      }
    }
  }

  // 缓动函数：弹跳效果
  private easeOutBack(x: number): number {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2)
  }

  // 缓动函数：平滑减速
  private easeOutQuad(x: number): number {
    return 1 - (1 - x) * (1 - x)
  }

  // 设置回调
  setOnRestart(callback: () => void): void {
    this.onRestart = callback
  }

  setOnBackToSelect(callback: () => void): void {
    this.onBackToSelect = callback
  }
}