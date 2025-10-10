<template>
  <div class="results-summary">
    <div class="total-results">
      Showing {{ totalCount }} {{ activeTab }} trade{{ totalCount !== 1 ? 's' : '' }}
    </div>
    <div class="trades-summary">
      <div class="summary-stats">
        <span class="profit-count">
          Profitable: {{ profitableCount }}
        </span>
        <span class="loss-count">
          Loss: {{ lossCount }}
        </span>
        <span class="breakeven-count">
          Breakeven: {{ breakevenCount }}
        </span>
      </div>
      <div
        class="net-profit"
        :class="{
          'profit': netProfit > 0,
          'loss': netProfit < 0
        }"
      >
        Net P&L: {{ formatCurrency(netProfit) }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { formatCurrency } from './tradeHistoryUtils'

interface Trade {
  pnlAmount: number
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
</script>

<style scoped>
.results-summary {
  margin: 1rem 0;
  padding: 1rem;
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .results-summary {
    margin: 20px 0;
    padding: 15px;
    flex-direction: row;
    justify-content: space-between;
    align-items: center;
    gap: 0;
  }
}

.total-results {
  font-size: 1.1em;
  color: #1e293b;
}

.trades-summary {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  align-items: stretch;
}

@media (min-width: 768px) {
  .trades-summary {
    flex-direction: row;
    gap: 20px;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
  }
}

.summary-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

@media (min-width: 768px) {
  .summary-stats {
    gap: 20px;
    justify-content: flex-start;
    flex-wrap: nowrap;
  }
}

.summary-stats span {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 0.9em;
}

.net-profit {
  font-size: 1.1em;
  font-weight: 600;
  padding: 4px 16px;
  border-radius: 4px;
}

.net-profit.profit {
  background-color: rgba(66, 184, 131, 0.1);
  color: #42b883;
}

.net-profit.loss {
  background-color: rgba(239, 68, 68, 0.1);
  color: #ef4444;
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
</style>
