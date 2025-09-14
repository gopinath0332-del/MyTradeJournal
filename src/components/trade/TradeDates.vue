<template>
  <div class="trade-dates">
    <div class="form-row">
      <div class="form-group">
        <label for="entryDate">Entry Date</label>
        <input 
          type="datetime-local" 
          id="entryDate" 
          :value="modelValue.entryDate"
          @change="updateField('entryDate', $event.target.value)"
          required
          :class="{ 'error': errors.entryDate }"
        />
        <div v-if="errors.entryDate" class="error-message">{{ errors.entryDate }}</div>
      </div>
      
      <div class="form-group">
        <label for="exitDate">Exit Date (Optional)</label>
        <input 
          type="datetime-local" 
          id="exitDate" 
          :value="modelValue.exitDate"
          @change="updateField('exitDate', $event.target.value)"
          :max="maxExitDate"
          :class="{ 'error': errors.exitDate }"
        />
        <div v-if="errors.exitDate" class="error-message">{{ errors.exitDate }}</div>
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

const maxExitDate = computed(() => {
  return new Date().toISOString().slice(0, 16)
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
}

@media (min-width: 768px) {
  .form-row {
    flex-direction: row;
    gap: 20px;
  }
}

.form-group {
  flex: 1;
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .form-group {
    margin-bottom: 20px;
  }
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

input[type="datetime-local"] {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
  min-height: 44px;
}

input[type="datetime-local"].error {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

@media (min-width: 768px) {
  input[type="datetime-local"] {
    padding: 8px;
  }
}
</style>