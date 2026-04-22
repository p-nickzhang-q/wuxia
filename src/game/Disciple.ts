import { DiscipleState, DiscipleRealm } from './types'

// 重新导出类型，方便使用
export type { DiscipleState }
import { discipleTemplates, realmConfig } from '../data/disciples'

// ==================== 属性成长公式 ====================

/**
 * 根据根骨计算属性成长倍率
 * root 1-10，成长倍率 0.8-1.5
 */
export function getGrowthMultiplier(root: number): number {
  return 0.8 + (root - 1) * 0.075  // 0.8 + (root-1) * 0.075
}

/**
 * 根据境界计算基础属性加成
 */
export function getRealmBonus(realm: DiscipleRealm): number {
  const bonuses: Record<DiscipleRealm, number> = {
    [DiscipleRealm.OUTER]: 0,
    [DiscipleRealm.INNER]: 0.2,
    [DiscipleRealm.DISCIPLE]: 0.4,
    [DiscipleRealm.ELDER]: 0.6
  }
  return bonuses[realm]
}

/**
 * 计算初始最大HP
 * baseHP = 50 + strength * 5
 * realmBonus = baseHP * realmBonusMultiplier
 */
export function calculateMaxHp(strength: number, realm: DiscipleRealm): number {
  const baseHp = 50 + strength * 5
  const realmBonus = getRealmBonus(realm)
  return Math.floor(baseHp * (1 + realmBonus))
}

/**
 * 计算初始最大MP
 * baseMP = 20 + will * 3
 */
export function calculateMaxMp(will: number, realm: DiscipleRealm): number {
  const baseMp = 20 + will * 3
  const realmBonus = getRealmBonus(realm)
  return Math.floor(baseMp * (1 + realmBonus))
}

/**
 * 计算基础轻功值
 * baseAgility = 10 + agility * 2
 */
export function calculateBaseAgility(agility: number, realm: DiscipleRealm): number {
  const baseAgility = 10 + agility * 2
  const realmBonus = getRealmBonus(realm)
  return Math.floor(baseAgility * (1 + realmBonus))
}

// ==================== 弟子创建 ====================

/**
 * 在范围内随机生成属性值
 */
function randomInRange(range: [number, number]): number {
  return Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]
}

/**
 * 生成唯一ID
 */
function generateId(templateId: string): string {
  return `${templateId}_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
}

/**
 * 创建弟子实例
 */
export function createDisciple(templateId: string): DiscipleState {
  const template = discipleTemplates[templateId]
  if (!template) {
    throw new Error(`Disciple template not found: ${templateId}`)
  }

  // 随机生成属性值
  const root = randomInRange(template.rootRange)
  const insight = randomInRange(template.insightRange)
  const will = randomInRange(template.willRange)
  const strength = randomInRange(template.strengthRange)
  const agility = randomInRange(template.agilityRange)

  // 初始境界为外门弟子
  const realm = DiscipleRealm.OUTER

  // 计算战斗属性
  const maxHp = calculateMaxHp(strength, realm)
  const maxMp = calculateMaxMp(will, realm)
  const baseAgility = calculateBaseAgility(agility, realm)

  return {
    id: generateId(templateId),
    name: template.name,

    // 基础属性
    root,
    insight,
    will,
    strength,
    agility,

    // 战斗属性
    maxHp,
    maxMp,
    baseAgility,

    // 境界与等级
    realm,
    level: 1,
    exp: 0,

    // 武功掌握
    learnedSkills: [],
    masteredSkills: [],
    equippedSkills: [],
    passiveSkill: null,

    // 状态
    isRecruited: false,
    recruitCost: template.recruitCost
  }
}

/**
 * 招募弟子
 */
export function recruitDisciple(disciple: DiscipleState): DiscipleState {
  // 标记为已招募，不自动赋予武功
  disciple.isRecruited = true

  return disciple
}

/**
 * 弟子获得经验
 */
export function gainExperience(disciple: DiscipleState, expGain: number): {
  disciple: DiscipleState
  levelUp: boolean
  canBreakthrough: boolean
} {
  const config = realmConfig[disciple.realm]
  disciple.exp += expGain

  let levelUp = false
  let canBreakthrough = false

  // 检查升级
  while (disciple.exp >= config.expToNextLevel && disciple.level < config.maxLevel) {
    disciple.exp -= config.expToNextLevel
    disciple.level++
    levelUp = true

    // 升级时提升属性
    const growthMultiplier = getGrowthMultiplier(disciple.root)
    disciple.maxHp = Math.floor(disciple.maxHp + disciple.strength * growthMultiplier)
    disciple.maxMp = Math.floor(disciple.maxMp + disciple.will * growthMultiplier)
    disciple.baseAgility = Math.floor(disciple.baseAgility + disciple.agility * growthMultiplier * 0.5)
  }

  // 检查是否可以突破境界
  if (disciple.level >= config.maxLevel && disciple.realm !== DiscipleRealm.ELDER) {
    canBreakthrough = true
  }

  return { disciple, levelUp, canBreakthrough }
}

/**
 * 境界突破
 */
export function breakthroughRealm(disciple: DiscipleState): {
  success: boolean
  message: string
  disciple: DiscipleState
} {
  const config = realmConfig[disciple.realm]

  // 检查是否可以突破
  if (disciple.realm === DiscipleRealm.ELDER) {
    return { success: false, message: '已是最高境界', disciple }
  }

  if (disciple.level < config.maxLevel) {
    return { success: false, message: `需要先达到 ${config.maxLevel} 级`, disciple }
  }

  // 提升境界
  const realmOrder = [DiscipleRealm.OUTER, DiscipleRealm.INNER, DiscipleRealm.DISCIPLE, DiscipleRealm.ELDER]
  const currentIndex = realmOrder.indexOf(disciple.realm)
  disciple.realm = realmOrder[currentIndex + 1]
  disciple.level = 1
  disciple.exp = 0

  // 重新计算战斗属性
  disciple.maxHp = calculateMaxHp(disciple.strength, disciple.realm)
  disciple.maxMp = calculateMaxMp(disciple.will, disciple.realm)
  disciple.baseAgility = calculateBaseAgility(disciple.agility, disciple.realm)

  return {
    success: true,
    message: `突破成功！晋升为${disciple.realm}`,
    disciple
  }
}

/**
 * 学习武功招式
 */
export function learnSkill(disciple: DiscipleState, skillId: string): {
  success: boolean
  message: string
} {
  if (disciple.learnedSkills.includes(skillId)) {
    return { success: false, message: '已经学会此武功招式' }
  }

  const config = realmConfig[disciple.realm]
  if (disciple.learnedSkills.length >= config.skillSlots * 3) {
    return { success: false, message: '已达到武功招式学习上限' }
  }

  disciple.learnedSkills.push(skillId)
  return { success: true, message: `学会了新武功招式` }
}

/**
 * 精通武功招式
 */
export function masterSkill(disciple: DiscipleState, skillId: string): {
  success: boolean
  message: string
} {
  if (!disciple.learnedSkills.includes(skillId)) {
    return { success: false, message: '尚未学会此武功招式' }
  }

  if (disciple.masteredSkills.includes(skillId)) {
    return { success: false, message: '已经精通此武功招式' }
  }

  disciple.masteredSkills.push(skillId)
  return { success: true, message: `武功招式已精通！效果提升 20%` }
}

/**
 * 装备武功招式
 */
export function equipSkill(disciple: DiscipleState, skillId: string): {
  success: boolean
  message: string
} {
  if (!disciple.learnedSkills.includes(skillId)) {
    return { success: false, message: '尚未学会此武功招式' }
  }

  const config = realmConfig[disciple.realm]
  if (disciple.equippedSkills.length >= config.skillSlots && !disciple.equippedSkills.includes(skillId)) {
    return { success: false, message: `当前境界只能装备 ${config.skillSlots} 个武功招式` }
  }

  // 如果已经装备，先移除再添加
  const index = disciple.equippedSkills.indexOf(skillId)
  if (index !== -1) {
    disciple.equippedSkills.splice(index, 1)
  }
  disciple.equippedSkills.push(skillId)
  return { success: true, message: `已装备武功招式` }
}