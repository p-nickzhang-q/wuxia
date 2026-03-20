<template>
  <div class="character-panel" :class="{ enemy: isEnemy, active: isCurrentActor }">
    <div class="character-header">
      <div class="character-info">
        <div class="character-name">{{ character.name }}</div>
        <div class="character-title" v-if="character.title">{{ character.title }}</div>
      </div>
    </div>

    <div class="stats">
      <!-- 体力 -->
      <div class="stat hp">
        <div class="stat-label">体力</div>
        <div class="stat-bar">
          <div class="stat-fill hp-fill" :style="{ width: hpPercent + '%' }"></div>
          <span class="stat-value">{{ character.hp }}/{{ character.maxHp }}</span>
        </div>
      </div>

      <!-- 内力 -->
      <div class="stat mp">
        <div class="stat-label">内力</div>
        <div class="stat-bar">
          <div class="stat-fill mp-fill" :style="{ width: mpPercent + '%' }"></div>
          <span class="stat-value">{{ character.mp }}/{{ character.maxMp }}</span>
        </div>
      </div>

      <!-- 轻功 -->
      <div class="stat agility">
        <div class="stat-label">轻功</div>
        <div class="stat-bar">
          <div class="stat-fill agility-fill" :style="{ width: agilityPercent + '%' }"></div>
          <span class="stat-value">{{ character.agility }}</span>
        </div>
      </div>

      <!-- 护盾 -->
      <div class="stat shield" v-if="character.shield > 0">
        <div class="stat-label">护盾</div>
        <div class="shield-value">{{ character.shield }}</div>
      </div>
    </div>

    <!-- 武功列表 -->
    <div class="martial-arts-section" v-if="character.skills?.length > 0 || character.passives?.length > 0">
      <!-- 武功招式 -->
      <div class="skills-list" v-if="character.skills?.length > 0">
        <div class="section-label">武功招式</div>
        <div v-for="skill in character.skills" :key="skill.id" class="skill-item">
          <span class="item-name">{{ skill.name }}</span>
          <span class="item-cost">{{ skill.mpCost }}内力/{{ skill.agilityCost }}轻功</span>
        </div>
      </div>

      <!-- 内功 -->
      <div class="passives-list" v-if="character.passives?.length > 0">
        <div class="section-label">内功</div>
        <div v-for="passive in character.passives" :key="passive.id" class="passive-item">
          <span class="item-name">{{ passive.name }}</span>
          <span class="item-desc">{{ passive.description }}</span>
        </div>
      </div>
    </div>

    <!-- 卡组信息 -->
    <div class="deck-info">
      <span>牌库: {{ character.deck?.length || 0 }}</span>
      <span>弃牌: {{ character.discardPile?.length || 0 }}</span>
      <span>手牌: {{ character.hand?.length || 0 }}</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'CharacterPanel',
  props: {
    character: Object,
    isEnemy: Boolean,
    isCurrentActor: Boolean
  },
  setup(props) {
    const hpPercent = computed(() => {
      return (props.character.hp / props.character.maxHp) * 100
    })

    const mpPercent = computed(() => {
      return (props.character.mp / props.character.maxMp) * 100
    })

    const agilityPercent = computed(() => {
      const maxAgility = Math.max(props.character.getCurrentAgility?.() || props.character.baseAgility, 15)
      return (props.character.agility / maxAgility) * 100
    })

    return {
      hpPercent,
      mpPercent,
      agilityPercent
    }
  }
}
</script>

<style scoped>
.character-panel {
  background: rgba(0, 0, 0, 0.4);
  border-radius: 12px;
  padding: 15px;
  border: 2px solid rgba(255, 255, 255, 0.1);
  transition: all 0.3s ease;
}

.character-panel.active {
  border-color: #ffd700;
  box-shadow: 0 0 15px rgba(255, 215, 0, 0.3);
}

.character-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.character-name {
  font-size: 1.3rem;
  color: #ffd700;
  font-weight: bold;
}

.character-title {
  font-size: 0.85rem;
  color: #888;
}

.stats {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.stat {
  display: flex;
  align-items: center;
  gap: 8px;
}

.stat-label {
  width: 40px;
  font-size: 0.85rem;
  color: #aaa;
}

.stat-bar {
  flex: 1;
  height: 22px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 10px;
  position: relative;
  overflow: hidden;
}

.stat-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.hp-fill {
  background: linear-gradient(90deg, #ff4444, #ff6b6b);
}

.mp-fill {
  background: linear-gradient(90deg, #4444ff, #6b6bff);
}

.agility-fill {
  background: linear-gradient(90deg, #44ff44, #6bff6b);
}

.stat-value {
  position: absolute;
  left: 50%;
  top: 50%;
  transform: translate(-50%, -50%);
  font-size: 0.8rem;
  font-weight: bold;
  text-shadow: 0 0 5px rgba(0, 0, 0, 0.8);
}

.shield {
  margin-top: 5px;
}

.shield-value {
  font-size: 1.1rem;
  color: #ffd700;
  font-weight: bold;
  padding: 2px 8px;
  background: rgba(255, 215, 0, 0.2);
  border-radius: 8px;
}

.martial-arts-section {
  margin-top: 12px;
  padding-top: 10px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.section-label {
  font-size: 0.8rem;
  color: #888;
  margin-bottom: 5px;
}

.skills-list, .passives-list {
  margin-bottom: 10px;
}

.skill-item, .passive-item {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  padding: 5px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 5px;
  margin-bottom: 5px;
}

.skill-item {
  border-left: 3px solid #ff6b6b;
}

.passive-item {
  border-left: 3px solid #4ecdc4;
}

.item-name {
  font-weight: bold;
  font-size: 0.9rem;
}

.skill-item .item-name {
  color: #ff6b6b;
}

.passive-item .item-name {
  color: #4ecdc4;
}

.item-cost {
  font-size: 0.8rem;
  color: #888;
}

.item-desc {
  font-size: 0.8rem;
  color: #aaa;
  width: 100%;
}

.deck-info {
  display: flex;
  justify-content: space-between;
  margin-top: 10px;
  padding-top: 8px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  font-size: 0.8rem;
  color: #666;
}
</style>