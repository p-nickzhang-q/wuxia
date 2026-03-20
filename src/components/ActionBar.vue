<template>
  <div class="action-bar">
    <div class="action-bar-container">
      <div class="player-action" :class="{ active: currentActor === player }">
        <span class="action-name">{{ player.name }}</span>
        <div class="action-value">
          <span class="label">轻功</span>
          <span class="value">{{ player.agility }}</span>
        </div>
      </div>

      <div class="action-vs">VS</div>

      <div class="enemy-action" :class="{ active: currentActor === enemy }">
        <span class="action-name">{{ enemy.name }}</span>
        <div class="action-value">
          <span class="label">轻功</span>
          <span class="value">{{ enemy.agility }}</span>
        </div>
      </div>
    </div>

    <div class="action-indicator" v-if="currentActor">
      <span class="arrow" :class="{ 'arrow-right': currentActor === player, 'arrow-left': currentActor === enemy }">
        →
      </span>
      <span class="acting-text">{{ currentActor.name }} 行动中</span>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ActionBar',
  props: {
    player: Object,
    enemy: Object,
    currentActor: Object
  }
}
</script>

<style scoped>
.action-bar {
  padding: 15px;
  background: rgba(0, 0, 0, 0.3);
  border-radius: 15px;
}

.action-bar-container {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 30px;
}

.player-action, .enemy-action {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 15px 30px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 10px;
  border: 2px solid transparent;
  transition: all 0.3s ease;
}

.player-action.active {
  border-color: #4ecdc4;
  background: rgba(78, 205, 196, 0.1);
}

.enemy-action.active {
  border-color: #ff6b6b;
  background: rgba(255, 107, 107, 0.1);
}

.action-name {
  font-size: 1.2rem;
  color: #ffd700;
  margin-bottom: 10px;
}

.action-value {
  display: flex;
  align-items: center;
  gap: 10px;
}

.action-value .label {
  font-size: 0.9rem;
  color: #aaa;
}

.action-value .value {
  font-size: 1.5rem;
  font-weight: bold;
  color: #4ecdc4;
}

.action-vs {
  font-size: 1.5rem;
  color: #ffd700;
  font-weight: bold;
}

.action-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
}

.arrow {
  font-size: 1.5rem;
  color: #ffd700;
}

.arrow-right {
  color: #4ecdc4;
}

.arrow-left {
  color: #ff6b6b;
  transform: scaleX(-1);
}

.acting-text {
  font-size: 1rem;
  color: #ffd700;
}
</style>