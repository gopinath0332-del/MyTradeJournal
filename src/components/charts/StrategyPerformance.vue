<template>
  <div class="strategy-performance">
    <div v-if="strategies.length === 0" class="no-data-message">
      {{ noDataMessage || 'No strategy data available' }}
    </div>
    <div v-else class="strategy-cards">
      <div
        v-for="strategy in strategies"
        :key="strategy.name"
        class="strategy-card"
        :class="getStrategyClass(strategy.name)"
      >
        <div class="strategy-header">
          <h4 class="strategy-name">{{ strategy.name }}</h4>
          <div class="trade-count">{{ strategy.tradeCount }} trades</div>
        </div>

        <div class="strategy-metrics">
          <div class="metric-group">
            <div class="metric-item primary">
              <span class="metric-label">Win Rate</span>
              <span class="metric-value win-rate" :class="getWinRateClass(strategy.winRate)">
                {{ formatPercentage(strategy.winRate) }}%
              </span>
            </div>

            <div class="metric-item">
              <span class="metric-label">Profit Factor</span>
              <span class="metric-value" :class="getProfitFactorClass(strategy.profitFactor)">
                {{ formatNumber(strategy.profitFactor, 2) }}
              </span>
            </div>
          </div>

          <div class="metric-group">
            <div class="metric-item">
              <span class="metric-label">Total P&L</span>
              <span class="metric-value" :class="getPerformanceClass(strategy.totalPnL)">
                {{ formatCurrency(strategy.totalPnL) }}
              </span>
            </div>

            <div class="metric-item">
              <span class="metric-label">Avg P&L</span>
              <span class="metric-value" :class="getPerformanceClass(strategy.avgPnL)">
                {{ formatCurrency(strategy.avgPnL) }}
              </span>
            </div>
          </div>

          <div class="metric-group">
            <div class="metric-item">
              <span class="metric-label">Return on Capital</span>
              <span class="metric-value" :class="getPerformanceClass(strategy.returnOnCapital)">
                {{ formatPercentage(strategy.returnOnCapital) }}%
              </span>
            </div>

            <div class="metric-item">
              <span class="metric-label">Avg Capital</span>
              <span class="metric-value">
                {{ formatCurrency(strategy.avgCapital) }}
              </span>
            </div>
          </div>
        </div>

        <!-- Win Rate Visual Bar -->
        <div class="win-rate-bar">
          <div class="bar-background">
            <div
              class="bar-fill"
              :class="getWinRateClass(strategy.winRate)"
              :style="{ width: `${Math.min(strategy.winRate, 100)}%` }"
            />
          </div>
          <span class="bar-label">Win Rate Progress</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

defineProps({
  strategies: {
    type: Array,
    default: () => []
  },
  noDataMessage: {
    type: String,
    default: 'No strategy data available'
  }
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

// Helper functions for CSS classes
const getPerformanceClass = (value) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}

const getWinRateClass = (winRate) => {
  if (winRate >= 70) return 'excellent'
  if (winRate >= 60) return 'good'
  if (winRate >= 50) return 'fair'
  return 'poor'
}

const getProfitFactorClass = (profitFactor) => {
  if (profitFactor >= 2) return 'excellent'
  if (profitFactor >= 1.5) return 'good'
  if (profitFactor >= 1) return 'fair'
  return 'poor'
}

const getStrategyClass = (strategyName) => {
  return strategyName.toLowerCase().replace(/\s+/g, '-')
}
</script>

<style scoped>
.strategy-performance {
  width: 100%;
}

.strategy-cards {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 768px) {
  .strategy-cards {
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 2rem;
  }
}

.strategy-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.75rem;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.strategy-card:hover {
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  transform: translateY(-2px);
}

.strategy-card.supertrend {
  border-left: 4px solid #3b82f6;
}

.strategy-card.donchian {
  border-left: 4px solid #10b981;
}

.strategy-card.stema {
  border-left: 4px solid #f59e0b;
}

.strategy-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f3f4f6;
}

.strategy-name {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.trade-count {
  background: #f3f4f6;
  color: #6b7280;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.875rem;
  font-weight: 500;
}

.strategy-metrics {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.metric-group {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.metric-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.metric-item.primary {
  grid-column: 1 / -1;
  text-align: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 0.5rem;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
}

.metric-item.primary .metric-value {
  font-size: 1.5rem;
  font-weight: 700;
}

.win-rate-bar {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
}

.bar-background {
  width: 100%;
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.bar-fill {
  height: 100%;
  transition: width 0.8s ease;
  border-radius: 4px;
}

.bar-label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 500;
}

/* Performance classes */
.positive {
  color: #059669;
}

.negative {
  color: #dc2626;
}

.neutral {
  color: #6b7280;
}

/* Win rate classes */
.win-rate.excellent,
.bar-fill.excellent {
  color: #059669;
  background-color: #059669;
}

.win-rate.good,
.bar-fill.good {
  color: #10b981;
  background-color: #10b981;
}

.win-rate.fair,
.bar-fill.fair {
  color: #f59e0b;
  background-color: #f59e0b;
}

.win-rate.poor,
.bar-fill.poor {
  color: #ef4444;
  background-color: #ef4444;
}

/* Profit factor classes */
.excellent {
  color: #059669;
}

.good {
  color: #10b981;
}

.fair {
  color: #f59e0b;
}

.poor {
  color: #ef4444;
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

@media (max-width: 480px) {
  .strategy-card {
    padding: 1rem;
  }

  .strategy-header {
    flex-direction: column;
    gap: 0.5rem;
    align-items: flex-start;
  }

  .metric-group {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }

  .metric-item.primary {
    grid-column: 1;
  }
}
</style>
