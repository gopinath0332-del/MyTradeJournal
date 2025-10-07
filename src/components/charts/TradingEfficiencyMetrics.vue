<template>
  <div class="trading-efficiency-metrics">
    <div class="metrics-header">
      <h4>Trading Efficiency Metrics</h4>
      <div class="metrics-controls">
        <div class="time-period-selector">
          <label for="time-period">Period:</label>
          <select id="time-period" v-model="selectedPeriod" @change="updateMetrics">
            <option value="all">All Time</option>
            <option value="ytd">Year to Date</option>
            <option value="last30">Last 30 Days</option>
            <option value="last90">Last 90 Days</option>
            <option value="last365">Last 365 Days</option>
          </select>
        </div>
        <div class="export-options">
          <button class="export-btn" @click="exportMetrics">
            <span class="export-icon">📊</span>
            Export
          </button>
        </div>
      </div>
    </div>

    <div v-if="filteredTrades.length === 0" class="no-data">
      <EmptyState
        icon="📈"
        title="No Trading Data"
        message="Complete some trades to see efficiency metrics"
      />
    </div>

    <div v-else class="metrics-content">
      <!-- Core Efficiency Metrics -->
      <div class="core-metrics">
        <div class="metrics-grid">
          <!-- Profit Factor -->
          <div class="metric-card profit-factor" :class="getProfitFactorClass(profitFactor)">
            <div class="metric-header">
              <div class="metric-icon">💰</div>
              <div class="metric-info">
                <h5>Profit Factor</h5>
                <span class="metric-description">Gross Profit ÷ Gross Loss</span>
              </div>
            </div>
            <div class="metric-value">
              <span class="primary-value">{{ formatNumber(profitFactor, 2) }}</span>
              <span class="metric-interpretation">{{ getProfitFactorInterpretation(profitFactor) }}</span>
            </div>
            <div class="metric-breakdown">
              <div class="breakdown-item">
                <span>Gross Profit:</span>
                <span class="positive">{{ formatCurrency(grossProfit) }}</span>
              </div>
              <div class="breakdown-item">
                <span>Gross Loss:</span>
                <span class="negative">{{ formatCurrency(Math.abs(grossLoss)) }}</span>
              </div>
            </div>
          </div>

          <!-- Risk Management -->
          <div class="metric-card risk-management">
            <div class="metric-header">
              <div class="metric-icon">⚖️</div>
              <div class="metric-info">
                <h5>Risk Management</h5>
                <span class="metric-description">Average Win vs Average Loss</span>
              </div>
            </div>
            <div class="metric-value">
              <span class="primary-value">{{ formatNumber(riskRewardRatio, 2) }}:1</span>
              <span class="metric-interpretation">{{ getRiskRewardInterpretation(riskRewardRatio) }}</span>
            </div>
            <div class="metric-breakdown">
              <div class="breakdown-item">
                <span>Avg Win:</span>
                <span class="positive">{{ formatCurrency(averageWin) }}</span>
              </div>
              <div class="breakdown-item">
                <span>Avg Loss:</span>
                <span class="negative">{{ formatCurrency(Math.abs(averageLoss)) }}</span>
              </div>
            </div>
          </div>

          <!-- Consistency Analysis -->
          <div class="metric-card consistency">
            <div class="metric-header">
              <div class="metric-icon">📊</div>
              <div class="metric-info">
                <h5>Consistency</h5>
                <span class="metric-description">Largest Win/Loss Analysis</span>
              </div>
            </div>
            <div class="metric-value">
              <span class="primary-value">{{ formatNumber(largestWinLossRatio, 2) }}:1</span>
              <span class="metric-interpretation">{{ getConsistencyInterpretation(largestWinLossRatio) }}</span>
            </div>
            <div class="metric-breakdown">
              <div class="breakdown-item">
                <span>Largest Win:</span>
                <span class="positive">{{ formatCurrency(largestWin) }}</span>
              </div>
              <div class="breakdown-item">
                <span>Largest Loss:</span>
                <span class="negative">{{ formatCurrency(Math.abs(largestLoss)) }}</span>
              </div>
            </div>
          </div>

          <!-- Win Rate & Expectancy -->
          <div class="metric-card expectancy">
            <div class="metric-header">
              <div class="metric-icon">🎯</div>
              <div class="metric-info">
                <h5>Trade Expectancy</h5>
                <span class="metric-description">Expected value per trade</span>
              </div>
            </div>
            <div class="metric-value">
              <span class="primary-value" :class="getPerformanceClass(tradeExpectancy)">
                {{ formatCurrency(tradeExpectancy) }}
              </span>
              <span class="metric-interpretation">per trade</span>
            </div>
            <div class="metric-breakdown">
              <div class="breakdown-item">
                <span>Win Rate:</span>
                <span :class="getPerformanceClass(winRate - 50)">{{ formatPercentage(winRate) }}%</span>
              </div>
              <div class="breakdown-item">
                <span>Total Trades:</span>
                <span>{{ filteredTrades.length }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Streak Analysis -->
      <div class="streak-analysis">
        <h5>Streak Analysis</h5>
        <div class="streak-grid">
          <div class="streak-card current-streak" :class="getCurrentStreakClass()">
            <div class="streak-header">
              <div class="streak-icon">{{ getCurrentStreakIcon() }}</div>
              <div class="streak-title">Current Streak</div>
            </div>
            <div class="streak-value">
              <span class="streak-number">{{ Math.abs(currentStreak.count) }}</span>
              <span class="streak-type">{{ currentStreak.type }}</span>
            </div>
            <div class="streak-impact">
              Impact: <span :class="getPerformanceClass(currentStreak.totalPnL)">
                {{ formatCurrency(currentStreak.totalPnL) }}
              </span>
            </div>
          </div>

          <div class="streak-card best-streak">
            <div class="streak-header">
              <div class="streak-icon">🏆</div>
              <div class="streak-title">Best Win Streak</div>
            </div>
            <div class="streak-value">
              <span class="streak-number">{{ bestWinStreak.count }}</span>
              <span class="streak-type">wins</span>
            </div>
            <div class="streak-impact">
              Total: <span class="positive">{{ formatCurrency(bestWinStreak.totalPnL) }}</span>
            </div>
          </div>

          <div class="streak-card worst-streak">
            <div class="streak-header">
              <div class="streak-icon">📉</div>
              <div class="streak-title">Worst Loss Streak</div>
            </div>
            <div class="streak-value">
              <span class="streak-number">{{ worstLossStreak.count }}</span>
              <span class="streak-type">losses</span>
            </div>
            <div class="streak-impact">
              Total: <span class="negative">{{ formatCurrency(worstLossStreak.totalPnL) }}</span>
            </div>
          </div>

          <div class="streak-card streak-stats">
            <div class="streak-header">
              <div class="streak-icon">📈</div>
              <div class="streak-title">Streak Statistics</div>
            </div>
            <div class="streak-stats-grid">
              <div class="stat-item">
                <span class="stat-label">Avg Win Streak:</span>
                <span class="stat-value">{{ formatNumber(averageWinStreak, 1) }}</span>
              </div>
              <div class="stat-item">
                <span class="stat-label">Avg Loss Streak:</span>
                <span class="stat-value">{{ formatNumber(averageLossStreak, 1) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Time to Profitability -->
      <div class="time-to-profitability">
        <h5>Time to Profitability Analysis</h5>
        <div class="profitability-grid">
          <div class="profitability-card overall">
            <div class="card-header">
              <div class="card-icon">⏱️</div>
              <div class="card-title">Overall Analysis</div>
            </div>
            <div class="profitability-metrics">
              <div class="metric-row">
                <span class="metric-label">Avg Time to Profit:</span>
                <span class="metric-value">{{ formatDuration(averageTimeToProfitability) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Fastest Profit:</span>
                <span class="metric-value positive">{{ formatDuration(fastestProfitTime) }}</span>
              </div>
              <div class="metric-row">
                <span class="metric-label">Trades Profitable Within:</span>
                <span class="metric-value">
                  1h: {{ formatPercentage(profitabilityTimeframes.oneHour) }}% |
                  1d: {{ formatPercentage(profitabilityTimeframes.oneDay) }}% |
                  1w: {{ formatPercentage(profitabilityTimeframes.oneWeek) }}%
                </span>
              </div>
            </div>
          </div>

          <div class="profitability-card distribution">
            <div class="card-header">
              <div class="card-icon">📊</div>
              <div class="card-title">Profitability Distribution</div>
            </div>
            <div class="distribution-chart">
              <div
                v-for="(bucket, index) in profitabilityDistribution"
                :key="index"
                class="distribution-bar"
                :style="{ height: `${bucket.percentage}%` }"
                :title="`${bucket.label}: ${bucket.count} trades`"
              >
                <div class="bar-label">{{ bucket.label }}</div>
                <div class="bar-value">{{ bucket.count }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Efficiency Insights -->
      <div class="efficiency-insights">
        <h5>Efficiency Insights & Recommendations</h5>
        <div class="insights-list">
          <div
            v-for="insight in efficiencyInsights"
            :key="insight.id"
            class="insight-item"
            :class="insight.type"
          >
            <div class="insight-icon">{{ insight.icon }}</div>
            <div class="insight-content">
              <span class="insight-title">{{ insight.title }}</span>
              <span class="insight-description">{{ insight.description }}</span>
              <div v-if="insight.recommendation" class="insight-recommendation">
                <strong>Recommendation:</strong> {{ insight.recommendation }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject, onMounted } from 'vue'
import EmptyState from '../ui/EmptyState.vue'

const props = defineProps({
  trades: {
    type: Array,
    default: () => []
  }
})

// Reactive data
const selectedPeriod = ref('all')

// Inject formatting functions
const formatCurrency = inject('formatCurrency', (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
})

const formatPercentage = inject('formatPercentage', (percentage) => {
  return Number(percentage).toFixed(1)
})

const formatNumber = (number, decimals = 0) => {
  return Number(number).toFixed(decimals)
}

// Helper functions
const filterTradesByPeriod = (trades, period) => {
  if (period === 'all') return trades

  const now = new Date()
  const cutoffDate = new Date()

  switch (period) {
    case 'ytd':
      cutoffDate.setFullYear(now.getFullYear(), 0, 1)
      break
    case 'last30':
      cutoffDate.setDate(now.getDate() - 30)
      break
    case 'last90':
      cutoffDate.setDate(now.getDate() - 90)
      break
    case 'last365':
      cutoffDate.setDate(now.getDate() - 365)
      break
    default:
      return trades
  }

  return trades.filter(trade => new Date(trade.entryDate) >= cutoffDate)
}

const calculateTimeToProfitability = (trade) => {
  if (!trade.exitDate || !trade.entryDate) return null

  const entryTime = new Date(trade.entryDate)
  const exitTime = new Date(trade.exitDate)
  const pnl = trade.pnlAmount || 0

  if (pnl <= 0) return null // Only consider profitable trades

  return (exitTime - entryTime) / (1000 * 60 * 60) // Return hours
}

const formatDuration = (hours) => {
  if (hours === null || hours === undefined) return 'N/A'

  if (hours < 1) {
    return `${Math.round(hours * 60)}m`
  } else if (hours < 24) {
    return `${Math.round(hours)}h`
  } else if (hours < 24 * 7) {
    const days = Math.round(hours / 24)
    return `${days}d`
  } else {
    const weeks = Math.round(hours / (24 * 7))
    return `${weeks}w`
  }
}

// Computed properties
const filteredTrades = computed(() => {
  return filterTradesByPeriod(props.trades, selectedPeriod.value)
})

const completedTrades = computed(() => {
  return filteredTrades.value.filter(trade => trade.exitDate && trade.pnlAmount !== undefined)
})

const winningTrades = computed(() => {
  return completedTrades.value.filter(trade => (trade.pnlAmount || 0) > 0)
})

const losingTrades = computed(() => {
  return completedTrades.value.filter(trade => (trade.pnlAmount || 0) < 0)
})

const grossProfit = computed(() => {
  return winningTrades.value.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
})

const grossLoss = computed(() => {
  return losingTrades.value.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
})

const profitFactor = computed(() => {
  if (Math.abs(grossLoss.value) === 0) return grossProfit.value > 0 ? 999 : 0
  return grossProfit.value / Math.abs(grossLoss.value)
})

const averageWin = computed(() => {
  return winningTrades.value.length > 0 ? grossProfit.value / winningTrades.value.length : 0
})

const averageLoss = computed(() => {
  return losingTrades.value.length > 0 ? grossLoss.value / losingTrades.value.length : 0
})

const riskRewardRatio = computed(() => {
  return Math.abs(averageLoss.value) > 0 ? averageWin.value / Math.abs(averageLoss.value) : 0
})

const largestWin = computed(() => {
  return winningTrades.value.length > 0 ? Math.max(...winningTrades.value.map(t => t.pnlAmount || 0)) : 0
})

const largestLoss = computed(() => {
  return losingTrades.value.length > 0 ? Math.min(...losingTrades.value.map(t => t.pnlAmount || 0)) : 0
})

const largestWinLossRatio = computed(() => {
  return Math.abs(largestLoss.value) > 0 ? largestWin.value / Math.abs(largestLoss.value) : 0
})

const winRate = computed(() => {
  return completedTrades.value.length > 0 ? (winningTrades.value.length / completedTrades.value.length) * 100 : 0
})

const tradeExpectancy = computed(() => {
  if (completedTrades.value.length === 0) return 0
  const totalPnL = completedTrades.value.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
  return totalPnL / completedTrades.value.length
})

// Streak Analysis
const streakAnalysis = computed(() => {
  const trades = [...completedTrades.value].sort((a, b) => new Date(a.exitDate) - new Date(b.exitDate))
  const streaks = []
  let currentStreak = { type: null, count: 0, totalPnL: 0, trades: [] }

  trades.forEach(trade => {
    const isWin = (trade.pnlAmount || 0) > 0
    const streakType = isWin ? 'win' : 'loss'

    if (currentStreak.type === streakType) {
      currentStreak.count++
      currentStreak.totalPnL += (trade.pnlAmount || 0)
      currentStreak.trades.push(trade)
    } else {
      if (currentStreak.type !== null) {
        streaks.push({ ...currentStreak })
      }
      currentStreak = {
        type: streakType,
        count: 1,
        totalPnL: trade.pnlAmount || 0,
        trades: [trade]
      }
    }
  })

  if (currentStreak.type !== null) {
    streaks.push(currentStreak)
  }

  return streaks
})

const currentStreak = computed(() => {
  const streaks = streakAnalysis.value
  return streaks.length > 0 ? streaks[streaks.length - 1] : { type: null, count: 0, totalPnL: 0 }
})

const bestWinStreak = computed(() => {
  const winStreaks = streakAnalysis.value.filter(s => s.type === 'win')
  return winStreaks.length > 0 ? winStreaks.reduce((best, current) =>
    current.count > best.count ? current : best
  ) : { count: 0, totalPnL: 0 }
})

const worstLossStreak = computed(() => {
  const lossStreaks = streakAnalysis.value.filter(s => s.type === 'loss')
  return lossStreaks.length > 0 ? lossStreaks.reduce((worst, current) =>
    current.count > worst.count ? current : worst
  ) : { count: 0, totalPnL: 0 }
})

const averageWinStreak = computed(() => {
  const winStreaks = streakAnalysis.value.filter(s => s.type === 'win')
  return winStreaks.length > 0 ? winStreaks.reduce((sum, s) => sum + s.count, 0) / winStreaks.length : 0
})

const averageLossStreak = computed(() => {
  const lossStreaks = streakAnalysis.value.filter(s => s.type === 'loss')
  return lossStreaks.length > 0 ? lossStreaks.reduce((sum, s) => sum + s.count, 0) / lossStreaks.length : 0
})

// Time to Profitability
const profitabilityTimes = computed(() => {
  return winningTrades.value
    .map(trade => calculateTimeToProfitability(trade))
    .filter(time => time !== null)
})

const averageTimeToProfitability = computed(() => {
  const times = profitabilityTimes.value
  return times.length > 0 ? times.reduce((sum, time) => sum + time, 0) / times.length : 0
})

const fastestProfitTime = computed(() => {
  const times = profitabilityTimes.value
  return times.length > 0 ? Math.min(...times) : 0
})

const profitabilityTimeframes = computed(() => {
  const times = profitabilityTimes.value
  const total = times.length

  if (total === 0) return { oneHour: 0, oneDay: 0, oneWeek: 0 }

  return {
    oneHour: (times.filter(t => t <= 1).length / total) * 100,
    oneDay: (times.filter(t => t <= 24).length / total) * 100,
    oneWeek: (times.filter(t => t <= 24 * 7).length / total) * 100
  }
})

const profitabilityDistribution = computed(() => {
  const times = profitabilityTimes.value
  const buckets = [
    { label: '<1h', min: 0, max: 1 },
    { label: '1h-1d', min: 1, max: 24 },
    { label: '1d-1w', min: 24, max: 24 * 7 },
    { label: '1w-1m', min: 24 * 7, max: 24 * 30 },
    { label: '>1m', min: 24 * 30, max: Infinity }
  ]

  const distribution = buckets.map(bucket => {
    const count = times.filter(t => t >= bucket.min && t < bucket.max).length
    return {
      ...bucket,
      count,
      percentage: times.length > 0 ? (count / times.length) * 100 : 0
    }
  })

  const maxCount = Math.max(...distribution.map(d => d.count))
  return distribution.map(d => ({
    ...d,
    percentage: maxCount > 0 ? (d.count / maxCount) * 100 : 0
  }))
})

const efficiencyInsights = computed(() => {
  const insights = []

  // Profit Factor insights
  if (profitFactor.value > 2) {
    insights.push({
      id: 'excellent-profit-factor',
      type: 'success',
      icon: '🏆',
      title: 'Excellent Profit Factor',
      description: `Your profit factor of ${formatNumber(profitFactor.value, 2)} indicates highly efficient trading.`,
      recommendation: 'Maintain your current strategy and consider scaling up position sizes.'
    })
  } else if (profitFactor.value < 1.2) {
    insights.push({
      id: 'low-profit-factor',
      type: 'warning',
      icon: '⚠️',
      title: 'Low Profit Factor',
      description: `Your profit factor of ${formatNumber(profitFactor.value, 2)} suggests room for improvement.`,
      recommendation: 'Focus on cutting losses earlier or letting winners run longer.'
    })
  }

  // Risk-Reward insights
  if (riskRewardRatio.value > 2) {
    insights.push({
      id: 'excellent-rr',
      type: 'success',
      icon: '⚖️',
      title: 'Excellent Risk Management',
      description: `Your risk-reward ratio of ${formatNumber(riskRewardRatio.value, 2)}:1 shows disciplined trading.`,
      recommendation: 'Continue maintaining strict risk management principles.'
    })
  } else if (riskRewardRatio.value < 1) {
    insights.push({
      id: 'poor-rr',
      type: 'warning',
      icon: '🚨',
      title: 'Poor Risk-Reward Ratio',
      description: `Your average loss exceeds your average win (${formatNumber(riskRewardRatio.value, 2)}:1).`,
      recommendation: 'Review your exit strategies and consider tighter stop losses.'
    })
  }

  // Streak insights
  if (currentStreak.value.type === 'loss' && currentStreak.value.count >= 3) {
    insights.push({
      id: 'current-loss-streak',
      type: 'warning',
      icon: '📉',
      title: 'Current Loss Streak',
      description: `You're currently on a ${currentStreak.value.count}-trade losing streak.`,
      recommendation: 'Consider reducing position sizes and reviewing your strategy.'
    })
  } else if (currentStreak.value.type === 'win' && currentStreak.value.count >= 3) {
    insights.push({
      id: 'current-win-streak',
      type: 'success',
      icon: '📈',
      title: 'Strong Win Streak',
      description: `You're on a ${currentStreak.value.count}-trade winning streak!`,
      recommendation: 'Stay disciplined and avoid overconfidence in position sizing.'
    })
  }

  // Time to profitability insights
  if (averageTimeToProfitability.value < 24) {
    insights.push({
      id: 'fast-profits',
      type: 'info',
      icon: '⚡',
      title: 'Quick Profitability',
      description: `Your trades typically become profitable within ${formatDuration(averageTimeToProfitability.value)}.`,
      recommendation: 'Your timing is good, but ensure you\'re not cutting winners too early.'
    })
  } else if (averageTimeToProfitability.value > 24 * 7) {
    insights.push({
      id: 'slow-profits',
      type: 'info',
      icon: '🐌',
      title: 'Patient Trading Style',
      description: `Your trades take an average of ${formatDuration(averageTimeToProfitability.value)} to become profitable.`,
      recommendation: 'Consider if this aligns with your trading strategy and risk tolerance.'
    })
  }

  return insights
})

// Methods
const getPerformanceClass = (value) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const getProfitFactorClass = (value) => {
  if (value >= 2) return 'excellent'
  if (value >= 1.5) return 'good'
  if (value >= 1.2) return 'fair'
  return 'poor'
}

const getProfitFactorInterpretation = (value) => {
  if (value >= 2) return 'Excellent'
  if (value >= 1.5) return 'Good'
  if (value >= 1.2) return 'Fair'
  if (value >= 1) return 'Break-even'
  return 'Losing'
}

const getRiskRewardInterpretation = (value) => {
  if (value >= 3) return 'Excellent'
  if (value >= 2) return 'Good'
  if (value >= 1.5) return 'Fair'
  if (value >= 1) return 'Acceptable'
  return 'Poor'
}

const getConsistencyInterpretation = (value) => {
  if (value < 2) return 'Very Consistent'
  if (value < 5) return 'Consistent'
  if (value < 10) return 'Moderate'
  return 'Inconsistent'
}

const getCurrentStreakClass = () => {
  if (currentStreak.value.type === 'win') return 'win-streak'
  if (currentStreak.value.type === 'loss') return 'loss-streak'
  return 'no-streak'
}

const getCurrentStreakIcon = () => {
  if (currentStreak.value.type === 'win') return '🔥'
  if (currentStreak.value.type === 'loss') return '❄️'
  return '➖'
}

const updateMetrics = () => {
  // Force reactivity update when period changes
}

const exportMetrics = () => {
  // Implementation for exporting metrics
  const metrics = {
    profitFactor: profitFactor.value,
    riskRewardRatio: riskRewardRatio.value,
    winRate: winRate.value,
    tradeExpectancy: tradeExpectancy.value,
    currentStreak: currentStreak.value,
    bestWinStreak: bestWinStreak.value,
    worstLossStreak: worstLossStreak.value
  }
  
  // eslint-disable-next-line no-console
  console.log('Exporting metrics:', metrics)
  // Could implement CSV/JSON export here
}// Initialize
onMounted(() => {
  updateMetrics()
})
</script>

<style scoped>
.trading-efficiency-metrics {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.metrics-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
  flex-wrap: wrap;
  gap: 1rem;
}

.metrics-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.metrics-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.time-period-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-period-selector label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.time-period-selector select {
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  color: #1f2937;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.375rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  background: white;
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.export-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.export-icon {
  font-size: 1rem;
}

/* Core Metrics */
.core-metrics {
  margin-bottom: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  padding: 1.5rem;
  border-radius: 0.75rem;
  border: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
  transition: all 0.2s ease;
}

.metric-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.metric-card.excellent {
  border-color: #10b981;
  background: linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 100%);
}

.metric-card.good {
  border-color: #3b82f6;
  background: linear-gradient(135deg, #eff6ff 0%, #f0f9ff 100%);
}

.metric-card.fair {
  border-color: #f59e0b;
  background: linear-gradient(135deg, #fefbeb 0%, #fef3c7 100%);
}

.metric-card.poor {
  border-color: #ef4444;
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
}

.metric-header {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.metric-icon {
  font-size: 1.5rem;
  flex-shrink: 0;
}

.metric-info h5 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.metric-description {
  font-size: 0.8rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.metric-value {
  text-align: center;
  margin-bottom: 1rem;
}

.primary-value {
  display: block;
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.metric-interpretation {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.metric-breakdown {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  text-align: center;
  flex: 1;
}

.breakdown-item span:first-child {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.breakdown-item span:last-child {
  font-size: 0.9rem;
  font-weight: 600;
}

/* Streak Analysis */
.streak-analysis {
  margin-bottom: 2rem;
}

.streak-analysis h5 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.streak-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.streak-card {
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: white;
  text-align: center;
}

.streak-card.win-streak {
  background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
  border-color: #10b981;
}

.streak-card.loss-streak {
  background: linear-gradient(135deg, #fef2f2 0%, #fecaca 100%);
  border-color: #ef4444;
}

.streak-card.no-streak {
  background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%);
  border-color: #d1d5db;
}

.streak-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.streak-icon {
  font-size: 1.25rem;
}

.streak-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.streak-value {
  margin-bottom: 0.5rem;
}

.streak-number {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.streak-type {
  font-size: 0.8rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.streak-impact {
  font-size: 0.8rem;
  color: #6b7280;
}

.streak-stats-grid {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.8rem;
}

.stat-label {
  color: #6b7280;
}

.stat-value {
  font-weight: 600;
  color: #1f2937;
}

/* Time to Profitability */
.time-to-profitability {
  margin-bottom: 2rem;
}

.time-to-profitability h5 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.profitability-grid {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
}

.profitability-card {
  padding: 1.25rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
  background: #f8fafc;
}

.card-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.card-icon {
  font-size: 1.25rem;
}

.card-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.profitability-metrics {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.metric-label {
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-weight: 600;
  color: #1f2937;
}

.distribution-chart {
  display: flex;
  align-items: flex-end;
  gap: 0.5rem;
  height: 120px;
  padding: 0.5rem;
}

.distribution-bar {
  flex: 1;
  background: linear-gradient(to top, #3b82f6, #60a5fa);
  border-radius: 2px 2px 0 0;
  position: relative;
  cursor: pointer;
  transition: all 0.2s ease;
}

.distribution-bar:hover {
  opacity: 0.8;
}

.bar-label {
  position: absolute;
  bottom: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  color: #6b7280;
  white-space: nowrap;
}

.bar-value {
  position: absolute;
  top: -20px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 0.7rem;
  font-weight: 600;
  color: #1f2937;
}

/* Efficiency Insights */
.efficiency-insights h5 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.insight-item.success {
  background: #ecfdf5;
  border-color: #10b981;
}

.insight-item.warning {
  background: #fef3c7;
  border-color: #f59e0b;
}

.insight-item.info {
  background: #e0e7ff;
  border-color: #6366f1;
}

.insight-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.insight-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.insight-title {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

.insight-description {
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
}

.insight-recommendation {
  font-size: 0.8rem;
  color: #374151;
  background: rgba(255, 255, 255, 0.6);
  padding: 0.5rem;
  border-radius: 0.25rem;
  margin-top: 0.5rem;
  line-height: 1.3;
}

/* Value color classes */
.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.neutral {
  color: #6b7280;
}

.no-data {
  padding: 2rem 0;
}

/* Mobile responsiveness */
@media (max-width: 768px) {
  .metrics-header {
    flex-direction: column;
    align-items: stretch;
  }

  .metrics-controls {
    justify-content: space-between;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .streak-grid {
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  }

  .profitability-grid {
    grid-template-columns: 1fr;
  }

  .metric-breakdown {
    flex-direction: column;
    gap: 0.5rem;
  }

  .breakdown-item {
    text-align: left;
  }
}

@media (max-width: 480px) {
  .trading-efficiency-metrics {
    padding: 1rem;
  }

  .metrics-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .time-period-selector {
    justify-content: space-between;
  }

  .streak-grid {
    grid-template-columns: 1fr;
  }

  .primary-value {
    font-size: 1.5rem;
  }

  .metric-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }
}
</style>
