<!-- TradeForm.vue - Modular component with sub-components -->
<template>
  <div class="trade-form" :class="{ 'form-submitting': isSubmitting }">
    <h2>{{ trade.id ? "Edit Trade" : "Log New Trade" }}</h2>

    <!-- Loading overlay for form submission -->
    <div v-if="isSubmitting" class="form-loading-overlay">
      <LoadingSpinner message="Saving trade..." size="medium" />
    </div>

    <!-- Toast notification -->
    <div v-if="showToastOverlay" class="toast" :class="toastVariant">
      <div class="toast-header">
        <strong>{{ toastTitle }}</strong>
        <button
          type="button"
          class="close-button"
          @click="showToastOverlay = false"
        >
          &times;
        </button>
      </div>
      <div class="toast-body">
        {{ toastMessage }}
      </div>
    </div>

    <form @submit.prevent="handleSubmit">
      <!-- Basic Trade Information -->
      <TradeBasicInfo v-model="trade" />

      <!-- Date Information -->
      <TradeDates v-model="trade" />

      <!-- Pricing Information -->
      <TradePricing v-model="trade" @calculate-pnl="calculatePnL" />

      <!-- Trade Summary -->
      <TradeSummary
        :pnl="pnl"
        :capital-used="trade.capitalUsed"
        :funding-charge="trade.fundingCharge"
        :trading-charge="trade.tradingCharge"
        @update-pnl="updatePnLFromAmount"
        @update-charges="updateCharges"
      />

      <!-- Failure Mode Analysis (show only for losing trades with exit date) -->
      <FailureModeSelector
        v-if="trade.exitDate && pnl.amount < 0"
        v-model="trade.failureModes"
        :initial-notes="trade.failureNotes"
        :initial-confidence="trade.failureConfidence"
        @update:notes="trade.failureNotes = $event"
        @update:confidence="trade.failureConfidence = $event"
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
import { useRouter, useRoute } from 'vue-router'
import { tradeService } from '../../firebase/tradeService'
import { logger } from '../../utils/logger'
import { useProfiles } from '@/composables/useProfiles'

// Import sub-components
import TradeBasicInfo from './forms/TradeBasicInfo.vue'
import TradeDates from './forms/TradeDates.vue'
import TradePricing from './forms/TradePricing.vue'
import TradeSummary from './forms/TradeSummary.vue'
import TradeMetadata from './forms/TradeMetadata.vue'
import TradeActions from './forms/TradeActions.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import FailureModeSelector from './FailureModeSelector.vue'

// Router setup
const router = useRouter()
const route = useRoute()

// Loading state
const isSubmitting = ref(false)

// Injected dependencies
const editingTrade = inject('editingTrade')
const refreshDashboard = inject('refreshDashboard')

// Profile-based trade counter
const { activeProfile, updateProfile } = useProfiles()

// Decrement trade counter for profiles that have it enabled.
// Only decrements if the counter has been explicitly set (e.g. via Reset button).
// If tradeCounter is undefined/null (never initialized), decrement is skipped.
const decrementTradeCounter = async() => {
  const profile = activeProfile.value
  // Check explicit flag only — no legacy name fallback
  const isCounterEnabled = profile?.settings?.showTradeCounter === true
  if (!profile?.id || !isCounterEnabled) return

  const max = profile.settings?.tradeCounterMax || 100
  // If tradeCounter was never explicitly set, treat it as maxTrades (matches what the UI displays)
  const current = profile.settings?.tradeCounter ?? max
  const newCount = Math.max(0, current - 1)

  try {
    await updateProfile(profile.id, {
      settings: {
        ...profile.settings,
        tradeCounter: newCount,
        tradeCounterMax: max
      }
    })
  } catch (err) {
    logger.error('Error decrementing trade counter', err)
  }
}

// Toast state
const toastVariant = ref('success')
const toastTitle = ref('')
const toastMessage = ref('')
const showToastOverlay = ref(false)

// P&L calculation state
const isPnlManuallyEdited = ref(false)
const lastCalculatedPnl = ref(0)

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
  lotMultiplier: 1,
  daysHeld: 0,
  capitalUsed: null,
  fundingCharge: null,
  tradingCharge: null,
  strategy: '',
  notes: '',
  remarks: '',
  confidence: 3,
  failureConfidence: 3
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
  if (isPnlManuallyEdited.value) {
    updateReturnFromPnL()
    return
  }

  if (trade.value.entryPrice && trade.value.lots && trade.value.capitalUsed) {
    const entryPrice = parseFloat(trade.value.entryPrice.toString())
    const capitalUsed = parseFloat(trade.value.capitalUsed.toString())
    const lots = parseFloat(trade.value.lots.toString())
    const lotMultiplier = parseFloat((trade.value.lotMultiplier || 1).toString())

    if (!isNaN(entryPrice) && !isNaN(lots) && !isNaN(capitalUsed)) {
      let totalPnL = 0
      let remainingLots = lots
      const multiplier = trade.value.type === 'SELL' ? -1 : 1

      // Calculate P&L from partial exits
      if (trade.value.partialExits && trade.value.partialExits.length > 0) {
        trade.value.partialExits.forEach((exit) => {
          const exitPrice = parseFloat((exit.price || '').toString())
          const exitLots = parseFloat((exit.lots || '').toString())

          if (!isNaN(exitPrice) && !isNaN(exitLots)) {
            const partialPnL = (exitPrice - entryPrice) * exitLots * multiplier * lotMultiplier
            totalPnL += partialPnL
            remainingLots -= exitLots
          }
        })
      }

      // Calculate P&L for remaining lots
      if (remainingLots > 0) {
        const exitPriceString = trade.value.exitPrice ? trade.value.exitPrice.toString() : ''
        const exitPrice = exitPriceString ? parseFloat(exitPriceString) : entryPrice
        const remainingPnL = (exitPrice - entryPrice) * remainingLots * multiplier * lotMultiplier
        totalPnL += remainingPnL
      }

      const fundingCharge = parseFloat((trade.value.fundingCharge || 0).toString())
      const tradingCharge = parseFloat((trade.value.tradingCharge || 0).toString())

      pnl.value.amount = totalPnL + fundingCharge - tradingCharge
      lastCalculatedPnl.value = pnl.value.amount
      updateReturnFromPnL()
    }
  } else if (!editingTrade.value?.pnlAmount) {
    pnl.value.amount = 0
    pnl.value.percentage = 0
    lastCalculatedPnl.value = 0
  }
}

const updateReturnFromPnL = () => {
  const pnlAmount = parseFloat((pnl.value.amount || 0).toString())
  const capitalUsed = parseFloat((trade.value.capitalUsed || 0).toString())

  if (capitalUsed && !isNaN(pnlAmount)) {
    pnl.value.percentage = (pnlAmount / capitalUsed) * 100
  } else {
    pnl.value.percentage = 0
  }
}

const updatePnLFromAmount = (newPnL) => {
  pnl.value = newPnL
  // If the user manually changed the amount, mark it so it's not overwritten
  if (Math.abs(newPnL.amount - lastCalculatedPnl.value) > 0.00001) {
    isPnlManuallyEdited.value = true
  }
}

const updateCharges = ({ field, value }) => {
  trade.value[field] = value
  calculatePnL()
}

// File upload handler
const handleScreenshotUpload = (files) => {
  // Handle screenshot upload logic here
  logger.info('Screenshots uploaded:', files)
}

// Helper to ensure numeric fields are actually numbers before saving
const cleanNumericFields = (data) => {
  const cleanedData = { ...data }
  const numericFields = [
    'entryPrice',
    'exitPrice',
    'lots',
    'lotMultiplier',
    'capitalUsed',
    'fundingCharge',
    'tradingCharge',
    'pnlAmount',
    'pnlPercentage'
  ]

  numericFields.forEach((field) => {
    if (cleanedData[field] !== undefined && cleanedData[field] !== null && cleanedData[field] !== '') {
      cleanedData[field] = parseFloat(cleanedData[field].toString())
    } else if (cleanedData[field] === '') {
      cleanedData[field] = null
    }
  })

  // Clean partial exits
  if (cleanedData.partialExits && Array.isArray(cleanedData.partialExits)) {
    cleanedData.partialExits = cleanedData.partialExits.map((exit) => ({
      ...exit,
      price: exit.price !== '' ? parseFloat((exit.price || 0).toString()) : null,
      lots: exit.lots !== '' ? parseFloat((exit.lots || 0).toString()) : null
    }))
  }

  return cleanedData
}

// Helper function to trim string fields
const trimTradeData = (data) => {
  const trimmedData = { ...data }

  // List of string fields that should be trimmed
  const stringFields = [
    'symbol',
    'contract',
    'notes',
    'remarks',
    'lessonsLearned'
  ]

  stringFields.forEach((field) => {
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
    const tradeData = cleanNumericFields(trimTradeData({
      ...trade.value,
      pnlAmount: pnl.value.amount,
      pnlPercentage: pnl.value.percentage,
      status: trade.value.exitDate ? 'CLOSED' : 'OPEN'
    }))

    if (trade.value.id) {
      await tradeService.updateTrade(trade.value.id, tradeData)
      showToast(
        'success',
        'Trade Updated',
        `Successfully updated trade for ${trade.value.symbol}`
      )
    } else {
      await tradeService.addTrade(tradeData)
      await decrementTradeCounter()
      showToast(
        'success',
        'Trade Added',
        `Successfully added new trade for ${trade.value.symbol}`
      )
    }

    refreshDashboard()

    if (editingTrade) {
      editingTrade.value = null
    }

    setTimeout(() => {
      router.push({ name: 'TradeHistory' })
      resetForm()
    }, 1000)
  } catch (error) {
    logger.error(
      'Error saving trade:',
      error instanceof Error ? error.message : String(error)
    )
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
  router.push({ name: 'TradeHistory' })
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
    lotMultiplier: 1,
    daysHeld: 0,
    capitalUsed: null,
    fundingCharge: null,
    tradingCharge: null,
    strategy: 'Donchian', // Default to first option since it's required
    notes: '',
    remarks: '',
    confidence: 3,
    executionQuality: 3,
    lessonsLearned: '',
    partialExits: [], // Array of { date, price, lots }
    failureModes: [],
    failureNotes: '',
    failureConfidence: 3
  }

  pnl.value = {
    amount: 0,
    percentage: 0
  }
  isPnlManuallyEdited.value = false
  lastCalculatedPnl.value = 0
}

watch(editingTrade, (newTrade) => {
  if (newTrade) {
    trade.value = { ...newTrade }
    isPnlManuallyEdited.value = false
  }
})

watch(
  () => route.name,
  (newRouteName) => {
    if (newRouteName === 'LogTrade' && !editingTrade.value) {
      resetForm()
    }
  }
)

// Component lifecycle
onMounted(async() => {
  // Check if we're editing a trade via route parameter
  if (route.name === 'EditTrade' && route.params.id) {
    try {
      // Load trade by ID from route parameter
      const tradeId = route.params.id
      const tradeData = await tradeService.getTradeById(tradeId)
      if (tradeData) {
        trade.value = { ...tradeData }
        pnl.value.amount = tradeData.pnlAmount || 0
        pnl.value.percentage = tradeData.pnlPercentage || 0
        calculatePnL()
      }
    } catch (error) {
      logger.error(
        'Error loading trade for editing:',
        error instanceof Error ? error.message : String(error)
      )
      showToast('danger', 'Error', 'Failed to load trade for editing.')
    }
  } else if (editingTrade.value) {
    // Handle editing via injection (legacy)
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
