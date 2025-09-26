<template>
  <div class="empty-state" :class="{ 'full-height': fullHeight }">
    <div class="empty-state-content">
      <div class="empty-state-icon" :class="iconClass">
        {{ icon }}
      </div>
      <h3 class="empty-state-title">{{ title }}</h3>
      <p v-if="message" class="empty-state-message">{{ message }}</p>
      <button
        v-if="actionText && actionHandler"
        class="empty-state-action"
        @click="actionHandler"
      >
        {{ actionText }}
      </button>
      <slot name="action" />
    </div>
  </div>
</template>

<script setup>
defineProps({
  icon: {
    type: String,
    default: '📊'
  },
  iconClass: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    required: true
  },
  message: {
    type: String,
    default: ''
  },
  actionText: {
    type: String,
    default: ''
  },
  actionHandler: {
    type: Function,
    default: null
  },
  fullHeight: {
    type: Boolean,
    default: false
  }
})
</script>

<style scoped>
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  text-align: center;
}

.empty-state.full-height {
  min-height: 400px;
}

.empty-state-content {
  max-width: 400px;
  width: 100%;
}

.empty-state-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  opacity: 0.6;
}

.empty-state-icon.large {
  font-size: 4rem;
}

.empty-state-icon.small {
  font-size: 2rem;
}

.empty-state-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--text-color, #374151);
  margin: 0 0 0.75rem 0;
}

.empty-state-message {
  font-size: 0.875rem;
  color: var(--text-muted, #6b7280);
  margin: 0 0 1.5rem 0;
  line-height: 1.5;
}

.empty-state-action {
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 0.375rem;
  padding: 0.75rem 1.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.empty-state-action:hover {
  background-color: #2563eb;
}

.empty-state-action:focus {
  outline: 2px solid transparent;
  box-shadow: 0 0 0 2px #3b82f6;
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .empty-state-title {
    color: #f9fafb;
  }

  .empty-state-message {
    color: #9ca3af;
  }

  .empty-state-action {
    background-color: #6366f1;
  }

  .empty-state-action:hover {
    background-color: #5b21b6;
  }
}

/* Responsive design */
@media (max-width: 640px) {
  .empty-state {
    padding: 2rem 1rem;
  }

  .empty-state-icon {
    font-size: 2.5rem;
  }

  .empty-state-title {
    font-size: 1.125rem;
  }
}
</style>
