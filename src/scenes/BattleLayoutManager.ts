import { Container } from 'pixi.js'
import { CharacterState } from '../game/types'
import { Renderer } from '../renderer/Renderer'
import { CharacterRenderer } from '../renderer/CharacterRenderer'
import { MiniCharacterRenderer } from '../renderer/MiniCharacterRenderer'
import { LayoutConstants } from '../renderer/LayoutConstants'

/**
 * 战斗布局管理器
 * 负责角色面板的创建和布局计算
 */
export class BattleLayoutManager {
  private renderer: Renderer
  private characterRenderers: Map<string, CharacterRenderer | MiniCharacterRenderer>
  private container: Container

  constructor(renderer: Renderer, container: Container, characterRenderers: Map<string, CharacterRenderer | MiniCharacterRenderer>) {
    this.renderer = renderer
    this.container = container
    this.characterRenderers = characterRenderers
  }

  /**
   * 创建角色面板
   */
  createCharacterPanels(
    characters: CharacterState[],
    bottomAreaHeight: number,
    sidebarWidth: number,
    isMultiBattle: boolean,
    isPlayerTeam: (char: CharacterState) => boolean,
    onPanelClick: (charId: string, renderer: Renderer) => void
  ): void {
    if (isMultiBattle) {
      this.createMultiPlayerLayout(characters, bottomAreaHeight, sidebarWidth, isPlayerTeam, onPanelClick)
    } else {
      this.createTraditionalLayout(characters, bottomAreaHeight, sidebarWidth, isPlayerTeam, onPanelClick)
    }
  }

  /**
   * 1v1 传统布局
   */
  private createTraditionalLayout(
    characters: CharacterState[],
    bottomAreaHeight: number,
    sidebarWidth: number,
    isPlayerTeam: (char: CharacterState) => boolean,
    onPanelClick: (charId: string, renderer: Renderer) => void
  ): void {
    const size = this.renderer.getSize()
    const availableWidth = size.width - sidebarWidth

    // 玩家和敌人
    const playerTeam = characters.filter(c => isPlayerTeam(c))
    const enemyTeam = characters.filter(c => !isPlayerTeam(c))

    const panelWidth = LayoutConstants.panelWidth()
    const portraitHeight = LayoutConstants.portraitHeight()
    const panelHeight = portraitHeight + 100 // 立绘 + 信息区域

    // 玩家在左，敌人右
    const playerX = 50
    const enemyX = availableWidth - panelWidth - 50

    const centerY = (size.height - bottomAreaHeight - panelHeight) / 2

    // 创建玩家面板
    if (playerTeam.length > 0) {
      const player = playerTeam[0]
      const renderer = new CharacterRenderer(player, false, this.renderer)
      renderer.x = playerX
      renderer.y = centerY
      this.setupPanelClick(renderer, player.id, onPanelClick)
      this.container.addChild(renderer)
      this.characterRenderers.set(player.id, renderer)
    }

    // 创建敌人面板
    if (enemyTeam.length > 0) {
      const enemy = enemyTeam[0]
      const renderer = new CharacterRenderer(enemy, true, this.renderer)
      renderer.x = enemyX
      renderer.y = centerY
      this.setupPanelClick(renderer, enemy.id, onPanelClick)
      this.container.addChild(renderer)
      this.characterRenderers.set(enemy.id, renderer)
    }
  }

  /**
   * 多人战斗布局（迷你面板）
   */
  private createMultiPlayerLayout(
    characters: CharacterState[],
    bottomAreaHeight: number,
    sidebarWidth: number,
    isPlayerTeam: (char: CharacterState) => boolean,
    onPanelClick: (charId: string, renderer: Renderer) => void
  ): void {
    const size = this.renderer.getSize()
    const availableWidth = size.width - sidebarWidth

    const panelWidth = LayoutConstants.miniPanelWidth()
    const panelHeight = LayoutConstants.miniPanelHeight()
    const panelMarginH = availableWidth * 0.03
    const panelSpacing = 8

    // 玩家团队左边，敌人团队右边
    const playerTeam = characters.filter(c => isPlayerTeam(c))
    const enemyTeam = characters.filter(c => !isPlayerTeam(c))

    const playerHeight = playerTeam.length * panelHeight + (playerTeam.length - 1) * panelSpacing
    const enemyHeight = enemyTeam.length * panelHeight + (enemyTeam.length - 1) * panelSpacing
    const maxHeight = Math.max(playerHeight, enemyHeight)

    const baseY = (size.height - bottomAreaHeight - maxHeight) / 2

    // 玩家团队（左边）
    playerTeam.forEach((char, index) => {
      const renderer = new MiniCharacterRenderer(char, false, this.renderer)
      renderer.x = panelMarginH
      renderer.y = baseY + index * (panelHeight + panelSpacing)
      this.setupMiniPanelClick(renderer, char.id, onPanelClick)
      this.container.addChild(renderer)
      this.characterRenderers.set(char.id, renderer)
    })

    // 敌人团队（右边）
    enemyTeam.forEach((char, index) => {
      const renderer = new MiniCharacterRenderer(char, true, this.renderer)
      renderer.x = availableWidth - panelWidth - panelMarginH
      renderer.y = baseY + index * (panelHeight + panelSpacing)
      this.setupMiniPanelClick(renderer, char.id, onPanelClick)
      this.container.addChild(renderer)
      this.characterRenderers.set(char.id, renderer)
    })
  }

  /**
   * 设置普通面板点击
   */
  private setupPanelClick(
    renderer: CharacterRenderer,
    charId: string,
    onPanelClick: (charId: string, renderer: Renderer) => void
  ): void {
    renderer.eventMode = 'static'
    renderer.cursor = 'pointer'
    renderer.on('pointerdown', () => {
      onPanelClick(charId, this.renderer)
    })
  }

  /**
   * 设置迷你面板点击
   */
  private setupMiniPanelClick(
    renderer: MiniCharacterRenderer,
    charId: string,
    onPanelClick: (charId: string, renderer: Renderer) => void
  ): void {
    renderer.eventMode = 'static'
    renderer.cursor = 'pointer'
    renderer.on('pointerdown', () => {
      onPanelClick(charId, this.renderer)
    })
  }

  /**
   * 处理窗口resize
   */
  handleResize(
    characters: CharacterState[],
    bottomAreaHeight: number,
    sidebarWidth: number,
    isMultiBattle: boolean,
    isPlayerTeam: (char: CharacterState) => boolean
  ): void {
    const size = this.renderer.getSize()
    const availableWidth = size.width - sidebarWidth

    if (isMultiBattle) {
      this.resizeMultiPlayerLayout(characters, bottomAreaHeight, availableWidth, isPlayerTeam)
    } else {
      this.resizeTraditionalLayout(characters, bottomAreaHeight, availableWidth)
    }
  }

  /**
   * resize 传统布局
   */
  private resizeTraditionalLayout(
    _characters: CharacterState[],
    bottomAreaHeight: number,
    availableWidth: number
  ): void {
    const size = this.renderer.getSize()
    const panelWidth = LayoutConstants.panelWidth()
    const portraitHeight = LayoutConstants.portraitHeight()
    const panelHeight = portraitHeight + 100

    const centerY = (size.height - bottomAreaHeight - panelHeight) / 2

    this.characterRenderers.forEach((renderer, _id) => {
      renderer.x = renderer.x < availableWidth / 2 ? 50 : availableWidth - panelWidth - 50
      renderer.y = centerY
    })
  }

  /**
   * resize 多人布局
   */
  private resizeMultiPlayerLayout(
    characters: CharacterState[],
    bottomAreaHeight: number,
    availableWidth: number,
    isPlayerTeam: (char: CharacterState) => boolean
  ): void {
    const size = this.renderer.getSize()
    const panelHeight = LayoutConstants.miniPanelHeight()
    const panelSpacing = 8
    const panelMarginH = availableWidth * 0.03

    const playerTeam = characters.filter(c => isPlayerTeam(c))
    const enemyTeam = characters.filter(c => !isPlayerTeam(c))

    const maxHeight = Math.max(
      playerTeam.length * panelHeight + (playerTeam.length - 1) * panelSpacing,
      enemyTeam.length * panelHeight + (enemyTeam.length - 1) * panelSpacing
    )

    const baseY = (size.height - bottomAreaHeight - maxHeight) / 2

    playerTeam.forEach((char, index) => {
      const renderer = this.characterRenderers.get(char.id)
      if (renderer) {
        renderer.x = panelMarginH
        renderer.y = baseY + index * (panelHeight + panelSpacing)
      }
    })

    enemyTeam.forEach((char, index) => {
      const renderer = this.characterRenderers.get(char.id)
      if (renderer) {
        renderer.x = availableWidth - LayoutConstants.miniPanelWidth() - panelMarginH
        renderer.y = baseY + index * (panelHeight + panelSpacing)
      }
    })
  }

  /**
   * 销毁所有渲染器
   */
  destroy(): void {
    this.characterRenderers.forEach(renderer => {
      renderer.destroy()
    })
    this.characterRenderers.clear()
  }
}