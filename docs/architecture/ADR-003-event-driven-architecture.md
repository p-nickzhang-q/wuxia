# ADR-003: Event-Driven Architecture

## Status

Accepted

## Context

游戏逻辑层与UI层需要解耦通信。战斗流程中的事件（卡牌使用、伤害、回合切换）需要通知UI更新，但不直接调用UI方法。

## Decision

采用EventManager单例实现发布-订阅模式：

- 游戏逻辑层发布事件：`eventManager.emit('damageDealt', { target, amount })`
- UI层订阅事件：`eventManager.on('damageDealt', this.handleDamage)`
- 事件类型定义在`types.ts`的枚举中

## Rationale

1. **解耦** — Game.ts不依赖Scene，Scene不直接调用Game内部方法
2. **可扩展** — 新增事件监听无需修改现有代码
3. **调试** — 事件流可追踪，便于日志记录
4. **TypeScript友好** — 事件类型可定义接口约束

## Implementation

```typescript
// src/game/EventManager.ts
type EventCallback = (data: any) => void

class EventManager {
  private listeners: Map<string, Set<EventCallback>> = new Map()

  on(event: string, callback: EventCallback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: EventCallback) {
    this.listeners.get(event)?.delete(callback)
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(cb => cb(data))
  }
}

export const eventManager = new EventManager()
```

## Consequences

- 所有跨层通信通过EventManager
- Scene在onEnter订阅事件、onExit取消订阅（防止内存泄漏）
- 事件命名使用camelCase过去式：`cardPlayed`, `damageDealt`, `turnEnded`
- 性能考虑：高频事件（如动画帧）不使用EventManager

## References

- `src/game/types.ts` — 事件类型定义
- `src/scenes/BattleScene.ts` — 事件订阅示例
- `src/game/Game.ts` — 事件发布示例