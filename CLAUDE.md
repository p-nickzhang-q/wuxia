# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

武侠卡牌对战游戏 - 基于 Godot 4.6 + GDScript 的回合制卡牌游戏，核心机制为基于轻功的行动顺序系统。

## 常用命令

```bash
godot --path .          # 打开编辑器
godot --path . --headless --quit-after 2  # 验证项目
```

## 架构概览

### 自动加载 (Autoload)

- **GameManager** (`scripts/autoload/game_manager.gd`): 全局状态管理、场景切换、数据加载

### 核心脚本 (`scripts/game/`)

- **character.gd**: 角色类，管理 HP/MP/护盾/轻功、卡组、抽牌
- **battle_manager.gd**: 战斗管理器，回合流程、行动顺序、伤害处理

### 数据资源 (`resources/`)

- **characters/**: 角色配置 JSON
- **skills/**: 武功招式和内功配置 JSON
- **cards/**: 基础招式卡牌 JSON

### 场景 (`scenes/`)

- **main.tscn**: 主菜单
- **character_select.tscn**: 角色选择
- **battle.tscn**: 战斗场景
- **result.tscn**: 结果场景

## 核心机制

### 行动顺序

轻功值决定回合内行动顺序。每回合开始时比较双方轻功，高者先行动。使用卡牌/招式消耗轻功值，当当前行动方轻功低于对方时切换行动方。

### 武功招式系统

武功招式需要对应类型的手牌作为媒介：
- `fist`: 空手类（拳击、肘击）
- `palm`: 掌法类
- `short_weapon`: 短兵类（刺击）
- `long_weapon`: 长兵类（横扫、直刺）
- `kick`: 腿法类（前踢、扫腿）
- `any`: 任意类型手牌

### 内功触发时机

- `turn_start`: 回合开始
- `turn_end`: 回合结束
- `on_damage`: 造成伤害时
- `on_take_damage`: 受到伤害时
- `on_play_card`: 使用基础招式时
- `on_skill_use`: 使用武功招式时

## 技术栈

- **Engine**: Godot 4.6
- **Language**: GDScript
- **Rendering**: Forward Plus

## 设计文档

- `docs/CHARACTERS.md`: 角色详细配置
- `docs/SKILLS.md`: 武功招式详细配置
- `docs/SECTOR-MANAGEMENT-DESIGN.md`: 门派管理系统设计
- `docs/SECTOR-UI-DESIGN.md`: 门派管理UI设计
