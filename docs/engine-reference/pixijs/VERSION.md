# PixiJS — Version Reference

| Field | Value |
|-------|-------|
| **Engine Version** | 8.17.1 |
| **Project Pinned** | 2026-04-01 |
| **LLM Knowledge Cutoff** | May 2025 |
| **Risk Level** | LOW — version is within LLM training data range |

## Version Notes

PixiJS 8.x introduced significant changes from v7:
- New `Assets` class replaces `Loader`
- `Container` API changes (scale.x instead of scaleX)
- Modern event system (`eventMode = 'static'` instead of `interactive = true`)
- `Graphics` API uses chained methods with options objects

## Key API Differences (v7 → v8)

| v7 API | v8 API |
|--------|--------|
| `sprite.interactive = true` | `sprite.eventMode = 'static'` |
| `sprite.scaleX = 2` | `sprite.scale.x = 2` |
| `Loader.shared.add()` | `Assets.load()` |
| `graphics.beginFill(color)` | `graphics.fill({ color })` |
| `graphics.lineStyle(width, color)` | `graphics.stroke({ width, color })` |

## Note

This engine version is within the LLM's training data. Engine reference
docs are optional but can be added later if agents suggest incorrect APIs.

Run `/setup-engine refresh` to populate full reference docs at any time.

## Official Resources

- [PixiJS v8 Documentation](https://pixijs.com/8.x/guides/)
- [PixiJS API Reference](https://pixijs.download/v8.17.1/docs/index.html)
- [Migration Guide v7 to v8](https://pixijs.com/8.x/guides/migrations/v7)