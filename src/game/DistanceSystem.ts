/**
 * 距离系统 - 圆形布局的距离计算和目标选择
 * 参考：三国杀距离系统
 */

import { CharacterState, BattleMode } from '../game/types'

/**
 * 计算两个座位之间的圆形距离
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
    if (char.hp <= 0) return false
    // 排除非敌人
    if (!isEnemy(actor, char, battleMode)) return false
    // 检查距离
    if (!actor.battlePosition || !char.battlePosition) return false
    const distance = calculateDistance(
      actor.battlePosition.seatIndex,
      char.battlePosition.seatIndex,
      totalSeats
    )
    return distance <= range
  })
}

/**
 * 分配座位位置（适配左右布局的圆形距离）
 *
 * 左右布局的座位分配逻辑：
 * - 座位按圆形排列，但UI显示为左右两边
 * - 距离计算仍按圆形最短路径
 *
 * 座位示意（3v3）：
 *   左边(玩家)        右边(敌人)
 *   座位5 ← ─ ─ ─ ─ → 座位0
 *   座位4              座位1
 *   座位3 ─ ─ ─ ─ ─ → 座位2
 *
 * 这样：同侧相邻距离=1，对角距离=3
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
    // 混战模式：交替分配
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