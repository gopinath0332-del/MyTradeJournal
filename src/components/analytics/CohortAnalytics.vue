<template>
  <div class="cohort-analytics">
    <div class="analytics-header">
      <h3>
        <span class="icon">📊</span>
        Cohort Analysis: Early vs Recent Performance
      </h3>
      <p class="subtitle">Compare your trading evolution and identify improvement areas</p>
    </div>

    <LoadingSpinner v-if="isLoading" message="Analyzing trading cohorts..." />

    <div v-else-if="!hasData" class="empty-state">
      <div class="empty-icon">📈</div>
      <h4>Insufficient Data</h4>
      <p>Need at least 20 closed trades to perform cohort analysis.</p>
    </div>

    <div v-else class="analytics-content">
      <!-- Overall Trend Indicator -->
      <div class="trend-banner" :class="comparison.overallTrend">
        <div class="trend-icon">
          {{ getTrendIcon(comparison.overallTrend) }}
        </div>
        <div class="trend-content">
          <h4>{{ getTrendTitle(comparison.overallTrend) }}</h4>
          <p>{{ getTrendMessage(comparison.overallTrend) }}</p>
        </div>
        <div class="trend-score">
          <div class="score-label">Trend Score</div>
          <div class="score-value" :class="getScoreClass(comparison.trendScore)">
            {{ comparison.trendScore > 0 ? '+' : '' }}{{ comparison.trendScore }}
          </div>
        </div>
      </div>

      <!-- Cohort Period Cards -->
      <div class="cohort-periods">
        <div class="period-card early">
          <div class="period-header">
            <h4>📅 Early Trades</h4>
            <span class="date-range">
              {{ formatDate(comparison.earlyCohort.startDate) }} -
              {{ formatDate(comparison.earlyCohort.endDate) }}
            </span>
          </div>
          <div class="period-stats">
            <div class="stat-item">
              <span class="stat-label">Total Trades</span>
              <span class="stat-value">{{ comparison.earlyCohort.tradeCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total P&L</span>
              <span class="stat-value" :class="{ positive: comparison.earlyCohort.metrics.totalPnL > 0, negative: comparison.earlyCohort.metrics.totalPnL < 0 }">
                {{ formatCurrency(comparison.earlyCohort.metrics.totalPnL) }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Win Rate</span>
              <span class="stat-value">{{ comparison.earlyCohort.metrics.winRate.toFixed(1) }}%</span>
            </div>
          </div>
        </div>

        <div class="period-card recent">
          <div class="period-header">
            <h4>📅 Recent Trades</h4>
            <span class="date-range">
              {{ formatDate(comparison.recentCohort.startDate) }} -
              {{ formatDate(comparison.recentCohort.endDate) }}
            </span>
          </div>
          <div class="period-stats">
            <div class="stat-item">
              <span class="stat-label">Total Trades</span>
              <span class="stat-value">{{ comparison.recentCohort.tradeCount }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Total P&L</span>
              <span class="stat-value" :class="{ positive: comparison.recentCohort.metrics.totalPnL > 0, negative: comparison.recentCohort.metrics.totalPnL < 0 }">
                {{ formatCurrency(comparison.recentCohort.metrics.totalPnL) }}
              </span>
            </div>
            <div class="stat-item">
              <span class="stat-label">Win Rate</span>
              <span class="stat-value">{{ comparison.recentCohort.metrics.winRate.toFixed(1) }}%</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Key Insights -->
      <div v-if="comparison.keyInsights.length > 0" class="insights-section">
        <h4>💡 Key Insights</h4>
        <div class="insights-grid">
          <div
            v-for="(insight, index) in comparison.keyInsights"
            :key="index"
            class="insight-card"
          >
            {{ insight }}
          </div>
        </div>
      </div>

      <!-- Metric Comparisons -->
      <div class="metrics-comparison">
        <h4>📊 Detailed Metric Comparison</h4>

        <!-- Improvements -->
        <div v-if="comparison.improvements.length > 0" class="metric-category improvements">
          <h5>✅ Improvements</h5>
          <div class="metrics-grid">
            <div
              v-for="metric in comparison.improvements"
              :key="metric.name"
              class="metric-card"
              :class="metric.significance"
            >
              <div class="metric-header">
                <span class="metric-icon">{{ metric.icon }}</span>
                <span class="metric-name">{{ metric.name }}</span>
                <span class="significance-badge" :class="metric.significance">
                  {{ metric.significance }}
                </span>
              </div>
              <div class="metric-values">
                <div class="value-row">
                  <span class="value-label">Early:</span>
                  <span class="value-amount">
                    {{ formatMetricValue(metric.earlyValue, metric.unit) }}
                  </span>
                </div>
                <div class="value-row">
                  <span class="value-label">Recent:</span>
                  <span class="value-amount">
                    {{ formatMetricValue(metric.recentValue, metric.unit) }}
                  </span>
                </div>
              </div>
              <div class="metric-change improvement">
                <span class="change-arrow">↑</span>
                <span class="change-value">
                  {{ formatMetricValue(Math.abs(metric.change), metric.unit) }}
                  ({{ Math.abs(metric.changePercent).toFixed(1) }}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Deteriorations -->
        <div v-if="comparison.deteriorations.length > 0" class="metric-category deteriorations">
          <h5>⚠️ Areas Needing Attention</h5>
          <div class="metrics-grid">
            <div
              v-for="metric in comparison.deteriorations"
              :key="metric.name"
              class="metric-card"
              :class="metric.significance"
            >
              <div class="metric-header">
                <span class="metric-icon">{{ metric.icon }}</span>
                <span class="metric-name">{{ metric.name }}</span>
                <span class="significance-badge" :class="metric.significance">
                  {{ metric.significance }}
                </span>
              </div>
              <div class="metric-values">
                <div class="value-row">
                  <span class="value-label">Early:</span>
                  <span class="value-amount">
                    {{ formatMetricValue(metric.earlyValue, metric.unit) }}
                  </span>
                </div>
                <div class="value-row">
                  <span class="value-label">Recent:</span>
                  <span class="value-amount">
                    {{ formatMetricValue(metric.recentValue, metric.unit) }}
                  </span>
                </div>
              </div>
              <div class="metric-change deterioration">
                <span class="change-arrow">↓</span>
                <span class="change-value">
                  {{ formatMetricValue(Math.abs(metric.change), metric.unit) }}
                  ({{ Math.abs(metric.changePercent).toFixed(1) }}%)
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Stable Metrics -->
        <div v-if="comparison.stableMetrics.length > 0" class="metric-category stable">
          <h5>➡️ Stable Metrics</h5>
          <div class="stable-metrics-list">
            <span
              v-for="metric in comparison.stableMetrics"
              :key="metric.name"
              class="stable-metric-tag"
            >
              {{ metric.icon }} {{ metric.name }}
            </span>
          </div>
        </div>
      </div>

      <!-- Performance Evolution Chart -->
      <div class="evolution-chart">
        <h4>📈 Performance Evolution</h4>
        <div class="comparison-bars">
          <div class="bar-group">
            <div class="bar-label">Win Rate</div>
            <div class="bars-container">
              <div class="bar early" :style="{ width: `${comparison.earlyCohort.metrics.winRate}%` }">
                <span class="bar-value">{{ comparison.earlyCohort.metrics.winRate.toFixed(1) }}%</span>
              </div>
              <div class="bar recent" :style="{ width: `${comparison.recentCohort.metrics.winRate}%` }">
                <span class="bar-value">{{ comparison.recentCohort.metrics.winRate.toFixed(1) }}%</span>
              </div>
            </div>
          </div>

          <div class="bar-group">
            <div class="bar-label">Profit Factor</div>
            <div class="bars-container">
              <div class="bar early" :style="{ width: `${Math.min(comparison.earlyCohort.metrics.profitFactor * 25, 100)}%` }">
                <span class="bar-value">{{ comparison.earlyCohort.metrics.profitFactor.toFixed(2) }}</span>
              </div>
              <div class="bar recent" :style="{ width: `${Math.min(comparison.recentCohort.metrics.profitFactor * 25, 100)}%` }">
                <span class="bar-value">{{ comparison.recentCohort.metrics.profitFactor.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="bar-group">
            <div class="bar-label">Risk-Reward</div>
            <div class="bars-container">
              <div class="bar early" :style="{ width: `${Math.min(comparison.earlyCohort.metrics.riskRewardRatio * 33, 100)}%` }">
                <span class="bar-value">{{ comparison.earlyCohort.metrics.riskRewardRatio.toFixed(2) }}</span>
              </div>
              <div class="bar recent" :style="{ width: `${Math.min(comparison.recentCohort.metrics.riskRewardRatio * 33, 100)}%` }">
                <span class="bar-value">{{ comparison.recentCohort.metrics.riskRewardRatio.toFixed(2) }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="chart-legend">
          <span class="legend-item">
            <span class="legend-color early" />
            Early Trades
          </span>
          <span class="legend-item">
            <span class="legend-color recent" />
            Recent Trades
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { tradeService } from '@/firebase/tradeService'
import { splitTradeCohorts, compareCohorts } from '@/types/cohort'
import LoadingSpinner from '../ui/LoadingSpinner.vue'
import { useProfiles } from '@/composables/useProfiles'

const { currencySymbol } = useProfiles()
const currencyMap = {
  '$': 'USD',
  '₹': 'INR',
  '€': 'EUR',
  '£': 'GBP',
  '¥': 'JPY'
}
const currencyCode = computed(() => currencyMap[currencySymbol.value] || 'INR')

const isLoading = ref(true)
const trades = ref([])

const hasData = computed(() => trades.value.length >= 20)

const comparison = computed(() => {
  if (!hasData.value) return null

  const { early, recent } = splitTradeCohorts(trades.value, { method: 'equal' })
  return compareCohorts(early, recent)
})

// Helper functions
const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode.value,
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

const formatMetricValue = (value, unit) => {
  if (unit === '₹' || unit === 'currency') {
    return formatCurrency(value)
  } else if (unit === '%') {
    return `${value.toFixed(1)}%`
  } else if (unit === '/month') {
    return `${value.toFixed(1)}/mo`
  }
  return value.toFixed(2)
}

const getTrendIcon = (trend) => {
  return trend === 'improving' ? '📈' : trend === 'declining' ? '📉' : '➡️'
}

const getTrendTitle = (trend) => {
  return trend === 'improving' ? 'Performance Improving!' :
         trend === 'declining' ? 'Performance Declining' :
         'Stable Performance'
}

const getTrendMessage = (trend) => {
  return trend === 'improving'
    ? 'Your recent trades show measurable improvement across key metrics.'
    : trend === 'declining'
    ? 'Recent performance shows decline. Review your strategy and risk management.'
    : 'Your performance is consistent. Look for optimization opportunities.'
}

const getScoreClass = (score) => {
  if (score > 20) return 'excellent'
  if (score > 10) return 'good'
  if (score > -10) return 'neutral'
  if (score > -20) return 'caution'
  return 'warning'
}

// Load trades
onMounted(async() => {
  try {
    isLoading.value = true
    const allTrades = await tradeService.getAllTrades()

    // Filter closed trades with P&L data
    trades.value = allTrades
      .filter(t => t.exitDate && t.pnlAmount !== undefined)
      .sort((a, b) => new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime())
  } catch {
    trades.value = []
  } finally {
    isLoading.value = false
  }
})
</script>

<style scoped>
.cohort-analytics {
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

/* Trend Banner */
.trend-banner {
  display: flex;
  align-items: center;
  gap: 1.5rem;
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 2rem;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.trend-banner.improving {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.trend-banner.declining {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.trend-banner.stable {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.trend-icon {
  font-size: 3rem;
}

.trend-content {
  flex: 1;
}

.trend-content h4 {
  margin: 0 0 0.25rem 0;
  color: #1f2937;
  font-size: 1.25rem;
}

.trend-content p {
  margin: 0;
  color: #374151;
  font-size: 0.875rem;
}

.trend-score {
  text-align: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.5);
  border-radius: 8px;
}

.score-label {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.score-value {
  font-size: 2rem;
  font-weight: 700;
}

.score-value.excellent {
  color: #059669;
}

.score-value.good {
  color: #10b981;
}

.score-value.neutral {
  color: #6b7280;
}

.score-value.caution {
  color: #f59e0b;
}

.score-value.warning {
  color: #ef4444;
}

/* Cohort Periods */
.cohort-periods {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.period-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.period-card.early {
  border-left: 4px solid #3b82f6;
}

.period-card.recent {
  border-left: 4px solid #10b981;
}

.period-header h4 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.date-range {
  font-size: 0.75rem;
  color: #6b7280;
}

.period-stats {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-top: 1rem;
}

.stat-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
}

.stat-label {
  font-size: 0.875rem;
  color: #6b7280;
}

.stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-value.positive {
  color: #10b981;
}

.stat-value.negative {
  color: #ef4444;
}

/* Insights */
.insights-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.insights-section h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.insights-grid {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.insight-card {
  padding: 1rem;
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border-radius: 8px;
  font-size: 0.875rem;
  color: #78350f;
  font-weight: 500;
}

/* Metrics Comparison */
.metrics-comparison {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.metrics-comparison > h4 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.metric-category {
  margin-bottom: 2rem;
}

.metric-category:last-child {
  margin-bottom: 0;
}

.metric-category h5 {
  margin: 0 0 1rem 0;
  color: #374151;
  font-size: 1rem;
  font-weight: 600;
}

.metrics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.metric-card {
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  background: #f9fafb;
}

.metric-card.high {
  border-color: #f59e0b;
  background: #fffbeb;
}

.metric-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.metric-icon {
  font-size: 1.25rem;
}

.metric-name {
  flex: 1;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.significance-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
}

.significance-badge.high {
  background: #fef3c7;
  color: #92400e;
}

.significance-badge.medium {
  background: #dbeafe;
  color: #1e40af;
}

.significance-badge.low {
  background: #e5e7eb;
  color: #6b7280;
}

.metric-values {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.value-row {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.value-label {
  color: #6b7280;
}

.value-amount {
  font-weight: 600;
  color: #1f2937;
}

.metric-change {
  padding: 0.5rem;
  border-radius: 6px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
}

.metric-change.improvement {
  background: #d1fae5;
  color: #065f46;
}

.metric-change.deterioration {
  background: #fee2e2;
  color: #991b1b;
}

.change-arrow {
  font-size: 1.125rem;
}

/* Stable Metrics */
.stable-metrics-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.stable-metric-tag {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #374151;
}

/* Evolution Chart */
.evolution-chart {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.evolution-chart h4 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.comparison-bars {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 1rem;
}

.bar-group {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.bar-label {
  width: 120px;
  font-weight: 600;
  color: #374151;
  font-size: 0.875rem;
}

.bars-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.bar {
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  padding: 0 0.75rem;
  min-width: 60px;
  transition: width 0.3s ease;
}

.bar.early {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}

.bar.recent {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.bar-value {
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
}

.chart-legend {
  display: flex;
  gap: 2rem;
  justify-content: center;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
}

.legend-color {
  width: 24px;
  height: 12px;
  border-radius: 4px;
}

.legend-color.early {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}

.legend-color.recent {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

@media (max-width: 768px) {
  .cohort-analytics {
    padding: 1rem;
  }

  .trend-banner {
    flex-direction: column;
    text-align: center;
  }

  .cohort-periods {
    grid-template-columns: 1fr;
  }

  .metrics-grid {
    grid-template-columns: 1fr;
  }

  .bar-group {
    flex-direction: column;
    align-items: stretch;
  }

  .bar-label {
    width: auto;
  }
}
</style>
