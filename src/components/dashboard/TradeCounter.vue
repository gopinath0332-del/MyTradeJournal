<template>
  <div v-if="isCryptoProfile" class="trade-counter-card" :class="urgencyClass">
    <div class="counter-header">
      <div class="counter-title-row">
        <span class="counter-icon">🎯</span>
        <h3 class="counter-title">Trades Remaining</h3>
      </div>
      <button
        class="reset-btn"
        title="Reset trade counter"
        @click="showResetConfirm = true"
      >
        <span class="reset-icon">↻</span>
      </button>
    </div>

    <div class="counter-body">
      <div class="counter-display">
        <span class="counter-value" :class="urgencyClass">{{ remainingTrades }}</span>
        <span class="counter-separator">/</span>
        <span class="counter-max">{{ maxTrades }}</span>
      </div>

      <!-- Progress bar (inverted - shows how many are used) -->
      <div class="progress-track">
        <div
          class="progress-fill"
          :class="urgencyClass"
          :style="{ width: progressPercent + '%' }"
        />
      </div>
      <div class="progress-label">
        <span>{{ usedTrades }} trades taken</span>
        <span>{{ progressPercent }}% used</span>
      </div>
    </div>

    <!-- Reset Confirmation Modal -->
    <Transition name="modal">
      <div v-if="showResetConfirm" class="reset-overlay" @click.self="showResetConfirm = false">
        <div class="reset-modal">
          <div class="reset-modal-header">
            <h4>↻ Reset Trade Counter</h4>
          </div>
          <div class="reset-modal-body">
            <p>Reset your trade counter back to:</p>
            <div class="reset-input-group">
              <input
                v-model.number="resetValue"
                type="number"
                min="1"
                max="999"
                class="reset-input"
              >
              <span class="reset-input-label">trades</span>
            </div>
          </div>
          <div class="reset-modal-footer">
            <button class="btn-cancel" @click="showResetConfirm = false">Cancel</button>
            <button class="btn-reset" @click="handleReset">Reset Counter</button>
          </div>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useProfiles } from '@/composables/useProfiles'

const { activeProfile, updateProfile } = useProfiles()

const showResetConfirm = ref(false)
const resetValue = ref(100)

// Check if current profile is a crypto profile
const isCryptoProfile = computed(() => {
  return activeProfile.value?.name?.toLowerCase().includes('crypto')
})

const maxTrades = computed(() => {
  return activeProfile.value?.settings?.tradeCounterMax || 100
})

const remainingTrades = computed(() => {
  // If tradeCounter is not set yet, initialize it to maxTrades
  const counter = activeProfile.value?.settings?.tradeCounter
  return counter !== undefined && counter !== null ? counter : maxTrades.value
})

const usedTrades = computed(() => {
  return maxTrades.value - remainingTrades.value
})

const progressPercent = computed(() => {
  if (maxTrades.value === 0) return 0
  return Math.round((usedTrades.value / maxTrades.value) * 100)
})

const urgencyClass = computed(() => {
  const remaining = remainingTrades.value
  const max = maxTrades.value
  const ratio = remaining / max

  if (remaining <= 0) return 'depleted'
  if (ratio <= 0.1) return 'critical'
  if (ratio <= 0.25) return 'warning'
  if (ratio <= 0.5) return 'caution'
  return 'healthy'
})

// Reset counter
const handleReset = async() => {
  if (!activeProfile.value?.id) return

  try {
    await updateProfile(activeProfile.value.id, {
      settings: {
        ...activeProfile.value.settings,
        tradeCounter: resetValue.value,
        tradeCounterMax: resetValue.value
      }
    })
    showResetConfirm.value = false
  } catch {
    // Error handled by composable
  }
}

// Expose decrement function for external use
const decrementCounter = async() => {
  if (!activeProfile.value?.id || !isCryptoProfile.value) return

  const current = remainingTrades.value
  const newCount = Math.max(0, current - 1)

  try {
    await updateProfile(activeProfile.value.id, {
      settings: {
        ...activeProfile.value.settings,
        tradeCounter: newCount
      }
    })
  } catch {
    // Error handled by composable
  }
}

defineExpose({ decrementCounter })
</script>

<style scoped>
.trade-counter-card {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.trade-counter-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 3px;
  background: linear-gradient(90deg, #10b981, #34d399);
  transition: background 0.3s ease;
}

.trade-counter-card.caution::before {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.trade-counter-card.warning::before {
  background: linear-gradient(90deg, #f97316, #fb923c);
}

.trade-counter-card.critical::before {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.trade-counter-card.depleted::before {
  background: linear-gradient(90deg, #6b7280, #9ca3af);
}

.trade-counter-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.1);
}

/* Header */
.counter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
}

.counter-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.counter-icon {
  font-size: 1.25rem;
}

.counter-title {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 600;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.reset-btn {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  color: #64748b;
}

.reset-btn:hover {
  background: #e2e8f0;
  color: #334155;
  transform: rotate(180deg);
}

.reset-icon {
  font-size: 1.125rem;
  font-weight: bold;
  line-height: 1;
}

/* Counter Display */
.counter-body {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.counter-display {
  display: flex;
  align-items: baseline;
  justify-content: center;
  gap: 0.25rem;
}

.counter-value {
  font-size: 2.5rem;
  font-weight: 800;
  line-height: 1;
  color: #10b981;
  transition: color 0.3s ease;
}

.counter-value.caution {
  color: #f59e0b;
}

.counter-value.warning {
  color: #f97316;
}

.counter-value.critical {
  color: #ef4444;
}

.counter-value.depleted {
  color: #6b7280;
}

.counter-separator {
  font-size: 1.5rem;
  color: #94a3b8;
  font-weight: 300;
}

.counter-max {
  font-size: 1.25rem;
  color: #94a3b8;
  font-weight: 500;
}

/* Progress Bar */
.progress-track {
  background: #e2e8f0;
  border-radius: 100px;
  height: 8px;
  overflow: hidden;
  width: 100%;
}

.progress-fill {
  height: 100%;
  border-radius: 100px;
  background: linear-gradient(90deg, #10b981, #34d399);
  transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease;
}

.progress-fill.caution {
  background: linear-gradient(90deg, #f59e0b, #fbbf24);
}

.progress-fill.warning {
  background: linear-gradient(90deg, #f97316, #fb923c);
}

.progress-fill.critical {
  background: linear-gradient(90deg, #ef4444, #f87171);
}

.progress-fill.depleted {
  background: linear-gradient(90deg, #6b7280, #9ca3af);
}

.progress-label {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #64748b;
  font-weight: 500;
}

/* Reset Modal */
.reset-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.reset-modal {
  background: #ffffff;
  border-radius: 16px;
  max-width: 380px;
  width: 100%;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  overflow: hidden;
}

.reset-modal-header {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.reset-modal-header h4 {
  margin: 0;
  font-size: 1.125rem;
  color: #111827;
}

.reset-modal-body {
  padding: 1.5rem;
}

.reset-modal-body p {
  margin: 0 0 1rem;
  color: #4b5563;
}

.reset-input-group {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.reset-input {
  width: 100px;
  padding: 0.625rem 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-size: 1.25rem;
  font-weight: 600;
  text-align: center;
  color: #111827;
  transition: border-color 0.2s;
}

.reset-input:focus {
  outline: none;
  border-color: #10b981;
  box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.1);
}

.reset-input-label {
  color: #6b7280;
  font-size: 0.875rem;
}

.reset-modal-footer {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  justify-content: flex-end;
}

.btn-cancel {
  padding: 0.5rem 1.25rem;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  background: #ffffff;
  color: #374151;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.2s;
}

.btn-cancel:hover {
  background: #f3f4f6;
}

.btn-reset {
  padding: 0.5rem 1.25rem;
  border: none;
  border-radius: 8px;
  background: linear-gradient(135deg, #10b981, #059669);
  color: #ffffff;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s;
}

.btn-reset:hover {
  background: linear-gradient(135deg, #059669, #047857);
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-active .reset-modal,
.modal-leave-active .reset-modal {
  transition: transform 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-from .reset-modal {
  transform: scale(0.95);
}

.modal-leave-to .reset-modal {
  transform: scale(0.95);
}

/* Mobile responsive */
@media (max-width: 480px) {
  .trade-counter-card {
    padding: 1rem;
  }

  .counter-value {
    font-size: 2rem;
  }

  .counter-title {
    font-size: 0.75rem;
  }
}
</style>
