/**
 * Equity Curve Drift Detection Types
 * CUSUM and Rolling Z-score analysis for performance regime changes
 */

export interface Trade {
  id: string
  symbol: string
  exitDate: string
  pnlAmount: number
}

export interface EquityPoint {
  date: string
  tradeIndex: number
  pnl: number
  cumulativePnL: number
  returns: number
  zScore: number
  cusumPositive: number
  cusumNegative: number
  isDrift: boolean
  regime: 'normal' | 'improving' | 'deteriorating' | 'volatile'
}

export interface DriftEvent {
  startIndex: number
  endIndex: number
  startDate: string
  endDate: string
  type: 'positive' | 'negative' | 'volatility'
  magnitude: number
  description: string
  severity: 'low' | 'medium' | 'high'
}

export interface RegimeChange {
  changeIndex: number
  changeDate: string
  previousRegime: string
  newRegime: string
  confidence: number
  cusumValue: number
  zScoreValue: number
}

export interface DriftAnalysis {
  equityPoints: EquityPoint[]
  driftEvents: DriftEvent[]
  regimeChanges: RegimeChange[]
  currentRegime: 'normal' | 'improving' | 'deteriorating' | 'volatile'
  statistics: DriftStatistics
  alerts: DriftAlert[]
}

export interface DriftStatistics {
  totalTrades: number
  meanReturn: number
  stdDevReturn: number
  currentZScore: number
  maxPositiveDrift: number
  maxNegativeDrift: number
  driftEventCount: number
  regimeChangeCount: number
  timeInDrift: number
  driftPercentage: number
}

export interface DriftAlert {
  type: 'warning' | 'critical' | 'info'
  message: string
  date: string
  tradeIndex: number
  recommendation: string
  icon: string
}

export interface DriftConfig {
  zScoreWindow: number
  zScoreThreshold: number
  cusumThreshold: number
  cusumDrift: number
}

/**
 * Calculate rolling Z-score for returns
 */
export function calculateRollingZScore(
  returns: number[],
  windowSize = 20
): number[] {
  const zScores: number[] = []

  for (let i = 0; i < returns.length; i++) {
    if (i < windowSize - 1) {
      zScores.push(0)
      continue
    }

    const window = returns.slice(i - windowSize + 1, i + 1)
    const mean = window.reduce((sum, val) => sum + val, 0) / window.length
    const variance = window.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / window.length
    const stdDev = Math.sqrt(variance)

    const currentReturn = returns[i]
    if (currentReturn === undefined) {
      zScores.push(0)
      continue
    }

    const zScore = stdDev > 0 ? (currentReturn - mean) / stdDev : 0
    zScores.push(zScore)
  }

  return zScores
}

/**
 * Calculate CUSUM (Cumulative Sum) for drift detection
 */
export function calculateCUSUM(
  returns: number[],
  targetMean: number,
  drift = 0.5
): { positive: number[], negative: number[] } {
  const positive: number[] = []
  const negative: number[] = []

  let cusumPos = 0
  let cusumNeg = 0

  for (const ret of returns) {
    const deviation = ret - targetMean

    cusumPos = Math.max(0, cusumPos + deviation - drift)
    cusumNeg = Math.min(0, cusumNeg + deviation + drift)

    positive.push(cusumPos)
    negative.push(Math.abs(cusumNeg))
  }

  return { positive, negative }
}

/**
 * Detect regime based on Z-score and CUSUM values
 */
export function detectRegime(
  zScore: number,
  cusumPos: number,
  cusumNeg: number,
  config: DriftConfig
): 'normal' | 'improving' | 'deteriorating' | 'volatile' {
  const absZScore = Math.abs(zScore)

  if (absZScore > config.zScoreThreshold * 2) {
    return 'volatile'
  }

  if (cusumPos > config.cusumThreshold) {
    return 'improving'
  }

  if (cusumNeg > config.cusumThreshold) {
    return 'deteriorating'
  }

  return 'normal'
}

/**
 * Detect drift events in the equity curve
 */
export function detectDriftEvents(
  equityPoints: EquityPoint[],
  config: DriftConfig
): DriftEvent[] {
  const events: DriftEvent[] = []
  let currentEvent: Partial<DriftEvent> | null = null

  for (let i = 0; i < equityPoints.length; i++) {
    const point = equityPoints[i]
    if (!point) continue

    const isDrift = point.cusumPositive > config.cusumThreshold ||
      point.cusumNegative > config.cusumThreshold ||
      Math.abs(point.zScore) > config.zScoreThreshold

    if (isDrift && !currentEvent) {
      currentEvent = {
        startIndex: i,
        startDate: point.date,
        type: point.cusumPositive > point.cusumNegative ? 'positive' :
          Math.abs(point.zScore) > config.zScoreThreshold ? 'volatility' : 'negative',
        magnitude: Math.max(point.cusumPositive, point.cusumNegative, Math.abs(point.zScore))
      }
    } else if (!isDrift && currentEvent) {
      const type = currentEvent.type || 'positive'
      const magnitude = currentEvent.magnitude || 0
      const prevPoint = equityPoints[i - 1]

      events.push({
        startIndex: currentEvent.startIndex || 0,
        endIndex: i - 1,
        startDate: currentEvent.startDate || '',
        endDate: prevPoint?.date || '',
        type,
        magnitude,
        description: getEventDescription(type, magnitude),
        severity: magnitude > config.cusumThreshold * 2 ? 'high' :
          magnitude > config.cusumThreshold * 1.5 ? 'medium' : 'low'
      })

      currentEvent = null
    }
  }

  if (currentEvent) {
    const lastPoint = equityPoints[equityPoints.length - 1]
    if (!lastPoint) return events

    const type = currentEvent.type || 'positive'
    const magnitude = currentEvent.magnitude || 0

    events.push({
      startIndex: currentEvent.startIndex || 0,
      endIndex: equityPoints.length - 1,
      startDate: currentEvent.startDate || '',
      endDate: lastPoint.date,
      type,
      magnitude,
      description: getEventDescription(type, magnitude),
      severity: magnitude > config.cusumThreshold * 2 ? 'high' :
        magnitude > config.cusumThreshold * 1.5 ? 'medium' : 'low'
    })
  }

  return events
}

/**
 * Detect regime changes in trading performance
 */
export function detectRegimeChanges(
  equityPoints: EquityPoint[]
): RegimeChange[] {
  const changes: RegimeChange[] = []

  for (let i = 1; i < equityPoints.length; i++) {
    const prev = equityPoints[i - 1]
    const curr = equityPoints[i]

    if (!prev || !curr) continue

    if (prev.regime !== curr.regime) {
      const cusumValue = Math.max(curr.cusumPositive, curr.cusumNegative)
      const confidence = Math.min(cusumValue / 5, 1)

      changes.push({
        changeIndex: i,
        changeDate: curr.date,
        previousRegime: prev.regime,
        newRegime: curr.regime,
        confidence,
        cusumValue,
        zScoreValue: curr.zScore
      })
    }
  }

  return changes
}

/**
 * Perform complete drift analysis on trades
 */
export function analyzeDrift(
  trades: Trade[],
  config: DriftConfig = {
    zScoreWindow: 20,
    zScoreThreshold: 2.0,
    cusumThreshold: 5.0,
    cusumDrift: 0.5
  }
): DriftAnalysis {
  if (trades.length < config.zScoreWindow) {
    return {
      equityPoints: [],
      driftEvents: [],
      regimeChanges: [],
      currentRegime: 'normal',
      statistics: {
        totalTrades: trades.length,
        meanReturn: 0,
        stdDevReturn: 0,
        currentZScore: 0,
        maxPositiveDrift: 0,
        maxNegativeDrift: 0,
        driftEventCount: 0,
        regimeChangeCount: 0,
        timeInDrift: 0,
        driftPercentage: 0
      },
      alerts: [{
        type: 'info',
        message: `Need at least ${config.zScoreWindow} trades for drift analysis`,
        date: trades[trades.length - 1]?.exitDate || '',
        tradeIndex: trades.length - 1,
        recommendation: 'Continue trading to build statistical baseline',
        icon: '📊'
      }]
    }
  }

  const sortedTrades = [...trades].sort((a, b) =>
    new Date(a.exitDate).getTime() - new Date(b.exitDate).getTime()
  )

  const returns = sortedTrades.map(t => t.pnlAmount)
  const meanReturn = returns.reduce((sum, val) => sum + val, 0) / returns.length
  const variance = returns.reduce((sum, val) => sum + Math.pow(val - meanReturn, 2), 0) / returns.length
  const stdDevReturn = Math.sqrt(variance)

  const zScores = calculateRollingZScore(returns, config.zScoreWindow)
  const cusum = calculateCUSUM(returns, meanReturn, config.cusumDrift)

  let cumulativePnL = 0
  const equityPoints: EquityPoint[] = sortedTrades.map((trade, i) => {
    cumulativePnL += trade.pnlAmount

    const zScore = zScores[i] ?? 0
    const cusumPos = cusum.positive[i] ?? 0
    const cusumNeg = cusum.negative[i] ?? 0

    const regime = detectRegime(zScore, cusumPos, cusumNeg, config)

    const isDrift = cusumPos > config.cusumThreshold ||
      cusumNeg > config.cusumThreshold ||
      Math.abs(zScore) > config.zScoreThreshold

    return {
      date: trade.exitDate,
      tradeIndex: i,
      pnl: trade.pnlAmount,
      cumulativePnL,
      returns: trade.pnlAmount,
      zScore,
      cusumPositive: cusumPos,
      cusumNegative: cusumNeg,
      isDrift,
      regime
    }
  })

  const driftEvents = detectDriftEvents(equityPoints, config)
  const regimeChanges = detectRegimeChanges(equityPoints)

  const lastPoint = equityPoints[equityPoints.length - 1]
  if (!lastPoint) {
    return {
      equityPoints: [],
      driftEvents: [],
      regimeChanges: [],
      currentRegime: 'normal',
      statistics: {
        totalTrades: trades.length,
        meanReturn: 0,
        stdDevReturn: 0,
        currentZScore: 0,
        maxPositiveDrift: 0,
        maxNegativeDrift: 0,
        driftEventCount: 0,
        regimeChangeCount: 0,
        timeInDrift: 0,
        driftPercentage: 0
      },
      alerts: []
    }
  }

  const maxPositiveDrift = Math.max(...cusum.positive)
  const maxNegativeDrift = Math.max(...cusum.negative)
  const driftCount = equityPoints.filter(p => p.isDrift).length
  const driftPercentage = (driftCount / equityPoints.length) * 100

  const alerts = generateDriftAlerts(
    lastPoint,
    driftEvents,
    regimeChanges,
    config
  )

  return {
    equityPoints,
    driftEvents,
    regimeChanges,
    currentRegime: lastPoint.regime,
    statistics: {
      totalTrades: trades.length,
      meanReturn,
      stdDevReturn,
      currentZScore: lastPoint.zScore,
      maxPositiveDrift,
      maxNegativeDrift,
      driftEventCount: driftEvents.length,
      regimeChangeCount: regimeChanges.length,
      timeInDrift: driftCount,
      driftPercentage
    },
    alerts
  }
}

/**
 * Generate drift alerts based on analysis
 */
function generateDriftAlerts(
  lastPoint: EquityPoint,
  driftEvents: DriftEvent[],
  regimeChanges: RegimeChange[],
  config: DriftConfig
): DriftAlert[] {
  const alerts: DriftAlert[] = []

  if (Math.abs(lastPoint.zScore) > config.zScoreThreshold * 1.5) {
    alerts.push({
      type: 'critical',
      message: `High volatility detected: Z-score is ${lastPoint.zScore.toFixed(2)}`,
      date: lastPoint.date,
      tradeIndex: lastPoint.tradeIndex,
      recommendation: 'Consider reducing position sizes until volatility normalizes',
      icon: '🚨'
    })
  }

  if (lastPoint.cusumPositive > config.cusumThreshold) {
    alerts.push({
      type: 'info',
      message: 'Positive drift detected: Performance above baseline',
      date: lastPoint.date,
      tradeIndex: lastPoint.tradeIndex,
      recommendation: 'Current strategy is working well. Document what you\'re doing right.',
      icon: '📈'
    })
  }

  if (lastPoint.cusumNegative > config.cusumThreshold) {
    alerts.push({
      type: 'warning',
      message: 'Negative drift detected: Performance below baseline',
      date: lastPoint.date,
      tradeIndex: lastPoint.tradeIndex,
      recommendation: 'Review recent trades for pattern changes or market condition shifts',
      icon: '📉'
    })
  }

  if (lastPoint.regime === 'deteriorating') {
    alerts.push({
      type: 'warning',
      message: 'Trading regime has shifted to deteriorating',
      date: lastPoint.date,
      tradeIndex: lastPoint.tradeIndex,
      recommendation: 'Consider taking a break to reassess your strategy',
      icon: '⚠️'
    })
  }

  if (lastPoint.regime === 'volatile') {
    alerts.push({
      type: 'critical',
      message: 'High volatility regime detected',
      date: lastPoint.date,
      tradeIndex: lastPoint.tradeIndex,
      recommendation: 'Extreme volatility detected. Reduce risk exposure immediately.',
      icon: '🌪️'
    })
  }

  const recentRegimeChanges = regimeChanges.filter(rc =>
    rc.changeIndex > lastPoint.tradeIndex - 10
  )

  if (recentRegimeChanges.length >= 3) {
    alerts.push({
      type: 'warning',
      message: `${recentRegimeChanges.length} regime changes in last 10 trades`,
      date: lastPoint.date,
      tradeIndex: lastPoint.tradeIndex,
      recommendation: 'Unstable performance pattern. Review your decision-making process.',
      icon: '🔄'
    })
  }

  const recentDriftEvents = driftEvents.filter(event =>
    event.endIndex >= lastPoint.tradeIndex - 20
  )

  if (recentDriftEvents.some(e => e.severity === 'high')) {
    alerts.push({
      type: 'critical',
      message: 'Significant drift event detected in recent trades',
      date: lastPoint.date,
      tradeIndex: lastPoint.tradeIndex,
      recommendation: 'Major performance deviation detected. Immediate strategy review recommended.',
      icon: '🎯'
    })
  }

  if (alerts.length === 0) {
    alerts.push({
      type: 'info',
      message: 'Performance is stable with no significant drift',
      date: lastPoint.date,
      tradeIndex: lastPoint.tradeIndex,
      recommendation: 'Maintain current approach and continue monitoring',
      icon: '✅'
    })
  }

  return alerts
}

/**
 * Get description for drift event
 */
function getEventDescription(type: 'positive' | 'negative' | 'volatility', magnitude: number): string {
  if (type === 'positive') {
    return `Sustained above-average performance period (magnitude: ${magnitude.toFixed(2)})`
  } else if (type === 'negative') {
    return `Sustained below-average performance period (magnitude: ${magnitude.toFixed(2)})`
  } else {
    return `High volatility period with significant fluctuations (magnitude: ${magnitude.toFixed(2)})`
  }
}
