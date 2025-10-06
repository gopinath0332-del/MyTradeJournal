<template>
  <div class="statistics-view">
    <div class="stats-header">
      <h2>Advanced Statistics</h2>
      <div class="stats-controls">
        <YearSelector
          v-if="availableYears.length > 0"
          :selected-year="selectedYear"
          :available-years="availableYears"
          @year-change="onYearChange"
        />
      </div>
    </div>

    <!-- Loading State -->
    <LoadingSpinner
      v-if="isLoading"
      message="Loading advanced statistics..."
      size="large"
      full-height
    />

    <!-- Error State -->
    <div v-else-if="error" class="error-state">
      <EmptyState
        icon="⚠️"
        title="Error Loading Statistics"
        :message="error"
        action-text="Try Again"
        :action-handler="retryLoad"
      />
    </div>

    <!-- Statistics Content -->
    <div v-else-if="!isLoading && trades.length > 0" class="stats-content">
      <!-- Symbol Analysis -->
      <section class="stats-section">
        <h3>Symbol Performance</h3>

        <!-- Top 10 Symbol Performance Chart -->
        <div class="top-symbols-chart">
          <h4>Top 10 Symbol Performance by Total P&L</h4>
          <HorizontalBarChart
            :data="symbolChartData"
            :show-rank="true"
            :value-formatter="formatCurrency"
            no-data-message="No symbol data available for the selected year"
          />
        </div>

        <!-- Symbol Performance Table -->
        <div class="symbol-analysis">
          <!-- Mobile Card View -->
          <div class="mobile-only">
            <SymbolCards
              :symbols="symbolPerformance"
              no-data-message="No symbol data available for the selected year"
            />
          </div>

          <!-- Desktop Table View -->
          <div class="symbol-table desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Symbol</th>
                  <th>Trades</th>
                  <th>Win Rate</th>
                  <th>Avg P&L</th>
                  <th>Total P&L</th>
                  <th>Risk-Reward</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="symbol in symbolPerformance" :key="symbol.name">
                  <td>{{ symbol.name }}</td>
                  <td>{{ symbol.tradeCount }}</td>
                  <td>{{ formatPercentage(symbol.winRate) }}%</td>
                  <td :class="getPerformanceClass(symbol.avgPnL)">
                    {{ formatCurrency(symbol.avgPnL) }}
                  </td>
                  <td :class="getPerformanceClass(symbol.totalPnL)">
                    {{ formatCurrency(symbol.totalPnL) }}
                  </td>
                  <td>{{ formatNumber(symbol.riskReward, 2) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      <!-- Time-based Analysis -->
      <section class="stats-section">
        <h3>Time-based Performance</h3>

        <div class="time-analysis">
          <div class="time-performance">
            <h4>Day of Week Performance</h4>
            <HorizontalBarChart
              :data="dayChartData"
              :value-formatter="formatCurrency"
              no-data-message="No day of week data available for the selected year"
            />
          </div>

          <div class="time-performance">
            <h4>Monthly Trend</h4>
            <HorizontalBarChart
              :data="monthChartData"
              :value-formatter="formatCurrency"
              no-data-message="No monthly data available for the selected year"
            />
          </div>
        </div>

        <!-- Weekly Performance Analysis -->
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
      </section>
    </div>

    <!-- Empty State -->
    <EmptyState
      v-else-if="!isLoading && trades.length === 0"
      icon="📈"
      title="No trading data available"
      message="Start logging trades to see advanced statistics and analytics"
      :full-height="true"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted, provide } from 'vue'
import { tradeService } from '@/firebase/tradeService'
import LoadingSpinner from './ui/LoadingSpinner.vue'
import EmptyState from './ui/EmptyState.vue'
import YearSelector from './dashboard/YearSelector.vue'
import WeeklyBreakdown from './dashboard/WeeklyBreakdown.vue'
import HorizontalBarChart from './charts/HorizontalBarChart.vue'
import SymbolCards from './charts/SymbolCards.vue'
import { useDashboardStats } from '@/composables/useDashboardStats'
import { useSymbolPerformance } from '@/composables/useSymbolPerformance'
import { useTimeAnalysis } from '@/composables/useTimeAnalysis'

// Reactive data
const isLoading = ref(false)
const error = ref(null)
const trades = ref([])
const selectedYear = ref(new Date().getFullYear())
const availableYears = ref([])

// Formatting functions (moved up to be available for computed properties)
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatNumber = (number, decimals = 0) => {
  return Number(number).toFixed(decimals)
}

const formatPercentage = (percentage) => {
  return Number(percentage).toFixed(1)
}

// Initialize composables for data analysis
const { symbolPerformance, top10Symbols } = useSymbolPerformance(trades)
const { dayOfWeekPerformance, monthlyTrend } = useTimeAnalysis(trades)

// Provide formatting functions to child components
provide('formatCurrency', formatCurrency)
provide('formatNumber', formatNumber)
provide('formatPercentage', formatPercentage)

// Weekly breakdown data from useDashboardStats
const {
  weeklyData,
  selectedMonth,
  availableMonths,
  isLoadingWeekly,
  weeklyError,
  onMonthChange,
  onYearChange: onDashboardYearChange,
  retryWeekly,
  initializeDashboard
} = useDashboardStats()

// Load trades data
const loadTrades = async() => {
  isLoading.value = true
  error.value = null

  try {
    // Load trades only for the selected year
    const yearTrades = await tradeService.getTradesByYear(selectedYear.value)
    trades.value = yearTrades
  } catch (err) {
    error.value = err.message || 'Failed to load trades'
  } finally {
    isLoading.value = false
  }
}

// Separate function to load available years efficiently
const loadAvailableYears = async() => {
  try {
    const years = await tradeService.getAvailableYears()
    availableYears.value = years

    // If current selected year is not available, set to the most recent year
    if (years.length > 0 && !years.includes(selectedYear.value)) {
      selectedYear.value = years[0]
    }
  } catch (err) {
    error.value = err.message || 'Failed to load available years'
    // Fallback to current year if there's an error
    availableYears.value = [new Date().getFullYear()]
  }
}

// Transform data for chart components
const symbolChartData = computed(() => {
  return top10Symbols.value.map(symbol => ({
    id: symbol.name,
    name: symbol.name,
    value: symbol.totalPnL,
    subtitle: `(${symbol.tradeCount} trades)`,
    tooltip: `${symbol.name}: Total P&L ${formatCurrency(symbol.totalPnL)}`
  }))
})

const dayChartData = computed(() => {
  return dayOfWeekPerformance.value.map(day => ({
    id: day.day,
    name: day.day,
    value: day.avgPnL,
    subtitle: `(${day.trades} trades)`,
    tooltip: `${day.day}: Avg P&L ${formatCurrency(day.avgPnL)} (${day.trades} trades)`
  }))
})

const monthChartData = computed(() => {
  return monthlyTrend.value.map(month => ({
    id: month.month,
    name: month.monthName,
    value: month.pnl,
    subtitle: `(${month.tradeCount || 0} trades)`,
    tooltip: `${month.monthName}: P&L ${formatCurrency(month.pnl)}`
  }))
})

// CSS class helpers
const getPerformanceClass = (value) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}



// Event handlers
const onYearChange = (year) => {
  selectedYear.value = year
  // Sync with dashboard stats composable
  onDashboardYearChange(year)
  // Always load trades for the selected year
  loadTrades()
}

const retryLoad = async() => {
  await loadAvailableYears()
  await loadTrades()
}

// Initialize
onMounted(async() => {
  // First load available years, then load trades for selected year
  await loadAvailableYears()
  await loadTrades()
  initializeDashboard()
})
</script>

<style scoped>
.statistics-view {
  padding: 0.75rem;
  max-width: 1400px;
  margin: 0 auto;
}

@media (min-width: 480px) {
  .statistics-view {
    padding: 1rem;
  }
}

.stats-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

@media (min-width: 480px) {
  .stats-header {
    gap: 1.25rem;
  }
}

@media (min-width: 768px) {
  .stats-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 2rem;
  }
}

.stats-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: var(--text-color, #1f2937);
  margin: 0;
  line-height: 1.3;
}

@media (min-width: 480px) {
  .stats-header h2 {
    font-size: 1.625rem;
  }
}

@media (min-width: 768px) {
  .stats-header h2 {
    font-size: 1.75rem;
  }
}

.stats-controls {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .stats-controls {
    flex-direction: row;
    align-items: center;
  }
}

.stats-content {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .stats-content {
    gap: 2rem;
  }
}

.stats-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
  overflow: hidden;
}

/* Scroll indicators for mobile tables */
.symbol-analysis::before {
  content: '';
  position: absolute;
  top: 0;
  right: 0;
  width: 20px;
  height: 100%;
  background: linear-gradient(to left, rgba(255,255,255,0.8), transparent);
  pointer-events: none;
  z-index: 5;
}

@media (min-width: 768px) {
  .symbol-analysis::before {
    display: none;
  }
}

.stats-section h3 {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--text-color, #1f2937);
}



.strategy-analysis,
.symbol-analysis {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scroll-behavior: smooth;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid var(--border-color, #e5e7eb);
}

/* Responsive visibility classes */
.mobile-only {
  display: block;
}

.desktop-only {
  display: none;
}

@media (min-width: 768px) {
  .mobile-only {
    display: none;
  }

  .desktop-only {
    display: block;
  }
}

.strategy-table,
.symbol-table {
  width: 100%;
  min-width: 600px; /* Ensure minimum width for mobile scrolling */
}

@media (min-width: 768px) {
  .strategy-table,
  .symbol-table {
    min-width: auto;
  }
}

.strategy-table table,
.symbol-table table {
  width: 100%;
  border-collapse: collapse;
  background: white;
  border-radius: 0.5rem;
  overflow: hidden;
}

.strategy-table th,
.symbol-table th,
.strategy-table td,
.symbol-table td {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
  font-size: 0.875rem;
  min-width: 80px;
}

@media (min-width: 480px) {
  .strategy-table th,
  .symbol-table th,
  .strategy-table td,
  .symbol-table td {
    padding: 0.625rem;
    font-size: 0.9rem;
  }
}

@media (min-width: 768px) {
  .strategy-table th,
  .symbol-table th,
  .strategy-table td,
  .symbol-table td {
    padding: 0.75rem;
    font-size: 1rem;
  }
}

.strategy-table th,
.symbol-table th {
  background: #f8fafc;
  font-weight: 600;
  color: var(--text-color, #1f2937);
  position: sticky;
  top: 0;
  z-index: 10;
}

.time-analysis {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .time-analysis {
    gap: 2rem;
  }
}

.time-performance h4 {
  font-size: 0.95rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

@media (min-width: 480px) {
  .time-performance h4 {
    font-size: 1rem;
  }
}

/* Improve mobile readability */
@media (max-width: 480px) {
  .stats-section h3 {
    font-size: 1.125rem;
    line-height: 1.4;
  }

  .time-performance h4 {
    font-size: 0.9rem;
  }
}









/* Top 10 Symbols Chart */
.top-symbols-chart {
  margin-bottom: 2rem;
}

.top-symbols-chart h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1.5rem 0;
  color: var(--text-color, #1f2937);
}

@media (min-width: 480px) {
  .top-symbols-chart h4 {
    font-size: 1.05rem;
  }
}

@media (min-width: 768px) {
  .top-symbols-chart h4 {
    font-size: 1.1rem;
  }
}







/* Value color classes */
.positive {
  color: var(--success-color, #10b981);
}

.negative {
  color: var(--danger-color, #ef4444);
}

.neutral {
  color: var(--text-muted, #6b7280);
}

.excellent {
  color: #059669;
}

.good {
  color: #10b981;
}

.fair {
  color: #f59e0b;
}

.poor {
  color: #ef4444;
}

.error-state {
  padding: 2rem 0;
}

/* Enhanced mobile-first responsive design */
@media (max-width: 320px) {
  .statistics-view {
    padding: 0.5rem;
  }

  .stats-section {
    padding: 0.75rem;
    border-radius: 0.375rem;
  }

  .stats-section h3 {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  /* Mobile card optimizations */
  .symbol-card {
    padding: 0.75rem;
  }

  .symbol-name {
    font-size: 1rem;
  }

  .metric-label {
    font-size: 0.8rem;
  }

  .metric-value {
    font-size: 0.85rem;
  }

  /* Horizontal charts mobile optimization */
  .day-info,
  .month-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .day-name,
  .month-name {
    font-size: 0.85rem;
  }

  .day-trades,
  .month-trades {
    font-size: 0.7rem;
  }

  .day-bar-container,
  .month-bar-container {
    height: 28px;
  }

  .day-bar-label,
  .month-bar-label {
    font-size: 0.7rem;
  }
}

/* Mobile optimizations for 320px screens continued */
@media (max-width: 320px) {
  /* Horizontal bar chart mobile optimizations */
  .top-symbols-chart {
    margin-bottom: 1.5rem;
  }

  .symbol-analysis {
    margin-top: 1.5rem;
    padding-top: 1rem;
  }

  .horizontal-bar-chart {
    padding: 0.75rem;
  }

  .chart-bars {
    gap: 0.75rem;
  }

  .symbol-bar-item {
    gap: 0.4rem;
  }

  .symbol-info {
    gap: 0.4rem;
  }

  .symbol-rank {
    width: 20px;
    height: 20px;
    font-size: 0.7rem;
  }

  .symbol-name {
    font-size: 0.85rem;
  }

  .symbol-trades {
    font-size: 0.75rem;
  }

  .bar-container {
    height: 32px;
  }

  .bar-label {
    font-size: 0.75rem;
    padding-right: 0.5rem;
  }

  /* New horizontal charts mobile optimization */
  .dow-horizontal-chart,
  .monthly-horizontal-chart {
    padding: 0.75rem;
  }

  .horizontal-chart-bars {
    gap: 0.75rem;
  }

  .day-bar-item,
  .month-bar-item {
    gap: 0.4rem;
  }

  .day-info,
  .month-info {
    gap: 0.4rem;
  }

  .day-name,
  .month-name {
    font-size: 0.85rem;
  }

  .day-trades,
  .month-trades {
    font-size: 0.75rem;
  }

  .day-bar-container,
  .month-bar-container {
    height: 32px;
  }

  .day-bar-label,
  .month-bar-label {
    font-size: 0.75rem;
    padding-right: 0.5rem;
  }
}

@media (max-width: 480px) {
  .statistics-view {
    padding: 0.75rem;
  }

  .stats-section {
    padding: 1rem;
    margin-bottom: 1.5rem;
  }

  .stats-section h3 {
    font-size: 1.2rem;
    margin-bottom: 1.25rem;
  }

  .time-performance h4 {
    font-size: 1rem;
    margin-bottom: 1rem;
  }

  /* Improve touch targets for mobile charts */
  .day-horizontal-bar,
  .month-horizontal-bar,
  .horizontal-bar {
    min-height: 44px; /* iOS recommended touch target */
  }

  /* Better spacing for small screens */
  .stats-content {
    gap: 1.5rem;
  }

  /* Mobile card improvements */
  .cards-grid {
    gap: 1rem;
  }

  .symbol-card {
    padding: 0.875rem;
  }

  /* Chart spacing improvements */
  .horizontal-chart-bars {
    gap: 0.875rem;
  }

  .day-bar-item,
  .month-bar-item {
    gap: 0.5rem;
  }
}

@media (max-width: 768px) {
  .statistics-view {
    padding: 0.75rem;
  }

  .stats-section {
    padding: 1.25rem;
  }

  /* Ensure charts are well-spaced on tablets */
  .chart-container {
    padding: 0 0.3rem;
  }
}
</style>
