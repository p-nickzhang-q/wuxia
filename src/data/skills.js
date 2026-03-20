import { CardType } from './cards.js'

// 触发时机枚举
export const TriggerTiming = {
  TURN_START: 'onTurnStart',
  TURN_END: 'onTurnEnd',
  ON_DAMAGE: 'onDamage',
  ON_TAKE_DAMAGE: 'onTakeDamage',
  ON_PLAY_CARD: 'onPlayCard',
  ON_SKILL_USE: 'onSkillUse'
}

// ==================== 武功招式数据 ====================
export const martialArtSkills = {
  // 空手类武功招式
  dragonPalm: {
    id: 'dragonPalm',
    name: '降龙十八掌',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 10 }],
    description: '造成10点伤害'
  },
  taiChiSkill: {
    id: 'taiChiSkill',
    name: '太极拳',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5 }, { type: 'shield', value: 3 }],
    description: '造成5点伤害，获得3点护盾'
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
  vajraPalm: {
    id: 'vajraPalm',
    name: '大力金刚掌',
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
    effects: [{ type: 'damage', value: 6, ignoreShield: true }],
    description: '造成6点伤害，无视护盾'
  },
  sixMeridians: {
    id: 'sixMeridians',
    name: '六脉神剑',
    requiredCardType: CardType.EMPTY_HAND,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 7 }, { type: 'damage', value: 7 }],
    description: '造成7点伤害×2'
  },

  // 短兵类武功招式
  nineSwords: {
    id: 'nineSwords',
    name: '独孤九剑',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9, ignoreShield: true }],
    description: '造成9点伤害，无视护盾'
  },
  evilSword: {
    id: 'evilSword',
    name: '辟邪剑法',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 5,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 8 }, { type: 'firstStrike', value: true }],
    description: '造成8点伤害，先制攻击'
  },
  goldenSnake: {
    id: 'goldenSnake',
    name: '金蛇剑法',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 6 }, { type: 'debuffAgility', value: 3, duration: 1 }],
    description: '造成6点伤害，使对方下回合轻功-3'
  },
  dogBeating: {
    id: 'dogBeating',
    name: '打狗棒法',
    requiredCardType: CardType.SHORT_WEAPON,
    mpCost: 4,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 7 }, { type: 'disableCardType', cardType: CardType.LEG, duration: 1 }],
    description: '造成7点伤害，对方下回合无法使用腿法'
  },

  // 长兵类武功招式
  yangSpear: {
    id: 'yangSpear',
    name: '杨家枪',
    requiredCardType: CardType.LONG_WEAPON,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 8 }],
    description: '造成8点伤害'
  },
  yueSpear: {
    id: 'yueSpear',
    name: '岳家枪',
    requiredCardType: CardType.LONG_WEAPON,
    mpCost: 3,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 7 }, { type: 'followUp', value: true }],
    description: '造成7点伤害，可追击一次'
  },
  overlordSpear: {
    id: 'overlordSpear',
    name: '霸王枪',
    requiredCardType: CardType.LONG_WEAPON,
    mpCost: 6,
    agilityCost: 5,
    effects: [{ type: 'damage', value: 15 }],
    description: '造成15点伤害'
  },
  madStaff: {
    id: 'madStaff',
    name: '疯魔杖法',
    requiredCardType: CardType.LONG_WEAPON,
    mpCost: 4,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 6 }, { type: 'damage', value: 6 }],
    description: '造成6点伤害×2'
  },
  windThunder: {
    id: 'windThunder',
    name: '风雷刀法',
    requiredCardType: CardType.LONG_WEAPON,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 10 }, { type: 'shield', value: 3 }],
    description: '造成10点伤害，自身获得3点护盾'
  },

  // 腿法类武功招式
  shadowlessKick: {
    id: 'shadowlessKick',
    name: '佛山无影脚',
    requiredCardType: CardType.LEG,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 9 }],
    description: '造成9点伤害'
  },
  tanLeg: {
    id: 'tanLeg',
    name: '谭腿',
    requiredCardType: CardType.LEG,
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'damage', value: 5 }],
    description: '造成5点伤害'
  },
  twelveTanLeg: {
    id: 'twelveTanLeg',
    name: '十二路谭腿',
    requiredCardType: CardType.LEG,
    mpCost: 5,
    agilityCost: 4,
    effects: [{ type: 'damage', value: 6 }, { type: 'damage', value: 6 }],
    description: '造成6点伤害×2'
  },
  chainKick: {
    id: 'chainKick',
    name: '连环迷踪腿',
    requiredCardType: CardType.LEG,
    mpCost: 4,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 5 }, { type: 'extraAction', value: true }],
    description: '造成5点伤害，可再行动一次'
  },
  springLeg: {
    id: 'springLeg',
    name: '弹腿',
    requiredCardType: CardType.LEG,
    mpCost: 3,
    agilityCost: 3,
    effects: [{ type: 'damage', value: 6 }, { type: 'debuffAgility', value: 2, duration: 1 }],
    description: '造成6点伤害，使对方下回合轻功-2'
  },

  // 特殊武功招式（任意类型手牌）
  starAbsorbing: {
    id: 'starAbsorbing',
    name: '吸星大法',
    requiredCardType: 'any',
    mpCost: 0,
    agilityCost: 3,
    effects: [{ type: 'drainMp', value: 5 }],
    description: '吸取对方5点内力'
  },
  dissolveSkill: {
    id: 'dissolveSkill',
    name: '化功大法',
    requiredCardType: 'any',
    mpCost: 0,
    agilityCost: 3,
    effects: [{ type: 'removeMp', value: 5 }],
    description: '消除对方5点内力，造成等量伤害'
  },
  northernMingSkill: {
    id: 'northernMingSkill',
    name: '北冥神功',
    requiredCardType: 'any',
    mpCost: 0,
    agilityCost: 4,
    effects: [{ type: 'drainHp', value: 8 }],
    description: '吸取对方8点体力恢复自身'
  },
  littleFormless: {
    id: 'littleFormless',
    name: '小无相功',
    requiredCardType: 'any',
    mpCost: 2,
    agilityCost: 2,
    effects: [{ type: 'mimic', value: true }],
    description: '模仿对方上次使用的武功招式'
  },
  lifeDeath: {
    id: 'lifeDeath',
    name: '生死符',
    requiredCardType: 'any',
    mpCost: 3,
    agilityCost: 2,
    effects: [{ type: 'dot', value: 3, duration: 3 }],
    description: '对方每回合失去3点体力，持续3回合'
  }
}

// ==================== 内功数据 ====================
export const passiveSkills = {
  goldenBell: {
    id: 'goldenBell',
    name: '金钟罩',
    trigger: TriggerTiming.TURN_START,
    effect: (character) => {
      character.shield += 5
      return `${character.name}的金钟罩发动，获得5点护盾`
    },
    description: '每回合开始获得5点护盾'
  },
  muscleChange: {
    id: 'muscleChange',
    name: '易筋经',
    trigger: TriggerTiming.TURN_START,
    effect: (character) => {
      character.mp = Math.min(character.maxMp, character.mp + 3)
      return `${character.name}的易筋经发动，恢复3点内力`
    },
    description: '每回合恢复3点内力'
  },
  nineYang: {
    id: 'nineYang',
    name: '九阳神功',
    trigger: TriggerTiming.TURN_START,
    effect: (character) => {
      character.hp = Math.min(character.maxHp, character.hp + 4)
      return `${character.name}的九阳神功发动，恢复4点体力`
    },
    description: '每回合恢复4点体力'
  },
  lingbo: {
    id: 'lingbo',
    name: '凌波微步',
    trigger: TriggerTiming.TURN_START,
    effect: (character) => {
      character.agilityBonus = (character.agilityBonus || 0) + 2
      return `${character.name}的凌波微步发动，轻功+2`
    },
    initEffect: (character) => {
      character.agilityBonus = 5
    },
    description: '初始轻功+5，每回合轻功+2'
  },
  northernMingPassive: {
    id: 'northernMingPassive',
    name: '北冥神功',
    trigger: TriggerTiming.ON_DAMAGE,
    effect: (character, damage) => {
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
    effect: (character, damage) => {
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
    effect: (character, damage) => {
      const reduction = Math.floor(damage * 0.25)
      return { reducedDamage: damage - reduction, message: `${character.name}的太极心法发动，伤害减少25%` }
    },
    description: '受到伤害减少25%'
  },
  qiankun: {
    id: 'qiankun',
    name: '乾坤大挪移',
    trigger: TriggerTiming.ON_TAKE_DAMAGE,
    effect: (character, damage) => {
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
    effect: (character, skill) => {
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
    effect: (character, skill, damage) => {
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
    effect: (character, card, damage) => {
      if (card.isBasicCard && damage) {
        return { bonusDamage: 2, message: `${character.name}的龙象般若功发动，基础招式伤害+2` }
      }
      return null
    },
    description: '基础招式伤害+2'
  }
}

// ==================== 武功配置 ====================
// 武功可以包含：武功招式、内功，或两者都有
export const martialArts = {
  // 降龙掌 - 有武功招式和内功
  dragonPalm: {
    id: 'dragonPalm',
    name: '降龙掌',
    skill: martialArtSkills.dragonPalm,
    passive: passiveSkills.congenital,
    description: '降龙十八掌 + 先天功'
  },
  // 太极拳 - 有武功招式和内功
  taiChi: {
    id: 'taiChi',
    name: '太极拳',
    skill: martialArtSkills.taiChiSkill,
    passive: passiveSkills.taiChiHeart,
    description: '太极拳 + 太极心法'
  },
  // 一阳指 - 有武功招式和内功
  oneYangFinger: {
    id: 'oneYangFinger',
    name: '一阳指',
    skill: martialArtSkills.oneYang,
    passive: passiveSkills.nineYin,
    description: '一阳指 + 九阴真经'
  },
  // 独孤九剑 - 有武功招式和内功
  nineSwordsStyle: {
    id: 'nineSwordsStyle',
    name: '独孤九剑',
    skill: martialArtSkills.nineSwords,
    passive: passiveSkills.qiankun,
    description: '独孤九剑 + 乾坤大挪移'
  },
  // 辟邪剑法 - 有武功招式和内功
  evilSwordStyle: {
    id: 'evilSwordStyle',
    name: '辟邪剑法',
    skill: martialArtSkills.evilSword,
    passive: passiveSkills.lingbo,
    description: '辟邪剑法 + 凌波微步'
  },
  // 打狗棒法 - 有武功招式和内功
  dogBeatingStyle: {
    id: 'dogBeatingStyle',
    name: '打狗棒法',
    skill: martialArtSkills.dogBeating,
    passive: passiveSkills.nineYang,
    description: '打狗棒法 + 九阳神功'
  },
  // 杨家枪 - 有武功招式和内功
  yangSpearStyle: {
    id: 'yangSpearStyle',
    name: '杨家枪',
    skill: martialArtSkills.yangSpear,
    passive: passiveSkills.dragonElephant,
    description: '杨家枪 + 龙象般若功'
  },
  // 霸王枪 - 有武功招式和内功
  overlordSpearStyle: {
    id: 'overlordSpearStyle',
    name: '霸王枪',
    skill: martialArtSkills.overlordSpear,
    passive: passiveSkills.congenital,
    description: '霸王枪 + 先天功'
  },
  // 佛山无影脚 - 有武功招式和内功
  shadowlessKickStyle: {
    id: 'shadowlessKickStyle',
    name: '佛山无影脚',
    skill: martialArtSkills.shadowlessKick,
    passive: passiveSkills.muscleChange,
    description: '佛山无影脚 + 易筋经'
  },
  // 生死符 - 有武功招式和内功
  lifeDeathStyle: {
    id: 'lifeDeathStyle',
    name: '生死符',
    skill: martialArtSkills.lifeDeath,
    passive: passiveSkills.northernMingPassive,
    description: '生死符 + 北冥神功'
  },
  // 少林 - 有武功招式和内功
  shaolin: {
    id: 'shaolin',
    name: '少林',
    skill: martialArtSkills.vajraPalm,
    passive: passiveSkills.goldenBell,
    description: '大力金刚掌 + 金钟罩'
  },
  // 明教 - 有武功招式和内功
  mingSect: {
    id: 'mingSect',
    name: '明教',
    skill: {
      id: 'qiankunMove',
      name: '乾坤大挪移',
      requiredCardType: 'any',
      mpCost: 4,
      agilityCost: 3,
      effects: [{ type: 'damage', value: 8 }, { type: 'shield', value: 5 }],
      description: '造成8点伤害，获得5点护盾'
    },
    passive: passiveSkills.qiankun,
    description: '乾坤大挪移(招式) + 乾坤大挪移(内功)'
  },
  // 仅内功 - 金钟罩
  goldenBellOnly: {
    id: 'goldenBellOnly',
    name: '金钟罩',
    skill: null,
    passive: passiveSkills.goldenBell,
    description: '仅内功：每回合获得5点护盾'
  },
  // 仅武功招式 - 七伤拳
  sevenInjuryOnly: {
    id: 'sevenInjuryOnly',
    name: '七伤拳',
    skill: martialArtSkills.sevenInjury,
    passive: null,
    description: '仅招式：造成8点伤害，自损2点'
  },
  // 吸星大法 - 有武功招式和内功
  starAbsorbingStyle: {
    id: 'starAbsorbingStyle',
    name: '吸星大法',
    skill: martialArtSkills.starAbsorbing,
    passive: passiveSkills.starAbsorbingPassive,
    description: '吸星大法(招式) + 吸星大法(内功)'
  },
  // 北冥神功 - 有武功招式和内功
  northernMingStyle: {
    id: 'northernMingStyle',
    name: '北冥神功',
    skill: martialArtSkills.northernMingSkill,
    passive: passiveSkills.northernMingPassive,
    description: '北冥神功(招式) + 北冥神功(内功)'
  }
}

// ==================== 角色配置 ====================
// 角色包含：名称、属性（体力、内力、轻功）、武功列表、卡组
export const characters = {
  // 乔峰 - 降龙十八掌
  qiaoFeng: {
    id: 'qiaoFeng',
    name: '乔峰',
    title: '丐帮帮主',
    description: '豪迈刚猛，掌力无双',
    hp: 65,
    mp: 20,
    agility: 10,
    martialArts: ['dragonPalm'], // 武功列表
    deck: [
      'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick', 'sweepKick',
      'jumpKick', 'jumpKick'
    ]
  },
  // 张三丰 - 太极拳
  zhangSanFeng: {
    id: 'zhangSanFeng',
    name: '张三丰',
    title: '武当祖师',
    description: '太极宗师，以柔克刚',
    hp: 60,
    mp: 25,
    agility: 10,
    martialArts: ['taiChi'],
    deck: [
      'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick', 'sweepKick',
      'jumpKick', 'jumpKick', 'jumpKick'
    ]
  },
  // 段誉 - 一阳指
  duanYu: {
    id: 'duanYu',
    name: '段誉',
    title: '大理世子',
    description: '六脉神剑，指力惊人',
    hp: 55,
    mp: 25,
    agility: 11,
    martialArts: ['oneYangFinger'],
    deck: [
      'fist', 'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick',
      'jumpKick', 'jumpKick'
    ]
  },
  // 令狐冲 - 独孤九剑
  lingHuChong: {
    id: 'lingHuChong',
    name: '令狐冲',
    title: '华山弟子',
    description: '剑法通神，独孤传人',
    hp: 55,
    mp: 20,
    agility: 11,
    martialArts: ['nineSwordsStyle'],
    deck: [
      'stab', 'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick',
      'sweepKick', 'sweepKick',
      'jumpKick', 'jumpKick'
    ]
  },
  // 林平之 - 辟邪剑法
  linPingZhi: {
    id: 'linPingZhi',
    name: '林平之',
    title: '辟邪剑客',
    description: '剑法诡奇，身法如电',
    hp: 50,
    mp: 18,
    agility: 13,
    martialArts: ['evilSwordStyle'],
    deck: [
      'stab', 'stab', 'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick', 'sweepKick'
    ]
  },
  // 洪七公 - 打狗棒法
  hongQiGong: {
    id: 'hongQiGong',
    name: '洪七公',
    title: '北丐',
    description: '丐帮帮主，棒法精妙',
    hp: 60,
    mp: 18,
    agility: 10,
    martialArts: ['dogBeatingStyle'],
    deck: [
      'stab', 'stab', 'stab', 'stab',
      'slash', 'slash', 'slash', 'slash',
      'parry', 'parry', 'parry', 'parry',
      'frontKick', 'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick', 'sweepKick', 'sweepKick'
    ]
  },
  // 杨延昭 - 杨家枪
  yangYanZhao: {
    id: 'yangYanZhao',
    name: '杨延昭',
    title: '杨家将',
    description: '杨家枪法，威震边关',
    hp: 60,
    mp: 20,
    agility: 10,
    martialArts: ['yangSpearStyle'],
    deck: [
      'sweep', 'sweep', 'sweep', 'sweep',
      'thrust', 'thrust', 'thrust', 'thrust', 'thrust',
      'stance', 'stance', 'stance', 'stance',
      'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick',
      'jumpKick', 'jumpKick'
    ]
  },
  // 项羽 - 霸王枪
  xiangYu: {
    id: 'xiangYu',
    name: '项羽',
    title: '西楚霸王',
    description: '力拔山兮，霸王神枪',
    hp: 70,
    mp: 18,
    agility: 9,
    martialArts: ['overlordSpearStyle'],
    deck: [
      'sweep', 'sweep', 'sweep', 'sweep', 'sweep',
      'thrust', 'thrust', 'thrust', 'thrust', 'thrust',
      'stance', 'stance', 'stance', 'stance',
      'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick', 'sweepKick'
    ]
  },
  // 黄飞鸿 - 佛山无影脚
  huangFeiHong: {
    id: 'huangFeiHong',
    name: '黄飞鸿',
    title: '广东狮王',
    description: '无影腿法，威震岭南',
    hp: 55,
    mp: 22,
    agility: 11,
    martialArts: ['shadowlessKickStyle'],
    deck: [
      'fist', 'fist', 'fist',
      'palm', 'palm', 'palm',
      'elbow', 'elbow',
      'frontKick', 'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick', 'sweepKick', 'sweepKick',
      'jumpKick', 'jumpKick', 'jumpKick', 'jumpKick'
    ]
  },
  // 天山童姥 - 生死符
  tongLao: {
    id: 'tongLao',
    name: '天山童姥',
    title: '天山缥缈峰',
    description: '生死符咒，令人闻风丧胆',
    hp: 50,
    mp: 25,
    agility: 12,
    martialArts: ['lifeDeathStyle'],
    deck: [
      'fist', 'fist', 'fist',
      'stab', 'stab', 'stab',
      'sweep', 'sweep', 'sweep',
      'frontKick', 'frontKick', 'frontKick',
      'palm', 'palm',
      'slash', 'slash',
      'thrust', 'thrust',
      'sweepKick', 'sweepKick'
    ]
  },
  // 少林高僧 - 金钟罩+大力金刚掌
  shaolinMonk: {
    id: 'shaolinMonk',
    name: '少林高僧',
    title: '少林寺',
    description: '少林武学，刚猛无匹',
    hp: 65,
    mp: 18,
    agility: 9,
    martialArts: ['shaolin'],
    deck: [
      'fist', 'fist', 'fist', 'fist',
      'palm', 'palm', 'palm', 'palm',
      'elbow', 'elbow', 'elbow', 'elbow',
      'frontKick', 'frontKick', 'frontKick', 'frontKick',
      'sweepKick', 'sweepKick', 'sweepKick', 'sweepKick'
    ]
  },
  // 张无忌 - 明教
  zhangWuJi: {
    id: 'zhangWuJi',
    name: '张无忌',
    title: '明教教主',
    description: '乾坤挪移，攻守兼备',
    hp: 55,
    mp: 22,
    agility: 10,
    martialArts: ['mingSect'],
    deck: [
      'fist', 'fist',
      'stab', 'stab',
      'sweep', 'sweep',
      'frontKick', 'frontKick',
      'palm', 'palm',
      'slash', 'slash',
      'thrust', 'thrust',
      'sweepKick', 'sweepKick',
      'jumpKick', 'jumpKick',
      'parry', 'parry'
    ]
  },
  // 任我行 - 吸星大法
  renWoXing: {
    id: 'renWoXing',
    name: '任我行',
    title: '日月神教',
    description: '吸星大法，吸取敌人内力',
    hp: 55,
    mp: 25,
    agility: 10,
    martialArts: ['starAbsorbingStyle'],
    deck: [
      'fist', 'fist', 'fist',
      'stab', 'stab', 'stab',
      'sweep', 'sweep',
      'frontKick', 'frontKick', 'frontKick',
      'palm', 'palm',
      'slash', 'slash',
      'sweepKick', 'sweepKick',
      'jumpKick', 'jumpKick',
      'parry', 'parry'
    ]
  },
  // 虚竹 - 北冥神功
  xuZhu: {
    id: 'xuZhu',
    name: '虚竹',
    title: '灵鹫宫主',
    description: '北冥神功，吸取敌人体力',
    hp: 55,
    mp: 25,
    agility: 10,
    martialArts: ['northernMingStyle'],
    deck: [
      'fist', 'fist', 'fist',
      'palm', 'palm', 'palm',
      'stab', 'stab',
      'frontKick', 'frontKick',
      'sweep', 'sweep',
      'slash', 'slash',
      'sweepKick', 'sweepKick',
      'jumpKick', 'jumpKick',
      'parry', 'parry'
    ]
  }
}

// 获取角色的所有武功
export function getCharacterMartialArts(characterId) {
  const character = characters[characterId]
  if (!character) return []

  return character.martialArts.map(artId => {
    const art = martialArts[artId]
    return {
      id: artId,
      name: art.name,
      skill: art.skill,
      passive: art.passive,
      description: art.description
    }
  })
}

// 创建角色卡组
export function createCharacterDeck(characterId) {
  const character = characters[characterId]
  if (!character) return []

  return [...character.deck]
}