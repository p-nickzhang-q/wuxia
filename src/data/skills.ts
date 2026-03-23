import { CardType, TriggerTiming, MartialArtSkill, PassiveSkill, MartialArt, CharacterConfig, CharacterState, PassiveEffectResult } from '../game/types'

// ==================== 武功招式数据 ====================
export const martialArtSkills: Record<string, MartialArtSkill> = {
  // ========== 空手类武功招式 ==========
  dragonPalm: {
    id: 'dragonPalm',
    name: '降龙十八掌',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 10 }],
    description: '造成10点伤害'
  },
  sixMeridianSword: {
    id: 'sixMeridianSword',
    name: '六脉神剑',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 12, ignoreShield: true }],
    description: '造成12点伤害，无视护盾'
  },
  tianShanZheMei: {
    id: 'tianShanZheMei',
    name: '天山折梅手',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 7 }, { type: 'followUp' }],
    description: '造成7点伤害，可追击一次'
  },
  tianShanLiuYang: {
    id: 'tianShanLiuYang',
    name: '天山六阳掌',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8 }],
    description: '造成8点伤害'
  },
  kongMing: {
    id: 'kongMing',
    name: '空明拳',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5 }, { type: 'shield', value: 3 }],
    description: '造成5点伤害，获得3点护盾'
  },
  luoYing: {
    id: 'luoYing',
    name: '落英神剑掌',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 6 }, { type: 'damage', value: 6 }],
    description: '造成6点伤害×2'
  },
  lanHua: {
    id: 'lanHua',
    name: '兰花拂穴手',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 4 }, { type: 'debuffAgility', value: 3, duration: 1 }],
    description: '造成4点伤害，对方下回合轻功-3'
  },
  haMa: {
    id: 'haMa',
    name: '蛤蟆功',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 12 }],
    description: '造成12点伤害（需蓄力）'
  },
  tanZhi: {
    id: 'tanZhi',
    name: '弹指神通',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5, ignoreShield: true }],
    description: '造成5点伤害，无视护盾'
  },
  anRan: {
    id: 'anRan',
    name: '黯然销魂掌',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 11 }],
    description: '造成11点伤害（体力低于50%时伤害+50%）'
  },
  sevenInjury: {
    id: 'sevenInjury',
    name: '七伤拳',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8 }, { type: 'selfDamage', value: 2 }],
    description: '造成8点伤害，自身失去2点体力'
  },
  taiChiSkill: {
    id: 'taiChiSkill',
    name: '太极拳',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5 }, { type: 'shield', value: 4 }],
    description: '造成5点伤害，获得4点护盾'
  },
  huoYan: {
    id: 'huoYan',
    name: '火焰刀',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9, ignoreShield: true }],
    description: '造成9点伤害，无视护盾'
  },
  shenZhao: {
    id: 'shenZhao',
    name: '神照经掌',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 7 }],
    description: '造成7点伤害，恢复3点体力'
  },
  taiXuan: {
    id: 'taiXuan',
    name: '太玄经',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 12 }],
    description: '造成12点伤害'
  },
  longXiang: {
    id: 'longXiang',
    name: '龙象般若功',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 12 }],
    description: '造成12点伤害'
  },
  oneYang: {
    id: 'oneYang',
    name: '一阳指',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 8, ignoreShield: true }],
    description: '造成8点伤害，无视护盾'
  },

  // ========== 短兵类武功招式 ==========
  nineSwords: {
    id: 'nineSwords',
    name: '独孤九剑',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9, ignoreShield: true }],
    description: '造成9点伤害，无视护盾'
  },
  yuNu: {
    id: 'yuNu',
    name: '玉女剑法',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 7 }],
    description: '造成7点伤害'
  },
  shuangJian: {
    id: 'shuangJian',
    name: '双剑合璧',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 6,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 14 }],
    description: '造成14点伤害（需2张短兵牌）'
  },
  taiJiJian: {
    id: 'taiJiJian',
    name: '太极剑',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 6 }, { type: 'shield', value: 3 }],
    description: '造成6点伤害，获得3点护盾'
  },
  goldenSnake: {
    id: 'goldenSnake',
    name: '金蛇剑法',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 7 }, { type: 'debuffAgility', value: 3, duration: 1 }],
    description: '造成7点伤害，对方下回合轻功-3'
  },
  goldenSnakeZhui: {
    id: 'goldenSnakeZhui',
    name: '金蛇锥',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8, ignoreShield: true }],
    description: '造成8点伤害，无视护盾'
  },
  kuiHua: {
    id: 'kuiHua',
    name: '葵花宝典',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 7 }, { type: 'extraAction' }],
    description: '造成7点伤害，可再行动一次'
  },

  // ========== 长兵类武功招式 ==========
  dogBeating: {
    id: 'dogBeating',
    name: '打狗棒法',
    requiredCardType: CardType.LONG_WEAPON,
    mpCost: 4,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 7 }, { type: 'disableCardType', cardType: CardType.LEG, duration: 1 }],
    description: '造成7点伤害，对方下回合无法使用腿法'
  },
  xuanTie: {
    id: 'xuanTie',
    name: '玄铁剑法',
    requiredCardType: CardType.LONG_WEAPON,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9, ignoreShield: true }],
    description: '造成9点伤害，无视护盾'
  },

  // ========== 特殊武功招式（任意类型手牌）==========
  lifeDeath: {
    id: 'lifeDeath',
    name: '生死符',
    requiredCardType: 'any',
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'dot', value: 3, duration: 3 }],
    description: '对方每回合失去3点体力，持续3回合'
  },
  northernMingSkill: {
    id: 'northernMingSkill',
    name: '北冥神功',
    requiredCardType: 'any',
    mpCost: 0,
    agilityCost: 3,
    effects: [{ type: 'drainMp', value: 6 }],
    description: '吸取对方6点内力'
  },
  starAbsorbing: {
    id: 'starAbsorbing',
    name: '吸星大法',
    requiredCardType: 'any',
    mpCost: 0,
    agilityCost: 3,
    effects: [{ type: 'drainMp', value: 5 }],
    description: '吸取对方5点内力'
  },
  qiankunMove: {
    id: 'qiankunMove',
    name: '乾坤大挪移',
    requiredCardType: 'any',
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8 }, { type: 'shield', value: 5 }],
    description: '造成8点伤害，获得5点护盾'
  },
  littleFormless: {
    id: 'littleFormless',
    name: '小无相功',
    requiredCardType: 'any',
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'mimic' }],
    description: '模仿对方上次使用的武功招式'
  },
  biHai: {
    id: 'biHai',
    name: '碧海潮生曲',
    requiredCardType: 'any',
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'debuffAgility', value: 5, duration: 1 }],
    description: '对方下回合轻功-5，无法使用武功招式'
  },
  shiZiHou: {
    id: 'shiZiHou',
    name: '狮子吼',
    requiredCardType: 'any',
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'debuffAgility', value: 3, duration: 1 }],
    description: '对方下回合无法使用武功招式，轻功-3'
  },
  douZhuan: {
    id: 'douZhuan',
    name: '斗转星移',
    requiredCardType: 'any',
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 8 }],
    description: '反弹对方上次造成的伤害'
  }
}

// ==================== 内功数据 ====================
export const passiveSkills: Record<string, PassiveSkill> = {
  goldenBell: {
    id: 'goldenBell',
    name: '金钟罩',
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.shield += 5
      return `${character.name}的金钟罩发动，获得5点护盾`
    },
    description: '每回合开始获得5点护盾'
  },
  muscleChange: {
    id: 'muscleChange',
    name: '易筋经',
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.mp = Math.min(character.maxMp, character.mp + 3)
      return `${character.name}的易筋经发动，恢复3点内力`
    },
    description: '每回合恢复3点内力'
  },
  nineYang: {
    id: 'nineYang',
    name: '九阳神功',
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.hp = Math.min(character.maxHp, character.hp + 4)
      return `${character.name}的九阳神功发动，恢复4点体力`
    },
    description: '每回合恢复4点体力'
  },
  lingbo: {
    id: 'lingbo',
    name: '凌波微步',
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.agilityBonus = (character.agilityBonus || 0) + 2
      return `${character.name}的凌波微步发动，轻功+2`
    },
    initEffect: (character: CharacterState): void => {
      character.agilityBonus = 5
    },
    description: '初始轻功+5，每回合轻功+2'
  },
  northernMingPassive: {
    id: 'northernMingPassive',
    name: '北冥神功',
    trigger: TriggerTiming.ON_DAMAGE,
    effect: (character: CharacterState, damage: number): string | null => {
      const recover = Math.floor(damage * 0.5)
      character.mp = Math.min(character.maxMp, character.mp + recover)
      return recover > 0 ? `${character.name}的北冥神功发动，恢复${recover}点内力` : null
    },
    description: '造成伤害时恢复等量内力的50%'
  },
  starAbsorbingPassive: {
    id: 'starAbsorbingPassive',
    name: '吸星大法',
    trigger: TriggerTiming.ON_DAMAGE,
    effect: (character: CharacterState, damage: number): string | null => {
      const recover = Math.floor(damage * 0.5)
      character.hp = Math.min(character.maxHp, character.hp + recover)
      return recover > 0 ? `${character.name}的吸星大法发动，恢复${recover}点体力` : null
    },
    description: '造成伤害时恢复等量体力的50%'
  },
  taiChiHeart: {
    id: 'taiChiHeart',
    name: '太极心法',
    trigger: TriggerTiming.ON_TAKE_DAMAGE,
    effect: (character: CharacterState, damage: number): PassiveEffectResult => {
      const reduction = Math.floor(damage * 0.25)
      return { reducedDamage: damage - reduction, message: `${character.name}的太极心法发动，伤害减少25%` }
    },
    description: '受到伤害减少25%'
  },
  qiankun: {
    id: 'qiankun',
    name: '乾坤大挪移',
    trigger: TriggerTiming.ON_TAKE_DAMAGE,
    effect: (character: CharacterState, damage: number): PassiveEffectResult | null => {
      if (Math.random() < 0.2) {
        const reflect = Math.floor(damage * 0.5)
        return { dodged: true, reflectDamage: reflect, message: `${character.name}的乾坤大挪移发动，闪避并反弹${reflect}点伤害` }
      }
      return null
    },
    description: '20%几率闪避攻击，成功时反弹50%伤害'
  },
  nineYin: {
    id: 'nineYin',
    name: '九阴真经',
    trigger: TriggerTiming.ON_SKILL_USE,
    effect: (character: CharacterState, skill: MartialArtSkill): string | null => {
      if (skill.mpCost > 0) {
        skill.mpCostReduction = 1
        return `${character.name}的九阴真经发动，内力消耗-1`
      }
      return null
    },
    description: '武功招式内力消耗-1'
  },
  congenital: {
    id: 'congenital',
    name: '先天功',
    trigger: TriggerTiming.ON_SKILL_USE,
    effect: (character: CharacterState, _skill: MartialArtSkill, damage?: number): PassiveEffectResult | null => {
      if (damage) {
        const bonus = Math.floor(damage * 0.2)
        return { bonusDamage: bonus, message: `${character.name}的先天功发动，伤害+20%` }
      }
      return null
    },
    description: '武功招式伤害+20%'
  },
  dragonElephant: {
    id: 'dragonElephant',
    name: '龙象般若功',
    trigger: TriggerTiming.ON_PLAY_CARD,
    effect: (character: CharacterState, card: { isBasicCard: boolean }, damage?: number): PassiveEffectResult | null => {
      if (card.isBasicCard && damage) {
        return { bonusDamage: 3, message: `${character.name}的龙象般若功发动，基础招式伤害+3` }
      }
      return null
    },
    description: '基础招式伤害+3'
  },
  kuiHuaPassive: {
    id: 'kuiHuaPassive',
    name: '葵花宝典',
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.agilityBonus = (character.agilityBonus || 0) + 2
      return `${character.name}的葵花宝典发动，轻功+2`
    },
    description: '每回合轻功+2，30%几率闪避攻击'
  },
  yuNuXin: {
    id: 'yuNuXin',
    name: '玉女心经',
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.hp = Math.min(character.maxHp, character.hp + 2)
      return `${character.name}的玉女心经发动，恢复2点体力`
    },
    description: '每回合恢复2点体力，受到伤害减少20%'
  },
  shenZhaoPassive: {
    id: 'shenZhaoPassive',
    name: '神照经',
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      const heal = character.hp < character.maxHp * 0.2 ? 6 : 3
      character.hp = Math.min(character.maxHp, character.hp + heal)
      return `${character.name}的神照经发动，恢复${heal}点体力`
    },
    description: '每回合恢复3点体力，体力低于20%时恢复翻倍'
  },
  taiXuanPassive: {
    id: 'taiXuanPassive',
    name: '太玄经',
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.hp = Math.min(character.maxHp, character.hp + 4)
      return `${character.name}的太玄经发动，恢复4点体力`
    },
    description: '每回合恢复4点体力，受到伤害减少20%'
  },
  douZhuanPassive: {
    id: 'douZhuanPassive',
    name: '斗转星移',
    trigger: TriggerTiming.ON_TAKE_DAMAGE,
    effect: (character: CharacterState, damage: number): PassiveEffectResult | null => {
      if (Math.random() < 0.25) {
        const reflect = Math.floor(damage * 0.5)
        return { dodged: true, reflectDamage: reflect, message: `${character.name}的斗转星移发动，闪避并反弹${reflect}点伤害` }
      }
      return null
    },
    description: '25%几率反弹受到的伤害'
  },
  haMaPassive: {
    id: 'haMaPassive',
    name: '蛤蟆功',
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.shield += 3
      return `${character.name}的蛤蟆功发动，获得3点护盾`
    },
    description: '每回合开始获得3点护盾'
  },
  chunYang: {
    id: 'chunYang',
    name: '纯阳无极功',
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.mp = Math.min(character.maxMp, character.mp + 3)
      return `${character.name}的纯阳无极功发动，恢复3点内力`
    },
    description: '每回合恢复3点内力，武功招式伤害+20%'
  }
}

// ==================== 武功配置 ====================
export const martialArts: Record<string, MartialArt> = {
  // 乔峰武功
  dragonPalmArt: {
    id: 'dragonPalmArt',
    name: '降龙掌',
    skills: [martialArtSkills.dragonPalm],
    passive: null,
    description: '降龙十八掌'
  },
  dogBeatingArt: {
    id: 'dogBeatingArt',
    name: '打狗棒法',
    skills: [martialArtSkills.dogBeating],
    passive: null,
    description: '打狗棒法'
  },
  // 段誉武功
  sixMeridianArt: {
    id: 'sixMeridianArt',
    name: '六脉神剑',
    skills: [martialArtSkills.sixMeridianSword],
    passive: null,
    description: '六脉神剑'
  },
  lingboArt: {
    id: 'lingboArt',
    name: '凌波微步',
    skills: [],
    passive: passiveSkills.lingbo,
    description: '凌波微步'
  },
  northernMingArt: {
    id: 'northernMingArt',
    name: '北冥神功',
    skills: [martialArtSkills.northernMingSkill],
    passive: passiveSkills.northernMingPassive,
    description: '北冥神功'
  },
  // 虚竹武功
  tianShanZheMeiArt: {
    id: 'tianShanZheMeiArt',
    name: '天山折梅手',
    skills: [martialArtSkills.tianShanZheMei],
    passive: null,
    description: '天山折梅手'
  },
  tianShanLiuYangArt: {
    id: 'tianShanLiuYangArt',
    name: '天山六阳掌',
    skills: [martialArtSkills.tianShanLiuYang],
    passive: null,
    description: '天山六阳掌'
  },
  lifeDeathArt: {
    id: 'lifeDeathArt',
    name: '生死符',
    skills: [martialArtSkills.lifeDeath],
    passive: null,
    description: '生死符'
  },
  // 郭靖武功
  nineYinArt: {
    id: 'nineYinArt',
    name: '九阴真经',
    skills: [],
    passive: passiveSkills.nineYin,
    description: '九阴真经'
  },
  kongMingArt: {
    id: 'kongMingArt',
    name: '空明拳',
    skills: [martialArtSkills.kongMing],
    passive: null,
    description: '空明拳'
  },
  // 黄蓉武功
  lanHuaArt: {
    id: 'lanHuaArt',
    name: '兰花拂穴手',
    skills: [martialArtSkills.lanHua],
    passive: null,
    description: '兰花拂穴手'
  },
  // 欧阳锋武功
  haMaArt: {
    id: 'haMaArt',
    name: '蛤蟆功',
    skills: [martialArtSkills.haMa],
    passive: passiveSkills.haMaPassive,
    description: '蛤蟆功'
  },
  // 黄药师武功
  tanZhiArt: {
    id: 'tanZhiArt',
    name: '弹指神通',
    skills: [martialArtSkills.tanZhi],
    passive: null,
    description: '弹指神通'
  },
  luoYingArt: {
    id: 'luoYingArt',
    name: '落英神剑掌',
    skills: [martialArtSkills.luoYing],
    passive: null,
    description: '落英神剑掌'
  },
  biHaiArt: {
    id: 'biHaiArt',
    name: '碧海潮生曲',
    skills: [martialArtSkills.biHai],
    passive: null,
    description: '碧海潮生曲'
  },
  // 一灯大师武功
  oneYangArt: {
    id: 'oneYangArt',
    name: '一阳指',
    skills: [martialArtSkills.oneYang],
    passive: passiveSkills.congenital,
    description: '一阳指 + 先天功'
  },
  // 杨过武功
  anRanArt: {
    id: 'anRanArt',
    name: '黯然销魂掌',
    skills: [martialArtSkills.anRan],
    passive: null,
    description: '黯然销魂掌'
  },
  xuanTieArt: {
    id: 'xuanTieArt',
    name: '玄铁剑法',
    skills: [martialArtSkills.xuanTie],
    passive: null,
    description: '玄铁剑法'
  },
  // 小龙女武功
  yuNuJianArt: {
    id: 'yuNuJianArt',
    name: '玉女剑法',
    skills: [martialArtSkills.yuNu],
    passive: null,
    description: '玉女剑法'
  },
  yuNuXinArt: {
    id: 'yuNuXinArt',
    name: '玉女心经',
    skills: [],
    passive: passiveSkills.yuNuXin,
    description: '玉女心经'
  },
  shuangJianArt: {
    id: 'shuangJianArt',
    name: '双剑合璧',
    skills: [martialArtSkills.shuangJian],
    passive: null,
    description: '双剑合璧'
  },
  // 金轮法王武功
  longXiangArt: {
    id: 'longXiangArt',
    name: '龙象般若功',
    skills: [martialArtSkills.longXiang],
    passive: passiveSkills.dragonElephant,
    description: '龙象般若功'
  },
  // 张无忌武功
  nineYangArt: {
    id: 'nineYangArt',
    name: '九阳神功',
    skills: [],
    passive: passiveSkills.nineYang,
    description: '九阳神功'
  },
  qiankunArt: {
    id: 'qiankunArt',
    name: '乾坤大挪移',
    skills: [martialArtSkills.qiankunMove],
    passive: passiveSkills.qiankun,
    description: '乾坤大挪移'
  },
  taiChiArt: {
    id: 'taiChiArt',
    name: '太极拳',
    skills: [martialArtSkills.taiChiSkill],
    passive: null,
    description: '太极拳'
  },
  // 张三丰武功
  taiJiJianArt: {
    id: 'taiJiJianArt',
    name: '太极剑',
    skills: [martialArtSkills.taiJiJian],
    passive: null,
    description: '太极剑'
  },
  chunYangArt: {
    id: 'chunYangArt',
    name: '纯阳无极功',
    skills: [],
    passive: passiveSkills.chunYang,
    description: '纯阳无极功'
  },
  // 谢逊武功
  sevenInjuryArt: {
    id: 'sevenInjuryArt',
    name: '七伤拳',
    skills: [martialArtSkills.sevenInjury],
    passive: null,
    description: '七伤拳'
  },
  shiZiHouArt: {
    id: 'shiZiHouArt',
    name: '狮子吼',
    skills: [martialArtSkills.shiZiHou],
    passive: null,
    description: '狮子吼'
  },
  // 令狐冲武功
  nineSwordsArt: {
    id: 'nineSwordsArt',
    name: '独孤九剑',
    skills: [martialArtSkills.nineSwords],
    passive: null,
    description: '独孤九剑'
  },
  starAbsorbingArt: {
    id: 'starAbsorbingArt',
    name: '吸星大法',
    skills: [martialArtSkills.starAbsorbing],
    passive: null,
    description: '吸星大法'
  },
  muscleChangeArt: {
    id: 'muscleChangeArt',
    name: '易筋经',
    skills: [],
    passive: passiveSkills.muscleChange,
    description: '易筋经'
  },
  // 任我行武功
  starAbsorbingFullArt: {
    id: 'starAbsorbingFullArt',
    name: '吸星大法',
    skills: [martialArtSkills.starAbsorbing],
    passive: passiveSkills.starAbsorbingPassive,
    description: '吸星大法'
  },
  // 东方不败武功
  kuiHuaArt: {
    id: 'kuiHuaArt',
    name: '葵花宝典',
    skills: [martialArtSkills.kuiHua],
    passive: passiveSkills.kuiHuaPassive,
    description: '葵花宝典'
  },
  // 鸠摩智武功
  huoYanArt: {
    id: 'huoYanArt',
    name: '火焰刀',
    skills: [martialArtSkills.huoYan],
    passive: null,
    description: '火焰刀'
  },
  littleFormlessArt: {
    id: 'littleFormlessArt',
    name: '小无相功',
    skills: [martialArtSkills.littleFormless],
    passive: null,
    description: '小无相功'
  },
  // 慕容复武功
  douZhuanArt: {
    id: 'douZhuanArt',
    name: '斗转星移',
    skills: [martialArtSkills.douZhuan],
    passive: passiveSkills.douZhuanPassive,
    description: '斗转星移'
  },
  // 袁承志武功
  goldenSnakeArt: {
    id: 'goldenSnakeArt',
    name: '金蛇剑法',
    skills: [martialArtSkills.goldenSnake],
    passive: null,
    description: '金蛇剑法'
  },
  goldenSnakeZhuiArt: {
    id: 'goldenSnakeZhuiArt',
    name: '金蛇锥',
    skills: [martialArtSkills.goldenSnakeZhui],
    passive: null,
    description: '金蛇锥'
  },
  // 狄云武功
  shenZhaoArt: {
    id: 'shenZhaoArt',
    name: '神照经',
    skills: [martialArtSkills.shenZhao],
    passive: passiveSkills.shenZhaoPassive,
    description: '神照经'
  },
  // 石破天武功
  taiXuanArt: {
    id: 'taiXuanArt',
    name: '太玄经',
    skills: [martialArtSkills.taiXuan],
    passive: passiveSkills.taiXuanPassive,
    description: '太玄经'
  }
}

// ==================== 角色配置 ====================
export const characters: Record<string, CharacterConfig> = {
  // 1. 乔峰 - 丐帮帮主
  qiaoFeng: {
    id: 'qiaoFeng',
    name: '乔峰',
    title: '丐帮帮主',
    description: '豪迈刚猛，掌力无双',
    hp: 70,
    mp: 20,
    agility: 10,
    martialArts: ['dragonPalmArt', 'dogBeatingArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow',
      'sweep', 'sweep', 'sweep', 'sweep',
      'thrust', 'thrust',
      'frontKick', 'frontKick'
    ]
  },
  // 2. 段誉 - 大理世子
  duanYu: {
    id: 'duanYu',
    name: '段誉',
    title: '大理世子',
    description: '六脉神剑，指力惊人',
    hp: 50,
    mp: 30,
    agility: 14,
    martialArts: ['sixMeridianArt', 'lingboArt', 'northernMingArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 3. 虚竹 - 灵鹫宫主
  xuZhu: {
    id: 'xuZhu',
    name: '虚竹',
    title: '灵鹫宫主',
    description: '天山武学，北冥神功',
    hp: 60,
    mp: 28,
    agility: 10,
    martialArts: ['tianShanZheMeiArt', 'tianShanLiuYangArt', 'lifeDeathArt', 'northernMingArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'stab', 'stab',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 4. 郭靖 - 北侠
  guoJing: {
    id: 'guoJing',
    name: '郭靖',
    title: '北侠',
    description: '降龙十八掌，九阴真经',
    hp: 68,
    mp: 22,
    agility: 9,
    martialArts: ['dragonPalmArt', 'nineYinArt', 'kongMingArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick', 'sweepKick'
    ]
  },
  // 5. 黄蓉 - 丐帮帮主
  huangRong: {
    id: 'huangRong',
    name: '黄蓉',
    title: '丐帮帮主',
    description: '打狗棒法，兰花拂穴手',
    hp: 52,
    mp: 24,
    agility: 12,
    martialArts: ['dogBeatingArt', 'lanHuaArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow',
      'sweep', 'sweep', 'sweep', 'sweep', 'sweep',
      'thrust', 'thrust', 'thrust',
      'frontKick', 'frontKick'
    ]
  },
  // 6. 洪七公 - 北丐
  hongQiGong: {
    id: 'hongQiGong',
    name: '洪七公',
    title: '北丐',
    description: '降龙十八掌，打狗棒法',
    hp: 65,
    mp: 22,
    agility: 10,
    martialArts: ['dragonPalmArt', 'dogBeatingArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'sweep', 'sweep', 'sweep', 'sweep',
      'thrust', 'thrust'
    ]
  },
  // 7. 欧阳锋 - 西毒
  ouYangFeng: {
    id: 'ouYangFeng',
    name: '欧阳锋',
    title: '西毒',
    description: '蛤蟆功，蓄力一击',
    hp: 62,
    mp: 24,
    agility: 9,
    martialArts: ['haMaArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 8. 黄药师 - 东邪
  huangYaoShi: {
    id: 'huangYaoShi',
    name: '黄药师',
    title: '东邪',
    description: '弹指神通，落英神剑掌',
    hp: 55,
    mp: 26,
    agility: 12,
    martialArts: ['tanZhiArt', 'luoYingArt', 'biHaiArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow',
      'stab', 'stab', 'stab',
      'slash', 'slash', 'slash',
      'frontKick', 'frontKick',
      'sweepKick'
    ]
  },
  // 9. 一灯大师 - 南帝
  yiDeng: {
    id: 'yiDeng',
    name: '一灯大师',
    title: '南帝',
    description: '一阳指，先天功',
    hp: 60,
    mp: 28,
    agility: 8,
    martialArts: ['oneYangArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 10. 杨过 - 神雕大侠
  yangGuo: {
    id: 'yangGuo',
    name: '杨过',
    title: '神雕大侠',
    description: '黯然销魂掌，玄铁剑法',
    hp: 62,
    mp: 22,
    agility: 11,
    martialArts: ['anRanArt', 'xuanTieArt', 'nineYinArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow',
      'sweep', 'sweep', 'sweep', 'sweep',
      'thrust', 'thrust', 'thrust',
      'frontKick', 'frontKick'
    ]
  },
  // 11. 小龙女 - 古墓派传人
  xiaoLongNv: {
    id: 'xiaoLongNv',
    name: '小龙女',
    title: '古墓派传人',
    description: '玉女剑法，双剑合璧',
    hp: 50,
    mp: 24,
    agility: 13,
    martialArts: ['yuNuJianArt', 'yuNuXinArt', 'shuangJianArt'],
    deck: [
      'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick'
    ]
  },
  // 12. 金轮法王 - 蒙古国师
  jinLun: {
    id: 'jinLun',
    name: '金轮法王',
    title: '蒙古国师',
    description: '龙象般若功，力大无穷',
    hp: 68,
    mp: 24,
    agility: 8,
    martialArts: ['longXiangArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 13. 张无忌 - 明教教主
  zhangWuJi: {
    id: 'zhangWuJi',
    name: '张无忌',
    title: '明教教主',
    description: '九阳神功，乾坤大挪移',
    hp: 58,
    mp: 28,
    agility: 10,
    martialArts: ['nineYangArt', 'qiankunArt', 'taiChiArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 14. 张三丰 - 武当祖师
  zhangSanFeng: {
    id: 'zhangSanFeng',
    name: '张三丰',
    title: '武当祖师',
    description: '太极宗师，以柔克刚',
    hp: 60,
    mp: 30,
    agility: 10,
    martialArts: ['taiChiArt', 'taiJiJianArt', 'chunYangArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow',
      'stab', 'stab', 'stab', 'stab',
      'slash', 'slash',
      'frontKick', 'frontKick'
    ]
  },
  // 15. 谢逊 - 金毛狮王
  xieXun: {
    id: 'xieXun',
    name: '谢逊',
    title: '金毛狮王',
    description: '七伤拳，狮子吼',
    hp: 65,
    mp: 20,
    agility: 9,
    martialArts: ['sevenInjuryArt', 'shiZiHouArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 16. 令狐冲 - 华山弟子
  lingHuChong: {
    id: 'lingHuChong',
    name: '令狐冲',
    title: '华山弟子',
    description: '独孤九剑，吸星大法',
    hp: 52,
    mp: 20,
    agility: 12,
    martialArts: ['nineSwordsArt', 'starAbsorbingArt', 'muscleChangeArt'],
    deck: [
      'stab', 'stab', 'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 17. 任我行 - 日月神教教主
  renWoXing: {
    id: 'renWoXing',
    name: '任我行',
    title: '日月神教教主',
    description: '吸星大法，吸取敌人内力',
    hp: 58,
    mp: 26,
    agility: 10,
    martialArts: ['starAbsorbingFullArt'],
    deck: [
      'fist', 'fist', 'fist',
      'palm', 'palm', 'palm',
      'elbow', 'elbow',
      'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash',
      'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 18. 东方不败 - 日月神教前教主
  dongFangBuBai: {
    id: 'dongFangBuBai',
    name: '东方不败',
    title: '日月神教前教主',
    description: '葵花宝典，身法如电',
    hp: 48,
    mp: 22,
    agility: 16,
    martialArts: ['kuiHuaArt'],
    deck: [
      'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick'
    ]
  },
  // 19. 风清扬 - 华山剑宗
  fengQingYang: {
    id: 'fengQingYang',
    name: '风清扬',
    title: '华山剑宗',
    description: '独孤九剑传人',
    hp: 55,
    mp: 24,
    agility: 11,
    martialArts: ['nineSwordsArt'],
    deck: [
      'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick'
    ]
  },
  // 20. 鸠摩智 - 吐蕃国师
  jiuMoZhi: {
    id: 'jiuMoZhi',
    name: '鸠摩智',
    title: '吐蕃国师',
    description: '火焰刀，小无相功',
    hp: 58,
    mp: 26,
    agility: 10,
    martialArts: ['huoYanArt', 'littleFormlessArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'stab', 'stab',
      'slash', 'slash',
      'frontKick', 'frontKick'
    ]
  },
  // 21. 慕容复 - 姑苏慕容
  muRongFu: {
    id: 'muRongFu',
    name: '慕容复',
    title: '姑苏慕容',
    description: '斗转星移，以彼之道还施彼身',
    hp: 55,
    mp: 24,
    agility: 11,
    martialArts: ['douZhuanArt'],
    deck: [
      'fist', 'fist', 'fist',
      'palm', 'palm', 'palm',
      'elbow', 'elbow',
      'stab', 'stab', 'stab',
      'slash', 'slash', 'slash',
      'sweep', 'sweep',
      'thrust', 'thrust',
      'frontKick', 'frontKick'
    ]
  },
  // 22. 袁承志 - 金蛇王
  yuanChengZhi: {
    id: 'yuanChengZhi',
    name: '袁承志',
    title: '金蛇王',
    description: '金蛇剑法，金蛇锥',
    hp: 60,
    mp: 22,
    agility: 11,
    martialArts: ['goldenSnakeArt', 'goldenSnakeZhuiArt'],
    deck: [
      'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 23. 狄云 - 连城诀主角
  diYun: {
    id: 'diYun',
    name: '狄云',
    title: '连城诀主角',
    description: '神照经，起死回生',
    hp: 62,
    mp: 20,
    agility: 9,
    martialArts: ['shenZhaoArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  },
  // 24. 石破天 - 侠客行主角
  shiPoTian: {
    id: 'shiPoTian',
    name: '石破天',
    title: '侠客行主角',
    description: '太玄经，内力深厚',
    hp: 70,
    mp: 28,
    agility: 10,
    martialArts: ['taiXuanArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ]
  }
}

// 获取角色的所有武功
export function getCharacterMartialArts(characterId: string): MartialArt[] {
  const character = characters[characterId]
  if (!character) return []

  return character.martialArts.map(artId => {
    const art = martialArts[artId]
    return {
      id: artId,
      name: art.name,
      skills: art.skills,
      passive: art.passive,
      description: art.description
    }
  })
}

// 重新导出类型
export { TriggerTiming } from '../game/types'