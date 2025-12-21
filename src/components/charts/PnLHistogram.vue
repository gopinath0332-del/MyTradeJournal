<template>
  <div class="pnl-histogram">
    <div class="histogram-header">
      <h4>P&L Distribution</h4>
      <div class="histogram-controls">
        <div class="bin-size-selector">
          <label for="bin-size">Bin Size:</label>
          <select id="bin-size" v-model="selectedBinSize" @change="updateHistogram">
            <option value="auto">Auto</option>
            <option value="1000">{{ currencySymbol }}1,000</option>
            <option value="2500">{{ currencySymbol }}2,500</option>
            <option value="5000">{{ currencySymbol }}5,000</option>
            <option value="10000">{{ currencySymbol }}10,000</option>
            <option value="25000">{{ currencySymbol }}25,000</option>
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

    <div v-if="trades.length === 0" class="no-data">
      <EmptyState
        icon="📊"
        title="No P&L Data"
        message="Start trading to see profit and loss distribution"
      />
    </div>

    <div v-else class="histogram-content">
      <!-- Summary Statistics -->
      <div class="histogram-summary">
        <div class="summary-stats">
          <div class="stat-item">
            <span class="stat-label">Total Trades</span>
            <span class="stat-value">{{ trades.length }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Profitable Trades</span>
            <span class="stat-value positive">
              {{ profitableTrades }} ({{ formatPercentage(profitablePercentage) }}%)
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Loss Trades</span>
            <span class="stat-value negative">
              {{ lossTrades }} ({{ formatPercentage(lossPercentage) }}%)
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Breakeven Trades</span>
            <span class="stat-value neutral">
              {{ breakevenTrades }} ({{ formatPercentage(breakevenPercentage) }}%)
            </span>
          </div>
        </div>

        <div class="distribution-stats">
          <div class="stat-item">
            <span class="stat-label">Mean P&L</span>
            <span class="stat-value" :class="getPerformanceClass(meanPnL)">
              {{ formatCurrency(meanPnL) }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Median P&L</span>
            <span class="stat-value" :class="getPerformanceClass(medianPnL)">
              {{ formatCurrency(medianPnL) }}
            </span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Standard Deviation</span>
            <span class="stat-value">{{ formatCurrency(standardDeviation) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Skewness</span>
            <span class="stat-value" :class="getSkewnessClass(skewness)">
              {{ formatNumber(skewness, 2) }}
            </span>
          </div>
        </div>
      </div>

      <!-- Histogram Chart -->
      <div class="histogram-chart">
        <div class="chart-container">
          <div class="y-axis-label">
            {{ showPercentage ? 'Percentage of Trades' : 'Number of Trades' }}
          </div>
          <div class="chart-area">
            <div class="histogram-bars">
              <div
                v-for="(bin, index) in histogramBins"
                :key="index"
                class="histogram-bin"
                :style="{ height: `${bin.height}%` }"
                :class="getBinClass(bin)"
                @mouseenter="showTooltip($event, bin)"
                @mouseleave="hideTooltip"
              >
                <div class="bin-label">
                  {{ formatBinLabel(bin) }}
                </div>
                <div class="bin-value">
                  {{ showPercentage ? formatPercentage(bin.percentage) + '%' : bin.count }}
                </div>
              </div>
            </div>
            <div class="x-axis">
              <div class="x-axis-label">P&L Range ({{ currencySymbol }})</div>
            </div>
          </div>
        </div>

        <!-- Tooltip -->
        <div
          v-show="tooltipVisible"
          ref="tooltip"
          class="histogram-tooltip"
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
                <span>Avg P&L:</span>
                <span :class="getPerformanceClass(tooltipData.avgPnL)">
                  {{ formatCurrency(tooltipData.avgPnL) }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Distribution Insights -->
      <div class="distribution-insights">
        <h5>Distribution Insights</h5>
        <div class="insights-list">
          <div
            v-for="insight in distributionInsights"
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
import { useProfiles } from '@/composables/useProfiles'

const { currencySymbol } = useProfiles()
const currencyMap = {
  '$': 'USD',
  '₹': 'INR',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY'
}
const currencyCode = computed(() => currencyMap[currencySymbol.value] || 'INR')

const props = defineProps({
  trades: {
    type: Array,
    default: () => []
  }
})

// Reactive data
const selectedBinSize = ref('auto')
const showPercentage = ref(false)
const tooltipVisible = ref(false)
const tooltipStyle = ref({})
const tooltipData = ref({})
const tooltip = ref(null)

// Inject formatting functions
const formatCurrency = inject('formatCurrency', (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode.value,
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

// Computed properties
const pnlValues = computed(() => {
  return props.trades.map(trade => trade.pnlAmount || 0).sort((a, b) => a - b)
})

const profitableTrades = computed(() => {
  return props.trades.filter(trade => (trade.pnlAmount || 0) > 0).length
})

const lossTrades = computed(() => {
  return props.trades.filter(trade => (trade.pnlAmount || 0) < 0).length
})

const breakevenTrades = computed(() => {
  return props.trades.filter(trade => (trade.pnlAmount || 0) === 0).length
})

const profitablePercentage = computed(() => {
  return props.trades.length > 0 ? (profitableTrades.value / props.trades.length) * 100 : 0
})

const lossPercentage = computed(() => {
  return props.trades.length > 0 ? (lossTrades.value / props.trades.length) * 100 : 0
})

const breakevenPercentage = computed(() => {
  return props.trades.length > 0 ? (breakevenTrades.value / props.trades.length) * 100 : 0
})

const meanPnL = computed(() => {
  if (pnlValues.value.length === 0) return 0
  return pnlValues.value.reduce((sum, val) => sum + val, 0) / pnlValues.value.length
})

const medianPnL = computed(() => {
  if (pnlValues.value.length === 0) return 0
  const mid = Math.floor(pnlValues.value.length / 2)
  return pnlValues.value.length % 2 === 0
    ? (pnlValues.value[mid - 1] + pnlValues.value[mid]) / 2
    : pnlValues.value[mid]
})

const standardDeviation = computed(() => {
  if (pnlValues.value.length <= 1) return 0
  const mean = meanPnL.value
  const squaredDiffs = pnlValues.value.map(val => Math.pow(val - mean, 2))
  const avgSquaredDiff = squaredDiffs.reduce((sum, val) => sum + val, 0) / pnlValues.value.length
  return Math.sqrt(avgSquaredDiff)
})

const skewness = computed(() => {
  if (pnlValues.value.length <= 2 || standardDeviation.value === 0) return 0
  const mean = meanPnL.value
  const std = standardDeviation.value
  const n = pnlValues.value.length

  const cubedDeviations = pnlValues.value.map(val => Math.pow((val - mean) / std, 3))
  const sum = cubedDeviations.reduce((sum, val) => sum + val, 0)

  return (n / ((n - 1) * (n - 2))) * sum
})

const optimalBinSize = computed(() => {
  if (pnlValues.value.length === 0) return 1000

  // Use Freedman-Diaconis rule or Sturges' rule
  const n = pnlValues.value.length
  const q75 = pnlValues.value[Math.floor(n * 0.75)]
  const q25 = pnlValues.value[Math.floor(n * 0.25)]
  const iqr = q75 - q25

  if (iqr > 0) {
    // Freedman-Diaconis rule
    const binWidth = 2 * iqr / Math.pow(n, 1 / 3)
    return Math.max(100, Math.round(binWidth / 100) * 100)
  } else {
    // Sturges' rule fallback
    const range = pnlValues.value[n - 1] - pnlValues.value[0]
    const numBins = Math.ceil(Math.log2(n) + 1)
    return Math.max(100, Math.round(range / numBins / 100) * 100)
  }
})

const binSize = computed(() => {
  return selectedBinSize.value === 'auto' ? optimalBinSize.value : parseInt(selectedBinSize.value)
})

const histogramBins = computed(() => {
  if (pnlValues.value.length === 0) return []

  const min = pnlValues.value[0]
  const max = pnlValues.value[pnlValues.value.length - 1]
  const size = binSize.value

  // Create bins
  const bins = []
  const start = Math.floor(min / size) * size
  const end = Math.ceil(max / size) * size

  for (let binStart = start; binStart < end; binStart += size) {
    const binEnd = binStart + size
    const tradesInBin = props.trades.filter(trade => {
      const pnl = trade.pnlAmount || 0
      return pnl >= binStart && pnl < binEnd
    })

    if (tradesInBin.length > 0 || (binStart <= 0 && binEnd > 0)) {
      const avgPnL = tradesInBin.length > 0
        ? tradesInBin.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0) / tradesInBin.length
        : 0

      bins.push({
        start: binStart,
        end: binEnd,
        count: tradesInBin.length,
        percentage: (tradesInBin.length / props.trades.length) * 100,
        trades: tradesInBin,
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

const distributionInsights = computed(() => {
  const insights = []

  // Skewness insight
  if (Math.abs(skewness.value) > 1) {
    insights.push({
      id: 'skewness',
      type: skewness.value > 0 ? 'warning' : 'info',
      icon: skewness.value > 0 ? '⚠️' : 'ℹ️',
      title: skewness.value > 0 ? 'Right-skewed Distribution' : 'Left-skewed Distribution',
      description: skewness.value > 0
        ? 'Most trades are small profits/losses with occasional large profits'
        : 'Most trades are small profits/losses with occasional large losses'
    })
  }

  // Win rate insight
  if (profitablePercentage.value > 60) {
    insights.push({
      id: 'high-winrate',
      type: 'success',
      icon: '✅',
      title: 'High Win Rate',
      description: `${formatPercentage(profitablePercentage.value)}% of trades are profitable`
    })
  } else if (profitablePercentage.value < 40) {
    insights.push({
      id: 'low-winrate',
      type: 'warning',
      icon: '⚠️',
      title: 'Low Win Rate',
      description: `Only ${formatPercentage(profitablePercentage.value)}% of trades are profitable`
    })
  }

  // Risk-reward insight
  const avgProfit = props.trades
    .filter(trade => (trade.pnlAmount || 0) > 0)
    .reduce((sum, trade, _, arr) => sum + (trade.pnlAmount || 0) / arr.length, 0)
  const avgLoss = Math.abs(props.trades
    .filter(trade => (trade.pnlAmount || 0) < 0)
    .reduce((sum, trade, _, arr) => sum + (trade.pnlAmount || 0) / arr.length, 0))

  if (avgProfit > 0 && avgLoss > 0) {
    const riskReward = avgProfit / avgLoss
    if (riskReward > 2) {
      insights.push({
        id: 'good-rr',
        type: 'success',
        icon: '💰',
        title: 'Excellent Risk-Reward',
        description: `Average profit is ${formatNumber(riskReward, 1)}x larger than average loss`
      })
    } else if (riskReward < 1) {
      insights.push({
        id: 'poor-rr',
        type: 'warning',
        icon: '📉',
        title: 'Poor Risk-Reward',
        description: `Average loss is larger than average profit (${formatNumber(riskReward, 1)}:1)`
      })
    }
  }

  return insights
})

// Methods
const getPerformanceClass = (value) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const getSkewnessClass = (value) => {
  if (Math.abs(value) < 0.5) return 'neutral'
  if (value > 0) return 'positive'
  return 'negative'
}

const getBinClass = (bin) => {
  if (bin.start >= 0) return 'profit-bin'
  if (bin.end <= 0) return 'loss-bin'
  return 'mixed-bin'
}

const formatBinLabel = (bin) => {
  const formatShort = (amount) => {
    const abs = Math.abs(amount)
    if (abs >= 100000) return `${currencySymbol.value}${(amount / 100000).toFixed(0)}L`
    if (abs >= 1000) return `${currencySymbol.value}${(amount / 1000).toFixed(0)}K`
    return `${currencySymbol.value}${amount}`
  }

  if (bin.start >= 0 && bin.end > 0) {
    return `${formatShort(bin.start)} to ${formatShort(bin.end)}`
  } else if (bin.start < 0 && bin.end <= 0) {
    return `${formatShort(bin.start)} to ${formatShort(bin.end)}`
  } else {
    return `${formatShort(bin.start)} to ${formatShort(bin.end)}`
  }
}

const showTooltip = (event, bin) => {
  tooltipData.value = {
    range: formatBinLabel(bin),
    count: bin.count,
    percentage: formatPercentage(bin.percentage),
    avgPnL: bin.avgPnL
  }

  const rect = event.target.getBoundingClientRect()
  tooltipStyle.value = {
    top: `${rect.top - 100}px`,
    left: `${rect.left + rect.width / 2}px`,
    transform: 'translateX(-50%)'
  }

  tooltipVisible.value = true
}

const hideTooltip = () => {
  tooltipVisible.value = false
}

const updateHistogram = () => {
  // Force reactivity update
  // The computed properties will automatically recalculate
}

// Initialize
onMounted(() => {
  updateHistogram()
})
</script>

<style scoped>
.pnl-histogram {
  background: white;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid #e5e7eb;
}

.histogram-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #f3f4f6;
  flex-wrap: wrap;
  gap: 1rem;
}

.histogram-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
}

.histogram-controls {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.bin-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.bin-size-selector label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
}

.bin-size-selector select {
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
.histogram-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
  padding: 1.25rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px solid #e2e8f0;
}

.summary-stats,
.distribution-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 1rem;
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

/* Histogram Chart */
.histogram-chart {
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

.histogram-bars {
  display: flex;
  align-items: flex-end;
  gap: 2px;
  height: 250px;
  padding: 1rem;
  background: #fafbfc;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

.histogram-bin {
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
}

.histogram-bin:hover {
  opacity: 0.8;
  transform: translateY(-2px);
}

.histogram-bin.profit-bin {
  background: linear-gradient(to top, #10b981, #34d399);
}

.histogram-bin.loss-bin {
  background: linear-gradient(to top, #ef4444, #f87171);
}

.histogram-bin.mixed-bin {
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
.histogram-tooltip {
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

/* Distribution Insights */
.distribution-insights h5 {
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
  .histogram-header {
    flex-direction: column;
    align-items: stretch;
  }

  .histogram-controls {
    justify-content: space-between;
  }

  .histogram-summary {
    grid-template-columns: 1fr;
  }

  .summary-stats,
  .distribution-stats {
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
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

  .histogram-bars {
    height: 200px;
    padding: 0.5rem;
    overflow: hidden;
  }

  .histogram-bin {
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
  .pnl-histogram {
    padding: 1rem;
  }

  .histogram-controls {
    flex-direction: column;
    align-items: stretch;
    gap: 0.5rem;
  }

  .bin-size-selector {
    justify-content: space-between;
  }

  .summary-stats,
  .distribution-stats {
    grid-template-columns: 1fr 1fr;
  }
}
</style>
