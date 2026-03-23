import { Container } from 'pixi.js'
import { Renderer } from '../renderer/Renderer'

// 场景基类
export abstract class Scene extends Container {
  protected renderer: Renderer
  protected isInitialized: boolean = false

  constructor(renderer: Renderer) {
    super()
    this.renderer = renderer
  }

  // 进入场景时调用
  abstract onEnter(): void

  // 退出场景时调用
  abstract onExit(): void

  // 每帧更新
  abstract update(delta: number): void

  // 清理场景
  clear(): void {
    this.removeChildren()
    this.isInitialized = false
  }
}