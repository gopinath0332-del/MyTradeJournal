<template>
  <div class="psychology-analytics">
    <div class="analytics-header">
      <h3 class="analytics-title">Psychology & Mindset Correlation</h3>
      <p class="analytics-subtitle">Analyze how your emotional state impacts your trading P&L</p>
    </div>

    <LoadingSpinner
      v-if="isLoading"
      message="Analyzing psychological patterns..."
      size="large"
      full-height
    />

    <EmptyState
      v-else-if="trades.length === 0"
      icon="🧠"
      title="No psychology data"
      message="Start tagging your trades with mindset labels to see correlations"
      :full-height="true"
    />

    <div v-else class="analytics-content">
      <!-- P&L by Mindset Chart -->
      <section class="chart-section">
        <div class="section-header">
          <h4>Total P&L by Mindset</h4>
          <span class="section-hint">Which emotional state leads to the highest returns?</span>
        </div>
        <HorizontalBarChart
          :data="psychologyChartData"
          :show-rank="true"
          :value-formatter="formatCurrency"
          no-data-message="No mindset tags found in your trades"
        />
      </section>

      <!-- Metrics Grid -->
      <div class="metrics-grid">
        <div v-if="topMindset" class="metric-card success">
          <div class="metric-icon">🌟</div>
          <div class="metric-info">
            <span class="metric-label">Most Profitable Mindset</span>
            <span class="metric-value">{{ topMindset.name }}</span>
            <span class="metric-detail">Total: {{ formatCurrency(topMindset.value) }}</span>
          </div>
        </div>
        <div v-if="bottomMindset" class="metric-card danger">
          <div class="metric-icon">⚠️</div>
          <div class="metric-info">
            <span class="metric-label">Psychological Leak</span>
            <span class="metric-value">{{ bottomMindset.name }}</span>
            <span class="metric-detail">Total: {{ formatCurrency(bottomMindset.value) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { provide } from 'vue'
import type { Trade } from '@/types'
import HorizontalBarChart from '../charts/HorizontalBarChart.vue'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import EmptyState from '../ui/EmptyState.vue'
import { useProfiles } from '@/composables/useProfiles'

const props = defineProps<{
  trades: Trade[]
  isLoading?: boolean
}>()

const { currencySymbol } = useProfiles()

const formatCurrency = (value: number) => {
  const currencyMap: Record<string, string> = {
    '₹': 'INR',
    '$': 'USD',
    '€': 'EUR',
    '£': 'GBP',
    '¥': 'JPY'
  }
  const currency = currencyMap[currencySymbol.value] || 'INR'
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value)
}

const psychologyData = computed(() => {
  const mindsetMap: Record<string, { pnl: number; count: number; wins: number }> = {}

  props.trades.forEach(trade => {
    if (!trade.mindset) return

    const m = trade.mindset
    if (!mindsetMap[m]) {
      mindsetMap[m] = { pnl: 0, count: 0, wins: 0 }
    }

    mindsetMap[m].pnl += trade.pnlAmount || 0
    mindsetMap[m].count += 1
    if (trade.pnlAmount && trade.pnlAmount > 0) {
      mindsetMap[m].wins += 1
    }
  })

  return mindsetMap
})

const psychologyChartData = computed(() => {
  const data = Object.entries(psychologyData.value).map(([name, stats]) => {
    const winRate = ((stats.wins / stats.count) * 100).toFixed(1)
    const avgPnL = stats.pnl / stats.count

    return {
      id: name,
      name,
      value: stats.pnl,
      subtitle: `Win Rate: ${winRate}% | Avg P&L: ${formatCurrency(avgPnL)}`,
      tooltip: `${name}: Total P&L ${formatCurrency(stats.pnl)} (${stats.count} trades)`
    }
  })

  return data.sort((a, b) => b.value - a.value)
})

const topMindset = computed(() => psychologyChartData.value[0] || null)
const bottomMindset = computed(() => {
  const sorted = [...psychologyChartData.value].sort((a, b) => a.value - b.value)
  return sorted[0] || null
})
</script>

<style scoped>
.psychology-analytics {
  margin: 2rem 0;
  padding: 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  border: 1px solid #e5e7eb;
}

.analytics-header {
  margin-bottom: 2rem;
}

.analytics-title {
  margin: 0;
  font-size: 1.5rem;
  color: #1f2937;
  font-weight: 700;
}

.analytics-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.chart-section {
  background: #f9fafb;
  padding: 1.5rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.section-header h4 {
  margin: 0;
  font-size: 1.125rem;
  color: #374151;
  font-weight: 600;
}

.section-hint {
  font-size: 0.75rem;
  color: #6b7280;
  font-style: italic;
}

.metrics-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 768px) {
  .metrics-grid {
    grid-template-columns: 1fr;
  }
}

.metric-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.25rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
}

.metric-icon {
  font-size: 1.5rem;
}

.metric-info {
  display: flex;
  flex-direction: column;
}

.metric-label {
  font-size: 0.75rem;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 600;
  letter-spacing: 0.025em;
}

.metric-value {
  font-size: 1.125rem;
  font-weight: 700;
  color: #111827;
}

.metric-detail {
  font-size: 0.875rem;
  color: #6b7280;
}

.metric-card.success {
  background-color: #f0fdf4;
  border-color: #bbf7d0;
}

.metric-card.danger {
  background-color: #fef2f2;
  border-color: #fecaca;
}
</style>
