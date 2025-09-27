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
          <div class="horizontal-bar-chart">
            <div v-if="top10Symbols.length === 0" class="no-data-message">
              No symbol data available for the selected year
            </div>
            <div v-else class="chart-bars">
              <div
                v-for="(symbol, index) in top10Symbols"
                :key="symbol.name"
                class="symbol-bar-item"
              >
                <div class="symbol-info">
                  <span class="symbol-rank">{{ index + 1 }}</span>
                  <span class="symbol-name">{{ symbol.name }}</span>
                  <span class="symbol-trades">({{ symbol.tradeCount }} trades)</span>
                </div>
                <div class="bar-container">
                  <div
                    class="horizontal-bar"
                    :class="{
                      'positive': symbol.totalPnL > 0,
                      'negative': symbol.totalPnL < 0,
                      'neutral': symbol.totalPnL === 0
                    }"
                    :style="{
                      width: `${Math.abs(symbol.totalPnL / maxSymbolPnL) * 100}%`
                    }"
                    :title="`${symbol.name}: Total P&L ${formatCurrency(symbol.totalPnL)}`"
                  >
                    <span class="bar-label">
                      {{ formatCurrency(symbol.totalPnL) }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Symbol Performance Table -->
        <div class="symbol-analysis">
          <!-- Mobile Card View -->
          <div class="symbol-cards mobile-only">
            <div v-if="symbolPerformance.length === 0" class="no-data-message">
              No symbol data available for the selected year
            </div>
            <div v-else class="cards-grid">
              <div
                v-for="symbol in symbolPerformance"
                :key="symbol.name"
                class="symbol-card"
              >
                <div class="card-header">
                  <h5 class="symbol-name">{{ symbol.name }}</h5>
                  <div class="trade-count">{{ symbol.tradeCount }} trades</div>
                </div>
                <div class="card-body">
                  <div class="metric-row">
                    <span class="metric-label">Win Rate</span>
                    <span class="metric-value">{{ formatPercentage(symbol.winRate) }}%</span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Avg P&L</span>
                    <span class="metric-value" :class="getPerformanceClass(symbol.avgPnL)">
                      {{ formatCurrency(symbol.avgPnL) }}
                    </span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Total P&L</span>
                    <span class="metric-value" :class="getPerformanceClass(symbol.totalPnL)">
                      {{ formatCurrency(symbol.totalPnL) }}
                    </span>
                  </div>
                  <div class="metric-row">
                    <span class="metric-label">Risk-Reward</span>
                    <span class="metric-value">{{ formatNumber(symbol.riskReward, 2) }}</span>
                  </div>
                </div>
              </div>
            </div>
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
            <div class="dow-horizontal-chart">
              <div v-if="dayOfWeekPerformance.length === 0" class="no-data-message">
                No day of week data available for the selected year
              </div>
              <div v-else class="horizontal-chart-bars">
                <div
                  v-for="day in dayOfWeekPerformance"
                  :key="day.day"
                  class="day-bar-item"
                >
                  <div class="day-info">
                    <span class="day-name">{{ day.day }}</span>
                    <span class="day-trades">({{ day.trades }} trades)</span>
                  </div>
                  <div class="day-bar-container">
                    <div
                      class="day-horizontal-bar"
                      :class="{
                        'positive': day.avgPnL > 0,
                        'negative': day.avgPnL < 0,
                        'neutral': day.avgPnL === 0
                      }"
                      :style="{
                        width: `${Math.abs(day.avgPnL / maxDayPnL) * 100}%`
                      }"
                      :title="`${day.day}: Avg P&L ${formatCurrency(day.avgPnL)} (${day.trades} trades)`"
                    >
                      <span class="day-bar-label">
                        {{ day.avgPnL >= 0 ? '+' : '' }}{{ formatCurrency(day.avgPnL) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <!-- Chart Legend -->
              <div class="chart-legend">
                <div class="legend-item">
                  <div class="legend-dot positive" />
                  <span>Profitable Days</span>
                </div>
                <div class="legend-item">
                  <div class="legend-dot negative" />
                  <span>Loss Days</span>
                </div>
                <div class="legend-item">
                  <div class="legend-dot neutral" />
                  <span>Breakeven</span>
                </div>
              </div>
            </div>
          </div>

          <div class="time-performance">
            <h4>Monthly Trend</h4>
            <div class="monthly-horizontal-chart">
              <div v-if="monthlyTrend.length === 0" class="no-data-message">
                No monthly data available for the selected year
              </div>
              <div v-else class="horizontal-chart-bars">
                <div
                  v-for="month in monthlyTrend"
                  :key="month.month"
                  class="month-bar-item"
                >
                  <div class="month-info">
                    <span class="month-name">{{ month.monthName }}</span>
                    <span class="month-trades">({{ month.tradeCount || 0 }} trades)</span>
                  </div>
                  <div class="month-bar-container">
                    <div
                      class="month-horizontal-bar"
                      :class="{
                        'positive': month.pnl > 0,
                        'negative': month.pnl < 0,
                        'neutral': month.pnl === 0
                      }"
                      :style="{
                        width: `${Math.abs(month.pnl / maxMonthlyPnL) * 100}%`
                      }"
                      :title="`${month.monthName}: P&L ${formatCurrency(month.pnl)}`"
                    >
                      <span class="month-bar-label">
                        {{ formatCurrency(month.pnl) }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
import { ref, computed, onMounted } from 'vue'
import { tradeService } from '@/firebase/tradeService'
import LoadingSpinner from './ui/LoadingSpinner.vue'
import EmptyState from './ui/EmptyState.vue'
import YearSelector from './dashboard/YearSelector.vue'
import WeeklyBreakdown from './dashboard/WeeklyBreakdown.vue'
import { useDashboardStats } from '@/composables/useDashboardStats'

// Reactive data
const isLoading = ref(false)
const error = ref(null)
const trades = ref([])
const selectedYear = ref(new Date().getFullYear())
const availableYears = ref([])

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

// Advanced calculations (keeping only what's needed for remaining sections)
const symbolPerformance = computed(() => {
  const symbols = {}

  trades.value.forEach(trade => {
    const symbol = trade.symbol || 'Unknown'
    if (!symbols[symbol]) {
      symbols[symbol] = {
        name: symbol,
        trades: [],
        tradeCount: 0,
        winningTrades: 0,
        totalPnL: 0
      }
    }

    symbols[symbol].trades.push(trade)
    symbols[symbol].tradeCount++
    symbols[symbol].totalPnL += (trade.pnlAmount || 0)
    if ((trade.pnlAmount || 0) > 0) {
      symbols[symbol].winningTrades++
    }
  })

  return Object.values(symbols).map(symbol => ({
    ...symbol,
    winRate: symbol.tradeCount > 0 ? (symbol.winningTrades / symbol.tradeCount) * 100 : 0,
    avgPnL: symbol.tradeCount > 0 ? symbol.totalPnL / symbol.tradeCount : 0,
    riskReward: calculateRiskReward(symbol.trades)
  })).sort((a, b) => b.totalPnL - a.totalPnL)
})

const dayOfWeekPerformance = computed(() => {
  // Only include weekdays (Monday through Friday)
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayStats = {}

  days.forEach(day => {
    dayStats[day] = { trades: 0, totalPnL: 0 }
  })

  trades.value.forEach(trade => {
    const dayOfWeek = allDays[new Date(trade.entryDate).getDay()]
    // Only process weekday trades (skip Sunday and Saturday)
    if (days.includes(dayOfWeek)) {
      dayStats[dayOfWeek].trades++
      dayStats[dayOfWeek].totalPnL += (trade.pnlAmount || 0)
    }
  })

  return days.map(day => ({
    day,
    trades: dayStats[day].trades,
    avgPnL: dayStats[day].trades > 0 ? dayStats[day].totalPnL / dayStats[day].trades : 0
  }))
})

// Helper computed property for day of week bar chart scaling
const maxDayPnL = computed(() => {
  if (dayOfWeekPerformance.value.length === 0) return 1
  return Math.max(...dayOfWeekPerformance.value.map(day => Math.abs(day.avgPnL)))
})

// Top 10 symbols by total P&L
const top10Symbols = computed(() => {
  return symbolPerformance.value.slice(0, 10)
})

// Helper computed property for horizontal bar chart scaling
const maxSymbolPnL = computed(() => {
  if (top10Symbols.value.length === 0) return 1
  return Math.max(...top10Symbols.value.map(symbol => Math.abs(symbol.totalPnL)))
})

const monthlyTrend = computed(() => {
  const months = {}
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  monthNames.forEach((name, index) => {
    months[index] = { monthName: name, pnl: 0, tradeCount: 0 }
  })

  trades.value.forEach(trade => {
    const month = new Date(trade.entryDate).getMonth()
    months[month].pnl += (trade.pnlAmount || 0)
    months[month].tradeCount += 1
  })

  return Object.keys(months)
    .map(key => ({
      month: parseInt(key),
      monthName: months[key].monthName,
      pnl: months[key].pnl,
      tradeCount: months[key].tradeCount
    }))
    .filter(monthData => monthData.pnl !== 0) // Only include months with non-zero P&L
})

const maxMonthlyPnL = computed(() => {
  if (monthlyTrend.value.length === 0) return 1 // Handle empty array
  const pnls = monthlyTrend.value.map(m => Math.abs(m.pnl))
  return Math.max(...pnls, 1) // Avoid division by zero
})

// Helper functions
const calculateRiskReward = (trades) => {
  const avgWin = trades.filter(t => (t.pnlAmount || 0) > 0).reduce((sum, t) => sum + t.pnlAmount, 0) /
                 Math.max(1, trades.filter(t => (t.pnlAmount || 0) > 0).length)
  const avgLoss = Math.abs(trades.filter(t => (t.pnlAmount || 0) < 0).reduce((sum, t) => sum + t.pnlAmount, 0) /
                          Math.max(1, trades.filter(t => (t.pnlAmount || 0) < 0).length))
  return avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0
}

// Formatting functions
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

/* Day of Week Bar Chart Styles */
.dow-bar-chart {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
}

@media (min-width: 480px) {
  .dow-bar-chart {
    padding: 1.25rem;
  }
}

@media (min-width: 768px) {
  .dow-bar-chart {
    padding: 1.5rem;
  }
}

.chart-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-around;
  height: 180px;
  margin-bottom: 1rem;
  padding: 0 0.25rem;
  background: linear-gradient(to top, #e2e8f0 0%, #e2e8f0 1px, transparent 1px);
  background-size: 100% 30px;
}

@media (min-width: 480px) {
  .chart-container {
    height: 200px;
    padding: 0 0.5rem;
    background-size: 100% 35px;
  }
}

@media (min-width: 768px) {
  .chart-container {
    height: 220px;
    padding: 0 1rem;
    background-size: 100% 40px;
    justify-content: space-between;
  }
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 0.1rem;
  min-width: 45px; /* Ensure minimum width for mobile visibility */
  max-width: 80px;
}

@media (min-width: 480px) {
  .bar-item {
    margin: 0 0.2rem;
    min-width: 50px;
  }
}

@media (min-width: 768px) {
  .bar-item {
    margin: 0 0.25rem;
    min-width: 0;
    max-width: none;
  }
}

.bar-wrapper {
  height: 140px;
  display: flex;
  align-items: flex-end;
  width: 100%;
  justify-content: center;
}

@media (min-width: 480px) {
  .bar-wrapper {
    height: 160px;
  }
}

@media (min-width: 768px) {
  .bar-wrapper {
    height: 180px;
  }
}

.performance-bar {
  width: 40px;
  min-height: 8px;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.3rem;
  touch-action: manipulation;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (min-width: 480px) {
  .performance-bar {
    width: 45px;
    border-radius: 5px 5px 0 0;
    padding-top: 0.35rem;
  }
}

@media (min-width: 768px) {
  .performance-bar {
    width: 50px;
    border-radius: 6px 6px 0 0;
    padding-top: 0.4rem;
  }
}

/* Enhanced hover/touch interactions */
@media (hover: hover) {
  .performance-bar:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }

  .month-bar:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
  }
}

/* Touch-friendly active states */
.performance-bar:active,
.month-bar:active {
  transform: translateY(1px);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* Focus states for accessibility */
.performance-bar:focus,
.month-bar:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

/* Horizontal bar hover effects */
@media (hover: hover) {
  .horizontal-bar:hover,
  .day-horizontal-bar:hover,
  .month-horizontal-bar:hover {
    transform: scaleX(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .symbol-bar-item:hover .symbol-rank {
    background: #2563eb;
    transform: scale(1.1);
  }
}

.horizontal-bar:active,
.day-horizontal-bar:active,
.month-horizontal-bar:active {
  transform: scaleX(0.98);
}

.horizontal-bar:focus,
.day-horizontal-bar:focus,
.month-horizontal-bar:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}

.performance-bar.positive {
  background: linear-gradient(135deg, #10b981, #059669);
}

.performance-bar.negative {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.performance-bar.neutral {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

.bar-value {
  font-size: 0.8rem;
  font-weight: 700;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
  text-align: center;
  line-height: 1.1;
  letter-spacing: 0.02em;
}

@media (min-width: 480px) {
  .bar-value {
    font-size: 0.85rem;
  }
}

@media (min-width: 768px) {
  .bar-value {
    font-size: 0.9rem;
  }
}

.day-label {
  font-weight: 700;
  margin-top: 0.75rem;
  font-size: 0.9rem;
  color: #1f2937;
  text-align: center;
}

@media (min-width: 480px) {
  .day-label {
    font-size: 0.95rem;
  }
}

@media (min-width: 768px) {
  .day-label {
    font-size: 1rem;
    margin-top: 0.5rem;
  }
}

.trade-count {
  font-size: 0.8rem;
  color: #4b5563;
  margin-top: 0.25rem;
  font-weight: 500;
  text-align: center;
}

@media (min-width: 480px) {
  .trade-count {
    font-size: 0.85rem;
  }
}

@media (min-width: 768px) {
  .trade-count {
    font-size: 0.9rem;
  }
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-top: 1.25rem;
  flex-wrap: wrap;
}

@media (min-width: 480px) {
  .chart-legend {
    gap: 1.25rem;
  }
}

@media (min-width: 768px) {
  .chart-legend {
    gap: 1.5rem;
    margin-top: 1rem;
  }
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  font-size: 0.9rem;
  color: #1f2937;
  font-weight: 500;
}

@media (min-width: 480px) {
  .legend-item {
    font-size: 0.95rem;
    gap: 0.65rem;
  }
}

@media (min-width: 768px) {
  .legend-item {
    font-size: 1rem;
    gap: 0.5rem;
    color: #4b5563;
  }
}

.legend-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .legend-dot {
    width: 12px;
    height: 12px;
  }
}

.legend-dot.positive {
  background: linear-gradient(135deg, #10b981, #059669);
}

.legend-dot.negative {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.legend-dot.neutral {
  background: linear-gradient(135deg, #6b7280, #4b5563);
}

/* Top 10 Symbols Horizontal Bar Chart */
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

.horizontal-bar-chart {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
}

@media (min-width: 480px) {
  .horizontal-bar-chart {
    padding: 1.25rem;
  }
}

@media (min-width: 768px) {
  .horizontal-bar-chart {
    padding: 1.5rem;
  }
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .chart-bars {
    gap: 1.25rem;
  }
}

.symbol-bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 480px) {
  .symbol-bar-item {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}

.symbol-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 0 0 auto;
}

@media (min-width: 480px) {
  .symbol-info {
    min-width: 180px;
    flex: 0 0 180px;
  }
}

@media (min-width: 768px) {
  .symbol-info {
    min-width: 200px;
    flex: 0 0 200px;
  }
}

.symbol-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
}

@media (min-width: 768px) {
  .symbol-rank {
    width: 26px;
    height: 26px;
    font-size: 0.8rem;
  }
}

.symbol-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
  flex-shrink: 0;
}

@media (min-width: 480px) {
  .symbol-name {
    font-size: 0.95rem;
  }
}

@media (min-width: 768px) {
  .symbol-name {
    font-size: 1rem;
  }
}

.symbol-trades {
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
}

@media (min-width: 480px) {
  .symbol-trades {
    font-size: 0.85rem;
  }
}

@media (min-width: 768px) {
  .symbol-trades {
    font-size: 0.9rem;
  }
}

.bar-container {
  flex: 1;
  position: relative;
  height: 36px;
  background: #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

@media (min-width: 768px) {
  .bar-container {
    height: 40px;
  }
}

.horizontal-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
  position: relative;
  min-width: 60px; /* Ensure minimum width for small values */
}

.horizontal-bar.positive {
  background: linear-gradient(90deg, #10b981, #059669);
}

.horizontal-bar.negative {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.horizontal-bar.neutral {
  background: linear-gradient(90deg, #6b7280, #4b5563);
}

.bar-label {
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

@media (min-width: 480px) {
  .bar-label {
    font-size: 0.85rem;
  }
}

@media (min-width: 768px) {
  .bar-label {
    font-size: 0.9rem;
  }
}

.no-data-message {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 2rem;
}

/* Day of Week Horizontal Chart */
.dow-horizontal-chart {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
}

@media (min-width: 480px) {
  .dow-horizontal-chart {
    padding: 1.25rem;
  }
}

@media (min-width: 768px) {
  .dow-horizontal-chart {
    padding: 1.5rem;
  }
}

.horizontal-chart-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .horizontal-chart-bars {
    gap: 1.25rem;
  }
}

.day-bar-item,
.month-bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 480px) {
  .day-bar-item,
  .month-bar-item {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}

.day-info,
.month-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 0 0 auto;
}

@media (min-width: 480px) {
  .day-info,
  .month-info {
    min-width: 160px;
    flex: 0 0 160px;
  }
}

@media (min-width: 768px) {
  .day-info,
  .month-info {
    min-width: 180px;
    flex: 0 0 180px;
  }
}

.day-name,
.month-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
  flex-shrink: 0;
}

@media (min-width: 480px) {
  .day-name,
  .month-name {
    font-size: 0.95rem;
  }
}

@media (min-width: 768px) {
  .day-name,
  .month-name {
    font-size: 1rem;
  }
}

.day-trades,
.month-trades {
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
}

@media (min-width: 480px) {
  .day-trades,
  .month-trades {
    font-size: 0.85rem;
  }
}

@media (min-width: 768px) {
  .day-trades,
  .month-trades {
    font-size: 0.9rem;
  }
}

.day-bar-container,
.month-bar-container {
  flex: 1;
  position: relative;
  height: 36px;
  background: #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

@media (min-width: 768px) {
  .day-bar-container,
  .month-bar-container {
    height: 40px;
  }
}

.day-horizontal-bar,
.month-horizontal-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
  position: relative;
  min-width: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.day-horizontal-bar.positive,
.month-horizontal-bar.positive {
  background: linear-gradient(90deg, #10b981, #059669);
}

.day-horizontal-bar.negative,
.month-horizontal-bar.negative {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.day-horizontal-bar.neutral,
.month-horizontal-bar.neutral {
  background: linear-gradient(90deg, #6b7280, #4b5563);
}

.day-bar-label,
.month-bar-label {
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

@media (min-width: 480px) {
  .day-bar-label,
  .month-bar-label {
    font-size: 0.85rem;
  }
}

@media (min-width: 768px) {
  .day-bar-label,
  .month-bar-label {
    font-size: 0.9rem;
  }
}

/* Monthly Horizontal Chart */
.monthly-horizontal-chart {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-top: 1.5rem;
}

@media (min-width: 480px) {
  .monthly-horizontal-chart {
    padding: 1.25rem;
  }
}

@media (min-width: 768px) {
  .monthly-horizontal-chart {
    padding: 1.5rem;
    margin-top: 2rem;
  }
}

/* Mobile Symbol Cards */
.symbol-cards {
  width: 100%;
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 480px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

.symbol-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.symbol-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.symbol-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.card-header .trade-count {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.metric-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

/* Performance classes for mobile cards */
.symbol-card .metric-value.positive {
  color: #059669;
}

.symbol-card .metric-value.negative {
  color: #dc2626;
}

.symbol-card .metric-value.neutral {
  color: #6b7280;
}

/* Removed old vertical monthly-trend styles - now using horizontal layout */

.month-bar {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 25px;
  min-width: 30px;
  border-radius: 0.3rem 0.3rem 0 0;
  position: relative;
  font-size: 0.75rem;
  margin: 0 0.1rem;
  cursor: pointer;
  transition: all 0.3s ease;
  touch-action: manipulation;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

@media (min-width: 480px) {
  .month-bar {
    min-width: 35px;
    border-radius: 0.35rem 0.35rem 0 0;
    font-size: 0.8rem;
    margin: 0 0.125rem;
  }
}

@media (min-width: 768px) {
  .month-bar {
    flex: 1;
    min-width: auto;
    margin: 0 0.15rem;
    border-radius: 0.4rem 0.4rem 0 0;
    font-size: 0.85rem;
  }
}

/* Removed - now handled in consolidated hover section above */

.month-bar.positive {
  background: linear-gradient(135deg, #10b981, #059669);
}

.month-bar.negative {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.month-label {
  position: absolute;
  bottom: -25px;
  font-weight: 700;
  font-size: 0.8rem;
  color: #1f2937;
  white-space: nowrap;
  text-align: center;
  width: 100%;
  letter-spacing: 0.02em;
}

@media (min-width: 480px) {
  .month-label {
    bottom: -28px;
    font-size: 0.85rem;
  }
}

@media (min-width: 768px) {
  .month-label {
    bottom: -30px;
    font-size: 0.9rem;
  }
}

.month-value {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 800;
  font-size: 0.75rem;
  white-space: nowrap;
  padding: 0.25rem 0.4rem;
  border-radius: 0.35rem;
  box-shadow: 0 3px 6px rgba(0, 0, 0, 0.15);
  z-index: 10;
  min-width: fit-content;
  letter-spacing: 0.01em;
}

@media (min-width: 480px) {
  .month-value {
    top: -38px;
    font-size: 0.8rem;
    padding: 0.27rem 0.45rem;
    border-radius: 0.4rem;
  }
}

@media (min-width: 768px) {
  .month-value {
    top: -42px;
    font-size: 0.85rem;
    padding: 0.3rem 0.5rem;
    border-radius: 0.45rem;
  }
}

.month-bar.positive .month-value {
  background: #059669;
  color: white;
}

.month-bar.negative .month-value {
  background: #dc2626;
  color: white;
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
