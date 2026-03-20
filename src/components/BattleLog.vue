<template>
  <div class="battle-log">
    <div class="log-header">战斗日志</div>
    <div class="log-content" ref="logContainer">
      <div
        v-for="log in logs"
        :key="log.id"
        class="log-entry"
        :class="getLogClass(log.text)"
      >
        {{ log.text }}
      </div>
    </div>
  </div>
</template>

<script>
import { watch, nextTick, ref } from 'vue'

export default {
  name: 'BattleLog',
  props: {
    logs: Array
  },
  setup(props) {
    const logContainer = ref(null)

    // 自动滚动到底部
    watch(() => props.logs.length, () => {
      nextTick(() => {
        if (logContainer.value) {
          logContainer.value.scrollTop = logContainer.value.scrollHeight
        }
      })
    })

    const getLogClass = (text) => {
      if (text.includes('玩家')) return 'log-player'
      if (text.includes('对手')) return 'log-enemy'
      if (text.includes('回合')) return 'log-turn'
      if (text.includes('赢了') || text.includes('输了')) return 'log-result'
      return ''
    }

    return {
      logContainer,
      getLogClass
    }
  }
}
</script>

<style scoped>
.battle-log {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
  padding: 15px;
  max-height: 200px;
  display: flex;
  flex-direction: column;
}

.log-header {
  font-size: 1rem;
  color: #ffd700;
  margin-bottom: 10px;
  padding-bottom: 5px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.log-content {
  flex: 1;
  overflow-y: auto;
  font-size: 0.85rem;
  line-height: 1.6;
}

.log-entry {
  padding: 3px 0;
  color: #ccc;
}

.log-player {
  color: #4ecdc4;
}

.log-enemy {
  color: #ff6b6b;
}

.log-turn {
  color: #ffd700;
  font-weight: bold;
}

.log-result {
  color: #ffd700;
  font-weight: bold;
  font-size: 1rem;
}

.log-content::-webkit-scrollbar {
  width: 5px;
}

.log-content::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.3);
}

.log-content::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.2);
  border-radius: 3px;
}
</style>