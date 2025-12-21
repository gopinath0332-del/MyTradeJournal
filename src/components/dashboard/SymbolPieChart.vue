<template>
  <div class="symbol-pie-chart">
    <div class="chart-header">
      <div class="chart-title-section">
        <h3>P&L Breakdown by Symbol</h3>
        <div class="chart-info">
          <span class="total-symbols">{{ symbolData.length }} symbols</span>
        </div>
      </div>
      <div class="chart-controls">
        <div class="month-selector">
          <label for="monthSelect">Filter by Month:</label>
          <select id="monthSelect" v-model="selectedMonth" @change="onMonthChange">
            <option value="all">All Year</option>
            <option v-for="month in orderedAvailableMonths" :key="month.value" :value="month.value">
              {{ month.label }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <div class="loader">Loading chart...</div>
    </div>

    <div v-else-if="error" class="error-state">
      <div class="error-icon">⚠️</div>
      <div class="error-message">{{ error }}</div>
      <button v-if="onRetry" class="retry-button" @click="onRetry">
        Try Again
      </button>
    </div>

    <div v-else-if="symbolData.length === 0" class="empty-state">
      <div class="empty-icon">📊</div>
      <div class="empty-message">No trading data available</div>
    </div>

    <div v-else class="chart-container">
      <!-- Custom SVG Pie Chart -->
      <div class="pie-chart-wrapper">
        <svg class="pie-chart" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
          <!-- Fallback circle for single symbol (100%) -->
          <g v-if="symbolData.length === 1">
            <circle
              cx="100"
              cy="100"
              r="80"
              :fill="symbolData[0].color"
              stroke="#ffffff"
              stroke-width="2"
              :class="{ 'active': hoveredSegment === 0 }"
              @mouseenter="hoveredSegment = 0"
              @mouseleave="hoveredSegment = null"
            />
            <circle
              cx="100"
              cy="100"
              r="35"
              fill="white"
            />
          </g>

          <!-- Pie slices for multiple symbols -->
          <g v-for="(segment, index) in pieSegments" v-else :key="segment.symbol">
            <path
              :d="segment.path"
              :fill="segment.color"
              :class="{ 'active': hoveredSegment === index }"
              @mouseenter="hoveredSegment = index"
              @mouseleave="hoveredSegment = null"
            />
          </g>
        </svg>

        <!-- Center label -->
        <div class="center-label">
          <div class="center-title">Total P&L</div>
          <div
            class="center-amount"
            :class="{
              'profit': totalPnL > 0,
              'loss': totalPnL < 0,
              'neutral': totalPnL === 0
            }"
          >
            {{ totalPnL >= 0 ? '+' : '' }}{{ currencySymbol }}{{ formatCurrency(Math.abs(totalPnL)) }}
          </div>
        </div>
      </div>

      <!-- Legend -->
      <div class="chart-legend">
        <div
          v-for="(item, index) in symbolData"
          :key="item.symbol"
          class="legend-item"
          :class="{ 'active': hoveredSegment === index }"
          @mouseenter="hoveredSegment = index"
          @mouseleave="hoveredSegment = null"
        >
          <div class="legend-color" :style="{ backgroundColor: item.color }" />
          <div class="legend-content">
            <div class="legend-header">
              <div class="legend-symbol">{{ item.symbol }}</div>
              <div class="legend-trades">{{ item.tradeCount }} trades</div>
            </div>
            <div class="legend-details">
              <div class="legend-pnl-container">
                <span
                  class="legend-pnl"
                  :class="{
                    'profit': item.pnl > 0,
                    'loss': item.pnl < 0,
                    'neutral': item.pnl === 0
                  }"
                >
                  {{ item.pnl >= 0 ? '+' : '' }}{{ currencySymbol }}{{ formatCurrency(Math.abs(item.pnl)) }}
                </span>
                <span class="legend-percentage">({{ item.percentage.toFixed(1) }}%)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useProfiles } from '@/composables/useProfiles'

const { currencySymbol } = useProfiles()

const props = defineProps({
  trades: {
    type: Array,
    default: () => []
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  onRetry: {
    type: Function,
    default: null
  },
  selectedYear: {
    type: Number,
    default: new Date().getFullYear()
  }
})

const emit = defineEmits(['month-change'])

const hoveredSegment = ref(null)
// Initialize with current month (September = 8 for September 2025)
const selectedMonth = ref(new Date().getMonth()) // Current month: September (index 8)

// Month names
const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

// Available months based on trade data
const availableMonths = computed(() => {
  if (!props.trades.length) return []

  const monthsWithData = [...new Set(props.trades.map(trade => {
    const tradeDate = new Date(trade.entryDate)
    return tradeDate.getFullYear() === props.selectedYear ? tradeDate.getMonth() : null
  }))].filter(month => month !== null).sort((a, b) => a - b)

  return monthsWithData.map(month => ({
    value: month,
    label: monthNames[month]
  }))
})

// Reorder months to show current month first (if available)
const orderedAvailableMonths = computed(() => {
  const currentMonth = new Date().getMonth()
  const months = availableMonths.value

  // Find current month in available months
  const currentMonthData = months.find(month => month.value === currentMonth)

  if (currentMonthData) {
    // Put current month first, then rest in chronological order
    const otherMonths = months.filter(month => month.value !== currentMonth)
    return [
      { ...currentMonthData, label: `${currentMonthData.label} (Current)` },
      ...otherMonths
    ]
  }

  return months
})

// Auto-adjust selected month based on available data
watchEffect(() => {
  if (availableMonths.value.length === 0) {
    return // Keep current selection or default
  }

  const currentMonth = new Date().getMonth() // Current month (e.g., November 2025 = 10)
  const hasCurrentMonthData = availableMonths.value.some(month => month.value === currentMonth)

  // If current month has data, select it
  if (hasCurrentMonthData) {
    if (selectedMonth.value !== currentMonth) {
      selectedMonth.value = currentMonth
    }
  } else {
    // Current month has no data, find the most recent month with data (before current month)
    const monthsBeforeCurrent = availableMonths.value
      .filter(month => month.value < currentMonth)
      .sort((a, b) => b.value - a.value) // Sort descending (most recent first)

    if (monthsBeforeCurrent.length > 0) {
      // Select the most recent month before current month
      const mostRecentMonth = monthsBeforeCurrent[0].value
      if (selectedMonth.value !== mostRecentMonth) {
        selectedMonth.value = mostRecentMonth
      }
    } else {
      // No months before current month, select the latest available month
      const latestMonth = availableMonths.value
        .sort((a, b) => b.value - a.value)[0]
      if (latestMonth && selectedMonth.value !== latestMonth.value) {
        selectedMonth.value = latestMonth.value
      }
    }
  }
})

// Filter trades based on selected month
const filteredTrades = computed(() => {
  if (!props.trades.length) return []

  if (selectedMonth.value === 'all') {
    return props.trades.filter(trade => {
      const tradeDate = new Date(trade.entryDate)
      return tradeDate.getFullYear() === props.selectedYear
    })
  }

  return props.trades.filter(trade => {
    const tradeDate = new Date(trade.entryDate)
    return tradeDate.getFullYear() === props.selectedYear &&
           tradeDate.getMonth() === selectedMonth.value
  })
})

// Handle month change
const onMonthChange = () => {
  // Reset hovered segment when month changes
  hoveredSegment.value = null
  emit('month-change', selectedMonth.value)
}

// Predefined color palette for symbols
const colorPalette = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#84cc16', '#f97316', '#ec4899', '#6366f1',
  '#14b8a6', '#f43f5e', '#8b5cf6', '#a3a3a3', '#22c55e',
  '#0ea5e9', '#d946ef', '#fb923c', '#64748b', '#16a34a'
]

// Process trade data by symbol
const symbolData = computed(() => {
  if (!filteredTrades.value.length) return []

  // Group trades by symbol and calculate P&L
  const symbolMap = new Map()

  filteredTrades.value.forEach(trade => {
    const symbol = trade.symbol
    const pnl = trade.pnlAmount || 0

    if (symbolMap.has(symbol)) {
      const existing = symbolMap.get(symbol)
      existing.pnl += pnl
      existing.tradeCount += 1
    } else {
      symbolMap.set(symbol, {
        symbol,
        pnl,
        tradeCount: 1
      })
    }
  })

  // Convert to array and sort by absolute P&L (descending)
  const symbolArray = Array.from(symbolMap.values())
    .sort((a, b) => Math.abs(b.pnl) - Math.abs(a.pnl))

  // Calculate total P&L for percentage calculation
  const total = Math.abs(symbolArray.reduce((sum, item) => sum + Math.abs(item.pnl), 0))

  // Add color, percentage, and format data
  return symbolArray.map((item, index) => ({
    ...item,
    color: colorPalette[index % colorPalette.length],
    percentage: total > 0 ? (Math.abs(item.pnl) / total) * 100 : 0
  }))
})

// Calculate total P&L
const totalPnL = computed(() => {
  return symbolData.value.reduce((sum, item) => sum + item.pnl, 0)
})

// Generate pie chart segments
const pieSegments = computed(() => {
  if (!symbolData.value.length) return []

  const total = symbolData.value.reduce((sum, item) => sum + Math.abs(item.pnl), 0)
  if (total === 0) return []

  let currentAngle = 0
  const outerRadius = 80
  const innerRadius = 35
  const centerX = 100
  const centerY = 100

  return symbolData.value.map(item => {
    const percentage = Math.abs(item.pnl) / total
    let angle = percentage * 360

    // Handle special case for full circle (360 degrees or close to it)
    // SVG arcs can't handle exactly 360 degrees, so we reduce it slightly
    if (angle >= 359.9) {
      angle = 359.8
    }

    // Calculate path for donut slice
    const startAngle = currentAngle
    const endAngle = currentAngle + angle

    const startAngleRad = (startAngle * Math.PI) / 180
    const endAngleRad = (endAngle * Math.PI) / 180

    // Outer arc points
    const x1 = centerX + outerRadius * Math.cos(startAngleRad)
    const y1 = centerY + outerRadius * Math.sin(startAngleRad)
    const x2 = centerX + outerRadius * Math.cos(endAngleRad)
    const y2 = centerY + outerRadius * Math.sin(endAngleRad)

    // Inner arc points
    const x3 = centerX + innerRadius * Math.cos(endAngleRad)
    const y3 = centerY + innerRadius * Math.sin(endAngleRad)
    const x4 = centerX + innerRadius * Math.cos(startAngleRad)
    const y4 = centerY + innerRadius * Math.sin(startAngleRad)

    const largeArcFlag = angle > 180 ? 1 : 0

    const path = [
      `M ${x1} ${y1}`,
      `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      `L ${x3} ${y3}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${x4} ${y4}`,
      'Z'
    ].join(' ')

    currentAngle += angle

    return {
      symbol: item.symbol,
      path,
      color: item.color,
      percentage
    }
  })
})

// Format currency helper
const formatCurrency = (amount) => {
  return Math.abs(amount).toLocaleString('en-IN')
}
</script>

<style scoped>
.symbol-pie-chart {
  background: #ffffff;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  margin: 2rem 0;
}

.chart-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .chart-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.chart-title-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 768px) {
  .chart-title-section {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}

.chart-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #374151;
  font-weight: 600;
}

.chart-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.chart-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.month-selector label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  white-space: nowrap;
}

.month-selector select {
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 0.375rem 0.75rem;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: border-color 0.2s, box-shadow 0.2s;
  min-width: 120px;
}

.month-selector select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.month-selector select:hover {
  border-color: #9ca3af;
}

.total-symbols {
  background: #f3f4f6;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: 500;
}

.loading-state,
.error-state,
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  text-align: center;
}

.loader {
  color: #6b7280;
  font-size: 1rem;
}

.error-icon,
.empty-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.error-message,
.empty-message {
  color: #6b7280;
  margin-bottom: 1rem;
}

.retry-button {
  background: #3b82f6;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #2563eb;
}

.chart-container {
  display: grid;
  grid-template-columns: 1fr;
  gap: 2rem;
  align-items: start;
}

@media (min-width: 768px) {
  .chart-container {
    grid-template-columns: auto 1fr;
    gap: 3rem;
  }
}

.pie-chart-wrapper {
  position: relative;
  width: 200px;
  height: 200px;
  margin: 0 auto;
}

.pie-chart {
  width: 100%;
  height: 100%;
  transform: rotate(-90deg);
}

.pie-chart path {
  stroke: #ffffff;
  stroke-width: 2;
  cursor: pointer;
  transition: opacity 0.2s;
}

.pie-chart path:hover,
.pie-chart path.active {
  opacity: 0.8;
  stroke-width: 3;
}

.center-label {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  z-index: 10;
  background: rgba(255, 255, 255, 0.9);
  padding: 0.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  backdrop-filter: blur(4px);
}

.center-title {
  font-size: 0.75rem;
  color: #374151;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.center-amount {
  font-size: 1.1rem;
  font-weight: 700;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.center-amount.profit {
  color: #10b981;
}

.center-amount.loss {
  color: #ef4444;
}

.center-amount.neutral {
  color: #6b7280;
}

.chart-legend {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 300px;
  overflow-y: auto;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.legend-item:hover,
.legend-item.active {
  background: #f9fafb;
}

.legend-color {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  flex-shrink: 0;
}

.legend-content {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.legend-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.legend-symbol {
  font-weight: 600;
  color: #374151;
  font-size: 0.95rem;
}

.legend-trades {
  color: #9ca3af;
  font-size: 0.75rem;
  background: #f3f4f6;
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  white-space: nowrap;
}

.legend-details {
  display: flex;
  align-items: center;
  font-size: 0.875rem;
}

.legend-pnl-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.legend-pnl {
  font-weight: 600;
}

.legend-pnl.profit {
  color: #10b981;
}

.legend-pnl.loss {
  color: #ef4444;
}

.legend-pnl.neutral {
  color: #6b7280;
}

.legend-percentage {
  color: #6b7280;
  font-size: 0.8rem;
  font-weight: 500;
}

@media (max-width: 640px) {
  .chart-container {
    gap: 1.5rem;
  }

  .pie-chart-wrapper {
    width: 160px;
    height: 160px;
  }

  .center-label {
    padding: 0.375rem;
  }

  .center-title {
    font-size: 0.625rem;
  }

  .center-amount {
    font-size: 0.875rem;
  }
}
</style>
