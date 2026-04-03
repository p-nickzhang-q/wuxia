/**
 * 距离系统 - 圆形布局的距离计算和目标选择
 * 参考：三国杀距离系统
 */

import { CharacterState, BattleMode } from '../game/types'

/**
 * 计算两个座位之间的物理距离（不考虑死亡）
 * @param seatA 座位A的索引
 * @param seatB 座位B的索引
 * @param totalSeats 总座位数
 * @returns 距离值（相邻=1，隔1人=2，以此类推）
 */
export function calculateDistance(seatA: number, seatB: number, totalSeats: number): number {
  const diff = Math.abs(seatA - seatB)
  return Math.min(diff, totalSeats - diff)
}

/**
 * 计算两个座位之间的实际距离（跳过死亡角色）
 * 在圆形布局中，死亡的角色不计入距离
 * @param seatA 座位A的索引
 * @param seatB 座位B的索引
 * @param allCharacters 所有角色列表
 * @param totalSeats 总座位数
 * @returns 实际距离值
 */
export function calculateActualDistance(
  seatA: number,
  seatB: number,
  allCharacters: CharacterState[],
  totalSeats: number
): number {
  if (seatA === seatB) return 0

  // 构建座位到存活状态的映射
  const aliveSeats = new Set<number>()
  allCharacters.forEach(char => {
    if (char.isAlive() && char.battlePosition) {
      aliveSeats.add(char.battlePosition.seatIndex)
    }
  })

  // 计算顺时针和逆时针两个方向的距离，取最小值
  let clockwiseDist = 0
  let currentSeat = seatA
  while (currentSeat !== seatB) {
    currentSeat = (currentSeat + 1) % totalSeats
    if (aliveSeats.has(currentSeat) || currentSeat === seatB) {
      clockwiseDist++
    }
  }

  let counterClockwiseDist = 0
  currentSeat = seatA
  while (currentSeat !== seatB) {
    currentSeat = (currentSeat - 1 + totalSeats) % totalSeats
    if (aliveSeats.has(currentSeat) || currentSeat === seatB) {
      counterClockwiseDist++
    }
  }

  return Math.min(clockwiseDist, counterClockwiseDist)
}

/**
 * 判断两个角色是否为敌人关系
 * @param charA 角色A
 * @param charB 角色B
 * @param battleMode 战斗模式
 * @returns 是否为敌人
 */
export function isEnemy(
  charA: CharacterState,
  charB: CharacterState,
  battleMode: BattleMode
): boolean {
  if (battleMode === 'freeforall') {
    return charA.id !== charB.id  // 混战模式：所有人都是敌人
  }
  // 阵营对战：不同队伍为敌人
  return charA.battlePosition?.team !== charB.battlePosition?.team
}

/**
 * 获取指定范围内的所有目标
 * @param actor 行动角色
 * @param range 攻击范围
 * @param allCharacters 所有角色
 * @param totalSeats 总座位数
 * @param battleMode 战斗模式
 * @returns 范围内的敌方角色列表
 */
export function getTargetsInRange(
  actor: CharacterState,
  range: number,
  allCharacters: CharacterState[],
  totalSeats: number,
  battleMode: BattleMode
): CharacterState[] {
  return allCharacters.filter(char => {
    // 排除死亡角色
    if (!char.isAlive()) return false
    // 排除自己
    if (char.id === actor.id) return false
    // 排除非敌人
    if (!isEnemy(actor, char, battleMode)) return false
    // 检查距离
    if (!actor.battlePosition || !char.battlePosition) return false
    const distance = calculateActualDistance(
      actor.battlePosition.seatIndex,
      char.battlePosition.seatIndex,
      allCharacters,
      totalSeats
    )
    return distance <= range
  })
}

/**
 * 分配座位位置（适配左右布局的圆形距离）
 *
 * 座位示意（3v3 阵营对战）：
 *   左边(玩家)        右边(敌人)
 *   座位5 ← ─ ─ ─ ─ → 座位0
 *   座位4              座位1
 *   座位3 ─ ─ ─ ─ ─ → 座位2
 *
 * 混战模式（3v3）：
 *   座位按圆形排列，UI上左右交错显示
 *   座位0(左) ─ 座位1(右)
 *   座位2(右) ─ 座位3(左)
 *   座位4(左) ─ 座位5(右)
 *
 * @param playerTeam 玩家队伍
 * @param enemyTeam 敌人队伍
 * @param battleMode 战斗模式
 */
export function assignSeats(
  playerTeam: CharacterState[],
  enemyTeam: CharacterState[],
  battleMode: BattleMode
): void {
  const totalSeats = playerTeam.length + enemyTeam.length

  if (battleMode === 'team') {
    // 阵营对战：左右分布
    // 敌人在右边（座位0到enemyCount-1，从上到下）
    enemyTeam.forEach((char, index) => {
      char.battlePosition = {
        seatIndex: index,
        team: 'enemy'
      }
    })
    // 玩家在左边（座位从totalSeats-1往下，形成圆形闭环）
    playerTeam.forEach((char, index) => {
      char.battlePosition = {
        seatIndex: totalSeats - 1 - index,
        team: 'player'
      }
    })
  } else {
    // 混战模式：敌我交替分配座位
    // 敌人0(座位0)、玩家0(座位1)、敌人1(座位2)、玩家1(座位3)...
    // UI上：偶数座位在左，奇数座位在右
    let seatIndex = 0
    const maxLength = Math.max(playerTeam.length, enemyTeam.length)
    for (let i = 0; i < maxLength; i++) {
      if (i < enemyTeam.length) {
        enemyTeam[i].battlePosition = {
          seatIndex: seatIndex++,
          team: null
        }
      }
      if (i < playerTeam.length) {
        playerTeam[i].battlePosition = {
          seatIndex: seatIndex++,
          team: null
        }
      }
    }
  }
}

/**
 * 计算圆形布局中的屏幕坐标
 * @param seatIndex 座位索引
 * @param totalSeats 总座位数
 * @param centerX 圆心X坐标
 * @param centerY 圆心Y坐标
 * @param radius 圆的半径
 * @returns 屏幕坐标 {x, y}
 */
export function getSeatPosition(
  seatIndex: number,
  totalSeats: number,
  centerX: number,
  centerY: number,
  radius: number
): { x: number; y: number } {
  // 从顶部开始，顺时针排列
  const angle = (seatIndex / totalSeats) * Math.PI * 2 - Math.PI / 2
  return {
    x: centerX + Math.cos(angle) * radius,
    y: centerY + Math.sin(angle) * radius
  }
}

/**
 * 格式化距离显示
 * @param distance 距离值
 * @returns 距离描述
 */
export function formatDistance(distance: number): string {
  if (distance === 1) return '相邻'
  if (distance === 2) return '隔1人'
  if (distance === 3) return '隔2人'
  return `距离${distance}`
}