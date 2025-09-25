<template>
  <div class="trade-summary">
    <h3>Trade Summary</h3>
    <div class="summary-row">
      <div class="summary-label">P&L Amount:</div>
      <div class="summary-value">
        <div class="input-with-prefix">
          <span class="currency-prefix">₹</span>
          <input
            type="number"
            :value="Math.round(pnl.amount * 100) / 100"
            step="0.01"
            :class="{ 'profit': pnl.amount > 0, 'loss': pnl.amount < 0 }"
            inputmode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            @input="handlePnLAmountChange"
          >
        </div>
      </div>
    </div>
    <div class="summary-row">
      <div class="summary-label">Return %:</div>
      <div class="summary-value" :class="{ 'profit': pnl.percentage > 0, 'loss': pnl.percentage < 0 }">
        {{ pnl.percentage.toFixed(2) }}%
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  pnl: {
    type: Object,
    required: false,
    default: () => ({
      amount: 0,
      percentage: 0
    })
  },
  capitalUsed: {
    type: Number,
    default: 0
  }
})

const emit = defineEmits(['update-pnl'])

const handlePnLAmountChange = (event) => {
  const amount = parseFloat(event.target.value) || 0
  const percentage = props.capitalUsed ? (amount / props.capitalUsed) * 100 : 0

  emit('update-pnl', {
    amount,
    percentage
  })
}
</script>

<style scoped>
.trade-summary {
  background-color: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
}

.trade-summary h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: var(--text-color);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.summary-row:last-child {
  margin-bottom: 0;
}

.summary-label {
  font-weight: 500;
  color: var(--text-color);
}

.summary-value {
  font-weight: 600;
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
  padding: 0.5rem 0.75rem 0.5rem 2.5rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 600;
  width: 120px;
}

.input-with-prefix input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.profit {
  color: #22c55e;
}

.loss {
  color: #ef4444;
}

@media (max-width: 768px) {
  .summary-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
