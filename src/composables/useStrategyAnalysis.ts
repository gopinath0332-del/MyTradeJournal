import { computed } from 'vue'
import type { Trade } from '@/types'

export function useStrategyAnalysis(trades: any) {
  // Strategy performance calculation
  const strategyPerformance = computed(() => {
    if (trades.value.length === 0) {
      return []
    }
    
    // Check if any trades have strategy data
    const tradesWithStrategy = trades.value.filter((trade: Trade) => trade.strategy && trade.strategy.trim() !== '')
    
    if (tradesWithStrategy.length === 0) {
      return []
    }
    
    const strategies: Record<string, any> = {}

    tradesWithStrategy.forEach((trade: Trade) => {
      const strategy = trade.strategy || 'Unknown'
      
      if (!strategies[strategy]) {
        strategies[strategy] = {
          name: strategy,
          trades: [],
          tradeCount: 0,
          winningTrades: 0,
          totalPnL: 0,
          totalCapital: 0
        }
      }

      strategies[strategy].trades.push(trade)
      strategies[strategy].tradeCount++
      strategies[strategy].totalPnL += (trade.pnlAmount || 0)
      strategies[strategy].totalCapital += (trade.positionSize || 0)
      if ((trade.pnlAmount || 0) > 0) {
        strategies[strategy].winningTrades++
      }
    })

    return Object.values(strategies).map(strategy => ({
      ...strategy,
      winRate: strategy.tradeCount > 0 ? (strategy.winningTrades / strategy.tradeCount) * 100 : 0,
      avgPnL: strategy.tradeCount > 0 ? strategy.totalPnL / strategy.tradeCount : 0,
      avgCapital: strategy.tradeCount > 0 ? strategy.totalCapital / strategy.tradeCount : 0,
      returnOnCapital: strategy.totalCapital > 0 ? (strategy.totalPnL / strategy.totalCapital) * 100 : 0,
      profitFactor: calculateProfitFactor(strategy.trades)
    })).sort((a, b) => b.winRate - a.winRate) // Sort by win rate descending
  })

  // Helper function to calculate profit factor
  const calculateProfitFactor = (trades: Trade[]) => {
    const profits = trades.filter(t => (t.pnlAmount || 0) > 0).reduce((sum, t) => sum + (t.pnlAmount || 0), 0)
    const losses = Math.abs(trades.filter(t => (t.pnlAmount || 0) < 0).reduce((sum, t) => sum + (t.pnlAmount || 0), 0))
    return losses > 0 ? profits / losses : profits > 0 ? 999 : 0
  }

  return {
    strategyPerformance
  }
}