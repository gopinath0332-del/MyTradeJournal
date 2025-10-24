<template>
  <div v-if="trade" class="modal">
    <div class="modal-content">
      <h3>Trade Details</h3>
      <div class="trade-details">
        <div class="detail-row">
          <span class="label">Symbol:</span>
          <span class="value">{{ trade.symbol }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Contract:</span>
          <span class="value">{{ trade.contract }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Type:</span>
          <span
            class="value"
            :class="{ 'type-buy': trade.type === 'BUY', 'type-sell': trade.type === 'SELL' }"
          >
            {{ trade.type }}
          </span>
        </div>
        <div class="detail-row">
          <span class="label">Entry Date:</span>
          <span class="value">{{ formatDate(trade.entryDate) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Exit Date:</span>
          <span class="value">{{ formatDate(trade.exitDate) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Entry Price:</span>
          <span class="value">{{ formatCurrency(trade.entryPrice) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Exit Price:</span>
          <span class="value">{{ formatCurrency(trade.exitPrice) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Size:</span>
          <span class="value">{{ trade.lots }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Capital Used:</span>
          <span class="value">{{ formatCurrency(trade.capitalUsed) }}</span>
        </div>
        <div class="detail-row">
          <span class="label">P&L:</span>
          <span
            class="value"
            :class="{ 'profit': trade.pnlAmount > 0, 'loss': trade.pnlAmount < 0 }"
          >
            {{ formatCurrency(trade.pnlAmount) }}
          </span>
        </div>
        <div class="detail-row">
          <span class="label">Return %:</span>
          <span
            class="value"
            :class="{ 'profit': trade.pnlPercentage > 0, 'loss': trade.pnlPercentage < 0 }"
          >
            {{ (trade.pnlPercentage || 0).toFixed(2) }}%
          </span>
        </div>
        <div class="detail-row">
          <span class="label">Days Held:</span>
          <span class="value">{{ trade.daysHeld }}</span>
        </div>
        <div v-if="trade.strategy" class="detail-row">
          <span class="label">Strategy:</span>
          <span class="value">{{ trade.strategy }}</span>
        </div>
        <div v-if="trade.remarks" class="detail-row">
          <span class="label">Remarks:</span>
          <span class="value">{{ trade.remarks }}</span>
        </div>
        <div v-if="trade.notes" class="detail-notes">
          <span class="label">Notes:</span>
          <p class="value">{{ trade.notes }}</p>
        </div>
        <div v-if="trade.lessonsLearned" class="detail-notes">
          <span class="label">Lessons Learned:</span>
          <p class="value">{{ trade.lessonsLearned }}</p>
        </div>

        <!-- Failure Mode Analysis (for losing trades) -->
        <div v-if="trade.failureModes && trade.failureModes.length > 0" class="detail-failure-modes">
          <span class="label">Failure Analysis:</span>
          <div class="failure-tags">
            <span
              v-for="modeId in trade.failureModes"
              :key="modeId"
              class="failure-tag"
              :style="{ '--tag-color': getFailureModeColor(modeId) }"
            >
              {{ getFailureModeIcon(modeId) }} {{ getFailureModeLabel(modeId) }}
            </span>
          </div>
          <div v-if="trade.failureNotes" class="failure-notes-section">
            <p class="value">{{ trade.failureNotes }}</p>
          </div>
          <div v-if="trade.failureConfidence" class="failure-confidence">
            <span class="confidence-label">Analysis Confidence:</span>
            <span class="confidence-stars">
              <span v-for="i in 5" :key="i" class="star">
                {{ i <= (trade.failureConfidence || 0) ? '★' : '☆' }}
              </span>
            </span>
          </div>
        </div>
      </div>
      <button class="close-btn" @click="$emit('close')">Close</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { formatDate, formatCurrency } from './tradeHistoryUtils'
import { getFailureModeById } from '@/types/failureMode'

interface Trade {
  id: string
  symbol: string
  contract?: string
  type: string
  entryDate: string
  exitDate: string
  entryPrice: number
  exitPrice: number
  lots: number
  capitalUsed: number
  pnlAmount: number
  pnlPercentage: number
  daysHeld: number
  strategy?: string
  remarks?: string
  notes?: string
  lessonsLearned?: string
  failureModes?: string[]
  failureNotes?: string
  failureConfidence?: number
}

defineProps<{
  trade: Trade | null
}>()

defineEmits<{
  close: []
}>()

// Helper functions for failure modes
const getFailureModeIcon = (modeId: string): string => {
  return getFailureModeById(modeId)?.icon || '❓'
}

const getFailureModeLabel = (modeId: string): string => {
  return getFailureModeById(modeId)?.label || modeId
}

const getFailureModeColor = (modeId: string): string => {
  return getFailureModeById(modeId)?.color || '#6b7280'
}
</script>

<style scoped>
.modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 8px;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
}

.trade-details {
  margin-top: 20px;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
  border-bottom: none;
}

.label {
  color: #64748b;
  font-weight: 500;
}

.value {
  font-weight: 600;
}

.value.profit {
  color: #42b883;
}

.value.loss {
  color: #ef4444;
}

.value.type-buy {
  color: #42b883;
}

.value.type-sell {
  color: #ef4444;
}

.detail-notes {
  margin-top: 20px;
}

.detail-notes .label {
  display: block;
  margin-bottom: 10px;
}

.detail-notes .value {
  white-space: pre-wrap;
  background: #f8fafc;
  padding: 15px;
  border-radius: 4px;
  font-weight: normal;
}

/* Failure Mode Styles */
.detail-failure-modes {
  margin-top: 20px;
  padding: 20px;
  background: #fef2f2;
  border: 2px solid #fecaca;
  border-radius: 8px;
}

.detail-failure-modes .label {
  display: block;
  margin-bottom: 12px;
  color: #991b1b;
  font-weight: 600;
  font-size: 1.05rem;
}

.failure-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 12px;
}

.failure-tag {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  background: white;
  border: 2px solid var(--tag-color);
  color: var(--tag-color);
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 600;
}

.failure-notes-section {
  margin-top: 12px;
  padding: 12px;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #ef4444;
}

.failure-notes-section .value {
  margin: 0;
  color: #374151;
  line-height: 1.6;
  white-space: pre-wrap;
}

.failure-confidence {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.confidence-label {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
}

.confidence-stars {
  display: flex;
  gap: 2px;
}

.confidence-stars .star {
  color: #fbbf24;
  font-size: 1.125rem;
}

.close-btn {
  margin-top: 20px;
  width: 100%;
  padding: 10px;
  background-color: #e2e8f0;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 500;
}

.close-btn:hover {
  background-color: #cbd5e1;
}

/* Mobile Modal Optimizations */
@media (max-width: 767px) {
  .modal-content {
    padding: 16px;
    max-width: 95%;
    width: 95%;
    margin: 10px;
    max-height: 85vh;
    border-radius: 12px;
  }

  .modal-content h3 {
    font-size: 1.1rem;
    margin: 0 0 16px 0;
    text-align: center;
    color: #1e293b;
  }

  .trade-details {
    margin-top: 12px;
  }

  .detail-row {
    padding: 8px 0;
    font-size: 0.9rem;
    align-items: center;
  }

  .detail-row .label {
    font-size: 0.85rem;
    color: #64748b;
    font-weight: 500;
    flex-shrink: 0;
    min-width: 85px;
  }

  .detail-row .value {
    font-size: 0.9rem;
    font-weight: 600;
    text-align: right;
    word-break: break-word;
  }

  .detail-notes {
    margin-top: 16px;
  }

  .detail-notes .label {
    font-size: 0.85rem;
    margin-bottom: 6px;
    font-weight: 600;
  }

  .detail-notes .value {
    padding: 10px;
    font-size: 0.85rem;
    line-height: 1.4;
    border-radius: 6px;
    background: #f1f5f9;
  }

  .close-btn {
    margin-top: 16px;
    padding: 12px;
    font-size: 0.9rem;
    font-weight: 600;
    border-radius: 8px;
    background-color: #3b82f6;
    color: white;
    touch-action: manipulation;
    min-height: 44px;
  }

  .close-btn:hover {
    background-color: #2563eb;
  }
}
</style>
