<template>
  <div class="trade-actions">
    <div class="form-actions">
      <button 
        v-if="showCancel" 
        type="button" 
        class="cancel-button" 
        @click="$emit('cancel')"
        :disabled="isSubmitting"
      >
        Cancel
      </button>
      <button 
        type="submit" 
        class="submit-button" 
        :disabled="isSubmitting"
      >
        <span v-if="isSubmitting">
          <span class="spinner-small"></span>
          {{ isEditMode ? 'Saving...' : 'Logging...' }}
        </span>
        <span v-else>{{ isEditMode ? 'Save Changes' : 'Log Trade' }}</span>
      </button>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  isSubmitting: {
    type: Boolean,
    default: false
  },
  isEditMode: {
    type: Boolean,
    default: false
  },
  showCancel: {
    type: Boolean,
    default: true
  }
})

defineEmits(['cancel'])
</script>

<style scoped>
.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1rem;
  border-top: 1px solid var(--border-color);
}

@media (max-width: 768px) {
  .form-actions {
    flex-direction: column-reverse;
    gap: 0.5rem;
  }
}

.cancel-button, .submit-button {
  padding: 0.75rem 1.5rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
}

.cancel-button {
  background-color: #f9fafb;
  color: #374151;
  border: 1px solid var(--border-color);
}

.cancel-button:hover:not(:disabled) {
  background-color: #f3f4f6;
}

.submit-button {
  background-color: var(--primary-color);
  color: white;
  border: none;
}

.submit-button:hover:not(:disabled) {
  background-color: #2563eb;
}

.cancel-button:disabled, .submit-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.spinner-small {
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

@media (max-width: 768px) {
  .cancel-button, .submit-button {
    width: 100%;
  }
}
</style>