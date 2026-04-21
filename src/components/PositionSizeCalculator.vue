<script setup lang="ts">
import { ref, computed } from 'vue'

// Input states
const capital = ref<number>(100000)
const baseRisk = ref<number>(1)
const slippageBuffer = ref<number>(2)
const entryPrice = ref<number | null>(null)
const stoplossPrice = ref<number | null>(null)
const marginPerLot = ref<number>(1664)
const atr = ref<number | null>(50)

// Computed values
const slDistance = computed(() => {
  if (entryPrice.value && stoplossPrice.value) {
    return Math.abs(entryPrice.value - stoplossPrice.value)
  }
  return 0
})

const volatilityRatio = computed(() => {
  if (slDistance.value > 0 && atr.value) {
    return slDistance.value / atr.value
  }
  return 0
})

const effectiveSl = computed(() => slDistance.value + slippageBuffer.value)

const riskAmount = computed(() => capital.value * (baseRisk.value / 100))

const lotsByRisk = computed(() => {
  if (effectiveSl.value > 0) {
    return riskAmount.value / effectiveSl.value
  }
  return 0
})

const marginBudget = computed(() => capital.value * 0.7) // 70% utilization cap

const lotsByMargin = computed(() => {
  if (marginPerLot.value > 0) {
    return marginBudget.value / marginPerLot.value
  }
  return 0
})

const finalLots = computed(() => {
  if (lotsByRisk.value > 0 && lotsByMargin.value > 0) {
    return Math.floor(Math.min(lotsByRisk.value, lotsByMargin.value))
  }
  return 0
})

const actualMarginUsed = computed(() => finalLots.value * marginPerLot.value)
const actualRisk = computed(() => finalLots.value * effectiveSl.value)
const actualRiskPct = computed(() => (actualRisk.value / capital.value) * 100)

const isMarginBound = computed(() => lotsByMargin.value < lotsByRisk.value && lotsByMargin.value > 0)

// Scaling recommendations
const scaleRecommendationText = computed(() => {
  if (volatilityRatio.value === 0) return '-'
  if (volatilityRatio.value < 0.5) return '50% - 75% (Tight Stop, High Noise)'
  if (volatilityRatio.value <= 1.0) return '100% (Moderate Stop)'
  return '100% (Wide/Robust Stop)'
})

const scaledLots = computed(() => {
  if (finalLots.value === 0) return '0'
  if (volatilityRatio.value > 0 && volatilityRatio.value < 0.5) {
    const minScaled = Math.floor(finalLots.value * 0.5)
    const maxScaled = Math.floor(finalLots.value * 0.75)
    return `${minScaled} - ${maxScaled} lots`
  }
  return `${finalLots.value} lots`
})

</script>

<template>
  <div class="calculator-container">
    <h2 class="page-title">
      Position Size Calculator
    </h2>
    <p class="page-subtitle">
      ATR-Based Risk Model (Gold Petal MCX)
    </p>

    <div class="calculator-grid">
      <!-- Input Section -->
      <div class="card input-card">
        <h3 class="card-title">
          Trade Inputs
        </h3>
        
        <div class="input-group">
          <label>Capital (₹)</label>
          <input v-model.number="capital" type="number" min="0" step="1000">
        </div>

        <div class="input-row">
          <div class="input-group">
            <label>Base Risk (%)</label>
            <input v-model.number="baseRisk" type="number" min="0.1" step="0.1">
          </div>
          <div class="input-group">
            <label>Margin per Lot (₹)</label>
            <input v-model.number="marginPerLot" type="number" min="1" step="1">
          </div>
        </div>

        <div class="input-row">
          <div class="input-group">
            <label>Entry Price (₹)</label>
            <input v-model.number="entryPrice" type="number" min="0" step="1" placeholder="e.g. 152576">
          </div>
          <div class="input-group">
            <label>Stoploss Price (₹)</label>
            <input v-model.number="stoplossPrice" type="number" min="0" step="1" placeholder="e.g. 152589">
            <span class="help-text">From Pine Script ATR Trailing Stop</span>
          </div>
        </div>

        <div class="input-row">
          <div class="input-group">
            <label>ATR (₹)</label>
            <input v-model.number="atr" type="number" min="1" step="1">
            <span class="help-text">Used for Volatility Ratio</span>
          </div>
          <div class="input-group">
            <label>Slippage Buffer (₹)</label>
            <input v-model.number="slippageBuffer" type="number" min="0" step="1">
          </div>
        </div>
      </div>

      <!-- Analysis Section -->
      <div class="card analysis-card">
        <h3 class="card-title">
          Analysis & Constraints
        </h3>

        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-label">SL Distance</span>
            <span class="stat-value">₹{{ slDistance.toFixed(2) }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Effective SL</span>
            <span class="stat-value">₹{{ effectiveSl.toFixed(2) }}</span>
          </div>
          <div class="stat-box" :class="{'warning': volatilityRatio > 0 && volatilityRatio < 0.5, 'good': volatilityRatio >= 0.5}">
            <span class="stat-label">Volatility Ratio</span>
            <span class="stat-value">{{ volatilityRatio.toFixed(2) }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Risk Amount</span>
            <span class="stat-value">₹{{ riskAmount.toFixed(2) }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Lots by Risk</span>
            <span class="stat-value">{{ lotsByRisk.toFixed(2) }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Lots by Margin (70%)</span>
            <span class="stat-value">{{ lotsByMargin.toFixed(2) }}</span>
          </div>
        </div>

        <div class="constraint-alert" :class="isMarginBound ? 'info' : 'success'">
          <strong>Binding Constraint:</strong> 
          {{ isMarginBound ? 'Margin' : 'Risk' }} 
          ({{ isMarginBound ? 'Capital utilization limits size' : 'Risk limit caps size' }})
        </div>
      </div>

      <!-- Final Output Section -->
      <div class="card result-card full-width">
        <h3 class="card-title">
          Final Position Size
        </h3>

        <div class="result-highlight">
          <div class="big-lots">
            {{ finalLots }} <span class="unit">lots</span>
          </div>
          <div class="result-details">
            <p><strong>Actual Risk:</strong> ₹{{ actualRisk.toFixed(2) }} ({{ actualRiskPct.toFixed(2) }}%)</p>
            <p><strong>Margin Used:</strong> ₹{{ actualMarginUsed.toFixed(2) }} ({{ capital > 0 ? ((actualMarginUsed / capital) * 100).toFixed(1) : 0 }}%)</p>
          </div>
        </div>

        <div v-if="volatilityRatio > 0 && volatilityRatio < 0.5" class="scaling-alert warning">
          <h4>⚠️ Low Volatility Ratio ({{ volatilityRatio.toFixed(2) }})</h4>
          <p>The stoploss is inside normal market noise range. Expect more frequent stop-outs before trailing stop moves.</p>
          <div class="scaling-recommendation">
            <span>Recommended Lot Scaling:</span>
            <strong>{{ scaleRecommendationText }}</strong>
            <span class="scaled-lots">→ Trade <strong>{{ scaledLots }}</strong></span>
          </div>
        </div>

        <div v-if="volatilityRatio >= 0.5" class="scaling-alert good">
          <h4>✅ Robust Stoploss (Ratio: {{ volatilityRatio.toFixed(2) }})</h4>
          <p>The stoploss has a reasonable chance of surviving normal market swings.</p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.calculator-container {
  padding: 1.5rem;
  max-width: 1200px;
  margin: 0 auto;
}

.page-title {
  color: #1f2937;
  font-size: 1.75rem;
  margin-bottom: 0.25rem;
}

.page-subtitle {
  color: #6b7280;
  margin-bottom: 2rem;
}

.calculator-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 1024px) {
  .calculator-grid {
    grid-template-columns: 1fr 1fr;
  }
}

.card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.full-width {
  grid-column: 1 / -1;
}

.card-title {
  font-size: 1.25rem;
  color: #374151;
  margin-bottom: 1.5rem;
  border-bottom: 2px solid #f3f4f6;
  padding-bottom: 0.5rem;
}

.input-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.input-group {
  margin-bottom: 1.25rem;
}

.input-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #4b5563;
  margin-bottom: 0.5rem;
}

.input-group input {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 1rem;
  transition: border-color 0.2s, box-shadow 0.2s;
  box-sizing: border-box;
}

.input-group input:focus {
  outline: none;
  border-color: #42b883;
  box-shadow: 0 0 0 3px rgba(66, 184, 131, 0.2);
}

.help-text {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-box {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.stat-box.warning {
  background: #fffbeb;
  border-color: #fcd34d;
}

.stat-box.good {
  background: #f0fdf4;
  border-color: #86efac;
}

.stat-label {
  display: block;
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.stat-value {
  display: block;
  font-size: 1.25rem;
  font-weight: 600;
  color: #111827;
}

.constraint-alert {
  padding: 1rem;
  border-radius: 8px;
  font-size: 0.9rem;
}

.constraint-alert.info {
  background: #eff6ff;
  color: #1e3a8a;
  border: 1px solid #bfdbfe;
}

.constraint-alert.success {
  background: #f0fdf4;
  color: #166534;
  border: 1px solid #bbf7d0;
}

.result-card {
  text-align: center;
}

.result-highlight {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 1.5rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .result-highlight {
    flex-direction: row;
    justify-content: space-around;
  }
}

.big-lots {
  font-size: 4rem;
  font-weight: 700;
  color: #42b883;
  line-height: 1;
}

.big-lots .unit {
  font-size: 1.5rem;
  color: #6b7280;
  font-weight: 500;
}

.result-details {
  text-align: left;
  background: #f8f9fa;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.result-details p {
  margin: 0.25rem 0;
  color: #374151;
}

.scaling-alert {
  text-align: left;
  padding: 1.25rem;
  border-radius: 8px;
  margin-top: 1rem;
}

.scaling-alert h4 {
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
}

.scaling-alert.warning {
  background: #fffbeb;
  border: 1px solid #fcd34d;
  color: #92400e;
}

.scaling-alert.warning h4 {
  color: #b45309;
}

.scaling-alert.good {
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  color: #166534;
}

.scaling-alert.good h4 {
  color: #15803d;
}

.scaling-recommendation {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid rgba(0,0,0,0.1);
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.scaled-lots {
  font-size: 1.25rem;
  color: #b45309;
}
</style>
