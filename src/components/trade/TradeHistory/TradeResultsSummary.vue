<template>
  <div class="results-summary">
    <div class="summary-container">
      <div class="total-results">
        Showing {{ totalCount }} {{ activeTab }} trade{{ totalCount !== 1 ? 's' : '' }}
      </div>
      <div class="trades-summary">
        <div class="summary-stats">
          <span class="stats-item profit-count">
            Profitable: {{ profitableCount }}
          </span>
          <span class="stats-item loss-count">
            Loss: {{ lossCount }}
          </span>
          <span class="stats-item breakeven-count">
            Breakeven: {{ breakevenCount }}
          </span>
        </div>
        <div class="metrics">
          <div
            v-if="activeTab !== 'open'"
            class="metric-item net-profit"
            :class="{
              'profit': netProfit > 0,
              'loss': netProfit < 0
            }"
          >
            Net P&L: {{ formatCurrency(netProfit) }}
          </div>
          <div v-if="activeTab === 'open'" class="metric-item invested-total">
            Invested Total: {{ formatCurrency(totalCapitalUsed) }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from './tradeHistoryUtils'

interface Trade {
  pnlAmount: number
  capitalUsed: number
}

const props = defineProps<{
  trades: Trade[]
  activeTab: string
}>()

const totalCount = computed(() => props.trades.length)

const profitableCount = computed(() =>
  props.trades.filter(t => t.pnlAmount > 0).length
)

const lossCount = computed(() =>
  props.trades.filter(t => t.pnlAmount < 0).length
)

const breakevenCount = computed(() =>
  props.trades.filter(t => t.pnlAmount === 0).length
)

const netProfit = computed(() =>
  props.trades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
)

const totalCapitalUsed = computed(() =>
  props.trades.reduce((sum, trade) => sum + (trade.capitalUsed || 0), 0)
)
</script>

<style scoped>
.results-summary {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.summary-container {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .results-summary {
    margin: 20px 0;
    padding: 1.25rem;
  }

  .summary-container {
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
  }
}

.total-results {
  font-size: 1.1em;
  color: #1e293b;
  white-space: nowrap;
}

.trades-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .trades-summary {
    flex-direction: row;
    align-items: center;
    gap: 2rem;
  }
}

.summary-stats {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.stats-item {
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.9em;
  white-space: nowrap;
}

.metrics {
  display: flex;
  gap: 1rem;
  align-items: center;
  flex-wrap: wrap;
}

.metric-item {
  font-size: 1.1em;
  font-weight: 600;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  white-space: nowrap;
}

.net-profit.profit {
  background-color: rgba(66, 184, 131, 0.1);
  color: #42b883;
}

.net-profit.loss {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.invested-total {
  background-color: rgba(79, 70, 229, 0.1);
  color: #4F46E5;
}

.profit-count {
  background-color: rgba(66, 184, 131, 0.1);
  color: #42b883;
}

.loss-count {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
}

.breakeven-count {
  background-color: rgba(100, 116, 139, 0.1);
  color: #64748b;
}

@media (max-width: 767px) {
  .trades-summary {
    width: 100%;
  }
  
  .summary-stats,
  .metrics {
    justify-content: center;
  }
}
</style>
