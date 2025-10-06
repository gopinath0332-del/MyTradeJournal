<template>
  <div class="symbol-cards">
    <div v-if="symbols.length === 0" class="no-data-message">
      {{ noDataMessage || 'No symbol data available' }}
    </div>
    <div v-else class="cards-grid">
      <div
        v-for="symbol in symbols"
        :key="symbol.name"
        class="symbol-card"
      >
        <div class="card-header">
          <h5 class="symbol-name">{{ symbol.name }}</h5>
          <div class="trade-count">{{ symbol.tradeCount }} trades</div>
        </div>
        <div class="card-body">
          <div class="metric-row">
            <span class="metric-label">Win Rate</span>
            <span class="metric-value">{{ formatPercentage(symbol.winRate) }}%</span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Avg P&L</span>
            <span class="metric-value" :class="getPerformanceClass(symbol.avgPnL)">
              {{ formatCurrency(symbol.avgPnL) }}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Total P&L</span>
            <span class="metric-value" :class="getPerformanceClass(symbol.totalPnL)">
              {{ formatCurrency(symbol.totalPnL) }}
            </span>
          </div>
          <div class="metric-row">
            <span class="metric-label">Risk-Reward</span>
            <span class="metric-value">{{ formatNumber(symbol.riskReward, 2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'

defineProps({
  symbols: {
    type: Array,
    default: () => []
  },
  noDataMessage: {
    type: String,
    default: 'No symbol data available'
  }
})

// Use inject to get formatting functions from parent or provide defaults
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

// CSS class helpers
const getPerformanceClass = (value) => {
  if (value > 0) return 'positive'
  if (value < 0) return 'negative'
  return 'neutral'
}
</script>

<style scoped>
.symbol-cards {
  width: 100%;
}

.cards-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 480px) {
  .cards-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1.25rem;
  }
}

.symbol-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.5rem;
  padding: 1rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.symbol-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid #f3f4f6;
}

.symbol-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.trade-count {
  font-size: 0.8rem;
  color: #6b7280;
  font-weight: 500;
  background: #f3f4f6;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.card-body {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.metric-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.25rem 0;
}

.metric-label {
  font-size: 0.85rem;
  color: #6b7280;
  font-weight: 500;
}

.metric-value {
  font-size: 0.9rem;
  font-weight: 600;
  color: #1f2937;
}

.metric-value.positive {
  color: #059669;
}

.metric-value.negative {
  color: #dc2626;
}

.metric-value.neutral {
  color: #6b7280;
}

.no-data-message {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 2rem;
}
</style>