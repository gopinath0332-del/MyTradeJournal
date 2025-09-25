<template>
  <div class="calendar-view">
    <div class="calendar-header">
      <h2>Calendar View</h2>
      <div class="month-navigation">
        <button class="nav-button" :disabled="isLoading" @click="goToPreviousMonth">
          ← Previous
        </button>
        <span class="current-month">{{ currentMonthName }} {{ currentYear }}</span>
        <button class="nav-button" :disabled="isLoading" @click="goToNextMonth">
          Next →
        </button>
      </div>
    </div>

    <div v-if="isLoading" class="loading-state">
      <p>Loading calendar data...</p>
    </div>

    <div v-else-if="error" class="error-state">
      <p>{{ error }}</p>
      <button class="retry-button" @click="retryCalendar">Retry</button>
    </div>

    <div v-else class="calendar-container">
      <div class="calendar-grid">
        <!-- Day headers -->
        <div v-for="day in dayHeaders" :key="day" class="day-header">
          {{ day }}
        </div>

        <!-- Calendar days -->
        <div
          v-for="day in calendarDays"
          :key="day.date"
          class="calendar-day"
          :class="{
            'other-month': !day.isCurrentMonth,
            'has-trades': day.trades && day.trades.length > 0,
            'today': day.isToday
          }"
        >
          <div class="day-number">{{ day.dayNumber }}</div>

          <div v-if="day.trades && day.trades.length > 0" class="trades-summary">
            <div class="trade-count">{{ day.trades.length }} trade{{ day.trades.length !== 1 ? 's' : '' }}</div>
            <div
              class="daily-pnl"
              :class="{
                'profit': day.totalPnL > 0,
                'loss': day.totalPnL < 0,
                'neutral': day.totalPnL === 0
              }"
            >
              {{ day.totalPnL >= 0 ? '+' : '' }}₹{{ formatCurrency(Math.abs(day.totalPnL)) }}
            </div>
          </div>

          <!-- Trade details popup on click -->
          <div v-if="day.trades && day.trades.length > 0" class="trades-list" @click="showTradeDetails(day)">
            <div
              v-for="trade in day.trades.slice(0, 3)"
              :key="trade.id"
              class="trade-item"
              :class="{
                'profit': trade.pnlAmount > 0,
                'loss': trade.pnlAmount < 0,
                'neutral': trade.pnlAmount === 0
              }"
            >
              <span class="trade-symbol">{{ trade.symbol }}</span>
              <span class="trade-pnl">{{ trade.pnlAmount >= 0 ? '+' : '' }}₹{{ formatCurrency(Math.abs(trade.pnlAmount)) }}</span>
            </div>
            <div v-if="day.trades.length > 3" class="more-trades">
              +{{ day.trades.length - 3 }} more
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Trade Details Modal -->
    <div v-if="selectedDay" class="modal-overlay" @click="closeTradeDetails">
      <div class="trade-details-modal" @click.stop>
        <div class="modal-header">
          <h3>Trades for {{ formatDate(selectedDay.date) }}</h3>
          <button class="close-button" @click="closeTradeDetails">×</button>
        </div>
        <div class="modal-content">
          <div class="day-summary">
            <div class="summary-item">
              <span class="label">Total Trades:</span>
              <span class="value">{{ selectedDay.trades.length }}</span>
            </div>
            <div class="summary-item">
              <span class="label">Daily P&L:</span>
              <span
                class="value"
                :class="{
                  'profit': selectedDay.totalPnL > 0,
                  'loss': selectedDay.totalPnL < 0,
                  'neutral': selectedDay.totalPnL === 0
                }"
              >
                {{ selectedDay.totalPnL >= 0 ? '+' : '' }}₹{{ formatCurrency(Math.abs(selectedDay.totalPnL)) }}
              </span>
            </div>
          </div>

          <div class="trades-detail-list">
            <div
              v-for="trade in selectedDay.trades"
              :key="trade.id"
              class="trade-detail-item"
              :class="{
                'profit': trade.pnlAmount > 0,
                'loss': trade.pnlAmount < 0,
                'neutral': trade.pnlAmount === 0
              }"
            >
              <div class="trade-main-info">
                <span class="trade-symbol">{{ trade.symbol }}</span>
                <span class="trade-type" :class="trade.type.toLowerCase()">{{ trade.type }}</span>
              </div>
              <div class="trade-prices">
                <span>Entry: ₹{{ formatCurrency(trade.entryPrice) }}</span>
                <span>Exit: ₹{{ formatCurrency(trade.exitPrice) }}</span>
              </div>
              <div class="trade-pnl">
                {{ trade.pnlAmount >= 0 ? '+' : '' }}₹{{ formatCurrency(Math.abs(trade.pnlAmount)) }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useCalendar } from '../composables/useCalendar.js'

const {
  // State
  currentMonth,
  currentYear,
  calendarData,

  // Loading states
  isLoading,

  // Error states
  error,

  // Methods
  initializeCalendar,
  goToPreviousMonth,
  goToNextMonth,
  retryCalendar
} = useCalendar()

// Selected day for details modal
const selectedDay = ref(null)

// Day headers for the calendar
const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

// Current month name
const currentMonthName = computed(() => {
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]
  return monthNames[currentMonth.value]
})

// Calendar days with trade data
const calendarDays = computed(() => {
  if (!calendarData.value.length) return []

  const firstDay = new Date(currentYear.value, currentMonth.value, 1)
  const lastDay = new Date(currentYear.value, currentMonth.value + 1, 0)
  const startDate = new Date(firstDay)
  const endDate = new Date(lastDay)

  // Adjust to show full weeks
  startDate.setDate(startDate.getDate() - startDate.getDay())
  endDate.setDate(endDate.getDate() + (6 - endDate.getDay()))

  const days = []
  const currentDate = new Date(startDate)
  const today = new Date()

  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0]
    const dayTrades = calendarData.value.filter(trade => {
      const tradeDate = new Date(trade.entryDate).toISOString().split('T')[0]
      return tradeDate === dateStr
    })

    const totalPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)

    days.push({
      date: dateStr,
      dayNumber: currentDate.getDate(),
      isCurrentMonth: currentDate.getMonth() === currentMonth.value,
      isToday: currentDate.toDateString() === today.toDateString(),
      trades: dayTrades,
      totalPnL
    })

    currentDate.setDate(currentDate.getDate() + 1)
  }

  return days
})

// Helper functions
const formatCurrency = (amount) => {
  return Math.abs(amount).toLocaleString('en-IN')
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  })
}

const showTradeDetails = (day) => {
  selectedDay.value = day
}

const closeTradeDetails = () => {
  selectedDay.value = null
}

onMounted(() => {
  initializeCalendar()
})
</script>

<style scoped>
.calendar-view {
  padding: 1rem;
  max-width: 1200px;
  margin: 0 auto;
}

.calendar-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
  align-items: center;
}

@media (min-width: 768px) {
  .calendar-header {
    flex-direction: row;
    justify-content: space-between;
  }
}

.calendar-header h2 {
  margin: 0;
  font-size: 1.5rem;
  color: #374151;
  font-weight: 600;
}

.month-navigation {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.nav-button {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.nav-button:hover:not(:disabled) {
  background: #e5e7eb;
}

.nav-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-month {
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  min-width: 200px;
  text-align: center;
}

.loading-state, .error-state {
  text-align: center;
  padding: 3rem;
  color: #6b7280;
}

.retry-button {
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  margin-top: 1rem;
}

.calendar-container {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
  overflow: hidden;
}

.calendar-grid {
  display: grid;
  grid-template-columns: repeat(7, 1fr);
}

.day-header {
  background: #f9fafb;
  padding: 0.75rem;
  text-align: center;
  font-weight: 600;
  color: #6b7280;
  border-bottom: 1px solid #e5e7eb;
  font-size: 0.875rem;
}

.calendar-day {
  border-right: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  min-height: 120px;
  padding: 0.5rem;
  position: relative;
  cursor: pointer;
  transition: background-color 0.2s;
}

.calendar-day:nth-child(7n) {
  border-right: none;
}

.calendar-day:hover {
  background: #f9fafb;
}

.calendar-day.other-month {
  background: #f9fafb;
  color: #9ca3af;
}

.calendar-day.today {
  background: #eff6ff;
  border: 2px solid #3b82f6;
}

.calendar-day.has-trades {
  background: #f0fdf4;
}

.day-number {
  font-weight: 600;
  margin-bottom: 0.25rem;
}

.trades-summary {
  font-size: 0.75rem;
  margin-bottom: 0.5rem;
}

.trade-count {
  color: #6b7280;
  margin-bottom: 0.125rem;
}

.daily-pnl {
  font-weight: 600;
}

.daily-pnl.profit {
  color: #16a34a;
}

.daily-pnl.loss {
  color: #dc2626;
}

.daily-pnl.neutral {
  color: #6b7280;
}

.trades-list {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.trade-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.125rem 0.25rem;
  border-radius: 3px;
  font-size: 0.625rem;
  border-left: 2px solid transparent;
}

.trade-item.profit {
  background: rgba(34, 197, 94, 0.1);
  border-left-color: #22c55e;
}

.trade-item.loss {
  background: rgba(239, 68, 68, 0.1);
  border-left-color: #ef4444;
}

.trade-item.neutral {
  background: rgba(107, 114, 128, 0.1);
  border-left-color: #6b7280;
}

.trade-symbol {
  font-weight: 600;
}

.more-trades {
  font-size: 0.625rem;
  color: #6b7280;
  text-align: center;
  padding: 0.125rem;
}

/* Modal Styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.trade-details-modal {
  background: white;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 80vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #374151;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #6b7280;
  padding: 0.25rem;
}

.close-button:hover {
  color: #374151;
}

.modal-content {
  padding: 1.5rem;
}

.day-summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  margin-bottom: 1.5rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.summary-item .label {
  font-size: 0.875rem;
  color: #6b7280;
}

.summary-item .value {
  font-weight: 600;
  font-size: 1.125rem;
}

.summary-item .value.profit {
  color: #16a34a;
}

.summary-item .value.loss {
  color: #dc2626;
}

.summary-item .value.neutral {
  color: #6b7280;
}

.trades-detail-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.trade-detail-item {
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid transparent;
  background: #f9fafb;
}

.trade-detail-item.profit {
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.05);
}

.trade-detail-item.loss {
  border-left-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.trade-detail-item.neutral {
  border-left-color: #6b7280;
  background: rgba(107, 114, 128, 0.05);
}

.trade-main-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.trade-symbol {
  font-weight: 700;
  font-size: 1.125rem;
  color: #374151;
}

.trade-type {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.trade-type.buy {
  background: rgba(34, 197, 94, 0.1);
  color: #16a34a;
}

.trade-type.sell {
  background: rgba(239, 68, 68, 0.1);
  color: #dc2626;
}

.trade-prices {
  display: flex;
  justify-content: space-between;
  margin-bottom: 0.5rem;
  color: #6b7280;
  font-size: 0.875rem;
}

.trade-pnl {
  font-weight: 700;
  font-size: 1.125rem;
  text-align: right;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .calendar-view {
    padding: 0.5rem;
  }

  .calendar-day {
    min-height: 80px;
    padding: 0.25rem;
  }

  .day-header {
    padding: 0.5rem 0.25rem;
    font-size: 0.75rem;
  }

  .trade-details-modal {
    margin: 0.5rem;
    max-height: 90vh;
  }

  .day-summary {
    flex-direction: column;
    gap: 1rem;
  }
}
</style>
