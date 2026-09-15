<template>
  <div class="stress-test-analytics">
    <div class="analytics-header">
      <h3 class="analytics-title">
        <span class="icon">🛡️</span>
        Equity Curve Stress Test
      </h3>
      <p class="analytics-subtitle">Monte Carlo simulation of future performance based on historical win rate and RR</p>
    </div>

    <LoadingSpinner
      v-if="isLoading"
      message="Simulating 1,000 future scenarios..."
      size="large"
      full-height
    />

    <EmptyState
      v-else-if="trades.length === 0"
      icon="📊"
      title="No trading data"
      message="Log some trades to simulate your future equity curve"
      :full-height="true"
    />

    <div v-else class="analytics-content">
      <!-- Data Warning -->
      <div v-if="trades.length < 20" class="data-warning">
        <span class="warning-icon">⚠️</span>
        <p>Limited data ({{ trades.length }} trades). Simulations are based on small sample sizes and may be less reliable.</p>
      </div>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-label">Expected Final Equity (Median)</div>
          <div class="metric-value">{{ formatCurrency(metrics.medianFinalEquity) }}</div>
          <div class="metric-detail">After 100 projected trades</div>
        </div>
        <div class="metric-card" :class="{ 'positive': metrics.probProfit > 0.5 }">
          <div class="metric-label">Probability of Profit</div>
          <div class="metric-value">{{ (metrics.probProfit * 100).toFixed(1) }}%</div>
          <div class="metric-detail">Chance of ending above current equity</div>
        </div>
        <div class="metric-card" :class="{ 'danger': metrics.probDrawdown20 > 0.2 }">
          <div class="metric-label">Risk of &gt;20% Drawdown</div>
          <div class="metric-value">{{ (metrics.probDrawdown20 * 100).toFixed(1) }}%</div>
          <div class="metric-detail">Probability of a 20% peak-to-trough drop</div>
        </div>
        <div class="metric-card">
          <div class="metric-label">Historical Win Rate</div>
          <div class="metric-value">{{ (metrics.winRate * 100).toFixed(1) }}%</div>
          <div class="metric-detail">Used as simulation probability</div>
        </div>
      </div>

      <!-- Simulation Chart -->
      <section class="chart-section">
        <div class="section-header">
          <h4>Projected Equity Paths</h4>
          <span class="section-hint">1,000 simulated scenarios</span>
        </div>
        <div class="chart-container">
          <svg
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            class="stress-chart"
          >
            <!-- Grid Lines -->
            <g class="grid">
              <line
                v-for="i in 4"
                :key="`h-${i}`"
                :x1="chartPadding"
                :y1="chartPadding + (chartHeight - 2 * chartPadding) / 4 * i"
                :x2="chartWidth - chartPadding"
                :y2="chartPadding + (chartHeight - 2 * chartPadding) / 4 * i"
                stroke="#e5e7eb"
                stroke-width="1"
              />
            </g>

            <!-- Individual Simulated Paths (Low Opacity) -->
            <g class="simulation-paths">
              <path
                v-for="(path, index) in sampledPaths"
                :key="`path-${index}`"
                :d="generatePathD(path)"
                fill="none"
                stroke="#3b82f6"
                stroke-width="1"
                stroke-opacity="0.05"
              />
            </g>

            <!-- Percentile Lines -->
            <path
              :d="generatePathD(percentiles.p5)"
              fill="none"
              stroke="#ef4444"
              stroke-width="3"
              class="percentile-line"
            />
            <path
              :d="generatePathD(percentiles.p50)"
              fill="none"
              stroke="#3b82f6"
              stroke-width="3"
              class="percentile-line"
            />
            <path
              :d="generatePathD(percentiles.p95)"
              fill="none"
              stroke="#10b981"
              stroke-width="3"
              class="percentile-line"
            />

            <!-- Axis Labels -->
            <text
              x="10"
              :y="chartHeight / 2"
              fill="#6b7280"
              font-size="12"
              text-anchor="start"
              :transform="`rotate(-90, 10, ${chartHeight/2})`"
            >
              P&L Delta
            </text>
            <text
              :x="chartWidth / 2"
              :y="chartHeight - 5"
              fill="#6b7280"
              font-size="12"
              text-anchor="middle"
            >
              Future Trades (1-100)
            </text>
          </svg>
        </div>

        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-line p5" />
            <span>5th Percentile (Worst Case)</span>
          </div>
          <div class="legend-item">
            <span class="legend-line p50" />
            <span>50th Percentile (Median)</span>
          </div>
          <div class="legend-item">
            <span class="legend-line p95" />
            <span>95th Percentile (Best Case)</span>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Trade } from '@/types'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import EmptyState from '../ui/EmptyState.vue'
import { useProfiles } from '@/composables/useProfiles'

const props = defineProps<{
  trades: Trade[]
  isLoading?: boolean
}>()

const { currencySymbol } = useProfiles()

// Chart configuration
const chartWidth = 800
const chartHeight = 400
const chartPadding = 50

// Simulation constants
const NUM_SIMULATIONS = 1000
const TRADES_HORIZON = 100

const formatCurrency = (value: number) => {
  const currencyMap: Record<string, string> = {
    '₹': 'INR',
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY'
  }
  const currency = currencyMap[currencySymbol.value] || 'INR'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const simulationData = computed(() => {
  if (props.trades.length === 0) return null

  // 1. Extract historical stats
  const winningTrades = props.trades.filter(t => (t.pnlAmount || 0) > 0)
  const losingTrades = props.trades.filter(t => (t.pnlAmount || 0) < 0)

  const winRate = winningTrades.length / props.trades.length
  const avgWin = winningTrades.length > 0
    ? winningTrades.reduce((sum, t) => sum + (t.pnlAmount || 0), 0) / winningTrades.length
    : 0
  const avgLoss = losingTrades.length > 0
    ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnlAmount || 0), 0) / losingTrades.length)
    : 0

  const currentCumulativePnL = props.trades.reduce((sum, t) => sum + (t.pnlAmount || 0), 0)

  // 2. Run Simulations
  const allPaths: number[][] = []
  const finalEquities: number[] = []
  const maxDrawdowns: number[] = []

  for (let i = 0; i < NUM_SIMULATIONS; i++) {
    const path: number[] = [currentCumulativePnL]
    let currentEquity = currentCumulativePnL
    let peak = currentCumulativePnL
    let maxDD = 0

    for (let j = 0; j < TRADES_HORIZON; j++) {
      const isWin = Math.random() <= winRate
      currentEquity += isWin ? avgWin : -avgLoss
      path.push(currentEquity)

      if (currentEquity > peak) peak = currentEquity
      const dd = peak - currentEquity
      if (dd > maxDD) maxDD = dd
    }

    allPaths.push(path)
    finalEquities.push(currentEquity)
    maxDrawdowns.push(maxDD)
  }

  return {
    allPaths,
    finalEquities,
    maxDrawdowns,
    winRate,
    startingEquity: currentCumulativePnL
  }
})

const metrics = computed(() => {
  const data = simulationData.value
  if (!data) return { winRate: 0, medianFinalEquity: 0, probProfit: 0, probDrawdown20: 0 }

  const sortedFinal = [...data.finalEquities].sort((a, b) => a - b)
  const medianFinal = sortedFinal[Math.floor(NUM_SIMULATIONS / 2)] ?? 0

  const profitablePaths = data.finalEquities.filter(e => e > data.startingEquity).length
  const probProfit = profitablePaths / NUM_SIMULATIONS

  // Risk of > 20% drawdown relative to starting equity
  // For simulation, we'll use 20% of the magnitude of starting equity or a fixed value if starting is 0
  const riskThreshold = Math.abs(data.startingEquity) * 0.2 || 1000 // Fallback to 1000 if equity is 0
  const badDrawdowns = data.maxDrawdowns.filter(dd => dd > riskThreshold).length
  const probDrawdown20 = badDrawdowns / NUM_SIMULATIONS

  return {
    winRate: data.winRate,
    medianFinalEquity: medianFinal,
    probProfit,
    probDrawdown20
  }
})

const percentiles = computed(() => {
  const data = simulationData.value
  if (!data) return { p5: [], p50: [], p95: [] }

  const paths = data.allPaths
  const horizon = TRADES_HORIZON + 1
  const p5: number[] = []
  const p50: number[] = []
  const p95: number[] = []

  for (let step = 0; step < horizon; step++) {
    const stepValues = paths.map(p => p[step] ?? 0).sort((a, b) => a - b)
    p5.push(stepValues[Math.floor(NUM_SIMULATIONS * 0.05)] ?? 0)
    p50.push(stepValues[Math.floor(NUM_SIMULATIONS * 0.50)] ?? 0)
    p95.push(stepValues[Math.floor(NUM_SIMULATIONS * 0.95)] ?? 0)
  }

  return { p5, p50, p95 }
})

const sampledPaths = computed(() => {
  const data = simulationData.value
  if (!data) return []
  // Sample 50 paths for the background "fan" to avoid SVG bloat
  return data.allPaths.filter((_, i) => i % (NUM_SIMULATIONS / 50) === 0)
})

const generatePathD = (path: number[]) => {
  if (!path || path.length === 0) return ''

  const allValues = [...percentiles.value.p5, ...percentiles.value.p95]
  const minVal = Math.min(...allValues)
  const maxVal = Math.max(...allValues)
  const range = maxVal - minVal || 1

  return path.map((val, i) => {
    const x = chartPadding + (i / TRADES_HORIZON) * (chartWidth - 2 * chartPadding)
    const normalized = (val - minVal) / range
    const y = chartHeight - chartPadding - (normalized * (chartHeight - 2 * chartPadding))
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
}
</script>

<style scoped>
.stress-test-analytics {
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin: 1rem 0;
}

.analytics-header {
  margin-bottom: 2rem;
}

.analytics-title {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.analytics-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.data-warning {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: #fffbeb;
  border: 1px solid #fcd34d;
  color: #92400e;
  border-radius: 8px;
  margin-bottom: 1.5rem;
  font-size: 0.875rem;
}

.warning-icon {
  font-size: 1.25rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  padding: 1.25rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 600;
  letter-spacing: 0.025em;
}

.metric-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.metric-detail {
  font-size: 0.75rem;
  color: #9ca3af;
}

.metric-card.positive {
  border-left: 4px solid #10b981;
}

.metric-card.danger {
  border-left: 4px solid #ef4444;
}

.chart-section {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h4 {
  margin: 0;
  font-size: 1.125rem;
  color: #374151;
  font-weight: 600;
}

.section-hint {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}

.chart-container {
  width: 100%;
  overflow-x: auto;
  display: flex;
  justify-content: center;
}

.stress-chart {
  width: 100%;
  max-width: 800px;
  height: auto;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.legend-line {
  width: 30px;
  height: 3px;
  border-radius: 2px;
}

.legend-line.p5 { background: #ef4444; }
.legend-line.p50 { background: #3b82f6; }
.legend-line.p95 { background: #10b981; }

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .analytics-title {
    font-size: 1.25rem;
  }
}
</style>
