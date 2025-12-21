<template>
  <div class="mobile-trades">
    <LoadingSpinner
      v-if="isLoading"
      message="Loading trades..."
      size="large"
      full-height
    />

    <template v-else>
      <div class="mobile-sort-controls">
        <label for="mobileSortSelect">Sort by:</label>
        <select id="mobileSortSelect" :value="sortKey" @change="handleSortChange">
          <option value="entryDate">Date</option>
          <option value="symbol">Symbol</option>
          <option value="type">Type</option>
          <option value="entryPrice">Entry Price</option>
          <option value="exitPrice">Exit Price</option>
          <option value="pnlAmount">P&L</option>
          <option v-if="activeTab === 'open'" value="capitalUsed">Capital Used</option>
        </select>
        <button class="sort-direction-btn" @click="$emit('toggleSort')">
          {{ sortOrder === 'asc' ? '↑' : '↓' }}
        </button>
      </div>

      <div class="trade-cards">
        <div
          v-for="trade in trades"
          :key="trade.id"
          class="trade-card"
          :class="{ 'profit': trade.pnlAmount > 0, 'loss': trade.pnlAmount < 0 }"
        >
          <div class="trade-card-header">
            <div class="trade-symbol">{{ trade.symbol }}</div>
            <div class="trade-date">{{ formatDate(trade.entryDate) }}</div>
          </div>

          <div class="trade-card-body">
            <div class="trade-row">
              <span class="trade-label">Type:</span>
              <span
                class="trade-value"
                :class="{ 'type-buy': trade.type === 'BUY', 'type-sell': trade.type === 'SELL' }"
              >
                {{ trade.type }}
              </span>
            </div>
            <div class="trade-row">
              <span class="trade-label">Entry:</span>
              <span class="trade-value">{{ formatVal(trade.entryPrice) }}</span>
            </div>
            <div class="trade-row">
              <span class="trade-label">Exit:</span>
              <span class="trade-value">{{ formatVal(trade.exitPrice) }}</span>
            </div>
            <div class="trade-row">
              <span class="trade-label">P&L:</span>
              <span
                class="trade-value pnl-value"
                :class="{ 'profit': trade.pnlAmount > 0, 'loss': trade.pnlAmount < 0 }"
              >
                {{ formatVal(trade.pnlAmount) }}
              </span>
            </div>
            <div v-if="activeTab === 'open'" class="trade-row">
              <span class="trade-label">Capital Used:</span>
              <span class="trade-value">{{ formatVal(trade.capitalUsed) }}</span>
            </div>
          </div>

          <div class="trade-card-actions">
            <button
              class="action-btn view-btn"
              :class="{ 'has-remarks': trade.remarks }"
              @click="$emit('view', trade)"
            >
              View
            </button>
            <button class="action-btn edit-btn" @click="$emit('edit', trade)">
              Edit
            </button>
            <button class="action-btn delete-btn" @click="$emit('delete', trade)">
              Delete
            </button>
          </div>
        </div>

        <div v-if="!isLoading && trades.length === 0" class="empty-state-mobile">
          <EmptyState
            icon="📊"
            :title="`No ${activeTab} trades found`"
            :message="activeTab === 'open' ? 'No open trades at the moment' : 'Try adjusting your filters or add your first trade to get started'"
            :full-height="true"
          />
        </div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import LoadingSpinner from '../../ui/LoadingSpinner.vue'
import EmptyState from '../../ui/EmptyState.vue'
import { formatDate, formatCurrency } from './tradeHistoryUtils'
import { useProfiles } from '@/composables/useProfiles'

const { currencySymbol } = useProfiles()
const formatVal = (val: number | null | undefined) => formatCurrency(val, currencySymbol.value)

interface Trade {
  id: string
  symbol: string
  type: string
  entryDate: string
  entryPrice: number
  exitPrice: number
  pnlAmount: number
  capitalUsed: number
  remarks?: string
}

defineProps<{
  trades: Trade[]
  sortKey: string
  sortOrder: string
  isLoading: boolean
  activeTab: string
}>()

const emit = defineEmits<{
  sort: [key: string]
  toggleSort: []
  view: [trade: Trade]
  edit: [trade: Trade]
  delete: [trade: Trade]
}>()

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleSortChange = (event: any) => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const target = event.target as any
  emit('sort', target.value)
}
</script>

<style scoped>
.mobile-trades {
  display: block;
}

@media (min-width: 768px) {
  .mobile-trades {
    display: none;
  }
}

.mobile-sort-controls {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 1rem;
  padding: 12px;
  background-color: #f8fafc;
  border-radius: 8px;
}

.mobile-sort-controls label {
  font-weight: 500;
  color: #374151;
}

.mobile-sort-controls select {
  flex: 1;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background-color: white;
  font-size: 14px;
}

.sort-direction-btn {
  padding: 8px 12px;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  cursor: pointer;
  min-width: 40px;
}

.sort-direction-btn:hover {
  background-color: #2563eb;
}

.trade-cards {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.trade-card {
  background-color: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.trade-card:hover {
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transform: translateY(-1px);
}

.trade-card.profit {
  border-left: 4px solid #22c55e;
  background-color: rgba(34, 197, 94, 0.02);
}

.trade-card.loss {
  border-left: 4px solid #ef4444;
  background-color: rgba(239, 68, 68, 0.02);
}

.trade-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid #f3f4f6;
}

.trade-symbol {
  font-size: 18px;
  font-weight: 700;
  color: #111827;
}

.trade-date {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.trade-card-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 16px;
}

.trade-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.trade-label {
  font-size: 14px;
  color: #6b7280;
  font-weight: 500;
}

.trade-value {
  font-size: 14px;
  color: #111827;
  font-weight: 600;
}

.trade-value.type-buy {
  color: #22c55e;
}

.trade-value.type-sell {
  color: #ef4444;
}

.pnl-value.profit {
  color: #22c55e;
}

.pnl-value.loss {
  color: #ef4444;
}

.trade-card-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.trade-card-actions .action-btn {
  flex: 1;
  min-width: 70px;
  padding: 10px 12px;
  font-size: 14px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
  touch-action: manipulation;
}

.view-btn {
  background-color: #e5e7eb;
  color: #374151;
  border: none;
}

.view-btn:hover {
  background-color: #d1d5db;
}

.view-btn.has-remarks {
  background-color: #3b82f6;
  color: #fff;
}

.view-btn.has-remarks:hover {
  background-color: #2563eb;
}

.edit-btn {
  background-color: #4CAF50;
  color: white;
  border: none;
}

.edit-btn:hover {
  background-color: #45a049;
}

.delete-btn {
  background-color: #ef4444;
  color: white;
  border: none;
}

.delete-btn:hover {
  background-color: #dc2626;
}

.empty-state-mobile {
  width: 100%;
}
</style>
