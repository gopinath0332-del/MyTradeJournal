<template>
  <div class="heatmap-section">
    <div class="heatmap-header">
      <h3>Trading Activity Heatmap</h3>
      <span class="heatmap-year">{{ selectedYear }}</span>
    </div>
    
    <div class="heatmap-container">
      <div class="heatmap-months">
        <div v-for="monthData in heatmapData" :key="monthData.month" class="month-grid">
          <div class="month-label" :class="{ 'has-trades': hasTradesInMonth(monthData) }">
            {{ monthData.monthName.slice(0, 3) }}
          </div>
          <div class="month-calendar">
            <div class="week-row" v-for="(week, weekIndex) in monthData.weeks" :key="weekIndex">
              <div v-for="(day, dayIndex) in week" :key="dayIndex" class="day-cell"
                :class="{
                  'has-trades': day && day.tradeCount > 0,
                  'profit': day && day.pnl > 0,
                  'loss': day && day.pnl < 0,
                  'neutral': day && day.pnl === 0 && day.tradeCount > 0,
                  'no-trade': !day || day.tradeCount === 0,
                  [`intensity-${day?.intensity || 0}`]: day
                }"
                @mouseenter="showTooltip($event, day)"
                @mouseleave="hideTooltip"
              >
                <span v-if="day && day.tradeCount > 0" class="trade-indicator">{{ day.tradeCount }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="heatmap-legend">
        <span class="legend-label">Less</span>
        <div class="legend-levels">
          <div class="legend-cell no-trade"></div>
          <div class="legend-cell intensity-1"></div>
          <div class="legend-cell intensity-2"></div>
          <div class="legend-cell intensity-3"></div>
          <div class="legend-cell intensity-4"></div>
        </div>
        <span class="legend-label">More</span>
      </div>
    </div>
    
    <!-- Custom Tooltip -->
    <div 
      v-if="tooltip.visible" 
      class="custom-tooltip"
      :class="{
        'profit-tooltip': tooltip.data?.pnl > 0,
        'loss-tooltip': tooltip.data?.pnl < 0,
        'neutral-tooltip': tooltip.data?.pnl === 0 && tooltip.data?.tradeCount > 0,
        'no-trade-tooltip': !tooltip.data || tooltip.data?.tradeCount === 0
      }"
      :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
    >
      <div v-if="tooltip.data && tooltip.data.tradeCount > 0" class="tooltip-content">
        <div class="tooltip-date">{{ formatDate(tooltip.data.date) }}</div>
        <div class="tooltip-pnl" :class="{
          'profit-text': tooltip.data.pnl > 0,
          'loss-text': tooltip.data.pnl < 0,
          'neutral-text': tooltip.data.pnl === 0
        }">
          {{ tooltip.data.pnl >= 0 ? '+' : '' }}₹{{ formatCurrency(tooltip.data.pnl) }}
        </div>
        <div class="tooltip-trades">{{ tooltip.data.tradeCount }} trade{{ tooltip.data.tradeCount !== 1 ? 's' : '' }}</div>
      </div>
      <div v-else class="tooltip-content">
        <div class="tooltip-date">{{ tooltip.data ? formatDate(tooltip.data.date) : 'No date' }}</div>
        <div class="tooltip-no-trades">No trades</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

// Props
const props = defineProps({
  heatmapData: {
    type: Array,
    default: () => []
  },
  selectedYear: {
    type: Number,
    required: true
  }
})

// Tooltip state
const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  data: null
})

// Helper functions for heatmap
const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })
}

const formatCurrency = (amount) => {
  return Math.abs(amount).toLocaleString('en-IN')
}

// Check if a month has any trades
const hasTradesInMonth = (monthData) => {
  if (!monthData || !monthData.weeks || !Array.isArray(monthData.weeks)) {
    return false
  }
  return monthData.weeks.some(week => 
    week && Array.isArray(week) && week.some(day => day && day.tradeCount > 0)
  )
}

// Tooltip functions
const showTooltip = (event, day) => {
  // Use mouse position directly for better positioning
  tooltip.value = {
    visible: true,
    x: event.clientX + 16, // 16px to the right of cursor
    y: event.clientY - 16, // 16px above the cursor
    data: day || { 
      date: new Date().toISOString().split('T')[0], 
      tradeCount: 0, 
      pnl: 0 
    }
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
}
</script>

<style scoped>
/* GitHub-style Heatmap */
.heatmap-section {
  margin: 2rem 0;
  padding: 1.5rem;
  background: #ffffff;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.heatmap-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.heatmap-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #374151;
  font-weight: 600;
}

.heatmap-year {
  font-size: 1rem;
  color: #6b7280;
  font-weight: 500;
}

.heatmap-container {
  overflow-x: auto;
}

.heatmap-months {
  display: flex;
  gap: 3px;
  min-width: fit-content;
}

.month-grid {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.month-label {
  font-size: 11px;
  color: #d1d5db;
  margin-bottom: 4px;
  min-width: 40px;
  text-align: center;
  font-weight: 500;
}

.month-label.has-trades {
  color: #6b7280;
  font-weight: 600;
}

.month-calendar {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.week-row {
  display: flex;
  gap: 3px;
}

.day-cell {
  width: 11px;
  height: 11px;
  border-radius: 2px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 6px;
  font-weight: bold;
  position: relative;
}

.day-cell:hover {
  border: 1px solid #6b7280;
  transform: scale(1.3);
  z-index: 10;
}

/* Base colors */
.day-cell.no-trade {
  background-color: #ebedf0;
}

/* Profit intensity levels */
.day-cell.profit.intensity-1 {
  background-color: #c6e48b;
  color: #1f2937;
}

.day-cell.profit.intensity-2 {
  background-color: #7bc96f;
  color: white;
}

.day-cell.profit.intensity-3 {
  background-color: #239a3b;
  color: white;
}

.day-cell.profit.intensity-4 {
  background-color: #196127;
  color: white;
}

/* Loss intensity levels */
.day-cell.loss.intensity-1 {
  background-color: #fecaca;
  color: #1f2937;
}

.day-cell.loss.intensity-2 {
  background-color: #fca5a5;
  color: #1f2937;
}

.day-cell.loss.intensity-3 {
  background-color: #f87171;
  color: white;
}

.day-cell.loss.intensity-4 {
  background-color: #dc2626;
  color: white;
}

/* Neutral (breakeven) */
.day-cell.neutral {
  background-color: #d1d5db;
  color: #374151;
}

.trade-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  font-size: 5px;
  font-weight: 900;
  opacity: 0.8;
}

/* Legend */
.heatmap-legend {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 1rem;
  font-size: 11px;
  color: #6b7280;
}

.legend-levels {
  display: flex;
  gap: 3px;
}

.legend-cell {
  width: 11px;
  height: 11px;
  border-radius: 2px;
}

.legend-cell.no-trade {
  background-color: #ebedf0;
}

.legend-cell.intensity-1 {
  background-color: #c6e48b;
}

.legend-cell.intensity-2 {
  background-color: #7bc96f;
}

.legend-cell.intensity-3 {
  background-color: #239a3b;
}

.legend-cell.intensity-4 {
  background-color: #196127;
}

.legend-label {
  margin: 0 4px;
  font-size: 11px;
  color: #6b7280;
}

/* Custom Tooltip */
.custom-tooltip {
  position: fixed;
  z-index: 9999;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  pointer-events: none;
  border: 1px solid;
  max-width: 200px;
  white-space: nowrap;
  opacity: 1;
  transition: opacity 0.2s ease;
}

/* Tooltip colors based on P&L */
.profit-tooltip {
  background-color: #dcfce7;
  border-color: #22c55e;
  color: #166534;
}

.loss-tooltip {
  background-color: #fef2f2;
  border-color: #ef4444;
  color: #991b1b;
}

.neutral-tooltip {
  background-color: #f3f4f6;
  border-color: #6b7280;
  color: #374151;
}

.no-trade-tooltip {
  background-color: #f9fafb;
  border-color: #d1d5db;
  color: #6b7280;
}

.tooltip-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.tooltip-date {
  font-weight: 600;
  font-size: 11px;
}

.tooltip-pnl {
  font-weight: 700;
  font-size: 13px;
}

.profit-text {
  color: #22c55e;
}

.loss-text {
  color: #ef4444;
}

.neutral-text {
  color: #6b7280;
}

.tooltip-trades {
  font-size: 10px;
  opacity: 0.8;
}

.tooltip-no-trades {
  font-size: 11px;
  opacity: 0.7;
  font-style: italic;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .heatmap-months {
    gap: 2px;
  }
  
  .month-calendar {
    gap: 2px;
  }
  
  .week-row {
    gap: 2px;
  }
  
  .day-cell {
    width: 9px;
    height: 9px;
  }
  
  .legend-cell {
    width: 9px;
    height: 9px;
  }
}
</style>