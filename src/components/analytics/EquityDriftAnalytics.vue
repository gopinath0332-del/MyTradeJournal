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
        <div class="chart-header">
          <h4>Equity Curve with Drift Detection</h4>
          <div class="chart-legend">
            <div class="legend-item">
              <span class="legend-color equity" />
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

        <div class="chart-container" @mouseleave="hideTooltip">
          <div class="chart-wrapper">
            <svg
              ref="chartSvg"
              class="equity-chart"
              :viewBox="`0 0 ${chartWidth} ${chartHeight}`"
              preserveAspectRatio="none"
              @mousemove="onChartMouseMove"
            >
              <!-- Dual-zone clip paths -->
              <defs>
                <clipPath id="drift-clip-positive">
                  <rect
                    :x="margin.left"
                    :y="margin.top"
                    :width="chartWidth - margin.left - margin.right"
                    :height="Math.max(0, zeroLineY - margin.top)"
                  />
                </clipPath>
                <clipPath id="drift-clip-negative">
                  <rect
                    :x="margin.left"
                    :y="zeroLineY"
                    :width="chartWidth - margin.left - margin.right"
                    :height="Math.max(0, chartHeight - margin.bottom - zeroLineY)"
                  />
                </clipPath>
              </defs>

              <!-- Background horizontal grid -->
              <g class="grid">
                <line
                  v-for="(line, index) in horizontalGridLines"
                  :key="`h-${index}`"
                  :x1="margin.left"
                  :y1="line.y"
                  :x2="chartWidth - margin.right"
                  :y2="line.y"
                  :class="['grid-line', { 'is-zero': line.value === 0 }]"
                />
              </g>

              <!-- Zero baseline -->
              <line
                :x1="margin.left"
                :y1="zeroLineY"
                :x2="chartWidth - margin.right"
                :y2="zeroLineY"
                class="zero-baseline"
              />

              <!-- Dual-zone Area Fills under Equity Curve -->
              <path
                :d="equityAreaPath"
                class="area-positive"
                clip-path="url(#drift-clip-positive)"
              />
              <path
                :d="equityAreaPath"
                class="area-negative"
                clip-path="url(#drift-clip-negative)"
              />

              <!-- Drift zones -->
              <g class="drift-zones">
                <rect
                  v-for="(event, index) in analysis.driftEvents"
                  :key="`drift-${index}`"
                  :x="getChartX(event.startIndex)"
                  :y="margin.top"
                  :width="Math.max(2, getChartX(event.endIndex) - getChartX(event.startIndex))"
                  :height="chartHeight - margin.top - margin.bottom"
                  :fill="getDriftColor(event.type)"
                  :opacity="event.severity === 'high' ? 0.28 : 0.15"
                />
              </g>

              <!-- Equity Lines (Green above zero, Red below) -->
              <path
                :d="equityPath"
                class="line-positive"
                fill="none"
                clip-path="url(#drift-clip-positive)"
              />
              <path
                :d="equityPath"
                class="line-negative"
                fill="none"
                clip-path="url(#drift-clip-negative)"
              />

              <!-- Beaded Data Points -->
              <g class="data-points">
                <circle
                  v-for="(point, index) in analysis.equityPoints"
                  :key="index"
                  :cx="getChartX(index)"
                  :cy="getChartY(point.cumulativePnL)"
                  :r="hoveredIndex === index ? 5.5 : 3.5"
                  :class="['data-point', point.cumulativePnL >= 0 ? 'profit' : 'loss', { 'is-hovered': hoveredIndex === index }]"
                />
              </g>

              <!-- Regime change markers -->
              <g class="regime-markers">
                <circle
                  v-for="(change, index) in analysis.regimeChanges"
                  :key="`change-${index}`"
                  :cx="getChartX(change.changeIndex)"
                  :cy="getChartY(getPointAt(change.changeIndex)?.cumulativePnL || 0)"
                  r="7"
                  :fill="getRegimeColor(change.newRegime)"
                  stroke="#ffffff"
                  stroke-width="2.5"
                  class="regime-marker"
                />
              </g>

              <!-- Vertical Crosshair Line -->
              <line
                v-if="hoveredIndex !== null && hoveredPoint"
                :x1="getChartX(hoveredIndex)"
                :y1="margin.top"
                :x2="getChartX(hoveredIndex)"
                :y2="chartHeight - margin.bottom"
                class="crosshair-line"
              />

              <!-- Hovered Point Halo -->
              <circle
                v-if="hoveredIndex !== null && hoveredPoint"
                :cx="getChartX(hoveredIndex)"
                :cy="getChartY(hoveredPoint.cumulativePnL)"
                :r="6.5"
                :class="['hover-halo', hoveredPoint.cumulativePnL >= 0 ? 'profit' : 'loss']"
              />

              <!-- Y-axis labels -->
              <g class="y-axis-labels">
                <text
                  v-for="(label, index) in yAxisLabels"
                  :key="`y-${index}`"
                  :x="margin.left - 12"
                  :y="label.y"
                  class="axis-label y-label"
                  text-anchor="end"
                  dominant-baseline="middle"
                >
                  {{ formatAxisCurrency(label.value) }}
                </text>
              </g>

              <!-- X-axis labels -->
              <g class="x-axis-labels">
                <text
                  v-for="(label, index) in xAxisLabels"
                  :key="`x-${index}`"
                  :x="label.x"
                  :y="chartHeight - margin.bottom + 22"
                  class="axis-label x-label"
                  text-anchor="middle"
                >
                  {{ label.text }}
                </text>
              </g>

              <!-- Interaction Overlay -->
              <rect
                :x="margin.left"
                :y="margin.top"
                :width="chartWidth - margin.left - margin.right"
                :height="chartHeight - margin.top - margin.bottom"
                fill="transparent"
                class="interaction-overlay"
              />
            </svg>

            <!-- Floating Tooltip -->
            <div
              v-if="tooltip.visible"
              class="tooltip"
              :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }"
            >
              <div class="tooltip-header">{{ tooltip.date }}</div>
              <div class="tooltip-row">
                <span class="tooltip-label">Cumulative P&L:</span>
                <span class="tooltip-val" :class="tooltip.pnl >= 0 ? 'profit' : 'loss'">
                  {{ tooltip.pnl >= 0 ? '+' : '' }}{{ formatCurrency(tooltip.pnl) }}
                </span>
              </div>
              <div class="tooltip-row" v-if="tooltip.regime">
                <span class="tooltip-label">Regime:</span>
                <span class="tooltip-val">{{ getRegimeName(tooltip.regime) }}</span>
              </div>
            </div>
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
import { useProfiles } from '@/composables/useProfiles'
import LoadingSpinner from '../ui/LoadingSpinner.vue'

const { currencySymbol } = useProfiles()

const isLoading = ref(true)
const trades = ref([])

const driftConfig = {
  zScoreWindow: 20,
  zScoreThreshold: 2.0,
  cusumThreshold: 5.0,
  cusumDrift: 0.5
}

const chartWidth = 950
const chartHeight = 440
const margin = { top: 25, right: 30, bottom: 50, left: 75 }

const hoveredIndex = ref(null)
const hoveredPoint = computed(() => {
  if (hoveredIndex.value === null || !analysis.value) return null
  return analysis.value.equityPoints[hoveredIndex.value] || null
})

const tooltip = ref({
  visible: false,
  x: 0,
  y: 0,
  date: '',
  pnl: 0,
  regime: ''
})

const hasData = computed(() => trades.value.length >= driftConfig.zScoreWindow)

const analysis = computed(() => {
  if (!hasData.value) return null
  return analyzeDrift(trades.value, driftConfig)
})

// Nice Y-scale generator with clean round multiples and 0 baseline
const yScaleConfig = computed(() => {
  if (!analysis.value || !analysis.value.equityPoints.length) {
    return { niceMin: -100, niceMax: 100, ticks: [-100, 0, 100] }
  }
  const points = analysis.value.equityPoints
  const minVal = Math.min(...points.map(p => p.cumulativePnL))
  const maxVal = Math.max(...points.map(p => p.cumulativePnL))
  const effectiveMin = Math.min(0, minVal)
  const effectiveMax = Math.max(0, maxVal)
  const rawRange = effectiveMax - effectiveMin || 100

  const targetSteps = 6
  const rawStep = rawRange / targetSteps
  const power = Math.pow(10, Math.floor(Math.log10(rawStep || 1)))
  const fraction = rawStep / power

  let step
  if (fraction <= 1.5) step = 1 * power
  else if (fraction <= 3.5) step = 2 * power
  else if (fraction <= 7.5) step = 5 * power
  else step = 10 * power

  const niceMin = Math.floor(effectiveMin / step) * step
  const niceMax = Math.ceil(effectiveMax / step) * step

  const ticks = []
  for (let val = niceMin; val <= niceMax + step * 0.1; val += step) {
    ticks.push(Math.round(val * 1000) / 1000)
  }

  return { niceMin, niceMax, ticks }
})

// Chart coordinates
const getChartX = (index) => {
  if (!analysis.value) return 0
  const total = analysis.value.equityPoints.length - 1 || 1
  const dataWidth = chartWidth - margin.left - margin.right
  return margin.left + (index / total) * dataWidth
}

const getChartY = (value) => {
  if (!analysis.value) return 0
  const { niceMin, niceMax } = yScaleConfig.value
  const dataHeight = chartHeight - margin.top - margin.bottom
  const range = niceMax - niceMin || 1
  return chartHeight - margin.bottom - ((value - niceMin) / range) * dataHeight
}

const zeroLineY = computed(() => {
  return getChartY(0)
})

// Closed area path under equity curve down/up to zero line
const equityAreaPath = computed(() => {
  if (!analysis.value || !analysis.value.equityPoints.length) return ''
  const points = analysis.value.equityPoints
  const firstX = getChartX(0)
  const lastX = getChartX(points.length - 1)
  const zeroY = zeroLineY.value

  let path = `M ${firstX} ${zeroY}`
  for (let i = 0; i < points.length; i++) {
    path += ` L ${getChartX(i)} ${getChartY(points[i].cumulativePnL)}`
  }
  path += ` L ${lastX} ${zeroY} Z`
  return path
})

// Chart paths
const equityPath = computed(() => {
  if (!analysis.value) return ''
  const points = analysis.value.equityPoints
  if (points.length === 0) return ''

  return points.map((point, i) => {
    const x = getChartX(i)
    const y = getChartY(point.cumulativePnL)
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

const horizontalGridLines = computed(() => {
  return yScaleConfig.value.ticks.map(val => ({
    y: getChartY(val),
    value: val
  }))
})

const yAxisLabels = computed(() => {
  return horizontalGridLines.value
})

const formatXDate = (dateStr) => {
  if (!dateStr) return ''
  const parts = String(dateStr).split('T')[0].split('-')
  if (parts.length === 3) {
    const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

const xAxisLabels = computed(() => {
  if (!analysis.value || !analysis.value.equityPoints.length) return []
  const points = analysis.value.equityPoints
  const maxLabels = 9
  const step = Math.max(1, Math.floor((points.length - 1) / (maxLabels - 1)))
  const labels = []

  for (let i = 0; i < points.length; i += step) {
    labels.push({
      text: formatXDate(points[i].date),
      x: getChartX(i)
    })
  }

  const lastIdx = points.length - 1
  if (labels[labels.length - 1].x < getChartX(lastIdx) - 45) {
    labels.push({
      text: formatXDate(points[lastIdx].date),
      x: getChartX(lastIdx)
    })
  }

  return labels
})

const formatAxisCurrency = (val) => {
  if (val === 0) return `${currencySymbol.value || '₹'}0`
  const abs = Math.abs(val)
  let formatted
  if (abs >= 10000000) formatted = (abs / 10000000).toFixed(1).replace(/\.0$/, '') + 'Cr'
  else if (abs >= 100000) formatted = (abs / 100000).toFixed(1).replace(/\.0$/, '') + 'L'
  else if (abs >= 1000) formatted = (abs / 1000).toFixed(1).replace(/\.0$/, '') + 'k'
  else formatted = abs.toLocaleString('en-US')

  const sym = currencySymbol.value || '₹'
  return val < 0 ? `${sym}-${formatted}` : `${sym}${formatted}`
}

const onChartMouseMove = (event) => {
  if (!analysis.value || !analysis.value.equityPoints.length) return
  const points = analysis.value.equityPoints

  const svg = event.currentTarget
  const rect = svg.getBoundingClientRect()
  const mouseSvgX = ((event.clientX - rect.left) / rect.width) * chartWidth

  const dataWidth = chartWidth - margin.left - margin.right
  const normalizedX = (mouseSvgX - margin.left) / dataWidth
  let index = Math.round(normalizedX * (points.length - 1))
  index = Math.max(0, Math.min(points.length - 1, index))

  hoveredIndex.value = index
  const point = points[index]

  const container = svg.closest('.chart-container').getBoundingClientRect()
  const pointSvgX = getChartX(index)
  const pointSvgY = getChartY(point.cumulativePnL)
  const pointScreenX = rect.left + (pointSvgX / chartWidth) * rect.width
  const pointScreenY = rect.top + (pointSvgY / chartHeight) * rect.height

  tooltip.value = {
    visible: true,
    x: pointScreenX - container.left,
    y: pointScreenY - container.top - 12,
    date: formatDate(point.date),
    pnl: point.cumulativePnL,
    regime: point.regime
  }
}

const hideTooltip = () => {
  tooltip.value.visible = false
  hoveredIndex.value = null
}

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
    const x = margin.left + (i / (analysis.value.equityPoints.length - 1 || 1)) * (chartWidth - margin.left - margin.right)
    const normalizedZ = (point.zScore + maxAbsZ) / (2 * maxAbsZ)
    const y = 150 - (normalizedZ * 120) - 15
    return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
  }).join(' ')
})

const getPointAt = (index) => {
  return analysis.value?.equityPoints[index]
}

const generateMiniChartPath = (values) => {
  if (values.length === 0) return ''

  const maxVal = Math.max(...values, driftConfig.cusumThreshold * 1.2)

  return values.map((val, i) => {
    const x = margin.left + (i / (values.length - 1 || 1)) * (chartWidth - margin.left - margin.right)
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
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  border: 1px solid #f1f5f9;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.chart-header h4 {
  margin: 0;
  color: #1e293b;
  font-size: 1.25rem;
  font-weight: 700;
}

.chart-container {
  width: 100%;
  height: 440px;
  position: relative;
}

.chart-wrapper {
  width: 100%;
  height: 100%;
  position: relative;
}

.equity-chart {
  width: 100%;
  height: 100%;
  overflow: visible;
  cursor: crosshair;
}

/* Grid & Baseline */
.grid-line {
  stroke: #f1f5f9;
  stroke-width: 1;
}

.grid-line.is-zero {
  stroke: #e2e8f0;
  stroke-width: 1.5;
}

.zero-baseline {
  stroke: #cbd5e1;
  stroke-width: 1.5;
}

/* Dual-zone Equity Area Fills */
.area-positive {
  fill: #c6f6d5;
  opacity: 0.7;
}

.area-negative {
  fill: #fecaca;
  opacity: 0.75;
}

/* Equity Line Strokes */
.line-positive {
  stroke: #16a34a;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.line-negative {
  stroke: #dc2626;
  stroke-width: 2.2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

/* Beaded Data Points */
.data-point {
  stroke: #ffffff;
  stroke-width: 1.5;
  transition: r 0.15s ease, stroke-width 0.15s ease;
}

.data-point.profit {
  fill: #16a34a;
}

.data-point.loss {
  fill: #dc2626;
}

.data-point.is-hovered {
  r: 5.5;
  stroke-width: 2;
}

/* Regime Markers */
.regime-marker {
  cursor: pointer;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
}

/* Crosshair & Halo */
.crosshair-line {
  stroke: #94a3b8;
  stroke-width: 1.5;
  stroke-dasharray: 4,4;
  pointer-events: none;
}

.hover-halo {
  fill: #ffffff;
  stroke-width: 3;
  pointer-events: none;
}

.hover-halo.profit {
  stroke: #16a34a;
}

.hover-halo.loss {
  stroke: #dc2626;
}

/* Axis Labels */
.axis-label {
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  font-size: 11.5px;
  fill: #94a3b8;
  font-weight: 500;
  user-select: none;
}

.interaction-overlay {
  pointer-events: all;
}

/* Tooltip */
.tooltip {
  position: absolute;
  background: rgba(15, 23, 42, 0.9);
  backdrop-filter: blur(8px);
  color: #ffffff;
  padding: 0.65rem 0.85rem;
  border-radius: 8px;
  font-size: 0.8rem;
  pointer-events: none;
  transform: translateX(-50%) translateY(-100%);
  z-index: 1000;
  white-space: nowrap;
  box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  transition: opacity 0.15s ease, transform 0.1s ease;
}

.tooltip-header {
  font-weight: 700;
  color: #94a3b8;
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 0.1rem;
}

.tooltip-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.75rem;
}

.tooltip-label {
  color: #cbd5e1;
  font-weight: 400;
}

.tooltip-val {
  font-weight: 700;
}

.tooltip-val.profit {
  color: #4ade80;
}

.tooltip-val.loss {
  color: #f87171;
}

.chart-legend {
  display: flex;
  align-items: center;
  gap: 1.25rem;
  font-size: 0.8rem;
  color: #64748b;
  font-weight: 500;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.legend-color.equity {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #16a34a;
  box-shadow: 0 0 0 1.5px #ffffff, 0 0 0 2.5px #16a34a;
}

.legend-marker {
  width: 10px;
  height: 10px;
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
