import {
  SectorState,
  SectorDisciple,
  SectorDiscipleStatus,
  SectorResources,
  Facility,
  FacilityType,
  Faction,
  DiscipleRealm
} from './types'
import { createDisciple, DiscipleState } from './Disciple'

// ==================== 门派配置 ====================
const SECTOR_CONFIG = {
  initialSilver: 500,
  initialReputation: 50,
  initialResources: { wood: 50, metal: 30, herb: 20 },
  maxDisciples: 10,
  baseDiscipleCapacity: 5
}

// ==================== 门派创建 ====================

/**
 * 生成唯一ID
 */
function generateSectorId(): string {
  return `sector_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
}

/**
 * 创建初始设施列表
 */
function createInitialFacilities(): Facility[] {
  return [
    {
      id: 'facility_training_1',
      name: '练功房',
      type: FacilityType.TRAINING_HALL,
      level: 1,
      capacity: 2,
      occupants: []
    },
    {
      id: 'facility_rest_1',
      name: '休息室',
      type: FacilityType.REST_ROOM,
      level: 1,
      capacity: 3,
      occupants: []
    },
    {
      id: 'facility_library_1',
      name: '藏经阁',
      type: FacilityType.LIBRARY,
      level: 1,
      capacity: 1,
      occupants: []
    }
  ]
}

/**
 * 创建初始弟子（招募3个初始弟子）
 */
function createInitialDisciples(): SectorDisciple[] {
  // 使用默认弟子模板创建3个弟子
  const templateIds = ['disciple_common_1', 'disciple_common_2', 'disciple_common_3']
  const disciples: SectorDisciple[] = []

  for (const templateId of templateIds) {
    try {
      const baseDisciple = createDisciple(templateId)
      const sectorDisciple = toSectorDisciple(baseDisciple)
      sectorDisciple.isRecruited = true
      sectorDisciple.loyalty = 80
      disciples.push(sectorDisciple)
    } catch {
      // 模板不存在时创建默认弟子
      disciples.push(createDefaultSectorDisciple())
    }
  }

  return disciples
}

/**
 * 将 DiscipleState 转换为 SectorDisciple
 */
export function toSectorDisciple(base: DiscipleState): SectorDisciple {
  return {
    ...base,
    vitality: 100,
    maxVitality: 100,
    loyalty: 50,
    status: SectorDiscipleStatus.HEALTHY,
    currentHp: base.maxHp,
    currentMp: base.maxMp
  }
}

/**
 * 创建默认门派弟子（模板不存在时的后备）
 */
function createDefaultSectorDisciple(): SectorDisciple {
  const id = `disciple_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  return {
    id,
    name: '弟子',
    root: 5,
    insight: 5,
    will: 5,
    strength: 5,
    agility: 5,
    maxHp: 75,
    maxMp: 35,
    baseAgility: 20,
    realm: DiscipleRealm.OUTER,
    level: 1,
    exp: 0,
    learnedSkills: [],
    masteredSkills: [],
    equippedSkills: [],
    passiveSkill: null,
    isRecruited: true,
    recruitCost: 100,
    // 门派管理专属
    vitality: 100,
    maxVitality: 100,
    loyalty: 80,
    status: SectorDiscipleStatus.HEALTHY,
    currentHp: 75,
    currentMp: 35
  }
}

/**
 * 创建门派实例
 */
export function createSector(faction: Faction, name?: string): SectorState {
  return {
    id: generateSectorId(),
    name: name || faction,
    faction,

    silver: SECTOR_CONFIG.initialSilver,
    reputation: SECTOR_CONFIG.initialReputation,
    resources: { ...SECTOR_CONFIG.initialResources },

    disciples: createInitialDisciples(),
    maxDisciples: SECTOR_CONFIG.maxDisciples,

    facilities: createInitialFacilities(),

    turn: 1,

    factionRelations: initFactionRelations(faction)
  }
}

/**
 * 初始化门派关系值
 */
function initFactionRelations(playerFaction: Faction): Record<string, number> {
  const relations: Record<string, number> = {}
  const allFactions = Object.values(Faction)

  for (const faction of allFactions) {
    if (faction === playerFaction) {
      relations[faction] = 100  // 自己门派极友好
    } else if (faction === Faction.MOZU) {
      // 魔教与其他门派默认敌对
      relations[faction] = playerFaction === Faction.MOZU ? 50 : -50
    } else if (playerFaction === Faction.MOZU) {
      // 魔教玩家与正派门派默认敌对
      relations[faction] = -50
    } else {
      // 正派之间默认友好
      relations[faction] = 50
    }
  }

  return relations
}

// ==================== 门派管理操作 ====================

/**
 * 添加弟子到门派
 */
export function addDisciple(sector: SectorState, disciple: SectorDisciple): {
  success: boolean
  message: string
  sector: SectorState
} {
  if (sector.disciples.length >= sector.maxDisciples) {
    return { success: false, message: '弟子数量已达上限', sector }
  }

  disciple.isRecruited = true
  sector.disciples.push(disciple)

  return { success: true, message: `${disciple.name} 加入门派`, sector }
}

/**
 * 移除弟子
 */
export function removeDisciple(sector: SectorState, discipleId: string): {
  success: boolean
  message: string
  sector: SectorState
} {
  const index = sector.disciples.findIndex(d => d.id === discipleId)
  if (index === -1) {
    return { success: false, message: '未找到该弟子', sector }
  }

  const disciple = sector.disciples[index]
  sector.disciples.splice(index, 1)

  return { success: true, message: `${disciple.name} 离开门派`, sector }
}

/**
 * 消耗银两
 */
export function spendSilver(sector: SectorState, amount: number): {
  success: boolean
  message: string
  sector: SectorState
} {
  if (sector.silver < amount) {
    return { success: false, message: '银两不足', sector }
  }

  sector.silver -= amount
  return { success: true, message: `消耗 ${amount} 银两`, sector }
}

/**
 * 获得银两
 */
export function gainSilver(sector: SectorState, amount: number): SectorState {
  sector.silver += amount
  return sector
}

/**
 * 消耗资源
 */
export function spendResources(sector: SectorState, resources: Partial<SectorResources>): {
  success: boolean
  message: string
  sector: SectorState
} {
  const { wood = 0, metal = 0, herb = 0 } = resources

  if (sector.resources.wood < wood) {
    return { success: false, message: '木材不足', sector }
  }
  if (sector.resources.metal < metal) {
    return { success: false, message: '金属不足', sector }
  }
  if (sector.resources.herb < herb) {
    return { success: false, message: '药材不足', sector }
  }

  sector.resources.wood -= wood
  sector.resources.metal -= metal
  sector.resources.herb -= herb

  return { success: true, message: '资源消耗成功', sector }
}

/**
 * 获得资源
 */
export function gainResources(sector: SectorState, resources: Partial<SectorResources>): SectorState {
  if (resources.wood) sector.resources.wood += resources.wood
  if (resources.metal) sector.resources.metal += resources.metal
  if (resources.herb) sector.resources.herb += resources.herb
  return sector
}

// ==================== 回合结算 ====================

/**
 * 回合结算
 */
export function endTurn(sector: SectorState): {
  sector: SectorState
  summary: TurnSummary
} {
  const summary: TurnSummary = {
    silverChange: 0,
    reputationChange: 0,
    resourceChanges: { wood: 0, metal: 0, herb: 0 },
    discipleStatusChanges: []
  }

  // 1. 资源收入（基于设施）
  const income = calculateTurnIncome(sector)
  sector.silver += income.silver
  sector.reputation += income.reputation
  summary.silverChange = income.silver
  summary.reputationChange = income.reputation

  // 2. 弟子状态恢复
  for (const disciple of sector.disciples) {
    const changes = recoverDiscipleStatus(disciple)
    if (changes.length > 0) {
      summary.discipleStatusChanges.push({
        discipleId: disciple.id,
        discipleName: disciple.name,
        changes
      })
    }
  }

  // 3. 推进回合
  sector.turn++

  return { sector, summary }
}

/**
 * 回合结算摘要
 */
export interface TurnSummary {
  silverChange: number
  reputationChange: number
  resourceChanges: SectorResources
  discipleStatusChanges: DiscipleStatusChange[]
}

export interface DiscipleStatusChange {
  discipleId: string
  discipleName: string
  changes: string[]
}

/**
 * 计算回合收入
 */
function calculateTurnIncome(sector: SectorState): { silver: number; reputation: number } {
  // 基础收入 + 设施加成
  let silver = 10
  let reputation = 5

  // 设施加成
  for (const facility of sector.facilities) {
    if (facility.type === FacilityType.REST_ROOM && facility.level > 1) {
      silver += facility.level * 5  // 高级休息室增加银两收入
    }
  }

  // 弟子数量加成
  silver += sector.disciples.filter(d => d.status === SectorDiscipleStatus.HEALTHY).length * 2

  return { silver, reputation }
}

/**
 * 恢复弟子状态
 */
function recoverDiscipleStatus(disciple: SectorDisciple): string[] {
  const changes: string[] = []

  // 精力恢复（休息室加成）
  const vitalityRecovery = 20
  if (disciple.vitality < disciple.maxVitality) {
    disciple.vitality = Math.min(disciple.maxVitality, disciple.vitality + vitalityRecovery)
    changes.push(`精力恢复 ${vitalityRecovery}`)
  }

  // HP/MP恢复
  if (disciple.currentHp < disciple.maxHp) {
    const hpRecovery = Math.floor(disciple.maxHp * 0.1)
    disciple.currentHp = Math.min(disciple.maxHp, disciple.currentHp + hpRecovery)
    changes.push(`HP恢复 ${hpRecovery}`)
  }

  if (disciple.currentMp < disciple.maxMp) {
    const mpRecovery = Math.floor(disciple.maxMp * 0.1)
    disciple.currentMp = Math.min(disciple.maxMp, disciple.currentMp + mpRecovery)
    changes.push(`MP恢复 ${mpRecovery}`)
  }

  // 从受伤状态恢复
  if (disciple.status === SectorDiscipleStatus.INJURED && disciple.currentHp >= disciple.maxHp * 0.5) {
    disciple.status = SectorDiscipleStatus.HEALTHY
    changes.push('伤势痊愈')
  }

  // 从休息状态恢复
  if (disciple.status === SectorDiscipleStatus.RESTING) {
    disciple.status = SectorDiscipleStatus.HEALTHY
    changes.push('休息结束')
  }

  return changes
}

// ==================== 设施管理 ====================

/**
 * 升级设施
 */
export function upgradeFacility(sector: SectorState, facilityId: string): {
  success: boolean
  message: string
  sector: SectorState
  cost: number
} {
  const facility = sector.facilities.find(f => f.id === facilityId)
  if (!facility) {
    return { success: false, message: '设施不存在', sector, cost: 0 }
  }

  if (facility.level >= 5) {
    return { success: false, message: '设施已达最高等级', sector, cost: 0 }
  }

  const cost = facility.level * 100
  if (sector.silver < cost) {
    return { success: false, message: '银两不足', sector, cost }
  }

  sector.silver -= cost
  facility.level++
  facility.capacity += 1

  return { success: true, message: `${facility.name} 升级到 ${facility.level} 级`, sector, cost }
}

/**
 * 弟子进入设施
 */
export function enterFacility(sector: SectorState, discipleId: string, facilityId: string): {
  success: boolean
  message: string
  sector: SectorState
} {
  const facility = sector.facilities.find(f => f.id === facilityId)
  if (!facility) {
    return { success: false, message: '设施不存在', sector }
  }

  const disciple = sector.disciples.find(d => d.id === discipleId)
  if (!disciple) {
    return { success: false, message: '弟子不存在', sector }
  }

  if (facility.occupants.length >= facility.capacity) {
    return { success: false, message: '设施容量已满', sector }
  }

  if (facility.occupants.includes(discipleId)) {
    return { success: false, message: '弟子已在设施中', sector }
  }

  facility.occupants.push(discipleId)

  // 根据设施类型设置弟子状态
  switch (facility.type) {
    case FacilityType.TRAINING_HALL:
      disciple.status = SectorDiscipleStatus.TRAINING
      break
    case FacilityType.REST_ROOM:
      disciple.status = SectorDiscipleStatus.RESTING
      break
    default:
      disciple.trainingTask = facilityId
  }

  return { success: true, message: `${disciple.name} 进入 ${facility.name}`, sector }
}

/**
 * 弟子离开设施
 */
export function leaveFacility(sector: SectorState, discipleId: string, facilityId: string): {
  success: boolean
  message: string
  sector: SectorState
} {
  const facility = sector.facilities.find(f => f.id === facilityId)
  if (!facility) {
    return { success: false, message: '设施不存在', sector }
  }

  const disciple = sector.disciples.find(d => d.id === discipleId)
  if (!disciple) {
    return { success: false, message: '弟子不存在', sector }
  }

  const index = facility.occupants.indexOf(discipleId)
  if (index === -1) {
    return { success: false, message: '弟子不在该设施中', sector }
  }

  facility.occupants.splice(index, 1)
  disciple.status = SectorDiscipleStatus.HEALTHY
  disciple.trainingTask = undefined

  return { success: true, message: `${disciple.name} 离开 ${facility.name}`, sector }
}