<template>
  <div class="failure-analytics">
    <div class="analytics-header">
      <h3>
        <span class="icon">📊</span>
        Failure Mode Analysis
      </h3>
      <p class="subtitle">Understanding your trading mistakes to improve performance</p>
    </div>

    <div v-if="isLoading" class="loading-state">
      <LoadingSpinner message="Analyzing failure patterns..." />
    </div>

    <div v-else-if="!hasFailureData" class="empty-state">
      <div class="empty-icon">✅</div>
      <h4>No Failure Data Available</h4>
      <p>Start analyzing your losing trades by adding failure mode tags in the trade form.</p>
    </div>

    <div v-else class="analytics-content">
      <!-- Summary Cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-icon">📉</div>
          <div class="card-content">
            <div class="card-value">{{ totalLosingTrades }}</div>
            <div class="card-label">Losing Trades</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">🔍</div>
          <div class="card-content">
            <div class="card-value">{{ analyzedTrades }}</div>
            <div class="card-label">Analyzed</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">📈</div>
          <div class="card-content">
            <div class="card-value">{{ analysisRate }}%</div>
            <div class="card-label">Analysis Rate</div>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-icon">💰</div>
          <div class="card-content">
            <div class="card-value">{{ formatCurrency(totalLoss) }}</div>
            <div class="card-label">Total Loss</div>
          </div>
        </div>
      </div>

      <!-- Top Failure Modes -->
      <div class="top-failures-section">
        <h4>Most Common Failure Modes</h4>
        <div class="failure-bars">
          <div
            v-for="item in topFailureModes"
            :key="item.id"
            class="failure-bar-item"
          >
            <div class="failure-bar-header">
              <span class="failure-icon">{{ item.icon }}</span>
              <span class="failure-label">{{ item.label }}</span>
              <span class="failure-count">{{ item.count }} trades</span>
            </div>
            <div class="failure-bar-container">
              <div
                class="failure-bar-fill"
                :style="{
                  width: `${item.percentage}%`,
                  backgroundColor: item.color
                }"
              />
            </div>
            <div class="failure-bar-stats">
              <span class="stat">{{ item.percentage.toFixed(1) }}% of analyzed trades</span>
              <span class="stat loss">{{ formatCurrency(item.totalLoss) }} loss</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Breakdown -->
      <div class="category-breakdown-section">
        <h4>Failure Categories</h4>
        <div class="category-grid">
          <div
            v-for="category in categoryBreakdown"
            :key="category.id"
            class="category-card"
            :style="{ '--category-color': category.color }"
          >
            <div class="category-header">
              <span class="category-icon">{{ category.icon }}</span>
              <span class="category-name">{{ category.label }}</span>
            </div>
            <div class="category-count">{{ category.count }}</div>
            <div class="category-label">occurrences</div>
            <div class="category-loss">{{ formatCurrency(category.totalLoss) }}</div>
          </div>
        </div>
      </div>

      <!-- Recent Failures -->
      <div class="recent-failures-section">
        <h4>Recent Analyzed Trades</h4>
        <div class="recent-trades">
          <div
            v-for="trade in recentAnalyzedTrades"
            :key="trade.id"
            class="recent-trade-card"
          >
            <div class="trade-header-row">
              <span class="trade-symbol">{{ trade.symbol }}</span>
              <span class="trade-date">{{ formatDate(trade.entryDate) }}</span>
              <span class="trade-pnl loss">{{ formatCurrency(trade.pnlAmount) }}</span>
            </div>
            <div class="trade-failure-tags">
              <span
                v-for="modeId in trade.failureModes"
                :key="modeId"
                class="mini-failure-tag"
                :style="{ '--tag-color': getFailureModeColor(modeId) }"
              >
                {{ getFailureModeIcon(modeId) }} {{ getFailureModeLabel(modeId) }}
              </span>
            </div>
            <div v-if="trade.failureNotes" class="trade-notes">
              {{ truncateText(trade.failureNotes, 100) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Insights -->
      <div class="insights-section">
        <h4>💡 Key Insights</h4>
        <div class="insights-list">
          <div v-for="(insight, index) in insights" :key="index" class="insight-item">
            <span class="insight-icon">{{ insight.icon }}</span>
            <span class="insight-text">{{ insight.text }}</span>
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
  CATEGORY_INFO,
  getFailureModeById
} from '@/types/failureMode'
import LoadingSpinner from '../ui/LoadingSpinner.vue'

const isLoading = ref(true)
const trades = ref([])

// Computed properties
const losingTrades = computed(() => {
  return trades.value.filter(t => t.pnlAmount < 0)
})

const analyzedTrades = computed(() => {
  return losingTrades.value.filter(t => t.failureModes && t.failureModes.length > 0).length
})

const totalLosingTrades = computed(() => losingTrades.value.length)

const analysisRate = computed(() => {
  if (totalLosingTrades.value === 0) return 0
  return ((analyzedTrades.value / totalLosingTrades.value) * 100).toFixed(1)
})

const totalLoss = computed(() => {
  return losingTrades.value.reduce((sum, t) => sum + (t.pnlAmount || 0), 0)
})

const hasFailureData = computed(() => analyzedTrades.value > 0)

// Top failure modes
const topFailureModes = computed(() => {
  const modeCount = {}
  const modeLoss = {}

  losingTrades.value.forEach(trade => {
    if (trade.failureModes && trade.failureModes.length > 0) {
      trade.failureModes.forEach(modeId => {
        modeCount[modeId] = (modeCount[modeId] || 0) + 1
        modeLoss[modeId] = (modeLoss[modeId] || 0) + (trade.pnlAmount || 0)
      })
    }
  })

  const modes = Object.entries(modeCount).map(([id, count]) => {
    const mode = getFailureModeById(id)
    return {
      id,
      label: mode?.label || id,
      icon: mode?.icon || '❓',
      color: mode?.color || '#6b7280',
      count,
      totalLoss: modeLoss[id] || 0,
      percentage: (count / analyzedTrades.value) * 100
    }
  })

  return modes.sort((a, b) => b.count - a.count).slice(0, 10)
})

// Category breakdown
const categoryBreakdown = computed(() => {
  const categoryCount = {}
  const categoryLoss = {}

  losingTrades.value.forEach(trade => {
    if (trade.failureModes && trade.failureModes.length > 0) {
      trade.failureModes.forEach(modeId => {
        const mode = getFailureModeById(modeId)
        if (mode) {
          const category = mode.category
          categoryCount[category] = (categoryCount[category] || 0) + 1
          categoryLoss[category] = (categoryLoss[category] || 0) + (trade.pnlAmount || 0)
        }
      })
    }
  })

  return Object.entries(CATEGORY_INFO).map(([id, info]) => ({
    id,
    ...info,
    count: categoryCount[id] || 0,
    totalLoss: categoryLoss[id] || 0
  })).filter(c => c.count > 0).sort((a, b) => b.count - a.count)
})

// Recent analyzed trades
const recentAnalyzedTrades = computed(() => {
  return losingTrades.value
    .filter(t => t.failureModes && t.failureModes.length > 0)
    .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
    .slice(0, 5)
})

// Insights
const insights = computed(() => {
  const insights = []

  if (analysisRate.value < 50) {
    insights.push({
      icon: '⚠️',
      text: `Only ${analysisRate.value}% of losing trades have been analyzed. Consider reviewing more trades.`
    })
  }

  if (topFailureModes.value.length > 0) {
    const topMode = topFailureModes.value[0]
    insights.push({
      icon: '🎯',
      text: `"${topMode.label}" is your most common failure mode (${topMode.count} occurrences).`
    })
  }

  const psychologyCount = categoryBreakdown.value.find(c => c.id === 'psychology')?.count || 0
  const totalModes = categoryBreakdown.value.reduce((sum, c) => sum + c.count, 0)
  if (psychologyCount / totalModes > 0.3) {
    insights.push({
      icon: '🧠',
      text: 'Psychology-related issues account for a significant portion of your failures. Consider working on mental discipline.'
    })
  }

  const entryCount = categoryBreakdown.value.find(c => c.id === 'entry')?.count || 0
  if (entryCount / totalModes > 0.3) {
    insights.push({
      icon: '🚪',
      text: 'Entry timing is a recurring issue. Focus on waiting for better confirmation signals.'
    })
  }

  const exitCount = categoryBreakdown.value.find(c => c.id === 'exit')?.count || 0
  if (exitCount / totalModes > 0.3) {
    insights.push({
      icon: '🎯',
      text: 'Exit management needs improvement. Consider setting clearer profit targets and stop losses.'
    })
  }

  return insights
})

// Helper functions
const formatCurrency = (value) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0
  }).format(value)
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

const getFailureModeIcon = (modeId) => {
  return getFailureModeById(modeId)?.icon || '❓'
}

const getFailureModeLabel = (modeId) => {
  return getFailureModeById(modeId)?.label || modeId
}

const getFailureModeColor = (modeId) => {
  return getFailureModeById(modeId)?.color || '#6b7280'
}

const truncateText = (text, maxLength) => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

// Load trades
onMounted(async() => {
  try {
    isLoading.value = true
    const allTrades = await tradeService.getAllTrades()
    trades.value = allTrades.filter(t => t.exitDate) // Only closed trades
  } catch {
    // Error loading trades
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.failure-analytics {
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

.loading-state,
.empty-state {
  padding: 3rem;
  text-align: center;
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

/* Summary Cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 10px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-icon {
  font-size: 2rem;
  flex-shrink: 0;
}

.card-content {
  flex: 1;
}

.card-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  line-height: 1.2;
}

.card-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Top Failures */
.top-failures-section,
.category-breakdown-section,
.recent-failures-section,
.insights-section {
  background: white;
  border-radius: 10px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.top-failures-section h4,
.category-breakdown-section h4,
.recent-failures-section h4,
.insights-section h4 {
  margin: 0 0 1.25rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.failure-bars {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.failure-bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.failure-bar-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.failure-icon {
  font-size: 1.125rem;
}

.failure-label {
  flex: 1;
  font-weight: 600;
  color: #374151;
}

.failure-count {
  font-size: 0.875rem;
  color: #6b7280;
}

.failure-bar-container {
  height: 12px;
  background: #f3f4f6;
  border-radius: 6px;
  overflow: hidden;
}

.failure-bar-fill {
  height: 100%;
  border-radius: 6px;
  transition: width 0.3s ease;
}

.failure-bar-stats {
  display: flex;
  justify-content: space-between;
  font-size: 0.8125rem;
  color: #6b7280;
}

.stat.loss {
  color: #ef4444;
  font-weight: 600;
}

/* Category Grid */
.category-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.category-card {
  padding: 1rem;
  background: #f9fafb;
  border: 2px solid var(--category-color);
  border-radius: 8px;
  text-align: center;
  transition: transform 0.2s ease;
}

.category-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.category-header {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.category-icon {
  font-size: 2rem;
}

.category-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
}

.category-count {
  font-size: 2rem;
  font-weight: 700;
  color: var(--category-color);
  line-height: 1;
}

.category-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

.category-loss {
  font-size: 0.875rem;
  color: #ef4444;
  font-weight: 600;
  margin-top: 0.5rem;
}

/* Recent Trades */
.recent-trades {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.recent-trade-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border-left: 4px solid #ef4444;
}

.trade-header-row {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.trade-symbol {
  font-weight: 700;
  color: #1f2937;
  font-size: 1.125rem;
}

.trade-date {
  flex: 1;
  color: #6b7280;
  font-size: 0.875rem;
}

.trade-pnl {
  font-weight: 700;
  font-size: 1.125rem;
}

.trade-pnl.loss {
  color: #ef4444;
}

.trade-failure-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.mini-failure-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: white;
  border: 1px solid var(--tag-color);
  color: var(--tag-color);
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.trade-notes {
  font-size: 0.875rem;
  color: #6b7280;
  line-height: 1.4;
  font-style: italic;
}

/* Insights */
.insights-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight-item {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  background: #fefce8;
  border-left: 4px solid #fbbf24;
  border-radius: 6px;
}

.insight-icon {
  font-size: 1.25rem;
  flex-shrink: 0;
}

.insight-text {
  flex: 1;
  color: #78350f;
  line-height: 1.5;
}

@media (max-width: 768px) {
  .failure-analytics {
    padding: 1rem;
  }

  .summary-cards {
    grid-template-columns: repeat(2, 1fr);
  }

  .category-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}
</style>
