/**
 * 音频管理器
 * 使用 Web Audio API 合成音效
 */

import { GameEventType } from '../game/types'
import { eventManager } from './EventManager'

// 音效类型
export type SoundType =
  | 'card_play'      // 使用卡牌
  | 'skill_use'      // 使用武功招式
  | 'damage'         // 造成伤害
  | 'shield'         // 获得护盾
  | 'heal'           // 治疗
  | 'passive'        // 内功触发
  | 'victory'        // 胜利
  | 'defeat'         // 失败
  | 'button_click'   // 按钮点击
  | 'card_draw'      // 抽牌
  | 'turn_start'     // 回合开始

// 合成音效配置
interface SynthConfig {
  frequency: number
  duration: number
  type: OscillatorType
  volume: number
  attack?: number
  decay?: number
  sweep?: boolean
  harmonics?: number[]
  detune?: number
}

// 合成音效配置映射 - 优化后的参数
const SYNTH_CONFIGS: Record<SoundType, SynthConfig> = {
  // 卡牌使用：清脆的"嗖"声
  card_play: {
    frequency: 1200,
    duration: 0.1,
    type: 'sine',
    volume: 0.3,
    attack: 0.005,
    sweep: true
  },
  // 武功招式：有力的能量声
  skill_use: {
    frequency: 300,
    duration: 0.25,
    type: 'sawtooth',
    volume: 0.25,
    attack: 0.02,
    sweep: true,
    harmonics: [1, 1.5]
  },
  // 伤害：低沉的打击声
  damage: {
    frequency: 100,
    duration: 0.2,
    type: 'square',
    volume: 0.4,
    attack: 0.005,
    harmonics: [1, 1.5]
  },
  // 护盾：金属感的声音
  shield: {
    frequency: 800,
    duration: 0.15,
    type: 'sine',
    volume: 0.25,
    attack: 0.01,
    harmonics: [1, 2.5, 4]
  },
  // 治疗：柔和的上升音
  heal: {
    frequency: 400,
    duration: 0.35,
    type: 'sine',
    volume: 0.25,
    attack: 0.05,
    sweep: true,
    harmonics: [1, 1.5]
  },
  // 内功触发：神秘感的声音
  passive: {
    frequency: 600,
    duration: 0.3,
    type: 'sine',
    volume: 0.3,
    attack: 0.03,
    sweep: true,
    harmonics: [1, 2]
  },
  // 胜利：上升的欢快音
  victory: {
    frequency: 400,
    duration: 0.5,
    type: 'sine',
    volume: 0.35,
    attack: 0.05,
    sweep: true,
    harmonics: [1, 1.25, 1.5, 2]
  },
  // 失败：下降的低沉音
  defeat: {
    frequency: 200,
    duration: 0.6,
    type: 'sine',
    volume: 0.35,
    attack: 0.1,
    sweep: true
  },
  // 按钮点击：短促清脆
  button_click: {
    frequency: 1500,
    duration: 0.04,
    type: 'sine',
    volume: 0.2,
    attack: 0.002
  },
  // 抽牌：快速的滑动声
  card_draw: {
    frequency: 800,
    duration: 0.08,
    type: 'sine',
    volume: 0.2,
    attack: 0.005,
    sweep: true
  },
  // 回合开始：提示音
  turn_start: {
    frequency: 500,
    duration: 0.12,
    type: 'sine',
    volume: 0.25,
    attack: 0.01,
    harmonics: [1, 2]
  }
}

class AudioManager {
  private audioContext: AudioContext | null = null
  private masterVolume: GainNode | null = null
  private sfxVolume: number = 0.7
  private isMuted: boolean = false
  private isInitialized: boolean = false
  private eventHandlers: Map<GameEventType, (event: any) => void> = new Map()

  /**
   * 初始化音频系统
   */
  async init(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
      this.masterVolume = this.audioContext.createGain()
      this.masterVolume.connect(this.audioContext.destination)
      this.masterVolume.gain.value = 1

      this.subscribeToEvents()
      this.isInitialized = true
      console.log('[AudioManager] 初始化完成')
    } catch (error) {
      console.error('[AudioManager] 初始化失败:', error)
    }
  }

  /**
   * 订阅游戏事件
   */
  private subscribeToEvents(): void {
    this.addEventHandler(GameEventType.CARD_PLAYED, () => this.playSfx('card_play'))
    this.addEventHandler(GameEventType.SKILL_USED, () => this.playSfx('skill_use'))
    this.addEventHandler(GameEventType.CHARACTER_DAMAGED, (event) => {
      if (!event.data?.absorbed) this.playSfx('damage')
    })
    this.addEventHandler(GameEventType.CHARACTER_SHIELD, () => this.playSfx('shield'))
    this.addEventHandler(GameEventType.CHARACTER_HEALED, () => this.playSfx('heal'))
    this.addEventHandler(GameEventType.PASSIVE_TRIGGERED, () => this.playSfx('passive'))
    this.addEventHandler(GameEventType.CARD_DRAWN, () => this.playSfx('card_draw'))
    this.addEventHandler(GameEventType.TURN_START, () => this.playSfx('turn_start'))
    this.addEventHandler(GameEventType.GAME_END, (event) => {
      this.playSfx(event.data?.playerWon ? 'victory' : 'defeat')
    })
  }

  private addEventHandler(type: GameEventType, handler: (event: any) => void): void {
    eventManager.on(type, handler)
    this.eventHandlers.set(type, handler)
  }

  /**
   * 播放合成音效
   */
  playSfx(type: SoundType): void {
    if (!this.audioContext || !this.masterVolume || this.isMuted) return

    const config = SYNTH_CONFIGS[type]
    if (!config) return

    try {
      const now = this.audioContext.currentTime
      const attack = config.attack ?? 0.01

      // 创建音量包络
      const gainNode = this.audioContext.createGain()
      gainNode.connect(this.masterVolume)
      gainNode.gain.setValueAtTime(0, now)
      gainNode.gain.linearRampToValueAtTime(config.volume * this.sfxVolume, now + attack)
      gainNode.gain.exponentialRampToValueAtTime(0.001, now + config.duration)

      // 谐波振荡器
      if (config.harmonics && config.harmonics.length > 0) {
        config.harmonics.forEach((harmonic) => {
          const osc = this.audioContext!.createOscillator()
          osc.type = config.type
          osc.frequency.value = config.frequency * harmonic

          if (config.sweep) {
            osc.frequency.setValueAtTime(config.frequency * harmonic, now)
            osc.frequency.exponentialRampToValueAtTime(
              config.frequency * harmonic * 1.5,
              now + config.duration
            )
          }

          osc.connect(gainNode)
          osc.start(now)
          osc.stop(now + config.duration)
        })
      } else {
        // 单振荡器
        const osc = this.audioContext.createOscillator()
        osc.type = config.type
        osc.frequency.value = config.frequency

        if (config.sweep) {
          osc.frequency.setValueAtTime(config.frequency, now)
          osc.frequency.exponentialRampToValueAtTime(
            config.frequency * 1.5,
            now + config.duration
          )
        }

        osc.connect(gainNode)
        osc.start(now)
        osc.stop(now + config.duration)
      }
    } catch (error) {
      console.warn(`[AudioManager] 播放音效失败: ${type}`, error)
    }
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): void {
    this.sfxVolume = Math.max(0, Math.min(1, volume))
  }

  /**
   * 获取音量
   */
  getVolume(): number {
    return this.sfxVolume
  }

  /**
   * 设置静音
   */
  setMuted(muted: boolean): void {
    this.isMuted = muted
    if (this.masterVolume) {
      this.masterVolume.gain.value = muted ? 0 : 1
    }
  }

  /**
   * 是否静音
   */
  getMuted(): boolean {
    return this.isMuted
  }

  /**
   * 恢复 AudioContext
   */
  resume(): void {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume()
    }
  }

  /**
   * 销毁
   */
  destroy(): void {
    // 取消所有事件订阅
    this.eventHandlers.forEach((handler, type) => {
      eventManager.off(type, handler)
    })
    this.eventHandlers.clear()

    if (this.audioContext) {
      this.audioContext.close()
      this.audioContext = null
    }
    this.masterVolume = null
    this.isInitialized = false
  }
}

export const audioManager = new AudioManager()