import { Container, Graphics, Text } from 'pixi.js'
import { Colors } from './Renderer'
import { LayoutConstants } from './LayoutConstants'

/**
 * 角色效果动画器
 * 封装震动、闪烁、高亮等动画效果
 */
export class CharacterEffectAnimator {
  private target: Container
  private hpBar: Graphics | null = null

  constructor(target: Container) {
    this.target = target
  }

  setHpBar(hpBar: Graphics): void {
    this.hpBar = hpBar
  }

  /**
   * 面板震动效果
   */
  shake(intensity: number = 10, duration: number = 300): Promise<void> {
    return new Promise(resolve => {
      const originalX = this.target.x
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = elapsed / duration

        if (progress < 1) {
          this.target.x = originalX + Math.sin(progress * Math.PI * 8) * intensity * (1 - progress)
          requestAnimationFrame(animate)
        } else {
          this.target.x = originalX
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  /**
   * HP条闪烁效果
   */
  flashHpBar(
    drawCallback: () => void,
    color: number = Colors.HP_BAR,
    flashCount: number = 3,
    interval: number = 100
  ): Promise<void> {
    return new Promise(resolve => {
      let flash = true
      let count = 0

      const flashInterval = setInterval(() => {
        flash = !flash
        if (flash && this.hpBar) {
          const panelWidth = LayoutConstants.panelWidth()
          const barWidth = LayoutConstants.barWidth()
          const barHeight = LayoutConstants.barHeight()
          const barX = (panelWidth - barWidth) / 2
          this.hpBar.clear()
          this.hpBar.rect(barX, 0, barWidth, barHeight)
          this.hpBar.fill(color)
        } else {
          drawCallback()
        }

        count++
        if (count >= flashCount * 2) {
          clearInterval(flashInterval)
          drawCallback()
          resolve()
        }
      }, interval)
    })
  }

  /**
   * 内功高亮效果
   */
  highlightPassive(text: Text): void {
    if ((text as any)._animating) return
    ;(text as any)._animating = true

    const originalY = text.y
    const targetScale = 1.3
    const jumpHeight = 10

    const startColor = { r: 0x44, g: 0x88, b: 0xff }
    const targetColor = { r: 0xff, g: 0xd7, b: 0x00 }

    const startTime = Date.now()
    const phase1Duration = 200
    const phase2Duration = 150
    const phase3Duration = 250

    const animate = () => {
      const elapsed = Date.now() - startTime
      const totalDuration = phase1Duration + phase2Duration + phase3Duration

      if (elapsed < phase1Duration) {
        // 放大+变色
        const progress = elapsed / phase1Duration
        text.scale.set(1 + (targetScale - 1) * progress)
        text.y = originalY - jumpHeight * Math.sin(progress * Math.PI)

        const r = Math.round(startColor.r + (targetColor.r - startColor.r) * progress)
        const g = Math.round(startColor.g + (targetColor.g - startColor.g) * progress)
        const b = Math.round(startColor.b + (targetColor.b - startColor.b) * progress)
        text.style.fill = (r << 16) | (g << 8) | b

        requestAnimationFrame(animate)
      } else if (elapsed < phase1Duration + phase2Duration) {
        // 保持
        text.scale.set(targetScale)
        text.y = originalY - jumpHeight
        text.style.fill = Colors.TEXT_GOLD
        requestAnimationFrame(animate)
      } else if (elapsed < totalDuration) {
        // 缩回+恢复
        const progress = (elapsed - phase1Duration - phase2Duration) / phase3Duration
        text.scale.set(targetScale - (targetScale - 1) * progress)
        text.y = originalY - jumpHeight * (1 - progress)

        const r = Math.round(targetColor.r - (targetColor.r - startColor.r) * progress)
        const g = Math.round(targetColor.g - (targetColor.g - startColor.g) * progress)
        const b = Math.round(targetColor.b - (targetColor.b - startColor.b) * progress)
        text.style.fill = (r << 16) | (g << 8) | b

        requestAnimationFrame(animate)
      } else {
        // 完成
        text.scale.set(1)
        text.y = originalY
        text.style.fill = Colors.MP_BAR
        ;(text as any)._animating = false
      }
    }

    requestAnimationFrame(animate)
  }
}