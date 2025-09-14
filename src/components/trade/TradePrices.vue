<template>
  <div class="trade-prices">
    <div class="form-row">
      <div class="form-group">
        <label for="entryPrice">Entry Price</label>
        <input 
          type="number" 
          id="entryPrice" 
          :value="modelValue.entryPrice"
          @input="updateField('entryPrice', parseFloat($event.target.value) || '')"
          step="0.01"
          min="0"
          required
          :class="{ 'error': errors.entryPrice }"
        />
        <div v-if="errors.entryPrice" class="error-message">{{ errors.entryPrice }}</div>
      </div>
      
      <div class="form-group">
        <label for="exitPrice">Exit Price (Optional)</label>
        <input 
          type="number" 
          id="exitPrice" 
          :value="modelValue.exitPrice"
          @input="updateField('exitPrice', parseFloat($event.target.value) || '')"
          step="0.01"
          min="0"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="quantity">Quantity</label>
        <input 
          type="number" 
          id="quantity" 
          :value="modelValue.quantity"
          @input="updateField('quantity', parseInt($event.target.value) || '')"
          min="1"
          required
          :class="{ 'error': errors.quantity }"
        />
        <div v-if="errors.quantity" class="error-message">{{ errors.quantity }}</div>
      </div>
      
      <div class="form-group">
        <label for="fees">Total Fees ($)</label>
        <input 
          type="number" 
          id="fees" 
          :value="modelValue.fees"
          @input="updateField('fees', parseFloat($event.target.value) || 0)"
          step="0.01"
          min="0"
        />
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="positionSize">Position Size ($)</label>
        <input 
          type="number" 
          id="positionSize" 
          :value="positionSize"
          readonly
          class="calculated-field"
        />
      </div>
      
      <div class="form-group">
        <label for="pnl">P&L ($)</label>
        <input 
          type="number" 
          id="pnl" 
          :value="pnl"
          readonly
          class="calculated-field"
          :class="{ 'profit': pnl > 0, 'loss': pnl < 0 }"
        />
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

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

const positionSize = computed(() => {
  const { entryPrice, quantity } = props.modelValue
  if (!entryPrice || !quantity) return ''
  return (entryPrice * quantity).toFixed(2)
})

const pnl = computed(() => {
  const { entryPrice, exitPrice, quantity, fees } = props.modelValue
  if (!entryPrice || !exitPrice || !quantity) return ''
  
  const grossPnL = (exitPrice - entryPrice) * quantity
  return (grossPnL - (fees || 0)).toFixed(2)
})

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}
</script>

<style scoped>
.form-row {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .form-row {
    flex-direction: row;
    gap: 20px;
    margin-bottom: 20px;
  }
}

.form-group {
  flex: 1;
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="number"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
  min-height: 44px;
}

input[type="number"].error {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

@media (min-width: 768px) {
  input[type="number"] {
    padding: 8px;
  }
}

.calculated-field {
  background-color: #f5f5f5;
  color: #666;
  cursor: not-allowed;
}

.profit {
  color: #28a745;
  font-weight: bold;
}

.loss {
  color: #dc3545;
  font-weight: bold;
}
</style>