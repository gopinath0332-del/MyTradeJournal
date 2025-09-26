<template>
  <div class="loading-container" :class="{ 'full-height': fullHeight, 'inline': inline }">
    <div class="spinner" :class="sizeClass">
      <div class="spinner-circle" />
    </div>
    <p v-if="message" class="loading-message">{{ message }}</p>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  size: {
    type: String,
    default: 'medium',
    validator: (value) => ['small', 'medium', 'large'].includes(value)
  },
  message: {
    type: String,
    default: 'Loading...'
  },
  fullHeight: {
    type: Boolean,
    default: false
  },
  inline: {
    type: Boolean,
    default: false
  }
})

const sizeClass = computed(() => `spinner--${props.size}`)
</script>

<style scoped>
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  gap: 1rem;
}

.loading-container.full-height {
  min-height: 300px;
}

.loading-container.inline {
  padding: 1rem;
  min-height: auto;
}

.spinner {
  position: relative;
  display: inline-block;
}

.spinner-circle {
  border: 3px solid rgba(59, 130, 246, 0.1);
  border-top: 3px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.spinner--small .spinner-circle {
  width: 20px;
  height: 20px;
  border-width: 2px;
}

.spinner--medium .spinner-circle {
  width: 32px;
  height: 32px;
}

.spinner--large .spinner-circle {
  width: 48px;
  height: 48px;
  border-width: 4px;
}

.loading-message {
  color: #6b7280;
  font-size: 0.875rem;
  font-weight: 500;
  margin: 0;
  text-align: center;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .spinner-circle {
    border: 3px solid rgba(99, 102, 241, 0.1);
    border-top: 3px solid #6366f1;
  }

  .loading-message {
    color: #9ca3af;
  }
}
</style>
