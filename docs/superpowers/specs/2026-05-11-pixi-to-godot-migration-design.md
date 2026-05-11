# PixiJS 到 Godot 战斗系统迁移设计

## 概述

将 pixi 分支的战斗系统完整迁移到 Godot 4.6，采用分层迁移策略，优先完成核心战斗功能（含多人战斗）。

## 迁移范围

### 源代码（pixi 分支）

**核心逻辑：**
- `src/game/Game.ts` - 游戏状态管理、回合流程、卡牌/武功使用
- `src/game/Character.ts` - 角色状态、牌组管理、内功触发
- `src/game/AI.ts` - AI 决策逻辑
- `src/game/DistanceSystem.ts` - 距离系统（多人战斗）
- `src/game/types.ts` - 类型定义

**渲染层：**
- `src/scenes/BattleScene.ts` - 战斗场景主逻辑
- `src/renderer/CharacterRenderer.ts` - 角色渲染
- `src/renderer/CardRenderer.ts` - 卡牌渲染
- `src/renderer/UIComponents.ts` - UI 组件

### 目标代码（godot 分支）

**已有基础：**
- `scripts/game/character.gd` - 基础角色类
- `scripts/game/battle_manager.gd` - 基础战斗管理器
- `scenes/battle.tscn` - 简单战斗场景

## 迁移策略

采用**分层迁移**方案，分三个阶段：

### Phase 1 - 核心逻辑迁移

迁移游戏逻辑层，不依赖 UI 可独立测试。

### Phase 2 - UI 框架搭建

使用 Godot 原生控件搭建 UI，保持核心布局类似。

### Phase 3 - 战斗场景整合

整合逻辑层和 UI 层，实现完整的战斗流程。

---

## Phase 1 - 核心逻辑架构

### 文件结构

```
scripts/game/
├── types.gd              # 枚举和常量定义
├── card.gd               # 卡牌类
├── character.gd          # 角色类（扩展现有版本）
├── skill.gd              # 武功招式类
├── passive.gd            # 内功类
├── distance_system.gd    # 距离系统
├── game_state.gd         # 游戏状态管理
├── ai_controller.gd      # AI 控制器
└── effect_processor.gd   # 效果处理器
```

### 类型定义 (types.gd)

```gdscript
# 卡牌类型
enum CardType { EMPTY_HAND, SHORT_WEAPON, LONG_WEAPON, LEG }

# 触发时机
enum TriggerTiming { TURN_START, TURN_END, ON_DAMAGE, ON_TAKE_DAMAGE, ON_PLAY_CARD, ON_SKILL_USE }

# 游戏阶段
enum GamePhase { SETUP, SELECTING, SELECTING_TARGET, ACTING, GAME_OVER }

# 战斗模式
enum BattleMode { TEAM, FREE_FOR_ALL }

# 武功等级
enum SkillLevel { BEGINNER, INTERMEDIATE, ADVANCED, MASTER }

# 门派
enum Faction { BEGGAR, SHAOLIN, WUDANG, EMEI, HUASHAN, MOZU, GUMU, TIANSHAN, DALI, XIAKE, QINGCHENG, RIVERSIDE }
```

### 核心类

#### Character 类扩展

```gdscript
class_name Character
extends RefCounted

# 基础属性
var id: String
var name: String
var title: String
var max_hp: int
var max_mp: int
var base_agility: int
var agility: int  # 当前轻功

# 弟子属性
var root: int       # 根骨
var insight: int    # 悟性
var will: int       # 定力
var strength: int   # 臂力

# 战斗状态
var current_hp: int
var current_mp: int
var shield: int = 0

# 战斗位置
var battle_position: Dictionary = {}  # { seat_index: int, team: String }

# 牌组
var deck: Array[Card] = []
var hand: Array[Card] = []
var discard_pile: Array[Card] = []

# 武功和内功
var skills: Array[Skill] = []
var passives: Array[Passive] = []

# 减益效果
var debuffs: Array = []  # Debuff 数组
var dots: Array = []     # 持续伤害数组

# 信号
signal hp_changed(old_value: int, new_value: int)
signal mp_changed(old_value: int, new_value: int)
signal shield_changed(old_value: int, new_value: int)
signal agility_changed(old_value: int, new_value: int)
signal card_drawn(card: Card)
signal passive_triggered(passive: Passive)

# 核心方法
func init_deck() -> void
func draw_cards(count: int) -> Array[Card]
func play_card(card_instance_id: String) -> Card
func take_damage(amount: int, attacker: Character = null) -> Dictionary
func heal(amount: int) -> int
func use_mp(amount: int) -> bool
func recover_mp(amount: int) -> int
func is_alive() -> bool

# 回合方法
func reset_for_new_turn() -> void
func on_turn_start(game_state: GameState) -> Array[String]
func on_turn_end() -> Array[String]

# 内功触发
func trigger_passives(timing: TriggerTiming, args: Array = []) -> Dictionary
```

#### GameState 类

```gdscript
class_name GameState
extends Node

# 战斗模式
var battle_mode: BattleMode = BattleMode.TEAM

# 队伍
var player_team: Array[Character] = []
var enemy_team: Array[Character] = []
var total_seats: int = 0

# 向后兼容
var player: Character  # player_team[0]
var enemy: Character   # enemy_team[0]

# 当前状态
var current_turn: int = 0
var current_actor: Character = null
var phase: GamePhase = GamePhase.SETUP
var selected_target: Character = null

# 战斗日志
var battle_log: Array = []

# 信号
signal turn_started(turn_number: int)
signal turn_ended()
signal actor_changed(actor: Character)
signal card_played(actor: Character, card: Card, target: Character)
signal skill_used(actor: Character, skill: Skill, target: Character)
signal damage_dealt(target: Character, amount: int)
signal character_died(character: Character)
signal game_ended(winner_team: Array[Character])

# 初始化
func init_team_battle(player_ids: Array, enemy_ids: Array, mode: BattleMode) -> void

# 回合管理
func start_new_turn() -> void
func decide_turn_order() -> void
func switch_actor() -> void
func should_switch_actor() -> bool
func end_turn() -> void

# 卡牌/武功使用
func use_basic_card(card_instance_id: String, target_id: String = "") -> Dictionary
func use_skill(skill_id: String, card_instance_id: String, target_id: String = "") -> Dictionary

# 目标选择
func get_all_characters() -> Array[Character]
func get_alive_characters(team: String = "") -> Array[Character]
func get_targets_in_range(actor: Character, range: int) -> Array[Character]
func get_actual_distance(actor: Character, target: Character) -> int

# 游戏结束
func check_game_end() -> bool
func end_game() -> void
```

#### DistanceSystem 类

```gdscript
class_name DistanceSystem
extends RefCounted

# 计算物理距离
static func calculate_distance(seat_a: int, seat_b: int, total_seats: int) -> int

# 计算实际距离（跳过死亡角色）
static func calculate_actual_distance(seat_a: int, seat_b: int, characters: Array[Character], total_seats: int) -> int

# 判断敌对关系
static func is_enemy(char_a: Character, char_b: Character, mode: BattleMode) -> bool

# 获取范围内目标
static func get_targets_in_range(actor: Character, range: int, characters: Array[Character], total_seats: int, mode: BattleMode) -> Array[Character]

# 分配座位
static func assign_seats(player_team: Array[Character], enemy_team: Array[Character], mode: BattleMode) -> void

# 计算屏幕位置（圆形布局）
static func get_seat_position(seat_index: int, total_seats: int, center: Vector2, radius: float) -> Vector2
```

#### AIController 类

```gdscript
class_name AIController
extends RefCounted

var game_state: GameState
var decision_delay: float = 0.8

signal action_decided(action: Dictionary)

# 执行回合
func execute_turn(actor: Character) -> void

# 决策
func decide_action(actor: Character) -> Dictionary
func try_skill_action(actor: Character) -> Dictionary
func try_card_action(actor: Character) -> Dictionary

# 目标选择
func select_best_target(actor: Character, enemies: Array[Character]) -> Character
```

### 数据流

```
GameManager (Autoload)
    ├── characters_data: Dictionary
    ├── skills_data: Dictionary
    └── cards_data: Dictionary
         ↓
GameState
    ├── player_team: Array[Character]
    ├── enemy_team: Array[Character]
    ├── current_actor: Character
    └── phase: GamePhase
         ↓
Character
    ├── hand: Array[Card]
    ├── skills: Array[Skill]
    └── passives: Array[Passive]
         ↓
BattleScene (UI层)
    └── 监听 GameState 信号，更新 UI
```

---

## Phase 2 - UI 框架架构

### 场景结构

```
scenes/
├── battle.tscn                    # 战斗主场景
├── components/
│   ├── character_panel.tscn       # 角色面板
│   ├── mini_character_panel.tscn  # 迷你角色面板
│   ├── card.tscn                  # 卡牌
│   ├── skill_button.tscn          # 技能按钮
│   ├── battle_log.tscn            # 战斗日志
│   ├── agility_axis.tscn          # 轻功轴
│   └── tooltip.tscn               # 提示框
└── ui/
    └── battle_ui.tscn             # 战斗 UI 容器
```

### 布局设计

#### 1v1 布局

```
┌──────────────────────────────────────────────────────────────────┐
│  [回合: 1]                    [当前行动: 乔峰]                      │
├──────────────────────────────────────────────────────────────────┤
│  ┌──────────┐                              ┌──────────┐          │
│  │ 玩家面板 │                              │ 敌人面板 │          │
│  │ [立绘]   │         战斗区域              │ [立绘]   │          │
│  │ HP/MP    │                              │ HP/MP    │          │
│  │ 护盾/轻功│                              │ 护盾/轻功│          │
│  └──────────┘                              └──────────┘          │
│  ┌─────────┐                              ┌─────────┐            │
│  │ 轻功轴  │                              │ 战斗日志│            │
│  └─────────┘                              └─────────┘            │
├──────────────────────────────────────────────────────────────────┤
│  [降龙十八掌] [打狗棒法] [醉仙望月步]                               │
├──────────────────────────────────────────────────────────────────┤
│  [卡牌1] [卡牌2] [卡牌3] [卡牌4] [卡牌5]                           │
├──────────────────────────────────────────────────────────────────┤
│                         [结束回合]                                │
└──────────────────────────────────────────────────────────────────┘
```

#### 多人战斗布局 (3v3)

```
┌──────────────────────────────────────────────────────────────────┐
│  玩家队伍（左侧）              敌人队伍（右侧）                      │
│  ┌─────┐ ┌─────┐ ┌─────┐    ┌─────┐ ┌─────┐ ┌─────┐            │
│  │迷你 │ │迷你 │ │迷你 │    │迷你 │ │迷你 │ │迷你 │            │
│  │面板 │ │面板 │ │面板 │    │面板 │ │面板 │ │面板 │            │
│  └─────┘ └─────┘ └─────┘    └─────┘ └─────┘ └─────┘            │
│                    [战斗日志] [轻功轴]                             │
├──────────────────────────────────────────────────────────────────┤
│  [技能按钮区]                                                     │
├──────────────────────────────────────────────────────────────────┤
│  [手牌区域]                                                       │
├──────────────────────────────────────────────────────────────────┤
│  [结束回合]                                                       │
└──────────────────────────────────────────────────────────────────┘
```

### 组件设计

#### CharacterPanel

```gdscript
class_name CharacterPanel
extends Control

@export var character: Character

# 子节点
@onready var portrait: TextureRect
@onready var name_label: Label
@onready var hp_bar: ProgressBar
@onready var mp_bar: ProgressBar
@onready var shield_label: Label
@onready var agility_label: Label
@onready var skill_tags: HBoxContainer

# 状态
var is_targetable: bool = false
var is_targeted: bool = false
var is_current_actor: bool = false

signal clicked()

func setup(char: Character) -> void
func update_display() -> void
func set_targetable(value: bool) -> void
func set_targeted(value: bool) -> void
func show_passive_highlight(passive_id: String) -> void
```

#### Card

```gdscript
class_name CardUI
extends Control

@export var card: Card

# 子节点
@onready var type_icon: TextureRect
@onready var name_label: Label
@onready var damage_label: Label
@onready var shield_label: Label
@onready var agility_cost_label: Label

# 状态
var selected: bool = false
var disabled: bool = false
var playable: bool = true

signal clicked()
signal hovered()

func setup(c: Card) -> void
func set_selected(value: bool) -> void
func set_playable(value: bool) -> void
```

#### SkillButton

```gdscript
class_name SkillButton
extends Button

@export var skill: Skill

# 子节点
@onready var name_label: Label
@onready var mp_cost_label: Label

# 状态
var enabled: bool = true

signal skill_clicked(skill: Skill)

func setup(s: Skill) -> void
func set_enabled(value: bool) -> void
func update_availability(current_mp: int, hand: Array[Card], agility: int) -> void
```

#### AgilityAxis

```gdscript
class_name AgilityAxis
extends Control

# 竖向条形图，显示所有角色的轻功值
var characters: Array[Character] = []
var markers: Dictionary = {}  # character_id -> marker node

func setup(chars: Array[Character]) -> void
func update_display() -> void
func highlight_actor(actor: Character) -> void
```

#### BattleLog

```gdscript
class_name BattleLog
extends ScrollContainer

@onready var log_container: VBoxContainer

func add_message(text: String) -> void
func clear() -> void
func scroll_to_bottom() -> void
```

---

## Phase 3 - 战斗场景整合

### 输入处理系统

```gdscript
class_name BattleInputHandler
extends RefCounted

enum InputState { NONE, SELECTING_CARD, SELECTING_SKILL, SELECTING_TARGET, WAITING_AI }

var current_state: InputState = InputState.NONE
var selected_card: Card = null
var selected_skill: Skill = null

signal action_requested(action: Dictionary)
signal target_selection_started(valid_targets: Array)
signal target_selected(target: Character)

func handle_card_click(card: Card) -> void
func handle_skill_click(skill: Skill) -> void
func handle_target_click(target: Character) -> void
func reset() -> void
```

### 动画系统

```gdscript
class_name BattleAnimator
extends Node

var animation_queue: Array = []
var is_animating: bool = false

signal animation_started()
signal animation_completed()

# 预定义动画
func play_damage_animation(target: CharacterPanel, amount: int) -> void
func play_shield_animation(source: CharacterPanel, amount: int) -> void
func play_heal_animation(target: CharacterPanel, amount: int) -> void
func play_card_play_animation(card: CardUI, target: CharacterPanel) -> void
func play_skill_animation(skill: SkillButton, target: CharacterPanel) -> void
func play_actor_switch_animation(old_actor: CharacterPanel, new_actor: CharacterPanel) -> void

# 队列管理
func queue_animation(anim: Dictionary) -> void
func process_queue() -> void
func execute_animation(anim: Dictionary) -> void
```

### 特效系统

```gdscript
class_name BattleEffects
extends Node2D

# 特效场景
const DAMAGE_NUMBER_SCENE = preload("res://scenes/effects/damage_number.tscn")
const SHIELD_EFFECT_SCENE = preload("res://scenes/effects/shield_effect.tscn")
const HEAL_EFFECT_SCENE = preload("res://scenes/effects/heal_effect.tscn")
const SKILL_EFFECT_SCENE = preload("res://scenes/effects/skill_effect.tscn")

func show_damage_number(position: Vector2, amount: int, is_critical: bool = false) -> void
func show_skill_effect(position: Vector2, skill_id: String) -> void
func show_passive_trigger(character: Character, passive_id: String) -> void
```

### 战斗场景主控制器

```gdscript
class_name BattleScene
extends Control

@onready var game_state: GameState = $GameState
@onready var ui_container: BattleUI = $BattleUI
@onready var input_handler: BattleInputHandler = $InputHandler
@onready var animator: BattleAnimator = $Animator
@onready var effects: BattleEffects = $Effects

func init_battle(player_ids: Array, enemy_ids: Array, mode: String) -> void
func connect_signals() -> void

# 信号处理
func _on_card_played(actor: Character, card: Card, target: Character) -> void
func _on_damage_dealt(target: Character, amount: int) -> void
func _on_action_requested(action: Dictionary) -> void
func _on_animation_completed() -> void
func _on_game_ended(winner_team: Array[Character]) -> void
```

---

## 实现顺序

### Phase 1 实现顺序

1. `types.gd` - 枚举和常量
2. `card.gd` - 卡牌类
3. `skill.gd` - 武功招式类
4. `passive.gd` - 内功类
5. `character.gd` - 扩展角色类
6. `distance_system.gd` - 距离系统
7. `effect_processor.gd` - 效果处理器
8. `game_state.gd` - 游戏状态管理
9. `ai_controller.gd` - AI 控制器

### Phase 2 实现顺序

1. `character_panel.tscn` - 角色面板组件
2. `mini_character_panel.tscn` - 迷你角色面板
3. `card.tscn` - 卡牌组件
4. `skill_button.tscn` - 技能按钮
5. `battle_log.tscn` - 战斗日志
6. `agility_axis.tscn` - 轻功轴
7. `tooltip.tscn` - 提示框
8. `battle_ui.tscn` - UI 容器

### Phase 3 实现顺序

1. `battle_input_handler.gd` - 输入处理
2. `battle_animator.gd` - 动画系统
3. `battle_effects.gd` - 特效系统
4. 特效场景（damage_number, skill_effect 等）
5. `battle_scene.gd` - 主控制器整合
6. 测试和调试

---

## 测试策略

### 单元测试

- Character 类的牌组操作测试
- DistanceSystem 的距离计算测试
- GameState 的回合流程测试
- AIController 的决策逻辑测试

### 集成测试

- 完整战斗流程测试（1v1）
- 多人战斗流程测试（3v3）
- AI 对战测试

### 手动测试

- UI 交互测试
- 动画效果测试
- 性能测试（多人战斗）

---

## 风险和注意事项

1. **数据兼容性** - 确保现有 JSON 数据格式与新代码兼容
2. **信号连接** - 注意信号的生命周期管理，避免内存泄漏
3. **动画队列** - 确保动画按正确顺序执行，避免状态不一致
4. **AI 延迟** - AI 决策需要适当的延迟，让玩家有时间观察
5. **多人布局** - 注意不同屏幕分辨率下的布局适配
