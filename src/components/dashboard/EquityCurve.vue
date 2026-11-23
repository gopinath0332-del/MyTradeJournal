<template>
  <div class="equity-curve">
    <div class="equity-curve-header">
      <div class="header-left">
        <h3>{{ title }}</h3>
        <div class="equity-summary">
          <span class="summary-pill starting">
            <span class="pill-label">Base</span>
            <span class="pill-value">{{ formatCurrency(0) }}</span>
          </span>
          <span
            class="summary-pill"
            :class="{ 'profit': currentPnL > 0, 'loss': currentPnL < 0, 'neutral': currentPnL === 0 }"
          >
            <span class="pill-label">{{ currentPnLLabel }}</span>
            <span class="pill-value">
              {{ currentPnL >= 0 ? '+' : '' }}{{ formatCurrency(currentPnL) }}
            </span>
          </span>
        </div>
      </div>

      <div class="equity-controls">
        <div class="scope-selector" aria-label="Equity curve scope">
          <button
            type="button"
            :class="['scope-button', { active: selectedEquityScope === 'profile' }]"
            @click="onScopeChange('profile')"
          >
            Profile
          </button>
          <button
            type="button"
            :class="['scope-button', { active: selectedEquityScope === 'month' }]"
            @click="onScopeChange('month')"
          >
            Month
          </button>
        </div>
        <div v-if="selectedEquityScope === 'month'" class="month-selector">
          <label for="equityMonth">Month:</label>
          <select id="equityMonth" :value="selectedEquityMonth" @change="onMonthChange">
            <option v-for="month in availableMonths" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="equityData.length > 0" class="chart-container" @mouseleave="hideTooltip">
      <div class="chart-wrapper">
        <svg
          :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          preserveAspectRatio="none"
          class="equity-chart"
          @mousemove="onChartMouseMove"
        >
          <!-- Definitions for dual-color clipping -->
          <defs>
            <!-- Clip path for positive region (above zero line, smaller Y in SVG) -->
            <clipPath id="equity-clip-positive">
              <rect
                :x="margin.left"
                :y="margin.top"
                :width="chartWidth - margin.left - margin.right"
                :height="Math.max(0, zeroLineY - margin.top)"
              />
            </clipPath>

            <!-- Clip path for negative region (below zero line, larger Y in SVG) -->
            <clipPath id="equity-clip-negative">
              <rect
                :x="margin.left"
                :y="zeroLineY"
                :width="chartWidth - margin.left - margin.right"
                :height="Math.max(0, chartHeight - margin.bottom - zeroLineY)"
              />
            </clipPath>
          </defs>

          <!-- Horizontal Grid Lines -->
          <g class="grid">
            <line
              v-for="(line, index) in horizontalGridLines"
              :key="`h-${index}`"
              :x1="margin.left"
              :y1="line.y"
              :x2="chartWidth - margin.right"
              :y2="line.y"
              :class="['grid-line', { 'is-zero': line.value === 0 }]"
            />
          </g>

          <!-- Zero Line (prominent separator) -->
          <line
            :x1="margin.left"
            :y1="zeroLineY"
            :x2="chartWidth - margin.right"
            :y2="zeroLineY"
            class="zero-baseline"
          />

          <!-- Area Fills (Split at Zero Line) -->
          <!-- Positive Area Fill (Green above zero) -->
          <path
            :d="areaPath"
            class="area-positive"
            clip-path="url(#equity-clip-positive)"
          />

          <!-- Negative Area Fill (Red below zero) -->
          <path
            :d="areaPath"
            class="area-negative"
            clip-path="url(#equity-clip-negative)"
          />

          <!-- Equity Line Paths (Split at Zero Line for Green & Red) -->
          <!-- Positive Line Segment (Green) -->
          <path
            :d="pnlPath"
            class="line-positive"
            fill="none"
            clip-path="url(#equity-clip-positive)"
          />

          <!-- Negative Line Segment (Red) -->
          <path
            :d="pnlPath"
            class="line-negative"
            fill="none"
            clip-path="url(#equity-clip-negative)"
          />

          <!-- Data Points (Beaded Dots with White Border) -->
          <g class="data-points">
            <circle
              v-for="(point, index) in equityData"
              :key="index"
              :cx="getX(index)"
              :cy="getY(point.cumulativePnL)"
              :r="hoveredIndex === index ? 5.5 : 3.5"
              :class="['data-point', point.cumulativePnL >= 0 ? 'profit' : 'loss', { 'is-hovered': hoveredIndex === index }]"
            />
          </g>

          <!-- Vertical Crosshair Line -->
          <line
            v-if="hoveredIndex !== null && hoveredPoint"
            :x1="getX(hoveredIndex)"
            :y1="margin.top"
            :x2="getX(hoveredIndex)"
            :y2="chartHeight - margin.bottom"
            class="crosshair-line"
          />

          <!-- Hovered Point Halo -->
          <circle
            v-if="hoveredIndex !== null && hoveredPoint"
            :cx="getX(hoveredIndex)"
            :cy="getY(hoveredPoint.cumulativePnL)"
            :r="6.5"
            :class="['hover-halo', hoveredPoint.cumulativePnL >= 0 ? 'profit' : 'loss']"
          />

          <!-- Y-axis Labels (Left) -->
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

          <!-- X-axis Labels (Bottom) -->
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

          <!-- Transparent Overlay for smooth scrubbing -->
          <rect
            :x="margin.left"
            :y="margin.top"
            :width="chartWidth - margin.left - margin.right"
            :height="chartHeight - margin.top - margin.bottom"
            fill="transparent"
            class="interaction-overlay"
          />
        </svg>

        <!-- Floating Tooltip Card -->
        <div
          v-if="tooltip.visible"
          class="tooltip"
          :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        >
          <div class="tooltip-header">{{ tooltip.date }}</div>
          <div class="tooltip-row">
            <span class="tooltip-label">Cumulative P&L:</span>
            <span class="tooltip-val" :class="tooltip.pnl >= 0 ? 'profit' : 'loss'">
              {{ tooltip.pnl >= 0 ? '+' : '' }}{{ formatCurrency(tooltip.pnl) }}
            </span>
          </div>
          <div class="tooltip-row">
            <span class="tooltip-label">Daily P&L:</span>
            <span class="tooltip-val" :class="tooltip.dailyPnL >= 0 ? 'profit' : 'loss'">
              {{ tooltip.dailyPnL >= 0 ? '+' : '' }}{{ formatCurrency(tooltip.dailyPnL) }}
            </span>
          </div>
        </div>
      </div>
    </div>

    <LoadingSpinner
      v-else-if="isLoading"
      message="Loading equity curve..."
      size="large"
      full-height
    />

    <EmptyState
      v-else
      icon="📈"
      title="No equity data"
      :message="emptyMessage"
      :full-height="true"
    />
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
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
  equityData: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  selectedEquityScope: {
    type: String,
    default: 'profile',
    validator: value => ['profile', 'month'].includes(value)
  },
  selectedEquityMonth: {
    type: Number,
    required: true
  },
  availableMonths: {
    type: Array,
    default: () => []
  },
  selectedYear: {
    type: Number,
    required: true
  },
  title: {
    type: String,
    default: 'Active Profile P&L Curve'
  },
  emptyMessage: {
    type: String,
    default: 'No closed P&L data available'
  }
})

const emit = defineEmits(['month-change', 'scope-change'])

// Chart dimensions
const chartWidth = 950
const chartHeight = 440
const margin = { top: 25, right: 30, bottom: 50, left: 75 }

// Hover state
const hoveredIndex = ref(null)
const hoveredPoint = computed(() => {
  if (hoveredIndex.value === null) return null
  return props.equityData[hoveredIndex.value] || null
})

// Tooltip state
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  pnl: 0,
  dailyPnL: 0
})

// Month names
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

const selectedMonthName = computed(() => {
  return monthNames[props.selectedEquityMonth] || 'Current Month'
})

const currentPnLLabel = computed(() => {
  return props.selectedEquityScope === 'profile'
    ? `${props.selectedYear} Total`
    : `${selectedMonthName.value}`
})

const currentPnL = computed(() => {
  if (props.equityData.length === 0) return 0
  return props.equityData[props.equityData.length - 1].cumulativePnL
})

// Raw range calculation
const minPnL = computed(() => {
  if (props.equityData.length === 0) return 0
  return Math.min(0, ...props.equityData.map(d => d.cumulativePnL))
})

const maxPnL = computed(() => {
  if (props.equityData.length === 0) return 0
  return Math.max(0, ...props.equityData.map(d => d.cumulativePnL))
})

// Nice Y-scale generator so tick numbers are neat round multiples (e.g. 100, 200, 500)
// and guaranteed to include 0 as a clean line
const yScale = computed(() => {
  const minVal = minPnL.value
  const maxVal = maxPnL.value
  const effectiveMin = Math.min(0, minVal)
  const effectiveMax = Math.max(0, maxVal)
  const rawRange = effectiveMax - effectiveMin || 100

  // Target 5 to 7 steps
  const targetSteps = 6
  const rawStep = rawRange / targetSteps
  const power = Math.pow(10, Math.floor(Math.log10(rawStep || 1)))
  const fraction = rawStep / power

  let step
  if (fraction <= 1.5) step = 1 * power
  else if (fraction <= 3.5) step = 2 * power
  else if (fraction <= 7.5) step = 5 * power
  else step = 10 * power

  // Add a slight headroom so highest/lowest points don't clip the chart ceiling
  const niceMin = Math.floor(effectiveMin / step) * step
  const niceMax = Math.ceil(effectiveMax / step) * step

  const ticks = []
  for (let val = niceMin; val <= niceMax + step * 0.1; val += step) {
    const rounded = Math.round(val * 1000) / 1000
    ticks.push(rounded)
  }

  return { niceMin, niceMax, step, ticks }
})

// Chart coordinates
const getX = (index) => {
  const dataWidth = chartWidth - margin.left - margin.right
  if (props.equityData.length <= 1) {
    return margin.left + dataWidth / 2
  }
  return margin.left + (index / (props.equityData.length - 1)) * dataWidth
}

const getY = (pnl) => {
  const { niceMin, niceMax } = yScale.value
  const dataHeight = chartHeight - margin.top - margin.bottom
  const range = niceMax - niceMin || 1
  return chartHeight - margin.bottom - ((pnl - niceMin) / range) * dataHeight
}

// Zero line Y position (in SVG coordinates)
const zeroLineY = computed(() => {
  return getY(0)
})

// Closed area path connecting curve down/up to the zero line
const areaPath = computed(() => {
  const data = props.equityData
  if (!data || data.length === 0) return ''

  const firstX = getX(0)
  const lastX = getX(data.length - 1)
  const zeroY = zeroLineY.value

  let path = `M ${firstX} ${zeroY}`
  for (let i = 0; i < data.length; i++) {
    path += ` L ${getX(i)} ${getY(data[i].cumulativePnL)}`
  }
  path += ` L ${lastX} ${zeroY} Z`
  return path
})

// P&L line stroke path
const pnlPath = computed(() => {
  const data = props.equityData
  if (!data || data.length === 0) return ''

  let path = `M ${getX(0)} ${getY(data[0].cumulativePnL)}`
  for (let i = 1; i < data.length; i++) {
    path += ` L ${getX(i)} ${getY(data[i].cumulativePnL)}`
  }
  return path
})

// Horizontal grid lines corresponding to each nice tick
const horizontalGridLines = computed(() => {
  return yScale.value.ticks.map(val => ({
    y: getY(val),
    value: val
  }))
})

// Y-axis labels
const yAxisLabels = computed(() => {
  return horizontalGridLines.value
})

// Formats dates for X-axis labels: e.g. "May 13", "Jun 5"
const formatXDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = String(dateStr).split('T')[0].split('-')
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// X-axis labels distributed cleanly across the width
const xAxisLabels = computed(() => {
  const data = props.equityData
  if (!data || data.length === 0) return []
  if (data.length === 1) {
    return [{ x: getX(0), text: formatXDate(data[0].date) }]
  }

  const maxLabels = 9
  const step = Math.max(1, Math.floor((data.length - 1) / (maxLabels - 1)))
  const labels = []

  for (let i = 0; i < data.length; i += step) {
    labels.push({
      x: getX(i),
      text: formatXDate(data[i].date)
    })
  }

  // Ensure last label is included if spacing allows
  const lastIdx = data.length - 1
  if (labels[labels.length - 1].x < getX(lastIdx) - 45) {
    labels.push({
      x: getX(lastIdx),
      text: formatXDate(data[lastIdx].date)
    })
  }

  return labels
})

// Currency formatting
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode.value,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Axis label formatting: $100, $0, $-100
const formatAxisCurrency = (val) => {
  if (val === 0) return `${currencySymbol.value}0`
  const abs = Math.abs(val)
  let formatted
  if (abs >= 10000000) {
    formatted = (abs / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr'
  } else if (abs >= 100000) {
    formatted = (abs / 100000).toFixed(1).replace(/\.0$/, '') + 'L'
  } else if (abs >= 1000) {
    formatted = (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  } else {
    formatted = abs.toLocaleString('en-US')
  }

  return val < 0 ? `${currencySymbol.value}-${formatted}` : `${currencySymbol.value}${formatted}`
}

const formatTooltipDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = String(dateStr).split('T')[0].split('-')
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

// Interactive scrubbing over chart
const onChartMouseMove = (event) => {
  const data = props.equityData
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
  const pointSvgX = getX(index)
  const pointSvgY = getY(point.cumulativePnL)
  const pointScreenX = rect.left + (pointSvgX / chartWidth) * rect.width
  const pointScreenY = rect.top + (pointSvgY / chartHeight) * rect.height

  tooltip.value = {
    visible: true,
    x: pointScreenX - container.left,
    y: pointScreenY - container.top - 12,
    date: formatTooltipDate(point.date),
    pnl: point.cumulativePnL,
    dailyPnL: point.dailyPnL
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
  hoveredIndex.value = null
}

const onMonthChange = (event) => {
  const newMonth = parseInt(event.target.value, 10)
  emit('month-change', newMonth)
}

const onScopeChange = (scope) => {
  emit('scope-change', scope)
}
</script>

<style scoped>
.equity-curve {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03);
  border: 1px solid #f1f5f9;
  margin-bottom: 2rem;
}

.equity-curve-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .equity-curve-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
}

.equity-curve-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 700;
  color: #1e293b;
  letter-spacing: -0.01em;
}

.equity-summary {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.summary-pill {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.25rem 0.65rem;
  border-radius: 20px;
  font-size: 0.8rem;
  font-weight: 600;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  color: #475569;
}

.summary-pill.starting {
  background: #f8fafc;
  color: #64748b;
}

.summary-pill.profit {
  background: #ecfdf5;
  border-color: #a7f3d0;
  color: #059669;
}

.summary-pill.loss {
  background: #fef2f2;
  border-color: #fecaca;
  color: #dc2626;
}

.summary-pill .pill-label {
  font-size: 0.725rem;
  font-weight: 500;
  opacity: 0.8;
  text-transform: uppercase;
}

.equity-controls {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.scope-selector {
  display: inline-flex;
  padding: 3px;
  background: #f1f5f9;
  border-radius: 8px;
}

.scope-button {
  padding: 0.35rem 0.85rem;
  border: 0;
  background: transparent;
  color: #64748b;
  font-size: 0.825rem;
  font-weight: 600;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.scope-button.active {
  background: #ffffff;
  color: #0f172a;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.month-selector label {
  font-size: 0.825rem;
  font-weight: 500;
  color: #64748b;
}

.month-selector select {
  padding: 0.35rem 0.65rem;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #ffffff;
  font-size: 0.825rem;
  color: #1e293b;
  cursor: pointer;
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

.equity-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
  cursor: crosshair;
}

/* Grid & Zero Baseline */
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

/* Area Fills matching the reference image */
.area-positive {
  fill: #c6f6d5;
  opacity: 0.7;
}

.area-negative {
  fill: #fecaca;
  opacity: 0.75;
}

/* Line Strokes */
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

/* Data Points (Beaded Dots with Crisp White Borders) */
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

/* Crosshair & Hover */
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
  animation: pulse-halo 1.5s infinite;
}

.hover-halo.profit {
  stroke: #16a34a;
}

.hover-halo.loss {
  stroke: #dc2626;
}

@keyframes pulse-halo {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.15); opacity: 0.85; }
  100% { transform: scale(1); opacity: 1; }
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

/* Tooltip Card (Glassmorphic Dark Theme) */
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

@media (max-width: 768px) {
  .equity-curve {
    padding: 1rem;
  }

  .chart-container {
    height: 320px;
  }

  .equity-controls {
    width: 100%;
    flex-wrap: wrap;
  }
}
</style>
