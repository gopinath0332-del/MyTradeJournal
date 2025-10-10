/**
 * Utility functions for Trade History components
 */

/**
 * Format date to localized string
 */
export const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

/**
 * Format currency in INR
 */
export const formatCurrency = (amount: number | null | undefined): string => {
  if (amount === null || amount === undefined) return ''
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

/**
 * Calculate P&L for a trade
 */
interface TradeForPnL {
  entryPrice?: number
  exitPrice?: number
  lots?: number
  type?: string
}

export const calculatePnL = (trade: TradeForPnL): number => {
  if (trade.entryPrice && trade.exitPrice && trade.lots) {
    const priceDiff = trade.exitPrice - trade.entryPrice
    const multiplier = trade.type === 'SELL' ? -1 : 1
    return priceDiff * trade.lots * multiplier
  }
  return 0
}
