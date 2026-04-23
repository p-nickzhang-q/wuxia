# 战斗系统重构计划 - 第二阶段

## 当前进度 (2026-04-23 17:26)

### 任务完成情况

| 任务 | 状态 | 详情 |
|------|------|------|
| 任务2: Scene 接口类型 | ✅ 完成 | BattleSceneInterface.ts 创建，7处 @ts-expect-error 移除 |
| 任务1: BattleUIManager | ✅ 完成 | 已创建(530行)并集成到 BattleScene，删除旧 UI 方法 |
| 任务3: 事件解绑 | ⏳ 待开始 | - |
| 任务4: 帧率独立 | ⏳ 待开始 | - |
| 任务5: UI拆分 | ⏳ 待开始 | - |
| 任务6: 性能优化 | ⏳ 待开始 | - |

### 最新测试结果

```
Test Files  12 passed (12)
Tests       293 passed (293)
Duration    1.34s
Build       成功 (7.46s)
```

### 任务1 完成详情

**BattleUIManager.ts** (530行):
- createUI(): 创建状态栏、战斗日志、轻功轴、动作按钮
- updateUI(): 更新所有 UI 状态
- updateHandCards(): 手牌显示（拆分为 prepareHandUpdateContext + clearOldCards + renderNewCards + restoreSelectionState）
- updateSkillButtons(): 技能按钮（拆分为 clearOldSkillButtons + prepareSkillUpdateContext + renderSkillButtons）
- updateActionButtons(): 动作按钮状态
- updateStatusBar(): 状态栏
- updateAgilityAxis(): 轻功轴
- syncBattleLog(): 战斗日志同步

**BattleScene.ts 修改**:
- 添加 uiManager 成员
- statusBar, battleLog, agilityAxis 改为 getter 属性（从 uiManager 获取）
- cardRenderers, skillButtons 改为 getter 属性
- createUI() 委托给 uiManager.createUI() + createCharacterPanels()
- updateUI() 委托给 uiManager.updateUI() + 角色面板更新
- updateActionButtons(), updateSkillButtons() 委托给 uiManager
- 删除旧的私有方法：handleCardClick, handleSkillClick, handleConfirm, handleCancel, handleEndTurn, getPhaseText
- 删除旧的成员变量：isFirstHandUpdate, pendingDrawAnimations, confirmButton, cancelButton, endTurnButton

**BattleSceneInterface.ts 更新**:
- 无变化（接口已满足 uiManager 需要）

### BattleScene 行数变化

| 指标 | 修改前 | 修改后 |
|------|--------|--------|
| BattleScene.ts 行数 | ~955 | ~630 |
| 最大方法行数 | 82 | <40 |
| UI 相关方法 | 7个 | 0个（全部委托）|

---

## 状态总结

### 已完成

#### 阶段1: 资源清理与内存安全 ✅
- AudioManager 事件取消订阅
- EffectManager.destroy()
- TweenManager.destroy()
- BattleScene.onExit() 完善

#### 阶段2: 游戏逻辑层拆分 ✅
- Game.useBasicCard → validateBasicCardUse + consumeBasicCardResources + applyBasicCardEffects + finalizeBasicCardUse
- Game.useSkill → validateSkillUse + consumeSkillResources + processSkillEffects + finalizeSkillUse
- Game.processEffect → 11个效果类型子方法
- Character.takeDamage → processDamagePassives + applyShieldAbsorption + applyFinalDamage
- AI.executeTurn → executeActionLoop + finalizeAITurn
- AI.decideAction → buildDecisionContext + trySkillAction + tryDefendAction + getDefaultAction

#### 阶段4: 场景层重构 ✅ (部分完成)
- **BattleInputHandler.ts** (218行) - 输入处理委托
- **BattleAIHandler.ts** (167行) - AI控制委托
- **BattleLayoutManager.ts** (261行) - 布局管理委托

#### 测试覆盖 ✅
- 10个测试文件，216个测试通过
- battleLayout.test.ts、battleUI.test.ts、battleAIHandler.test.ts 新增

---

## 待完成任务

### 任务1: 创建 BattleUIManager

**优先级**: 高
**预估工作量**: 4小时

#### 背景
`BattleScene.ts` 的 `updateUI()` 和 `createUI()` 方法职责混合，包含：
- 状态栏更新
- 角色面板更新
- 轻功轴更新
- 战斗日志同步
- 手牌更新 (82行，超标)
- 技能按钮更新 (62行，超标)
- 动作按钮更新
- 游戏结束检查

#### 实现方案

**文件**: `src/scenes/BattleUIManager.ts`

```typescript
/**
 * 战斗 UI 状态管理器
 * 管理 UI 组件的状态同步和更新
 */
export class BattleUIManager {
  private scene: BattleSceneInterface
  private renderer: Renderer

  // UI 组件引用（从 scene 传递）
  private statusBar: StatusBar | null
  private battleLog: BattleLog | null
  private agilityAxis: VerticalAgilityAxis | null
  private cardRenderers: CardRenderer[]
  private skillButtons: SkillButton[]
  private confirmButton: Button | null
  private cancelButton: Button | null

  constructor(
    scene: BattleSceneInterface,
    renderer: Renderer,
    components: UIComponents
  ) {
    this.scene = scene
    this.renderer = renderer
    this.initComponents(components)
  }

  /**
   * 创建完整 UI
   */
  createUI(): void {
    this.createStatusBar()
    this.createBattleLog()
    this.createAgilityAxis()
    this.createCharacterPanels()
    this.createActionButtons()
  }

  /**
   * 更新所有 UI 状态
   */
  updateUI(): void {
    this.updateStatusBar()
    this.updateCharacterPanels()
    this.updateAgilityAxis()
    this.syncBattleLog()
    this.updateHandCards()      // 迁移 BattleScene.updateHandCards
    this.updateSkillButtons()   // 迁移 BattleScene.updateSkillButtons
    this.updateActionButtons()
    this.checkGameOver()
  }

  // 子方法（每个 <40行）
  private createStatusBar(): void { /* ~15行 */ }
  private createBattleLog(): void { /* ~15行 */ }
  private createAgilityAxis(): void { /* ~15行 */ }
  private createCharacterPanels(): void { /* 调用 layoutManager */ }
  private createActionButtons(): void { /* ~25行 */ }

  private updateStatusBar(): void { /* ~10行 */ }
  private updateCharacterPanels(): void { /* ~10行 */ }
  private updateAgilityAxis(): void { /* ~20行 */ }
  private syncBattleLog(): void { /* ~15行 */ }
  private updateHandCards(): void { /* 拆分为 3 个子方法 */ }
  private updateSkillButtons(): void { /* 拆分为 2 个子方法 */ }
  private updateActionButtons(): void { /* ~15行 */ }
  private checkGameOver(): void { /* 调用 scene.handleGameOver */ }
}
```

#### 拆分 updateHandCards

当前82行 → 拆分为：

```typescript
private updateHandCards(): void {
  const context = this.prepareHandUpdateContext()
  if (!context) return

  this.clearOldCards()
  this.renderNewCards(context)
  this.restoreSelectionState(context.selectedCardId)
}

private prepareHandUpdateContext(): HandUpdateContext | null { /* ~20行 */ }
private clearOldCards(): void { /* ~5行 */ }
private renderNewCards(context: HandUpdateContext): void { /* ~40行 */ }
private restoreSelectionState(cardId: string | null): void { /* ~10行 */ }
```

#### 拆分 updateSkillButtons

当前62行 → 拆分为：

```typescript
private updateSkillButtons(): void {
  this.clearOldSkillButtons()
  
  const context = this.prepareSkillUpdateContext()
  if (!context) return

  this.renderSkillButtons(context)
}

private clearOldSkillButtons(): void { /* ~5行 */ }
private prepareSkillUpdateContext(): SkillUpdateContext | null { /* ~15行 */ }
private renderSkillButtons(context: SkillUpdateContext): void { /* ~30行 */ }
```

#### BattleScene 修改

```typescript
// BattleScene.ts
export class BattleScene extends Scene {
  private uiManager: BattleUIManager | null = null

  private initHandlers(): void {
    this.layoutManager = new BattleLayoutManager(...)
    this.inputHandler = new BattleInputHandler(...)
    this.aiHandler = new BattleAIHandler(...)
    this.uiManager = new BattleUIManager(this, this.renderer, {
      statusBar: this.statusBar,
      battleLog: this.battleLog,
      agilityAxis: this.agilityAxis,
      cardRenderers: this.cardRenderers,
      skillButtons: this.skillButtons,
      confirmButton: this.confirmButton,
      cancelButton: this.cancelButton
    })
  }

  onEnter(): void {
    this.initHandlers()
    this.uiManager?.createUI()
    this.uiManager?.updateUI()
    // ...
  }

  update(_delta: number): void {
    this.aiHandler?.checkAITurn()
  }
}
```

#### 验证步骤
1. 运行 `npm test -- --run` 确保现有测试通过
2. 手动测试完整战斗流程
3. 检查 UI 状态同步正确性
4. 验证窗口 resize 时 UI 重绘

---

### 任务2: 完善 Scene 接口类型

**优先级**: 高
**预估工作量**: 2小时

#### 背景
BattleScene 有4处 `@ts-expect-error` 用于 handler 访问私有成员：
- 行28: `private ai: AI | null = null`
- 行52: `private isAIProcessing: boolean = false`
- 行59: `private pendingSkillId: string | null = null`
- 行61: `private pendingCardId: string | null = null`
- 行731: `private enterTargetSelection`
- 行835: `private executeAction`
- 行882: `private endTurn`

#### 实现方案

**文件**: `src/scenes/types/BattleSceneInterface.ts`

```typescript
/**
 * BattleScene 对 handlers 暴露的接口
 * 包含 handlers 需要访问的所有方法和属性
 */
export interface BattleSceneInterface {
  // Game 状态
  game: ReturnType<typeof import('../game/Game').createGame> | null
  ai: AI | null

  // 状态标记
  isAIProcessing: boolean
  playerConfigs: CharacterState[]
  pendingCardId: string | null
  pendingSkillId: string | null

  // 选择状态
  selectedCard: CardRenderer | null
  selectedSkill: MartialArtSkill | null
  targetableIds: string[]
  selectedTargetId: string | null

  // 渲染组件
  statusBar: StatusBar | null
  battleLog: BattleLog | null
  agilityAxis: VerticalAgilityAxis | null
  characterRenderers: Map<string, CharacterRenderer | MiniCharacterRenderer>

  // 判断方法
  isPlayerControlled: (char: CharacterState) => boolean
  isPlayerTeam: (char: CharacterState) => boolean

  // UI 更新方法
  updateUI: () => void
  updateTargetHighlights: () => void
  updateActionButtons: () => void
  updateSkillButtons: () => void

  // 状态管理方法
  clearSelection: () => void
  clearTargetSelection: () => void
  enterTargetSelection: (skillId: string | null, cardInstanceId: string) => void
  executeAction: (skillId: string | null, cardInstanceId: string | null, targetId: string) => void
  endTurn: () => void

  // 日志和事件
  addLog: (message: string) => void
  handleGameOver: () => void
}
```

#### Handler 修改

```typescript
// BattleInputHandler.ts
import { BattleSceneInterface } from './types/BattleSceneInterface'

export class BattleInputHandler {
  private scene: BattleSceneInterface

  constructor(scene: BattleSceneInterface) {
    this.scene = scene
  }
  // ...
}
```

#### BattleScene 实现

```typescript
// BattleScene.ts
export class BattleScene extends Scene implements BattleSceneInterface {
  // 移除 @ts-expect-error，public 或 protected 访问级别
  public ai: AI | null = null
  public isAIProcessing: boolean = false
  public pendingSkillId: string | null = null
  public pendingCardId: string | null = null

  // 保持 private 的方法通过 interface 暴露
  public enterTargetSelection(skillId: string | null, cardInstanceId: string): void { /* ... */ }
  public executeAction(skillId: string | null, cardInstanceId: string | null, targetId: string): void { /* ... */ }
  public endTurn(): void { /* ... */ }
}
```

---

### 任务3: 修复事件监听器解绑

**优先级**: 中
**预估工作量**: 1小时

#### 背景
当前 `unregisterEventListeners()` 使用 `off()` 但未传入原始回调引用：

```typescript
// 问题代码
eventManager.off(GameEventType.CHARACTER_DAMAGED, this.onCharacterDamaged)
// this.onCharacterDamaged 不是原始绑定的函数（绑定时用了 .bind(this))
```

#### 实现方案

```typescript
// BattleScene.ts
export class BattleScene extends Scene {
  // 存储绑定的回调引用
  private boundOnCharacterDamaged: (event: any) => void
  private boundOnCharacterShield: (event: any) => void
  private boundOnTurnStart: (event: any) => void
  private boundOnCardDrawn: (event: any) => void
  private boundOnPassiveTriggered: (event: any) => void
  private boundHandleResize: () => void

  constructor(renderer: Renderer) {
    super(renderer)
    // 预绑定回调
    this.boundOnCharacterDamaged = this.onCharacterDamaged.bind(this)
    this.boundOnCharacterShield = this.onCharacterShield.bind(this)
    this.boundOnTurnStart = this.onTurnStart.bind(this)
    this.boundOnCardDrawn = this.onCardDrawn.bind(this)
    this.boundOnPassiveTriggered = this.onPassiveTriggered.bind(this)
    this.boundHandleResize = this.handleResize.bind(this)
  }

  private registerEventListeners(): void {
    eventManager.on(GameEventType.CHARACTER_DAMAGED, this.boundOnCharacterDamaged)
    eventManager.on(GameEventType.CHARACTER_SHIELD, this.boundOnCharacterShield)
    eventManager.on(GameEventType.TURN_START, this.boundOnTurnStart)
    eventManager.on(GameEventType.CARD_DRAWN, this.boundOnCardDrawn)
    eventManager.on(GameEventType.PASSIVE_TRIGGERED, this.boundOnPassiveTriggered)
  }

  private unregisterEventListeners(): void {
    eventManager.off(GameEventType.CHARACTER_DAMAGED, this.boundOnCharacterDamaged)
    eventManager.off(GameEventType.CHARACTER_SHIELD, this.boundOnCharacterShield)
    eventManager.off(GameEventType.TURN_START, this.boundOnTurnStart)
    eventManager.off(GameEventType.CARD_DRAWN, this.boundOnCardDrawn)
    eventManager.off(GameEventType.PASSIVE_TRIGGERED, this.boundOnPassiveTriggered)
  }

  onEnter(): void {
    // 使用预绑定的回调
    this.renderer.onResize(this.boundHandleResize)
  }

  onExit(): void {
    this.renderer.offResize(this.boundHandleResize)
    // ...
  }
}
```

---

### 任务4: 帧率独立动画

**优先级**: 中
**预估工作量**: 2小时

#### 背景
多处使用固定 `setTimeout` 延迟而非帧率独立动画：

1. `AI.delay()` - 行281
2. `BattleScene.showTurnNumberEffect()` - 行356-363
3. 抽牌动画 - 行611
4. AI 行动间隔 - 行129

#### 实现方案

**修改 AI.delay()**

```typescript
// AI.ts - 修改为基于帧的延迟
private async delay(ms: number): Promise<void> {
  // 使用 tweenManager 或 requestAnimationFrame
  const frames = ms / 16.67  // 60fps 基准
  let frameCount = 0
  
  return new Promise(resolve => {
    const tick = () => {
      frameCount++
      if (frameCount >= frames) {
        resolve()
      } else {
        requestAnimationFrame(tick)
      }
    }
    requestAnimationFrame(tick)
  })
}
```

**修改 showTurnNumberEffect**

```typescript
// BattleScene.ts
private showTurnNumberEffect(turnNumber: number, x: number, y: number): void {
  const text = new Text(`第${turnNumber}回合`, style)
  text.x = x
  text.y = y
  text.anchor.set(0.5)
  text.alpha = 0
  this.addChild(text)

  // 使用 tweenManager 替代 setTimeout
  tweenManager.create(text, { alpha: 1 }, 200, Easing.easeOutQuad)
  tweenManager.create(text, { scaleX: 1.2, scaleY: 1.2 }, 200, Easing.easeOutBack)

  // 延迟淡出 - 使用 tweenManager 的 delay 功能
  tweenManager.create(text, { alpha: 0 }, 300, Easing.easeOutQuad, {
    delay: 800,
    onComplete: () => this.removeChild(text)
  })
}
```

**修改抽牌动画**

```typescript
// BattleScene.ts 或 BattleUIManager.ts
private renderNewCards(context: HandUpdateContext): void {
  hand.forEach((card, index) => {
    const cardRenderer = new CardRenderer(card, this.renderer)

    if (needsAnimation) {
      cardRenderer.x = deckX
      cardRenderer.y = deckY
      cardRenderer.alpha = 0

      // 使用 tweenManager 的 delay 参数
      tweenManager.create(cardRenderer, { x: cardX, y: cardY, alpha: 1 }, 300, Easing.easeOutQuad, {
        delay: index * 100
      })
    }
    // ...
  })
}
```

---

### 任务5: UIComponents.ts 拆分

**优先级**: 低
**预估工作量**: 3小时

#### 背景
`src/renderer/UIComponents.ts` 当前961行，包含：
- Button
- SkillButton
- BattleLog
- StatusBar
- Tooltip
- AgilityAxis
- VerticalAgilityAxis

#### 实现方案

**目录结构**

```
src/renderer/ui/
  Button.ts          (~95行)
  SkillButton.ts     (~120行)
  BattleLog.ts       (~220行)
  StatusBar.ts       (~45行)
  Tooltip.ts         (~40行)
  AgilityAxis.ts     (~180行)
  VerticalAgilityAxis.ts (~110行)
  index.ts           (导出汇总)
```

**示例: Button.ts**

```typescript
import { Container, Graphics, Text, TextStyle } from 'pixi.js'
import { Renderer, Colors } from '../Renderer'
import { LayoutConstants } from '../LayoutConstants'

export class Button extends Container {
  private background: Graphics
  private label: Text
  private onClick: (() => void) | null = null
  private isDisabled: boolean = false
  private renderer: Renderer

  constructor(text: string, width: number, height: number, renderer: Renderer) {
    super()
    this.renderer = renderer
    this.createBackground(width, height)
    this.createLabel(text, width, height)
    this.setupInteraction()
  }

  private createBackground(width: number, height: number): void { /* ... */ }
  private createLabel(text: string, width: number, height: number): void { /* ... */ }
  private setupInteraction(): void { /* ... */ }

  setOnClick(callback: () => void): void { /* ... */ }
  setDisabled(disabled: boolean): void { /* ... */ }
}
```

**index.ts**

```typescript
export { Button } from './Button'
export { SkillButton } from './SkillButton'
export { BattleLog } from './BattleLog'
export { StatusBar } from './StatusBar'
export { Tooltip } from './Tooltip'
export { AgilityAxis } from './AgilityAxis'
export { VerticalAgilityAxis } from './VerticalAgilityAxis'
```

---

### 任务6: 性能优化

**优先级**: 低
**预估工作量**: 1小时

#### 背景
1. `Game.getAllCharacters()` 每次创建新数组
2. `BattleScene.update()` 每帧调用 `checkAITurn()`

#### 实现方案

**缓存角色数组**

```typescript
// Game.ts
export function createGame(): GameState {
  const state: GameState = {
    // 添加缓存
    _cachedAllCharacters: null as CharacterState[] | null,

    getAllCharacters(): CharacterState[] {
      if (!this._cachedAllCharacters) {
        this._cachedAllCharacters = [...this.playerTeam, ...this.enemyTeam]
      }
      return this._cachedAllCharacters
    },

    // 在角色死亡时清除缓存
    invalidateCharacterCache(): void {
      this._cachedAllCharacters = null
    }
  }
  return state
}
```

**减少 update 开销**

```typescript
// BattleScene.ts
export class BattleScene extends Scene {
  private needsAITurnCheck: boolean = true

  update(_delta: number): void {
    if (this.needsAITurnCheck) {
      this.aiHandler?.checkAITurn()
      this.needsAITurnCheck = false  // AI 处理中不再检查
    }
  }

  // 在 UI 更新后重新标记
  private markNeedsAITurnCheck(): void {
    this.needsAITurnCheck = true
  }
}
```

---

## 执行顺序

```
任务2 (接口类型) ──→ 任务1 (BattleUIManager)
         ↓                    ↓
任务3 (事件解绑) ──→ 任务4 (帧率独立)
                              ↓
                    任务5 (UI拆分) ← 可并行
                              ↓
                    任务6 (性能优化)
```

**建议顺序**: 任务2 → 任务1 → 任务3 → 任务4 → (任务5 + 任务6 并行)

---

## 关键文件路径

| 文件 | 路径 | 当前行数 |
|------|------|----------|
| BattleScene.ts | `/src/scenes/BattleScene.ts` | 955行 |
| BattleInputHandler.ts | `/src/scenes/BattleInputHandler.ts` | 218行 |
| BattleAIHandler.ts | `/src/scenes/BattleAIHandler.ts` | 167行 |
| BattleLayoutManager.ts | `/src/scenes/BattleLayoutManager.ts` | 261行 |
| Game.ts | `/src/game/Game.ts` | 726行 |
| Character.ts | `/src/game/Character.ts` | 355行 |
| AI.ts | `/src/game/AI.ts` | 283行 |
| UIComponents.ts | `/src/renderer/UIComponents.ts` | 961行 |

---

## 验证策略

每个任务完成后：

1. **构建验证**
   ```bash
   npm run build
   ```

2. **测试验证**
   ```bash
   npm test -- --run
   ```

3. **功能验证**
   - 启动游戏 `npm run dev`
   - 选择角色进入战斗
   - 完成一回合战斗流程
   - 检查 UI 状态同步
   - 测试 AI 行动
   - 测试结束回合
   - 测试窗口 resize

4. **内存验证**
   - Chrome DevTools Memory 面板
   - 战斗流程重复5次
   - 检查内存是否持续增长

---

## 完成标准

- 所有方法行数 < 40行
- 无 @ts-expect-error 注释
- 帧率独立动画（无 setTimeout 固定延迟）
- 事件监听器正确解绑
- 216+ 测试通过
- 构建成功无警告

---

## 预期改进

| 指标 | 当前 | 目标 |
|------|------|------|
| BattleScene.ts 行数 | 955 | ~400 |
| 最大方法行数 | 82 | <40 |
| @ts-expect-error 数量 | 7 | 0 |
| setTimeout 固定延迟 | 4处 | 0 |
| 代码质量评级 | C | B |