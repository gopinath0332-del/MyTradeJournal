<template>
  <div class="trade-basic-info">
    <div class="form-grid">
      <div class="form-field">
        <label for="symbol">Symbol</label>
        <input 
          type="text" 
          id="symbol" 
          :value="modelValue.symbol"
          @input="updateField('symbol', $event.target.value.toUpperCase())"
          required
          placeholder="e.g., AAPL, TSLA, SPY" 
          :class="{ 'error': errors.symbol }"
        />
        <div v-if="errors.symbol" class="error-message">{{ errors.symbol }}</div>
      </div>
      
      <div class="form-field">
        <label for="contract">Contract (Optional)</label>
        <input 
          type="text" 
          id="contract" 
          :value="modelValue.contract"
          @input="updateField('contract', $event.target.value.toUpperCase())"
          placeholder="e.g., 230120C150" 
        />
      </div>
      
      <div class="form-group">
        <label for="tradeType">Type</label>
        <select 
          id="tradeType" 
          :value="modelValue.tradeType"
          @change="updateField('tradeType', $event.target.value)"
          required
          :class="{ 
            'error': errors.tradeType,
            'type-buy': modelValue.tradeType === 'Long',
            'type-sell': modelValue.tradeType === 'Short'
          }"
        >
          <option value="">Select type</option>
          <option value="Long">Long</option>
          <option value="Short">Short</option>
        </select>
        <div v-if="errors.tradeType" class="error-message">{{ errors.tradeType }}</div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  errors: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue'])

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
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
    margin-bottom: 20px;
  }
}

.form-field, .form-group {
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .form-field, .form-group {
    margin-bottom: 15px;
  }
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input, select {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
  min-height: 44px;
}

@media (min-width: 768px) {
  input, select {
    padding: 8px;
  }
}

input.error, select.error {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

.type-buy {
  background-color: rgba(40, 167, 69, 0.1);
  border-color: #28a745;
}

.type-sell {
  background-color: rgba(220, 53, 69, 0.1);
  border-color: #dc3545;
}
</style>