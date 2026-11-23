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
            preserveAspectRatio="none"
            class="stress-chart"
          >
            <!-- Grid Lines -->
            <g class="grid">
              <line
                v-for="(line, index) in horizontalGridLines"
                :key="`h-${index}`"
                :x1="margin.left"
                :x2="chartWidth - margin.right"
                :y1="line.y"
                :y2="line.y"
                :class="['grid-line', { 'is-zero': line.value === 0 }]"
              />
            </g>

            <!-- Zero / Starting Baseline -->
            <line
              :x1="margin.left"
              :y1="zeroLineY"
              :x2="chartWidth - margin.right"
              :y2="zeroLineY"
              class="zero-baseline"
            />

            <!-- Positive Probability Cone (p50 to p95) -->
            <path
              v-if="conePositivePath"
              :d="conePositivePath"
              class="cone-positive"
            />

            <!-- Negative Probability Cone (p5 to p50) -->
            <path
              v-if="coneNegativePath"
              :d="coneNegativePath"
              class="cone-negative"
            />

            <!-- Individual Simulated Paths (Subtle background paths) -->
            <g class="simulation-paths">
              <path
                v-for="(path, index) in sampledPaths"
                :key="`path-${index}`"
                :d="generatePathD(path)"
                fill="none"
                stroke="#94a3b8"
                stroke-width="1"
                stroke-opacity="0.08"
              />
            </g>

            <!-- Percentile Lines -->
            <path
              :d="generatePathD(percentiles.p5)"
              fill="none"
              stroke="#dc2626"
              stroke-width="2.2"
              class="percentile-line p5"
            />
            <path
              :d="generatePathD(percentiles.p50)"
              fill="none"
              stroke="#2563eb"
              stroke-width="2.2"
              stroke-dasharray="4,4"
              class="percentile-line p50"
            />
            <path
              :d="generatePathD(percentiles.p95)"
              fill="none"
              stroke="#16a34a"
              stroke-width="2.2"
              class="percentile-line p95"
            />

            <!-- Endpoint Beaded Dots -->
            <circle
              v-if="percentiles.p95.length"
              :cx="getX(TRADES_HORIZON)"
              :cy="getY(percentiles.p95[TRADES_HORIZON] ?? 0)"
              r="4.5"
              fill="#16a34a"
              stroke="#ffffff"
              stroke-width="1.5"
            />
            <circle
              v-if="percentiles.p50.length"
              :cx="getX(TRADES_HORIZON)"
              :cy="getY(percentiles.p50[TRADES_HORIZON] ?? 0)"
              r="4.5"
              fill="#2563eb"
              stroke="#ffffff"
              stroke-width="1.5"
            />
            <circle
              v-if="percentiles.p5.length"
              :cx="getX(TRADES_HORIZON)"
              :cy="getY(percentiles.p5[TRADES_HORIZON] ?? 0)"
              r="4.5"
              fill="#dc2626"
              stroke="#ffffff"
              stroke-width="1.5"
            />

            <!-- Y-Axis Labels -->
            <g class="y-axis-labels">
              <text
                v-for="(label, index) in yAxisLabels"
                :key="`y-${index}`"
                :x="margin.left - 12"
                :y="label.y"
                class="axis-label y-label"
                text-anchor="end"
                dominant-baseline="middle"
              >
                {{ formatAxisCurrency(label.value) }}
              </text>
            </g>

            <!-- X-Axis Labels -->
            <g class="x-axis-labels">
              <text
                v-for="step in [0, 25, 50, 75, 100]"
                :key="step"
                :x="getX(step)"
                :y="chartHeight - margin.bottom + 22"
                class="axis-label x-label"
                text-anchor="middle"
              >
                +{{ step }} trades
              </text>
            </g>
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
const chartWidth = 900
const chartHeight = 440
const margin = { top: 25, right: 30, bottom: 45, left: 75 }

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

const formatAxisCurrency = (val: number) => {
  if (val === 0) return `${currencySymbol.value || '₹'}0`
  const abs = Math.abs(val)
  let formatted
  if (abs >= 10000000) formatted = (abs / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr'
  else if (abs >= 100000) formatted = (abs / 100000).toFixed(1).replace(/\.0$/, '') + 'L'
  else if (abs >= 1000) formatted = (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  else formatted = abs.toLocaleString('en-US')

  const sym = currencySymbol.value || '₹'
  return val < 0 ? `${sym}-${formatted}` : `${sym}${formatted}`
}

const yScaleConfig = computed(() => {
  const allValues = [...percentiles.value.p5, ...percentiles.value.p95]
  if (!allValues.length) {
    return { niceMin: -100, niceMax: 100, ticks: [-100, 0, 100] }
  }
  const starting = simulationData.value?.startingEquity || 0
  const minVal = Math.min(starting, ...allValues)
  const maxVal = Math.max(starting, ...allValues)

  const effectiveMin = Math.min(0, minVal)
  const effectiveMax = Math.max(0, maxVal)
  const rawRange = effectiveMax - effectiveMin || 100

  const targetSteps = 6
  const rawStep = rawRange / targetSteps
  const power = Math.pow(10, Math.floor(Math.log10(rawStep || 1)))
  const fraction = rawStep / power

  let step
  if (fraction <= 1.5) step = 1 * power
  else if (fraction <= 3.5) step = 2 * power
  else if (fraction <= 7.5) step = 5 * power
  else step = 10 * power

  const niceMin = Math.floor(effectiveMin / step) * step
  const niceMax = Math.ceil(effectiveMax / step) * step

  const ticks: number[] = []
  for (let val = niceMin; val <= niceMax + step * 0.1; val += step) {
    ticks.push(Math.round(val * 1000) / 1000)
  }

  return { niceMin, niceMax, ticks }
})

const getX = (i: number) => {
  const dataWidth = chartWidth - margin.left - margin.right
  return margin.left + (i / TRADES_HORIZON) * dataWidth
}

const getY = (val: number) => {
  const { niceMin, niceMax } = yScaleConfig.value
  const dataHeight = chartHeight - margin.top - margin.bottom
  const range = niceMax - niceMin || 1
  return chartHeight - margin.bottom - ((val - niceMin) / range) * dataHeight
}

const zeroLineY = computed(() => {
  const starting = simulationData.value?.startingEquity || 0
  return getY(starting)
})

const horizontalGridLines = computed(() => {
  return yScaleConfig.value.ticks.map(val => ({
    y: getY(val),
    value: val
  }))
})

const yAxisLabels = computed(() => {
  return horizontalGridLines.value
})

const conePositivePath = computed(() => {
  const { p50, p95 } = percentiles.value
  if (!p50.length || !p95.length) return ''
  const upper = p95.map((val, i) => `${getX(i)} ${getY(val)}`)
  const lower = p50.map((val, i) => `${getX(i)} ${getY(val)}`).reverse()
  return `M ${upper[0]} L ${upper.slice(1).join(' L ')} L ${lower.join(' L ')} Z`
})

const coneNegativePath = computed(() => {
  const { p5, p50 } = percentiles.value
  if (!p5.length || !p50.length) return ''
  const upper = p50.map((val, i) => `${getX(i)} ${getY(val)}`)
  const lower = p5.map((val, i) => `${getX(i)} ${getY(val)}`).reverse()
  return `M ${upper[0]} L ${upper.slice(1).join(' L ')} L ${lower.join(' L ')} Z`
})

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

  return path.map((val, i) => {
    const x = getX(i)
    const y = getY(val)
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
  height: 440px;
  position: relative;
}

.stress-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
}

/* Grid & Baseline */
.grid-line {
  stroke: #f1f5f9;
  stroke-width: 1;
}

.grid-line.is-zero {
  stroke: #e2e8f0;
  stroke-width: 1.5;
}

.zero-baseline {
  stroke: #cbd5e1;
  stroke-width: 1.5;
}

/* Probability Cones */
.cone-positive {
  fill: #c6f6d5;
  opacity: 0.65;
}

.cone-negative {
  fill: #fecaca;
  opacity: 0.6;
}

/* Percentile Lines */
.percentile-line.p95 {
  stroke: #16a34a;
  stroke-width: 2.2;
}

.percentile-line.p50 {
  stroke: #2563eb;
  stroke-width: 2.2;
}

.percentile-line.p5 {
  stroke: #dc2626;
  stroke-width: 2.2;
}

/* Axis Labels */
.axis-label {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 11.5px;
  fill: #94a3b8;
  font-weight: 500;
  user-select: none;
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
  color: #64748b;
  font-weight: 500;
}

.legend-line {
  width: 20px;
  height: 3px;
  border-radius: 2px;
}

.legend-line.p5 { background: #dc2626; }
.legend-line.p50 { background: #2563eb; }
.legend-line.p95 { background: #16a34a; }

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
  .analytics-title {
    font-size: 1.25rem;
  }
}
</style>
