import { computed } from 'vue'
import type { Trade } from '@/types'

export interface DrawdownPeriod {
  startDate: string
  endDate: string
  peakValue: number
  troughValue: number
  drawdownAmount: number
  drawdownPercentage: number
  duration: number // days
  recoveryDate?: string
  recoveryTime?: number // days from trough to recovery
  isRecovered: boolean
}

export interface DrawdownMetrics {
  maxDrawdown: number
  maxDrawdownPercentage: number
  avgDrawdown: number
  avgDrawdownPercentage: number
  avgDrawdownDuration: number
  avgRecoveryTime: number
  totalDrawdownPeriods: number
  currentDrawdown: number
  currentDrawdownPercentage: number
  currentDrawdownDuration: number
  longestDrawdownDuration: number
  longestRecoveryTime: number
  drawdownFrequency: number // drawdowns per year
}

export interface EquityPoint {
  date: string
  dailyPnL: number
  cumulativePnL: number
  runningPeak: number
  drawdown: number
  drawdownPercentage: number
  isInDrawdown: boolean
}

export function useDrawdownAnalysis(trades: any) {
  // Calculate equity curve with drawdown data
  const equityCurve = computed(() => {
    if (!trades.value.length) return []

    // Sort trades by entry date
    const sortedTrades = [...trades.value].sort((a, b) =>
      new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
    )

    let cumulativePnL = 0
    let runningPeak = 0
    const equityPoints: EquityPoint[] = []

    sortedTrades.forEach((trade: Trade) => {
      const tradePnL = trade.pnlAmount || 0
      cumulativePnL += tradePnL

      // Update running peak (highest equity reached)
      if (cumulativePnL > runningPeak) {
        runningPeak = cumulativePnL
      }

      // Calculate drawdown
      const drawdown = runningPeak - cumulativePnL
      const drawdownPercentage = runningPeak > 0 ? (drawdown / runningPeak) * 100 : 0

      equityPoints.push({
        date: trade.entryDate,
        dailyPnL: tradePnL,
        cumulativePnL,
        runningPeak,
        drawdown,
        drawdownPercentage,
        isInDrawdown: drawdown > 0
      })
    })

    return equityPoints
  })

  // Identify drawdown periods
  const drawdownPeriods = computed(() => {
    const points = equityCurve.value
    if (!points.length) return []

    const periods: DrawdownPeriod[] = []
    let currentPeriod: Partial<DrawdownPeriod> | null = null

    points.forEach((point) => {
      if (point.isInDrawdown && !currentPeriod) {
        // Start of new drawdown period
        currentPeriod = {
          startDate: point.date,
          peakValue: point.runningPeak,
          troughValue: point.cumulativePnL,
          drawdownAmount: point.drawdown,
          drawdownPercentage: point.drawdownPercentage
        }
      } else if (point.isInDrawdown && currentPeriod) {
        // Continue drawdown period - update if deeper
        if (point.cumulativePnL < currentPeriod.troughValue!) {
          currentPeriod.troughValue = point.cumulativePnL
          currentPeriod.drawdownAmount = point.drawdown
          currentPeriod.drawdownPercentage = point.drawdownPercentage
        }
        currentPeriod.endDate = point.date
      } else if (!point.isInDrawdown && currentPeriod) {
        // End of drawdown period (recovery)
        currentPeriod.endDate = currentPeriod.endDate || currentPeriod.startDate!
        currentPeriod.recoveryDate = point.date
        currentPeriod.isRecovered = true

        // Calculate durations
        const startDate = new Date(currentPeriod.startDate!)
        const endDate = new Date(currentPeriod.endDate!)
        const recoveryDate = new Date(point.date)

        currentPeriod.duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
        currentPeriod.recoveryTime = Math.ceil((recoveryDate.getTime() - endDate.getTime()) / (1000 * 60 * 60 * 24))

        periods.push(currentPeriod as DrawdownPeriod)
        currentPeriod = null
      }
    })

    // Handle ongoing drawdown
    if (currentPeriod && points.length > 0) {
      const lastPoint = points[points.length - 1]
      if (lastPoint) {
        ;(currentPeriod as any).endDate = lastPoint.date
        ;(currentPeriod as any).isRecovered = false

        const startDate = new Date((currentPeriod as any).startDate!)
        const endDate = new Date(lastPoint.date)
        ;(currentPeriod as any).duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

        periods.push(currentPeriod as DrawdownPeriod)
      }
    }

    return periods
  })

  // Calculate comprehensive drawdown metrics
  const drawdownMetrics = computed((): DrawdownMetrics => {
    const periods = drawdownPeriods.value
    const equity = equityCurve.value

    if (!periods.length || !equity.length) {
      return {
        maxDrawdown: 0,
        maxDrawdownPercentage: 0,
        avgDrawdown: 0,
        avgDrawdownPercentage: 0,
        avgDrawdownDuration: 0,
        avgRecoveryTime: 0,
        totalDrawdownPeriods: 0,
        currentDrawdown: 0,
        currentDrawdownPercentage: 0,
        currentDrawdownDuration: 0,
        longestDrawdownDuration: 0,
        longestRecoveryTime: 0,
        drawdownFrequency: 0
      }
    }

    // Find maximum drawdown
    const maxDrawdownPeriod = periods.reduce((max, period) =>
      period.drawdownAmount > max.drawdownAmount ? period : max
    )

    // Calculate averages
    const avgDrawdown = periods.reduce((sum, p) => sum + p.drawdownAmount, 0) / periods.length
    const avgDrawdownPercentage = periods.reduce((sum, p) => sum + p.drawdownPercentage, 0) / periods.length
    const avgDrawdownDuration = periods.reduce((sum, p) => sum + p.duration, 0) / periods.length

    // Calculate recovery metrics for recovered periods
    const recoveredPeriods = periods.filter(p => p.isRecovered)
    const avgRecoveryTime = recoveredPeriods.length > 0
      ? recoveredPeriods.reduce((sum, p) => sum + (p.recoveryTime || 0), 0) / recoveredPeriods.length
      : 0

    // Current drawdown status
    const lastPoint = equity.length > 0 ? equity[equity.length - 1] : null
    const currentPeriod = periods.find(p => !p.isRecovered)

    // Duration calculations
    const longestDrawdownDuration = periods.length > 0 ? Math.max(...periods.map(p => p.duration)) : 0
    const longestRecoveryTime = recoveredPeriods.length > 0
      ? Math.max(...recoveredPeriods.map(p => p.recoveryTime || 0))
      : 0

    // Frequency calculation (drawdowns per year)
    const drawdownFrequency = equity.length >= 2 ? (() => {
      const firstPoint = equity[0]
      const lastPoint = equity[equity.length - 1]
      if (firstPoint && lastPoint) {
        const firstDate = new Date(firstPoint.date)
        const lastDate = new Date(lastPoint.date)
        const yearsSpanned = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
        return yearsSpanned > 0 ? periods.length / yearsSpanned : 0
      }
      return 0
    })() : 0

    return {
      maxDrawdown: maxDrawdownPeriod.drawdownAmount,
      maxDrawdownPercentage: maxDrawdownPeriod.drawdownPercentage,
      avgDrawdown,
      avgDrawdownPercentage,
      avgDrawdownDuration,
      avgRecoveryTime,
      totalDrawdownPeriods: periods.length,
      currentDrawdown: lastPoint?.drawdown || 0,
      currentDrawdownPercentage: lastPoint?.drawdownPercentage || 0,
      currentDrawdownDuration: currentPeriod?.duration || 0,
      longestDrawdownDuration,
      longestRecoveryTime,
      drawdownFrequency
    }
  })

  // Drawdown chart data for visualization
  const drawdownChartData = computed(() => {
    return equityCurve.value.map(point => ({
      date: point.date,
      equity: point.cumulativePnL,
      peak: point.runningPeak,
      drawdown: -point.drawdown, // Negative for chart display
      drawdownPercentage: -point.drawdownPercentage
    }))
  })

  return {
    equityCurve,
    drawdownPeriods,
    drawdownMetrics,
    drawdownChartData
  }
}
