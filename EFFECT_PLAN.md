# 特效动画实现计划

> 基于 PixiJS 8 + TweenManager 的武侠卡牌对战游戏特效增强方案

---

## 一、现有架构分析

### 已有能力
| 模块 | 文件 | 能力 |
|------|------|------|
| TweenManager | `src/utils/TweenManager.ts` | 完整的 Tween 动画系统，支持多种缓动函数 |
| EventManager | `src/utils/EventManager.ts` | 事件驱动架构，可用于动画触发解耦 |
| CardRenderer | `src/renderer/CardRenderer.ts` | 已有攻击动画、弃牌动画 |
| CharacterRenderer | `src/renderer/CharacterRenderer.ts` | 角色面板渲染，无动画 |
| UIComponents | `src/renderer/UIComponents.ts` | UI组件，无动画 |

### 已有动画预设
- `fadeIn/fadeOut` - 淡入淡出 (300ms)
- `moveTo` - 移动动画
- `scaleTo` - 缩放动画
- `shake` - 震动效果 (已实现但未使用)
- `bounce` - 弹跳效果

---

## 二、特效实现计划

### Phase 1: 核心战斗反馈 (高优先级)

#### 1.1 伤害数字弹出
**目标**: 受到伤害时显示飘动的伤害数字

**实现位置**:
- `src/renderer/EffectManager.ts` (新建)
- `src/scenes/BattleScene.ts` (调用)

**技术方案**:
```typescript
// EffectManager.ts
showDamageNumber(damage: number, x: number, y: number, isShield?: boolean) {
  const text = new Text({
    text: `-${damage}`,
    style: { fill: isShield ? 0x4a9e4a : 0xe63946, fontSize: 24, fontWeight: 'bold' }
  })
  text.x = x
  text.y = y
  this.addChild(text)

  // 向上飘出 + 淡出
  tweenManager.moveTo(text, x, y - 60, 800)
  tweenManager.fadeOut(text, 800)
}
```

**触发时机**: `Game.ts` 中 `takeDamage()` 后，通过 EventManager 发出事件

---

#### 1.2 角色受伤震动
**目标**: 受到伤害时角色面板震动 + HP条闪红

**实现位置**:
- `src/renderer/EffectManager.ts`
- `src/renderer/CharacterRenderer.ts` (添加 HP 条闪烁方法)

**技术方案**:
```typescript
// EffectManager.ts
async playDamageEffect(target: CharacterRenderer, damage: number) {
  // 1. 角色面板震动
  await tweenManager.shake(target, 10, 300)

  // 2. HP 条闪红
  target.flashHPBar(0xe63946, 200)  // 红色闪烁

  // 3. 伤害数字弹出
  this.showDamageNumber(damage, target.x + 50, target.y)
}
```

---

#### 1.3 回合开始特效
**目标**: 回合开始时有仪式感

**实现位置**:
- `src/renderer/EffectManager.ts`
- `src/scenes/BattleScene.ts`

**技术方案**:
```typescript
// EffectManager.ts
async playTurnStartEffect(turnNumber: number) {
  // 1. "回合 X" 数字放大弹出
  const turnText = new Text({ text: `回合 ${turnNumber}`, style: turnStyle })
  turnText.scale.set(0.5)
  this.addChild(turnText)

  await tweenManager.scaleTo(turnText, 1.2, 200)  // 放大到 1.2
  await tweenManager.scaleTo(turnText, 1.0, 100)  // 回弹到 1.0
  await this.delay(300)
  await tweenManager.fadeOut(turnText, 300)

  // 2. 轻功轴标记初始化动画（从中间向两侧展开）
  // 由 AgilityAxis 组件处理
}
```

---

#### 1.4 护盾生成/吸收特效
**目标**: 护盾变化时有明确的视觉反馈

**实现位置**:
- `src/renderer/EffectManager.ts`
- `src/renderer/CharacterRenderer.ts`

**技术方案**:
```typescript
// EffectManager.ts
async playShieldEffect(target: CharacterRenderer, shieldChange: number) {
  // 1. 护盾数字弹出（绿色）
  this.showDamageNumber(Math.abs(shieldChange), target.x + 50, target.y, true)

  // 2. 护盾屏障闪烁
  target.flashShieldBar(0x4a9e4a, 200)

  // 3. 如果是生成护盾，添加光环效果
  if (shieldChange > 0) {
    this.playShieldAuraEffect(target)
  }
}
```

---

### Phase 2: 体验增强 (中优先级)

#### 2.1 抽牌动画
**目标**: 卡牌从牌堆位置飞入手牌区域

**实现位置**:
- `src/renderer/CardRenderer.ts`
- `src/scenes/BattleScene.ts`

**技术方案**:
```typescript
// BattleScene.ts
async playDrawCardAnimation(card: CardRenderer, startX: number, startY: number) {
  // 从牌堆位置飞到手牌位置
  card.x = startX
  card.y = startY
  card.alpha = 0

  await tweenManager.fadeIn(card, 200)
  await card.animateTo(targetX, targetY, 300)
}
```

---

#### 2.2 内功触发特效
**目标**: 内功被动触发时有明确的视觉提示

**实现位置**:
- `src/renderer/EffectManager.ts`
- `src/renderer/CharacterRenderer.ts`

**技术方案**:
```typescript
// EffectManager.ts
async playPassiveTriggerEffect(target: CharacterRenderer, passiveName: string, effectDesc: string) {
  // 1. 角色光环闪烁（按内功类型变色）
  target.playAuraFlash(passiveTypeColorMap[passiveType], 300)

  // 2. 效果名称提示（如 "北冥神功 吸血 +5"）
  this.showFloatingText(`${passiveName} ${effectDesc}`, target.x, target.y - 30)
}
```

---

#### 2.3 HP/MP 进度条平滑过渡
**目标**: 数值变化时平滑过渡而非即时变化

**实现位置**:
- `src/renderer/CharacterRenderer.ts`

**技术方案**:
```typescript
// CharacterRenderer.ts
updateHP(newValue: number, oldValue: number) {
  // 计算目标宽度
  const targetWidth = (newValue / this.maxHP) * this.hpBarWidth

  // Tween 动画过渡
  tweenManager.create(this.hpBar, { width: targetWidth }, 300)
}
```

---

#### 2.4 轻功轴标记平滑移动
**目标**: 行动切换时标记平滑滑动

**实现位置**:
- `src/renderer/UIComponents.ts` (AgilityAxis)

**技术方案**:
```typescript
// AgilityAxis.ts (提取为独立文件)
updatePosition(newX: number) {
  // 当前跳跃改为平滑滑动
  tweenManager.moveTo(this.currentActorMarker, newX, this.markerY, 200)
}
```

---

### Phase 3: 细节打磨 (低优先级)

#### 3.1 卡牌悬停效果
**目标**: 鼠标悬停时轻微放大 + 边框发光

**实现位置**:
- `src/renderer/CardRenderer.ts`

**技术方案**:
```typescript
// CardRenderer.ts
onPointerOver() {
  tweenManager.scaleTo(this, 1.05, 150)  // 放大 5%
  this.showGlowBorder(0xffd700)  // 金色发光边框
}

onPointerOut() {
  tweenManager.scaleTo(this, 1.0, 150)
  this.hideGlowBorder()
}
```

---

#### 3.2 战斗日志新消息滑入
**目标**: 新消息从右侧滑入

**实现位置**:
- `src/renderer/UIComponents.ts` (BattleLog)

**技术方案**:
```typescript
// BattleLog.ts
addLog(message: string) {
  const logText = new Text({ text: message })
  logText.x = this.width + 50  // 从右侧开始
  this.addChild(logText)

  tweenManager.moveTo(logText, 0, logText.y, 200)
}
```

---

#### 3.3 角色死亡特效
**目标**: 游戏结束时的仪式感

**实现位置**:
- `src/renderer/EffectManager.ts`
- `src/scenes/BattleScene.ts`

**技术方案**:
```typescript
// EffectManager.ts
async playGameOverEffect(winner: CharacterRenderer, loser: CharacterRenderer) {
  // 1. 背景变暗
  this.dimBackground(0.3, 300)

  // 2. 败方角色淡出
  await tweenManager.fadeOut(loser, 500)

  // 3. 胜负大字弹出
  this.showResultText("胜", winner.x, winner.y)
  this.showResultText("败", loser.x, loser.y)
}
```

---

#### 3.4 武功招式使用特效 (最后实现)
**目标**: 使用武功招式时有"大招"的视觉冲击感

**实现位置**:
- `src/renderer/EffectManager.ts`
- `src/scenes/BattleScene.ts`

**技术方案**:
```typescript
// EffectManager.ts
async playSkillEffect(skillName: string, fromPos: Point, toPos: Point) {
  // 1. 技能名称闪光显示
  const skillText = this.showSkillName(skillName)

  // 2. 能量线从攻击方飞向目标
  await this.playEnergyBeam(fromPos, toPos, 400)

  // 3. 目标处爆炸效果
  await this.playImpactEffect(toPos, 200)

  // 4. 屏幕边缘短暂闪光
  this.flashScreenEdge(0xffd700, 100)  // 金色闪光
}
```

**效果拆解**:
| 效果 | 描述 | 时长 |
|------|------|------|
| 技能名称显示 | 金色大字居中显示，放大淡出 | 500ms |
| 能量线 | 从攻击方射向目标的粒子线/渐变线 | 400ms |
| 爆炸效果 | 目标位置的扩散圆环 | 200ms |
| 屏幕闪光 | 整个屏幕边缘金色闪光 | 100ms |

---

## 三、新文件结构

### 3.1 EffectManager.ts (新建)
```
src/utils/EffectManager.ts
├── showDamageNumber(damage, x, y, isShield)
├── playDamageEffect(target, damage)
├── playSkillEffect(skillName, fromPos, toPos)
├── playTurnStartEffect(turnNumber)
├── playShieldEffect(target, shieldChange)
├── playPassiveTriggerEffect(target, passiveName, effectDesc)
├── playGameOverEffect(winner, loser)
├── showSkillName(skillName)
├── playEnergyBeam(from, to)
├── playImpactEffect(pos)
├── flashScreenEdge(color, duration)
├── showFloatingText(text, x, y)
└── showResultText(text, x, y)
```

### 3.2 AgilityAxis.ts (提取)
将 `UIComponents.ts` 中的 `AgilityAxis` 提取为独立文件，便于添加动画

---

## 四、事件驱动架构

### 4.1 新增事件类型
```typescript
// types.ts 扩展 GameEventType
enum GameEventType {
  DAMAGE_DEALT,       // 造成伤害
  DAMAGE_TAKEN,       // 受到伤害
  SHIELD_CHANGED,     // 护盾变化
  SKILL_USED,         // 使用武功招式
  PASSIVE_TRIGGERED,  // 内功触发
  TURN_STARTED,       // 回合开始
  TURN_SWITCHED,      // 行动切换
  CARD_DRAWN,         // 抽牌
  GAME_OVER           // 游戏结束
}
```

### 4.2 事件触发流程
```
Game.ts                    EventManager              BattleScene.ts
   │                           │                          │
   │ useSkill()                │                          │
   ├─emit(SKILL_USED)─────────►│                          │
   │                           ├─dispatch────────────────►│
   │                           │                          ├─playSkillEffect()
   │                           │                          │
```

---

## 五、实现顺序

### Week 1: Phase 1 核心战斗反馈
1. 创建 EffectManager.ts 基础框架
2. 实现伤害数字弹出
3. 实现角色受伤震动 + HP闪红

### Week 2: Phase 1 完善 + Phase 2 开始
1. 实现回合开始特效
2. 实现护盾特效
3. 开始 Phase 2: 抽牌动画
4. 内功触发特效

### Week 3: Phase 2 + Phase 3
1. HP/MP 平滑过渡
2. 轻功轴平滑移动
3. Phase 3: 卡牌悬停、战斗日志、角色死亡
4. **最后**: 武功招式特效（能量线 + 爆炸效果 + 屏幕闪光）

---

## 六、技术要点

### 6.1 性能优化
- 特效对象完成后及时 `removeChild()` 清理
- 使用 `ObjectPool` 复用粒子/文字对象
- 特效时长控制在 200-500ms，不阻塞游戏流程

### 6.2 可配置化
```typescript
// EffectConfig.ts
export const EFFECT_CONFIG = {
  DAMAGE_NUMBER_DURATION: 800,
  SHAKE_INTENSITY: 10,
  SHAKE_DURATION: 300,
  SKILL_FLASH_COLOR: 0xffd700,
  HP_FLASH_COLOR: 0xe63946,
  SHIELD_FLASH_COLOR: 0x4a9e4a,
}
```

### 6.3 响应式适配
- 所有特效位置使用相对坐标
- 基于 `LayoutConstants` 的 scale 缩放

---

## 七、参考效果

### 武侠风格配色建议
| 效果类型 | 颜色 | 说明 |
|----------|------|------|
| 伤害 | #E63946 | 鲜红 |
| 护盾 | #4A9E4A | 青绿 |
| 武功招式 | #FFD700 | 金色 |
| 内功触发 | #9B59B6 | 紫色（玄妙感） |
| 回合提示 | #3498DB | 天蓝 |

---

## 八、验收标准

### Phase 1 完成标志
- 受到伤害能看到飘动的红色数字
- 角色受伤时面板震动
- 回合开始有数字动画提示
- 护盾变化有绿色数字弹出

### Phase 2 完成标志
- 抽牌有飞入动画
- 内功触发有文字提示
- HP/MP 条变化平滑
- 轻功轴标记平滑滑动

### Phase 3 完成标志
- 卡牌悬停有微动效果
- 战斗日志新消息有滑入动画
- 游戏结束有胜负特效
- **最后完成**: 武功招式使用有能量线 + 爆炸 + 屏幕闪光