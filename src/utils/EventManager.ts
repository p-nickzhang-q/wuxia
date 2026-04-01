import { GameEventType } from '../game/types'
// 重新导出 GameEventType 以便其他文件可以从这里导入
export { GameEventType }

// 事件数据接口
export interface GameEvent {
  type: GameEventType
  data?: any
  timestamp: number
}

// 事件监听器类型
type EventListener = (event: GameEvent) => void

// 事件管理器
export class EventManager {
  private listeners: Map<GameEventType, EventListener[]> = new Map()
  private eventQueue: GameEvent[] = []
  private isProcessing: boolean = false

  constructor() {
    // 初始化所有事件类型的监听器数组
    Object.values(GameEventType).forEach(type => {
      this.listeners.set(type, [])
    })
  }

  // 添加事件监听器
  on(eventType: GameEventType, listener: EventListener): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.push(listener)
    }
  }

  // 移除事件监听器
  off(eventType: GameEventType, listener: EventListener): void {
    const listeners = this.listeners.get(eventType)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
      }
    }
  }

  // 触发事件（立即执行）
  emit(eventType: GameEventType, data?: any): void {
    const event: GameEvent = {
      type: eventType,
      data,
      timestamp: Date.now()
    }

    const listeners = this.listeners.get(eventType)
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(event)
        } catch (error) {
          console.error(`Error in event listener for ${eventType}:`, error)
        }
      })
    }
  }

  // 推送事件到队列（延迟执行）
  push(eventType: GameEventType, data?: any): void {
    this.eventQueue.push({
      type: eventType,
      data,
      timestamp: Date.now()
    })
  }

  // 处理事件队列
  processQueue(): void {
    if (this.isProcessing) return

    this.isProcessing = true

    while (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!
      this.emit(event.type, event.data)
    }

    this.isProcessing = false
  }

  // 清空事件队列
  clearQueue(): void {
    this.eventQueue = []
  }

  // 移除所有监听器
  removeAllListeners(): void {
    this.listeners.forEach((_, key) => {
      this.listeners.set(key, [])
    })
  }

  // 一次性监听
  once(eventType: GameEventType, listener: EventListener): void {
    const onceListener: EventListener = (event) => {
      listener(event)
      this.off(eventType, onceListener)
    }
    this.on(eventType, onceListener)
  }
}

// 全局事件管理器实例
export const eventManager = new EventManager()

// 事件辅助函数
export function emitGameEvent(type: GameEventType, data?: any): void {
  eventManager.emit(type, data)
}

export function onGameEvent(type: GameEventType, listener: EventListener): void {
  eventManager.on(type, listener)
}

export function offGameEvent(type: GameEventType, listener: EventListener): void {
  eventManager.off(type, listener)
}