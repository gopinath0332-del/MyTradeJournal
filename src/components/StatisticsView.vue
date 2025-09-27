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
        <div class="symbol-analysis">
          <div class="symbol-table">
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
            <div class="dow-bar-chart">
              <div class="chart-container">
                <div
                  v-for="day in dayOfWeekPerformance"
                  :key="day.day"
                  class="bar-item"
                >
                  <div class="bar-wrapper">
                    <div
                      class="performance-bar"
                      :class="{
                        'positive': day.avgPnL > 0,
                        'negative': day.avgPnL < 0,
                        'neutral': day.avgPnL === 0
                      }"
                      :style="{
                        height: `${Math.abs(day.avgPnL / maxDayPnL) * 100}%`
                      }"
                      :title="`${day.day}: Avg P&L ${formatCurrency(day.avgPnL)} (${day.trades} trades)`"
                    >
                      <div class="bar-value">
                        {{ day.avgPnL >= 0 ? '+' : '' }}{{ formatCurrency(Math.abs(day.avgPnL)) }}
                      </div>
                    </div>
                  </div>
                  <div class="day-label">{{ day.day.substring(0, 3) }}</div>
                  <div class="trade-count">{{ day.trades }} trades</div>
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
            <div class="monthly-trend">
              <div
                v-for="month in monthlyTrend"
                :key="month.month"
                class="month-bar"
                :style="{ height: `${Math.abs(month.pnl / maxMonthlyPnL) * 100}px` }"
                :class="month.pnl >= 0 ? 'positive' : 'negative'"
              >
                <div class="month-label">{{ month.monthName.substr(0, 3) }}</div>
                <div class="month-value">{{ formatCurrency(month.pnl) }}</div>
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
    // Always load trades by selected year
    const allTrades = await tradeService.getTradesByYear(selectedYear.value)
    trades.value = allTrades

    // Update available years from all trades (for year selector)
    const allTradesForYears = await tradeService.getAllTrades()
    const years = [...new Set(allTradesForYears.map(trade =>
      new Date(trade.entryDate).getFullYear()
    ))].sort((a, b) => b - a)
    availableYears.value = years
  } catch (err) {
    error.value = err.message || 'Failed to load trades'
  } finally {
    isLoading.value = false
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

const monthlyTrend = computed(() => {
  const months = {}
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  monthNames.forEach((name, index) => {
    months[index] = { monthName: name, pnl: 0 }
  })

  trades.value.forEach(trade => {
    const month = new Date(trade.entryDate).getMonth()
    months[month].pnl += (trade.pnlAmount || 0)
  })

  return Object.keys(months)
    .map(key => ({
      month: parseInt(key),
      monthName: months[key].monthName,
      pnl: months[key].pnl
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

const retryLoad = () => {
  loadTrades()
}

// Initialize
onMounted(() => {
  loadTrades()
  initializeDashboard()
})
</script>

<style scoped>
.statistics-view {
  padding: 1rem;
  max-width: 1400px;
  margin: 0 auto;
}

.stats-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

@media (min-width: 768px) {
  .stats-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.stats-header h2 {
  font-size: 1.75rem;
  font-weight: 700;
  color: var(--text-color, #1f2937);
  margin: 0;
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
  gap: 2rem;
}

.stats-section {
  background: white;
  border-radius: 0.5rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
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
}

.strategy-table,
.symbol-table {
  width: 100%;
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
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid var(--border-color, #e5e7eb);
}

.strategy-table th,
.symbol-table th {
  background: #f8fafc;
  font-weight: 600;
  color: var(--text-color, #1f2937);
}

.time-analysis {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
}

.time-performance h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

/* Day of Week Bar Chart Styles */
.dow-bar-chart {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1.5rem;
}

.chart-container {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  height: 200px;
  margin-bottom: 1rem;
  padding: 0 1rem;
  background: linear-gradient(to top, #e2e8f0 0%, #e2e8f0 1px, transparent 1px);
  background-size: 100% 40px;
}

.bar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 0 0.25rem;
}

.bar-wrapper {
  height: 160px;
  display: flex;
  align-items: flex-end;
  width: 100%;
  justify-content: center;
}

.performance-bar {
  width: 40px;
  min-height: 4px;
  border-radius: 4px 4px 0 0;
  position: relative;
  transition: all 0.3s ease;
  cursor: pointer;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 0.25rem;
}

.performance-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
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
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  text-align: center;
  line-height: 1.2;
}

.day-label {
  font-weight: 600;
  margin-top: 0.5rem;
  font-size: 0.875rem;
  color: #374151;
}

.trade-count {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 1.5rem;
  margin-top: 1rem;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #4b5563;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
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

.monthly-trend {
  display: flex;
  align-items: flex-end;
  height: 200px;
  gap: 0.25rem;
  padding-top: 50px; /* Space for values positioned above bars */
  padding-bottom: 35px; /* Space for month labels below bars */
  margin: 1rem 0;
}

.month-bar {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
  min-height: 20px;
  border-radius: 0.25rem 0.25rem 0 0;
  position: relative;
  font-size: 0.75rem;
  margin: 0 0.125rem;
  cursor: pointer;
  transition: all 0.3s ease;
}

.month-bar:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
}

.month-bar.positive {
  background: linear-gradient(135deg, #10b981, #059669);
}

.month-bar.negative {
  background: linear-gradient(135deg, #ef4444, #dc2626);
}

.month-label {
  position: absolute;
  bottom: -25px;
  font-weight: 600;
  font-size: 0.875rem;
  color: #374151;
  white-space: nowrap;
}

.month-value {
  position: absolute;
  top: -35px;
  left: 50%;
  transform: translateX(-50%);
  font-weight: 700;
  font-size: 0.8rem;
  white-space: nowrap;
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
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

@media (max-width: 768px) {
  .statistics-view {
    padding: 0.5rem;
  }

  .stats-section {
    padding: 1rem;
  }

  .dow-bar-chart {
    padding: 1rem;
  }

  .chart-container {
    height: 150px;
    padding: 0 0.5rem;
  }

  .bar-wrapper {
    height: 120px;
  }

  .performance-bar {
    width: 30px;
  }

  .bar-value {
    font-size: 0.7rem;
  }

  .chart-legend {
    gap: 1rem;
    flex-wrap: wrap;
  }

  .monthly-trend {
    height: 150px;
    padding-top: 40px;
    padding-bottom: 30px;
  }

  .month-value {
    font-size: 0.7rem;
    top: -30px;
    padding: 0.2rem 0.4rem;
  }

  .month-label {
    font-size: 0.75rem;
    bottom: -20px;
  }
}
</style>
