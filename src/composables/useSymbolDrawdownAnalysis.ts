import { computed } from 'vue'
import type { Trade } from '@/types'
import type { DrawdownPeriod, EquityPoint } from './useDrawdownAnalysis'

export interface SymbolDrawdownPeriod extends DrawdownPeriod {
  symbol: string
}

export interface SymbolDrawdownMetrics {
  symbol: string
  maxDrawdown: number
  maxDrawdownPercentage: number
  avgDrawdown: number
  totalDrawdownPeriods: number
}

export function useSymbolDrawdownAnalysis(trades: any) {
  // Calculate equity curve and drawdown periods for each symbol
  const symbolDrawdownPeriods = computed((): SymbolDrawdownPeriod[] => {
    if (!trades.value.length) return []

    // Group trades by symbol
    const tradesBySymbol: Record<string, Trade[]> = {}
    trades.value.forEach((trade: Trade) => {
      const symbol = trade.symbol || 'Unknown'
      if (!tradesBySymbol[symbol]) {
        tradesBySymbol[symbol] = []
      }
      tradesBySymbol[symbol].push(trade)
    })

    const allSymbolPeriods: SymbolDrawdownPeriod[] = []

    // Calculate drawdown periods for each symbol
    Object.entries(tradesBySymbol).forEach(([symbol, symbolTrades]) => {
      // Sort trades by entry date
      const sortedTrades = [...symbolTrades].sort((a, b) => 
        new Date(a.entryDate).getTime() - new Date(b.entryDate).getTime()
      )

      let cumulativePnL = 0
      let runningPeak = 0
      const equityPoints: EquityPoint[] = []

      // Build equity curve for this symbol
      sortedTrades.forEach((trade: Trade) => {
        const tradePnL = trade.pnlAmount || 0
        cumulativePnL += tradePnL
        
        if (cumulativePnL > runningPeak) {
          runningPeak = cumulativePnL
        }

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

      // Identify drawdown periods for this symbol
      const periods: DrawdownPeriod[] = []
      let currentPeriod: Partial<DrawdownPeriod> | null = null

      equityPoints.forEach((point) => {
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
      if (currentPeriod && equityPoints.length > 0) {
        const lastPoint = equityPoints[equityPoints.length - 1]
        if (lastPoint) {
          ;(currentPeriod as any).endDate = lastPoint.date
          ;(currentPeriod as any).isRecovered = false
          
          const startDate = new Date((currentPeriod as any).startDate!)
          const endDate = new Date(lastPoint.date)
          ;(currentPeriod as any).duration = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

          periods.push(currentPeriod as DrawdownPeriod)
        }
      }

      // Add symbol to each period and add to the combined list
      periods.forEach((period) => {
        allSymbolPeriods.push({
          ...period,
          symbol
        })
      })
    })

    // Sort by start date (most recent first)
    return allSymbolPeriods.sort((a, b) =>
      new Date(b.startDate).getTime() - new Date(a.startDate).getTime()
    )
  })

  // Calculate metrics per symbol
  const symbolDrawdownMetrics = computed((): SymbolDrawdownMetrics[] => {
    if (!symbolDrawdownPeriods.value.length) return []

    // Group periods by symbol
    const periodsBySymbol: Record<string, SymbolDrawdownPeriod[]> = {}
    symbolDrawdownPeriods.value.forEach((period) => {
      const symbol = period.symbol
      if (!periodsBySymbol[symbol]) {
        periodsBySymbol[symbol] = []
      }
      periodsBySymbol[symbol]!.push(period)
    })

    // Calculate metrics for each symbol
    return Object.entries(periodsBySymbol).map(([symbol, periods]) => {
      const maxDrawdownPeriod = periods.reduce((max, period) => 
        period.drawdownAmount > max.drawdownAmount ? period : max
      )

      const avgDrawdown = periods.reduce((sum, p) => sum + p.drawdownAmount, 0) / periods.length

      return {
        symbol,
        maxDrawdown: maxDrawdownPeriod.drawdownAmount,
        maxDrawdownPercentage: maxDrawdownPeriod.drawdownPercentage,
        avgDrawdown,
        totalDrawdownPeriods: periods.length
      }
    }).sort((a, b) => b.maxDrawdown - a.maxDrawdown)
  })

  return {
    symbolDrawdownPeriods,
    symbolDrawdownMetrics
  }
}
