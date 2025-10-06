import { computed } from 'vue'
import type { Trade } from '@/types'

export function useSymbolPerformance(trades: any) {
  // Helper function to calculate risk-reward ratio
  const calculateRiskReward = (trades: Trade[]) => {
    const winningTrades = trades.filter(t => (t.pnlAmount || 0) > 0)
    const losingTrades = trades.filter(t => (t.pnlAmount || 0) < 0)
    
    const avgWin = winningTrades.length > 0 
      ? winningTrades.reduce((sum, t) => sum + (t.pnlAmount || 0), 0) / winningTrades.length
      : 0
    
    const avgLoss = losingTrades.length > 0
      ? Math.abs(losingTrades.reduce((sum, t) => sum + (t.pnlAmount || 0), 0) / losingTrades.length)
      : 0
    
    return avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0
  }

  // Symbol performance calculation
  const symbolPerformance = computed(() => {
    const symbols: Record<string, any> = {}

    trades.value.forEach((trade: Trade) => {
      const symbol = trade.symbol || 'Unknown'
      if (!symbols[symbol]) {
        symbols[symbol] = {
          name: symbol,
          trades: [],
          tradeCount: 0,
          winningTrades: 0,
          totalPnL: 0
        }
      }

      symbols[symbol].trades.push(trade)
      symbols[symbol].tradeCount++
      symbols[symbol].totalPnL += (trade.pnlAmount || 0)
      if ((trade.pnlAmount || 0) > 0) {
        symbols[symbol].winningTrades++
      }
    })

    return Object.values(symbols).map(symbol => ({
      ...symbol,
      winRate: symbol.tradeCount > 0 ? (symbol.winningTrades / symbol.tradeCount) * 100 : 0,
      avgPnL: symbol.tradeCount > 0 ? symbol.totalPnL / symbol.tradeCount : 0,
      riskReward: calculateRiskReward(symbol.trades)
    })).sort((a, b) => b.totalPnL - a.totalPnL)
  })

  // Top 10 symbols by total P&L
  const top10Symbols = computed(() => {
    return symbolPerformance.value.slice(0, 10)
  })

  // Helper computed property for horizontal bar chart scaling
  const maxSymbolPnL = computed(() => {
    if (top10Symbols.value.length === 0) return 1
    return Math.max(...top10Symbols.value.map(symbol => Math.abs(symbol.totalPnL)))
  })

  return {
    symbolPerformance,
    top10Symbols,
    maxSymbolPnL
  }
}