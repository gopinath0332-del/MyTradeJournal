<template>
  <div class="distribution-heatmap">
    <div class="heatmap-header">
      <h3 class="heatmap-title">Trade Distribution Heatmap</h3>
      <p class="heatmap-subtitle">Profitability by Day of Week and Time of Day</p>
    </div>

    <LoadingSpinner
      v-if="isLoading"
      message="Calculating distribution..."
      size="large"
      full-height
    />

    <EmptyState
      v-else-if="trades.length === 0"
      icon="📊"
      title="No trade data"
      message="Log some trades to analyze your timing patterns"
      :full-height="true"
    />

    <div v-else class="heatmap-wrapper">
      <div class="heatmap-grid">
        <!-- Time Labels (X-Axis) -->
        <div class="grid-cell time-label"></div>
        <div
          v-for="hour in hours"
          :key="hour"
          class="grid-cell time-label"
        >
          {{ hour }}:00
        </div>

        <!-- Day Rows (Y-Axis) -->
        <div v-for="day in days" :key="day.id" class="day-row">
          <div class="grid-cell day-label">{{ day.name }}</div>
          <div
            v-for="hour in hours"
            :key="hour"
            class="grid-cell data-cell"
            :class="getCellClass(day.id, hour)"
            @mouseenter="showTooltip($event, day.id, hour)"
            @mouseleave="hideTooltip"
          >
            <span v-if="getTradeCount(day.id, hour) > 0" class="trade-count">
              {{ getTradeCount(day.id, hour) }}
            </span>
          </div>
        </div>
      </div>

      <div class="heatmap-legend">
        <div class="legend-item">
          <div class="legend-box loss"></div>
          <span>Net Loss</span>
        </div>
        <div class="legend-item">
          <div class="legend-box neutral"></div>
          <span>No Trades / Breakeven</span>
        </div>
        <div class="legend-item">
          <div class="legend-box profit"></div>
          <span>Net Profit</span>
        </div>
      </div>
    </div>

    <!-- Custom Tooltip -->
    <div
      v-if="tooltip.visible"
      class="custom-tooltip"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div class="tooltip-content">
        <div class="tooltip-day">{{ tooltip.dayName }}</div>
        <div class="tooltip-time">{{ tooltip.time }}:00</div>
        <div
          class="tooltip-pnl"
          :class="tooltip.pnl >= 0 ? 'profit-text' : 'loss-text'"
        >
          {{ tooltip.pnl >= 0 ? '+' : '' }}{{ currencySymbol }}{{ formatCurrency(tooltip.pnl) }}
        </div>
        <div class="tooltip-trades">{{ tooltip.count }} trade{{ tooltip.count !== 1 ? 's' : '' }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useProfiles } from '@/composables/useProfiles'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import EmptyState from '../ui/EmptyState.vue'
import type { Trade } from '@/types'

const props = defineProps<{
  trades: Trade[]
  isLoading?: boolean
}>()

const { currencySymbol } = useProfiles()

const days = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
]

const hours = Array.from({ length: 24 }, (_, i) => i)

const distributionData = computed(() => {
  const grid: Record<string, { pnl: number; count: number }> = {}

  props.trades.forEach(trade => {
    if (!trade.entryDate) return

    const date = new Date(trade.entryDate)
    const day = date.getDay() // 0 (Sun) to 6 (Sat)
    const hour = date.getHours()

    // Only track weekdays for trading (Mon-Fri)
    if (day < 1 || day > 5) return

    const key = `${day}-${hour}`
    if (!grid[key]) {
      grid[key] = { pnl: 0, count: 0 }
    }

    grid[key].pnl += trade.pnlAmount || 0
    grid[key].count += 1
  })

  return grid
})

const getTradeCount = (dayId: number, hour: number) => {
  return distributionData.value[`${dayId}-${hour}`]?.count || 0
}

const getPnL = (dayId: number, hour: number) => {
  return distributionData.value[`${dayId}-${hour}`]?.pnl || 0
}

const getCellClass = (dayId: number, hour: number) => {
  const pnl = getPnL(dayId, hour)
  const count = getTradeCount(dayId, hour)

  if (count === 0) return 'no-trade'
  if (pnl > 0) return 'profit'
  if (pnl < 0) return 'loss'
  return 'neutral'
}

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  dayName: '',
  time: 0,
  pnl: 0,
  count: 0
})

const showTooltip = (event: MouseEvent, dayId: number, hour: number) => {
  const day = days.find(d => d.id === dayId)
  const pnl = getPnL(dayId, hour)
  const count = getTradeCount(dayId, hour)

  tooltip.value = {
    visible: true,
    x: event.clientX + 15,
    y: event.clientY - 15,
    dayName: day?.name || '',
    time: hour,
    pnl: pnl,
    count: count
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}

const formatCurrency = (amount: number) => {
  return Math.abs(amount).toLocaleString('en-IN')
}
</script>

<style scoped>
.distribution-heatmap {
  margin: 2rem 0;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.heatmap-header {
  margin-bottom: 1.5rem;
}

.heatmap-title {
  margin: 0;
  font-size: 1.25rem;
  color: #374151;
  font-weight: 600;
}

.heatmap-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.heatmap-wrapper {
  overflow-x: auto;
}

.heatmap-grid {
  display: grid;
  grid-template-columns: 120px repeat(24, minmax(40px, 1fr));
  gap: 4px;
  min-width: 1100px;
}

.grid-cell {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 8px;
  font-size: 0.75rem;
  border-radius: 4px;
}

.time-label {
  font-weight: 600;
  color: #6b7280;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
}

.day-label {
  font-weight: 600;
  color: #374151;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  text-align: right;
  padding-right: 1rem;
}

.data-cell {
  height: 40px;
  cursor: pointer;
  transition: all 0.2s ease;
  border: 1px solid transparent;
}

.data-cell:hover {
  border-color: #6b7280;
  transform: scale(1.05);
  z-index: 10;
}

.trade-count {
  font-size: 0.65rem;
  font-weight: 700;
  opacity: 0.6;
}

.no-trade {
  background-color: #f3f4f6;
  color: #9ca3af;
}

.profit {
  background-color: #dcfce7;
  color: #166534;
}

.loss {
  background-color: #fee2e2;
  color: #991b1b;
}

.neutral {
  background-color: #f9fafb;
  color: #4b5563;
}

.heatmap-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-box {
  width: 16px;
  height: 16px;
  border-radius: 4px;
  border: 1px solid #e5e7eb;
}

.legend-box.profit { background-color: #dcfce7; }
.legend-box.loss { background-color: #fee2e2; }
.legend-box.neutral { background-color: #f9fafb; }

.custom-tooltip {
  position: fixed;
  z-index: 9999;
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  border: 1px solid #e5e7eb;
  background: white;
  pointer-events: none;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.tooltip-day {
  font-weight: 700;
  color: #111827;
}

.tooltip-time {
  color: #6b7280;
}

.tooltip-pnl {
  font-weight: 800;
  font-size: 14px;
}

.profit-text { color: #16a34a; }
.loss-text { color: #dc2626; }

.tooltip-trades {
  font-size: 11px;
  color: #9ca3af;
  font-style: italic;
}
</style>
