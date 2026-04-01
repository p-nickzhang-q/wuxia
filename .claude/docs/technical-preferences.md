# Technical Preferences

<!-- Engine configuration for PixiJS 8 + TypeScript project -->

## Engine & Language

- **Engine**: PixiJS 8.x (Web 2D Rendering Library)
- **Language**: TypeScript 5.x
- **Build System**: Vite 5.x
- **Rendering**: WebGL (preferred) / Canvas2D (fallback)
- **Runtime**: Browser (Web)

## Naming Conventions

- **Classes/Interfaces**: PascalCase (e.g., `CardRenderer`, `CharacterState`)
- **Functions/Methods**: camelCase (e.g., `handleClick`, `updatePosition`)
- **Private Fields**: `_camelCase` (e.g., `_animating`) or `#camelCase` (private fields)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_HP`) or PascalCase for config objects
- **Files**: PascalCase for component classes, camelCase for utility functions
- **Enums**: PascalCase for enum name, UPPER_SNAKE_CASE for members
- **Events**: camelCase with past tense (e.g., `cardPlayed`, `damageDealt`)

## Performance Budgets

- **Target Framerate**: 60 FPS
- **Frame Budget**: 16.6ms
- **Draw Calls**: Minimize via batching, use ParticleContainer for particles
- **Texture Memory**: Use spritesheets, dispose unused textures
- **Memory Ceiling**: Monitor via browser devtools, no hard limit set

## Testing

- **Framework**: Vitest (Vite native)
- **Minimum Coverage**: [TO BE CONFIGURED]
- **Required Tests**: Balance formulas, game state transitions, card/skill effects

## Forbidden Patterns

- Avoid `any` type - use proper TypeScript typing
- Avoid direct DOM manipulation - go through PixiJS
- Avoid synchronous blocking operations in game loop
- Avoid creating new objects in hot paths (pool when possible)

## Allowed Libraries / Addons

- **pixi.js**: Core rendering engine (v8.x)
- **vite**: Build tooling
- **typescript**: Language
- Additional libraries to be evaluated as needed

## Architecture Decisions Log

- Factory function pattern for Game and Character (not classes)
- Event-driven architecture via EventManager
- Scene-based game flow with onEnter/onExit lifecycle