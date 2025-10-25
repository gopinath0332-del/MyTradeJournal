<template>
  <div class="notes-nlp">
    <div class="analytics-header">
      <h3>
        <span class="icon">💬</span>
        Trade Notes NLP Analysis
      </h3>
      <p class="subtitle">Natural language processing insights from your trading notes</p>
    </div>

    <LoadingSpinner v-if="isLoading" message="Analyzing trade notes..." />

    <div v-else-if="!hasData" class="empty-state">
      <div class="empty-icon">📝</div>
      <h4>No Trade Notes Available</h4>
      <p>Start adding notes to your trades to get NLP insights about your trading psychology and patterns.</p>
    </div>

    <div v-else-if="analysis" class="analytics-content">
      <!-- Overall Metrics -->
      <div class="metrics-overview">
        <div class="metric-card">
          <div class="metric-icon">📊</div>
          <div class="metric-content">
            <div class="metric-label">Notes Analyzed</div>
            <div class="metric-value">{{ analysis.notesWithContent }} / {{ analysis.totalNotes }}</div>
            <div class="metric-info">{{ coveragePercent }}% coverage</div>
          </div>
        </div>

        <div class="metric-card sentiment" :class="analysis.overallSentiment.type">
          <div class="metric-icon">{{ getSentimentIcon(analysis.overallSentiment.type) }}</div>
          <div class="metric-content">
            <div class="metric-label">Overall Sentiment</div>
            <div class="metric-value">{{ getSentimentLabel(analysis.overallSentiment.type) }}</div>
            <div class="metric-info">{{ (analysis.overallSentiment.overall * 100).toFixed(0) }}% score</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">📏</div>
          <div class="metric-content">
            <div class="metric-label">Avg Note Length</div>
            <div class="metric-value">{{ Math.round(analysis.avgNoteLength) }}</div>
            <div class="metric-info">characters</div>
          </div>
        </div>

        <div class="metric-card">
          <div class="metric-icon">🎯</div>
          <div class="metric-content">
            <div class="metric-label">Actionable Notes</div>
            <div class="metric-value">{{ actionablePercent }}%</div>
            <div class="metric-info">{{ actionableCount }} notes</div>
          </div>
        </div>
      </div>

      <!-- Key Insights -->
      <div v-if="analysis.insights.length > 0" class="insights-section">
        <h4>💡 Key Insights</h4>
        <div class="insights-grid">
          <div
            v-for="(insight, index) in analysis.insights"
            :key="index"
            class="insight-card"
            :class="[insight.type, insight.impact]"
          >
            <div class="insight-header">
              <span class="insight-icon">{{ getInsightIcon(insight.type) }}</span>
              <span class="insight-impact">{{ insight.impact.toUpperCase() }}</span>
            </div>
            <h5>{{ insight.title }}</h5>
            <p>{{ insight.description }}</p>
            <div v-if="insight.evidence" class="insight-evidence">
              <span v-if="insight.evidence.tradeCount">{{ insight.evidence.tradeCount }} trades</span>
              <span v-if="insight.evidence.winRate">{{ insight.evidence.winRate.toFixed(1) }}% win rate</span>
              <span v-if="insight.evidence.avgPnL">Avg: {{ formatCurrency(insight.evidence.avgPnL) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Discipline Scorecard -->
      <div class="discipline-section">
        <h4>🎯 Discipline Scorecard</h4>
        <div class="discipline-grid">
          <div class="discipline-card">
            <div class="discipline-header">
              <span class="discipline-label">Plan Following</span>
              <span class="discipline-score" :class="getScoreClass(analysis.discipline.planFollowingScore)">
                {{ analysis.discipline.planFollowingScore }}
              </span>
            </div>
            <div class="discipline-bar">
              <div
                class="discipline-fill"
                :class="getScoreClass(analysis.discipline.planFollowingScore)"
                :style="{ width: `${analysis.discipline.planFollowingScore}%` }"
              />
            </div>
          </div>

          <div class="discipline-card">
            <div class="discipline-header">
              <span class="discipline-label">Emotional Control</span>
              <span class="discipline-score" :class="getScoreClass(analysis.discipline.emotionalControlScore)">
                {{ analysis.discipline.emotionalControlScore }}
              </span>
            </div>
            <div class="discipline-bar">
              <div
                class="discipline-fill"
                :class="getScoreClass(analysis.discipline.emotionalControlScore)"
                :style="{ width: `${analysis.discipline.emotionalControlScore}%` }"
              />
            </div>
          </div>

          <div class="discipline-card">
            <div class="discipline-header">
              <span class="discipline-label">Reflection Quality</span>
              <span class="discipline-score" :class="getScoreClass(analysis.discipline.reflectionQuality)">
                {{ analysis.discipline.reflectionQuality }}
              </span>
            </div>
            <div class="discipline-bar">
              <div
                class="discipline-fill"
                :class="getScoreClass(analysis.discipline.reflectionQuality)"
                :style="{ width: `${analysis.discipline.reflectionQuality}%` }"
              />
            </div>
          </div>

          <div class="discipline-stats">
            <div class="stat-item positive">
              <span class="stat-icon">✅</span>
              <span class="stat-label">Positive Reinforcement</span>
              <span class="stat-value">{{ analysis.discipline.positiveReinforcement }}</span>
            </div>
            <div class="stat-item negative">
              <span class="stat-icon">⚠️</span>
              <span class="stat-label">Negative Patterns</span>
              <span class="stat-value">{{ analysis.discipline.negativePatterns }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-icon">💡</span>
              <span class="stat-label">Actionable Insights</span>
              <span class="stat-value">{{ analysis.discipline.actionableInsights }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Emotional Patterns -->
      <div v-if="analysis.emotionalPatterns.length > 0" class="emotions-section">
        <h4>😊 Emotional Patterns</h4>
        <div class="emotions-grid">
          <div
            v-for="pattern in analysis.emotionalPatterns"
            :key="pattern.emotion"
            class="emotion-card"
          >
            <div class="emotion-header">
              <span class="emotion-icon">{{ getEmotionIcon(pattern.emotion) }}</span>
              <span class="emotion-name">{{ capitalizeFirst(pattern.emotion) }}</span>
            </div>
            <div class="emotion-stats">
              <div class="emotion-stat">
                <span class="stat-label">Frequency</span>
                <span class="stat-value">{{ pattern.frequency }}</span>
              </div>
              <div class="emotion-stat">
                <span class="stat-label">Win Rate</span>
                <span class="stat-value" :class="{ positive: pattern.winRate > 50, negative: pattern.winRate < 50 }">
                  {{ pattern.winRate.toFixed(1) }}%
                </span>
              </div>
              <div class="emotion-stat">
                <span class="stat-label">Avg P&L</span>
                <span class="stat-value" :class="{ positive: pattern.avgPnL > 0, negative: pattern.avgPnL < 0 }">
                  {{ formatCurrency(pattern.avgPnL) }}
                </span>
              </div>
            </div>
            <div class="emotion-description">{{ pattern.description }}</div>
          </div>
        </div>
      </div>

      <!-- Top Keywords -->
      <div v-if="analysis.topKeywords.length > 0" class="keywords-section">
        <h4>🔤 Top Keywords</h4>
        <div class="keywords-cloud">
          <div
            v-for="keyword in topKeywordsToShow"
            :key="keyword.word"
            class="keyword-tag"
            :class="getKeywordClass(keyword)"
            :style="{ fontSize: getKeywordSize(keyword) }"
            :title="`${keyword.count} mentions, ${keyword.winRate.toFixed(1)}% win rate`"
          >
            {{ keyword.word }}
          </div>
        </div>
        <div class="keywords-table">
          <table>
            <thead>
              <tr>
                <th>Keyword</th>
                <th>Count</th>
                <th>Win Rate</th>
                <th>Sentiment</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="keyword in analysis.topKeywords.slice(0, 15)" :key="keyword.word">
                <td class="keyword-name">{{ keyword.word }}</td>
                <td>{{ keyword.count }}</td>
                <td :class="{ positive: keyword.winRate > 50, negative: keyword.winRate < 50 }">
                  {{ keyword.winRate.toFixed(1) }}%
                </td>
                <td :class="getSentimentClass(keyword.sentiment)">
                  {{ (keyword.sentiment * 100).toFixed(0) }}%
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Sentiment Trend -->
      <div v-if="analysis.sentimentTrend.length > 1" class="sentiment-trend-section">
        <h4>📈 Sentiment Over Time</h4>
        <div class="trend-chart">
          <svg
            ref="trendSvg"
            class="trend-svg"
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          >
            <!-- Grid -->
            <g class="grid">
              <line
                v-for="i in 5"
                :key="`h-${i}`"
                :x1="chartPadding"
                :y1="chartPadding + (chartHeight - 2 * chartPadding) / 4 * (i - 1)"
                :x2="chartWidth - chartPadding"
                :y2="chartPadding + (chartHeight - 2 * chartPadding) / 4 * (i - 1)"
                stroke="#e5e7eb"
                stroke-width="1"
              />
            </g>

            <!-- Sentiment line -->
            <path
              :d="sentimentPath"
              fill="none"
              stroke="#3b82f6"
              stroke-width="2"
            />

            <!-- Data points -->
            <circle
              v-for="(point, index) in analysis.sentimentTrend"
              :key="index"
              :cx="getChartX(index)"
              :cy="getSentimentY(point.sentiment)"
              r="4"
              :fill="getSentimentColor(point.sentiment)"
            />
          </svg>
        </div>
        <div class="correlation-info">
          <strong>{{ analysis.sentimentVsPerformance.description }}</strong>
          <span class="correlation-score">
            Correlation: {{ (analysis.sentimentVsPerformance.correlation * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { tradeService } from '@/firebase/tradeService'
import { analyzeTradeNotes } from '@/types/nlp'
import type { NLPAnalysis, EmotionalState } from '@/types/nlp'
import LoadingSpinner from '../ui/LoadingSpinner.vue'

const isLoading = ref(false)
const analysis = ref<NLPAnalysis | null>(null)

// Chart dimensions
const chartWidth = 800
const chartHeight = 300
const chartPadding = 40

// Computed properties
const hasData = computed(() => {
  return analysis.value && analysis.value.notesWithContent > 0
})

const coveragePercent = computed(() => {
  if (!analysis.value) return 0
  return Math.round((analysis.value.notesWithContent / analysis.value.totalNotes) * 100)
})

const actionableCount = computed(() => {
  if (!analysis.value) return 0
  return analysis.value.sentimentByTrade.filter(s => s.hasAction).length
})

const actionablePercent = computed(() => {
  if (!analysis.value || analysis.value.notesWithContent === 0) return 0
  return Math.round((actionableCount.value / analysis.value.notesWithContent) * 100)
})

const topKeywordsToShow = computed(() => {
  return analysis.value?.topKeywords.slice(0, 30) || []
})

const sentimentPath = computed(() => {
  if (!analysis.value || analysis.value.sentimentTrend.length < 2) return ''

  const points = analysis.value.sentimentTrend.map((point, index) => {
    const x = getChartX(index)
    const y = getSentimentY(point.sentiment)
    return `${x},${y}`
  })

  return `M ${points.join(' L ')}`
})

// Helper functions
function getSentimentIcon(type: string): string {
  const icons: Record<string, string> = {
    positive: '😊',
    negative: '😟',
    neutral: '😐',
    mixed: '🤔'
  }
  return icons[type] || '😐'
}

function getSentimentLabel(type: string): string {
  const labels: Record<string, string> = {
    positive: 'Positive',
    negative: 'Negative',
    neutral: 'Neutral',
    mixed: 'Mixed'
  }
  return labels[type] || 'Neutral'
}

function getInsightIcon(type: string): string {
  const icons: Record<string, string> = {
    warning: '⚠️',
    tip: '💡',
    pattern: '🔍',
    correlation: '📊'
  }
  return icons[type] || '💡'
}

function getEmotionIcon(emotion: EmotionalState): string {
  const icons: Record<EmotionalState, string> = {
    confident: '💪',
    fearful: '😰',
    greedy: '🤑',
    disciplined: '🎯',
    frustrated: '😤',
    calm: '😌',
    excited: '🤩',
    anxious: '😟'
  }
  return icons[emotion] || '😐'
}

function getScoreClass(score: number): string {
  if (score >= 70) return 'excellent'
  if (score >= 50) return 'good'
  if (score >= 30) return 'fair'
  return 'poor'
}

function getSentimentClass(sentiment: number): string {
  if (sentiment > 0.3) return 'positive'
  if (sentiment < -0.3) return 'negative'
  return 'neutral'
}

function getKeywordClass(keyword: { winRate: number; sentiment: number }): string {
  if (keyword.winRate > 70) return 'high-win'
  if (keyword.winRate < 30) return 'low-win'
  if (keyword.sentiment > 0.3) return 'positive-sentiment'
  if (keyword.sentiment < -0.3) return 'negative-sentiment'
  return 'neutral'
}

function getKeywordSize(keyword: { count: number }): string {
  const maxCount = analysis.value?.topKeywords[0]?.count || 1
  const ratio = keyword.count / maxCount
  const minSize = 0.8
  const maxSize = 2
  const size = minSize + (maxSize - minSize) * ratio
  return `${size}rem`
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

function getChartX(index: number): number {
  if (!analysis.value) return 0
  const dataCount = analysis.value.sentimentTrend.length
  const chartRange = chartWidth - 2 * chartPadding
  return chartPadding + (index / (dataCount - 1)) * chartRange
}

function getSentimentY(sentiment: number): number {
  // Map sentiment from -1 to 1 to chart coordinates
  const chartRange = chartHeight - 2 * chartPadding
  const normalized = (sentiment + 1) / 2 // Convert to 0-1 range
  return chartHeight - chartPadding - normalized * chartRange
}

function getSentimentColor(sentiment: number): string {
  if (sentiment > 0.3) return '#10b981'
  if (sentiment < -0.3) return '#ef4444'
  return '#6b7280'
}

// Load analysis
const loadAnalysis = async() => {
  isLoading.value = true
  try {
    const trades = await tradeService.getAllTrades()
    const closedTrades = trades.filter(t => t.exitDate !== undefined && t.exitDate !== null)
    analysis.value = analyzeTradeNotes(closedTrades)
  } catch {
    // Error analyzing trade notes
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadAnalysis()
})
</script>

<style scoped>
.notes-nlp {
  padding: 1.5rem;
}

.analytics-header {
  margin-bottom: 2rem;
}

.analytics-header h3 {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.icon {
  font-size: 2rem;
}

.subtitle {
  color: #6b7280;
  font-size: 0.95rem;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h4 {
  font-size: 1.25rem;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #6b7280;
  max-width: 500px;
  margin: 0 auto;
}

.analytics-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* Metrics Overview */
.metrics-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1.5rem;
}

.metric-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  gap: 1rem;
}

.metric-card.sentiment.positive {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.metric-card.sentiment.negative {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.metric-card.sentiment.neutral {
  background: linear-gradient(135deg, #f3f4f6 0%, #e5e7eb 100%);
}

.metric-icon {
  font-size: 2.5rem;
}

.metric-content {
  flex: 1;
}

.metric-label {
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.25rem;
}

.metric-value {
  font-size: 1.75rem;
  font-weight: 700;
  color: #1f2937;
}

.metric-info {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.25rem;
}

/* Insights Section */
.insights-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.insights-section h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.insights-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.insight-card {
  padding: 1.25rem;
  border-radius: 10px;
  border: 2px solid #e5e7eb;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.insight-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.insight-card.warning {
  background: #fef3c7;
  border-color: #fbbf24;
}

.insight-card.tip {
  background: #dbeafe;
  border-color: #3b82f6;
}

.insight-card.pattern {
  background: #e9d5ff;
  border-color: #a855f7;
}

.insight-card.correlation {
  background: #d1fae5;
  border-color: #10b981;
}

.insight-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.insight-icon {
  font-size: 1.5rem;
}

.insight-impact {
  font-size: 0.75rem;
  font-weight: 700;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: rgba(0, 0, 0, 0.1);
}

.insight-card.high .insight-impact {
  background: #dc2626;
  color: white;
}

.insight-card h5 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
}

.insight-card p {
  font-size: 0.875rem;
  color: #374151;
  margin: 0 0 0.75rem 0;
  line-height: 1.5;
}

.insight-evidence {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  font-size: 0.8rem;
  color: #6b7280;
}

/* Discipline Section */
.discipline-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.discipline-section h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.discipline-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
}

.discipline-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.discipline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
}

.discipline-label {
  font-weight: 600;
  color: #374151;
}

.discipline-score {
  font-size: 1.5rem;
  font-weight: 700;
}

.discipline-score.excellent {
  color: #10b981;
}

.discipline-score.good {
  color: #3b82f6;
}

.discipline-score.fair {
  color: #f59e0b;
}

.discipline-score.poor {
  color: #ef4444;
}

.discipline-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.discipline-fill {
  height: 100%;
  transition: width 0.3s ease;
  border-radius: 4px;
}

.discipline-fill.excellent {
  background: linear-gradient(90deg, #10b981 0%, #059669 100%);
}

.discipline-fill.good {
  background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
}

.discipline-fill.fair {
  background: linear-gradient(90deg, #f59e0b 0%, #d97706 100%);
}

.discipline-fill.poor {
  background: linear-gradient(90deg, #ef4444 0%, #dc2626 100%);
}

.discipline-stats {
  grid-column: 1 / -1;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-top: 0.5rem;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  background: white;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
}

.stat-item.positive {
  border-color: #10b981;
  background: #d1fae5;
}

.stat-item.negative {
  border-color: #ef4444;
  background: #fee2e2;
}

.stat-icon {
  font-size: 1.5rem;
}

.stat-label {
  flex: 1;
  font-size: 0.875rem;
  color: #374151;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

/* Emotions Section */
.emotions-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.emotions-section h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.emotions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: 1rem;
}

.emotion-card {
  padding: 1.25rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 10px;
  transition: transform 0.2s ease;
}

.emotion-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.emotion-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.emotion-icon {
  font-size: 2rem;
}

.emotion-name {
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
}

.emotion-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.emotion-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.emotion-stat .stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.emotion-stat .stat-value {
  font-size: 1rem;
  font-weight: 700;
  color: #1f2937;
}

.emotion-description {
  font-size: 0.875rem;
  color: #6b7280;
  font-style: italic;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
}

/* Keywords Section */
.keywords-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.keywords-section h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.keywords-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 2rem;
  padding: 1.5rem;
  background: #f9fafb;
  border-radius: 8px;
}

.keyword-tag {
  padding: 0.5rem 1rem;
  border-radius: 20px;
  font-weight: 600;
  transition: transform 0.2s ease;
  cursor: default;
}

.keyword-tag:hover {
  transform: scale(1.1);
}

.keyword-tag.high-win {
  background: #d1fae5;
  color: #065f46;
  border: 2px solid #10b981;
}

.keyword-tag.low-win {
  background: #fee2e2;
  color: #991b1b;
  border: 2px solid #ef4444;
}

.keyword-tag.positive-sentiment {
  background: #dbeafe;
  color: #1e40af;
  border: 2px solid #3b82f6;
}

.keyword-tag.negative-sentiment {
  background: #fef3c7;
  color: #92400e;
  border: 2px solid #f59e0b;
}

.keyword-tag.neutral {
  background: #f3f4f6;
  color: #374151;
  border: 2px solid #d1d5db;
}

.keywords-table {
  overflow-x: auto;
}

.keywords-table table {
  width: 100%;
  border-collapse: collapse;
}

.keywords-table th {
  text-align: left;
  padding: 0.75rem;
  background: #f9fafb;
  font-weight: 600;
  color: #374151;
  border-bottom: 2px solid #e5e7eb;
}

.keywords-table td {
  padding: 0.75rem;
  border-bottom: 1px solid #e5e7eb;
}

.keyword-name {
  font-weight: 600;
  color: #1f2937;
}

/* Sentiment Trend Section */
.sentiment-trend-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.sentiment-trend-section h4 {
  margin: 0 0 1.5rem 0;
  font-size: 1.25rem;
  color: #1f2937;
}

.trend-chart {
  margin-bottom: 1rem;
}

.trend-svg {
  width: 100%;
  height: auto;
}

.correlation-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  font-size: 0.875rem;
}

.correlation-score {
  font-weight: 700;
  color: #3b82f6;
}

/* Utility classes */
.positive {
  color: #10b981;
}

.negative {
  color: #ef4444;
}

.neutral {
  color: #6b7280;
}

/* Mobile Responsive */
@media (max-width: 768px) {
  .notes-nlp {
    padding: 1rem;
  }

  .analytics-header h3 {
    font-size: 1.5rem;
  }

  .metrics-overview {
    grid-template-columns: 1fr;
    gap: 1rem;
  }

  .insights-grid {
    grid-template-columns: 1fr;
  }

  .discipline-grid {
    grid-template-columns: 1fr;
  }

  .emotions-grid {
    grid-template-columns: 1fr;
  }

  .keywords-cloud {
    padding: 1rem;
  }

  .keyword-tag {
    font-size: 0.875rem;
    padding: 0.375rem 0.75rem;
  }
}

@media (max-width: 480px) {
  .notes-nlp {
    padding: 0.75rem;
  }

  .analytics-header h3 {
    font-size: 1.25rem;
  }

  .metric-card {
    padding: 1rem;
  }

  .metric-icon {
    font-size: 2rem;
  }

  .metric-value {
    font-size: 1.5rem;
  }

  .insights-section,
  .discipline-section,
  .emotions-section,
  .keywords-section,
  .sentiment-trend-section {
    padding: 1rem;
  }

  .emotion-stats {
    grid-template-columns: 1fr;
  }

  .keywords-table {
    font-size: 0.875rem;
  }

  .correlation-info {
    flex-direction: column;
    gap: 0.5rem;
    text-align: center;
  }
}
</style>
