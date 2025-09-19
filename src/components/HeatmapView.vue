<template>
  <div class="heatmap-view">
    <div class="heatmap-header">
      <h2>Trading Heatmap</h2>
    </div>

    <TradingHeatmap 
      v-if="availableYears.length > 0"
      :heatmap-data="heatmapData"
      :is-loading="isLoadingHeatmap"
      :error="heatmapError"
      :on-retry="retryHeatmap"
    />

    <div v-else class="no-data">
      <p>No trading data available to display heatmap</p>
    </div>
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import TradingHeatmap from './dashboard/TradingHeatmap.vue'
import { useMultiYearHeatmap } from '../composables/useMultiYearHeatmap.js'

const {
  // State
  availableYears,
  
  // Heatmap
  heatmapData,
  
  // Loading states
  isLoadingHeatmap,
  
  // Error states
  heatmapError,
  
  // Methods
  initializeHeatmap,
  retryHeatmap
} = useMultiYearHeatmap()

onMounted(() => {
  initializeHeatmap()
})

// Cleanup (if needed for any future event listeners)
onUnmounted(() => {
  // Add any cleanup logic here if needed
})
</script>

<style scoped>
.heatmap-view {
  padding: 1rem;
}

@media (min-width: 768px) {
  .heatmap-view {
    padding: 2rem;
  }
}

.heatmap-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
}

@media (min-width: 768px) {
  .heatmap-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.heatmap-header h2 {
  font-size: 1.5rem;
  margin: 0;
  color: #333;
}

@media (min-width: 768px) {
  .heatmap-header h2 {
    font-size: 2rem;
  }
}

.no-data {
  text-align: center;
  color: #6b7280;
  padding: 3rem;
  font-size: 1.1rem;
}
</style>