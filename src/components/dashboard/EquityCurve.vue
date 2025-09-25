<template>
  <div class="equity-curve">
    <div class="equity-curve-header">
      <h3>{{ selectedMonthName }} P&L Curve</h3>
      <div class="month-selector">
        <label for="equityMonth">Month:</label>
        <select id="equityMonth" :value="selectedEquityMonth" @change="onMonthChange">
          <option v-for="month in availableMonths" :key="month.value" :value="month.value">
            {{ month.label }}
          </option>
        </select>
      </div>
      <div class="equity-summary">
        <span class="starting-equity">Starting P&L: {{ formatCurrency(0) }}</span>
        <span class="current-equity" :class="{ 'profit': currentPnL > 0, 'loss': currentPnL < 0 }">
          Current P&L: {{ formatCurrency(currentPnL) }}
        </span>
        <span class="monthly-change" :class="{ 'profit': currentPnL > 0, 'loss': currentPnL < 0 }">
          {{ currentPnL >= 0 ? '+' : '' }}{{ formatCurrency(currentPnL) }}
        </span>
      </div>
    </div>

    <div v-if="equityData.length > 0" class="chart-container">
      <div class="chart-wrapper">
        <svg :viewBox="`0 0 ${chartWidth} ${chartHeight}`" class="equity-chart">
          <!-- Grid lines -->
          <g class="grid">
            <!-- Horizontal grid lines -->
            <line
              v-for="(line, index) in horizontalGridLines"
              :key="`h-${index}`"
              :x1="margin.left"
              :y1="line.y"
              :x2="chartWidth - margin.right"
              :y2="line.y"
              class="grid-line"
            />
            <!-- Vertical grid lines -->
            <line
              v-for="(line, index) in verticalGridLines"
              :key="`v-${index}`"
              :x1="line.x"
              :y1="margin.top"
              :x2="line.x"
              :y2="chartHeight - margin.bottom"
              class="grid-line"
            />
          </g>

          <!-- Zero line -->
          <line
            v-if="zeroLineY"
            :x1="margin.left"
            :y1="zeroLineY"
            :x2="chartWidth - margin.right"
            :y2="zeroLineY"
            class="zero-line"
          />

          <!-- Equity curve path -->
          <path
            :d="pnlPath"
            class="equity-line"
            fill="none"
          />

          <!-- Data points -->
          <circle
            v-for="(point, index) in equityData"
            :key="index"
            :cx="getX(index)"
            :cy="getY(point.cumulativePnL)"
            :r="3"
            :class="['data-point', { 'profit': point.cumulativePnL > 0, 'loss': point.cumulativePnL < 0 }]"
            @mouseover="showTooltip($event, point, index)"
            @mouseout="hideTooltip"
          />

          <!-- Y-axis labels -->
          <g class="y-axis-labels">
            <text
              v-for="(label, index) in yAxisLabels"
              :key="`y-${index}`"
              :x="margin.left - 10"
              :y="label.y"
              class="axis-label"
              text-anchor="end"
              dominant-baseline="middle"
            >
              {{ formatAxisCurrency(label.value) }}
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
              {{ label.text }}
            </text>
          </g>
        </svg>

        <!-- Tooltip -->
        <div
          v-if="tooltip.visible"
          class="tooltip"
          :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
        >
          <div class="tooltip-date">{{ tooltip.date }}</div>
          <div class="tooltip-value">P&L: {{ formatCurrency(tooltip.pnl) }}</div>
          <div class="tooltip-change" :class="{ 'profit': tooltip.dailyPnL > 0, 'loss': tooltip.dailyPnL < 0 }">
            Daily P&L: {{ tooltip.dailyPnL >= 0 ? '+' : '' }}{{ formatCurrency(tooltip.dailyPnL) }}
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="isLoading" class="loading-state">
      <div class="spinner" />
      <span>Loading equity data...</span>
    </div>

    <div v-else class="no-data">
      <p>No trading data available for current month</p>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  equityData: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
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
  }
})

const emit = defineEmits(['month-change'])

// Chart dimensions
const chartWidth = 800
const chartHeight = 400
const margin = { top: 20, right: 20, bottom: 60, left: 80 }

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

// Computed values
const selectedMonthName = computed(() => {
  return monthNames[props.selectedEquityMonth] || 'Current Month'
})

const currentPnL = computed(() => {
  if (props.equityData.length === 0) return 0
  return props.equityData[props.equityData.length - 1].cumulativePnL
})

const minPnL = computed(() => {
  if (props.equityData.length === 0) return 0
  return Math.min(0, ...props.equityData.map(d => d.cumulativePnL))
})

const maxPnL = computed(() => {
  if (props.equityData.length === 0) return 0
  return Math.max(0, ...props.equityData.map(d => d.cumulativePnL))
})

const pnlRange = computed(() => {
  const range = maxPnL.value - minPnL.value
  return range === 0 ? 1000 : range
})

// Chart scales
const getX = (index) => {
  const dataWidth = chartWidth - margin.left - margin.right
  return margin.left + (index / Math.max(1, props.equityData.length - 1)) * dataWidth
}

const getY = (pnl) => {
  const dataHeight = chartHeight - margin.top - margin.bottom
  const padding = pnlRange.value * 0.1 // 10% padding
  const adjustedMin = minPnL.value - padding
  const adjustedMax = maxPnL.value + padding
  const adjustedRange = adjustedMax - adjustedMin

  return chartHeight - margin.bottom - ((pnl - adjustedMin) / adjustedRange) * dataHeight
}

// Zero line position
const zeroLineY = computed(() => {
  return getY(0)
})

// P&L curve path
const pnlPath = computed(() => {
  if (props.equityData.length === 0) return ''

  let path = `M ${getX(0)} ${getY(props.equityData[0].cumulativePnL)}`

  for (let i = 1; i < props.equityData.length; i++) {
    path += ` L ${getX(i)} ${getY(props.equityData[i].cumulativePnL)}`
  }

  return path
})

// Grid lines
const horizontalGridLines = computed(() => {
  const lines = []
  const padding = pnlRange.value * 0.1
  const adjustedMin = minPnL.value - padding
  const adjustedMax = maxPnL.value + padding
  const step = (adjustedMax - adjustedMin) / 5

  for (let i = 0; i <= 5; i++) {
    const value = adjustedMin + i * step
    lines.push({
      y: getY(value),
      value
    })
  }

  return lines
})

const verticalGridLines = computed(() => {
  if (props.equityData.length === 0) return []

  const lines = []
  const step = Math.max(1, Math.floor(props.equityData.length / 5))

  for (let i = 0; i < props.equityData.length; i += step) {
    lines.push({
      x: getX(i),
      index: i
    })
  }

  return lines
})

// Axis labels
const yAxisLabels = computed(() => {
  return horizontalGridLines.value.map(line => ({
    y: line.y,
    value: line.value
  }))
})

const xAxisLabels = computed(() => {
  if (props.equityData.length === 0) return []

  const labels = []
  const step = Math.max(1, Math.floor(props.equityData.length / 5))

  for (let i = 0; i < props.equityData.length; i += step) {
    const date = new Date(props.equityData[i].date)
    labels.push({
      x: getX(i),
      text: date.getDate().toString()
    })
  }

  return labels
})

// Formatting functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

const formatAxisCurrency = (amount) => {
  if (Math.abs(amount) >= 100000) {
    return `₹${(amount / 100000).toFixed(1)}L`
  } else if (Math.abs(amount) >= 1000) {
    return `₹${(amount / 1000).toFixed(1)}K`
  }
  return `₹${amount.toFixed(0)}`
}

// Tooltip functions
const showTooltip = (event, point, _index) => {
  const rect = event.target.getBoundingClientRect()
  const container = event.target.closest('.chart-container').getBoundingClientRect()

  tooltip.value = {
    visible: true,
    x: rect.left - container.left + rect.width / 2,
    y: rect.top - container.top - 10,
    date: new Date(point.date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short'
    }),
    pnl: point.cumulativePnL,
    dailyPnL: point.dailyPnL
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

// Month change handler
const onMonthChange = (event) => {
  const newMonth = parseInt(event.target.value)
  emit('month-change', newMonth)
}

// Handle window resize
const handleResize = () => {
  // Chart is responsive via viewBox, no action needed
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.equity-curve {
  background: white;
  border-radius: 8px;
  padding: 1.5rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
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
    flex-wrap: wrap;
  }
}

.equity-curve-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.month-selector label {
  font-size: 0.9rem;
  color: #666;
}

.month-selector select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: white;
  font-size: 0.9rem;
  cursor: pointer;
}

.month-selector select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.equity-summary {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.9rem;
}

.starting-equity {
  color: #666;
}

.current-equity.profit {
  color: #10b981;
  font-weight: 600;
}

.current-equity.loss {
  color: #ef4444;
  font-weight: 600;
}

.monthly-change.profit {
  color: #10b981;
  font-weight: 600;
}

.monthly-change.loss {
  color: #ef4444;
  font-weight: 600;
}

.chart-container {
  width: 100%;
  height: 400px;
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
}

.grid-line {
  stroke: #e5e7eb;
  stroke-width: 1;
}

.zero-line {
  stroke: #9ca3af;
  stroke-width: 2;
  stroke-dasharray: 5,5;
}

.equity-line {
  stroke: #3b82f6;
  stroke-width: 2;
  fill: none;
}

.data-point {
  cursor: pointer;
  transition: r 0.2s ease;
}

.data-point:hover {
  r: 5;
}

.data-point.profit {
  fill: #10b981;
}

.data-point.loss {
  fill: #ef4444;
}

.axis-label {
  font-size: 12px;
  fill: #6b7280;
}

.tooltip {
  position: absolute;
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.5rem;
  border-radius: 4px;
  font-size: 0.8rem;
  pointer-events: none;
  transform: translateX(-50%) translateY(-100%);
  z-index: 1000;
  white-space: nowrap;
}

.tooltip-date {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.tooltip-change.profit {
  color: #10b981;
}

.tooltip-change.loss {
  color: #ef4444;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 200px;
  gap: 1rem;
  color: #6b7280;
}

.spinner {
  width: 2rem;
  height: 2rem;
  border: 2px solid #e5e7eb;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.no-data {
  text-align: center;
  color: #6b7280;
  padding: 3rem;
}

@media (max-width: 768px) {
  .equity-curve {
    padding: 1rem;
  }

  .chart-container {
    height: 300px;
  }

  .equity-summary {
    font-size: 0.8rem;
  }
}
</style>
