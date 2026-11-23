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
      <div class="chart-header">
        <h4>Equity Curve & Drawdown Periods</h4>
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-color equity" />
            <span>Equity Curve</span>
          </div>
          <div class="legend-item">
            <span class="legend-line peak" />
            <span>High-Water Mark (Peak)</span>
          </div>
          <div class="legend-item">
            <span class="legend-area drawdown" />
            <span>Drawdown Region</span>
          </div>
        </div>
      </div>

      <div v-if="chartData.length === 0" class="no-data-message">
        {{ noDataMessage || 'No drawdown data available' }}
      </div>
      <div v-else class="chart-container" @mouseleave="hideTooltip">
        <div class="chart-wrapper">
          <svg
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
            preserveAspectRatio="none"
            class="drawdown-chart"
            @mousemove="onChartMouseMove"
          >
            <!-- Clip definitions for dual-zone equity fills -->
            <defs>
              <clipPath id="dd-clip-positive">
                <rect
                  :x="margin.left"
                  :y="margin.top"
                  :width="chartWidth - margin.left - margin.right"
                  :height="Math.max(0, zeroLineY - margin.top)"
                />
              </clipPath>
              <clipPath id="dd-clip-negative">
                <rect
                  :x="margin.left"
                  :y="zeroLineY"
                  :width="chartWidth - margin.left - margin.right"
                  :height="Math.max(0, chartHeight - margin.bottom - zeroLineY)"
                />
              </clipPath>
            </defs>

            <!-- Horizontal Grid Lines -->
            <g class="grid-lines">
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

            <!-- Zero Baseline -->
            <line
              :x1="margin.left"
              :y1="zeroLineY"
              :x2="chartWidth - margin.right"
              :y2="zeroLineY"
              class="zero-baseline"
            />

            <!-- Dual-zone Area Fills under Equity Curve -->
            <path
              :d="equityAreaPath"
              class="area-positive"
              clip-path="url(#dd-clip-positive)"
            />
            <path
              :d="equityAreaPath"
              class="area-negative"
              clip-path="url(#dd-clip-negative)"
            />

            <!-- Drawdown Shaded Areas (between Peak and Equity) -->
            <g class="drawdown-areas">
              <path
                v-for="(area, index) in drawdownAreas"
                :key="`drawdown-${index}`"
                :d="area"
                class="drawdown-area"
              />
            </g>

            <!-- Peak (High-Water Mark) Line -->
            <path :d="peakPath" class="peak-line" />

            <!-- Equity Lines (Split at Zero: Green above, Red below) -->
            <path
              :d="equityPath"
              class="line-positive"
              fill="none"
              clip-path="url(#dd-clip-positive)"
            />
            <path
              :d="equityPath"
              class="line-negative"
              fill="none"
              clip-path="url(#dd-clip-negative)"
            />

            <!-- Beaded Data Points with Crisp White Border -->
            <g class="data-points">
              <circle
                v-for="(d, index) in chartData"
                :key="index"
                :cx="getX(d.date)"
                :cy="getY(d.equity)"
                :r="hoveredIndex === index ? 5.5 : 3.5"
                :class="['data-point', d.equity >= 0 ? 'profit' : 'loss', { 'is-hovered': hoveredIndex === index }]"
              />
            </g>

            <!-- Vertical Crosshair Line -->
            <line
              v-if="hoveredIndex !== null && hoveredPoint"
              :x1="getX(hoveredPoint.date)"
              :y1="margin.top"
              :x2="getX(hoveredPoint.date)"
              :y2="chartHeight - margin.bottom"
              class="crosshair-line"
            />

            <!-- Hovered Point Halo -->
            <circle
              v-if="hoveredIndex !== null && hoveredPoint"
              :cx="getX(hoveredPoint.date)"
              :cy="getY(hoveredPoint.equity)"
              :r="6.5"
              :class="['hover-halo', hoveredPoint.equity >= 0 ? 'profit' : 'loss']"
            />

            <!-- Y-axis Labels -->
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

            <!-- X-axis Labels -->
            <g class="x-axis-labels">
              <text
                v-for="(label, index) in xAxisLabels"
                :key="`x-${index}`"
                :x="label.x"
                :y="chartHeight - margin.bottom + 22"
                class="axis-label x-label"
                text-anchor="middle"
              >
                {{ label.text }}
              </text>
            </g>

            <!-- Interaction Overlay -->
            <rect
              :x="margin.left"
              :y="margin.top"
              :width="chartWidth - margin.left - margin.right"
              :height="chartHeight - margin.top - margin.bottom"
              fill="transparent"
              class="interaction-overlay"
            />
          </svg>

          <!-- Floating Glassmorphic Tooltip Card -->
          <div
            v-if="tooltip.visible"
            class="tooltip"
            :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
          >
            <div class="tooltip-header">{{ tooltip.date }}</div>
            <div class="tooltip-row">
              <span class="tooltip-label">Equity:</span>
              <span class="tooltip-val" :class="tooltip.equity >= 0 ? 'profit' : 'loss'">
                {{ tooltip.equity >= 0 ? '+' : '' }}{{ formatCurrency(tooltip.equity) }}
              </span>
            </div>
            <div class="tooltip-row">
              <span class="tooltip-label">Peak:</span>
              <span class="tooltip-val">{{ formatCurrency(tooltip.peak) }}</span>
            </div>
            <div class="tooltip-row" v-if="tooltip.drawdown < 0">
              <span class="tooltip-label">Drawdown:</span>
              <span class="tooltip-val loss">
                {{ formatCurrency(tooltip.drawdown) }} ({{ tooltip.drawdownPercentage.toFixed(1) }}%)
              </span>
            </div>
          </div>
        </div>
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
              <th>Peak Date</th>
              <th>Trough Date</th>
              <th>Recovery Date</th>
              <th>Max Drawdown</th>
              <th>Duration</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="period in sortedPeriods" :key="period.id || period.startDate">
              <td>
                <div class="period-dates">
                  <span>{{ formatDate(period.startDate) }}</span>
                  <span class="separator">→</span>
                  <span>{{ period.endDate ? formatDate(period.endDate) : 'Present' }}</span>
                </div>
              </td>
              <td>{{ formatDate(period.startDate) }}</td>
              <td>{{ formatDate(period.troughDate || period.startDate) }}</td>
              <td>{{ period.recoveryDate ? formatDate(period.recoveryDate) : 'Not recovered' }}</td>
              <td>
                <div class="drawdown-info">
                  <span class="amount negative">{{ formatCurrency(-period.drawdownAmount) }}</span>
                  <span class="percentage">({{ formatPercentage(period.drawdownPercentage) }}%)</span>
                </div>
              </td>
              <td>{{ period.duration }} days</td>
              <td>
                <span :class="['status-badge', period.isRecovered ? 'recovered' : 'ongoing']">
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
import { ref, computed, inject } from 'vue'
import { useProfiles } from '@/composables/useProfiles'

const { currencySymbol } = useProfiles()

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
const chartWidth = 950
const chartHeight = 440
const margin = { top: 25, right: 30, bottom: 50, left: 75 }

// Hover & Tooltip state
const hoveredIndex = ref(null)
const hoveredPoint = computed(() => {
  if (hoveredIndex.value === null) return null
  return props.chartData[hoveredIndex.value] || null
})

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  equity: 0,
  peak: 0,
  drawdown: 0,
  drawdownPercentage: 0
})

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
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: '2-digit',
    month: 'short',
    day: 'numeric'
  })
}

const formatXDate = (dateString) => {
  if (!dateString) return ''
  const parts = String(dateString).split('T')[0].split('-')
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const getPerformanceClass = (value) => {
  if (value > 0) return 'negative'
  if (value < 0) return 'positive'
  return 'neutral'
}

// Chart calculations
const dateExtent = computed(() => {
  if (!props.chartData.length) return [0, 1]
  const dates = props.chartData.map(d => new Date(d.date).getTime())
  return [Math.min(...dates), Math.max(...dates)]
})

// Nice Y-scale generator with clean round multiples and 0 baseline
const yScaleConfig = computed(() => {
  if (!props.chartData.length) {
    return { niceMin: -100, niceMax: 100, ticks: [-100, 0, 100] }
  }

  const values = props.chartData.flatMap(d => [d.equity, d.peak])
  const minVal = Math.min(...values)
  const maxVal = Math.max(...values)

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

  const ticks = []
  for (let val = niceMin; val <= niceMax + step * 0.1; val += step) {
    ticks.push(Math.round(val * 1000) / 1000)
  }

  return { niceMin, niceMax, ticks }
})

const getX = (date) => {
  const [minDate, maxDate] = dateExtent.value
  const dataWidth = chartWidth - margin.left - margin.right
  if (minDate === maxDate || props.chartData.length <= 1) {
    return margin.left + dataWidth / 2
  }
  const timestamp = new Date(date).getTime()
  return margin.left + ((timestamp - minDate) / (maxDate - minDate)) * dataWidth
}

const getY = (val) => {
  const { niceMin, niceMax } = yScaleConfig.value
  const dataHeight = chartHeight - margin.top - margin.bottom
  const range = niceMax - niceMin || 1
  return chartHeight - margin.bottom - ((val - niceMin) / range) * dataHeight
}

const zeroLineY = computed(() => {
  return getY(0)
})

// Closed area path under equity curve down/up to zero line
const equityAreaPath = computed(() => {
  const data = props.chartData
  if (!data || data.length === 0) return ''

  const firstX = getX(data[0].date)
  const lastX = getX(data[data.length - 1].date)
  const zeroY = zeroLineY.value

  let path = `M ${firstX} ${zeroY}`
  for (let i = 0; i < data.length; i++) {
    path += ` L ${getX(data[i].date)} ${getY(data[i].equity)}`
  }
  path += ` L ${lastX} ${zeroY} Z`
  return path
})

// Equity curve path
const equityPath = computed(() => {
  if (!props.chartData.length) return ''
  return props.chartData.map((d, index) => {
    const x = getX(d.date)
    const y = getY(d.equity)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

// Peak (High-Water Mark) path
const peakPath = computed(() => {
  if (!props.chartData.length) return ''
  return props.chartData.map((d, index) => {
    const x = getX(d.date)
    const y = getY(d.peak)
    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

// Drawdown area polygons between peak and equity
const drawdownAreas = computed(() => {
  if (!props.chartData.length) return []

  const areas = []
  let currentArea = []

  props.chartData.forEach((d) => {
    const x = getX(d.date)
    const equityY = getY(d.equity)
    const peakY = getY(d.peak)

    if (d.equity < d.peak) {
      if (currentArea.length === 0) {
        currentArea = [`M ${x} ${peakY}`, `L ${x} ${equityY}`]
      } else {
        currentArea.push(`L ${x} ${equityY}`)
      }
    } else {
      if (currentArea.length > 0) {
        currentArea.push(`L ${x} ${peakY}`)
        currentArea.push('Z')
        areas.push(currentArea.join(' '))
        currentArea = []
      }
    }
  })

  if (currentArea.length > 0) {
    const lastPoint = props.chartData[props.chartData.length - 1]
    const lastX = getX(lastPoint.date)
    const lastPeakY = getY(lastPoint.peak)
    currentArea.push(`L ${lastX} ${lastPeakY}`)
    currentArea.push('Z')
    areas.push(currentArea.join(' '))
  }

  return areas
})

// Horizontal grid lines
const horizontalGridLines = computed(() => {
  return yScaleConfig.value.ticks.map(val => ({
    y: getY(val),
    value: val
  }))
})

const yAxisLabels = computed(() => {
  return horizontalGridLines.value
})

const formatAxisCurrency = (val) => {
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

const xAxisLabels = computed(() => {
  const data = props.chartData
  if (!data || !data.length) return []
  if (data.length === 1) {
    return [{ text: formatXDate(data[0].date), x: getX(data[0].date) }]
  }

  const maxLabels = 9
  const step = Math.max(1, Math.floor((data.length - 1) / (maxLabels - 1)))
  const labels = []

  for (let i = 0; i < data.length; i += step) {
    labels.push({
      text: formatXDate(data[i].date),
      x: getX(data[i].date)
    })
  }

  const lastIdx = data.length - 1
  if (labels[labels.length - 1].x < getX(data[lastIdx].date) - 45) {
    labels.push({
      text: formatXDate(data[lastIdx].date),
      x: getX(data[lastIdx].date)
    })
  }

  return labels
})

const sortedPeriods = computed(() => {
  return [...props.periods].sort((a, b) =>
    new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
  )
})

// Interactive scrubbing
const onChartMouseMove = (event) => {
  const data = props.chartData
  if (!data || data.length === 0) return

  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()
  const mouseSvgX = ((event.clientX - rect.left) / rect.width) * chartWidth

  const dataWidth = chartWidth - margin.left - margin.right
  const normalizedX = (mouseSvgX - margin.left) / dataWidth
  let index = Math.round(normalizedX * (data.length - 1))
  index = Math.max(0, Math.min(data.length - 1, index))

  hoveredIndex.value = index
  const point = data[index]

  const container = svg.closest('.chart-container').getBoundingClientRect()
  const pointSvgX = getX(point.date)
  const pointSvgY = getY(point.equity)
  const pointScreenX = rect.left + (pointSvgX / chartWidth) * rect.width
  const pointScreenY = rect.top + (pointSvgY / chartHeight) * rect.height

  tooltip.value = {
    visible: true,
    x: pointScreenX - container.left,
    y: pointScreenY - container.top - 12,
    date: formatDate(point.date),
    equity: point.equity,
    peak: point.peak,
    drawdown: point.drawdown,
    drawdownPercentage: Math.abs(point.drawdownPercentage || 0)
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
  hoveredIndex.value = null
}
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
  border: 1px solid #f1f5f9;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.metric-card:hover {
  box-shadow: 0 6px 18px rgba(0, 0, 0, 0.08);
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
  color: #64748b;
  margin: 0;
}

.metric-icon {
  font-size: 1.25rem;
}

.metric-value {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.metric-value .amount {
  font-size: 1.5rem;
  font-weight: 700;
}

.metric-value .percentage {
  font-size: 0.875rem;
  color: #64748b;
}

.chart-section {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.chart-header h4 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.legend-color.equity {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #16a34a;
  box-shadow: 0 0 0 1.5px #ffffff, 0 0 0 2.5px #16a34a;
}

.legend-line.peak {
  width: 18px;
  height: 2px;
  border-top: 2px dashed #059669;
}

.legend-area.drawdown {
  width: 14px;
  height: 10px;
  border-radius: 2px;
  background: rgba(239, 68, 68, 0.25);
  border: 1px solid #ef4444;
}

.chart-container {
  width: 100%;
  height: 440px;
  position: relative;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.drawdown-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
  cursor: crosshair;
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

/* Dual-zone Equity Area Fills */
.area-positive {
  fill: #c6f6d5;
  opacity: 0.7;
}

.area-negative {
  fill: #fecaca;
  opacity: 0.75;
}

/* Peak (High-Water Mark) Line */
.peak-line {
  fill: none;
  stroke: #059669;
  stroke-width: 1.8;
  stroke-dasharray: 4,4;
}

/* Drawdown Shaded Area */
.drawdown-area {
  fill: rgba(239, 68, 68, 0.22);
  stroke: #ef4444;
  stroke-width: 1;
  stroke-dasharray: 2,2;
}

/* Equity Line Strokes */
.line-positive {
  stroke: #16a34a;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.line-negative {
  stroke: #dc2626;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Beaded Data Points */
.data-point {
  stroke: #ffffff;
  stroke-width: 1.5;
  transition: r 0.15s ease, stroke-width 0.15s ease;
}

.data-point.profit {
  fill: #16a34a;
}

.data-point.loss {
  fill: #dc2626;
}

.data-point.is-hovered {
  r: 5.5;
  stroke-width: 2;
}

/* Crosshair & Halo */
.crosshair-line {
  stroke: #94a3b8;
  stroke-width: 1.5;
  stroke-dasharray: 4,4;
  pointer-events: none;
}

.hover-halo {
  fill: #ffffff;
  stroke-width: 3;
  pointer-events: none;
}

.hover-halo.profit {
  stroke: #16a34a;
}

.hover-halo.loss {
  stroke: #dc2626;
}

/* Axis Labels */
.axis-label {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 11.5px;
  fill: #94a3b8;
  font-weight: 500;
  user-select: none;
}

.interaction-overlay {
  pointer-events: all;
}

/* Glassmorphic Dark Tooltip */
.tooltip {
  position: absolute;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
  color: #ffffff;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  pointer-events: none;
  transform: translateX(-50%) translateY(-100%);
  z-index: 1000;
  white-space: nowrap;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: opacity 0.15s ease, transform 0.1s ease;
}

.tooltip-header {
  font-weight: 700;
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.1rem;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.tooltip-label {
  color: #cbd5e1;
  font-weight: 400;
}

.tooltip-val {
  font-weight: 700;
}

.tooltip-val.profit {
  color: #4ade80;
}

.tooltip-val.loss {
  color: #f87171;
}

/* Periods Table */
.periods-section {
  background: white;
  border: 1px solid #f1f5f9;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
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
  background: #f8fafc;
  color: #64748b;
  font-weight: 600;
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 1px solid #e2e8f0;
}

.periods-table td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #f1f5f9;
}

.period-dates {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.separator {
  color: #94a3b8;
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
  background: #dcfce7;
  color: #166534;
}

.status-badge.ongoing {
  background: #fef3c7;
  color: #92400e;
}

.positive {
  color: #16a34a;
}

.negative {
  color: #dc2626;
}

.neutral {
  color: #64748b;
}

.no-data-message {
  text-align: center;
  color: #64748b;
  font-style: italic;
  padding: 3rem;
  background: #f8fafc;
  border-radius: 0.5rem;
  border: 1px dashed #cbd5e1;
}

@media (max-width: 768px) {
  .chart-container {
    height: 320px;
  }
}
</style>
