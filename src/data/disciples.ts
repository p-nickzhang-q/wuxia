import { DiscipleTemplate, DiscipleRealm } from '../game/types'

// ==================== 弟子模板数据 ====================
export const discipleTemplates: Record<string, DiscipleTemplate> = {
  // ========== 力量型弟子 ==========
  ironArm: {
    id: 'ironArm',
    name: '铁臂少年',
    description: '天生臂力过人，空手拳脚威力惊人，适合修炼刚猛武功',
    rootRange: [4, 7],
    insightRange: [3, 6],
    willRange: [3, 5],
    strengthRange: [7, 10],
    agilityRange: [3, 6],
    initialSkills: ['dragonPalm', 'tianShanLiuYang'],
    initialPassive: 'haMaPassive',
    recruitCost: 200,
    minReputation: 0
  },

  // ========== 内功型弟子 ==========
  calmHeart: {
    id: 'calmHeart',
    name: '静心少女',
    description: '心性稳定，定力超群，内功修炼事半功倍',
    rootRange: [4, 7],
    insightRange: [5, 8],
    willRange: [7, 10],
    strengthRange: [3, 5],
    agilityRange: [4, 7],
    initialSkills: ['taiChiSkill', 'kongMing'],
    initialPassive: 'nineYang',
    recruitCost: 250,
    minReputation: 50
  },

  // ========== 学习型弟子 ==========
  quickMind: {
    id: 'quickMind',
    name: '机灵小子',
    description: '悟性极高，学习武功速度远超常人',
    rootRange: [3, 6],
    insightRange: [8, 10],
    willRange: [4, 7],
    strengthRange: [4, 7],
    agilityRange: [5, 8],
    initialSkills: ['nineSwords', 'tanZhi'],
    initialPassive: 'ziXia',
    recruitCost: 300,
    minReputation: 100
  },

  // ========== 成长型弟子 ==========
  strongBone: {
    id: 'strongBone',
    name: '强骨汉子',
    description: '根骨奇佳，属性成长潜力巨大，适合长期培养',
    rootRange: [8, 10],
    insightRange: [3, 5],
    willRange: [4, 7],
    strengthRange: [4, 7],
    agilityRange: [3, 6],
    initialSkills: ['dragonPalm', 'oneYang'],
    initialPassive: 'congenital',
    recruitCost: 400,
    minReputation: 150
  },

  // ========== 轻功型弟子 ==========
  swiftBody: {
    id: 'swiftBody',
    name: '灵动少年',
    description: '身法敏捷，轻功天赋出众，行动如风',
    rootRange: [3, 6],
    insightRange: [5, 8],
    willRange: [3, 6],
    strengthRange: [3, 5],
    agilityRange: [8, 10],
    initialSkills: ['lingbo', 'luoYing'],
    initialPassive: 'lingbo',
    recruitCost: 350,
    minReputation: 100
  },

  // ========== 均衡型弟子 ==========
  balanced: {
    id: 'balanced',
    name: '均衡学徒',
    description: '各属性均衡，适应性强，可修炼多种武功流派',
    rootRange: [5, 7],
    insightRange: [5, 7],
    willRange: [5, 7],
    strengthRange: [5, 7],
    agilityRange: [5, 7],
    initialSkills: ['taiChiSkill', 'kongMing', 'oneYang'],
    initialPassive: 'taiChiHeart',
    recruitCost: 150,
    minReputation: 0
  },

  // ========== 剑法型弟子 ==========
  swordHeart: {
    id: 'swordHeart',
    name: '剑心少年',
    description: '对剑法有天然领悟，适合修炼剑类武功',
    rootRange: [4, 7],
    insightRange: [6, 9],
    willRange: [4, 7],
    strengthRange: [3, 6],
    agilityRange: [5, 8],
    initialSkills: ['nineSwords', 'yuNu', 'shuangJian'],
    initialPassive: 'yuNuXin',
    recruitCost: 280,
    minReputation: 80
  },

  // ========== 暗器型弟子 ==========
  hiddenHand: {
    id: 'hiddenHand',
    name: '暗手少年',
    description: '擅长暗器指法，弹指神通天赋出众',
    rootRange: [3, 6],
    insightRange: [6, 9],
    willRange: [4, 7],
    strengthRange: [4, 7],
    agilityRange: [6, 9],
    initialSkills: ['tanZhi', 'xiuHuaZhen'],
    initialPassive: 'douZhuanPassive',
    recruitCost: 200,
    minReputation: 50
  }
}

// ==================== 境界配置 ====================
export const realmConfig: Record<DiscipleRealm, {
  skillSlots: number        // 可装备武功招式数量
  expToNextLevel: number    // 每级需要经验
  maxLevel: number          // 最大等级
  breakthroughCost: number  // 境界突破花费（银两）
}> = {
  [DiscipleRealm.OUTER]: {
    skillSlots: 1,
    expToNextLevel: 100,
    maxLevel: 10,
    breakthroughCost: 500
  },
  [DiscipleRealm.INNER]: {
    skillSlots: 2,
    expToNextLevel: 200,
    maxLevel: 10,
    breakthroughCost: 1000
  },
  [DiscipleRealm.DISCIPLE]: {
    skillSlots: 3,
    expToNextLevel: 400,
    maxLevel: 10,
    breakthroughCost: 2000
  },
  [DiscipleRealm.ELDER]: {
    skillSlots: 4,
    expToNextLevel: 800,
    maxLevel: 10,
    breakthroughCost: 0  // 已是最高境界
  }
}