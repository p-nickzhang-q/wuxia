import { CardType, TriggerTiming, MartialArtSkill, PassiveSkill, MartialArt, CharacterState, PassiveEffectResult, SkillLevel, Faction } from '../game/types'
import { CharacterConfig, CharacterConfigData } from '../game/CharacterConfig'

// ==================== 武功招式数据 ====================
export const martialArtSkills: Record<string, MartialArtSkill> = {
  // ========== 丐帮武功 ==========
  dragonPalm: {
    id: 'dragonPalm',
    name: '降龙十八掌',
    shortName: '降龙',
    level: SkillLevel.MASTER,
    faction: Faction.BEGGAR,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 10 }],
    description: '造成10点伤害',
    range: 1
  },
  dogBeating: {
    id: 'dogBeating',
    name: '打狗棒法',
    shortName: '打狗',
    level: SkillLevel.MASTER,
    faction: Faction.BEGGAR,
    requiredCardType: CardType.LONG_WEAPON,
    mpCost: 4,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 7 }, { type: 'disableCardType', cardType: CardType.LEG, duration: 1 }],
    description: '造成7点伤害，对方下回合无法使用腿法',
    range: 2
  },
  drunkStep: {
    id: 'drunkStep',
    name: '醉仙望月步',
    shortName: '醉仙',
    level: SkillLevel.BEGINNER,
    faction: Faction.BEGGAR,
    requiredCardType: CardType.LEG,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'shield', value: 3 }, { type: 'debuffAgility', value: 2, duration: 1 }],
    description: '获得3点护盾，对方下回合轻功-2',
    range: 1
  },
  captureDragon: {
    id: 'captureDragon',
    name: '擒龙手',
    shortName: '擒龙',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.BEGGAR,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 6 }, { type: 'drainHp', value: 3 }],
    description: '造成6点伤害，吸取3点体力',
    range: 2
  },

  // ========== 大理段氏武功 ==========
  duanSword: {
    id: 'duanSword',
    name: '段家剑法',
    shortName: '段剑',
    level: SkillLevel.ADVANCED,
    faction: Faction.DALI,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9, ignoreShield: true }],
    description: '造成9点伤害，无视护盾',
    range: 2
  },
  sixMeridianSword: {
    id: 'sixMeridianSword',
    name: '六脉神剑',
    shortName: '六脉',
    level: SkillLevel.MASTER,
    faction: Faction.DALI,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 12, ignoreShield: true }],
    description: '造成12点伤害，无视护盾',
    range: 3
  },
  oneYang: {
    id: 'oneYang',
    name: '一阳指',
    shortName: '一阳',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.DALI,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 8, ignoreShield: true }],
    description: '造成8点伤害，无视护盾',
    range: 2
  },

  // ========== 天山派武功 ==========
  tianShanZheMei: {
    id: 'tianShanZheMei',
    name: '天山折梅手',
    shortName: '折梅',
    level: SkillLevel.ADVANCED,
    faction: Faction.TIANSHAN,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 7 }, { type: 'followUp' }],
    description: '造成7点伤害，可追击一次',
    range: 1
  },
  tianShanLiuYang: {
    id: 'tianShanLiuYang',
    name: '天山六阳掌',
    shortName: '六阳',
    level: SkillLevel.ADVANCED,
    faction: Faction.TIANSHAN,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8 }],
    description: '造成8点伤害',
    range: 1
  },
  lifeDeath: {
    id: 'lifeDeath',
    name: '生死符',
    shortName: '生死',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.TIANSHAN,
    requiredCardType: 'any',
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'dot', value: 3, duration: 3 }],
    description: '对方每回合失去3点体力，持续3回合',
    range: 2
  },

  // ========== 峨眉派武功 ==========
  emeiSword: {
    id: 'emeiSword',
    name: '峨眉剑法',
    shortName: '峨眉',
    level: SkillLevel.BEGINNER,
    faction: Faction.EMEI,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5 }],
    description: '造成5点伤害',
    range: 1
  },
  fourImagePalm: {
    id: 'fourImagePalm',
    name: '四象掌',
    shortName: '四象',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.EMEI,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 6 }, { type: 'shield', value: 3 }],
    description: '造成6点伤害，获得3点护盾',
    range: 1
  },
  goldenTopPalm: {
    id: 'goldenTopPalm',
    name: '金顶绵掌',
    shortName: '金顶',
    level: SkillLevel.ADVANCED,
    faction: Faction.EMEI,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9 }],
    description: '造成9点伤害，恢复3点体力',
    range: 1
  },

  // ========== 青城派武功 ==========
  qingchengSword: {
    id: 'qingchengSword',
    name: '青城剑法',
    shortName: '青城',
    level: SkillLevel.BEGINNER,
    faction: Faction.QINGCHENG,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5 }],
    description: '造成5点伤害',
    range: 1
  },
  pineWindSword: {
    id: 'pineWindSword',
    name: '松风剑法',
    shortName: '松风',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.QINGCHENG,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 7 }, { type: 'debuffAgility', value: 2, duration: 1 }],
    description: '造成7点伤害，对方下回合轻功-2',
    range: 1
  },
  hiddenNeedle: {
    id: 'hiddenNeedle',
    name: '暗藏金针',
    shortName: '金针',
    level: SkillLevel.ADVANCED,
    faction: Faction.QINGCHENG,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 4,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 8, ignoreShield: true }],
    description: '造成8点伤害，无视护盾',
    range: 2
  },
  cuiXinPalm: {
    id: 'cuiXinPalm',
    name: '摧心掌',
    shortName: '摧心',
    level: SkillLevel.MASTER,
    faction: Faction.QINGCHENG,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 11 }, { type: 'dot', value: 2, duration: 3 }],
    description: '造成11点伤害，对方每回合失去2点体力，持续3回合',
    range: 1
  },

  // ========== 古墓派武功 ==========
  yuNu: {
    id: 'yuNu',
    name: '玉女剑法',
    shortName: '玉女',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.GUMU,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 7 }],
    description: '造成7点伤害',
    range: 1
  },

  // ========== 星宿派武功 ==========
  northernMingSkill: {
    id: 'northernMingSkill',
    name: '北冥神功',
    shortName: '北冥',
    level: SkillLevel.MASTER,
    faction: Faction.TIANSHAN,
    requiredCardType: 'any',
    mpCost: 0,
    agilityCost: 3,
    effects: [{ type: 'drainMp', value: 6 }],
    description: '吸取对方6点内力',
    range: 1
  },
  huoYan: {
    id: 'huoYan',
    name: '火焰刀',
    shortName: '火焰',
    level: SkillLevel.ADVANCED,
    faction: Faction.SHAOLIN,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9, ignoreShield: true }],
    description: '造成9点伤害，无视护盾',
    range: 2
  },

  // ========== 华山武功 ==========
  huashanSword: {
    id: 'huashanSword',
    name: '华山剑法',
    shortName: '华山',
    level: SkillLevel.BEGINNER,
    faction: Faction.HUASHAN,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5 }],
    description: '造成5点伤害',
    range: 1
  },
  taiYueSanQing: {
    id: 'taiYueSanQing',
    name: '太岳三青峰',
    shortName: '太岳',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.HUASHAN,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 7 }],
    description: '造成7点伤害',
    range: 1
  },
  duoMingSanXian: {
    id: 'duoMingSanXian',
    name: '夺命三仙剑',
    shortName: '夺命',
    level: SkillLevel.ADVANCED,
    faction: Faction.HUASHAN,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9, ignoreShield: true }],
    description: '造成9点伤害，无视护盾',
    range: 2
  },
  nineSwords: {
    id: 'nineSwords',
    name: '独孤九剑',
    shortName: '九剑',
    level: SkillLevel.ADVANCED,
    faction: Faction.HUASHAN,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9, ignoreShield: true }],
    description: '造成9点伤害，无视护盾',
    range: 2
  },

  // ========== 明教武功 ==========
  qiankunMove: {
    id: 'qiankunMove',
    name: '乾坤大挪移',
    shortName: '乾坤',
    level: SkillLevel.MASTER,
    faction: Faction.MOZU,
    requiredCardType: 'any',
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8 }, { type: 'shield', value: 5 }],
    description: '造成8点伤害，获得5点护盾',
    range: 2
  },

  // ========== 武当武功 ==========
  softPalm: {
    id: 'softPalm',
    name: '绵掌',
    shortName: '绵掌',
    level: SkillLevel.BEGINNER,
    faction: Faction.WUDANG,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8 }, { type: 'shield', value: 4 }],
    description: '造成8点伤害，获得4点护盾',
    range: 1
  },
  trueWuSword: {
    id: 'trueWuSword',
    name: '真武剑法',
    shortName: '真武',
    level: SkillLevel.MASTER,
    faction: Faction.WUDANG,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 11 }, { type: 'shield', value: 5 }],
    description: '造成11点伤害，获得5点护盾',
    range: 2
  },
  taiChiSkill: {
    id: 'taiChiSkill',
    name: '太极拳',
    shortName: '太极',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.WUDANG,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5 }, { type: 'shield', value: 4 }],
    description: '造成5点伤害，获得4点护盾',
    range: 1
  },
  taiJiJian: {
    id: 'taiJiJian',
    name: '太极剑',
    shortName: '太极剑',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.WUDANG,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 6 }, { type: 'shield', value: 3 }],
    description: '造成6点伤害，获得3点护盾',
    range: 1
  },

  // ========== 侠客岛武功 ==========
  taiXuan: {
    id: 'taiXuan',
    name: '太玄经',
    shortName: '太玄',
    level: SkillLevel.MASTER,
    faction: Faction.XIAKE,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 12 }],
    description: '造成12点伤害',
    range: 1
  },

  // ========== 江湖散人武功（无门派）==========
  kongMing: {
    id: 'kongMing',
    name: '空明拳',
    shortName: '空明',
    level: SkillLevel.BEGINNER,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5 }, { type: 'shield', value: 3 }],
    description: '造成5点伤害，获得3点护盾',
    range: 1
  },
  luoYing: {
    id: 'luoYing',
    name: '落英神剑掌',
    shortName: '落英',
    level: SkillLevel.INTERMEDIATE,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 6 }, { type: 'damage', value: 6 }],
    description: '造成6点伤害×2',
    range: 1
  },
  lanHua: {
    id: 'lanHua',
    name: '兰花拂穴手',
    shortName: '兰花',
    level: SkillLevel.BEGINNER,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 4 }, { type: 'debuffAgility', value: 3, duration: 1 }],
    description: '造成4点伤害，对方下回合轻功-3',
    range: 1
  },
  tanZhi: {
    id: 'tanZhi',
    name: '弹指神通',
    shortName: '弹指',
    level: SkillLevel.BEGINNER,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5, ignoreShield: true }],
    description: '造成5点伤害，无视护盾',
    range: 2
  },
  anRan: {
    id: 'anRan',
    name: '黯然销魂掌',
    shortName: '黯然',
    level: SkillLevel.ADVANCED,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 11 }],
    description: '造成11点伤害（体力低于50%时伤害+50%）',
    range: 1
  },
  sevenInjury: {
    id: 'sevenInjury',
    name: '七伤拳',
    shortName: '七伤',
    level: SkillLevel.INTERMEDIATE,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8 }, { type: 'selfDamage', value: 2 }],
    description: '造成8点伤害，自身失去2点体力',
    range: 1
  },
  shenZhao: {
    id: 'shenZhao',
    name: '神照经掌',
    shortName: '神照',
    level: SkillLevel.INTERMEDIATE,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 7 }],
    description: '造成7点伤害，恢复3点体力',
    range: 1
  },
  longXiang: {
    id: 'longXiang',
    name: '龙象般若功',
    shortName: '龙象',
    level: SkillLevel.MASTER,
    faction: Faction.SHAOLIN,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 12 }],
    description: '造成12点伤害',
    range: 1
  },
  lingSheQuan: {
    id: 'lingSheQuan',
    name: '灵蛇拳',
    shortName: '灵蛇',
    level: SkillLevel.BEGINNER,
    faction: Faction.MOZU,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 6 }, { type: 'debuffAgility', value: 2, duration: 1 }],
    description: '造成6点伤害，对方下回合轻功-2',
    range: 1
  },
  haMa: {
    id: 'haMa',
    name: '蛤蟆功',
    shortName: '蛤蟆',
    level: SkillLevel.MASTER,
    faction: Faction.MOZU,
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 12 }],
    description: '造成12点伤害（需蓄力）',
    range: 1
  },
  xuanTie: {
    id: 'xuanTie',
    name: '玄铁剑法',
    shortName: '玄铁',
    level: SkillLevel.ADVANCED,
    requiredCardType: CardType.LONG_WEAPON,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9, ignoreShield: true }],
    description: '造成9点伤害，无视护盾',
    range: 2
  },
  goldenSnake: {
    id: 'goldenSnake',
    name: '金蛇剑法',
    shortName: '金蛇',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.MOZU,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 7 }, { type: 'debuffAgility', value: 3, duration: 1 }],
    description: '造成7点伤害，对方下回合轻功-3',
    range: 1
  },
  goldenSnakeZhui: {
    id: 'goldenSnakeZhui',
    name: '金蛇锥',
    shortName: '蛇锥',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.MOZU,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8, ignoreShield: true }],
    description: '造成8点伤害，无视护盾',
    range: 2
  },
  lianChengJian: {
    id: 'lianChengJian',
    name: '连城剑法',
    shortName: '连城',
    level: SkillLevel.INTERMEDIATE,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8 }],
    description: '造成8点伤害',
    range: 1
  },
  kuiHua: {
    id: 'kuiHua',
    name: '葵花宝典',
    shortName: '葵花',
    level: SkillLevel.MASTER,
    faction: Faction.MOZU,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 7 }, { type: 'extraAction' }],
    description: '造成7点伤害，可再行动一次',
    range: 1
  },
  xiuHuaZhen: {
    id: 'xiuHuaZhen',
    name: '绣花针法',
    shortName: '绣花',
    level: SkillLevel.BEGINNER,
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 2,
    agilityCost: 1,
    effects: [{ type: 'damage', value: 4 }, { type: 'extraAction' }],
    description: '造成4点伤害，可再行动一次',
    range: 2
  },
  starAbsorbing: {
    id: 'starAbsorbing',
    name: '吸星大法',
    shortName: '吸星',
    level: SkillLevel.ADVANCED,
    faction: Faction.MOZU,
    requiredCardType: 'any',
    mpCost: 0,
    agilityCost: 3,
    effects: [{ type: 'drainMp', value: 5 }],
    description: '吸取对方5点内力',
    range: 1
  },
  littleFormless: {
    id: 'littleFormless',
    name: '小无相功',
    shortName: '无相',
    level: SkillLevel.ADVANCED,
    faction: Faction.TIANSHAN,
    requiredCardType: 'any',
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'mimic' }],
    description: '模仿对方上次使用的武功招式',
    range: 2
  },
  biHai: {
    id: 'biHai',
    name: '碧海潮生曲',
    shortName: '碧海',
    level: SkillLevel.ADVANCED,
    requiredCardType: 'any',
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'debuffAgility', value: 5, duration: 1 }],
    description: '对方下回合轻功-5，无法使用武功招式',
    range: 3
  },
  shiZiHou: {
    id: 'shiZiHou',
    name: '狮子吼',
    shortName: '狮子',
    level: SkillLevel.ADVANCED,
    faction: Faction.SHAOLIN,
    requiredCardType: 'any',
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'debuffAgility', value: 3, duration: 1 }],
    description: '对方下回合无法使用武功招式，轻功-3',
    range: 3
  },
  douZhuan: {
    id: 'douZhuan',
    name: '斗转星移',
    shortName: '斗转',
    level: SkillLevel.INTERMEDIATE,
    requiredCardType: 'any',
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 8 }],
    description: '反弹对方上次造成的伤害',
    range: 2
  }
}

// ==================== 内功数据 ====================
export const passiveSkills: Record<string, PassiveSkill> = {
  // ========== 峨眉派内功 ==========
  emeiHeart: {
    id: 'emeiHeart',
    name: '峨眉心法',
    shortName: '峨眉',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.EMEI,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.shield += 3
      return `${character.name}的峨眉心法发动，获得3点护盾`
    },
    description: '每回合开始获得3点护盾'
  },
  emeiNineYangPassive: {
    id: 'emeiNineYangPassive',
    name: '峨眉九阳功',
    shortName: '九阳',
    level: SkillLevel.ADVANCED,
    faction: Faction.EMEI,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.hp = Math.min(character.maxHp, character.hp + 3)
      character.shield += 3
      return `${character.name}的峨眉九阳功发动，恢复3点体力，获得3点护盾`
    },
    description: '每回合恢复3点体力，获得3点护盾'
  },

  // ========== 青城派内功 ==========
  qingchengHeart: {
    id: 'qingchengHeart',
    name: '青城心法',
    shortName: '青城',
    level: SkillLevel.BEGINNER,
    faction: Faction.QINGCHENG,
    trigger: TriggerTiming.ON_SKILL_USE,
    effect: (character: CharacterState, _skill: MartialArtSkill, damage?: number): PassiveEffectResult | null => {
      if (damage) {
        const bonus = Math.floor(damage * 0.1)
        return { bonusDamage: bonus, message: `${character.name}的青城心法发动，伤害+10%` }
      }
      return null
    },
    description: '武功招式伤害+10%'
  },

  // ========== 丐帮内功 ==========
  hunTian: {
    id: 'hunTian',
    name: '混天功',
    shortName: '混天',
    level: SkillLevel.ADVANCED,
    faction: Faction.BEGGAR,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.mp = Math.min(character.maxMp, character.mp + 2)
      return `${character.name}的混天功发动，恢复2点内力`
    },
    description: '每回合恢复2点内力'
  },
  beggarHeart: {
    id: 'beggarHeart',
    name: '丐帮内功',
    shortName: '丐帮',
    level: SkillLevel.BEGINNER,
    faction: Faction.BEGGAR,
    trigger: TriggerTiming.ON_DAMAGE,
    effect: (character: CharacterState, _damage: number): string | null => {
      character.hp = Math.min(character.maxHp, character.hp + 3)
      return `${character.name}的丐帮内功发动，恢复3点体力`
    },
    description: '造成伤害时恢复3点体力'
  },

  // ========== 少林内功 ==========
  goldenBell: {
    id: 'goldenBell',
    name: '金钟罩',
    shortName: '金钟',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.SHAOLIN,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.shield += 6
      return `${character.name}的金钟罩发动，获得6点护盾`
    },
    description: '每回合开始获得6点护盾'
  },
  muscleChange: {
    id: 'muscleChange',
    name: '易筋经',
    shortName: '易筋',
    level: SkillLevel.MASTER,
    faction: Faction.SHAOLIN,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.mp = Math.min(character.maxMp, character.mp + 3)
      return `${character.name}的易筋经发动，恢复3点内力`
    },
    description: '每回合恢复3点内力'
  },
  nineYangShaolin: {
    id: 'nineYangShaolin',
    name: '九阳神功',
    shortName: '九阳',
    level: SkillLevel.MASTER,
    faction: Faction.SHAOLIN,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.hp = Math.min(character.maxHp, character.hp + 4)
      return `${character.name}的九阳神功发动，恢复4点体力`
    },
    description: '每回合恢复4点体力'
  },

  // ========== 明教内功 ==========
  qiankun: {
    id: 'qiankun',
    name: '乾坤大挪移',
    shortName: '乾坤',
    level: SkillLevel.MASTER,
    faction: Faction.MOZU,
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

  // ========== 星宿派内功 ==========
  northernMingPassive: {
    id: 'northernMingPassive',
    name: '北冥神功',
    shortName: '北冥',
    level: SkillLevel.MASTER,
    faction: Faction.TIANSHAN,
    trigger: TriggerTiming.ON_DAMAGE,
    effect: (character: CharacterState, damage: number): string | null => {
      const recover = Math.floor(damage * 0.5)
      character.mp = Math.min(character.maxMp, character.mp + recover)
      return recover > 0 ? `${character.name}的北冥神功发动，恢复${recover}点内力` : null
    },
    description: '造成伤害时恢复等量内力的50%'
  },

  // ========== 大理段氏内功 ==========
  duanHeart: {
    id: 'duanHeart',
    name: '段氏内功',
    shortName: '段氏',
    level: SkillLevel.BEGINNER,
    faction: Faction.DALI,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.agilityBonus = (character.agilityBonus || 0) + 1
      return `${character.name}的段氏内功发动，轻功+1`
    },
    description: '每回合轻功+1'
  },
  kuRongPassive: {
    id: 'kuRongPassive',
    name: '枯荣禅功',
    shortName: '枯荣',
    level: SkillLevel.ADVANCED,
    faction: Faction.DALI,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.hp = Math.min(character.maxHp, character.hp + 2)
      character.mp = Math.min(character.maxMp, character.mp + 2)
      return `${character.name}的枯荣禅功发动，恢复2点体力和2点内力`
    },
    description: '每回合恢复2点体力和2点内力'
  },
  congenital: {
    id: 'congenital',
    name: '先天功',
    shortName: '先天',
    level: SkillLevel.ADVANCED,
    faction: Faction.DALI,
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

  // ========== 武当内功 ==========
  taiChiHeart: {
    id: 'taiChiHeart',
    name: '太极心法',
    shortName: '太极',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.WUDANG,
    trigger: TriggerTiming.ON_TAKE_DAMAGE,
    effect: (character: CharacterState, damage: number): PassiveEffectResult => {
      const reduction = Math.floor(damage * 0.25)
      return { reducedDamage: damage - reduction, message: `${character.name}的太极心法发动，伤害减少25%` }
    },
    description: '受到伤害减少25%'
  },
  chunYang: {
    id: 'chunYang',
    name: '纯阳无极功',
    shortName: '纯阳',
    level: SkillLevel.ADVANCED,
    faction: Faction.WUDANG,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.mp = Math.min(character.maxMp, character.mp + 3)
      return `${character.name}的纯阳无极功发动，恢复3点内力`
    },
    description: '每回合恢复3点内力，武功招式伤害+20%'
  },

  // ========== 古墓派内功 ==========
  yuNuXin: {
    id: 'yuNuXin',
    name: '玉女心经',
    shortName: '玉女',
    level: SkillLevel.INTERMEDIATE,
    faction: Faction.GUMU,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.hp = Math.min(character.maxHp, character.hp + 2)
      return `${character.name}的玉女心经发动，恢复2点体力`
    },
    description: '每回合恢复2点体力，受到伤害减少20%'
  },

  // ========== 侠客岛内功 ==========
  taiXuanPassive: {
    id: 'taiXuanPassive',
    name: '太玄经',
    shortName: '太玄',
    level: SkillLevel.MASTER,
    faction: Faction.XIAKE,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.hp = Math.min(character.maxHp, character.hp + 4)
      return `${character.name}的太玄经发动，恢复4点体力`
    },
    description: '每回合恢复4点体力，受到伤害减少20%'
  },

  // ========== 华山内功 ==========
  huashanHeart: {
    id: 'huashanHeart',
    name: '华山心法',
    shortName: '华山',
    level: SkillLevel.BEGINNER,
    faction: Faction.HUASHAN,
    trigger: TriggerTiming.ON_SKILL_USE,
    effect: (character: CharacterState, _skill: MartialArtSkill, damage?: number): PassiveEffectResult | null => {
      if (damage) {
        const bonus = Math.floor(damage * 0.15)
        return { bonusDamage: bonus, message: `${character.name}的华山心法发动，伤害+15%` }
      }
      return null
    },
    description: '武功招式伤害+15%'
  },
  ziXia: {
    id: 'ziXia',
    name: '紫霞神功',
    shortName: '紫霞',
    level: SkillLevel.ADVANCED,
    faction: Faction.HUASHAN,
    trigger: TriggerTiming.ON_SKILL_USE,
    effect: (character: CharacterState, _skill: MartialArtSkill, damage?: number): PassiveEffectResult | null => {
      if (damage) {
        const bonus = Math.floor(damage * 0.15)
        return { bonusDamage: bonus, message: `${character.name}的紫霞神功发动，伤害+15%` }
      }
      return null
    },
    description: '武功招式伤害+15%'
  },

  // ========== 江湖散人内功（无门派）==========
  lingbo: {
    id: 'lingbo',
    name: '凌波微步',
    shortName: '凌波',
    level: SkillLevel.ADVANCED,
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
  starAbsorbingPassive: {
    id: 'starAbsorbingPassive',
    name: '吸星大法',
    shortName: '吸星',
    level: SkillLevel.ADVANCED,
    trigger: TriggerTiming.ON_DAMAGE,
    effect: (character: CharacterState, damage: number): string | null => {
      const recover = Math.floor(damage * 0.5)
      character.hp = Math.min(character.maxHp, character.hp + recover)
      return recover > 0 ? `${character.name}的吸星大法发动，恢复${recover}点体力` : null
    },
    description: '造成伤害时恢复等量体力的50%'
  },
  nineYin: {
    id: 'nineYin',
    name: '九阴真经',
    shortName: '九阴',
    level: SkillLevel.MASTER,
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
  dragonElephant: {
    id: 'dragonElephant',
    name: '龙象般若功',
    shortName: '龙象',
    level: SkillLevel.MASTER,
    faction: Faction.SHAOLIN,
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
    shortName: '葵花',
    level: SkillLevel.ADVANCED,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.agilityBonus = (character.agilityBonus || 0) + 2
      return `${character.name}的葵花宝典发动，轻功+2`
    },
    description: '每回合轻功+2，30%几率闪避攻击'
  },
  shenZhaoPassive: {
    id: 'shenZhaoPassive',
    name: '神照经',
    shortName: '神照',
    level: SkillLevel.ADVANCED,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      const heal = character.hp < character.maxHp * 0.2 ? 6 : 3
      character.hp = Math.min(character.maxHp, character.hp + heal)
      return `${character.name}的神照经发动，恢复${heal}点体力`
    },
    description: '每回合恢复3点体力，体力低于20%时恢复翻倍'
  },
  douZhuanPassive: {
    id: 'douZhuanPassive',
    name: '斗转星移',
    shortName: '斗转',
    level: SkillLevel.INTERMEDIATE,
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
    shortName: '蛤蟆',
    level: SkillLevel.ADVANCED,
    faction: Faction.MOZU,
    trigger: TriggerTiming.TURN_START,
    effect: (character: CharacterState): string => {
      character.shield += 4
      return `${character.name}的蛤蟆功发动，获得4点护盾`
    },
    description: '每回合开始获得4点护盾'
  }
}

// ==================== 武功配置 ====================
export const martialArts: Record<string, MartialArt> = {
  // ========== 峨眉派武功配置 ==========
  emeiSwordArt: {
    id: 'emeiSwordArt',
    name: '峨眉剑法',
    skills: [martialArtSkills.emeiSword],
    passive: null,
    description: '峨眉剑法'
  },
  fourImagePalmArt: {
    id: 'fourImagePalmArt',
    name: '四象掌',
    skills: [martialArtSkills.fourImagePalm],
    passive: null,
    description: '四象掌'
  },
  goldenTopPalmArt: {
    id: 'goldenTopPalmArt',
    name: '金顶绵掌',
    skills: [martialArtSkills.goldenTopPalm],
    passive: passiveSkills.emeiNineYangPassive,
    description: '金顶绵掌'
  },

  // ========== 青城派武功配置 ==========
  qingchengSwordArt: {
    id: 'qingchengSwordArt',
    name: '青城剑法',
    skills: [martialArtSkills.qingchengSword],
    passive: null,
    description: '青城剑法'
  },
  pineWindSwordArt: {
    id: 'pineWindSwordArt',
    name: '松风剑法',
    skills: [martialArtSkills.pineWindSword],
    passive: null,
    description: '松风剑法'
  },
  hiddenNeedleArt: {
    id: 'hiddenNeedleArt',
    name: '暗藏金针',
    skills: [martialArtSkills.hiddenNeedle],
    passive: passiveSkills.qingchengHeart,
    description: '暗藏金针'
  },
  cuiXinPalmArt: {
    id: 'cuiXinPalmArt',
    name: '摧心掌',
    skills: [martialArtSkills.cuiXinPalm],
    passive: null,
    description: '摧心掌'
  },

  // ========== 华山武功配置 ==========
  huashanSwordArt: {
    id: 'huashanSwordArt',
    name: '华山剑法',
    skills: [martialArtSkills.huashanSword],
    passive: null,
    description: '华山剑法'
  },
  taiYueSanQingArt: {
    id: 'taiYueSanQingArt',
    name: '太岳三青峰',
    skills: [martialArtSkills.taiYueSanQing],
    passive: passiveSkills.huashanHeart,
    description: '太岳三青峰'
  },
  duoMingSanXianArt: {
    id: 'duoMingSanXianArt',
    name: '夺命三仙剑',
    skills: [martialArtSkills.duoMingSanXian],
    passive: passiveSkills.ziXia,
    description: '夺命三仙剑'
  },

  // ========== 武当武功配置 ==========
  softPalmArt: {
    id: 'softPalmArt',
    name: '绵掌',
    skills: [martialArtSkills.softPalm],
    passive: null,
    description: '绵掌'
  },
  trueWuSwordArt: {
    id: 'trueWuSwordArt',
    name: '真武剑法',
    skills: [martialArtSkills.trueWuSword],
    passive: null,
    description: '真武剑法'
  },

  // ========== 大理段氏武功配置 ==========
  duanSwordArt: {
    id: 'duanSwordArt',
    name: '段家剑法',
    skills: [martialArtSkills.duanSword],
    passive: passiveSkills.kuRongPassive,
    description: '段家剑法'
  },

  // ========== 丐帮武功配置 ==========
  drunkStepArt: {
    id: 'drunkStepArt',
    name: '醉仙望月步',
    skills: [martialArtSkills.drunkStep],
    passive: passiveSkills.hunTian,
    description: '醉仙望月步'
  },
  captureDragonArt: {
    id: 'captureDragonArt',
    name: '擒龙手',
    skills: [martialArtSkills.captureDragon],
    passive: passiveSkills.beggarHeart,
    description: '擒龙手'
  },

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
  lingSheArt: {
    id: 'lingSheArt',
    name: '灵蛇拳',
    skills: [martialArtSkills.lingSheQuan],
    passive: null,
    description: '灵蛇拳'
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
    passive: passiveSkills.nineYangShaolin,
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
  lianChengJianArt: {
    id: 'lianChengJianArt',
    name: '连城剑法',
    skills: [martialArtSkills.lianChengJian],
    passive: null,
    description: '连城剑法'
  },
  // 石破天武功
  taiXuanArt: {
    id: 'taiXuanArt',
    name: '太玄经',
    skills: [martialArtSkills.taiXuan],
    passive: passiveSkills.taiXuanPassive,
    description: '太玄经'
  },
  // 风清扬内功
  ziXiaArt: {
    id: 'ziXiaArt',
    name: '紫霞神功',
    skills: [],
    passive: passiveSkills.ziXia,
    description: '紫霞神功'
  },
  // 东方不败武功
  xiuHuaZhenArt: {
    id: 'xiuHuaZhenArt',
    name: '绣花针法',
    skills: [martialArtSkills.xiuHuaZhen],
    passive: null,
    description: '绣花针法'
  }
}

// ==================== 角色配置 ====================
// 原始数据定义（使用 CharacterConfigData 接口）
const characterData: Record<string, CharacterConfigData> = {
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
    ],
    // 弟子属性：刚猛型，臂力极高
    root: 8,      // HP = 80
    insight: 5,
    will: 6,      // MP = 18
    strength: 10, // 伤害倍率 = 1.5
    agilityBonus: 6 // 轻功 = 12
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
    ],
    // 弟子属性：灵巧型，悟性/身法极高
    root: 4,      // HP = 40
    insight: 10,
    will: 7,      // MP = 21
    strength: 4,  // 伤害倍率 = 1.2
    agilityBonus: 10 // 轻功 = 20
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
      'fist', 'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ],
    // 弟子属性：成长型，根骨/定力高
    root: 9,      // HP = 90
    insight: 4,
    will: 8,      // MP = 24
    strength: 5,  // 伤害倍率 = 1.25
    agilityBonus: 5 // 轻功 = 10
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
    ],
    // 弟子属性：稳健型，根骨/臂力高
    root: 8,      // HP = 80
    insight: 4,
    will: 7,      // MP = 21
    strength: 8,  // 伤害倍率 = 1.4
    agilityBonus: 6 // 轻功 = 12
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
    ],
    // 弟子属性：机智型，悟性/身法高
    root: 5,      // HP = 50
    insight: 9,
    will: 6,      // MP = 18
    strength: 4,  // 伤害倍率 = 1.2
    agilityBonus: 8 // 轻功 = 16
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
    ],
    // 弟子属性：老练型，臂力高
    root: 7,      // HP = 70
    insight: 6,
    will: 6,      // MP = 18
    strength: 9,  // 伤害倍率 = 1.45
    agilityBonus: 6 // 轻功 = 12
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
    martialArts: ['haMaArt', 'lingSheArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ],
    // 弟子属性：阴狠型，臂力高
    root: 6,      // HP = 60
    insight: 7,
    will: 5,      // MP = 15
    strength: 9,  // 伤害倍率 = 1.45
    agilityBonus: 6 // 轻功 = 12
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
    ],
    // 弟子属性：全才型，悟性/身法高
    root: 5,      // HP = 50
    insight: 10,
    will: 7,      // MP = 21
    strength: 5,  // 伤害倍率 = 1.25
    agilityBonus: 9 // 轻功 = 18
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
    ],
    // 弟子属性：内功型，定力极高
    root: 6,      // HP = 60
    insight: 8,
    will: 10,     // MP = 30
    strength: 5,  // 伤害倍率 = 1.25
    agilityBonus: 5 // 轻功 = 10
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
    ],
    // 弟子属性：独臂剑魔，臂力/身法高
    root: 6,      // HP = 60
    insight: 7,
    will: 6,      // MP = 18
    strength: 8,  // 伤害倍率 = 1.4
    agilityBonus: 8 // 轻功 = 16
  },
  // 11. 小龙女 - 古墓派传人
  xiaoLongNv: {
    id: 'xiaoLongNv',
    name: '小龙女',
    title: '古墓派传人',
    description: '玉女剑法，玉女心经',
    hp: 50,
    mp: 24,
    agility: 13,
    martialArts: ['yuNuJianArt', 'yuNuXinArt'],
    deck: [
      'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick'
    ],
    // 弟子属性：冷艳型，身法极高
    root: 5,      // HP = 50
    insight: 8,
    will: 7,      // MP = 21
    strength: 4,  // 伤害倍率 = 1.2
    agilityBonus: 10 // 轻功 = 20
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
    ],
    // 弟子属性：力量型，臂力极高
    root: 8,      // HP = 80
    insight: 5,
    will: 5,      // MP = 15
    strength: 10, // 伤害倍率 = 1.5
    agilityBonus: 5 // 轻功 = 10
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
    ],
    // 弟子属性：综合型，定力高
    root: 7,      // HP = 70
    insight: 7,
    will: 9,      // MP = 27
    strength: 5,  // 伤害倍率 = 1.25
    agilityBonus: 7 // 轻功 = 14
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
    ],
    // 弟子属性：道宗，定力/悟性极高
    root: 7,      // HP = 70
    insight: 9,
    will: 10,     // MP = 30
    strength: 5,  // 伤害倍率 = 1.25
    agilityBonus: 6 // 轻功 = 12
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
    ],
    // 弟子属性：狂暴型，臂力高
    root: 7,      // HP = 70
    insight: 5,
    will: 5,      // MP = 15
    strength: 9,  // 伤害倍率 = 1.45
    agilityBonus: 6 // 轻功 = 12
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
    ],
    // 弟子属性：剑客，悟性/身法高
    root: 5,      // HP = 50
    insight: 9,
    will: 5,      // MP = 15
    strength: 6,  // 伤害倍率 = 1.3
    agilityBonus: 9 // 轻功 = 18
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
    ],
    // 弟子属性：霸主型，均衡
    root: 6,      // HP = 60
    insight: 7,
    will: 6,      // MP = 18
    strength: 7,  // 伤害倍率 = 1.35
    agilityBonus: 7 // 轻功 = 14
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
    martialArts: ['kuiHuaArt', 'xiuHuaZhenArt'],
    deck: [
      'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick'
    ],
    // 弟子属性：极速型，身法极高
    root: 4,      // HP = 40
    insight: 8,
    will: 6,      // MP = 18
    strength: 5,  // 伤害倍率 = 1.25
    agilityBonus: 10 // 轻功 = 20
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
    martialArts: ['nineSwordsArt', 'ziXiaArt'],
    deck: [
      'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick'
    ],
    // 弟子属性：剑宗，悟性极高
    root: 5,      // HP = 50
    insight: 10,
    will: 7,      // MP = 21
    strength: 5,  // 伤害倍率 = 1.25
    agilityBonus: 8 // 轻功 = 16
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
    ],
    // 弟子属性：精通型，均衡偏高
    root: 6,      // HP = 60
    insight: 8,
    will: 7,      // MP = 21
    strength: 6,  // 伤害倍率 = 1.3
    agilityBonus: 7 // 轻功 = 14
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
    ],
    // 弟子属性：复国型，悟性/身法高
    root: 5,      // HP = 50
    insight: 8,
    will: 6,      // MP = 18
    strength: 6,  // 伤害倍率 = 1.3
    agilityBonus: 8 // 轻功 = 16
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
    ],
    // 弟子属性：剑侠型，均衡
    root: 7,      // HP = 70
    insight: 6,
    will: 6,      // MP = 18
    strength: 7,  // 伤害倍率 = 1.35
    agilityBonus: 7 // 轻功 = 14
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
    martialArts: ['shenZhaoArt', 'lianChengJianArt'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick'
    ],
    // 弟子属性：苦练型，根骨高
    root: 8,      // HP = 80
    insight: 4,
    will: 6,      // MP = 18
    strength: 7,  // 伤害倍率 = 1.35
    agilityBonus: 6 // 轻功 = 12
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
    ],
    // 弟子属性：纯朴型，根骨/定力极高
    root: 10,     // HP = 100
    insight: 3,
    will: 9,      // MP = 27
    strength: 6,  // 伤害倍率 = 1.3
    agilityBonus: 6 // 轻功 = 12
  }
}

// 将原始数据转换为 CharacterConfig 实例并导出
export const characters: Record<string, CharacterConfig> = Object.fromEntries(
  Object.entries(characterData).map(([id, data]) => [id, new CharacterConfig(data)])
)

// 获取角色的所有武功
export function getCharacterMartialArts(characterId: string): MartialArt[] {
  const config = characters[characterId]
  if (!config) return []

  return config.martialArts.map(artId => {
    const art = martialArts[artId]
    if (!art) return null
    return {
      id: artId,
      name: art.name,
      skills: art.skills,
      passive: art.passive,
      description: art.description
    }
  }).filter(Boolean) as MartialArt[]
}

// 获取角色的武功描述文本
export function getCharacterMartialArtDescription(characterId: string): string {
  const arts = getCharacterMartialArts(characterId)
  return arts.map(a => a.name).join('、')
}

// 重新导出类型
export { TriggerTiming } from '../game/types'