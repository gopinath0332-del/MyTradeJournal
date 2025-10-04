<!-- TradeForm.vue - Modular component with sub-components -->
<template>
  <div class="trade-form" :class="{ 'form-submitting': isSubmitting }">
    <h2>{{ trade.id ? 'Edit Trade' : 'Log New Trade' }}</h2>

    <!-- Loading overlay for form submission -->
    <div v-if="isSubmitting" class="form-loading-overlay">
      <LoadingSpinner
        message="Saving trade..."
        size="medium"
      />
    </div>

    <!-- Toast notification -->
    <div v-if="showToastOverlay" class="toast" :class="toastVariant">
      <div class="toast-header">
        <strong>{{ toastTitle }}</strong>
        <button type="button" class="close-button" @click="showToastOverlay = false">&times;</button>
      </div>
      <div class="toast-body">
        {{ toastMessage }}
      </div>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- Basic Trade Information -->
      <TradeBasicInfo
        v-model="trade"
      />

      <!-- Date Information -->
      <TradeDates
        v-model="trade"
      />

      <!-- Pricing Information -->
      <TradePricing
        v-model="trade"
        @calculate-pnl="calculatePnL"
      />

      <!-- Trade Summary -->
      <TradeSummary
        :pnl="pnl"
        :capital-used="trade.capitalUsed"
        @update-pnl="updatePnLFromAmount"
      />

      <!-- Additional Metadata -->
      <TradeMetadata
        v-model="trade"
        @screenshot-upload="handleScreenshotUpload"
      />

      <!-- Form Actions -->
      <TradeActions
        :is-submitting="isSubmitting"
        :is-edit-mode="!!trade.id"
        :show-cancel="!!trade.id"
        @cancel="handleCancel"
      />
    </form>
  </div>
</template>

<script setup>
import { ref, inject, watch, onMounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { tradeService } from '../../firebase/tradeService'
import { logger } from '../../utils/logger'

// Import sub-components
import TradeBasicInfo from './forms/TradeBasicInfo.vue'
import TradeDates from './forms/TradeDates.vue'
import TradePricing from './forms/TradePricing.vue'
import TradeSummary from './forms/TradeSummary.vue'
import TradeMetadata from './forms/TradeMetadata.vue'
import TradeActions from './forms/TradeActions.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'

// Loading state
const isSubmitting = ref(false)

// Injected dependencies
const editingTrade = inject('editingTrade')
const activeTab = inject('activeTab')
const refreshDashboard = inject('refreshDashboard')

// Toast state
const toastVariant = ref('success')
const toastTitle = ref('')
const toastMessage = ref('')
const showToastOverlay = ref(false)

// Trade data
const trade = ref({
  tradeId: uuidv4(),
  symbol: '',
  contract: '',
  type: '',
  entryPrice: null,
  exitPrice: null,
  entryDate: new Date().toISOString().slice(0, 10), // Set today as default
  exitDate: '',
  lots: 2,
  daysHeld: 0,
  capitalUsed: null,
  notes: '',
  remarks: '',
  confidence: 3,
  executionQuality: 3,
  lessonsLearned: ''
})

// P&L calculation
const pnl = ref({
  amount: 0,
  percentage: 0
})

// Toast functionality
const showToast = (variant, title, message) => {
  toastVariant.value = variant
  toastTitle.value = title
  toastMessage.value = message
  showToastOverlay.value = true
  setTimeout(() => {
    showToastOverlay.value = false
  }, 5000)
}

// P&L calculations
const calculatePnL = () => {
  if (!editingTrade.value?.pnlAmount && trade.value.entryPrice && trade.value.lots && trade.value.capitalUsed) {
    const exitPrice = trade.value.exitPrice || trade.value.entryPrice
    const priceDiff = exitPrice - trade.value.entryPrice
    const multiplier = trade.value.type === 'SELL' ? -1 : 1

    pnl.value.amount = priceDiff * trade.value.lots * multiplier
    updateReturnFromPnL()
  } else if (!editingTrade.value?.pnlAmount) {
    pnl.value.amount = 0
    pnl.value.percentage = 0
  }
}

const updateReturnFromPnL = () => {
  if (trade.value.capitalUsed && pnl.value.amount) {
    pnl.value.percentage = (pnl.value.amount / trade.value.capitalUsed) * 100
  } else {
    pnl.value.percentage = 0
  }
}

const updatePnLFromAmount = (newPnL) => {
  pnl.value = newPnL
}

// File upload handler
const handleScreenshotUpload = (files) => {
  // Handle screenshot upload logic here
  logger.info('Screenshots uploaded:', files)
}

// Helper function to trim string fields
const trimTradeData = (data) => {
  const trimmedData = { ...data }

  // List of string fields that should be trimmed
  const stringFields = ['symbol', 'contract', 'notes', 'remarks', 'lessonsLearned']

  stringFields.forEach(field => {
    if (typeof trimmedData[field] === 'string') {
      trimmedData[field] = trimmedData[field].trim()
    }
  })

  return trimmedData
}

// Form submission
const handleSubmit = async() => {
  isSubmitting.value = true
  try {
    const tradeData = trimTradeData({
      ...trade.value,
      pnlAmount: pnl.value.amount,
      pnlPercentage: pnl.value.percentage,
      status: trade.value.exitDate ? 'CLOSED' : 'OPEN'
    })

    if (trade.value.id) {
      await tradeService.updateTrade(trade.value.id, tradeData)
      showToast('success', 'Trade Updated', `Successfully updated trade for ${trade.value.symbol}`)
    } else {
      await tradeService.addTrade(tradeData)
      showToast('success', 'Trade Added', `Successfully added new trade for ${trade.value.symbol}`)
    }

    refreshDashboard()

    if (editingTrade) {
      editingTrade.value = null
    }

    setTimeout(() => {
      activeTab.value = 'history'
      resetForm()
    }, 1000)

  } catch (error) {
    logger.error('Error saving trade:', error instanceof Error ? error.message : String(error))
    showToast('danger', 'Error', 'Failed to save trade. Please try again.')
  } finally {
    isSubmitting.value = false
  }
}

// Form cancellation
const handleCancel = () => {
  if (editingTrade) {
    editingTrade.value = null
  }
  resetForm()
  activeTab.value = 'history'
}

// Form reset
const resetForm = () => {
  const today = new Date().toISOString().slice(0, 10)

  trade.value = {
    tradeId: uuidv4(),
    symbol: '',
    contract: '',
    type: '',
    entryPrice: null,
    exitPrice: null,
    entryDate: today, // Set today as default entry date
    exitDate: '',
    lots: 2,
    daysHeld: 0,
    capitalUsed: null,
    notes: '',
    remarks: '',
    confidence: 3,
    executionQuality: 3,
    lessonsLearned: ''
  }

  pnl.value = {
    amount: 0,
    percentage: 0
  }
}

// Watchers
watch(editingTrade, (newTrade) => {
  if (newTrade) {
    trade.value = { ...newTrade }
  }
})

watch(activeTab, (newTab) => {
  if (newTab === 'trade' && !editingTrade.value) {
    resetForm()
  }
})

// Component lifecycle
onMounted(() => {
  if (editingTrade.value) {
    trade.value = { ...editingTrade.value }
    pnl.value.amount = editingTrade.value.pnlAmount || 0
    pnl.value.percentage = editingTrade.value.pnlPercentage || 0
    calculatePnL()
  } else {
    // For new trades, ensure we have today's date
    resetForm()
  }
})
</script>

<style scoped>
.trade-form {
  max-width: 800px;
  margin: 0 auto;
  padding: 1rem;
}

h2 {
  margin-bottom: 1.5rem;
  font-size: 1.5rem;
  font-weight: 600;
  color: var(--text-color);
}

.toast {
  margin-bottom: 1rem;
  padding: 1rem;
  border-radius: 0.375rem;
  border: 1px solid transparent;
}

.toast.success {
  background-color: #dcfce7;
  border-color: #bbf7d0;
  color: #166534;
}

.toast.danger {
  background-color: #fef2f2;
  border-color: #fecaca;
  color: #991b1b;
}

.toast-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.close-button {
  background: none;
  border: none;
  font-size: 1.25rem;
  cursor: pointer;
  color: inherit;
  opacity: 0.7;
}

.close-button:hover {
  opacity: 1;
}

.toast-body {
  font-size: 0.875rem;
}

/* Loading overlay styles */
.form-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: inherit;
}

.form-submitting {
  position: relative;
  pointer-events: none;
}

.form-submitting .form-loading-overlay {
  pointer-events: all;
}

@media (min-width: 768px) {
  .trade-form {
    padding: 2rem;
  }
}

/* Dark mode support for loading overlay */
@media (prefers-color-scheme: dark) {
  .form-loading-overlay {
    background-color: rgba(17, 24, 39, 0.9);
  }
}
</style>
