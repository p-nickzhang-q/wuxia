# Technical Preferences

<!-- Engine configuration for Godot 4.6 + GDScript project -->

## Engine & Language

- **Engine**: Godot 4.6
- **Language**: GDScript
- **Rendering**: Forward Plus
- **Runtime**: Desktop (Windows/Linux/Mac), Mobile (future)

## Naming Conventions

- **Classes**: PascalCase with `class_name` (e.g., `Character`, `BattleManager`)
- **Functions/Methods**: snake_case (e.g., `take_damage`, `draw_cards`)
- **Private Methods**: `_snake_case` (e.g., `_shuffle_deck`, `_check_battle_end`)
- **Signals**: snake_case (e.g., `turn_changed`, `damage_dealt`, `battle_ended`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `MAX_HP`, `CARD_SIZE`)
- **Enums**: PascalCase for enum name, UPPER_SNAKE_CASE for members
- **Files**: snake_case.gd for scripts, snake_case.tscn for scenes
- **Nodes**: PascalCase in scene tree (e.g., `PlayerPanel`, `HandContainer`)

## Performance Budgets

- **Target Framerate**: 60 FPS
- **Frame Budget**: 16.6ms
- **Draw Calls**: Minimize via batching, use Sprite2D for static elements
- **Texture Memory**: Use Texture2D, AtlasTexture for spritesheets
- **Memory Ceiling**: Monitor via Godot profiler

## Testing

- **Framework**: Godot Built-in Unit Tests (GUT or GDUnit4)
- **Minimum Coverage**: [TO BE CONFIGURED]
- **Required Tests**: Battle state transitions, card/skill effects, damage calculation

## Forbidden Patterns

- Avoid `@onready` for nodes that may be null — use `get_node_or_null()`
- Avoid direct `call_deferred()` chains — use signals instead
- Avoid creating nodes in `_process()` — pool when possible
- Avoid blocking operations in main thread

## Allowed Libraries / Addons

- **godot**: Core engine (v4.6)
- Additional addons to be evaluated as needed

## Architecture Decisions Log

- **2026-05-11**: Migrated from PixiJS to Godot 4.6
- `class_name` for core classes (`Character`, `BattleManager`)
- Autoload singleton for global state (`GameManager`)
- Scene-based game flow with signal-driven UI updates
- JSON files for game data (characters, skills, cards)
