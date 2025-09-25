<template>
  <div class="trade-basic-info">
    <div class="form-grid">
      <div class="form-field">
        <label for="symbol">Symbol</label>
        <input
          id="symbol"
          type="text"
          :value="modelValue.symbol"
          required
          placeholder="e.g., NIFTY"
          @input="handleSymbolInput"
        >
      </div>
      <div class="form-field">
        <label for="contract">Contract (Optional)</label>
        <input
          id="contract"
          type="text"
          :value="modelValue.contract"
          placeholder="e.g., 20OCT23"
          @input="handleContractInput"
        >
      </div>
      <div class="form-group">
        <label for="tradeType">Type</label>
        <select
          id="tradeType"
          :value="modelValue.type"
          required
          :class="{
            'type-buy': modelValue.type === 'BUY',
            'type-sell': modelValue.type === 'SELL'
          }"
          @change="updateField('type', $event.target.value)"
        >
          <option value="">Select type</option>
          <option value="BUY">Buy</option>
          <option value="SELL">Sell</option>
        </select>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue'])

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const handleSymbolInput = (event) => {
  updateField('symbol', event.target.value.toUpperCase())
}

const handleContractInput = (event) => {
  updateField('contract', event.target.value.toUpperCase())
}
</script>

<style scoped>
.form-grid {
  display: grid;
  grid-template-columns: 2fr 2fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .form-grid {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

.form-field, .form-group {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

input, select {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
}

input:focus, select:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.type-buy {
  background-color: rgba(34, 197, 94, 0.1);
  border-color: #22c55e;
}

.type-sell {
  background-color: rgba(239, 68, 68, 0.1);
  border-color: #ef4444;
}
</style>
