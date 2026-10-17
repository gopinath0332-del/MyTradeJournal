<script setup lang="ts">
import { ref, computed } from 'vue'

// ── Input states ────────────────────────────────────────────────────────────
const capital = ref<number>(100000)
const baseRisk = ref<number>(2)
const lotMultiplier = ref<number>(1)  // units per lot: 1 for GOLDPETAL, 10 for CRUDEOIL Mini, etc.
const atrMultiplier = ref<number>(1.5)
const atr = ref<number | null>(50)
const entryPrice = ref<number | null>(null)

// ── Core calculations ───────────────────────────────────────────────────────
const volatilityStop = computed(() => (atr.value || 0) * atrMultiplier.value)

const volatilityRatio = computed(() => {
  if (volatilityStop.value > 0 && atr.value) return volatilityStop.value / atr.value
  return 0
})

const effectiveSl = computed(() => volatilityStop.value)

const suggestedRiskPct = computed(() => {
  if (volatilityRatio.value > 0 && volatilityRatio.value < 0.5) {
    return baseRisk.value * 0.5
  }
  return baseRisk.value
})

const riskAmount = computed(() => capital.value * (baseRisk.value / 100))

// Risk per lot = SL distance × lot multiplier
const riskPerLot = computed(() => effectiveSl.value * (lotMultiplier.value || 1))

const lotsByRisk = computed(() => {
  if (riskPerLot.value > 0) return riskAmount.value / riskPerLot.value
  return 0
})

const finalLots = computed(() => {
  if (lotsByRisk.value > 0) return Math.floor(lotsByRisk.value)
  return 0
})

const actualRisk    = computed(() => finalLots.value * riskPerLot.value)
const actualRiskPct = computed(() => (actualRisk.value / capital.value) * 100)

// Capital deployed (entry price × lots × lot multiplier)
const capitalDeployed = computed(() => {
  if (entryPrice.value && finalLots.value > 0) {
    return entryPrice.value * finalLots.value * (lotMultiplier.value || 1)
  }
  return null
})

// ── Constraint display ──────────────────────────────────────────────────────
const constraintType = computed(() => finalLots.value === 0 ? 'None' : 'Risk')

const constraintLabel = computed(() =>
  constraintType.value === 'None' ? 'Waiting for Inputs' : 'Risk (Risk Limit)'
)

const constraintDescription = computed(() =>
  constraintType.value === 'None'
    ? 'Please enter ATR and ATR Multiplier.'
    : 'Your position size is capped by your maximum allowed loss per trade (Base Risk %).'
)

const constraintClass = computed(() =>
  constraintType.value === 'None' ? 'neutral' : 'success'
)

// ── Scaling recommendations ─────────────────────────────────────────────────
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
      ATR-Based Risk Model
    </p>

    <div class="calculator-grid">
      <!-- Input Section -->
      <div class="card input-card">
        <h3 class="card-title">
          Trade Inputs
        </h3>

        <div class="input-row">
          <div class="input-group">
            <label>Capital (₹)</label>
            <input v-model.number="capital" type="number" min="0" step="1000">
          </div>
          <div class="input-group">
            <label>Base Risk (%)</label>
            <input v-model.number="baseRisk" type="number" min="0.1" step="0.1">
          </div>
        </div>

        <div class="input-row">
          <div class="input-group">
            <label>ATR (₹)</label>
            <input v-model.number="atr" type="number" min="1" step="1">
            <span class="help-text">Used for Volatility Ratio</span>
          </div>
          <div class="input-group">
            <label>ATR Multiplier</label>
            <input v-model.number="atrMultiplier" type="number" min="0.1" step="0.1">
            <span class="help-text">Multiplier for stop distance</span>
          </div>
        </div>

        <div class="input-row">
          <div class="input-group">
            <label>Lot Multiplier</label>
            <input v-model.number="lotMultiplier" type="number" min="1" step="1">
            <span class="help-text">Units per lot — e.g. 1 (GOLDPETAL), 10 (CRUDEOIL Mini)</span>
          </div>
          <div class="input-group">
            <label>Entry Price (₹) <span class="optional-tag">optional</span></label>
            <input v-model.number="entryPrice" type="number" min="0" step="0.01" placeholder="for capital deployed">
          </div>
        </div>
      </div>

      <!-- Analysis Section -->
      <div class="card analysis-card">
        <h3 class="card-title">
          Analysis &amp; Constraints
        </h3>

        <div class="stats-grid">
          <div class="stat-box">
            <span class="stat-label">Volatility Stop</span>
            <span class="stat-value">₹{{ volatilityStop.toFixed(2) }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Effective SL</span>
            <span class="stat-value">₹{{ effectiveSl.toFixed(2) }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Risk per Lot</span>
            <span class="stat-value">₹{{ riskPerLot.toFixed(2) }}</span>
            <span class="stat-sub">SL × ×{{ lotMultiplier }}</span>
          </div>
          <div class="stat-box" :class="{'warning': volatilityRatio > 0 && volatilityRatio < 0.5, 'good': volatilityRatio >= 0.5}">
            <span class="stat-label">Volatility Ratio</span>
            <span class="stat-value">{{ volatilityRatio.toFixed(2) }}</span>
          </div>
          <div class="stat-box" :class="{'warning': suggestedRiskPct < baseRisk}">
            <span class="stat-label">Suggested Risk %</span>
            <span class="stat-value">{{ volatilityStop > 0 ? suggestedRiskPct.toFixed(2) + '%' : '—' }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Risk Amount</span>
            <span class="stat-value">₹{{ riskAmount.toFixed(2) }}</span>
          </div>
          <div class="stat-box">
            <span class="stat-label">Lots by Risk</span>
            <span class="stat-value">{{ volatilityStop > 0 ? lotsByRisk.toFixed(2) : '—' }}</span>
          </div>
        </div>

        <div class="constraint-alert" :class="constraintClass">
          <strong>Binding Constraint:</strong> {{ constraintLabel }}
          <div class="constraint-desc">{{ constraintDescription }}</div>
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
            <p><strong>Lot Multiplier:</strong> ×{{ lotMultiplier }} units/lot</p>
            <p v-if="capitalDeployed !== null">
              <strong>Capital Deployed:</strong> ₹{{ capitalDeployed.toFixed(2) }}
            </p>
            <p v-else class="muted-text">Enter entry price to see capital deployed</p>
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

/* Instrument selector */
.instrument-selector {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.inst-btn {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  padding: 0.5rem 1rem;
  border: 2px solid #d1d5db;
  border-radius: 8px;
  background: white;
  color: #374151;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.inst-btn:hover {
  border-color: #42b883;
  color: #42b883;
}

.inst-btn.active {
  border-color: #42b883;
  background: #f0fdf4;
  color: #166534;
}

.inst-badge {
  font-size: 0.75rem;
  background: #e5e7eb;
  color: #6b7280;
  padding: 0.1rem 0.35rem;
  border-radius: 4px;
  font-weight: 600;
}

.inst-btn.active .inst-badge {
  background: #bbf7d0;
  color: #166534;
}

/* Multiplier info bar */
.multiplier-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f0fdf4;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  padding: 0.6rem 1rem;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #166534;
}

.multiplier-info strong {
  font-size: 1rem;
}

/* Full-row input inside a 2-col grid */
.input-group.full-row {
  grid-column: 1 / -1;
}

.optional-tag {
  font-size: 0.75rem;
  font-weight: 400;
  color: #9ca3af;
  margin-left: 0.4rem;
}

.stat-sub {
  display: block;
  font-size: 0.7rem;
  color: #9ca3af;
  margin-top: 0.15rem;
}

.muted-text {
  color: #9ca3af;
  font-size: 0.85rem;
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

.constraint-alert.neutral {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
}

.constraint-desc {
  margin-top: 0.25rem;
  font-size: 0.8rem;
  opacity: 0.9;
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
