<template>
  <div class="hold-time-distribution">
    <div class="distribution-header">
      <h4>Hold Time Distribution</h4>
      <div class="distribution-controls">
        <div class="time-unit-selector">
          <label for="time-unit">Time Unit:</label>
          <select id="time-unit" v-model="selectedTimeUnit" @change="updateDistribution">
            <option value="hours">Hours</option>
            <option value="days">Days</option>
            <option value="weeks">Weeks</option>
            <option value="months">Months</option>
          </select>
        </div>
        <div class="view-toggle">
          <button
            :class="['toggle-btn', { active: showPercentage }]"
            @click="showPercentage = !showPercentage"
          >
            {{ showPercentage ? 'Count' : 'Percentage' }}
          </button>
        </div>
      </div>
    </div>

    <div v-if="tradesWithHoldTime.length === 0" class="no-data">
      <EmptyState
        icon="⏱️"
        title="No Hold Time Data"
        message="Completed trades with exit dates are needed to analyze hold time distribution"
      />
    </div>

    <div v-else class="distribution-content">
      <!-- Summary Statistics -->
      <div class="hold-time-summary">
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Total Analyzed Trades</span>
            <span class="stat-value">{{ tradesWithHoldTime.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Average Hold Time</span>
            <span class="stat-value">{{ formatHoldTime(averageHoldTime) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Median Hold Time</span>
            <span class="stat-value">{{ formatHoldTime(medianHoldTime) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Shortest Trade</span>
            <span class="stat-value">{{ formatHoldTime(shortestHoldTime) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Longest Trade</span>
            <span class="stat-value">{{ formatHoldTime(longestHoldTime) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Most Common Duration</span>
            <span class="stat-value">{{ formatTimeRange(mostCommonRange) }}</span>
          </div>
        </div>

        <div class="performance-by-duration">
          <h5>Performance by Hold Duration</h5>
          <div class="performance-grid">
            <div
              v-for="range in performanceByDuration"
              :key="range.label"
              class="performance-item"
            >
              <div class="range-label">{{ range.label }}</div>
              <div class="range-stats">
                <span class="trade-count">{{ range.count }} trades</span>
                <span class="win-rate" :class="getPerformanceClass(range.winRate - 50)">
                  {{ formatPercentage(range.winRate) }}% win rate
                </span>
                <span class="avg-pnl" :class="getPerformanceClass(range.avgPnL)">
                  {{ formatCurrency(range.avgPnL) }} avg P&L
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hold Time Chart -->
      <div class="hold-time-chart">
        <div class="chart-container">
          <div class="y-axis-label">
            {{ showPercentage ? 'Percentage of Trades' : 'Number of Trades' }}
          </div>
          <div class="chart-area">
            <div class="distribution-bars">
              <div
                v-for="(bin, index) in distributionBins"
                :key="index"
                class="distribution-bin"
                :style="{ height: `${bin.height}%` }"
                :class="getBinPerformanceClass(bin)"
                @mouseenter="showTooltip($event, bin)"
                @mouseleave="hideTooltip"
              >
                <div class="bin-label">
                  {{ formatTimeRange(bin) }}
                </div>
                <div class="bin-value">
                  {{ showPercentage ? formatPercentage(bin.percentage) + '%' : bin.count }}
                </div>
              </div>
            </div>
            <div class="x-axis">
              <div class="x-axis-label">Hold Time ({{ selectedTimeUnit }})</div>
            </div>
          </div>
        </div>

        <!-- Tooltip -->
        <div
          v-show="tooltipVisible"
          ref="tooltip"
          class="distribution-tooltip"
          :style="tooltipStyle"
        >
          <div class="tooltip-content">
            <div class="tooltip-header">{{ tooltipData.range }}</div>
            <div class="tooltip-body">
              <div class="tooltip-row">
                <span>Trades:</span>
                <span>{{ tooltipData.count }}</span>
              </div>
              <div class="tooltip-row">
                <span>Percentage:</span>
                <span>{{ tooltipData.percentage }}%</span>
              </div>
              <div class="tooltip-row">
                <span>Win Rate:</span>
                <span :class="getPerformanceClass(tooltipData.winRate - 50)">
                  {{ tooltipData.winRate }}%
                </span>
              </div>
              <div class="tooltip-row">
                <span>Avg P&L:</span>
                <span :class="getPerformanceClass(tooltipData.avgPnL)">
                  {{ formatCurrency(tooltipData.avgPnL) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Hold Time Insights -->
      <div class="hold-time-insights">
        <h5>Hold Time Insights</h5>
        <div class="insights-list">
          <div
            v-for="insight in holdTimeInsights"
            :key="insight.id"
            class="insight-item"
            :class="insight.type"
          >
            <div class="insight-icon">{{ insight.icon }}</div>
            <div class="insight-content">
              <span class="insight-title">{{ insight.title }}</span>
              <span class="insight-description">{{ insight.description }}</span>
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
const selectedTimeUnit = ref('days')
const showPercentage = ref(false)
const tooltipVisible = ref(false)
const tooltipStyle = ref({})
const tooltipData = ref({})
const tooltip = ref(null)

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

// Helper functions
const calculateHoldTimeInHours = (entryDate, exitDate) => {
  const entry = new Date(entryDate)
  const exit = new Date(exitDate)
  return (exit - entry) / (1000 * 60 * 60) // Convert to hours
}

const convertTime = (hours, unit) => {
  switch (unit) {
    case 'hours': return hours
    case 'days': return hours / 24
    case 'weeks': return hours / (24 * 7)
    case 'months': return hours / (24 * 30) // Approximate month
    default: return hours
  }
}

const formatHoldTime = (hours) => {
  if (hours < 1) {
    return `${Math.round(hours * 60)}m`
  } else if (hours < 24) {
    return `${Math.round(hours)}h`
  } else if (hours < 24 * 7) {
    const days = Math.round(hours / 24)
    return `${days}d`
  } else if (hours < 24 * 30) {
    const weeks = Math.round(hours / (24 * 7))
    return `${weeks}w`
  } else {
    const months = Math.round(hours / (24 * 30))
    return `${months}mo`
  }
}

const formatTimeRange = (bin) => {
  const unit = selectedTimeUnit.value
  const start = Math.round(bin.start * 10) / 10
  const end = Math.round(bin.end * 10) / 10

  if (unit === 'hours') {
    return `${start}-${end}h`
  } else if (unit === 'days') {
    return `${start}-${end}d`
  } else if (unit === 'weeks') {
    return `${start}-${end}w`
  } else {
    return `${start}-${end}mo`
  }
}

// Computed properties
const tradesWithHoldTime = computed(() => {
  return props.trades.filter(trade => trade.exitDate && trade.entryDate)
})

const holdTimesInHours = computed(() => {
  return tradesWithHoldTime.value.map(trade => {
    const hours = calculateHoldTimeInHours(trade.entryDate, trade.exitDate)
    return {
      ...trade,
      holdTimeHours: hours,
      holdTimeConverted: convertTime(hours, selectedTimeUnit.value)
    }
  }).sort((a, b) => a.holdTimeConverted - b.holdTimeConverted)
})

const averageHoldTime = computed(() => {
  if (holdTimesInHours.value.length === 0) return 0
  const totalHours = holdTimesInHours.value.reduce((sum, trade) => sum + trade.holdTimeHours, 0)
  return totalHours / holdTimesInHours.value.length
})

const medianHoldTime = computed(() => {
  if (holdTimesInHours.value.length === 0) return 0
  const sorted = [...holdTimesInHours.value].sort((a, b) => a.holdTimeHours - b.holdTimeHours)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0
    ? (sorted[mid - 1].holdTimeHours + sorted[mid].holdTimeHours) / 2
    : sorted[mid].holdTimeHours
})

const shortestHoldTime = computed(() => {
  if (holdTimesInHours.value.length === 0) return 0
  return Math.min(...holdTimesInHours.value.map(trade => trade.holdTimeHours))
})

const longestHoldTime = computed(() => {
  if (holdTimesInHours.value.length === 0) return 0
  return Math.max(...holdTimesInHours.value.map(trade => trade.holdTimeHours))
})

const distributionBins = computed(() => {
  if (holdTimesInHours.value.length === 0) return []

  const values = holdTimesInHours.value.map(trade => trade.holdTimeConverted)
  const min = Math.min(...values)
  const max = Math.max(...values)

  // Calculate optimal number of bins (between 5 and 15)
  const numBins = Math.min(15, Math.max(5, Math.ceil(Math.sqrt(values.length))))
  const binSize = (max - min) / numBins

  const bins = []
  for (let i = 0; i < numBins; i++) {
    const binStart = min + (i * binSize)
    const binEnd = i === numBins - 1 ? max + 0.01 : min + ((i + 1) * binSize)

    const tradesInBin = holdTimesInHours.value.filter(trade =>
      trade.holdTimeConverted >= binStart && trade.holdTimeConverted < binEnd
    )

    if (tradesInBin.length > 0) {
      const winningTrades = tradesInBin.filter(trade => (trade.pnlAmount || 0) > 0)
      const winRate = (winningTrades.length / tradesInBin.length) * 100
      const avgPnL = tradesInBin.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0) / tradesInBin.length

      bins.push({
        start: binStart,
        end: binEnd,
        count: tradesInBin.length,
        percentage: (tradesInBin.length / holdTimesInHours.value.length) * 100,
        trades: tradesInBin,
        winRate,
        avgPnL
      })
    }
  }

  // Calculate heights for visualization
  const maxCount = Math.max(...bins.map(bin => bin.count))
  const maxPercentage = Math.max(...bins.map(bin => bin.percentage))
  const maxValue = showPercentage.value ? maxPercentage : maxCount

  return bins.map(bin => ({
    ...bin,
    height: maxValue > 0 ? ((showPercentage.value ? bin.percentage : bin.count) / maxValue) * 100 : 0
  }))
})

const mostCommonRange = computed(() => {
  if (distributionBins.value.length === 0) return { start: 0, end: 0 }
  return distributionBins.value.reduce((max, bin) => bin.count > max.count ? bin : max)
})

const performanceByDuration = computed(() => {
  const ranges = [
    { label: 'Intraday (< 1 day)', filter: (hours) => hours < 24 },
    { label: 'Short-term (1-7 days)', filter: (hours) => hours >= 24 && hours < 24 * 7 },
    { label: 'Medium-term (1-4 weeks)', filter: (hours) => hours >= 24 * 7 && hours < 24 * 28 },
    { label: 'Long-term (> 1 month)', filter: (hours) => hours >= 24 * 28 }
  ]

  return ranges.map(range => {
    const rangeTrades = holdTimesInHours.value.filter(trade => range.filter(trade.holdTimeHours))
    const winningTrades = rangeTrades.filter(trade => (trade.pnlAmount || 0) > 0)
    const winRate = rangeTrades.length > 0 ? (winningTrades.length / rangeTrades.length) * 100 : 0
    const avgPnL = rangeTrades.length > 0
      ? rangeTrades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0) / rangeTrades.length
      : 0

    return {
      ...range,
      count: rangeTrades.length,
      winRate,
      avgPnL
    }
  }).filter(range => range.count > 0)
})

const holdTimeInsights = computed(() => {
  const insights = []

  // Average vs median comparison
  const avgHours = averageHoldTime.value
  const medHours = medianHoldTime.value
  const ratio = medHours > 0 ? avgHours / medHours : 1

  if (ratio > 1.5) {
    insights.push({
      id: 'long-tail',
      type: 'info',
      icon: '📊',
      title: 'Long-tail Distribution',
      description: 'You have some very long-held trades that skew the average hold time upward'
    })
  }

  // Performance by duration insights
  const bestRange = performanceByDuration.value.reduce((best, range) =>
    range.avgPnL > best.avgPnL ? range : best
  , { avgPnL: -Infinity, label: 'None' })

  if (bestRange.avgPnL > 0) {
    insights.push({
      id: 'best-duration',
      type: 'success',
      icon: '⭐',
      title: 'Optimal Hold Duration',
      description: `${bestRange.label} trades perform best with ${formatPercentage(bestRange.winRate)}% win rate`
    })
  }

  // Intraday vs swing trading
  const intradayTrades = holdTimesInHours.value.filter(trade => trade.holdTimeHours < 24)
  const swingTrades = holdTimesInHours.value.filter(trade => trade.holdTimeHours >= 24)

  if (intradayTrades.length > swingTrades.length * 2) {
    insights.push({
      id: 'intraday-trader',
      type: 'info',
      icon: '⚡',
      title: 'Intraday Trader',
      description: `${formatPercentage((intradayTrades.length / holdTimesInHours.value.length) * 100)}% of your trades are closed within the same day`
    })
  } else if (swingTrades.length > intradayTrades.length * 2) {
    insights.push({
      id: 'swing-trader',
      type: 'info',
      icon: '🌊',
      title: 'Swing Trader',
      description: `${formatPercentage((swingTrades.length / holdTimesInHours.value.length) * 100)}% of your trades are held for more than a day`
    })
  }

  // Consistency insight
  const avgDays = avgHours / 24
  if (avgDays < 1) {
    insights.push({
      id: 'fast-trader',
      type: 'warning',
      icon: '🏃',
      title: 'Fast Trading Style',
      description: 'You typically close trades quickly. Consider if this allows enough time for trades to develop'
    })
  } else if (avgDays > 30) {
    insights.push({
      id: 'patient-trader',
      type: 'success',
      icon: '🧘',
      title: 'Patient Trading Style',
      description: 'You hold trades for extended periods. This can be beneficial for trend-following strategies'
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

const getBinPerformanceClass = (bin) => {
  if (bin.winRate > 60) return 'high-performance'
  if (bin.winRate < 40) return 'low-performance'
  return 'neutral-performance'
}

const showTooltip = (event, bin) => {
  tooltipData.value = {
    range: formatTimeRange(bin),
    count: bin.count,
    percentage: formatPercentage(bin.percentage),
    winRate: formatPercentage(bin.winRate),
    avgPnL: bin.avgPnL
  }

  const rect = event.target.getBoundingClientRect()
  tooltipStyle.value = {
    top: `${rect.top - 120}px`,
    left: `${rect.left + rect.width / 2}px`,
    transform: 'translateX(-50%)'
  }

  tooltipVisible.value = true
}

const hideTooltip = () => {
  tooltipVisible.value = false
}

const updateDistribution = () => {
  // Force reactivity update when time unit changes
  // The computed properties will automatically recalculate
}

// Initialize
onMounted(() => {
  updateDistribution()
})
</script>

<style scoped>
.hold-time-distribution {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.distribution-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
  flex-wrap: wrap;
  gap: 1rem;
}

.distribution-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.distribution-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.time-unit-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.time-unit-selector label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.time-unit-selector select {
  padding: 0.375rem 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  color: #1f2937;
}

.view-toggle .toggle-btn {
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

.view-toggle .toggle-btn:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.view-toggle .toggle-btn.active {
  background: #3b82f6;
  border-color: #3b82f6;
  color: white;
}

/* Summary Statistics */
.hold-time-summary {
  margin-bottom: 2rem;
}

.summary-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
}

.stat-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

/* Performance by Duration */
.performance-by-duration h5 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.performance-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1rem;
}

.performance-item {
  padding: 1rem;
  background: white;
  border-radius: 0.5rem;
  border: 1px solid #e5e7eb;
}

.range-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.range-stats {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.trade-count {
  font-size: 0.8rem;
  color: #6b7280;
}

.win-rate,
.avg-pnl {
  font-size: 0.8rem;
  font-weight: 500;
}

/* Hold Time Chart */
.hold-time-chart {
  margin-bottom: 2rem;
  position: relative;
}

.chart-container {
  display: flex;
  gap: 1rem;
  min-height: 300px;
}

.y-axis-label {
  writing-mode: vertical-rl;
  text-orientation: mixed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  min-width: 20px;
}

.chart-area {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.distribution-bars {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  height: 250px;
  padding: 1rem;
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

.distribution-bin {
  flex: 1;
  min-width: 0;
  max-width: 80px;
  display: flex;
  flex-direction: column;
  justify-content: flex-end;
  align-items: center;
  cursor: pointer;
  transition: all 0.2s ease;
  border-radius: 2px 2px 0 0;
  position: relative;
  background: linear-gradient(to top, #3b82f6, #60a5fa);
}

.distribution-bin:hover {
  opacity: 0.8;
  transform: translateY(-2px);
}

.distribution-bin.high-performance {
  background: linear-gradient(to top, #10b981, #34d399);
}

.distribution-bin.low-performance {
  background: linear-gradient(to top, #ef4444, #f87171);
}

.distribution-bin.neutral-performance {
  background: linear-gradient(to top, #6b7280, #9ca3af);
}

.bin-label {
  position: absolute;
  bottom: -30px;
  font-size: 0.65rem;
  color: #6b7280;
  text-align: center;
  width: 100%;
  transform: rotate(-35deg);
  transform-origin: center;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.bin-value {
  position: absolute;
  top: -25px;
  font-size: 0.75rem;
  font-weight: 600;
  color: #1f2937;
  text-align: center;
  width: 100%;
}

.x-axis {
  margin-top: 40px;
  text-align: center;
}

.x-axis-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

/* Tooltip */
.distribution-tooltip {
  position: fixed;
  z-index: 1000;
  pointer-events: none;
}

.tooltip-content {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.75rem;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.tooltip-header {
  font-weight: 600;
  margin-bottom: 0.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  padding-bottom: 0.25rem;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.25rem;
}

.tooltip-row:last-child {
  margin-bottom: 0;
}

/* Hold Time Insights */
.hold-time-insights h5 {
  margin: 0 0 1rem 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1f2937;
}

.insights-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 0.375rem;
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
  font-size: 1.125rem;
  flex-shrink: 0;
}

.insight-content {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
  min-width: 0;
}

.insight-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
}

.insight-description {
  font-size: 0.8rem;
  color: #6b7280;
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
  .distribution-header {
    flex-direction: column;
    align-items: stretch;
  }

  .distribution-controls {
    justify-content: space-between;
  }

  .summary-stats {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }

  .performance-grid {
    grid-template-columns: 1fr;
  }

  .chart-container {
    flex-direction: column;
    gap: 0.5rem;
  }

  .y-axis-label {
    writing-mode: horizontal-tb;
    text-orientation: mixed;
    min-width: auto;
    min-height: 20px;
  }

  .distribution-bars {
    height: 200px;
    padding: 0.5rem;
    overflow: hidden;
  }

  .distribution-bin {
    min-width: 0;
    max-width: 50px;
  }

  .bin-label {
    font-size: 0.55rem;
    bottom: -25px;
    transform: rotate(-30deg);
  }

  .bin-value {
    font-size: 0.7rem;
    top: -20px;
  }
}

@media (max-width: 480px) {
  .hold-time-distribution {
    padding: 1rem;
  }

  .distribution-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .time-unit-selector {
    justify-content: space-between;
  }

  .summary-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
