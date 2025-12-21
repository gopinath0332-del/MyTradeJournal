<script setup lang="ts">
import { computed } from 'vue'
import type { SymbolDrawdownMetrics } from '@/composables/useSymbolDrawdown'

const props = defineProps<{
    metrics: SymbolDrawdownMetrics[]
}>()

// Sort by current drawdown (highest first) or max drawdown
const sortedMetrics = computed(() => {
    return [...props.metrics].sort((a, b) => {
        // First sort by whether in drawdown
        if (a.isInDrawdown && !b.isInDrawdown) return -1
        if (!a.isInDrawdown && b.isInDrawdown) return 1
        // Then by current/max drawdown
        return b.currentDrawdown - a.currentDrawdown || b.maxDrawdown - a.maxDrawdown
    })
})

// Generate SVG sparkline path
const generateSparkline = (equityHistory: SymbolDrawdownMetrics['equityHistory']) => {
    if (equityHistory.length < 2) return ''

    const width = 100
    const height = 30
    const padding = 2

    const minEquity = Math.min(...equityHistory.map(p => p.equity))
    const maxEquity = Math.max(...equityHistory.map(p => p.equity))
    const range = maxEquity - minEquity || 1

    const points = equityHistory.map((point, i) => {
        const x = (i / (equityHistory.length - 1)) * width
        const y = height - ((point.equity - minEquity) / range) * (height - padding * 2) - padding
        return `${x},${y}`
    })

    return `M ${points.join(' L ')}`
}

// Generate shaded drawdown areas
const generateDrawdownAreas = (equityHistory: SymbolDrawdownMetrics['equityHistory']) => {
    if (equityHistory.length < 2) return []

    const width = 100
    const height = 30
    const padding = 2

    const minEquity = Math.min(...equityHistory.map(p => p.equity))
    const maxEquity = Math.max(...equityHistory.map(p => p.equity))
    const range = maxEquity - minEquity || 1

    const areas: { path: string; opacity: number }[] = []
    let inDrawdown = false
    let drawdownPoints: string[] = []

    equityHistory.forEach((point, i) => {
        const x = (i / (equityHistory.length - 1)) * width
        const equityY = height - ((point.equity - minEquity) / range) * (height - padding * 2) - padding
        const peakY = height - ((point.peak - minEquity) / range) * (height - padding * 2) - padding

        if (point.drawdown > 0) {
            if (!inDrawdown) {
                // Start new drawdown area
                drawdownPoints = [`${x},${peakY}`, `${x},${equityY}`]
                inDrawdown = true
            } else {
                // Continue drawdown area
                drawdownPoints.push(`${x},${equityY}`)
            }
        } else if (inDrawdown) {
            // End drawdown area
            drawdownPoints.push(`${x},${peakY}`)

            // Create closed path
            const pathData = `M ${drawdownPoints[0]} L ${drawdownPoints.slice(1).join(' L ')} Z`
            areas.push({
                path: pathData,
                opacity: 0.2
            })

            inDrawdown = false
            drawdownPoints = []
        }
    })

    // Close any open drawdown area
    if (inDrawdown && drawdownPoints.length > 0) {
        const lastIndex = equityHistory.length - 1
        const lastPoint = equityHistory[lastIndex]
        if (lastPoint) {
            const x = width
            const peakY = height - ((lastPoint.peak - minEquity) / range) * (height - padding * 2) - padding
            drawdownPoints.push(`${x},${peakY}`)

            const pathData = `M ${drawdownPoints[0]} L ${drawdownPoints.slice(1).join(' L ')} Z`
            areas.push({
                path: pathData,
                opacity: 0.3 // Slightly more visible for ongoing drawdown
            })
        }
    }

    return areas
}

// Format percentage
const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
}

// Format currency
const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2
    }).format(value)
}

// Get color for drawdown percentage
const getDrawdownColor = (percent: number) => {
    if (percent === 0) return 'text-green-600 dark:text-green-400'
    if (percent < 5) return 'text-yellow-600 dark:text-yellow-400'
    if (percent < 10) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
}

// Get color for recovery efficiency
const getEfficiencyColor = (score: number) => {
    if (score >= 80) return 'text-green-600 dark:text-green-400'
    if (score >= 60) return 'text-yellow-600 dark:text-yellow-400'
    if (score >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-red-600 dark:text-red-400'
}
</script>

<template>
  <div class="space-y-6">
    <!-- Overview -->
    <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Symbols in Drawdown</div>
        <div class="text-2xl font-bold text-red-600 dark:text-red-400">
          {{ metrics.filter(m => m.isInDrawdown).length }} / {{ metrics.length }}
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Recovery Efficiency</div>
        <div class="text-2xl font-bold">
          {{ metrics.length > 0
            ? (metrics.reduce((sum, m) => sum + m.recoveryEfficiency, 0) / metrics.length).toFixed(0)
            : '0'
          }}
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm">
        <div class="text-sm text-gray-500 dark:text-gray-400 mb-1">Avg Time in Drawdown</div>
        <div class="text-2xl font-bold">
          {{ metrics.length > 0
            ? (metrics.reduce((sum, m) => sum + m.timeInDrawdownRatio, 0) / metrics.length * 100).toFixed(0)
            : '0'
          }}%
        </div>
      </div>
    </div>

    <!-- Desktop Table View -->
    <div class="hidden lg:block bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
      <div class="overflow-x-auto">
        <table class="w-full">
          <thead class="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
            <tr>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
              >
                Symbol
              </th>
              <th
                class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
              >
                Equity Curve
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
              >
                Current DD
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
              >
                Max DD
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
              >
                Time in DD
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
              >
                Recovery
              </th>
              <th
                class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase"
              >
                Avg Recovery
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr
              v-for="metric in sortedMetrics"
              :key="metric.symbol"
              class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
            >
              <td class="px-4 py-3">
                <div class="flex items-center gap-2">
                  <span class="font-medium">{{ metric.symbol }}</span>
                  <span
                    v-if="metric.isInDrawdown"
                    class="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
                  >
                    DD
                  </span>
                </div>
              </td>
              <td class="px-4 py-3">
                <svg viewBox="0 0 100 30" class="w-24 h-8" preserveAspectRatio="none">
                  <!-- Drawdown shaded areas -->
                  <path
                    v-for="(area, i) in generateDrawdownAreas(metric.equityHistory)"
                    :key="i"
                    :d="area.path"
                    fill="currentColor"
                    :opacity="area.opacity"
                    class="text-red-500"
                  />
                  <!-- Equity curve -->
                  <path
                    :d="generateSparkline(metric.equityHistory)"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.5"
                    :class="metric.isInDrawdown ? 'text-red-500' : 'text-blue-500'"
                  />
                </svg>
              </td>
              <td class="px-4 py-3 text-right">
                <div :class="getDrawdownColor(metric.currentDrawdownPercent)">
                  <div class="font-medium">{{ formatCurrency(metric.currentDrawdown) }}</div>
                  <div class="text-xs">{{ formatPercent(metric.currentDrawdownPercent) }}</div>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <div :class="getDrawdownColor(metric.maxDrawdownPercent)">
                  <div class="font-medium">{{ formatCurrency(metric.maxDrawdown) }}</div>
                  <div class="text-xs">{{ formatPercent(metric.maxDrawdownPercent) }}</div>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <div>
                  <div class="font-medium">{{ (metric.timeInDrawdownRatio * 100).toFixed(0) }}%</div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ metric.timeInDrawdown }} days
                  </div>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <div :class="getEfficiencyColor(metric.recoveryEfficiency)">
                  <div class="font-bold text-lg">{{ metric.recoveryEfficiency.toFixed(0) }}</div>
                  <div class="text-xs">score</div>
                </div>
              </td>
              <td class="px-4 py-3 text-right">
                <div class="text-gray-600 dark:text-gray-300">
                  <div class="font-medium">
                    {{ metric.avgRecoveryTime > 0 ? metric.avgRecoveryTime.toFixed(0) : 'N/A' }}
                  </div>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ metric.avgRecoveryTime > 0 ? 'days' : '' }}
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- Mobile Card View -->
    <div class="lg:hidden space-y-4">
      <div
        v-for="metric in sortedMetrics"
        :key="metric.symbol"
        class="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm"
      >
        <!-- Header -->
        <div class="flex items-center justify-between mb-3">
          <div class="flex items-center gap-2">
            <span class="font-bold text-lg">{{ metric.symbol }}</span>
            <span
              v-if="metric.isInDrawdown"
              class="px-2 py-0.5 text-xs bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded"
            >
              In Drawdown
            </span>
          </div>
          <div :class="getEfficiencyColor(metric.recoveryEfficiency)">
            <div class="text-right">
              <div class="font-bold text-xl">{{ metric.recoveryEfficiency.toFixed(0) }}</div>
              <div class="text-xs">Recovery</div>
            </div>
          </div>
        </div>

        <!-- Sparkline -->
        <div class="mb-3">
          <svg viewBox="0 0 100 30" class="w-full h-16" preserveAspectRatio="none">
            <!-- Drawdown shaded areas -->
            <path
              v-for="(area, i) in generateDrawdownAreas(metric.equityHistory)"
              :key="i"
              :d="area.path"
              fill="currentColor"
              :opacity="area.opacity"
              class="text-red-500"
            />
            <!-- Equity curve -->
            <path
              :d="generateSparkline(metric.equityHistory)"
              fill="none"
              stroke="currentColor"
              stroke-width="1.5"
              :class="metric.isInDrawdown ? 'text-red-500' : 'text-blue-500'"
            />
          </svg>
        </div>

        <!-- Metrics Grid -->
        <div class="grid grid-cols-2 gap-3 text-sm">
          <div>
            <div class="text-gray-500 dark:text-gray-400 text-xs mb-1">Current Drawdown</div>
            <div :class="getDrawdownColor(metric.currentDrawdownPercent)">
              <div class="font-medium">{{ formatCurrency(metric.currentDrawdown) }}</div>
              <div class="text-xs">{{ formatPercent(metric.currentDrawdownPercent) }}</div>
            </div>
          </div>

          <div>
            <div class="text-gray-500 dark:text-gray-400 text-xs mb-1">Max Drawdown</div>
            <div :class="getDrawdownColor(metric.maxDrawdownPercent)">
              <div class="font-medium">{{ formatCurrency(metric.maxDrawdown) }}</div>
              <div class="text-xs">{{ formatPercent(metric.maxDrawdownPercent) }}</div>
            </div>
          </div>

          <div>
            <div class="text-gray-500 dark:text-gray-400 text-xs mb-1">Time in Drawdown</div>
            <div>
              <div class="font-medium">{{ (metric.timeInDrawdownRatio * 100).toFixed(0) }}%</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ metric.timeInDrawdown }} days
              </div>
            </div>
          </div>

          <div>
            <div class="text-gray-500 dark:text-gray-400 text-xs mb-1">Avg Recovery</div>
            <div class="text-gray-600 dark:text-gray-300">
              <div class="font-medium">
                {{ metric.avgRecoveryTime > 0 ? metric.avgRecoveryTime.toFixed(0) : 'N/A' }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ metric.avgRecoveryTime > 0 ? 'days' : '' }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
