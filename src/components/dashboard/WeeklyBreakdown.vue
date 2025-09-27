<template>
  <div class="weekly-breakdown">
    <div class="section-header">
      <h3>Weekly Breakdown</h3>
      <div class="filters-container">
        <div class="month-selector">
          <label for="monthSelect">Month:</label>
          <select
            id="monthSelect"
            :value="selectedMonth"
            :disabled="availableMonths.length === 0"
            @change="$emit('month-change', parseInt($event.target.value))"
          >
            <option v-if="availableMonths.length === 0" value="">No data available</option>
            <option v-for="monthIndex in availableMonths" :key="monthIndex" :value="monthIndex">
              {{ monthNames[monthIndex] }}
            </option>
          </select>
        </div>
      </div>
    </div>

    <!-- Loading state for weekly breakdown -->
    <div v-if="isLoading" class="loader-container">
      <div class="spinner" />
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="error-container">
      <div class="error-card">
        <div class="error-icon">⚠️</div>
        <div class="error-message">{{ error }}</div>
        <button v-if="onRetry" class="retry-button" @click="onRetry">
          Try Again
        </button>
      </div>
    </div>

    <div v-else-if="weeklyData.length > 0" class="weekly-grid">
      <div
        v-for="week in weeklyData"
        :key="week.weekRange"
        class="weekly-card"
        :class="{
          'profitable': week.totalPnL > 0,
          'loss': week.totalPnL < 0
        }"
      >
        <div class="weekly-header">
          <h4>{{ week.weekRange }}</h4>
          <span class="trade-count">{{ week.totalTrades }} trades</span>
        </div>

        <div class="weekly-stats">
          <div class="weekly-stat">
            <span class="stat-label">P&L:</span>
            <span class="stat-value" :class="{ 'positive': week.totalPnL > 0, 'negative': week.totalPnL < 0 }">
              ₹{{ week.totalPnL.toLocaleString() }}
            </span>
          </div>
          <div class="weekly-stat">
            <span class="stat-label">Win Rate:</span>
            <span class="stat-value">{{ week.winRate }}%</span>
          </div>
          <div class="weekly-stat">
            <span class="stat-label">Avg P&L:</span>
            <span class="stat-value" :class="{ 'positive': week.avgPnL > 0, 'negative': week.avgPnL < 0 }">
              ₹{{ week.avgPnL.toLocaleString() }}
            </span>
          </div>
          <div class="weekly-stat">
            <span class="stat-label">R:R Ratio:</span>
            <span
              class="stat-value"
              :class="{ 'positive': week.riskRewardRatio >= 1, 'neutral': week.riskRewardRatio < 1 && week.riskRewardRatio > 0 }"
            >
              {{ week.riskRewardRatio > 0 ? week.riskRewardRatio.toFixed(2) : 'N/A' }}
            </span>
          </div>
          <div class="win-loss-breakdown">
            <span class="wins">{{ week.winningTrades }}W</span>
            <span class="losses">{{ week.losingTrades }}L</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="availableYears.length > 0" class="no-data-message">
      <p v-if="availableMonths.length === 0">No trading data available for {{ selectedYear }}.</p>
      <p v-else>No trading data available for {{ monthNames[selectedMonth] }} {{ selectedYear }}.</p>
      <p>Select a different {{ availableMonths.length === 0 ? 'year' : 'month' }} or start logging trades!</p>
    </div>
  </div>
</template>

<script setup>
const _props = defineProps({
  weeklyData: {
    type: Array,
    default: () => []
  },
  selectedMonth: {
    type: Number,
    required: true
  },
  selectedYear: {
    type: Number,
    required: true
  },
  availableMonths: {
    type: Array,
    default: () => []
  },
  availableYears: {
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
  }
})

const _emit = defineEmits(['month-change'])

const monthNames = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]
</script>

<style scoped>
.weekly-breakdown {
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 2px solid #e2e8f0;
}

.section-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
  align-items: flex-start;
}

@media (min-width: 768px) {
  .section-header {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0;
  }
}

.section-header h3 {
  margin: 0;
  color: var(--text-color);
  font-size: 1.5rem;
}

.filters-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: flex-start;
}

@media (min-width: 768px) {
  .filters-container {
    flex-direction: row;
    align-items: center;
    gap: 1.5rem;
  }
}

.month-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.month-selector label {
  font-weight: 500;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.month-selector select {
  padding: 0.4rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  color: var(--text-color);
  font-size: 0.9rem;
  cursor: pointer;
}

.month-selector select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.month-selector select:disabled {
  background: #f8fafc;
  color: var(--text-muted);
  cursor: not-allowed;
  opacity: 0.6;
}

.weekly-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-top: 1rem;
}

@media (min-width: 768px) {
  .weekly-grid {
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 1.5rem;
  }
}

.weekly-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
  min-height: 140px;
  border-left: 4px solid #64748b;
}

.weekly-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.weekly-card.profitable {
  border-left: 4px solid #10b981;
  background: linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(255, 255, 255, 1) 100%);
}

.weekly-card.loss {
  border-left: 4px solid #ef4444;
  background: linear-gradient(135deg, rgba(239, 68, 68, 0.02) 0%, rgba(255, 255, 255, 1) 100%);
}

.weekly-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.weekly-header h4 {
  margin: 0;
  font-size: 1rem;
  color: var(--text-color);
  font-weight: 600;
}

.weekly-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
}

.weekly-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.weekly-stat .stat-label {
  font-size: 0.75rem;
  color: var(--text-muted);
  font-weight: 500;
}

.weekly-stat .stat-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: var(--text-color);
}

.weekly-stat .stat-value.positive {
  color: #00C853;
}

.weekly-stat .stat-value.negative {
  color: #D50000;
}

.weekly-stat .stat-value.neutral {
  color: #FF9800;
}

.trade-count {
  font-size: 0.85rem;
  color: var(--text-muted);
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.win-loss-breakdown {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: center;
  grid-column: span 2;
}

.wins,
.losses {
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
}

.wins {
  background: rgba(0, 200, 83, 0.1);
  color: #00C853;
}

.losses {
  background: rgba(213, 0, 0, 0.1);
  color: #D50000;
}

.loader-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  position: relative;
}

.error-container {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  position: relative;
}

.error-card {
  background: #fff;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  max-width: 300px;
}

.error-icon {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.error-message {
  color: #dc2626;
  margin-bottom: 1rem;
  font-weight: 500;
}

.retry-button {
  background: #dc2626;
  color: white;
  border: none;
  padding: 0.5rem 1rem;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
  transition: background 0.2s;
}

.retry-button:hover {
  background: #b91c1c;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.no-data-message {
  text-align: center;
  padding: 2rem;
  color: var(--text-muted);
  background: #f8fafc;
  border-radius: 8px;
  margin-top: 1rem;
}

.no-data-message p {
  margin: 0.5rem 0;
}
</style>
