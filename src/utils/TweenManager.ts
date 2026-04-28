import { Container } from 'pixi.js'

// 缓动函数类型
type EasingFunction = (t: number) => number

// 缓动函数
export const Easing = {
  linear: (t: number): number => t,
  easeInQuad: (t: number): number => t * t,
  easeOutQuad: (t: number): number => t * (2 - t),
  easeInOutQuad: (t: number): number => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,
  easeInCubic: (t: number): number => t * t * t,
  easeOutCubic: (t: number): number => (--t) * t * t + 1,
  easeInOutCubic: (t: number): number => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,
  easeInElastic: (t: number): number => {
    if (t === 0 || t === 1) return t
    return -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI)
  },
  easeOutElastic: (t: number): number => {
    if (t === 0 || t === 1) return t
    return Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1
  },
  easeOutBounce: (t: number): number => {
    if (t < 1 / 2.75) {
      return 7.5625 * t * t
    } else if (t < 2 / 2.75) {
      return 7.5625 * (t -= 1.5 / 2.75) * t + 0.75
    } else if (t < 2.5 / 2.75) {
      return 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375
    } else {
      return 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375
    }
  },
  easeOutBack: (t: number): number => {
    const c1 = 1.70158
    const c3 = c1 + 1
    return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2)
  }
}

// Tween 接口
interface Tween {
  target: any
  props: Record<string, { start: number; end: number }>
  duration: number
  elapsed: number
  easing: EasingFunction
  onComplete?: () => void
  complete: boolean
}

// Tween 管理器
export class TweenManager {
  private tweens: Tween[] = []

  // 创建 tween
  create(
    target: any,
    props: Record<string, number>,
    duration: number,
    easing: EasingFunction = Easing.linear,
    onComplete?: () => void
  ): Tween {
    const tween: Tween = {
      target,
      props: {},
      duration,
      elapsed: 0,
      easing,
      onComplete,
      complete: false
    }

    // 记录起始值
    for (const [key, endValue] of Object.entries(props)) {
      tween.props[key] = {
        start: target[key],
        end: endValue
      }
    }

    this.tweens.push(tween)
    return tween
  }

  // 更新所有 tween
  update(delta: number): void {
    const completed: Tween[] = []

    for (const tween of this.tweens) {
      if (tween.complete) continue

      tween.elapsed += delta * 16.67 // 转换为毫秒

      const progress = Math.min(tween.elapsed / tween.duration, 1)
      const easedProgress = tween.easing(progress)

      // 更新属性
      for (const [key, prop] of Object.entries(tween.props)) {
        tween.target[key] = prop.start + (prop.end - prop.start) * easedProgress
      }

      // 检查完成
      if (progress >= 1) {
        tween.complete = true
        completed.push(tween)

        if (tween.onComplete) {
          tween.onComplete()
        }
      }
    }

    // 移除已完成的 tween
    this.tweens = this.tweens.filter(t => !t.complete)
  }

  // 移除目标的所有 tween
  removeTweensOf(target: any): void {
    this.tweens = this.tweens.filter(t => t.target !== target)
  }

  // 清除所有 tween
  clear(): void {
    this.tweens = []
  }

  // 销毁：清除所有 tween 并禁止后续创建
  destroy(): void {
    this.clear()
    this.isDestroyed = true
  }

  // 检查是否已销毁
  isDestroyed: boolean = false

  // 预设动画：淡入
  fadeIn(target: Container, duration: number = 300): Promise<void> {
    return new Promise(resolve => {
      target.alpha = 0
      this.create(target, { alpha: 1 }, duration, Easing.easeOutQuad, resolve)
    })
  }

  // 预设动画：淡出
  fadeOut(target: Container, duration: number = 300): Promise<void> {
    return new Promise(resolve => {
      this.create(target, { alpha: 0 }, duration, Easing.easeOutQuad, resolve)
    })
  }

  // 预设动画：移动到
  moveTo(target: Container, x: number, y: number, duration: number = 300): Promise<void> {
    return new Promise(resolve => {
      this.create(target, { x, y }, duration, Easing.easeOutQuad, resolve)
    })
  }

  // 预设动画：缩放到（PixiJS v8 使用 scale.x/scale.y）
  scaleTo(target: Container, scale: number, duration: number = 300): Promise<void> {
    return new Promise(resolve => {
      // PixiJS v8: scale 是一个 { x, y } 对象
      const startScaleX = target.scale.x
      const startScaleY = target.scale.y
      const startTime = Date.now()

      const animate = () => {
        if (this.isDestroyed) {
          resolve()
          return
        }

        const elapsed = Date.now() - startTime
        const progress = Math.min(elapsed / duration, 1)
        const easedProgress = Easing.easeOutBack(progress)

        target.scale.x = startScaleX + (scale - startScaleX) * easedProgress
        target.scale.y = startScaleY + (scale - startScaleY) * easedProgress

        if (progress < 1) {
          requestAnimationFrame(animate)
        } else {
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }

  // 预设动画：震动
  shake(target: Container, intensity: number = 10, duration: number = 300): Promise<void> {
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

  // 预设动画：弹跳
  bounce(target: Container, height: number = 20, duration: number = 500): Promise<void> {
    return new Promise(resolve => {
      const originalY = target.y
      const startTime = Date.now()

      const animate = () => {
        const elapsed = Date.now() - startTime
        const progress = elapsed / duration

        if (progress < 1) {
          const bounceProgress = Easing.easeOutBounce(progress)
          target.y = originalY - height * (1 - bounceProgress)
          requestAnimationFrame(animate)
        } else {
          target.y = originalY
          resolve()
        }
      }

      requestAnimationFrame(animate)
    })
  }
}

// 全局 tween 管理器实例
export const tweenManager = new TweenManager()