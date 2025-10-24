<template>
  <div class="drift-analytics">
    <div class="analytics-header">
      <h3>
        <span class="icon">📉</span>
        Equity Curve Drift Detection
      </h3>
      <p class="subtitle">CUSUM and Z-score analysis for performance regime changes</p>
    </div>

    <LoadingSpinner v-if="isLoading" message="Analyzing equity drift patterns..." />

    <div v-else-if="!hasData" class="empty-state">
      <div class="empty-icon">📊</div>
      <h4>Insufficient Data</h4>
      <p>Need at least {{ driftConfig.zScoreWindow }} closed trades for drift analysis.</p>
    </div>

    <div v-else class="analytics-content">
      <!-- Alerts Section -->
      <div v-if="analysis.alerts.length > 0" class="alerts-section">
        <div
          v-for="(alert, index) in analysis.alerts"
          :key="index"
          class="alert-card"
          :class="alert.type"
        >
          <div class="alert-icon">{{ alert.icon }}</div>
          <div class="alert-content">
            <div class="alert-message">{{ alert.message }}</div>
            <div class="alert-recommendation">💡 {{ alert.recommendation }}</div>
          </div>
        </div>
      </div>

      <!-- Current Status -->
      <div class="status-grid">
        <div class="status-card" :class="analysis.currentRegime">
          <div class="status-label">Current Regime</div>
          <div class="status-value">
            {{ getRegimeIcon(analysis.currentRegime) }} {{ getRegimeName(analysis.currentRegime) }}
          </div>
        </div>

        <div class="status-card">
          <div class="status-label">Current Z-Score</div>
          <div class="status-value" :class="getZScoreClass(analysis.statistics.currentZScore)">
            {{ analysis.statistics.currentZScore.toFixed(2) }}
          </div>
          <div class="status-info">{{ getZScoreDescription(analysis.statistics.currentZScore) }}</div>
        </div>

        <div class="status-card">
          <div class="status-label">Drift Events</div>
          <div class="status-value">{{ analysis.driftEvents.length }}</div>
          <div class="status-info">{{ analysis.statistics.driftPercentage.toFixed(1) }}% of trades</div>
        </div>

        <div class="status-card">
          <div class="status-label">Regime Changes</div>
          <div class="status-value">{{ analysis.regimeChanges.length }}</div>
          <div class="status-info">{{ (analysis.regimeChanges.length / analysis.statistics.totalTrades * 100).toFixed(1) }}% frequency</div>
        </div>
      </div>

      <!-- Equity Curve with Drift Zones -->
      <div class="chart-section">
        <h4>Equity Curve with Drift Detection</h4>
        <div class="chart-container">
          <svg
            ref="chartSvg"
            class="equity-chart"
            :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
          >
            <!-- Background grid -->
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

            <!-- Drift zones -->
            <g class="drift-zones">
              <rect
                v-for="(event, index) in analysis.driftEvents"
                :key="`drift-${index}`"
                :x="getChartX(event.startIndex)"
                :y="chartPadding"
                :width="getChartX(event.endIndex) - getChartX(event.startIndex)"
                :height="chartHeight - 2 * chartPadding"
                :fill="getDriftColor(event.type)"
                :opacity="event.severity === 'high' ? 0.2 : 0.1"
              />
            </g>

            <!-- Equity line -->
            <path
              :d="equityPath"
              fill="none"
              stroke="#3b82f6"
              stroke-width="3"
            />

            <!-- Regime change markers -->
            <g class="regime-markers">
              <circle
                v-for="(change, index) in analysis.regimeChanges"
                :key="`change-${index}`"
                :cx="getChartX(change.changeIndex)"
                :cy="getChartY(getPointAt(change.changeIndex)?.cumulativePnL || 0)"
                r="6"
                :fill="getRegimeColor(change.newRegime)"
                stroke="white"
                stroke-width="2"
              />
            </g>

            <!-- Axis labels -->
            <text
              x="10"
              :y="chartHeight / 2"
              fill="#6b7280"
              font-size="12"
              text-anchor="start"
            >
              Cumulative P&L
            </text>
          </svg>
        </div>

        <!-- Chart Legend -->
        <div class="chart-legend">
          <div class="legend-item">
            <span class="legend-line" />
            <span>Equity Curve</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker positive-drift" />
            <span>Positive Drift</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker negative-drift" />
            <span>Negative Drift</span>
          </div>
          <div class="legend-item">
            <span class="legend-marker regime-change" />
            <span>Regime Change</span>
          </div>
        </div>
      </div>

      <!-- CUSUM Chart -->
      <div class="chart-section">
        <h4>CUSUM (Cumulative Sum) Analysis</h4>
        <div class="cusum-charts">
          <div class="cusum-chart">
            <div class="cusum-label">Positive CUSUM (Upward Drift)</div>
            <svg class="mini-chart" :viewBox="`0 0 ${chartWidth} 150`">
              <path
                :d="cusumPositivePath"
                fill="none"
                stroke="#10b981"
                stroke-width="2"
              />
              <line
                :x1="chartPadding"
                :y1="75"
                :x2="chartWidth - chartPadding"
                :y2="75"
                stroke="#ef4444"
                stroke-width="1"
                stroke-dasharray="5,5"
              />
            </svg>
          </div>
          <div class="cusum-chart">
            <div class="cusum-label">Negative CUSUM (Downward Drift)</div>
            <svg class="mini-chart" :viewBox="`0 0 ${chartWidth} 150`">
              <path
                :d="cusumNegativePath"
                fill="none"
                stroke="#ef4444"
                stroke-width="2"
              />
              <line
                :x1="chartPadding"
                :y1="75"
                :x2="chartWidth - chartPadding"
                :y2="75"
                stroke="#ef4444"
                stroke-width="1"
                stroke-dasharray="5,5"
              />
            </svg>
          </div>
        </div>
      </div>

      <!-- Z-Score Chart -->
      <div class="chart-section">
        <h4>Rolling Z-Score ({{ driftConfig.zScoreWindow }}-Trade Window)</h4>
        <svg class="mini-chart" :viewBox="`0 0 ${chartWidth} 150`">
          <!-- Z-score threshold lines -->
          <line
            :x1="chartPadding"
            :y1="30"
            :x2="chartWidth - chartPadding"
            :y2="30"
            stroke="#ef4444"
            stroke-width="1"
            stroke-dasharray="5,5"
          />
          <line
            :x1="chartPadding"
            :y1="75"
            :x2="chartWidth - chartPadding"
            :y2="75"
            stroke="#9ca3af"
            stroke-width="1"
          />
          <line
            :x1="chartPadding"
            :y1="120"
            :x2="chartWidth - chartPadding"
            :y2="120"
            stroke="#ef4444"
            stroke-width="1"
            stroke-dasharray="5,5"
          />

          <!-- Z-score line -->
          <path
            :d="zScorePath"
            fill="none"
            stroke="#8b5cf6"
            stroke-width="2"
          />
        </svg>
        <div class="zscore-info">
          <span>Threshold: ±{{ driftConfig.zScoreThreshold }}</span>
          <span>Current: {{ analysis.statistics.currentZScore.toFixed(2) }}</span>
        </div>
      </div>

      <!-- Drift Events List -->
      <div v-if="analysis.driftEvents.length > 0" class="events-section">
        <h4>Detected Drift Events</h4>
        <div class="events-grid">
          <div
            v-for="(event, index) in analysis.driftEvents"
            :key="index"
            class="event-card"
            :class="[event.type, event.severity]"
          >
            <div class="event-header">
              <span class="event-icon">{{ getEventIcon(event.type) }}</span>
              <span class="event-type">{{ getEventTypeName(event.type) }}</span>
              <span class="severity-badge" :class="event.severity">{{ event.severity }}</span>
            </div>
            <div class="event-dates">
              {{ formatDate(event.startDate) }} - {{ formatDate(event.endDate) }}
            </div>
            <div class="event-description">{{ event.description }}</div>
            <div class="event-stats">
              <span>Trades: {{ event.endIndex - event.startIndex + 1 }}</span>
              <span>Magnitude: {{ event.magnitude.toFixed(2) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Regime Changes Timeline -->
      <div v-if="analysis.regimeChanges.length > 0" class="regime-section">
        <h4>Regime Changes Timeline</h4>
        <div class="timeline">
          <div
            v-for="(change, index) in analysis.regimeChanges"
            :key="index"
            class="timeline-item"
          >
            <div class="timeline-marker" :class="change.newRegime" />
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-date">{{ formatDate(change.changeDate) }}</span>
                <span class="confidence-badge">{{ (change.confidence * 100).toFixed(0) }}% confidence</span>
              </div>
              <div class="timeline-change">
                {{ getRegimeName(change.previousRegime) }}
                <span class="arrow">→</span>
                {{ getRegimeName(change.newRegime) }}
              </div>
              <div class="timeline-metrics">
                CUSUM: {{ change.cusumValue.toFixed(2) }} | Z-Score: {{ change.zScoreValue.toFixed(2) }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Statistics Summary -->
      <div class="stats-summary">
        <h4>Statistical Summary</h4>
        <div class="summary-grid">
          <div class="summary-item">
            <span class="summary-label">Mean Return</span>
            <span class="summary-value">{{ formatCurrency(analysis.statistics.meanReturn) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Std Dev Return</span>
            <span class="summary-value">{{ formatCurrency(analysis.statistics.stdDevReturn) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Max Positive Drift</span>
            <span class="summary-value">{{ analysis.statistics.maxPositiveDrift.toFixed(2) }}</span>
          </div>
          <div class="summary-item">
            <span class="summary-label">Max Negative Drift</span>
            <span class="summary-value">{{ analysis.statistics.maxNegativeDrift.toFixed(2) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { tradeService } from '@/firebase/tradeService'
import { analyzeDrift } from '@/types/drift'
import LoadingSpinner from '../ui/LoadingSpinner.vue'

const isLoading = ref(true)
const trades = ref([])

const driftConfig = {
  zScoreWindow: 20,
  zScoreThreshold: 2.0,
  cusumThreshold: 5.0,
  cusumDrift: 0.5
}

const chartWidth = 800
const chartHeight = 400
const chartPadding = 40

const hasData = computed(() => trades.value.length >= driftConfig.zScoreWindow)

const analysis = computed(() => {
  if (!hasData.value) return null
  return analyzeDrift(trades.value, driftConfig)
})

// Chart paths
const equityPath = computed(() => {
  if (!analysis.value) return ''

  const points = analysis.value.equityPoints
  if (points.length === 0) return ''

  const minPnL = Math.min(...points.map(p => p.cumulativePnL))
  const maxPnL = Math.max(...points.map(p => p.cumulativePnL))
  const range = maxPnL - minPnL || 1

  return points.map((point, i) => {
    const x = getChartX(i)
    const y = getChartY(point.cumulativePnL)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

const cusumPositivePath = computed(() => {
  if (!analysis.value) return ''
  return generateMiniChartPath(analysis.value.equityPoints.map(p => p.cusumPositive))
})

const cusumNegativePath = computed(() => {
  if (!analysis.value) return ''
  return generateMiniChartPath(analysis.value.equityPoints.map(p => p.cusumNegative))
})

const zScorePath = computed(() => {
  if (!analysis.value) return ''

  const zScores = analysis.value.equityPoints.map(p => p.zScore)
  const maxAbsZ = Math.max(...zScores.map(z => Math.abs(z)), driftConfig.zScoreThreshold * 1.5)

  return analysis.value.equityPoints.map((point, i) => {
    const x = chartPadding + (i / (analysis.value.equityPoints.length - 1 || 1)) * (chartWidth - 2 * chartPadding)
    const normalizedZ = (point.zScore + maxAbsZ) / (2 * maxAbsZ)
    const y = 150 - (normalizedZ * 120) - 15
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

// Helper functions
const getChartX = (index) => {
  if (!analysis.value) return 0
  const total = analysis.value.equityPoints.length - 1 || 1
  return chartPadding + (index / total) * (chartWidth - 2 * chartPadding)
}

const getChartY = (value) => {
  if (!analysis.value) return 0
  const points = analysis.value.equityPoints
  const minPnL = Math.min(...points.map(p => p.cumulativePnL))
  const maxPnL = Math.max(...points.map(p => p.cumulativePnL))
  const range = maxPnL - minPnL || 1

  const normalized = (value - minPnL) / range
  return chartHeight - chartPadding - (normalized * (chartHeight - 2 * chartPadding))
}

const getPointAt = (index) => {
  return analysis.value?.equityPoints[index]
}

const generateMiniChartPath = (values) => {
  if (values.length === 0) return ''

  const maxVal = Math.max(...values, driftConfig.cusumThreshold * 1.2)

  return values.map((val, i) => {
    const x = chartPadding + (i / (values.length - 1 || 1)) * (chartWidth - 2 * chartPadding)
    const normalized = val / maxVal
    const y = 150 - (normalized * 120) - 15
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
}

const getRegimeIcon = (regime) => {
  const icons = {
    normal: '✅',
    improving: '📈',
    deteriorating: '📉',
    volatile: '🌪️'
  }
  return icons[regime] || '❓'
}

const getRegimeName = (regime) => {
  const names = {
    normal: 'Normal',
    improving: 'Improving',
    deteriorating: 'Deteriorating',
    volatile: 'Volatile'
  }
  return names[regime] || regime
}

const getRegimeColor = (regime) => {
  const colors = {
    normal: '#10b981',
    improving: '#3b82f6',
    deteriorating: '#ef4444',
    volatile: '#f59e0b'
  }
  return colors[regime] || '#6b7280'
}

const getDriftColor = (type) => {
  return type === 'positive' ? '#10b981' : type === 'negative' ? '#ef4444' : '#f59e0b'
}

const getZScoreClass = (zScore) => {
  const abs = Math.abs(zScore)
  if (abs > driftConfig.zScoreThreshold * 1.5) return 'critical'
  if (abs > driftConfig.zScoreThreshold) return 'warning'
  return 'normal'
}

const getZScoreDescription = (zScore) => {
  const abs = Math.abs(zScore)
  if (abs < 1) return 'Normal range'
  if (abs < 2) return 'Moderate deviation'
  if (abs < 3) return 'Significant deviation'
  return 'Extreme deviation'
}

const getEventIcon = (type) => {
  return type === 'positive' ? '📈' : type === 'negative' ? '📉' : '⚡'
}

const getEventTypeName = (type) => {
  return type === 'positive' ? 'Positive Drift' : type === 'negative' ? 'Negative Drift' : 'Volatility Event'
}

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

// Load trades
onMounted(async() => {
  try {
    isLoading.value = true
    const allTrades = await tradeService.getAllTrades()

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
.drift-analytics {
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

/* Alerts */
.alerts-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.alert-card {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid;
}

.alert-card.info {
  background: #dbeafe;
  border-color: #3b82f6;
}

.alert-card.warning {
  background: #fef3c7;
  border-color: #f59e0b;
}

.alert-card.critical {
  background: #fee2e2;
  border-color: #ef4444;
}

.alert-icon {
  font-size: 1.5rem;
}

.alert-content {
  flex: 1;
}

.alert-message {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.alert-recommendation {
  font-size: 0.875rem;
  color: #374151;
}

/* Status Grid */
.status-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.status-card {
  background: white;
  border-radius: 10px;
  padding: 1.25rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.status-card.improving {
  border-left: 4px solid #10b981;
}

.status-card.deteriorating {
  border-left: 4px solid #ef4444;
}

.status-card.volatile {
  border-left: 4px solid #f59e0b;
}

.status-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
}

.status-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.status-value.critical {
  color: #ef4444;
}

.status-value.warning {
  color: #f59e0b;
}

.status-value.normal {
  color: #10b981;
}

.status-info {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-top: 0.25rem;
}

/* Charts */
.chart-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.chart-section h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.chart-container {
  width: 100%;
  overflow-x: auto;
}

.equity-chart {
  width: 100%;
  height: auto;
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-top: 1rem;
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

.legend-line {
  width: 30px;
  height: 3px;
  background: #3b82f6;
  border-radius: 2px;
}

.legend-marker {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.legend-marker.positive-drift {
  background: #10b981;
}

.legend-marker.negative-drift {
  background: #ef4444;
}

.legend-marker.regime-change {
  background: #f59e0b;
  border: 2px solid white;
}

/* CUSUM Charts */
.cusum-charts {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 1.5rem;
}

.cusum-chart {
  background: #f9fafb;
  border-radius: 8px;
  padding: 1rem;
}

.cusum-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.5rem;
}

.mini-chart {
  width: 100%;
  height: auto;
}

.zscore-info {
  display: flex;
  justify-content: space-between;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #6b7280;
}

/* Events */
.events-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.events-section h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.events-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.event-card {
  padding: 1rem;
  border-radius: 8px;
  border: 2px solid;
}

.event-card.positive {
  background: #d1fae5;
  border-color: #10b981;
}

.event-card.negative {
  background: #fee2e2;
  border-color: #ef4444;
}

.event-card.volatility {
  background: #fef3c7;
  border-color: #f59e0b;
}

.event-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.event-icon {
  font-size: 1.25rem;
}

.event-type {
  flex: 1;
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
}

.severity-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  font-size: 0.625rem;
  font-weight: 600;
  text-transform: uppercase;
}

.severity-badge.high {
  background: #991b1b;
  color: white;
}

.severity-badge.medium {
  background: #f59e0b;
  color: white;
}

.severity-badge.low {
  background: #6b7280;
  color: white;
}

.event-dates {
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.event-description {
  font-size: 0.875rem;
  color: #374151;
  margin-bottom: 0.5rem;
}

.event-stats {
  display: flex;
  gap: 1rem;
  font-size: 0.75rem;
  color: #6b7280;
}

/* Timeline */
.regime-section {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.regime-section h4 {
  margin: 0 0 1.5rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.timeline {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  position: relative;
  padding-left: 2rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 8px;
  top: 0;
  bottom: 0;
  width: 2px;
  background: #e5e7eb;
}

.timeline-item {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  position: relative;
}

.timeline-marker {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  position: absolute;
  left: -2rem;
  border: 3px solid white;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.timeline-marker.improving {
  background: #10b981;
}

.timeline-marker.deteriorating {
  background: #ef4444;
}

.timeline-marker.volatile {
  background: #f59e0b;
}

.timeline-marker.normal {
  background: #6b7280;
}

.timeline-content {
  flex: 1;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.timeline-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
}

.timeline-date {
  font-size: 0.75rem;
  color: #6b7280;
}

.confidence-badge {
  padding: 0.125rem 0.5rem;
  border-radius: 12px;
  background: #dbeafe;
  color: #1e40af;
  font-size: 0.625rem;
  font-weight: 600;
}

.timeline-change {
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
}

.timeline-change .arrow {
  color: #9ca3af;
  margin: 0 0.5rem;
}

.timeline-metrics {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Stats Summary */
.stats-summary {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.stats-summary h4 {
  margin: 0 0 1rem 0;
  color: #1f2937;
  font-size: 1.125rem;
}

.summary-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
}

.summary-item {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.summary-label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.summary-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

@media (max-width: 768px) {
  .drift-analytics {
    padding: 1rem;
  }

  .status-grid {
    grid-template-columns: 1fr;
  }

  .cusum-charts {
    grid-template-columns: 1fr;
  }

  .events-grid {
    grid-template-columns: 1fr;
  }

  .chart-legend {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
}
</style>
