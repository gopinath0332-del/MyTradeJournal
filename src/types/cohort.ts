/**
 * Cohort Analysis Types
 * Analyze performance differences between early and recent trades
 */

export interface Trade {
  id: string
  symbol: string
  entryDate: string
  exitDate: string
  pnlAmount: number
  pnlPercent?: number
  quantity?: number
  entryPrice?: number
  exitPrice?: number
  strategy?: string
  tags?: string[]
}

export interface CohortMetrics {
  totalTrades: number
  winningTrades: number
  losingTrades: number
  breakEvenTrades: number
  winRate: number
  totalPnL: number
  averagePnL: number
  averageWin: number
  averageLoss: number
  profitFactor: number
  largestWin: number
  largestLoss: number
  expectancy: number
  sharpeRatio: number
  maxDrawdown: number
  averageHoldTime: number
  tradingFrequency: number
  riskRewardRatio: number
}

export interface CohortPeriod {
  name: string
  startDate: string
  endDate: string
  trades: Trade[]
  metrics: CohortMetrics
  tradeCount: number
}

export interface CohortComparison {
  earlyCohort: CohortPeriod
  recentCohort: CohortPeriod
  improvements: ComparisonMetric[]
  deteriorations: ComparisonMetric[]
  stableMetrics: ComparisonMetric[]
  overallTrend: 'improving' | 'declining' | 'stable'
  trendScore: number // -100 to +100
  keyInsights: string[]
}

export interface ComparisonMetric {
  name: string
  earlyValue: number
  recentValue: number
  change: number
  changePercent: number
  isImprovement: boolean
  significance: 'high' | 'medium' | 'low'
  icon: string
  unit?: string
}

export interface CohortSplit {
  method: 'equal' | 'percentage' | 'date'
  splitPoint?: number // For percentage (0-100) or trade count
  splitDate?: string // For date-based split
}

/**
 * Calculate comprehensive metrics for a cohort of trades
 */
export function calculateCohortMetrics(trades: Trade[]): CohortMetrics {
  if (trades.length === 0) {
    return {
      totalTrades: 0,
      winningTrades: 0,
      losingTrades: 0,
      breakEvenTrades: 0,
      winRate: 0,
      totalPnL: 0,
      averagePnL: 0,
      averageWin: 0,
      averageLoss: 0,
      profitFactor: 0,
      largestWin: 0,
      largestLoss: 0,
      expectancy: 0,
      sharpeRatio: 0,
      maxDrawdown: 0,
      averageHoldTime: 0,
      tradingFrequency: 0,
      riskRewardRatio: 0
    }
  }

  const winningTrades = trades.filter(t => t.pnlAmount > 0)
  const losingTrades = trades.filter(t => t.pnlAmount < 0)
  const breakEvenTrades = trades.filter(t => t.pnlAmount === 0)

  const totalPnL = trades.reduce((sum, t) => sum + t.pnlAmount, 0)
  const totalWins = winningTrades.reduce((sum, t) => sum + t.pnlAmount, 0)
  const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnlAmount, 0))

  const averagePnL = totalPnL / trades.length
  const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0
  const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0
  const winRate = (winningTrades.length / trades.length) * 100
  const expectancy = (winRate / 100) * averageWin - ((100 - winRate) / 100) * averageLoss

  const largestWin = winningTrades.length > 0 ? Math.max(...winningTrades.map(t => t.pnlAmount)) : 0
  const largestLoss = losingTrades.length > 0 ? Math.min(...losingTrades.map(t => t.pnlAmount)) : 0

  // Calculate Sharpe Ratio (simplified - using daily returns)
  const returns = trades.map(t => t.pnlAmount)
  const meanReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length
  const variance = returns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / returns.length
  const stdDev = Math.sqrt(variance)
  const sharpeRatio = stdDev > 0 ? (meanReturn / stdDev) * Math.sqrt(252) : 0

  // Calculate Max Drawdown
  let peak = 0
  let maxDrawdown = 0
  let runningTotal = 0

  trades.forEach(trade => {
    runningTotal += trade.pnlAmount
    if (runningTotal > peak) {
      peak = runningTotal
    }
    const drawdown = peak - runningTotal
    if (drawdown > maxDrawdown) {
      maxDrawdown = drawdown
    }
  })

  // Calculate average hold time (in days)
  const holdTimes = trades
    .filter(t => t.entryDate && t.exitDate)
    .map(t => {
      const entry = new Date(t.entryDate).getTime()
      const exit = new Date(t.exitDate).getTime()
      return (exit - entry) / (1000 * 60 * 60 * 24)
    })
  const averageHoldTime = holdTimes.length > 0
    ? holdTimes.reduce((sum, t) => sum + t, 0) / holdTimes.length
    : 0

  // Calculate trading frequency (trades per month)
  const sortedTrades = [...trades].sort((a, b) =>
    new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
  )
  const firstDate = sortedTrades[0]?.exitDate
  const lastDate = sortedTrades[sortedTrades.length - 1]?.exitDate
  let tradingFrequency = 0

  if (firstDate && lastDate) {
    const monthsDiff = (new Date(lastDate).getTime() - new Date(firstDate).getTime()) / (1000 * 60 * 60 * 24 * 30)
    tradingFrequency = monthsDiff > 0 ? trades.length / monthsDiff : trades.length
  }

  // Risk-Reward Ratio
  const riskRewardRatio = averageLoss > 0 ? averageWin / averageLoss : averageWin > 0 ? 999 : 0

  return {
    totalTrades: trades.length,
    winningTrades: winningTrades.length,
    losingTrades: losingTrades.length,
    breakEvenTrades: breakEvenTrades.length,
    winRate,
    totalPnL,
    averagePnL,
    averageWin,
    averageLoss,
    profitFactor,
    largestWin,
    largestLoss,
    expectancy,
    sharpeRatio,
    maxDrawdown,
    averageHoldTime,
    tradingFrequency,
    riskRewardRatio
  }
}

/**
 * Split trades into early and recent cohorts
 */
export function splitTradeCohorts(
  trades: Trade[],
  splitConfig: CohortSplit = { method: 'equal' }
): { early: Trade[], recent: Trade[] } {
  if (trades.length === 0) {
    return { early: [], recent: [] }
  }

  // Sort trades by exit date
  const sortedTrades = [...trades].sort((a, b) =>
    new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
  )

  let splitIndex: number

  switch (splitConfig.method) {
    case 'percentage':
      splitIndex = Math.floor(sortedTrades.length * ((splitConfig.splitPoint || 50) / 100))
      break

    case 'date':
      if (splitConfig.splitDate) {
        const splitDate = new Date(splitConfig.splitDate).getTime()
        splitIndex = sortedTrades.findIndex(t => new Date(t.exitDate).getTime() >= splitDate)
        if (splitIndex === -1) splitIndex = sortedTrades.length
      } else {
        splitIndex = Math.floor(sortedTrades.length / 2)
      }
      break

    case 'equal':
    default:
      splitIndex = Math.floor(sortedTrades.length / 2)
      break
  }

  return {
    early: sortedTrades.slice(0, splitIndex),
    recent: sortedTrades.slice(splitIndex)
  }
}

/**
 * Compare two cohorts and generate insights
 */
export function compareCohorts(
  earlyTrades: Trade[],
  recentTrades: Trade[]
): CohortComparison {
  const earlyMetrics = calculateCohortMetrics(earlyTrades)
  const recentMetrics = calculateCohortMetrics(recentTrades)

  const earlyDates = earlyTrades.map(t => t.exitDate).filter((d): d is string => Boolean(d))
  const recentDates = recentTrades.map(t => t.exitDate).filter((d): d is string => Boolean(d))

  const earlyCohort: CohortPeriod = {
    name: 'Early Trades',
    startDate: earlyDates[0] || '',
    endDate: earlyDates[earlyDates.length - 1] || '',
    trades: earlyTrades,
    metrics: earlyMetrics,
    tradeCount: earlyTrades.length
  }

  const recentCohort: CohortPeriod = {
    name: 'Recent Trades',
    startDate: recentDates[0] || '',
    endDate: recentDates[recentDates.length - 1] || '',
    trades: recentTrades,
    metrics: recentMetrics,
    tradeCount: recentTrades.length
  }

  // Compare metrics
  const metrics: ComparisonMetric[] = [
    {
      name: 'Win Rate',
      earlyValue: earlyMetrics.winRate,
      recentValue: recentMetrics.winRate,
      change: recentMetrics.winRate - earlyMetrics.winRate,
      changePercent: earlyMetrics.winRate > 0
        ? ((recentMetrics.winRate - earlyMetrics.winRate) / earlyMetrics.winRate) * 100
        : 0,
      isImprovement: recentMetrics.winRate > earlyMetrics.winRate,
      significance: Math.abs(recentMetrics.winRate - earlyMetrics.winRate) > 10 ? 'high' :
        Math.abs(recentMetrics.winRate - earlyMetrics.winRate) > 5 ? 'medium' : 'low',
      icon: '🎯',
      unit: '%'
    },
    {
      name: 'Average P&L',
      earlyValue: earlyMetrics.averagePnL,
      recentValue: recentMetrics.averagePnL,
      change: recentMetrics.averagePnL - earlyMetrics.averagePnL,
      changePercent: earlyMetrics.averagePnL !== 0
        ? ((recentMetrics.averagePnL - earlyMetrics.averagePnL) / Math.abs(earlyMetrics.averagePnL)) * 100
        : 0,
      isImprovement: recentMetrics.averagePnL > earlyMetrics.averagePnL,
      significance: Math.abs(recentMetrics.averagePnL - earlyMetrics.averagePnL) > 1000 ? 'high' :
        Math.abs(recentMetrics.averagePnL - earlyMetrics.averagePnL) > 500 ? 'medium' : 'low',
      icon: '💰',
      unit: '₹'
    },
    {
      name: 'Profit Factor',
      earlyValue: earlyMetrics.profitFactor,
      recentValue: recentMetrics.profitFactor,
      change: recentMetrics.profitFactor - earlyMetrics.profitFactor,
      changePercent: earlyMetrics.profitFactor > 0
        ? ((recentMetrics.profitFactor - earlyMetrics.profitFactor) / earlyMetrics.profitFactor) * 100
        : 0,
      isImprovement: recentMetrics.profitFactor > earlyMetrics.profitFactor,
      significance: Math.abs(recentMetrics.profitFactor - earlyMetrics.profitFactor) > 0.5 ? 'high' :
        Math.abs(recentMetrics.profitFactor - earlyMetrics.profitFactor) > 0.2 ? 'medium' : 'low',
      icon: '📊'
    },
    {
      name: 'Expectancy',
      earlyValue: earlyMetrics.expectancy,
      recentValue: recentMetrics.expectancy,
      change: recentMetrics.expectancy - earlyMetrics.expectancy,
      changePercent: earlyMetrics.expectancy !== 0
        ? ((recentMetrics.expectancy - earlyMetrics.expectancy) / Math.abs(earlyMetrics.expectancy)) * 100
        : 0,
      isImprovement: recentMetrics.expectancy > earlyMetrics.expectancy,
      significance: Math.abs(recentMetrics.expectancy - earlyMetrics.expectancy) > 500 ? 'high' :
        Math.abs(recentMetrics.expectancy - earlyMetrics.expectancy) > 200 ? 'medium' : 'low',
      icon: '🎲',
      unit: '₹'
    },
    {
      name: 'Risk-Reward Ratio',
      earlyValue: earlyMetrics.riskRewardRatio,
      recentValue: recentMetrics.riskRewardRatio,
      change: recentMetrics.riskRewardRatio - earlyMetrics.riskRewardRatio,
      changePercent: earlyMetrics.riskRewardRatio > 0
        ? ((recentMetrics.riskRewardRatio - earlyMetrics.riskRewardRatio) / earlyMetrics.riskRewardRatio) * 100
        : 0,
      isImprovement: recentMetrics.riskRewardRatio > earlyMetrics.riskRewardRatio,
      significance: Math.abs(recentMetrics.riskRewardRatio - earlyMetrics.riskRewardRatio) > 0.5 ? 'high' :
        Math.abs(recentMetrics.riskRewardRatio - earlyMetrics.riskRewardRatio) > 0.2 ? 'medium' : 'low',
      icon: '⚖️'
    },
    {
      name: 'Sharpe Ratio',
      earlyValue: earlyMetrics.sharpeRatio,
      recentValue: recentMetrics.sharpeRatio,
      change: recentMetrics.sharpeRatio - earlyMetrics.sharpeRatio,
      changePercent: earlyMetrics.sharpeRatio !== 0
        ? ((recentMetrics.sharpeRatio - earlyMetrics.sharpeRatio) / Math.abs(earlyMetrics.sharpeRatio)) * 100
        : 0,
      isImprovement: recentMetrics.sharpeRatio > earlyMetrics.sharpeRatio,
      significance: Math.abs(recentMetrics.sharpeRatio - earlyMetrics.sharpeRatio) > 0.5 ? 'high' :
        Math.abs(recentMetrics.sharpeRatio - earlyMetrics.sharpeRatio) > 0.2 ? 'medium' : 'low',
      icon: '📈'
    },
    {
      name: 'Max Drawdown',
      earlyValue: earlyMetrics.maxDrawdown,
      recentValue: recentMetrics.maxDrawdown,
      change: recentMetrics.maxDrawdown - earlyMetrics.maxDrawdown,
      changePercent: earlyMetrics.maxDrawdown > 0
        ? ((recentMetrics.maxDrawdown - earlyMetrics.maxDrawdown) / earlyMetrics.maxDrawdown) * 100
        : 0,
      isImprovement: recentMetrics.maxDrawdown < earlyMetrics.maxDrawdown,
      significance: Math.abs(recentMetrics.maxDrawdown - earlyMetrics.maxDrawdown) > 5000 ? 'high' :
        Math.abs(recentMetrics.maxDrawdown - earlyMetrics.maxDrawdown) > 2000 ? 'medium' : 'low',
      icon: '📉',
      unit: '₹'
    },
    {
      name: 'Trading Frequency',
      earlyValue: earlyMetrics.tradingFrequency,
      recentValue: recentMetrics.tradingFrequency,
      change: recentMetrics.tradingFrequency - earlyMetrics.tradingFrequency,
      changePercent: earlyMetrics.tradingFrequency > 0
        ? ((recentMetrics.tradingFrequency - earlyMetrics.tradingFrequency) / earlyMetrics.tradingFrequency) * 100
        : 0,
      isImprovement: false, // Neutral - depends on strategy
      significance: Math.abs(recentMetrics.tradingFrequency - earlyMetrics.tradingFrequency) > 10 ? 'high' :
        Math.abs(recentMetrics.tradingFrequency - earlyMetrics.tradingFrequency) > 5 ? 'medium' : 'low',
      icon: '📅',
      unit: '/month'
    }
  ]

  const improvements = metrics.filter(m => m.isImprovement && Math.abs(m.change) > 0.01)
  const deteriorations = metrics.filter(m => !m.isImprovement && Math.abs(m.change) > 0.01)
  const stableMetrics = metrics.filter(m => Math.abs(m.change) <= 0.01)

  // Calculate trend score
  let trendScore = 0
  improvements.forEach(m => {
    if (m.significance === 'high') trendScore += 15
    else if (m.significance === 'medium') trendScore += 8
    else trendScore += 3
  })
  deteriorations.forEach(m => {
    if (m.significance === 'high') trendScore -= 15
    else if (m.significance === 'medium') trendScore -= 8
    else trendScore -= 3
  })

  const overallTrend = trendScore > 10 ? 'improving' : trendScore < -10 ? 'declining' : 'stable'

  // Generate insights
  const keyInsights = generateInsights(improvements, deteriorations, overallTrend, earlyMetrics, recentMetrics)

  return {
    earlyCohort,
    recentCohort,
    improvements,
    deteriorations,
    stableMetrics,
    overallTrend,
    trendScore,
    keyInsights
  }
}

/**
 * Generate actionable insights from cohort comparison
 */
function generateInsights(
  improvements: ComparisonMetric[],
  deteriorations: ComparisonMetric[],
  trend: 'improving' | 'declining' | 'stable',
  earlyMetrics: CohortMetrics,
  recentMetrics: CohortMetrics
): string[] {
  const insights: string[] = []

  if (trend === 'improving') {
    insights.push('📈 Your trading performance is improving over time. Keep up the good work!')

    if (improvements.some(m => m.name === 'Win Rate' && m.significance === 'high')) {
      insights.push('🎯 Win rate has significantly improved, indicating better trade selection.')
    }

    if (improvements.some(m => m.name === 'Risk-Reward Ratio' && m.significance === 'high')) {
      insights.push('⚖️ Your risk-reward ratio has improved, showing better trade management.')
    }
  } else if (trend === 'declining') {
    insights.push('⚠️ Recent performance shows decline. Review your strategy and risk management.')

    if (deteriorations.some(m => m.name === 'Win Rate' && m.significance === 'high')) {
      insights.push('🎯 Win rate has dropped significantly. Focus on trade quality over quantity.')
    }

    if (deteriorations.some(m => m.name === 'Max Drawdown' && recentMetrics.maxDrawdown > earlyMetrics.maxDrawdown)) {
      insights.push('📉 Drawdowns are increasing. Consider reducing position sizes.')
    }
  } else {
    insights.push('➡️ Performance is stable. Look for opportunities to optimize further.')
  }

  if (recentMetrics.profitFactor > 1.5) {
    insights.push('💪 Recent profit factor is strong. Your edge is working.')
  } else if (recentMetrics.profitFactor < 1) {
    insights.push('🚨 Recent profit factor below 1.0. Review losing trades and adjust strategy.')
  }

  if (recentMetrics.expectancy > 0 && recentMetrics.expectancy > earlyMetrics.expectancy) {
    insights.push('🎲 Positive expectancy is growing. Each trade has better expected value.')
  }

  if (recentMetrics.tradingFrequency > earlyMetrics.tradingFrequency * 2) {
    insights.push('⚡ Trading frequency has doubled. Ensure quality isn\'t sacrificed for quantity.')
  }

  return insights
}
