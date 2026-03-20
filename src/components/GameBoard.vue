<template>
  <div class="game-board" v-if="player && enemy">
    <!-- 回合指示 -->
    <div class="turn-indicator">
      第 {{ game.currentTurn }} 回合
      <span v-if="game.phase === 'gameOver'" class="game-over">
        - {{ player.isAlive() ? '胜利！' : '失败！' }}
      </span>
    </div>

    <!-- 敌方区域 -->
    <div class="enemy-area">
      <CharacterPanel
        :character="enemy"
        :isEnemy="true"
        :isCurrentActor="game.currentActor?.name === enemy.name"
      />
    </div>

    <!-- 行动条 -->
    <ActionBar :player="player" :enemy="enemy" :currentActor="game.currentActor" />

    <!-- 武功招式区域 -->
    <div class="skill-area" v-if="availableSkills.length > 0 && !skillMode">
      <div class="skill-label">武功招式</div>
      <div class="skill-buttons">
        <button
          v-for="skill in availableSkills"
          :key="skill.id"
          class="skill-btn"
          :disabled="!canUseSkillNow(skill) || game.phase !== 'selecting'"
          @click="selectSkill(skill)"
        >
          {{ skill.name }}
          <span class="skill-cost-info">({{ skill.mpCost }}内力, {{ skill.agilityCost }}轻功)</span>
        </button>
      </div>
    </div>

    <!-- 使用武功招式模式 -->
    <div class="skill-mode" v-if="skillMode && selectedSkill">
      <div class="skill-info">
        <span class="skill-name">{{ selectedSkill.name }}</span>
        <span class="skill-cost">内力消耗: {{ selectedSkill.mpCost }}</span>
        <span class="skill-cost">轻功消耗: {{ selectedSkill.agilityCost }}</span>
        <span class="skill-desc">{{ selectedSkill.description }}</span>
      </div>
      <button class="cancel-btn" @click="cancelSkillMode">取消</button>
    </div>

    <!-- 我方区域 -->
    <div class="player-area">
      <CharacterPanel
        :character="player"
        :isEnemy="false"
        :isCurrentActor="game.currentActor?.name === player.name"
      />
    </div>

    <!-- 手牌区域 -->
    <CardHand
      :cards="player.hand"
      :currentAgility="player.agility"
      :skillMode="skillMode"
      :selectedSkill="selectedSkill"
      :disabled="isHandDisabled"
      @playCard="playCard"
    />

    <!-- 战斗日志 -->
    <BattleLog :logs="game.battleLog" />

    <!-- 游戏结束按钮 -->
    <div v-if="game.phase === 'gameOver'" class="game-over-actions">
      <button class="restart-btn" @click="$emit('restart')">再来一局</button>
    </div>
  </div>
</template>

<script>
import { ref, computed, watch } from 'vue'
import CharacterPanel from './CharacterPanel.vue'
import CardHand from './CardHand.vue'
import ActionBar from './ActionBar.vue'
import BattleLog from './BattleLog.vue'

export default {
  name: 'GameBoard',
  components: {
    CharacterPanel,
    CardHand,
    ActionBar,
    BattleLog
  },
  props: {
    game: Object,
    player: Object,
    enemy: Object,
    ai: Object
  },
  setup(props) {
    const skillMode = ref(false)
    const selectedSkill = ref(null)

    // 检查手牌是否禁用
    const isHandDisabled = computed(() => {
      const phaseMatch = props.game.phase === 'selecting'
      const actorMatch = props.game.currentActor?.name === props.player?.name
      return !(phaseMatch && actorMatch)
    })

    // 获取可用的武功招式
    const availableSkills = computed(() => {
      if (!props.player?.skills) return []
      return props.player.skills
    })

    // 检查当前是否可以使用某个武功招式
    const canUseSkillNow = (skill) => {
      if (!props.player) return false
      const hasCard = props.player.hand.some(card => {
        const typeMatch = skill.requiredCardType === 'any' || card.type === skill.requiredCardType
        return typeMatch && card.agilityCost <= props.player.agility
      })
      return hasCard && props.player.mp >= skill.mpCost && props.player.agility >= skill.agilityCost
    }

    const selectSkill = (skill) => {
      selectedSkill.value = skill
      skillMode.value = true
    }

    const cancelSkillMode = () => {
      skillMode.value = false
      selectedSkill.value = null
    }

    const playCard = async (cardId, useSkill = false) => {
      if (props.game.phase !== 'selecting') {
        return
      }

      if (props.game.currentActor?.name !== props.player?.name) {
        return
      }

      const skillId = selectedSkill.value?.id
      skillMode.value = false
      selectedSkill.value = null

      let result
      if (useSkill && skillId) {
        result = props.game.useSkill(skillId, cardId)
      } else {
        result = props.game.useBasicCard(cardId)
      }

      if (result.gameOver) {
        return
      }

      // 检查是否轮到AI
      if (props.game.currentActor?.name === props.enemy?.name && props.game.phase !== 'gameOver') {
        await props.ai.executeTurn()
      }
    }

    // 监听游戏阶段变化
    watch(() => props.game.phase, async (newPhase) => {
      if (newPhase === 'selecting' && props.game.currentActor?.name === props.enemy?.name) {
        await props.ai.executeTurn()
      }
    })

    return {
      skillMode,
      selectedSkill,
      availableSkills,
      isHandDisabled,
      canUseSkillNow,
      selectSkill,
      cancelSkillMode,
      playCard
    }
  }
}
</script>

<style scoped>
.game-board {
  min-height: 100vh;
  padding: 15px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%);
  color: #fff;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.turn-indicator {
  text-align: center;
  font-size: 1.3rem;
  color: #ffd700;
  padding: 8px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 8px;
}

.game-over {
  color: #ff6b6b;
  font-weight: bold;
}

.enemy-area, .player-area {
  flex-shrink: 0;
}

.skill-area {
  padding: 12px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
}

.skill-label {
  font-size: 0.9rem;
  color: #888;
  margin-bottom: 8px;
}

.skill-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.skill-btn {
  padding: 8px 15px;
  font-size: 0.95rem;
  background: linear-gradient(135deg, #ff6b6b 0%, #ee5a5a 100%);
  border: none;
  border-radius: 15px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.skill-btn:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 0 15px rgba(255, 107, 107, 0.5);
}

.skill-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.skill-cost-info {
  font-size: 0.8rem;
  opacity: 0.8;
}

.skill-mode {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 15px;
  padding: 12px;
  background: rgba(255, 107, 107, 0.15);
  border: 2px solid #ff6b6b;
  border-radius: 10px;
  flex-wrap: wrap;
}

.skill-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.skill-name {
  font-size: 1.1rem;
  color: #ff6b6b;
  font-weight: bold;
}

.skill-cost {
  font-size: 0.85rem;
  color: #4ecdc4;
}

.skill-desc {
  font-size: 0.85rem;
  color: #ccc;
}

.cancel-btn {
  padding: 8px 20px;
  font-size: 0.95rem;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 15px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s ease;
}

.cancel-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.game-over-actions {
  display: flex;
  justify-content: center;
  padding: 15px;
}

.restart-btn {
  padding: 12px 35px;
  font-size: 1.1rem;
  background: linear-gradient(135deg, #ffd700 0%, #ff8c00 100%);
  border: none;
  border-radius: 25px;
  color: #1a1a2e;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s ease;
}

.restart-btn:hover {
  transform: scale(1.05);
  box-shadow: 0 0 25px rgba(255, 215, 0, 0.5);
}
</style>