<template>
  <div class="app">
    <div v-if="!gameStarted" class="character-select">
      <h1>武侠卡牌对战</h1>
      <p class="subtitle">选择你的角色</p>
      <div class="characters-grid">
        <div
          v-for="(character, key) in characters"
          :key="key"
          class="character-card"
          :class="{ selected: selectedCharacter === key }"
          @click="selectCharacter(key)"
        >
          <div class="char-name">{{ character.name }}</div>
          <div class="char-title">{{ character.title }}</div>
          <div class="char-desc">{{ character.description }}</div>
          <div class="char-stats">
            <span class="stat"><span class="stat-label">体力</span>{{ character.hp }}</span>
            <span class="stat"><span class="stat-label">内力</span>{{ character.mp }}</span>
            <span class="stat"><span class="stat-label">轻功</span>{{ character.agility }}</span>
          </div>
          <div class="char-martial-arts">
            <div v-for="artId in character.martialArts" :key="artId" class="martial-art-tag">
              {{ getMartialArtName(artId) }}
            </div>
          </div>
        </div>
      </div>

      <!-- 显示选中角色的武功详情 -->
      <div v-if="selectedCharacter" class="selected-detail">
        <h3>{{ characters[selectedCharacter].name }} - 武功详情</h3>
        <div class="martial-arts-detail">
          <div v-for="artId in characters[selectedCharacter].martialArts" :key="artId" class="art-detail">
            <div class="art-name">{{ getMartialArtName(artId) }}</div>
            <div class="art-components">
              <div v-if="getMartialArtSkill(artId)" class="component skill">
                <span class="comp-label">武功招式</span>
                <span class="comp-name">{{ getMartialArtSkill(artId).name }}</span>
                <span class="comp-desc">{{ getMartialArtSkill(artId).description }}</span>
              </div>
              <div v-if="getMartialArtPassive(artId)" class="component passive">
                <span class="comp-label">内功</span>
                <span class="comp-name">{{ getMartialArtPassive(artId).name }}</span>
                <span class="comp-desc">{{ getMartialArtPassive(artId).description }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="start-btn" @click="startGame" :disabled="!selectedCharacter">
        开始战斗
      </button>
    </div>

    <GameBoard
      v-else
      :game="game"
      :player="player"
      :enemy="enemy"
      :ai="ai"
      @restart="restartGame"
    />
  </div>
</template>

<script>
import { ref, reactive, computed } from 'vue'
import GameBoard from './components/GameBoard.vue'
import { createGame } from './game/Game.js'
import { createCharacter } from './game/Character.js'
import { AI } from './game/AI.js'
import { characters, martialArts, getCharacterMartialArts } from './data/skills.js'

export default {
  name: 'App',
  components: {
    GameBoard
  },
  setup() {
    const gameStarted = ref(false)
    const selectedCharacter = ref(null)
    const gameState = reactive({
      player: null,
      enemy: null,
      game: null,
      ai: null
    })

    const selectCharacter = (key) => {
      selectedCharacter.value = key
    }

    const getMartialArtName = (artId) => {
      return martialArts[artId]?.name || artId
    }

    const getMartialArtSkill = (artId) => {
      return martialArts[artId]?.skill
    }

    const getMartialArtPassive = (artId) => {
      return martialArts[artId]?.passive
    }

    const startGame = () => {
      if (!selectedCharacter.value) return

      // 获取选中角色的武功列表
      const playerMartialArts = getCharacterMartialArts(selectedCharacter.value)

      // 创建玩家角色
      gameState.player = createCharacter(
        characters[selectedCharacter.value],
        playerMartialArts
      )

      // 随机选择敌人角色
      const characterKeys = Object.keys(characters).filter(k => k !== selectedCharacter.value)
      const randomKey = characterKeys[Math.floor(Math.random() * characterKeys.length)]
      const enemyMartialArts = getCharacterMartialArts(randomKey)

      gameState.enemy = createCharacter(
        characters[randomKey],
        enemyMartialArts
      )

      // 创建游戏
      gameState.game = createGame()
      gameState.game.init(gameState.player, gameState.enemy)

      // 创建AI
      gameState.ai = new AI(gameState.game)

      gameStarted.value = true
    }

    const restartGame = () => {
      gameStarted.value = false
      selectedCharacter.value = null
      gameState.player = null
      gameState.enemy = null
      gameState.game = null
      gameState.ai = null
    }

    return {
      gameStarted,
      selectedCharacter,
      characters,
      game: computed(() => gameState.game),
      player: computed(() => gameState.player),
      enemy: computed(() => gameState.enemy),
      ai: computed(() => gameState.ai),
      selectCharacter,
      startGame,
      restartGame,
      getMartialArtName,
      getMartialArtSkill,
      getMartialArtPassive
    }
  }
}
</script>

<style scoped>
.app {
  min-height: 100vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
}

.character-select {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  color: #fff;
}

h1 {
  font-size: 2.5rem;
  margin-bottom: 10px;
  text-shadow: 0 0 20px rgba(255, 215, 0, 0.5);
  color: #ffd700;
}

.subtitle {
  font-size: 1.2rem;
  color: #b8860b;
  margin-bottom: 20px;
}

.characters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 15px;
  max-width: 1400px;
  width: 100%;
  margin-bottom: 20px;
}

.character-card {
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 215, 0, 0.2);
  border-radius: 10px;
  padding: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.character-card:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(255, 215, 0, 0.5);
  transform: translateY(-3px);
}

.character-card.selected {
  background: rgba(255, 215, 0, 0.15);
  border-color: #ffd700;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.char-name {
  font-size: 1.3rem;
  color: #ffd700;
  margin-bottom: 5px;
}

.char-title {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 5px;
}

.char-desc {
  font-size: 0.85rem;
  color: #aaa;
  margin-bottom: 10px;
}

.char-stats {
  display: flex;
  gap: 10px;
  margin-bottom: 10px;
}

.char-stats .stat {
  background: rgba(0, 0, 0, 0.3);
  padding: 3px 8px;
  border-radius: 5px;
  font-size: 0.85rem;
}

.char-stats .stat-label {
  color: #888;
  margin-right: 5px;
}

.char-martial-arts {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.martial-art-tag {
  font-size: 0.75rem;
  background: rgba(255, 107, 107, 0.2);
  color: #ff6b6b;
  padding: 2px 8px;
  border-radius: 10px;
}

.selected-detail {
  width: 100%;
  max-width: 800px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
}

.selected-detail h3 {
  color: #ffd700;
  margin-bottom: 15px;
}

.martial-arts-detail {
  display: flex;
  flex-direction: column;
  gap: 15px;
}

.art-detail {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 8px;
  padding: 15px;
}

.art-detail .art-name {
  font-size: 1.2rem;
  color: #ffd700;
  margin-bottom: 10px;
}

.art-components {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.component {
  display: flex;
  flex-direction: column;
  gap: 3px;
  padding: 10px;
  border-radius: 5px;
}

.component.skill {
  background: rgba(255, 107, 107, 0.1);
  border-left: 3px solid #ff6b6b;
}

.component.passive {
  background: rgba(78, 205, 196, 0.1);
  border-left: 3px solid #4ecdc4;
}

.comp-label {
  font-size: 0.8rem;
  color: #888;
}

.comp-name {
  font-size: 1rem;
  font-weight: bold;
}

.component.skill .comp-name {
  color: #ff6b6b;
}

.component.passive .comp-name {
  color: #4ecdc4;
}

.comp-desc {
  font-size: 0.85rem;
  color: #aaa;
}

.start-btn {
  padding: 15px 50px;
  font-size: 1.3rem;
  background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
  border: none;
  border-radius: 30px;
  color: #1a1a2e;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.start-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 30px rgba(255, 215, 0, 0.5);
}

.start-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>