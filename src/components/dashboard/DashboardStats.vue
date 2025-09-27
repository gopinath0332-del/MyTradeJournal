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

    <SymbolPieChart
      v-if="availableYears.length > 0"
      :trades="currentYearTrades"
      :selected-year="selectedYear"
      :is-loading="isLoadingStats"
      :error="statsError"
      :on-retry="retryStats"
      @month-change="onPieChartMonthChange"
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
  </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue'
import StatsGrid from './StatsGrid.vue'
import EquityCurve from './EquityCurve.vue'
import MonthlyBreakdown from './MonthlyBreakdown.vue'
import YearSelector from './YearSelector.vue'
import SymbolPieChart from './SymbolPieChart.vue'
import { useDashboardStats } from '../../composables/useDashboardStats.ts'

const {
  // State
  stats,
  monthlyData,
  selectedYear,
  availableYears,
  currentYearTrades,

  // Equity curve
  currentMonthEquityData,
  selectedEquityMonth,
  availableEquityMonths,

  // Loading states
  isLoadingStats,
  isLoadingMonthly,
  isLoadingEquityCurve,

  // Error states
  statsError,
  monthlyError,

  // Methods
  initializeDashboard,
  onYearChange,
  onEquityMonthChange,
  retryStats,
  retryMonthly
} = useDashboardStats()

// Handle pie chart month change
const onPieChartMonthChange = (_month) => {
  // This could be used to sync with other components if needed
  // For now, the pie chart manages its own month selection independently
  // Future: Could sync this with other dashboard components if needed
}

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
</style>
