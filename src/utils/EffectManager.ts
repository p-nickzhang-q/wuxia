import { Container, Text, TextStyle } from 'pixi.js'
import { tweenManager, Easing } from './TweenManager'

/**
 * 特效管理器 - 统一管理所有视觉特效
 */
export class EffectManager extends Container {
  constructor() {
    super()
    this.label = 'effectManager'
  }

  /**
   * 显示伤害数字（红色向上飘出）
   */
  showDamageNumber(damage: number, x: number, y: number): Promise<void> {
    return new Promise(resolve => {
      const style = new TextStyle({
        fontSize: 48,
        fill: '#ff0000',
        fontWeight: 'bold'
      })
      const text = new Text(`-${damage}`, style)
      text.x = x
      text.y = y
      text.alpha = 1
      this.addChild(text)

      const targetY = y - 60
      const duration = 1000

      tweenManager.create(text, { y: targetY, alpha: 0 }, duration, Easing.easeOutQuad, () => {
        this.removeChild(text)
        resolve()
      })
    })
  }

  /**
   * 显示护盾数字（绿色向上飘出）
   */
  showShieldNumber(amount: number, x: number, y: number): Promise<void> {
    return new Promise(resolve => {
      const style = new TextStyle({
        fontSize: 48,
        fill: '#00ff00',
        fontWeight: 'bold'
      })
      const text = new Text(`+${amount}`, style)
      text.x = x
      text.y = y
      text.alpha = 1
      this.addChild(text)

      const targetY = y - 60
      const duration = 1000

      tweenManager.create(text, { y: targetY, alpha: 0 }, duration, Easing.easeOutQuad, () => {
        this.removeChild(text)
        resolve()
      })
    })
  }

  /**
   * 角色面板震动
   */
  shakeCharacter(target: Container, intensity: number = 10, duration: number = 300): Promise<void> {
    return new Promise(resolve => {
      const originalX = target.x
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = elapsed / duration

        if (progress < 1) {
          target.x = originalX + Math.sin(progress * Math.PI * 8) * intensity * (1 - progress)
          requestAnimationFrame(animate)
        } else {
          target.x = originalX
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }
}

// 全局特效管理器实例
export const effectManager = new EffectManager()