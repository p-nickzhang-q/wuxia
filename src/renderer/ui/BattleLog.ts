import { Container, Graphics, Text } from 'pixi.js'
import { Colors, Renderer } from '../Renderer'
import { LayoutConstants } from '../LayoutConstants'
import { BattleLogEntry } from '../../game/types'

interface LogEntry {
  container: Container
  targetX: number
  animating: boolean
}

/**
 * 战斗日志组件
 */
export class BattleLog extends Container {
  private background: Graphics
  private logs: LogEntry[] = []
  private scrollOffset: number = 0
  private maxVisibleLogs: number = 8
  private logWidth: number
  private logHeight: number
  private lineHeight: number

  constructor(renderer: Renderer) {
    super()
    this.logWidth = LayoutConstants.logWidth()
    this.logHeight = LayoutConstants.logHeight()
    this.lineHeight = LayoutConstants.scaleValue(22)

    this.background = renderer.createGraphics()
    this.drawBackground()
    this.addChild(this.background)
  }

  private drawBackground(): void {
    this.background.clear()
    this.background.roundRect(0, 0, this.logWidth, this.logHeight, 8)
    this.background.fill({ color: Colors.PANEL_BG, alpha: 0.9 })
    this.background.stroke({ color: Colors.TEXT_SECONDARY, width: 1 })
  }

  addLog(entry: BattleLogEntry | string): void {
    const logEntry: BattleLogEntry = typeof entry === 'string'
      ? { id: Date.now() + Math.random(), text: entry, time: new Date().toLocaleTimeString() }
      : entry

    const container = new Container()
    const text = new Text({
      text: logEntry.text,
      style: {
        fontSize: LayoutConstants.scaleValue(14),
        fill: Colors.TEXT_PRIMARY,
        wordWrap: true,
        wordWrapWidth: this.logWidth - 20
      }
    })
    text.x = 10
    text.y = 0
    container.addChild(text)
    container.x = -this.logWidth
    container.alpha = 0
    this.addChild(container)

    const targetY = this.logs.length * this.lineHeight + 5 - this.scrollOffset * this.lineHeight
    container.y = targetY

    this.logs.push({
      container,
      targetX: 0,
      animating: true
    })

    if (this.logs.length > this.maxVisibleLogs) {
      this.scrollOffset = this.logs.length - this.maxVisibleLogs
      this.updatePositions()
    }

    this.animateLogs()
  }

  private animateLogs(): void {
    const animationSpeed = 0.15
    let stillAnimating = false

    for (const log of this.logs) {
      if (log.animating) {
        if (log.container.x !== log.targetX) {
          const diff = log.targetX - log.container.x
          log.container.x += diff * animationSpeed
          if (Math.abs(diff) < 0.5) {
            log.container.x = log.targetX
          } else {
            stillAnimating = true
          }
        }
        if (log.container.alpha < 1) {
          log.container.alpha += animationSpeed
          if (log.container.alpha >= 1) {
            log.container.alpha = 1
          } else {
            stillAnimating = true
          }
        }
      }
    }

    if (stillAnimating) {
      requestAnimationFrame(() => this.animateLogs())
    }
  }

  private updatePositions(): void {
    for (let i = 0; i < this.logs.length; i++) {
      const log = this.logs[i]
      const targetY = i * this.lineHeight + 5 - this.scrollOffset * this.lineHeight
      log.container.y = targetY
    }
  }

  clear(): void {
    this.logs.forEach(log => {
      this.removeChild(log.container)
      log.container.destroy()
    })
    this.logs = []
    this.scrollOffset = 0
  }

  resize(): void {
    this.logWidth = LayoutConstants.logWidth()
    this.logHeight = LayoutConstants.logHeight()
    this.drawBackground()
  }

  getLogCount(): number {
    return this.logs.length
  }

  syncLog(text: string): void {
    const entry: BattleLogEntry = {
      id: Date.now() + Math.random(),
      text,
      time: new Date().toLocaleTimeString()
    }
    this.addLog(entry)
  }
}