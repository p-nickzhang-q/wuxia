# ADR-001: Factory Function Pattern for Game Entities

## Status

Accepted

## Context

游戏核心实体（Game、Character）需要创建和管理状态。传统OOP使用类构造函数，但TypeScript/JavaScript的工厂函数模式提供了更灵活的对象创建方式。

## Decision

采用工厂函数模式创建核心游戏实体：

- `createGame()` — 游戏状态管理工厂函数
- `createCharacter()` — 角色实体工厂函数
- `createDisciple()` — 弟子实体工厂函数

不使用ES6类，而是使用闭包封装私有状态，返回公共接口对象。

## Rationale

1. **简洁性** — 工厂函数比类更简洁，无需构造函数语法
2. **封装性** — 闭包自动封装私有变量，无需`private`修饰符
3. **灵活性** — 易于组合多个工厂函数，构建复杂对象
4. **测试性** — 工厂函数返回的对象易于mock和测试
5. **PixiJS兼容** — PixiJS容器使用类继承，游戏逻辑层保持独立风格

## Implementation

```typescript
// src/game/Game.ts
export function createGame(config: GameConfig): Game {
  let state: GameState = initialState(config)

  return {
    get state() { return state },
    nextTurn: () => { ... },
    handleDamage: (target, amount) => { ... },
    // ...
  }
}

// src/game/Character.ts
export function createCharacter(config: CharacterConfig): Character {
  let hp = config.hp
  let mp = config.mp
  let agility = config.agility

  return {
    id: config.id,
    name: config.name,
    get hp() { return hp },
    takeDamage: (amount) => { hp -= amount },
    // ...
  }
}
```

## Consequences

- 所有游戏实体使用工厂函数创建
- 状态通过返回对象的getter暴露，方法修改内部状态
- Scene类（继承PixiJS Container）与游戏逻辑层风格不同，这是可接受的分离
- 未来新增实体继续使用工厂函数模式

## References

- `src/game/Game.ts` — 游戏工厂函数实现
- `src/game/Character.ts` — 角色工厂函数实现
- `src/game/Disciple.ts` — 弟子工厂函数实现