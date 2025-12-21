<template>
  <div class="table-container desktop-table">
    <LoadingSpinner
      v-if="isLoading"
      message="Loading trades..."
      size="large"
      full-height
    />

    <table v-else-if="!isLoading">
      <thead>
        <tr>
          <th :class="{ active: sortKey === 'entryDate' }" @click="$emit('sort', 'entryDate')">
            Date
            <span class="sort-arrow">{{ getSortArrow('entryDate') }}</span>
          </th>
          <th :class="{ active: sortKey === 'symbol' }" @click="$emit('sort', 'symbol')">
            Symbol
            <span class="sort-arrow">{{ getSortArrow('symbol') }}</span>
          </th>
          <th :class="{ active: sortKey === 'type' }" @click="$emit('sort', 'type')">
            Type
            <span class="sort-arrow">{{ getSortArrow('type') }}</span>
          </th>
          <th :class="{ active: sortKey === 'entryPrice' }" @click="$emit('sort', 'entryPrice')">
            Entry Price
            <span class="sort-arrow">{{ getSortArrow('entryPrice') }}</span>
          </th>
          <th :class="{ active: sortKey === 'exitPrice' }" @click="$emit('sort', 'exitPrice')">
            Exit Price
            <span class="sort-arrow">{{ getSortArrow('exitPrice') }}</span>
          </th>
          <th :class="{ active: sortKey === 'pnlAmount' }" @click="$emit('sort', 'pnlAmount')">
            P&L
            <span class="sort-arrow">{{ getSortArrow('pnlAmount') }}</span>
          </th>
          <th v-if="activeTab === 'open'" :class="{ active: sortKey === 'capitalUsed' }" @click="$emit('sort', 'capitalUsed')">
            Capital Used
            <span class="sort-arrow">{{ getSortArrow('capitalUsed') }}</span>
          </th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="trade in trades"
          :key="trade.id"
          :class="{ 'profit': trade.pnlAmount > 0, 'loss': trade.pnlAmount < 0 }"
        >
          <td>{{ formatDate(trade.entryDate) }}</td>
          <td>
            {{ trade.symbol }}
            <span v-if="trade.failureModes && trade.failureModes.length > 0" class="failure-indicator" title="Has failure analysis">
              🔍
            </span>
          </td>
          <td :class="{ 'type-buy': trade.type === 'BUY', 'type-sell': trade.type === 'SELL' }">
            {{ trade.type }}
          </td>
          <td>{{ formatVal(trade.entryPrice) }}</td>
          <td>{{ formatVal(trade.exitPrice) }}</td>
          <td :class="{ 'profit': trade.pnlAmount > 0, 'loss': trade.pnlAmount < 0 }">
            {{ formatVal(trade.pnlAmount) }}
          </td>
          <td v-if="activeTab === 'open'">
            {{ formatVal(trade.capitalUsed) }}
          </td>
          <td class="actions-cell">
            <div class="actions-container">
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
          </td>
        </tr>
        <tr v-if="!isLoading && trades.length === 0">
          <td :colspan="activeTab === 'open' ? 8 : 7" class="empty-state-cell">
            <EmptyState
              icon="📈"
              :title="`No ${activeTab} trades found`"
              :message="activeTab === 'open' ? 'No open trades at the moment' : 'Try adjusting your filters or add some trades to get started'"
              :full-height="false"
            />
          </td>
        </tr>
      </tbody>
    </table>
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
  failureModes?: string[]
}

const props = defineProps<{
  trades: Trade[]
  sortKey: string
  sortOrder: string
  isLoading: boolean
  activeTab: string
}>()

defineEmits<{
  sort: [key: string]
  view: [trade: Trade]
  edit: [trade: Trade]
  delete: [trade: Trade]
}>()

const getSortArrow = (key: string) => {
  if (props.sortKey !== key) return ''
  return props.sortOrder === 'asc' ? '↑' : '↓'
}
</script>

<style scoped>
.desktop-table {
  display: none;
}

@media (min-width: 768px) {
  .desktop-table {
    display: block;
  }
}

.table-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  margin: 1rem -1rem;
  padding: 0 1rem;
}

@media (min-width: 768px) {
  .table-container {
    margin: 0;
    padding: 0;
  }
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 1rem;
  background: white;
  border-radius: 8px;
  overflow: hidden;
  min-width: 800px;
  font-size: 0.875rem;
}

@media (min-width: 768px) {
  table {
    margin-top: 20px;
    min-width: 100%;
    font-size: 1rem;
  }
}

th {
  background-color: #f8fafc;
  padding: 8px;
  text-align: left;
  font-weight: 600;
  color: #1e293b;
  cursor: pointer;
  user-select: none;
  white-space: nowrap;
  font-size: 0.8rem;
}

@media (min-width: 768px) {
  th {
    padding: 12px;
    font-size: 1rem;
  }
}

th.active {
  background-color: #e2e8f0;
}

td {
  padding: 8px;
  border-top: 1px solid #e2e8f0;
  white-space: nowrap;
  font-size: 0.8rem;
}

.failure-indicator {
  margin-left: 4px;
  font-size: 0.875rem;
  opacity: 0.8;
  cursor: help;
}

@media (min-width: 768px) {
  td {
    padding: 12px;
    font-size: 1rem;
  }
}

tr:hover {
  background-color: #f1f5f9;
}

.sort-arrow {
  margin-left: 5px;
}

.type-buy {
  color: #42b883;
}

.type-sell {
  color: #ef4444;
}

tr.profit {
  background-color: rgba(66, 184, 131, 0.05);
}

tr.loss {
  background-color: rgba(239, 68, 68, 0.05);
}

td.profit {
  color: #42b883;
  font-weight: 600;
}

td.loss {
  color: #ef4444;
  font-weight: 600;
}

.actions-cell {
  min-width: 200px;
}

.actions-container {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  justify-content: center;
}

@media (min-width: 768px) {
  .actions-container {
    justify-content: flex-start;
    flex-wrap: nowrap;
    gap: 0;
  }
}

.action-btn {
  padding: 6px 10px;
  margin: 2px;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  min-height: 36px;
  min-width: 60px;
  touch-action: manipulation;
  display: inline-block;
}

@media (min-width: 768px) {
  .action-btn {
    padding: 4px 8px;
    margin: 0 4px;
    font-size: 14px;
    min-height: auto;
    min-width: auto;
  }
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

.empty-state-cell {
  border: none !important;
  padding: 0 !important;
}
</style>
