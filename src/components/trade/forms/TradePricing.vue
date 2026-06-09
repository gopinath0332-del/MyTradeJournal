<template>
  <div class="trade-pricing">
    <div class="form-row">
      <div class="form-group">
        <label for="entryPrice">Entry Price</label>
        <div class="input-with-prefix">
          <span class="currency-prefix">{{ currencySymbol }}</span>
          <input
            id="entryPrice"
            type="text"
            :value="modelValue.entryPrice"
            required
            step="0.00001"
            inputmode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            @input="handlePriceChange('entryPrice', $event)"
          >
        </div>
      </div>
      <div class="form-group">
        <label for="exitPrice">Exit Price</label>
        <div class="input-with-prefix">
          <span class="currency-prefix">{{ currencySymbol }}</span>
          <input
            id="exitPrice"
            type="text"
            :value="modelValue.exitPrice"
            step="0.00001"
            inputmode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            @input="handlePriceChange('exitPrice', $event)"
          >
        </div>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="lots">Size</label>
        <input
          id="lots"
          type="text"
          :value="modelValue.lots"
          required
          min="1"
          step="1"
          inputmode="numeric"
          pattern="[0-9]*"
          @input="handleNumberChange('lots', $event)"
        >
      </div>
      <div class="form-group">
        <label for="lotMultiplier">Lot Multiplier</label>
        <input
          id="lotMultiplier"
          type="text"
          :value="modelValue.lotMultiplier"
          required
          min="1"
          step="1"
          inputmode="numeric"
          pattern="[0-9]*"
          @input="handleNumberChange('lotMultiplier', $event)"
        >
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="capitalUsed">Capital Used</label>
        <div class="input-with-prefix">
          <span class="currency-prefix">{{ currencySymbol }}</span>
          <input
            id="capitalUsed"
            type="text"
            :value="modelValue.capitalUsed"
            required
            step="0.00001"
            min="0"
            inputmode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            @input="handlePriceChange('capitalUsed', $event)"
          >
        </div>
      </div>
    </div>

    <!-- MTF-Specific Fields -->
    <div v-if="modelValue.fundingType === 'MTF'" class="mtf-section">
      <h3>MTF Leverage Details</h3>
      
      <!-- Security Info if found -->
      <div v-if="mtfSecurityInfo" class="security-info">
        <div class="info-item">
          <span class="info-label">Security Found:</span>
          <span class="info-value">{{ mtfSecurityInfo.symbol }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Category:</span>
          <span class="info-value">{{ mtfSecurityInfo.category }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">Max Leverage (Zerodha):</span>
          <span class="info-value highlight">{{ mtfSecurityInfo.leverage.toFixed(2) }}x</span>
        </div>
      </div>
      <div v-else-if="modelValue.symbol && modelValue.fundingType === 'MTF'" class="security-warning">
        ⚠️ Symbol not found in MTF list. <a href="https://zerodha.com/mtf-approved-securities/" target="_blank">Check Zerodha MTF securities</a>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="mtfLeverage">Leverage to Use</label>
          <select
            id="mtfLeverage"
            :value="modelValue.mtfLeverage || ''"
            @change="updateField('mtfLeverage', $event.target.value ? parseFloat($event.target.value) : undefined)"
            :class="{ 'auto-populated': modelValue.mtfLeverage && mtfSecurityInfo }"
          >
            <option value="">Select leverage</option>
            <option value="2">2x (50% own, 50% borrowed)</option>
            <option value="3">3x (33% own, 67% borrowed)</option>
            <option value="4">4x (25% own, 75% borrowed)</option>
            <option value="5">5x (20% own, 80% borrowed)</option>
          </select>
          <small class="help-text">
            {{ modelValue.mtfLeverage && mtfSecurityInfo ? '✓ Auto-populated from Zerodha data • ' : '' }}
            Recommended: {{ mtfSecurityInfo ? `Up to ${mtfSecurityInfo.leverage.toFixed(2)}x allowed` : 'Select stock first' }}
          </small>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="investedAmount">Your Investment</label>
          <div class="input-with-prefix">
            <span class="currency-prefix">{{ currencySymbol }}</span>
            <input
              id="investedAmount"
              type="text"
              :value="modelValue.investedAmount"
              step="0.00001"
              min="0"
              inputmode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              @input="handleMTFInvestedChange"
            >
          </div>
          <small class="help-text">Your own capital invested</small>
        </div>

        <div class="form-group">
          <label for="borrowedAmount">Borrowed from Zerodha</label>
          <div class="input-with-prefix">
            <span class="currency-prefix">{{ currencySymbol }}</span>
            <input
              id="borrowedAmount"
              type="text"
              :value="calculatedBorrowedAmount"
              readonly
              disabled
            >
          </div>
          <small class="help-text">Auto-calculated: Capital Used - Your Investment</small>
        </div>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="interestPaid">Interest Paid</label>
          <div class="input-with-prefix">
            <span class="currency-prefix">{{ currencySymbol }}</span>
            <input
              id="interestPaid"
              type="text"
              :value="modelValue.interestPaid || ''"
              step="0.01"
              min="0"
              inputmode="decimal"
              pattern="[0-9]*\.?[0-9]*"
              @input="handlePriceChange('interestPaid', $event)"
            >
          </div>
          <small class="help-text">Total interest/funding charges paid on borrowed amount</small>
        </div>
      </div>

      <div class="mtf-summary">
        <div class="summary-item">
          <span class="label">Total Capital Used:</span>
          <span class="value">{{ currencySymbol }}{{ (modelValue.capitalUsed || 0).toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Your Investment:</span>
          <span class="value highlight-blue">{{ currencySymbol }}{{ (modelValue.investedAmount || 0).toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Borrowed Amount:</span>
          <span class="value highlight-orange">{{ currencySymbol }}{{ calculatedBorrowedAmount.toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</span>
        </div>
        <div class="summary-item">
          <span class="label">Interest Paid:</span>
          <span class="value highlight-red">{{ currencySymbol }}{{ (modelValue.interestPaid || 0).toLocaleString('en-IN', {maximumFractionDigits: 2}) }}</span>
        </div>
      </div>
    </div>

    <!-- Partial Exits Section -->
    <div
      v-if="!modelValue.exitDate || (modelValue.partialExits && modelValue.partialExits.length > 0)"
      class="partial-exits-section"
    >
      <h3>Partial Exits</h3>

      <div v-if="!modelValue.exitDate" class="partial-exit-form">
        <div class="form-row compact">
          <div class="form-group">
            <label for="pe-date">Date</label>
            <input id="pe-date" v-model="newPartialExit.date" type="date">
          </div>
          <div class="form-group">
            <label for="pe-price">Price</label>
            <div class="input-with-prefix">
              <span class="currency-prefix">{{ currencySymbol }}</span>
              <input
                id="pe-price"
                :value="newPartialExit.price"
                type="text"
                step="0.00001"
                @input="handlePartialExitChange('price', $event)"
              >
            </div>
          </div>
          <div class="form-group">
            <label for="pe-lots">Lots</label>
            <input
              id="pe-lots"
              :value="newPartialExit.lots"
              type="text"
              step="1"
              @input="handlePartialExitChange('lots', $event)"
            >
          </div>
          <div class="form-group button-group">
            <button
              type="button"
              class="btn-add"
              :disabled="!isValidPartialExit"
              @click="addPartialExit"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="modelValue.partialExits && modelValue.partialExits.length > 0"
        class="partial-exits-list"
      >
        <div
          v-for="(exit, index) in modelValue.partialExits"
          :key="index"
          class="partial-exit-item"
        >
          <span>{{ formatDate(exit.date) }}</span>
          <span>@ {{ currencySymbol }}{{ exit.price }}</span>
          <span>{{ exit.lots }} Lots</span>
          <button
            type="button"
            class="btn-remove"
            @click="removePartialExit(index)"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { useProfiles } from '@/composables/useProfiles'
import { loadMTFData, getLeverageBySymbol, getMTFSecurity } from '@/utils/mtfLeverageData'

const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'calculate-pnl'])

const { currencySymbol } = useProfiles()

// Load MTF data on component mount
onMounted(async () => {
  await loadMTFData()
})

// Partial Exit State
const newPartialExit = ref({
  date: '',
  price: null,
  lots: null
})

// Store the last symbol to detect changes
const lastProcessedSymbol = ref<string>('')

// Watch for symbol changes and auto-populate leverage
watch(
  () => props.modelValue.symbol,
  async (newSymbol) => {
    if (!newSymbol || newSymbol === lastProcessedSymbol.value) return
    
    lastProcessedSymbol.value = newSymbol
    
    // Only auto-populate if this is MTF and leverage is not already set
    if (props.modelValue.fundingType === 'MTF' && !props.modelValue.mtfLeverage) {
      const leverage = getLeverageBySymbol(newSymbol)
      if (leverage) {
        // Round leverage to nearest standard value (2x, 3x, 4x, 5x)
        const roundedLeverage = Math.round(leverage)
        updateField('mtfLeverage', Math.max(2, Math.min(5, roundedLeverage)))
      }
    }
  }
)

// Watch for fundingType changes
watch(
  () => props.modelValue.fundingType,
  (newFundingType) => {
    // If switching to MTF and symbol is set, try to auto-populate leverage
    if (newFundingType === 'MTF' && props.modelValue.symbol && !props.modelValue.mtfLeverage) {
      const leverage = getLeverageBySymbol(props.modelValue.symbol)
      if (leverage) {
        const roundedLeverage = Math.round(leverage)
        updateField('mtfLeverage', Math.max(2, Math.min(5, roundedLeverage)))
      }
    }
  }
)

// Get MTF security details
const mtfSecurityInfo = computed(() => {
  if (props.modelValue.fundingType !== 'MTF' || !props.modelValue.symbol) return null
  return getMTFSecurity(props.modelValue.symbol)
})

const isValidPartialExit = computed(() => {
  return (
    newPartialExit.value.date &&
    newPartialExit.value.price > 0 &&
    newPartialExit.value.lots > 0
  )
})

// MTF Calculations
const calculatedBorrowedAmount = computed(() => {
  const capitalUsed = parseFloat(props.modelValue.capitalUsed) || 0
  const investedAmount = parseFloat(props.modelValue.investedAmount) || 0
  return Math.max(0, capitalUsed - investedAmount)
})

const addPartialExit = () => {
  if (!isValidPartialExit.value) return

  const currentPartialExits = props.modelValue.partialExits || []
  const updatedPartialExits = [
    ...currentPartialExits,
    { ...newPartialExit.value }
  ]

  updateField('partialExits', updatedPartialExits)

  // Reset form
  newPartialExit.value = {
    date: '',
    price: null,
    lots: null
  }

  emit('calculate-pnl')
}

const removePartialExit = (index) => {
  const currentPartialExits = props.modelValue.partialExits || []
  const updatedPartialExits = currentPartialExits.filter((_, i) => i !== index)

  updateField('partialExits', updatedPartialExits)
  emit('calculate-pnl')
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString()
}

const handlePartialExitChange = (field, event) => {
  const rawValue = event.target.value
  newPartialExit.value[field] = rawValue
}

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const handlePriceChange = (field, event) => {
  updateField(field, event.target.value)
  emit('calculate-pnl')
}

const handleNumberChange = (field, event) => {
  updateField(field, event.target.value)
  emit('calculate-pnl')
}

const handleMTFInvestedChange = (event) => {
  const investedAmount = parseFloat(event.target.value) || 0
  updateField('investedAmount', investedAmount > 0 ? investedAmount : undefined)
}
</script>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-row.compact {
  grid-template-columns: 2fr 2fr 1fr auto;
  align-items: end;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .form-row.compact {
    grid-template-columns: 1fr 1fr;
  }

  .form-row.compact .button-group {
    grid-column: span 2;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

input {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  width: 100%;
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-prefix {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  z-index: 1;
}

.input-with-prefix input {
  padding-left: 2.5rem;
}

/* Partial Exits Styles */
.partial-exits-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--border-color);
}

.partial-exits-section h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.btn-add {
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  height: 42px; /* Match input height */
}

.btn-add:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.partial-exits-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.partial-exit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--bg-secondary, #f3f4f6);
  border-radius: 0.375rem;
  font-size: 0.9rem;
}

.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.5rem;
}

.btn-remove:hover {
  color: #dc2626;
}

/* MTF Specific Styles */
.mtf-section {
  margin-top: 1.5rem;
  padding: 1rem;
  background: linear-gradient(135deg, #fff7ed 0%, #fef3c7 100%);
  border: 2px solid #f59e0b;
  border-radius: 0.5rem;
}

.mtf-section h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: #92400e;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.mtf-section h3::before {
  content: "💰";
  font-size: 1.3rem;
}

.help-text {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
  display: block;
}

.help-text a {
  color: #3b82f6;
  text-decoration: none;
  font-weight: 600;
}

.help-text a:hover {
  text-decoration: underline;
}

.mtf-section select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  width: 100%;
}

.mtf-section select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.mtf-section select.auto-populated {
  background-color: #ecfdf5;
  border-color: #a7f3d0;
  color: #047857;
}

.mtf-summary {
  margin-top: 1rem;
  padding: 1rem;
  background: white;
  border-radius: 0.375rem;
  border: 1px solid #e5e7eb;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  display: flex;
  flex-direction: column;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 0.375rem;
  border-left: 3px solid #e5e7eb;
}

.summary-item .label {
  font-size: 0.75rem;
  color: #6b7280;
  font-weight: 600;
  margin-bottom: 0.25rem;
  text-transform: uppercase;
}

.summary-item .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.summary-item .value.highlight-blue {
  color: #2563eb;
  border-left-color: #3b82f6;
}

.summary-item .value.highlight-orange {
  color: #d97706;
  border-left-color: #f59e0b;
}

.summary-item .value.highlight-red {
  color: #dc2626;
  border-left-color: #ef4444;
}

input[readonly],
input[disabled] {
  background-color: #f3f4f6;
  color: #6b7280;
  cursor: not-allowed;
  opacity: 1;
}

/* Security Info Styles */
.security-info {
  background: #ecfdf5;
  border: 1px solid #a7f3d0;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0.75rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  color: #047857;
  font-weight: 600;
  text-transform: uppercase;
}

.info-value {
  font-size: 0.9rem;
  color: #065f46;
  font-weight: 600;
}

.info-value.highlight {
  color: #059669;
  background: #d1fae5;
  padding: 0.25rem 0.5rem;
  border-radius: 0.25rem;
}

.security-warning {
  background: #fef3c7;
  border: 1px solid #fcd34d;
  border-radius: 0.375rem;
  padding: 0.75rem;
  margin-bottom: 1rem;
  color: #78350f;
  font-size: 0.9rem;
  font-weight: 500;
}

.security-warning a {
  color: #2563eb;
  text-decoration: underline;
  font-weight: 600;
}

.security-warning a:hover {
  color: #1d4ed8;
}
</style>
