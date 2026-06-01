<template>
  <div class="monthly-return-heatmap">
    <div class="heatmap-card">
      <h3 class="heatmap-title">Monthly Returns Heatmap</h3>

      <!-- Empty state -->
      <div v-if="yearRows.length === 0" class="heatmap-empty">
        <span class="empty-icon">📅</span>
        <p>No monthly return data available for the selected trades.</p>
      </div>

      <!-- Heatmap grid -->
      <div v-else class="heatmap-wrapper">
        <div class="heatmap-grid-container">
          <table class="heatmap-table">
            <thead>
              <tr>
                <th class="year-header"></th>
                <th v-for="m in monthLabels" :key="m" class="month-header">{{ m }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="row in yearRows" :key="row.year">
                <td class="year-label">{{ row.year }}</td>
                <td
                  v-for="(cell, idx) in row.cells"
                  :key="idx"
                  class="heatmap-cell"
                  :class="{ 'has-data': cell !== null }"
                  :style="cell !== null ? { backgroundColor: getCellColor(cell.returnPct) } : {}"
                  :title="cell !== null ? `${monthLabels[idx]} ${row.year}: ${formatPct(cell.returnPct)} (${cell.trades} trades, P&L: ${formatAmount(cell.pnl)})` : `${monthLabels[idx]} ${row.year}: No trades`"
                >
                  <span v-if="cell !== null" class="cell-value" :class="{ 'dark-text': Math.abs(cell.returnPct) < 3 }">
                    {{ formatPctShort(cell.returnPct) }}
                  </span>
                </td>
              </tr>

              <!-- Yearly totals row (only shown with multiple years) -->
              <tr v-if="yearRows.length > 1" class="totals-row">
                <td class="year-label totals-label">Total</td>
                <td
                  v-for="(total, idx) in monthlyTotals"
                  :key="'total-' + idx"
                  class="heatmap-cell totals-cell"
                  :class="{ 'has-data': total !== null }"
                  :style="total !== null ? { backgroundColor: getCellColor(total.returnPct) } : {}"
                  :title="total !== null ? `${monthLabels[idx]} Total: ${formatPct(total.returnPct)} (${total.trades} trades)` : ''"
                >
                  <span v-if="total !== null" class="cell-value" :class="{ 'dark-text': Math.abs(total.returnPct) < 3 }">
                    {{ formatPctShort(total.returnPct) }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Color legend -->
        <div class="heatmap-legend">
          <span class="legend-label">Return %</span>
          <div class="legend-bar">
            <div class="legend-gradient"></div>
            <div class="legend-ticks">
              <span>{{ formatPct(-maxAbsPct) }}</span>
              <span>0</span>
              <span>{{ formatPct(maxAbsPct) }}</span>
            </div>
          </div>
        </div>

        <!-- Summary stats -->
        <div class="heatmap-summary">
          <div class="summary-stat">
            <span class="summary-label">Best Month</span>
            <span class="summary-value positive" v-if="bestMonth">
              {{ bestMonth.label }}: {{ formatPct(bestMonth.returnPct) }}
            </span>
            <span class="summary-value muted" v-else>—</span>
          </div>
          <div class="summary-stat">
            <span class="summary-label">Worst Month</span>
            <span class="summary-value negative" v-if="worstMonth">
              {{ worstMonth.label }}: {{ formatPct(worstMonth.returnPct) }}
            </span>
            <span class="summary-value muted" v-else>—</span>
          </div>
          <div class="summary-stat">
            <span class="summary-label">Avg Monthly Return</span>
            <span class="summary-value" :class="avgMonthlyReturn >= 0 ? 'positive' : 'negative'">
              {{ formatPct(avgMonthlyReturn) }}
            </span>
          </div>
          <div class="summary-stat">
            <span class="summary-label">Positive Months</span>
            <span class="summary-value">
              {{ positiveMonths }} / {{ totalMonthsWithData }} ({{ positiveMonths > 0 ? ((positiveMonths / totalMonthsWithData) * 100).toFixed(0) : 0 }}%)
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, inject } from 'vue'
import type { Trade } from '@/types'

const props = defineProps<{
  trades: Trade[]
}>()

const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Inject currency formatter from parent
const formatCurrency = inject<(amount: number) => string>('formatCurrency', (v: number) => `₹${v.toFixed(0)}`)

interface MonthCell {
  pnl: number
  returnPct: number
  trades: number
}

interface YearRow {
  year: number
  cells: (MonthCell | null)[]
}

// Compute monthly P&L data grouped by year & month
const monthlyDataMap = computed(() => {
  const map = new Map<string, { pnl: number; trades: number; weightedPctSum: number; totalCapital: number }>()

  props.trades.forEach((trade) => {
    const date = new Date(trade.entryDate)
    const year = date.getFullYear()
    const month = date.getMonth()
    const key = `${year}-${month}`

    if (!map.has(key)) {
      map.set(key, { pnl: 0, trades: 0, weightedPctSum: 0, totalCapital: 0 })
    }

    const entry = map.get(key)!
    const tradePnl = trade.pnlAmount || 0
    const tradeCapital = trade.positionSize || 0
    const tradePct = trade.pnlPercentage || 0

    entry.pnl += tradePnl
    entry.trades += 1
    entry.totalCapital += tradeCapital

    // Weighted by capital: each trade's pnlPercentage * its positionSize
    // If positionSize is 0, accumulate the raw percentage for simple averaging
    if (tradeCapital > 0) {
      entry.weightedPctSum += tradePct * tradeCapital
    } else {
      // Fallback: treat as equal-weight with a unit weight
      entry.weightedPctSum += tradePct
    }
  })

  return map
})

// Calculate return % for a monthly data entry
function calcReturnPct(data: { pnl: number; trades: number; weightedPctSum: number; totalCapital: number }): number {
  if (data.totalCapital > 0) {
    // Capital-weighted average of per-trade pnlPercentage
    return data.weightedPctSum / data.totalCapital
  }
  // Fallback: simple average of per-trade pnlPercentage
  if (data.trades > 0) {
    return data.weightedPctSum / data.trades
  }
  return 0
}

// Build year rows for the heatmap grid
const yearRows = computed<YearRow[]>(() => {
  if (props.trades.length === 0) return []

  // Collect all unique years
  const yearsSet = new Set<number>()
  props.trades.forEach((t) => {
    yearsSet.add(new Date(t.entryDate).getFullYear())
  })

  const years = Array.from(yearsSet).sort((a, b) => a - b)

  return years.map((year) => {
    const cells: (MonthCell | null)[] = []
    for (let m = 0; m < 12; m++) {
      const key = `${year}-${m}`
      const data = monthlyDataMap.value.get(key)
      if (data && data.trades > 0) {
        cells.push({
          pnl: data.pnl,
          returnPct: calcReturnPct(data),
          trades: data.trades
        })
      } else {
        cells.push(null)
      }
    }
    return { year, cells }
  })
})

// Monthly totals (aggregate across all years for each month)
const monthlyTotals = computed<(MonthCell | null)[]>(() => {
  if (yearRows.value.length === 0) return Array(12).fill(null)

  const totals: (MonthCell | null)[] = []
  for (let m = 0; m < 12; m++) {
    let totalPnl = 0
    let totalTrades = 0
    let totalWeightedPctSum = 0
    let totalCapital = 0
    let hasData = false

    yearRows.value.forEach((row) => {
      const cell = row.cells[m]
      if (cell !== null && cell !== undefined) {
        hasData = true
        totalPnl += cell.pnl
        totalTrades += cell.trades
        // Re-read from the raw map for accurate aggregation
        const key = `${row.year}-${m}`
        const data = monthlyDataMap.value.get(key)
        if (data) {
          totalCapital += data.totalCapital
          totalWeightedPctSum += data.weightedPctSum
        }
      }
    })

    if (hasData) {
      totals.push({
        pnl: totalPnl,
        returnPct: calcReturnPct({ pnl: totalPnl, trades: totalTrades, weightedPctSum: totalWeightedPctSum, totalCapital }),
        trades: totalTrades
      })
    } else {
      totals.push(null)
    }
  }
  return totals
})

// All non-null cells for statistics
const allCells = computed(() => {
  const cells: (MonthCell & { label: string })[] = []
  yearRows.value.forEach((row) => {
    row.cells.forEach((cell, idx) => {
      if (cell !== null) {
        cells.push({ ...cell, label: `${monthLabels[idx]} ${row.year}` })
      }
    })
  })
  return cells
})

// Max absolute percentage for color scaling
const maxAbsPct = computed(() => {
  if (allCells.value.length === 0) return 10
  const max = Math.max(...allCells.value.map((c) => Math.abs(c.returnPct)))
  return Math.max(max, 1) // at least 1% for scaling
})

// Best & worst months
const bestMonth = computed(() => {
  if (allCells.value.length === 0) return null
  const first = allCells.value[0]
  if (!first) return null
  return allCells.value.reduce((best, c) => (c.returnPct > best.returnPct ? c : best), first)
})

const worstMonth = computed(() => {
  if (allCells.value.length === 0) return null
  const first = allCells.value[0]
  if (!first) return null
  return allCells.value.reduce((worst, c) => (c.returnPct < worst.returnPct ? c : worst), first)
})

const avgMonthlyReturn = computed(() => {
  if (allCells.value.length === 0) return 0
  return allCells.value.reduce((sum, c) => sum + c.returnPct, 0) / allCells.value.length
})

const positiveMonths = computed(() => allCells.value.filter((c) => c.returnPct > 0).length)
const totalMonthsWithData = computed(() => allCells.value.length)

// Color interpolation: green for positive, red for negative
function getCellColor(returnPct: number): string {
  const ratio = Math.min(Math.abs(returnPct) / maxAbsPct.value, 1)

  if (returnPct > 0) {
    // Green: from light to saturated
    const r = Math.round(232 - ratio * 180)
    const g = Math.round(245 - ratio * 60)
    const b = Math.round(233 - ratio * 170)
    return `rgb(${r}, ${g}, ${b})`
  } else if (returnPct < 0) {
    // Red: from light to saturated
    const r = Math.round(254 - ratio * 30)
    const g = Math.round(226 - ratio * 150)
    const b = Math.round(226 - ratio * 150)
    return `rgb(${r}, ${g}, ${b})`
  }
  return '#f3f4f6'
}

function formatPct(pct: number): string {
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function formatPctShort(pct: number): string {
  const sign = pct > 0 ? '+' : ''
  return `${sign}${pct.toFixed(1)}%`
}

function formatAmount(amount: number): string {
  return formatCurrency(amount)
}
</script>

<style scoped>
.monthly-return-heatmap {
  width: 100%;
}

.heatmap-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.06), 0 4px 16px rgba(0, 0, 0, 0.04);
  border: 1px solid #e5e7eb;
}

.heatmap-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1.5rem 0;
}

/* Empty state */
.heatmap-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: #9ca3af;
}

.empty-icon {
  font-size: 2.5rem;
  margin-bottom: 0.75rem;
}

.heatmap-empty p {
  margin: 0;
  font-size: 0.95rem;
}

/* Grid container */
.heatmap-wrapper {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.heatmap-grid-container {
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 transparent;
}

.heatmap-grid-container::-webkit-scrollbar {
  height: 6px;
}

.heatmap-grid-container::-webkit-scrollbar-track {
  background: transparent;
}

.heatmap-grid-container::-webkit-scrollbar-thumb {
  background: #cbd5e1;
  border-radius: 3px;
}

/* Table styling */
.heatmap-table {
  width: 100%;
  min-width: 700px;
  border-collapse: separate;
  border-spacing: 3px;
  table-layout: fixed;
}

.year-header {
  width: 64px;
  min-width: 64px;
}

.month-header {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  text-align: center;
  padding: 0.5rem 0.25rem;
}

.year-label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  padding: 0.5rem 0.75rem;
  white-space: nowrap;
  text-align: left;
}

.totals-label {
  font-weight: 700;
  color: #1f2937;
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

/* Heatmap cells */
.heatmap-cell {
  text-align: center;
  vertical-align: middle;
  height: 44px;
  border-radius: 6px;
  background-color: #f9fafb;
  transition: all 0.2s ease;
  position: relative;
  cursor: default;
}

.heatmap-cell.has-data {
  cursor: pointer;
}

.heatmap-cell.has-data:hover {
  transform: scale(1.08);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.15);
  z-index: 2;
}

.cell-value {
  font-size: 0.75rem;
  font-weight: 600;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.15);
  line-height: 1;
}

.cell-value.dark-text {
  color: #374151;
  text-shadow: none;
}

/* Totals row */
.totals-row {
  border-top: 2px solid #e5e7eb;
}

.totals-cell {
  height: 38px;
  opacity: 0.85;
}

/* Legend */
.heatmap-legend {
  display: flex;
  align-items: center;
  gap: 1rem;
  justify-content: flex-end;
  padding: 0.5rem 0;
}

.legend-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #6b7280;
  white-space: nowrap;
}

.legend-bar {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  width: 180px;
}

.legend-gradient {
  height: 12px;
  border-radius: 6px;
  background: linear-gradient(to right, #dc2626, #fecaca, #f3f4f6, #bbf7d0, #16a34a);
}

.legend-ticks {
  display: flex;
  justify-content: space-between;
  font-size: 0.65rem;
  color: #9ca3af;
  margin-top: 2px;
  padding: 0 2px;
}

/* Summary stats */
.heatmap-summary {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

@media (min-width: 640px) {
  .heatmap-summary {
    grid-template-columns: repeat(4, 1fr);
  }
}

.summary-stat {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  padding: 0.625rem 0.75rem;
  background: #f9fafb;
  border-radius: 10px;
  border: 1px solid #f3f4f6;
}

.summary-label {
  font-size: 0.7rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.summary-value {
  font-size: 0.9rem;
  font-weight: 700;
  color: #374151;
}

.summary-value.positive {
  color: #16a34a;
}

.summary-value.negative {
  color: #dc2626;
}

.summary-value.muted {
  color: #d1d5db;
}

/* Mobile responsiveness */
@media (max-width: 639px) {
  .heatmap-card {
    padding: 1rem;
    border-radius: 12px;
  }

  .heatmap-title {
    font-size: 1.1rem;
    margin-bottom: 1rem;
  }

  .heatmap-cell {
    height: 38px;
  }

  .cell-value {
    font-size: 0.65rem;
  }

  .heatmap-legend {
    flex-direction: column;
    align-items: flex-start;
  }

  .legend-bar {
    width: 100%;
    max-width: 200px;
  }
}
</style>
