<template>
  <div class="card-hand">
    <div class="hand-cards">
      <Card
        v-for="card in cards"
        :key="card.instanceId"
        :card="card"
        :canPlay="canPlayCard(card)"
        :isSkillCard="isSkillCard(card)"
        :skillMode="skillMode"
        :disabled="disabled"
        @play="onPlayCard(card)"
      />
    </div>
    <div class="hand-empty" v-if="cards.length === 0">
      无手牌
    </div>
  </div>
</template>

<script>
import Card from './Card.vue'

export default {
  name: 'CardHand',
  components: {
    Card
  },
  props: {
    cards: Array,
    currentAgility: Number,
    skillMode: Boolean,
    selectedSkill: Object,
    disabled: Boolean
  },
  emits: ['playCard'],
  setup(props, { emit }) {
    const canPlayCard = (card) => {
      if (props.disabled) return false
      return card.agilityCost <= props.currentAgility
    }

    const isSkillCard = (card) => {
      if (!props.selectedSkill) return false
      const requiredType = props.selectedSkill.requiredCardType
      if (requiredType === 'any') return true
      return card.type === requiredType
    }

    const onPlayCard = (card) => {
      const useSkill = props.skillMode && isSkillCard(card)
      emit('playCard', card.instanceId, useSkill)
    }

    return {
      canPlayCard,
      isSkillCard,
      onPlayCard
    }
  }
}
</script>

<style scoped>
.card-hand {
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  min-height: 150px;
}

.hand-cards {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
}

.hand-empty {
  text-align: center;
  color: #666;
  padding: 30px;
  font-size: 1.1rem;
}
</style>