<template>
  <div class="trade-pricing">
    <div class="form-row">
      <div class="form-group">
        <label for="entryPrice">Entry Price</label>
        <div class="input-with-prefix">
          <span class="currency-prefix">₹</span>
          <input
            id="entryPrice"
            type="number"
            :value="modelValue.entryPrice"
            required
            step="0.01"
            inputmode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            @input="handlePriceChange('entryPrice', $event)"
          >
        </div>
      </div>
      <div class="form-group">
        <label for="exitPrice">Exit Price</label>
        <div class="input-with-prefix">
          <span class="currency-prefix">₹</span>
          <input
            id="exitPrice"
            type="number"
            :value="modelValue.exitPrice"
            step="0.01"
            inputmode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            @input="handlePriceChange('exitPrice', $event)"
          >
        </div>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="lots">Lots</label>
        <input
          id="lots"
          type="number"
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
        <label for="capitalUsed">Capital Used</label>
        <div class="input-with-prefix">
          <span class="currency-prefix">₹</span>
          <input
            id="capitalUsed"
            type="number"
            :value="modelValue.capitalUsed"
            required
            step="0.01"
            min="0"
            inputmode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            @input="handlePriceChange('capitalUsed', $event)"
          >
        </div>
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

const emit = defineEmits(['update:modelValue', 'calculate-pnl'])

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const handlePriceChange = (field, event) => {
  const value = parseFloat(event.target.value) || null
  updateField(field, value)
  emit('calculate-pnl')
}

const handleNumberChange = (field, event) => {
  const value = parseInt(event.target.value) || null
  updateField(field, value)
  emit('calculate-pnl')
}
</script>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
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
</style>
