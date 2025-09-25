<template>
  <div class="monthly-breakdown">
    <div class="section-header">
      <h3>Monthly Breakdown</h3>
    </div>

    <!-- Loading state for monthly breakdown -->
    <div v-if="isLoading" class="loader-container">
      <div class="spinner"></div>
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

    <div v-else-if="monthlyData.length > 0" class="monthly-grid">
      <div
v-for="month in monthlyData" :key="month.month" class="monthly-card" :class="{
        'profitable': month.totalPnL > 0,
        'loss': month.totalPnL < 0
      }">
        <div class="monthly-header">
          <h4>{{ month.month }}</h4>
          <span class="trade-count">{{ month.totalTrades }} trades</span>
        </div>

        <div class="monthly-stats">
          <div class="monthly-stat">
            <span class="stat-label">P&L:</span>
            <span class="stat-value" :class="{ 'positive': month.totalPnL > 0, 'negative': month.totalPnL < 0 }">
              ₹{{ month.totalPnL.toLocaleString() }}
            </span>
          </div>
          <div class="monthly-stat">
            <span class="stat-label">Win Rate:</span>
            <span class="stat-value">{{ month.winRate }}%</span>
          </div>
          <div class="monthly-stat">
            <span class="stat-label">Avg P&L:</span>
            <span class="stat-value" :class="{ 'positive': month.avgPnL > 0, 'negative': month.avgPnL < 0 }">
              ₹{{ month.avgPnL.toLocaleString() }}
            </span>
          </div>
          <div class="monthly-stat">
            <span class="stat-label">R:R Ratio:</span>
            <span
class="stat-value"
              :class="{ 'positive': month.riskRewardRatio >= 1, 'neutral': month.riskRewardRatio < 1 && month.riskRewardRatio > 0 }">
              {{ month.riskRewardRatio > 0 ? month.riskRewardRatio.toFixed(2) : 'N/A' }}
            </span>
          </div>
          
          <!-- Remarks breakdown section -->
          <div v-if="Object.keys(month.remarksCount || {}).length > 0" class="remarks-section">
            <div class="remarks-header">
              <span class="stat-label">Remarks:</span>
            </div>
            <div class="remarks-list">
              <div v-for="(count, remark) in month.remarksCount" :key="remark" class="remark-item">
                <span class="remark-name">{{ remark }}:</span>
                <span class="remark-count">{{ count }}</span>
              </div>
            </div>
          </div>
          
          <div class="win-loss-breakdown">
            <span class="wins">{{ month.winningTrades }}W</span>
            <span class="losses">{{ month.losingTrades }}L</span>
          </div>
        </div>
      </div>
    </div>

    <div v-else-if="availableYears.length > 0" class="no-data-message">
      <p>No trading data available for {{ selectedYear }}.</p>
      <p>Select a different year or start logging trades!</p>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  monthlyData: {
    type: Array,
    default: () => []
  },
  selectedYear: {
    type: Number,
    required: true
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
</script>

<style scoped>
.monthly-breakdown {
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

.monthly-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 480px) {
  .monthly-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 768px) {
  .monthly-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1024px) {
  .monthly-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.monthly-card {
  background-color: #ffffff;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1rem;
  transition: all 0.2s ease;
  min-height: 140px;
}

.monthly-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.monthly-card.profitable {
  border-left: 4px solid #00C853;
  background: linear-gradient(135deg, rgba(0, 200, 83, 0.02) 0%, rgba(255, 255, 255, 1) 100%);
}

.monthly-card.loss {
  border-left: 4px solid #D50000;
  background: linear-gradient(135deg, rgba(213, 0, 0, 0.02) 0%, rgba(255, 255, 255, 1) 100%);
}

.monthly-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.monthly-header h4 {
  margin: 0;
  font-size: 1.1rem;
  color: var(--text-color);
}

.trade-count {
  font-size: 0.85rem;
  color: var(--text-muted);
  background: #f1f5f9;
  padding: 0.25rem 0.5rem;
  border-radius: 12px;
}

.monthly-stats {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.monthly-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-label {
  font-size: 0.85rem;
  color: var(--text-muted);
}

.monthly-stat .stat-value {
  font-size: 0.9rem;
  font-weight: 600;
}

.monthly-stat .stat-value.positive {
  color: #00C853;
}

.monthly-stat .stat-value.negative {
  color: #D50000;
}

.monthly-stat .stat-value.neutral {
  color: #FF9800;
}

.win-loss-breakdown {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.5rem;
  justify-content: center;
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

.remarks-section {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e2e8f0;
}

.remarks-header {
  margin-bottom: 0.5rem;
  text-align: left;
}

.remarks-header .stat-label {
  text-align: left;
  justify-content: flex-start;
  font-weight: 700;
}

.remarks-list {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.remark-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.8rem;
}

.remark-name {
  color: var(--text-muted);
  font-size: 0.75rem;
  flex: 1;
  text-overflow: ellipsis;
  overflow: hidden;
  white-space: nowrap;
  text-align: left;
}

.remark-count {
  font-weight: 600;
  color: var(--text-color);
  background: #f1f5f9;
  padding: 0.125rem 0.375rem;
  border-radius: 8px;
  font-size: 0.75rem;
  min-width: 20px;
  text-align: center;
}
</style>