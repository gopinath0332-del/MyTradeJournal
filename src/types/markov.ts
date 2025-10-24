// Markov Chain Types for Trade Sequence Modeling

export type TradeOutcome = 'win' | 'loss' | 'breakeven'
export type TradeState = 'W' | 'L' | 'B' // Win, Loss, Breakeven

export interface TradeSequence {
  trades: TradeOutcome[]
  dates: string[]
  pnls: number[]
  symbols: string[]
}

export interface TransitionMatrix {
  // Probability of transitioning from one state to another
  WW: number // Win -> Win
  WL: number // Win -> Loss
  WB: number // Win -> Breakeven
  LW: number // Loss -> Win
  LL: number // Loss -> Loss
  LB: number // Loss -> Breakeven
  BW: number // Breakeven -> Win
  BL: number // Breakeven -> Loss
  BB: number // Breakeven -> Breakeven
}

export interface SequencePattern {
  pattern: string // e.g., "WLW", "LLL"
  count: number
  probability: number
  avgPnL: number
  occurrences: Array<{
    startDate: string
    endDate: string
    totalPnL: number
    trades: number
  }>
}

export interface StreakAnalysis {
  currentStreak: {
    type: TradeOutcome
    length: number
    totalPnL: number
  }
  longestWinStreak: {
    length: number
    totalPnL: number
    startDate: string
    endDate: string
  }
  longestLossStreak: {
    length: number
    totalPnL: number
    startDate: string
    endDate: string
  }
  averageWinStreak: number
  averageLossStreak: number
}

export interface MarkovPrediction {
  currentState: TradeOutcome
  predictions: {
    nextWinProbability: number
    nextLossProbability: number
    nextBreakevenProbability: number
  }
  confidence: number
  sampleSize: number
}

export interface SequenceMetrics {
  totalTrades: number
  totalSequences: number
  transitionMatrix: TransitionMatrix
  streakAnalysis: StreakAnalysis
  commonPatterns: SequencePattern[]
  prediction: MarkovPrediction | null
  recoveryRate: number // Probability of win after loss
  consecutiveLossImpact: number // How losses affect next trade
}

// Utility functions for Markov analysis
export const classifyTrade = (pnl: number, threshold = 0): TradeOutcome => {
  if (pnl > threshold) return 'win'
  if (pnl < -threshold) return 'loss'
  return 'breakeven'
}

export const tradeToState = (outcome: TradeOutcome): TradeState => {
  switch (outcome) {
    case 'win': return 'W'
    case 'loss': return 'L'
    case 'breakeven': return 'B'
  }
}

export const stateToTrade = (state: TradeState): TradeOutcome => {
  switch (state) {
    case 'W': return 'win'
    case 'L': return 'loss'
    case 'B': return 'breakeven'
  }
}

export const buildTransitionMatrix = (sequence: TradeOutcome[]): TransitionMatrix => {
  const transitions = {
    WW: 0, WL: 0, WB: 0,
    LW: 0, LL: 0, LB: 0,
    BW: 0, BL: 0, BB: 0
  }

  const counts = {
    W: 0, L: 0, B: 0
  }

  // Count transitions
  for (let i = 0; i < sequence.length - 1; i++) {
    const currentOutcome = sequence[i]
    const nextOutcome = sequence[i + 1]
    if (!currentOutcome || !nextOutcome) continue

    const current = tradeToState(currentOutcome)
    const next = tradeToState(nextOutcome)
    const key = `${current}${next}` as keyof typeof transitions

    transitions[key]++
    counts[current]++
  }

  // Convert to probabilities
  const matrix: TransitionMatrix = {
    WW: counts.W > 0 ? transitions.WW / counts.W : 0,
    WL: counts.W > 0 ? transitions.WL / counts.W : 0,
    WB: counts.W > 0 ? transitions.WB / counts.W : 0,
    LW: counts.L > 0 ? transitions.LW / counts.L : 0,
    LL: counts.L > 0 ? transitions.LL / counts.L : 0,
    LB: counts.L > 0 ? transitions.LB / counts.L : 0,
    BW: counts.B > 0 ? transitions.BW / counts.B : 0,
    BL: counts.B > 0 ? transitions.BL / counts.B : 0,
    BB: counts.B > 0 ? transitions.BB / counts.B : 0
  }

  return matrix
}

export const findPatterns = (
  sequence: TradeOutcome[],
  dates: string[],
  pnls: number[],
  patternLength = 3
): SequencePattern[] => {
  const patternMap = new Map<string, {
    count: number
    pnls: number[]
    occurrences: Array<{ startIdx: number; endIdx: number }>
  }>()

  // Find all patterns of specified length
  for (let i = 0; i <= sequence.length - patternLength; i++) {
    const pattern = sequence.slice(i, i + patternLength)
      .map(tradeToState)
      .join('')

    if (!patternMap.has(pattern)) {
      patternMap.set(pattern, { count: 0, pnls: [], occurrences: [] })
    }

    const data = patternMap.get(pattern)
    if (!data) continue

    data.count++
    data.occurrences.push({ startIdx: i, endIdx: i + patternLength - 1 })

    // Calculate PnL for this pattern occurrence
    const patternPnL = pnls.slice(i, i + patternLength).reduce((sum, pnl) => sum + pnl, 0)
    data.pnls.push(patternPnL)
  }

  // Convert to array and calculate statistics
  const patterns: SequencePattern[] = []
  const totalPatterns = sequence.length - patternLength + 1

  patternMap.forEach((data, pattern) => {
    const avgPnL = data.pnls.reduce((sum, pnl) => sum + pnl, 0) / data.pnls.length

    patterns.push({
      pattern,
      count: data.count,
      probability: data.count / totalPatterns,
      avgPnL,
      occurrences: data.occurrences.map(occ => ({
        startDate: dates[occ.startIdx] || '',
        endDate: dates[occ.endIdx] || '',
        totalPnL: pnls.slice(occ.startIdx, occ.endIdx + 1).reduce((sum, pnl) => sum + pnl, 0),
        trades: patternLength
      }))
    })
  })

  return patterns.sort((a, b) => b.count - a.count)
}

export const analyzeStreaks = (
  sequence: TradeOutcome[],
  dates: string[],
  pnls: number[]
): StreakAnalysis => {
  const lastIndex = sequence.length - 1
  const lastPnL = pnls[lastIndex] || 0

  const currentStreak = {
    type: sequence[lastIndex] || 'breakeven',
    length: 1,
    totalPnL: lastPnL
  }

  let longestWinStreak = { length: 0, totalPnL: 0, startDate: '', endDate: '' }
  let longestLossStreak = { length: 0, totalPnL: 0, startDate: '', endDate: '' }

  const winStreaks: number[] = []
  const lossStreaks: number[] = []

  let currentStreakStart = lastIndex
  let streakLength = 1
  let streakPnL = lastPnL
  let streakType = currentStreak.type

  // Analyze current streak (going backwards)
  for (let i = sequence.length - 2; i >= 0; i--) {
    if (sequence[i] === currentStreak.type) {
      currentStreak.length++
      const pnlValue = pnls[i]
      if (pnlValue !== undefined) {
        currentStreak.totalPnL += pnlValue
      }
    } else {
      break
    }
  }

  // Find all streaks
  for (let i = sequence.length - 2; i >= 0; i--) {
    const currentPnL = pnls[i]
    if (currentPnL === undefined) continue

    if (sequence[i] === streakType) {
      streakLength++
      streakPnL += currentPnL
    } else {
      // Streak ended, record it
      if (streakType === 'win') {
        winStreaks.push(streakLength)
        if (streakLength > longestWinStreak.length) {
          longestWinStreak = {
            length: streakLength,
            totalPnL: streakPnL,
            startDate: dates[i + 1] || '',
            endDate: dates[currentStreakStart] || ''
          }
        }
      } else if (streakType === 'loss') {
        lossStreaks.push(streakLength)
        if (streakLength > longestLossStreak.length) {
          longestLossStreak = {
            length: streakLength,
            totalPnL: streakPnL,
            startDate: dates[i + 1] || '',
            endDate: dates[currentStreakStart] || ''
          }
        }
      }

      // Start new streak
      streakType = sequence[i] || 'breakeven'
      streakLength = 1
      streakPnL = currentPnL
      currentStreakStart = i
    }
  }

  // Record final streak
  if (streakType === 'win') {
    winStreaks.push(streakLength)
    if (streakLength > longestWinStreak.length) {
      longestWinStreak = {
        length: streakLength,
        totalPnL: streakPnL,
        startDate: dates[0] || '',
        endDate: dates[currentStreakStart] || ''
      }
    }
  } else if (streakType === 'loss') {
    lossStreaks.push(streakLength)
    if (streakLength > longestLossStreak.length) {
      longestLossStreak = {
        length: streakLength,
        totalPnL: streakPnL,
        startDate: dates[0] || '',
        endDate: dates[currentStreakStart] || ''
      }
    }
  }

  return {
    currentStreak,
    longestWinStreak,
    longestLossStreak,
    averageWinStreak: winStreaks.length > 0
      ? winStreaks.reduce((sum, len) => sum + len, 0) / winStreaks.length
      : 0,
    averageLossStreak: lossStreaks.length > 0
      ? lossStreaks.reduce((sum, len) => sum + len, 0) / lossStreaks.length
      : 0
  }
}

export const predictNextTrade = (
  sequence: TradeOutcome[],
  matrix: TransitionMatrix
): MarkovPrediction | null => {
  if (sequence.length === 0) return null

  const currentState = sequence[sequence.length - 1]
  if (!currentState) return null

  let predictions = { nextWinProbability: 0, nextLossProbability: 0, nextBreakevenProbability: 0 }

  switch (currentState) {
    case 'win':
      predictions = {
        nextWinProbability: matrix.WW,
        nextLossProbability: matrix.WL,
        nextBreakevenProbability: matrix.WB
      }
      break
    case 'loss':
      predictions = {
        nextWinProbability: matrix.LW,
        nextLossProbability: matrix.LL,
        nextBreakevenProbability: matrix.LB
      }
      break
    case 'breakeven':
      predictions = {
        nextWinProbability: matrix.BW,
        nextLossProbability: matrix.BL,
        nextBreakevenProbability: matrix.BB
      }
      break
  }

  // Calculate confidence based on sample size and probability distribution
  const maxProb = Math.max(
    predictions.nextWinProbability,
    predictions.nextLossProbability,
    predictions.nextBreakevenProbability
  )

  const confidence = maxProb * Math.min(sequence.length / 30, 1) // Scale confidence by sample size

  return {
    currentState,
    predictions,
    confidence,
    sampleSize: sequence.length
  }
}

export const calculateRecoveryRate = (sequence: TradeOutcome[]): number => {
  let lossFollowedByWin = 0
  let totalLosses = 0

  for (let i = 0; i < sequence.length - 1; i++) {
    if (sequence[i] === 'loss') {
      totalLosses++
      if (sequence[i + 1] === 'win') {
        lossFollowedByWin++
      }
    }
  }

  return totalLosses > 0 ? lossFollowedByWin / totalLosses : 0
}
