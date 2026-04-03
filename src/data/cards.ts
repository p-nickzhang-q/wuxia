import { CardType, BasicCardTemplate, Card } from '../game/types'

// 基础招式卡牌数据
export const basicCards: Record<string, BasicCardTemplate> = {
  // 空手类 (攻击距离: 1)
  fist: {
    id: 'fist',
    name: '拳击',
    type: CardType.EMPTY_HAND,
    baseDamage: 2,
    baseShield: 0,
    agilityCost: 2,
    range: 1,
    description: '造成2点伤害'
  },
  palm: {
    id: 'palm',
    name: '掌击',
    type: CardType.EMPTY_HAND,
    baseDamage: 3,
    baseShield: 0,
    agilityCost: 3,
    range: 1,
    description: '造成3点伤害'
  },
  elbow: {
    id: 'elbow',
    name: '肘击',
    type: CardType.EMPTY_HAND,
    baseDamage: 4,
    baseShield: 0,
    agilityCost: 4,
    selfDamage: 1,
    range: 1,
    description: '造成4点伤害，自身受1点反伤'
  },

  // 短兵类 (攻击距离: 2)
  stab: {
    id: 'stab',
    name: '刺击',
    type: CardType.SHORT_WEAPON,
    baseDamage: 3,
    baseShield: 0,
    agilityCost: 2,
    range: 2,
    description: '造成3点伤害'
  },
  slash: {
    id: 'slash',
    name: '挥砍',
    type: CardType.SHORT_WEAPON,
    baseDamage: 4,
    baseShield: 0,
    agilityCost: 3,
    range: 2,
    description: '造成4点伤害'
  },
  parry: {
    id: 'parry',
    name: '格挡',
    type: CardType.SHORT_WEAPON,
    baseDamage: 0,
    baseShield: 2,
    agilityCost: 2,
    range: 2,
    description: '获得2点护盾'
  },

  // 长兵类 (攻击距离: 3)
  sweep: {
    id: 'sweep',
    name: '横扫',
    type: CardType.LONG_WEAPON,
    baseDamage: 4,
    baseShield: 0,
    agilityCost: 3,
    range: 3,
    description: '造成4点伤害'
  },
  thrust: {
    id: 'thrust',
    name: '直刺',
    type: CardType.LONG_WEAPON,
    baseDamage: 5,
    baseShield: 0,
    agilityCost: 4,
    range: 3,
    description: '造成5点伤害'
  },
  stance: {
    id: 'stance',
    name: '架势',
    type: CardType.LONG_WEAPON,
    baseDamage: 0,
    baseShield: 3,
    agilityCost: 3,
    range: 3,
    description: '获得3点护盾'
  },

  // 腿法类 (攻击距离: 1)
  frontKick: {
    id: 'frontKick',
    name: '前踢',
    type: CardType.LEG,
    baseDamage: 3,
    baseShield: 0,
    agilityCost: 2,
    range: 1,
    description: '造成3点伤害'
  },
  sweepKick: {
    id: 'sweepKick',
    name: '扫腿',
    type: CardType.LEG,
    baseDamage: 4,
    baseShield: 0,
    agilityCost: 3,
    range: 1,
    description: '造成4点伤害'
  },
  jumpKick: {
    id: 'jumpKick',
    name: '跃击',
    type: CardType.LEG,
    baseDamage: 5,
    baseShield: 0,
    agilityCost: 4,
    range: 1,
    description: '造成5点伤害'
  }
}

// 创建基础招式卡牌实例
export function createBasicCard(cardId: string, instanceId?: string): Card | null {
  const template = basicCards[cardId]
  if (!template) return null
  return {
    ...template,
    instanceId: instanceId || `${cardId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    isBasicCard: true
  }
}

// 重新导出 CardType 以便其他模块使用
export { CardType } from '../game/types'