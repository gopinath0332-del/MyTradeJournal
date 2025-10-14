import { computed, ref, type Ref, type ComputedRef } from 'vue'
import type { Trade } from '@/types'
import { useDrawdownAnalysis, type DrawdownMetrics, type DrawdownPeriod } from './useDrawdownAnalysis'

export interface SymbolDrawdownData {
  symbol: string
  metrics: DrawdownMetrics
  periods: DrawdownPeriod[]
  chartData: { date: string; equity: number; peak: number; drawdown: number; drawdownPercentage: number }[]
  tradeCount: number
}

export function useSymbolDrawdownAnalysis(trades: Ref<Trade[]> | ComputedRef<Trade[]>) {
  const selectedSymbol = ref<string>('all')

  // Get unique symbols from trades
  const availableSymbols = computed(() => {
    if (!trades.value.length) return []

    const symbols = new Set<string>()
    trades.value.forEach((trade: Trade) => {
      if (trade.symbol) {
        symbols.add(trade.symbol)
      }
    })

    return ['all', ...Array.from(symbols).sort()]
  })

  // Filter trades by selected symbol
  const filteredTrades = computed(() => {
    if (selectedSymbol.value === 'all') {
      return trades
    }

    return computed(() =>
      trades.value.filter((trade: Trade) => trade.symbol === selectedSymbol.value)
    )
  })

  // Apply drawdown analysis to filtered trades
  const {
    equityCurve,
    drawdownPeriods,
    drawdownMetrics,
    drawdownChartData
  } = useDrawdownAnalysis(filteredTrades)

  // Symbol-specific drawdown data
  const symbolDrawdownData = computed((): SymbolDrawdownData[] => {
    if (!trades.value.length) return []

    const symbols = availableSymbols.value.filter(s => s !== 'all')

    return symbols.map(symbol => {
      const symbolTrades = computed(() =>
        trades.value.filter((trade: Trade) => trade.symbol === symbol)
      )

      const analysis = useDrawdownAnalysis(symbolTrades)

      return {
        symbol,
        metrics: analysis.drawdownMetrics.value,
        periods: analysis.drawdownPeriods.value,
        chartData: analysis.drawdownChartData.value,
        tradeCount: symbolTrades.value.length
      }
    }).sort((a, b) => Math.abs(b.metrics.maxDrawdown) - Math.abs(a.metrics.maxDrawdown))
  })

  // Set selected symbol
  const setSelectedSymbol = (symbol: string) => {
    selectedSymbol.value = symbol
  }

  return {
    selectedSymbol,
    availableSymbols,
    filteredTrades,
    equityCurve,
    drawdownPeriods,
    drawdownMetrics,
    drawdownChartData,
    symbolDrawdownData,
    setSelectedSymbol
  }
}
