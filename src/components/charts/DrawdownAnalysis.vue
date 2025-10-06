<template>
  <div class="drawdown-analysis">
    <!-- Drawdown Metrics Cards -->
    <div class="metrics-grid">
      <div class="metric-card critical">
        <div class="metric-header">
          <h4>Maximum Drawdown</h4>
          <span class="metric-icon">📉</span>
        </div>
        <div class="metric-value">
          <span class="amount" :class="getPerformanceClass(metrics.maxDrawdown)">
            {{ formatCurrency(metrics.maxDrawdown) }}
          </span>
          <span class="percentage">
            ({{ formatPercentage(metrics.maxDrawdownPercentage) }}%)
          </span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <h4>Current Drawdown</h4>
          <span class="metric-icon">📊</span>
        </div>
        <div class="metric-value">
          <span class="amount" :class="getPerformanceClass(metrics.currentDrawdown)">
            {{ formatCurrency(metrics.currentDrawdown) }}
          </span>
          <span class="percentage">
            ({{ formatPercentage(metrics.currentDrawdownPercentage) }}%)
          </span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <h4>Avg Drawdown Duration</h4>
          <span class="metric-icon">⏱️</span>
        </div>
        <div class="metric-value">
          <span class="duration">{{ Math.round(metrics.avgDrawdownDuration) }} days</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <h4>Avg Recovery Time</h4>
          <span class="metric-icon">⚡</span>
        </div>
        <div class="metric-value">
          <span class="duration">{{ Math.round(metrics.avgRecoveryTime) }} days</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <h4>Drawdown Frequency</h4>
          <span class="metric-icon">📈</span>
        </div>
        <div class="metric-value">
          <span class="frequency">{{ formatNumber(metrics.drawdownFrequency, 1) }}/year</span>
        </div>
      </div>

      <div class="metric-card">
        <div class="metric-header">
          <h4>Total Periods</h4>
          <span class="metric-icon">🔢</span>
        </div>
        <div class="metric-value">
          <span class="count">{{ metrics.totalDrawdownPeriods }}</span>
        </div>
      </div>
    </div>

    <!-- Equity Curve with Drawdown Visualization -->
    <div class="chart-section">
      <h4>Equity Curve & Drawdown Periods</h4>
      <div v-if="chartData.length === 0" class="no-data-message">
        {{ noDataMessage || 'No drawdown data available' }}
      </div>
      <div v-else class="chart-container">
        <svg :width="chartWidth" :height="chartHeight" class="drawdown-chart">
          <!-- Chart background -->
          <rect
            x="0"
            y="0"
            :width="chartWidth"
            :height="chartHeight"
            class="chart-background"
          />

          <!-- Grid lines -->
          <g class="grid-lines">
            <line
              v-for="i in 5"
              :key="`h-${i}`"
              :x1="margin.left"
              :x2="chartWidth - margin.right"
              :y1="margin.top + ((chartHeight - margin.top - margin.bottom) / 4) * (i - 1)"
              :y2="margin.top + ((chartHeight - margin.top - margin.bottom) / 4) * (i - 1)"
              class="grid-line"
            />
          </g>

          <!-- Equity curve -->
          <g class="equity-curve">
            <path :d="equityPath" class="equity-line" />
            <path :d="peakPath" class="peak-line" />
          </g>

          <!-- Drawdown areas -->
          <g class="drawdown-areas">
            <path
              v-for="(area, index) in drawdownAreas"
              :key="`drawdown-${index}`"
              :d="area"
              class="drawdown-area"
            />
          </g>

          <!-- Y-axis labels -->
          <g class="y-axis-labels">
            <text
              v-for="(label, index) in yAxisLabels"
              :key="`y-${index}`"
              :x="margin.left - 10"
              :y="label.y + 4"
              class="axis-label"
              text-anchor="end"
            >
              {{ formatCurrency(label.value) }}
            </text>
          </g>

          <!-- X-axis labels -->
          <g class="x-axis-labels">
            <text
              v-for="(label, index) in xAxisLabels"
              :key="`x-${index}`"
              :x="label.x"
              :y="chartHeight - margin.bottom + 20"
              class="axis-label"
              text-anchor="middle"
            >
              {{ formatDate(label.value) }}
            </text>
          </g>
        </svg>
      </div>
    </div>

    <!-- Drawdown Periods Table -->
    <div v-if="periods.length > 0" class="periods-section">
      <h4>Historical Drawdown Periods</h4>
      <div class="table-container">
        <table class="periods-table">
          <thead>
            <tr>
              <th>Period</th>
              <th>Drawdown</th>
              <th>Duration</th>
              <th>Recovery</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(period, index) in sortedPeriods" :key="index">
              <td>
                <div class="period-dates">
                  <span class="start-date">{{ formatDate(period.startDate) }}</span>
                  <span class="separator">→</span>
                  <span class="end-date">{{ formatDate(period.endDate) }}</span>
                </div>
              </td>
              <td>
                <div class="drawdown-info">
                  <span class="amount" :class="getPerformanceClass(period.drawdownAmount)">
                    {{ formatCurrency(period.drawdownAmount) }}
                  </span>
                  <span class="percentage">
                    ({{ formatPercentage(period.drawdownPercentage) }}%)
                  </span>
                </div>
              </td>
              <td>
                <span class="duration">{{ period.duration }} days</span>
              </td>
              <td>
                <span v-if="period.isRecovered" class="recovery-time">
                  {{ period.recoveryTime }} days
                </span>
                <span v-else class="ongoing">Ongoing</span>
              </td>
              <td>
                <span
                  class="status-badge"
                  :class="{ 'recovered': period.isRecovered, 'ongoing': !period.isRecovered }"
                >
                  {{ period.isRecovered ? 'Recovered' : 'Ongoing' }}
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, inject } from 'vue'

const props = defineProps({
  metrics: {
    type: Object,
    required: true
  },
  periods: {
    type: Array,
    default: () => []
  },
  chartData: {
    type: Array,
    default: () => []
  },
  noDataMessage: {
    type: String,
    default: 'No drawdown data available'
  }
})

// Chart dimensions
const chartWidth = 800
const chartHeight = 400
const margin = { top: 20, right: 40, bottom: 60, left: 80 }

// Use inject to get formatting functions from parent
const formatCurrency = inject('formatCurrency', (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
})

const formatNumber = inject('formatNumber', (number, decimals = 0) => {
  return Number(number).toFixed(decimals)
})

const formatPercentage = inject('formatPercentage', (percentage) => {
  return Number(percentage).toFixed(1)
})

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: '2-digit',
    month: 'short'
  })
}

// Helper functions
const getPerformanceClass = (value) => {
  if (value > 0) return 'negative'
  if (value < 0) return 'positive'
  return 'neutral'
}

// Chart calculations
const chartInnerWidth = chartWidth - margin.left - margin.right
const chartInnerHeight = chartHeight - margin.top - margin.bottom

const equityExtent = computed(() => {
  if (!props.chartData.length) return [0, 0]
  const values = props.chartData.flatMap(d => [d.equity, d.peak])
  return [Math.min(...values), Math.max(...values)]
})

const dateExtent = computed(() => {
  if (!props.chartData.length) return [new Date(), new Date()]
  const dates = props.chartData.map(d => new Date(d.date))
  return [Math.min(...dates), Math.max(...dates)]
})

const xScale = computed(() => {
  const [minDate, maxDate] = dateExtent.value
  return (date) => {
    const timestamp = new Date(date).getTime()
    return margin.left + (timestamp - minDate) / (maxDate - minDate) * chartInnerWidth
  }
})

const yScale = computed(() => {
  const [minValue, maxValue] = equityExtent.value
  const range = maxValue - minValue || 1
  return (value) => {
    return margin.top + (maxValue - value) / range * chartInnerHeight
  }
})

// Chart paths
const equityPath = computed(() => {
  if (!props.chartData.length) return ''

  const pathData = props.chartData.map((d, index) => {
    const x = xScale.value(d.date)
    const y = yScale.value(d.equity)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })

  return pathData.join(' ')
})

const peakPath = computed(() => {
  if (!props.chartData.length) return ''

  const pathData = props.chartData.map((d, index) => {
    const x = xScale.value(d.date)
    const y = yScale.value(d.peak)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  })

  return pathData.join(' ')
})

const drawdownAreas = computed(() => {
  if (!props.chartData.length) return []

  const areas = []
  let currentArea = []

  props.chartData.forEach((d) => {
    const x = xScale.value(d.date)
    const equityY = yScale.value(d.equity)
    const peakY = yScale.value(d.peak)

    if (d.equity < d.peak) {
      // In drawdown
      if (currentArea.length === 0) {
        // Start new area
        currentArea = [`M ${x} ${peakY}`, `L ${x} ${equityY}`]
      } else {
        // Continue area
        currentArea.push(`L ${x} ${equityY}`)
      }
    } else {
      // Not in drawdown
      if (currentArea.length > 0) {
        // Close current area
        const lastX = x
        const lastPeakY = peakY
        currentArea.push(`L ${lastX} ${lastPeakY}`)
        currentArea.push('Z')
        areas.push(currentArea.join(' '))
        currentArea = []
      }
    }
  })

  // Close final area if still in drawdown
  if (currentArea.length > 0) {
    const lastPoint = props.chartData[props.chartData.length - 1]
    const lastX = xScale.value(lastPoint.date)
    const lastPeakY = yScale.value(lastPoint.peak)
    currentArea.push(`L ${lastX} ${lastPeakY}`)
    currentArea.push('Z')
    areas.push(currentArea.join(' '))
  }

  return areas
})

// Axis labels
const yAxisLabels = computed(() => {
  const [minValue, maxValue] = equityExtent.value
  const labels = []
  for (let i = 0; i < 5; i++) {
    const value = minValue + (maxValue - minValue) * (i / 4)
    const y = margin.top + (chartInnerHeight / 4) * i
    labels.push({ value, y })
  }
  return labels.reverse()
})

const xAxisLabels = computed(() => {
  if (!props.chartData.length) return []

  const step = Math.max(1, Math.floor(props.chartData.length / 5))
  const labels = []

  for (let i = 0; i < props.chartData.length; i += step) {
    const d = props.chartData[i]
    const x = xScale.value(d.date)
    labels.push({ value: d.date, x })
  }

  return labels
})

// Sorted periods for table
const sortedPeriods = computed(() => {
  return [...props.periods].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )
})
</script>

<style scoped>
.drawdown-analysis {
  width: 100%;
}

.drawdown-analysis > * + * {
  margin-top: 2rem;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.metric-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.metric-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.metric-card.critical {
  border-left: 4px solid #ef4444;
}

.metric-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.metric-header h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #6b7280;
  margin: 0;
}

.metric-icon {
  font-size: 1.25rem;
}

.metric-value {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.amount {
  font-size: 1.5rem;
  font-weight: 700;
}

.percentage, .duration, .frequency, .count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.chart-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  margin-bottom: 2rem;
}

.chart-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.chart-container {
  overflow-x: auto;
}

.drawdown-chart {
  width: 100%;
  height: auto;
}

.chart-background {
  fill: #fafafa;
}

.grid-line {
  stroke: #e5e7eb;
  stroke-width: 1;
}

.equity-line {
  fill: none;
  stroke: #3b82f6;
  stroke-width: 2;
}

.peak-line {
  fill: none;
  stroke: #10b981;
  stroke-width: 1;
  stroke-dasharray: 5,5;
}

.drawdown-area {
  fill: rgba(239, 68, 68, 0.2);
  stroke: #ef4444;
  stroke-width: 1;
}

.axis-label {
  fill: #6b7280;
  font-size: 12px;
  font-family: system-ui, sans-serif;
}

.periods-section {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
}

.periods-section h4 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.table-container {
  overflow-x: auto;
}

.periods-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

.periods-table th {
  background: #f9fafb;
  color: #6b7280;
  font-weight: 600;
  padding: 0.75rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.periods-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.period-dates {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.separator {
  color: #9ca3af;
}

.drawdown-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.status-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 0.375rem;
  font-size: 0.75rem;
  font-weight: 500;
}

.status-badge.recovered {
  background: #d1fae5;
  color: #065f46;
}

.status-badge.ongoing {
  background: #fef3c7;
  color: #92400e;
}

.positive {
  color: #059669;
}

.negative {
  color: #dc2626;
}

.neutral {
  color: #6b7280;
}

.no-data-message {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 3rem;
  background: #f9fafb;
  border-radius: 0.5rem;
  border: 2px dashed #d1d5db;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .chart-container {
    overflow-x: scroll;
  }

  .periods-table {
    min-width: 600px;
  }
}
</style>
