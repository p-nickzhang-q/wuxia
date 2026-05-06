# ADR-002: Scene Lifecycle Architecture

## Status

Accepted

## Context

游戏需要多个场景（角色选择、战斗、结果、门派管理），每个场景有独立的UI和生命周期。PixiJS Container作为场景的视觉容器，但需要统一的生命周期管理。

## Decision

采用Scene基类架构，继承PixiJS Container，定义统一生命周期接口：

```typescript
abstract class Scene extends Container {
  abstract onEnter(): void
  abstract onExit(): void
  abstract update(delta: number): void
}
```

SceneManager管理场景切换：
- 单例管理当前场景
- `switchScene(nextScene)` 调用 `current.onExit()` → `next.onEnter()`
- 游戏主循环调用 `current.update(delta)`

## Rationale

1. **PixiJS兼容** — Scene继承Container，可直接添加到Application.stage
2. **生命周期清晰** — onEnter/onExit定义进入和离开时的初始化/清理
3. **解耦UI与逻辑** — Scene负责UI渲染，调用游戏逻辑层工厂函数
4. **可扩展** — 新场景继承Scene基类，实现必要方法

## Implementation

```typescript
// src/scenes/Scene.ts
export abstract class Scene extends Container {
  abstract onEnter(): void
  abstract onExit(): void
  abstract update(delta: number): void
}

// src/scenes/BattleScene.ts
export class BattleScene extends Scene {
  onEnter() {
    this.initUI()
    this.setupEventListeners()
  }
  onExit() {
    this.cleanupListeners()
    this.destroyUI()
  }
  update(delta) {
    this.animateCards(delta)
  }
}
```

## Consequences

- 所有场景继承Scene基类
- 场景切换自动触发生命周期方法
- 场景内UI组件在onEnter创建、onExit销毁
- 内存泄漏风险：onExit必须正确清理资源

## References

- `src/scenes/Scene.ts` — Scene基类定义
- `src/scenes/BattleScene.ts` — 战斗场景实现
- `src/scenes/CharacterSelectScene.ts` — 角色选择场景
- `src/scenes/ResultScene.ts` — 结果场景