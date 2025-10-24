<template>
  <div class="sequence-analytics">
    <div class="analytics-header">
      <h3>
        <span class="icon">🔄</span>
        Trade Sequence Analysis
      </h3>
      <p class="subtitle">Markov chain analysis of trading patterns and probabilities</p>
    </div>

    <LoadingSpinner v-if="isLoading" message="Analyzing trade sequences..." />

    <div v-else-if="!hasData" class="empty-state">
      <div class="empty-icon">📊</div>
      <h4>Insufficient Data</h4>
      <p>Need at least 10 closed trades to perform sequence analysis.</p>
    </div>

    <div v-else class="analytics-content">
      <!-- Current Status & Prediction -->
      <div class="prediction-section">
        <div class="current-status-card">
          <h4>Current Status</h4>
          <div class="status-display">
            <div class="status-badge" :class="currentStreakType">
              {{ currentStreakDisplay }}
            </div>
            <div class="streak-info">
              <span class="streak-length">{{ currentStreakLength }} trade{{ currentStreakLength > 1 ? 's' : '' }}</span>
              <span class="streak-pnl" :class="currentStreakType">
                {{ formatCurrency(currentStreakPnL) }}
              </span>
            </div>
          </div>
        </div>

        <div v-if="prediction" class="prediction-card">
          <h4>Next Trade Prediction</h4>
          <div class="prediction-bars">
            <div class="prediction-item">
              <span class="prediction-label">Win</span>
              <div class="prediction-bar-container">
                <div
                  class="prediction-bar win"
                  :style="{ width: `${prediction.predictions.nextWinProbability * 100}%` }"
                />
              </div>
              <span class="prediction-value">{{ (prediction.predictions.nextWinProbability * 100).toFixed(1) }}%</span>
            </div>
            <div class="prediction-item">
              <span class="prediction-label">Loss</span>
              <div class="prediction-bar-container">
                <div
                  class="prediction-bar loss"
                  :style="{ width: `${prediction.predictions.nextLossProbability * 100}%` }"
                />
              </div>
              <span class="prediction-value">{{ (prediction.predictions.nextLossProbability * 100).toFixed(1) }}%</span>
            </div>
          </div>
          <div class="confidence-indicator">
            <span class="confidence-label">Confidence:</span>
            <span class="confidence-value">{{ (prediction.confidence * 100).toFixed(0) }}%</span>
            <span class="sample-size">({{ prediction.sampleSize }} trades)</span>
          </div>
        </div>
      </div>

      <!-- Transition Matrix Visualization -->
      <div class="transition-matrix-section">
        <h4>Transition Probabilities Matrix</h4>
        <p class="matrix-subtitle">Probability of outcome given previous trade result</p>
        <div class="matrix-grid">
          <div class="matrix-cell header empty" />
          <div class="matrix-cell header">→ Win</div>
          <div class="matrix-cell header">→ Loss</div>

          <div class="matrix-cell row-header">Win →</div>
          <div class="matrix-cell value" :class="getMatrixCellClass(metrics.transitionMatrix.WW)">
            {{ (metrics.transitionMatrix.WW * 100).toFixed(1) }}%
          </div>
          <div class="matrix-cell value" :class="getMatrixCellClass(metrics.transitionMatrix.WL)">
            {{ (metrics.transitionMatrix.WL * 100).toFixed(1) }}%
          </div>

          <div class="matrix-cell row-header">Loss →</div>
          <div class="matrix-cell value" :class="getMatrixCellClass(metrics.transitionMatrix.LW)">
            {{ (metrics.transitionMatrix.LW * 100).toFixed(1) }}%
          </div>
          <div class="matrix-cell value" :class="getMatrixCellClass(metrics.transitionMatrix.LL)">
            {{ (metrics.transitionMatrix.LL * 100).toFixed(1) }}%
          </div>
        </div>

        <div class="key-insights">
          <div class="insight">
            <span class="insight-icon">🎯</span>
            <span>Recovery Rate: <strong>{{ (metrics.recoveryRate * 100).toFixed(1) }}%</strong> (Win after Loss)</span>
          </div>
          <div class="insight">
            <span class="insight-icon">📈</span>
            <span>Win Momentum: <strong>{{ (metrics.transitionMatrix.WW * 100).toFixed(1) }}%</strong> (Win after Win)</span>
          </div>
          <div class="insight">
            <span class="insight-icon">📉</span>
            <span>Loss Streak Risk: <strong>{{ (metrics.transitionMatrix.LL * 100).toFixed(1) }}%</strong> (Loss after Loss)</span>
          </div>
        </div>
      </div>

      <!-- Streak Analysis -->
      <div class="streak-analysis-section">
        <h4>Streak Analysis</h4>
        <div class="streak-cards">
          <div class="streak-card win">
            <div class="streak-icon">🔥</div>
            <div class="streak-title">Longest Win Streak</div>
            <div class="streak-number">{{ metrics.streakAnalysis.longestWinStreak.length }} trades</div>
            <div class="streak-pnl">{{ formatCurrency(metrics.streakAnalysis.longestWinStreak.totalPnL) }}</div>
            <div v-if="metrics.streakAnalysis.longestWinStreak.startDate" class="streak-dates">
              {{ formatDate(metrics.streakAnalysis.longestWinStreak.startDate) }} -
              {{ formatDate(metrics.streakAnalysis.longestWinStreak.endDate) }}
            </div>
          </div>

          <div class="streak-card loss">
            <div class="streak-icon">❄️</div>
            <div class="streak-title">Longest Loss Streak</div>
            <div class="streak-number">{{ metrics.streakAnalysis.longestLossStreak.length }} trades</div>
            <div class="streak-pnl">{{ formatCurrency(metrics.streakAnalysis.longestLossStreak.totalPnL) }}</div>
            <div v-if="metrics.streakAnalysis.longestLossStreak.startDate" class="streak-dates">
              {{ formatDate(metrics.streakAnalysis.longestLossStreak.startDate) }} -
              {{ formatDate(metrics.streakAnalysis.longestLossStreak.endDate) }}
            </div>
          </div>

          <div class="streak-card neutral">
            <div class="streak-icon">📊</div>
            <div class="streak-title">Average Streaks</div>
            <div class="avg-streaks">
              <div class="avg-item">
                <span class="avg-label">Win:</span>
                <span class="avg-value">{{ metrics.streakAnalysis.averageWinStreak.toFixed(1) }}</span>
              </div>
              <div class="avg-item">
                <span class="avg-label">Loss:</span>
                <span class="avg-value">{{ metrics.streakAnalysis.averageLossStreak.toFixed(1) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Common Patterns -->
      <div class="patterns-section">
        <h4>Common Trading Patterns</h4>
        <p class="patterns-subtitle">3-trade sequences that repeat frequently</p>
        <div class="patterns-grid">
          <div
            v-for="pattern in topPatterns"
            :key="pattern.pattern"
            class="pattern-card"
          >
            <div class="pattern-visual">
              <span
                v-for="(char, idx) in pattern.pattern"
                :key="idx"
                class="pattern-icon"
                :class="getPatternClass(char)"
              >
                {{ getPatternEmoji(char) }}
              </span>
            </div>
            <div class="pattern-label">{{ getPatternName(pattern.pattern) }}</div>
            <div class="pattern-stats">
              <span class="pattern-count">{{ pattern.count }} times</span>
              <span class="pattern-prob">{{ (pattern.probability * 100).toFixed(1) }}%</span>
            </div>
            <div class="pattern-pnl" :class="{ positive: pattern.avgPnL > 0, negative: pattern.avgPnL < 0 }">
              Avg: {{ formatCurrency(pattern.avgPnL) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Sequence Timeline -->
      <div class="timeline-section">
        <h4>Recent Trade Sequence</h4>
        <div class="sequence-timeline">
          <div
            v-for="(trade, index) in recentSequence"
            :key="index"
            class="timeline-node"
            :class="trade.outcome"
          >
            <div class="node-icon">{{ trade.outcome === 'win' ? '✓' : '✗' }}</div>
            <div class="node-info">
              <span class="node-symbol">{{ trade.symbol }}</span>
              <span class="node-pnl">{{ formatCurrency(trade.pnl) }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { tradeService } from '@/firebase/tradeService'
import {
  classifyTrade,
  buildTransitionMatrix,
  findPatterns,
  analyzeStreaks,
  predictNextTrade,
  calculateRecoveryRate
} from '@/types/markov'
import LoadingSpinner from '../ui/LoadingSpinner.vue'

const isLoading = ref(true)
const trades = ref([])

// Prepare sequence data
const sequence = computed(() => {
  const closedTrades = trades.value
    .filter(t => t.exitDate && t.pnlAmount !== undefined)
    .sort((a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime())

  return {
    outcomes: closedTrades.map(t => classifyTrade(t.pnlAmount)),
    dates: closedTrades.map(t => t.exitDate),
    pnls: closedTrades.map(t => t.pnlAmount),
    symbols: closedTrades.map(t => t.symbol),
    trades: closedTrades
  }
})

const hasData = computed(() => sequence.value.outcomes.length >= 10)

// Compute metrics
const metrics = computed(() => {
  if (!hasData.value) return null

  const transitionMatrix = buildTransitionMatrix(sequence.value.outcomes)
  const patterns = findPatterns(
    sequence.value.outcomes,
    sequence.value.dates,
    sequence.value.pnls,
    3
  )
  const streakAnalysis = analyzeStreaks(
    sequence.value.outcomes,
    sequence.value.dates,
    sequence.value.pnls
  )
  const recoveryRate = calculateRecoveryRate(sequence.value.outcomes)

  return {
    transitionMatrix,
    patterns,
    streakAnalysis,
    recoveryRate,
    totalTrades: sequence.value.outcomes.length
  }
})

const prediction = computed(() => {
  if (!hasData.value || !metrics.value) return null
  return predictNextTrade(sequence.value.outcomes, metrics.value.transitionMatrix)
})

// Current streak display
const currentStreakType = computed(() => metrics.value?.streakAnalysis.currentStreak.type || 'breakeven')
const currentStreakLength = computed(() => metrics.value?.streakAnalysis.currentStreak.length || 0)
const currentStreakPnL = computed(() => metrics.value?.streakAnalysis.currentStreak.totalPnL || 0)
const currentStreakDisplay = computed(() => {
  const type = currentStreakType.value
  return type === 'win' ? '✓ Win Streak' : type === 'loss' ? '✗ Loss Streak' : '━ Breakeven'
})

// Top patterns
const topPatterns = computed(() => {
  return metrics.value?.patterns.slice(0, 6) || []
})

// Recent sequence (last 15 trades)
const recentSequence = computed(() => {
  const recent = sequence.value.trades.slice(-15)
  return recent.map((trade, idx) => ({
    symbol: trade.symbol,
    pnl: trade.pnlAmount,
    outcome: sequence.value.outcomes[sequence.value.outcomes.length - 15 + idx]
  }))
})

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(amount)
}

const formatDate = (dateStr) => {
  if (!dateStr) return ''
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const getMatrixCellClass = (value) => {
  if (value >= 0.6) return 'high'
  if (value >= 0.4) return 'medium'
  return 'low'
}

const getPatternClass = (char) => {
  return char === 'W' ? 'win' : char === 'L' ? 'loss' : 'breakeven'
}

const getPatternEmoji = (char) => {
  return char === 'W' ? '✓' : char === 'L' ? '✗' : '━'
}

const getPatternName = (pattern) => {
  const names = {
    WWW: 'Triple Win',
    LLL: 'Triple Loss',
    WLW: 'Win-Loss-Win',
    LWL: 'Loss-Win-Loss',
    WWL: 'Two Wins, Loss',
    LLW: 'Two Losses, Win',
    WLL: 'Win, Two Losses',
    LWW: 'Loss, Two Wins'
  }
  return names[pattern] || pattern
}

// Load trades
onMounted(async() => {
  try {
    isLoading.value = true
    const allTrades = await tradeService.getAllTrades()
    trades.value = allTrades
  } catch {
    trades.value = []
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.sequence-analytics {
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 12px;
}

.analytics-header {
  margin-bottom: 2rem;
}

.analytics-header h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.analytics-header .icon {
  font-size: 1.75rem;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.empty-state {
  padding: 3rem;
  text-align: center;
  background: white;
  border-radius: 10px;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h4 {
  margin: 0 0 0.5rem 0;
  color: #374151;
}

.empty-state p {
  margin: 0;
  color: #6b7280;
}

/* Prediction Section */
.prediction-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.current-status-card,
.prediction-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.current-status-card h4,
.prediction-card h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.status-display {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.75rem 1.5rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 1.125rem;
}

.status-badge.win {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.status-badge.loss {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.status-badge.breakeven {
  background: linear-gradient(135deg, #e5e7eb 0%, #d1d5db 100%);
  color: #374151;
}

.streak-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.streak-length {
  font-size: 0.875rem;
  color: #6b7280;
}

.streak-pnl {
  font-size: 1.25rem;
  font-weight: 700;
}

.streak-pnl.win {
  color: #10b981;
}

.streak-pnl.loss {
  color: #ef4444;
}

.prediction-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1rem;
}

.prediction-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.prediction-label {
  width: 50px;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.prediction-bar-container {
  flex: 1;
  height: 24px;
  background: #f3f4f6;
  border-radius: 12px;
  overflow: hidden;
}

.prediction-bar {
  height: 100%;
  border-radius: 12px;
  transition: width 0.3s ease;
}

.prediction-bar.win {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.prediction-bar.loss {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.prediction-value {
  width: 50px;
  text-align: right;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.confidence-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 0.875rem;
}

.confidence-label {
  color: #6b7280;
}

.confidence-value {
  font-weight: 700;
  color: #1f2937;
}

.sample-size {
  color: #9ca3af;
  margin-left: auto;
}

/* Transition Matrix */
.transition-matrix-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.transition-matrix-section h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.matrix-subtitle {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.matrix-grid {
  display: grid;
  grid-template-columns: auto 1fr 1fr;
  gap: 1px;
  background: #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 1.5rem;
}

.matrix-cell {
  background: white;
  padding: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 60px;
}

.matrix-cell.header {
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.matrix-cell.row-header {
  background: #f3f4f6;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.matrix-cell.empty {
  background: #f9fafb;
}

.matrix-cell.value {
  font-size: 1.25rem;
  font-weight: 700;
}

.matrix-cell.value.high {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
  color: #065f46;
}

.matrix-cell.value.medium {
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  color: #92400e;
}

.matrix-cell.value.low {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
  color: #991b1b;
}

.key-insights {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #374151;
}

.insight-icon {
  font-size: 1.25rem;
}

/* Streak Analysis */
.streak-analysis-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.streak-analysis-section h4 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.streak-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.streak-card {
  padding: 1.5rem;
  border-radius: 10px;
  text-align: center;
}

.streak-card.win {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.streak-card.loss {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.streak-card.neutral {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.streak-icon {
  font-size: 2.5rem;
  margin-bottom: 0.5rem;
}

.streak-title {
  font-size: 0.875rem;
  color: #374151;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.streak-number {
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.streak-pnl {
  font-size: 1.125rem;
  font-weight: 600;
  color: #059669;
  margin-bottom: 0.5rem;
}

.streak-card.loss .streak-pnl {
  color: #dc2626;
}

.streak-dates {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.avg-streaks {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 0.75rem;
}

.avg-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.avg-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.avg-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

/* Patterns Section */
.patterns-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.patterns-section h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.patterns-subtitle {
  margin: 0 0 1.5rem 0;
  color: #6b7280;
  font-size: 0.875rem;
}

.patterns-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  gap: 1rem;
}

.pattern-card {
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  text-align: center;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.pattern-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.pattern-visual {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.pattern-icon {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-weight: 700;
  font-size: 1.125rem;
}

.pattern-icon.win {
  background: #d1fae5;
  color: #065f46;
}

.pattern-icon.loss {
  background: #fee2e2;
  color: #991b1b;
}

.pattern-label {
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.pattern-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.pattern-pnl {
  font-weight: 700;
  font-size: 0.875rem;
}

.pattern-pnl.positive {
  color: #10b981;
}

.pattern-pnl.negative {
  color: #ef4444;
}

/* Timeline Section */
.timeline-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.timeline-section h4 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.sequence-timeline {
  display: flex;
  gap: 0.5rem;
  overflow-x: auto;
  padding: 1rem 0;
}

.timeline-node {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  min-width: 60px;
  flex-shrink: 0;
}

.node-icon {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1.125rem;
}

.timeline-node.win .node-icon {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
  color: white;
}

.timeline-node.loss .node-icon {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
  color: white;
}

.node-info {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
}

.node-symbol {
  font-weight: 600;
  color: #374151;
}

.node-pnl {
  color: #6b7280;
}

@media (max-width: 768px) {
  .sequence-analytics {
    padding: 1rem;
  }

  .prediction-section {
    grid-template-columns: 1fr;
  }

  .matrix-grid {
    font-size: 0.75rem;
  }

  .matrix-cell {
    padding: 0.75rem;
    min-height: 50px;
  }

  .streak-cards {
    grid-template-columns: 1fr;
  }

  .patterns-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
