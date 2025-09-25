<template>
  <div class="trade-dates">
    <div class="form-row">
      <div class="form-group">
        <label for="entryDate">Entry Date</label>
        <input 
          id="entryDate" 
          v-model="entryDateValue" 
          type="date"
          required 
        />
      </div>
      <div class="form-group">
        <label for="exitDate">Exit Date (Optional)</label>
        <input 
          id="exitDate" 
          v-model="exitDateValue" 
          type="date"
          :max="maxDate" 
        />
      </div>
    </div>
    
    <div class="form-row">
      <div class="form-group">
        <label for="daysHeld">Days Held</label>
        <input 
          id="daysHeld" 
          type="number" 
          :value="modelValue.daysHeld" 
          disabled 
          class="calculated-field"
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
  }
})

const emit = defineEmits(['update:modelValue'])

const maxDate = computed(() => {
  return new Date().toISOString().slice(0, 10)
})

const calculateHoldingDays = (entryDate, exitDate) => {
  if (entryDate) {
    const entry = new Date(entryDate)
    const exit = exitDate ? new Date(exitDate) : new Date()
    const diffTime = Math.abs(exit - entry)
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
  }
  return 0
}

const updateTrade = (updates) => {
  emit('update:modelValue', {
    ...props.modelValue,
    ...updates
  })
}

// Computed properties with getter/setter for v-model
const entryDateValue = computed({
  get() {
    return props.modelValue.entryDate
  },
  set(value) {
    const newDaysHeld = calculateHoldingDays(value, props.modelValue.exitDate)
    updateTrade({
      entryDate: value,
      daysHeld: newDaysHeld
    })
  }
})

const exitDateValue = computed({
  get() {
    return props.modelValue.exitDate
  },
  set(value) {
    const newDaysHeld = calculateHoldingDays(props.modelValue.entryDate, value)
    updateTrade({
      exitDate: value,
      daysHeld: newDaysHeld
    })
  }
})
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

.calculated-field {
  background-color: #f9fafb;
  color: #6b7280;
  cursor: not-allowed;
}
</style>