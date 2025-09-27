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
        <div class="time-range-selector">
          <label for="timeRange">Time Range:</label>
          <select id="timeRange" v-model="selectedTimeRange" @change="updateTimeRange">
            <option value="current-year">Current Year</option>
            <option value="last-12-months">Last 12 Months</option>
            <option value="all-time">All Time</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
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
            <div class="day-performance">
              <div
                v-for="day in dayOfWeekPerformance"
                :key="day.day"
                class="day-card"
              >
                <div class="day-name">{{ day.day }}</div>
                <div class="day-trades">{{ day.trades }} trades</div>
                <div class="day-pnl" :class="getPerformanceClass(day.avgPnL)">
                  {{ formatCurrency(day.avgPnL) }}
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

// Reactive data
const isLoading = ref(false)
const error = ref(null)
const trades = ref([])
const selectedYear = ref(new Date().getFullYear())
const selectedTimeRange = ref('current-year')
const availableYears = ref([])

// Load trades data
const loadTrades = async() => {
  isLoading.value = true
  error.value = null

  try {
    let allTrades = []

    if (selectedTimeRange.value === 'all-time') {
      allTrades = await tradeService.getAllTrades()
    } else if (selectedTimeRange.value === 'last-12-months') {
      const twelveMonthsAgo = new Date()
      twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1)
      allTrades = await tradeService.getAllTrades()
      allTrades = allTrades.filter(trade =>
        new Date(trade.entryDate) >= twelveMonthsAgo
      )
    } else {
      allTrades = await tradeService.getTradesByYear(selectedYear.value)
    }

    trades.value = allTrades

    // Update available years
    const years = [...new Set(allTrades.map(trade =>
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
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  const dayStats = {}

  days.forEach(day => {
    dayStats[day] = { trades: 0, totalPnL: 0 }
  })

  trades.value.forEach(trade => {
    const dayOfWeek = days[new Date(trade.entryDate).getDay()]
    dayStats[dayOfWeek].trades++
    dayStats[dayOfWeek].totalPnL += (trade.pnlAmount || 0)
  })

  return days.map(day => ({
    day,
    trades: dayStats[day].trades,
    avgPnL: dayStats[day].trades > 0 ? dayStats[day].totalPnL / dayStats[day].trades : 0
  }))
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

  return Object.keys(months).map(key => ({
    month: parseInt(key),
    monthName: months[key].monthName,
    pnl: months[key].pnl
  }))
})

const maxMonthlyPnL = computed(() => {
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
  if (selectedTimeRange.value === 'current-year') {
    loadTrades()
  }
}

const updateTimeRange = () => {
  loadTrades()
}

const retryLoad = () => {
  loadTrades()
}

// Initialize
onMounted(() => {
  loadTrades()
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

.time-range-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-range-selector label {
  font-weight: 500;
  color: var(--text-muted, #6b7280);
}

.time-range-selector select {
  padding: 0.5rem;
  border: 1px solid var(--border-color, #d1d5db);
  border-radius: 0.375rem;
  background: white;
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
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
}

@media (max-width: 768px) {
  .time-analysis {
    grid-template-columns: 1fr;
  }
}

.time-performance h4 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 1rem 0;
}

.day-performance {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 0.5rem;
}

.day-card {
  background: #f8fafc;
  border-radius: 0.375rem;
  padding: 0.75rem 0.5rem;
  text-align: center;
  font-size: 0.75rem;
}

.day-name {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.day-trades {
  color: var(--text-muted, #6b7280);
  margin-bottom: 0.25rem;
}

.day-pnl {
  font-weight: 600;
}

.monthly-trend {
  display: flex;
  align-items: flex-end;
  height: 200px;
  gap: 0.25rem;
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
  font-size: 0.625rem;
}

.month-bar.positive {
  background: var(--success-color, #10b981);
}

.month-bar.negative {
  background: var(--danger-color, #ef4444);
}

.month-label {
  position: absolute;
  bottom: -15px;
  font-weight: 500;
}

.month-value {
  color: white;
  font-weight: 600;
  margin-bottom: 0.25rem;
  writing-mode: vertical-rl;
  text-orientation: mixed;
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


}
</style>
