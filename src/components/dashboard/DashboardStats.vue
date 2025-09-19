<template>
  <div class="dashboard-stats">
    <div class="dashboard-header">
      <h2>Trading Statistics</h2>
      <YearSelector 
        v-if="availableYears.length > 0"
        :selected-year="selectedYear"
        :available-years="availableYears"
        @year-change="onYearChange"
      />
    </div>

    <StatsGrid 
      :stats="stats"
      :is-loading="isLoadingStats"
      :error="statsError"
      :on-retry="retryStats"
    />

    <EquityCurve 
      :equity-data="currentMonthEquityData"
      :is-loading="isLoadingEquityCurve"
      :selected-equity-month="selectedEquityMonth"
      :available-months="availableEquityMonths"
      :selected-year="selectedYear"
      @month-change="onEquityMonthChange"
    />

    <WeeklyBreakdown 
      v-if="availableYears.length > 0"
      :weekly-data="weeklyData"
      :selected-month="selectedMonth"
      :selected-year="selectedYear"
      :available-months="availableMonths"
      :available-years="availableYears"
      :is-loading="isLoadingWeekly"
      :error="weeklyError"
      :on-retry="retryWeekly"
      @month-change="onMonthChange"
    />

    <MonthlyBreakdown 
      v-if="availableYears.length > 0"
      :monthly-data="monthlyData"
      :selected-year="selectedYear"
      :available-years="availableYears"
      :is-loading="isLoadingMonthly"
      :error="monthlyError"
      :on-retry="retryMonthly"
    />

    <TradingHeatmap 
      v-if="availableYears.length > 0"
      :heatmap-data="heatmapData"
      :selected-year="selectedYear"
      class="desktop-only"
    />
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import StatsGrid from './StatsGrid.vue'
import EquityCurve from './EquityCurve.vue'
import WeeklyBreakdown from './WeeklyBreakdown.vue'
import MonthlyBreakdown from './MonthlyBreakdown.vue'
import TradingHeatmap from './TradingHeatmap.vue'
import YearSelector from './YearSelector.vue'
import { useDashboardStats } from '../../composables/useDashboardStats.js'

const {
  // State
  stats,
  monthlyData,
  weeklyData,
  selectedYear,
  selectedMonth,
  availableYears,
  availableMonths,
  
  // Equity curve
  currentMonthEquityData,
  selectedEquityMonth,
  availableEquityMonths,
  
  // Heatmap
  heatmapData,
  
  // Loading states
  isLoadingStats,
  isLoadingMonthly,
  isLoadingWeekly,
  isLoadingEquityCurve,
  
  // Error states
  statsError,
  monthlyError,
  weeklyError,
  
  // Methods
  initializeDashboard,
  onYearChange,
  onMonthChange,
  onEquityMonthChange,
  retryStats,
  retryMonthly,
  retryWeekly
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
.dashboard-stats {
  padding: 1rem;
}

@media (min-width: 768px) {
  .dashboard-stats {
    padding: 2rem;
  }
}

.dashboard-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .dashboard-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.dashboard-header h2 {
  font-size: 1.5rem;
  margin: 0;
}

@media (min-width: 768px) {
  .dashboard-header h2 {
    font-size: 2rem;
  }
}

/* Hide heatmap on mobile devices */
@media (max-width: 767px) {
  .desktop-only {
    display: none;
  }
}
</style>
