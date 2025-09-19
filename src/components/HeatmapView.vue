<template>
  <div class="heatmap-view">
    <div class="heatmap-header">
      <h2>Trading Heatmap</h2>
      <YearSelector 
        v-if="availableYears.length > 0"
        :selected-year="selectedYear"
        :available-years="availableYears"
        @year-change="onYearChange"
      />
    </div>

    <TradingHeatmap 
      v-if="availableYears.length > 0"
      :heatmap-data="heatmapData"
      :selected-year="selectedYear"
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
import YearSelector from './dashboard/YearSelector.vue'
import { useDashboardStats } from '../composables/useDashboardStats.js'

const {
  // State
  selectedYear,
  availableYears,
  
  // Heatmap
  heatmapData,
  
  // Loading states
  isLoadingHeatmap,
  
  // Error states
  heatmapError,
  
  // Methods
  initializeDashboard,
  onYearChange,
  retryHeatmap
} = useDashboardStats()

onMounted(() => {
  initializeDashboard()
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