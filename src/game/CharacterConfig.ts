/**
 * 角色配置类
 * 封装角色数据和属性计算方法
 */
export class CharacterConfig {
  // 基础信息
  id: string
  name: string
  title: string
  description: string
  martialArts: string[]
  deck: string[]

  // 弟子属性（直接决定战斗属性）
  root: number       // 根骨 - 影响 HP (1-10)，默认 5
  insight: number    // 悟性 - 暂不影响战斗 (1-10)，默认 5
  will: number       // 定力 - 影响 MP (1-10)，默认 5
  strength: number   // 臂力 - 影响伤害 (1-10)，默认 5
  agilityBonus: number // 身法 - 影响轻功 (1-10)，默认 5

  // 向后兼容字段（保留但不使用）
  hp?: number
  mp?: number
  agility?: number

  constructor(data: CharacterConfigData) {
    this.id = data.id
    this.name = data.name
    this.title = data.title
    this.description = data.description
    this.martialArts = data.martialArts || []
    this.deck = data.deck || []

    // 弟子属性（未提供则默认 5）
    this.root = data.root ?? 5
    this.insight = data.insight ?? 5
    this.will = data.will ?? 5
    this.strength = data.strength ?? 5
    this.agilityBonus = data.agilityBonus ?? 5

    // 向后兼容字段
    this.hp = data.hp
    this.mp = data.mp
    this.agility = data.agility
  }

  // ==================== 属性计算方法 ====================

  /** 获取最大 HP（根骨 × 10） */
  getMaxHp(): number {
    return this.root * 10
  }

  /** 获取最大 MP（定力 × 3） */
  getMaxMp(): number {
    return this.will * 3
  }

  /** 获取基础轻功（身法 × 2） */
  getBaseAgility(): number {
    return this.agilityBonus * 2
  }

  /** 获取臂力伤害加成倍率（1 + 臂力 × 0.05） */
  getStrengthMultiplier(): number {
    return 1 + this.strength * 0.05
  }

  /** 获取所有计算后的战斗属性 */
  getBattleStats(): { maxHp: number; maxMp: number; baseAgility: number; strengthMultiplier: number } {
    return {
      maxHp: this.getMaxHp(),
      maxMp: this.getMaxMp(),
      baseAgility: this.getBaseAgility(),
      strengthMultiplier: this.getStrengthMultiplier()
    }
  }

  // ==================== 其他方法 ====================

  /** 获取角色完整描述（用于详情显示） */
  getFullDescription(): string {
    return `${this.title} - ${this.description}`
  }

  /** 获取属性显示文本（用于UI） */
  getStatsText(): string {
    return `体力: ${this.getMaxHp()}  内力: ${this.getMaxMp()}  轻功: ${this.getBaseAgility()}`
  }

  /** 获取弟子属性显示文本 */
  getDiscipleStatsText(): string {
    return `根骨:${this.root} 悟性:${this.insight} 定力:${this.will} 臂力:${this.strength} 身法:${this.agilityBonus}`
  }
}

/**
 * 原始数据接口（用于数据文件定义）
 * 与旧的 CharacterConfig 接口兼容
 */
export interface CharacterConfigData {
  id: string
  name: string
  title: string
  description: string
  martialArts?: string[]
  deck?: string[]
  root?: number
  insight?: number
  will?: number
  strength?: number
  agilityBonus?: number
  // 向后兼容
  hp?: number
  mp?: number
  agility?: number
}