<template>
  <div class="trade-actions">
    <div class="button-group">
      <button 
        type="button" 
        @click="onCancel"
        class="btn btn-secondary"
        :disabled="loading"
      >
        Cancel
      </button>
      
      <button 
        type="submit" 
        class="btn btn-primary"
        :disabled="loading || !isFormValid"
      >
        <span v-if="loading" class="loading-spinner"></span>
        {{ loading ? 'Saving...' : (isEditing ? 'Update Trade' : 'Save Trade') }}
      </button>
    </div>
    
    <div v-if="error" class="error-message">
      {{ error }}
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  loading: {
    type: Boolean,
    default: false
  },
  isFormValid: {
    type: Boolean,
    required: true
  },
  isEditing: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: ''
  }
})

const emit = defineEmits(['cancel'])

const onCancel = () => {
  emit('cancel')
}
</script>

<style scoped>
.trade-actions {
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid #ddd;
}

.button-group {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  flex-wrap: wrap;
}

@media (max-width: 767px) {
  .button-group {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
}

.btn {
  padding: 12px 24px;
  border: none;
  border-radius: 4px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  min-height: 44px;
  min-width: 120px;
}

@media (min-width: 768px) {
  .btn {
    padding: 10px 20px;
    min-width: 100px;
  }
}

.btn:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.btn-primary {
  background-color: #007bff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #0056b3;
}

.btn-secondary {
  background-color: #6c757d;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #545b62;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.error-message {
  color: #dc3545;
  font-size: 14px;
  margin-top: 1rem;
  text-align: center;
  padding: 8px;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
}
</style>