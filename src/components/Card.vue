<template>
  <div
    class="card"
    :class="{
      playable: canPlay && !disabled,
      'skill-card': isSkillCard && skillMode,
      disabled: !canPlay || disabled,
      [cardTypeClass]: true
    }"
    @click="handleClick"
  >
    <div class="card-header">
      <span class="card-type">{{ card.type }}</span>
      <span class="card-cost">{{ card.agilityCost }}</span>
    </div>
    <div class="card-name">{{ card.name }}</div>
    <div class="card-effect">
      <span v-if="card.baseDamage > 0">伤害: {{ card.baseDamage }}</span>
      <span v-if="card.baseShield > 0">护盾: {{ card.baseShield }}</span>
      <span v-if="card.selfDamage > 0">反伤: {{ card.selfDamage }}</span>
    </div>
    <div class="card-footer">
      <span v-if="isSkillCard && skillMode" class="skill-indicator">武功媒介</span>
    </div>
  </div>
</template>

<script>
import { computed } from 'vue'

export default {
  name: 'Card',
  props: {
    card: Object,
    canPlay: Boolean,
    isSkillCard: Boolean,
    skillMode: Boolean,
    disabled: Boolean
  },
  emits: ['play'],
  setup(props, { emit }) {
    const cardTypeClass = computed(() => {
      const typeMap = {
        '空手': 'type-empty',
        '短兵': 'type-short',
        '长兵': 'type-long',
        '腿法': 'type-leg'
      }
      return typeMap[props.card.type] || 'type-default'
    })

    const handleClick = () => {
      if (props.canPlay && !props.disabled) {
        emit('play')
      }
    }

    return {
      cardTypeClass,
      handleClick
    }
  }
}
</script>

<style scoped>
.card {
  width: 120px;
  height: 160px;
  background: linear-gradient(135deg, #2a2a4a 0%, #1a1a3a 100%);
  border: 2px solid rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  padding: 10px;
  display: flex;
  flex-direction: column;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.card:hover:not(.disabled) {
  transform: translateY(-10px);
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
}

.card.playable:hover {
  border-color: #ffd700;
}

.card.skill-card {
  border-color: #ff6b6b;
  background: linear-gradient(135deg, #3a2a2a 0%, #2a1a1a 100%);
}

.card.skill-card:hover {
  box-shadow: 0 0 20px rgba(255, 107, 107, 0.5);
}

.card.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.card-header {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  margin-bottom: 5px;
}

.card-type {
  color: #aaa;
}

.card-cost {
  background: #ffd700;
  color: #1a1a2e;
  padding: 2px 6px;
  border-radius: 10px;
  font-weight: bold;
}

.card-name {
  font-size: 1.1rem;
  font-weight: bold;
  color: #fff;
  text-align: center;
  margin: 10px 0;
  flex: 1;
}

.card-effect {
  font-size: 0.8rem;
  color: #ccc;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.card-footer {
  margin-top: auto;
  text-align: center;
}

.skill-indicator {
  font-size: 0.75rem;
  color: #ff6b6b;
  font-weight: bold;
}

/* 卡牌类型颜色 */
.type-empty {
  border-top: 3px solid #ff9800;
}

.type-short {
  border-top: 3px solid #2196f3;
}

.type-long {
  border-top: 3px solid #9c27b0;
}

.type-leg {
  border-top: 3px solid #4caf50;
}
</style>