/**
 * Natural Language Processing for Trade Notes
 * Analyzes written trade notes to extract sentiment, patterns, and insights
 */

import type { Trade } from './index'

// Sentiment Analysis
export type SentimentType = 'positive' | 'negative' | 'neutral' | 'mixed'
export type EmotionalState = 'confident' | 'fearful' | 'greedy' | 'disciplined' | 'frustrated' | 'calm' | 'excited' | 'anxious'

export interface SentimentScore {
  overall: number // -1 to 1
  type: SentimentType
  confidence: number // 0 to 1
  positiveWords: string[]
  negativeWords: string[]
}

export interface NoteSentiment {
  tradeId: string
  date: string
  sentiment: SentimentScore
  emotionalState: EmotionalState[]
  noteLength: number
  hasAction: boolean // Contains actionable language
}

// Keyword and Pattern Analysis
export interface KeywordFrequency {
  word: string
  count: number
  sentiment: number // Average sentiment when this word appears
  trades: string[] // Trade IDs where this appears
  winRate: number // Win rate for trades with this keyword
}

export interface EmotionalPattern {
  emotion: EmotionalState
  frequency: number
  winRate: number
  avgPnL: number
  description: string
}

export interface DisciplineMetrics {
  planFollowingScore: number // 0-100
  emotionalControlScore: number // 0-100
  reflectionQuality: number // 0-100
  actionableInsights: number
  positiveReinforcement: number
  negativePatterns: number
}

// Insights and Correlations
export interface NLPInsight {
  type: 'warning' | 'tip' | 'pattern' | 'correlation'
  category: 'emotional' | 'discipline' | 'strategy' | 'timing'
  title: string
  description: string
  impact: 'high' | 'medium' | 'low'
  evidence: {
    tradeCount: number
    winRate?: number
    avgPnL?: number
    keywords?: string[]
  }
}

export interface SentimentTrend {
  date: string
  sentiment: number
  tradeCount: number
  winRate: number
  pnl: number
}

export interface NLPAnalysis {
  // Overall metrics
  totalNotes: number
  notesWithContent: number
  avgNoteLength: number
  overallSentiment: SentimentScore

  // Sentiment analysis
  sentimentByTrade: NoteSentiment[]
  sentimentTrend: SentimentTrend[]

  // Keywords and patterns
  topKeywords: KeywordFrequency[]
  emotionalPatterns: EmotionalPattern[]

  // Discipline tracking
  discipline: DisciplineMetrics

  // Insights
  insights: NLPInsight[]

  // Correlations
  sentimentVsPerformance: {
    correlation: number
    description: string
  }
}

// NLP Configuration
export interface NLPConfig {
  minNoteLength: number
  sentimentThreshold: number
  keywordMinFrequency: number
  emotionConfidenceThreshold: number
}

// Default configuration
export const defaultNLPConfig: NLPConfig = {
  minNoteLength: 10,
  sentimentThreshold: 0.3,
  keywordMinFrequency: 2,
  emotionConfidenceThreshold: 0.5
}

// Sentiment lexicons
const POSITIVE_WORDS = [
  'good', 'great', 'excellent', 'perfect', 'successful', 'profit', 'win', 'gained',
  'strong', 'confident', 'disciplined', 'patient', 'followed', 'plan', 'executed',
  'opportunity', 'momentum', 'breakout', 'target', 'reward', 'achieved', 'worked',
  'smart', 'correct', 'right', 'better', 'improved', 'learning', 'growth'
]

const NEGATIVE_WORDS = [
  'bad', 'terrible', 'loss', 'lost', 'failed', 'mistake', 'error', 'wrong',
  'fear', 'panic', 'revenge', 'greed', 'fomo', 'impulsive', 'emotional',
  'stopped', 'missed', 'late', 'early', 'hesitated', 'chased', 'overtraded',
  'poor', 'weak', 'difficult', 'struggle', 'regret', 'shouldve', 'couldve'
]

const EMOTIONAL_KEYWORDS: Record<EmotionalState, string[]> = {
  confident: ['confident', 'sure', 'certain', 'conviction', 'strong belief', 'comfortable'],
  fearful: ['fear', 'scared', 'worried', 'nervous', 'hesitant', 'uncertain'],
  greedy: ['greed', 'more', 'bigger', 'fomo', 'chase', 'oversize'],
  disciplined: ['plan', 'discipline', 'rules', 'strategy', 'followed', 'patient', 'waited'],
  frustrated: ['frustrat', 'annoyed', 'irritated', 'stuck', 'struggle'],
  calm: ['calm', 'patient', 'relaxed', 'composed', 'steady'],
  excited: ['excited', 'enthusiast', 'eager', 'pumped', 'hyped'],
  anxious: ['anxious', 'stress', 'pressure', 'tense', 'uneasy']
}

const ACTION_WORDS = [
  'will', 'should', 'must', 'need to', 'plan to', 'going to', 'next time',
  'remember', 'focus', 'improve', 'work on', 'avoid', 'continue'
]

// Sentiment Analysis Functions
export function analyzeSentiment(text: string): SentimentScore {
  const words = tokenize(text)
  const positiveMatches = words.filter(w => POSITIVE_WORDS.includes(w))
  const negativeMatches = words.filter(w => NEGATIVE_WORDS.includes(w))

  const positiveScore = positiveMatches.length
  const negativeScore = negativeMatches.length
  const totalScore = positiveScore + negativeScore

  if (totalScore === 0) {
    return {
      overall: 0,
      type: 'neutral',
      confidence: 0.5,
      positiveWords: [],
      negativeWords: []
    }
  }

  const overall = (positiveScore - negativeScore) / (totalScore || 1)
  const confidence = Math.min(totalScore / 10, 1)

  let type: SentimentType = 'neutral'
  if (overall > 0.3) type = 'positive'
  else if (overall < -0.3) type = 'negative'
  else if (positiveScore > 0 && negativeScore > 0) type = 'mixed'

  return {
    overall,
    type,
    confidence,
    positiveWords: positiveMatches,
    negativeWords: negativeMatches
  }
}

export function detectEmotions(text: string): EmotionalState[] {
  const lowerText = text.toLowerCase()
  const emotions: EmotionalState[] = []

  for (const [emotion, keywords] of Object.entries(EMOTIONAL_KEYWORDS)) {
    const hasEmotion = keywords.some(keyword => lowerText.includes(keyword))
    if (hasEmotion) {
      emotions.push(emotion as EmotionalState)
    }
  }

  return emotions.length > 0 ? emotions : ['calm']
}

export function hasActionableContent(text: string): boolean {
  const lowerText = text.toLowerCase()
  return ACTION_WORDS.some(word => lowerText.includes(word))
}

// Helper function to get combined notes from trade
type TradeWithOptionalNotes = Trade & { notes?: string; lessonsLearned?: string }

function getCombinedNotes(trade: TradeWithOptionalNotes): string {
  const notes = trade.notes ?? ''
  const lessons = trade.lessonsLearned ?? ''
  // console.log('Combined Notes:', { notes, lessons })
  // Combine both fields with a separator if both exist
  if (notes && lessons) {
    return `${notes}\n\n${lessons}`
  }

  return notes || lessons
}

// Text processing utilities
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2)
}

// Keyword extraction
export function extractKeywords(trades: Trade[], minFrequency = 2): KeywordFrequency[] {
  const keywordMap = new Map<string, {
    count: number
    sentiments: number[]
    trades: string[]
    wins: number
    total: number
  }>()

  trades.forEach(trade => {
    const combinedNotes = getCombinedNotes(trade)
    if (!combinedNotes || combinedNotes.length < 10 || !trade.id) return

    const words = tokenize(combinedNotes)
    const sentiment = analyzeSentiment(combinedNotes)
    const isWin = (trade.pnl ?? 0) > 0

    words.forEach(word => {
      if (!keywordMap.has(word)) {
        keywordMap.set(word, {
          count: 0,
          sentiments: [],
          trades: [],
          wins: 0,
          total: 0
        })
      }

      const data = keywordMap.get(word)!
      data.count++
      data.sentiments.push(sentiment.overall)
      const tradeId = trade.id ?? ''
      if (tradeId && !data.trades.includes(tradeId)) {
        data.trades.push(tradeId)
        data.total++
        if (isWin) data.wins++
      }
    })
  })

  const keywords: KeywordFrequency[] = []
  keywordMap.forEach((data, word) => {
    if (data.count >= minFrequency && word.length > 3) {
      keywords.push({
        word,
        count: data.count,
        sentiment: data.sentiments.reduce((a, b) => a + b, 0) / data.sentiments.length,
        trades: data.trades,
        winRate: data.total > 0 ? (data.wins / data.total) * 100 : 0
      })
    }
  })

  return keywords.sort((a, b) => b.count - a.count).slice(0, 50)
}

// Emotional pattern analysis
export function analyzeEmotionalPatterns(trades: Trade[]): EmotionalPattern[] {
  const emotionMap = new Map<EmotionalState, {
    count: number
    wins: number
    totalPnL: number
  }>()

  trades.forEach(trade => {
    const combinedNotes = getCombinedNotes(trade)
    if (!combinedNotes || combinedNotes.length < 10) return

    const emotions = detectEmotions(combinedNotes)
    const isWin = (trade.pnl ?? 0) > 0
    const pnl = trade.pnl ?? 0

    emotions.forEach(emotion => {
      if (!emotionMap.has(emotion)) {
        emotionMap.set(emotion, { count: 0, wins: 0, totalPnL: 0 })
      }

      const data = emotionMap.get(emotion)!
      data.count++
      if (isWin) data.wins++
      data.totalPnL += pnl
    })
  })

  const patterns: EmotionalPattern[] = []
  emotionMap.forEach((data, emotion) => {
    patterns.push({
      emotion,
      frequency: data.count,
      winRate: (data.wins / data.count) * 100,
      avgPnL: data.totalPnL / data.count,
      description: getEmotionalDescription(emotion, data.wins / data.count)
    })
  })

  return patterns.sort((a, b) => b.frequency - a.frequency)
}

function getEmotionalDescription(emotion: EmotionalState, winRate: number): string {
  const descriptions: Record<EmotionalState, string> = {
    confident: winRate > 0.5 ? 'Confidence correlates with success' : 'Overconfidence may be an issue',
    fearful: 'Fear often leads to missed opportunities',
    greedy: 'Greed typically results in poor outcomes',
    disciplined: 'Discipline is key to consistent performance',
    frustrated: 'Frustration can cloud judgment',
    calm: 'Staying calm improves decision quality',
    excited: 'Excitement needs to be balanced with discipline',
    anxious: 'Anxiety often precedes poor decisions'
  }
  return descriptions[emotion]
}

// Discipline metrics calculation
export function calculateDisciplineMetrics(trades: Trade[]): DisciplineMetrics {
  let planFollowing = 0
  let emotionalControl = 0
  let reflectionQuality = 0
  let actionableCount = 0
  let positiveReinforcement = 0
  let negativePatterns = 0
  let validNotes = 0

  trades.forEach(trade => {
    const combinedNotes = getCombinedNotes(trade)
    if (!combinedNotes || combinedNotes.length < 10) return

    validNotes++
    const lowerNotes = combinedNotes.toLowerCase()
    const sentiment = analyzeSentiment(combinedNotes)

    // Plan following indicators
    if (lowerNotes.includes('plan') || lowerNotes.includes('strategy') || lowerNotes.includes('followed')) {
      planFollowing++
    }

    // Emotional control indicators
    if (lowerNotes.includes('patient') || lowerNotes.includes('disciplined') || lowerNotes.includes('waited')) {
      emotionalControl++
    }

    // Reflection quality (length and depth)
    if (combinedNotes.length > 100 && (lowerNotes.includes('because') || lowerNotes.includes('learned'))) {
      reflectionQuality++
    }

    // Actionable content
    if (hasActionableContent(combinedNotes)) {
      actionableCount++
    }

    // Positive reinforcement
    if (sentiment.overall > 0.5 && (trade.pnl ?? 0) > 0) {
      positiveReinforcement++
    }

    // Negative patterns
    if (lowerNotes.includes('revenge') || lowerNotes.includes('fomo') || lowerNotes.includes('impulsive')) {
      negativePatterns++
    }
  })

  const total = validNotes || 1

  return {
    planFollowingScore: Math.round((planFollowing / total) * 100),
    emotionalControlScore: Math.round((emotionalControl / total) * 100),
    reflectionQuality: Math.round((reflectionQuality / total) * 100),
    actionableInsights: actionableCount,
    positiveReinforcement,
    negativePatterns
  }
}

// Generate insights from NLP analysis
export function generateInsights(
  trades: Trade[],
  keywords: KeywordFrequency[],
  emotionalPatterns: EmotionalPattern[],
  discipline: DisciplineMetrics
): NLPInsight[] {
  const insights: NLPInsight[] = []

  // Discipline insights
  if (discipline.planFollowingScore < 30) {
    insights.push({
      type: 'warning',
      category: 'discipline',
      title: 'Low Plan Following',
      description: `Only ${discipline.planFollowingScore}% of your notes mention following a plan. Consider documenting your strategy before each trade.`,
      impact: 'high',
      evidence: { tradeCount: trades.length }
    })
  }

  if (discipline.emotionalControlScore > 70) {
    insights.push({
      type: 'tip',
      category: 'emotional',
      title: 'Strong Emotional Control',
      description: `${discipline.emotionalControlScore}% of trades show emotional discipline. Keep maintaining this mental edge.`,
      impact: 'high',
      evidence: { tradeCount: trades.length }
    })
  }

  if (discipline.negativePatterns > trades.length * 0.2) {
    insights.push({
      type: 'warning',
      category: 'emotional',
      title: 'Emotional Trading Patterns Detected',
      description: `${discipline.negativePatterns} trades show revenge trading, FOMO, or impulsive behavior. Focus on emotional control.`,
      impact: 'high',
      evidence: { tradeCount: discipline.negativePatterns }
    })
  }

  // Emotional pattern insights
  const disciplinedPattern = emotionalPatterns.find(p => p.emotion === 'disciplined')
  if (disciplinedPattern && disciplinedPattern.winRate > 60) {
    insights.push({
      type: 'pattern',
      category: 'discipline',
      title: 'Discipline Leads to Success',
      description: `Trades where you followed discipline have a ${disciplinedPattern.winRate.toFixed(1)}% win rate.`,
      impact: 'high',
      evidence: {
        tradeCount: disciplinedPattern.frequency,
        winRate: disciplinedPattern.winRate,
        avgPnL: disciplinedPattern.avgPnL
      }
    })
  }

  const fearfulPattern = emotionalPatterns.find(p => p.emotion === 'fearful')
  if (fearfulPattern && fearfulPattern.winRate < 40) {
    insights.push({
      type: 'warning',
      category: 'emotional',
      title: 'Fear Impacts Performance',
      description: `Trades marked by fear have only ${fearfulPattern.winRate.toFixed(1)}% win rate. Work on confidence building.`,
      impact: 'medium',
      evidence: {
        tradeCount: fearfulPattern.frequency,
        winRate: fearfulPattern.winRate
      }
    })
  }

  // Keyword insights
  const highWinKeywords = keywords.filter(k => k.winRate > 70 && k.count >= 3)
  if (highWinKeywords.length > 0 && highWinKeywords[0]) {
    const topKeyword = highWinKeywords[0]
    insights.push({
      type: 'correlation',
      category: 'strategy',
      title: 'High Win Rate Pattern',
      description: `Trades mentioning "${topKeyword.word}" have ${topKeyword.winRate.toFixed(1)}% win rate. This appears in ${topKeyword.count} trades.`,
      impact: 'medium',
      evidence: {
        tradeCount: topKeyword.trades.length,
        winRate: topKeyword.winRate,
        keywords: [topKeyword.word]
      }
    })
  }

  const lowWinKeywords = keywords.filter(k => k.winRate < 30 && k.count >= 3)
  if (lowWinKeywords.length > 0 && lowWinKeywords[0]) {
    const worstKeyword = lowWinKeywords[0]
    insights.push({
      type: 'warning',
      category: 'strategy',
      title: 'Poor Performance Pattern',
      description: `Trades mentioning "${worstKeyword.word}" have only ${worstKeyword.winRate.toFixed(1)}% win rate. Avoid this pattern.`,
      impact: 'medium',
      evidence: {
        tradeCount: worstKeyword.trades.length,
        winRate: worstKeyword.winRate,
        keywords: [worstKeyword.word]
      }
    })
  }

  return insights.sort((a, b) => {
    const impactScore = { high: 3, medium: 2, low: 1 }
    return impactScore[b.impact] - impactScore[a.impact]
  })
}

// Sentiment trend calculation
export function calculateSentimentTrend(trades: Trade[]): SentimentTrend[] {
  const trendMap = new Map<string, {
    sentiment: number[]
    trades: number
    wins: number
    totalPnL: number
  }>()

  trades.forEach(trade => {
    const combinedNotes = getCombinedNotes(trade)
    if (!combinedNotes || combinedNotes.length < 10 || !trade.entryDate) return

    const date = new Date(trade.entryDate as string).toISOString().split('T')[0] as string
    const sentiment = analyzeSentiment(combinedNotes)
    const isWin = (trade.pnl ?? 0) > 0

    if (!trendMap.has(date)) {
      trendMap.set(date, {
        sentiment: [],
        trades: 0,
        wins: 0,
        totalPnL: 0
      })
    }

    const data = trendMap.get(date)!
    data.sentiment.push(sentiment.overall)
    data.trades++
    if (isWin) data.wins++
    data.totalPnL += trade.pnl ?? 0
  })

  const trends: SentimentTrend[] = []
  trendMap.forEach((data, date) => {
    trends.push({
      date,
      sentiment: data.sentiment.reduce((a, b) => a + b, 0) / data.sentiment.length,
      tradeCount: data.trades,
      winRate: (data.wins / data.trades) * 100,
      pnl: data.totalPnL
    })
  })

  return trends.sort((a, b) => a.date.localeCompare(b.date))
}

// Main analysis function
export function analyzeTradeNotes(
  trades: Trade[],
  config: NLPConfig = defaultNLPConfig
): NLPAnalysis {
  // Filter trades that have either notes or lessons with sufficient content
  const tradesWithNotes = trades.filter(t => {
    const combinedNotes = getCombinedNotes(t)
    return combinedNotes && combinedNotes.length >= config.minNoteLength
  })

  // Sentiment analysis
  const sentimentByTrade: NoteSentiment[] = tradesWithNotes.map(trade => {
    const combinedNotes = getCombinedNotes(trade)
    return {
      tradeId: trade.id ?? '',
      date: trade.entryDate || '',
      sentiment: analyzeSentiment(combinedNotes),
      emotionalState: detectEmotions(combinedNotes),
      noteLength: combinedNotes.length,
      hasAction: hasActionableContent(combinedNotes)
    }
  })

  // Overall sentiment
  const allSentiments = sentimentByTrade.map(s => s.sentiment.overall)
  const overallSentimentScore = allSentiments.reduce((a, b) => a + b, 0) / (allSentiments.length || 1)
  const overallSentiment: SentimentScore = {
    overall: overallSentimentScore,
    type: overallSentimentScore > 0.3 ? 'positive' : overallSentimentScore < -0.3 ? 'negative' : 'neutral',
    confidence: Math.min(allSentiments.length / 20, 1),
    positiveWords: [],
    negativeWords: []
  }

  // Extract keywords and patterns
  const topKeywords = extractKeywords(tradesWithNotes, config.keywordMinFrequency)
  const emotionalPatterns = analyzeEmotionalPatterns(tradesWithNotes)
  const discipline = calculateDisciplineMetrics(tradesWithNotes)
  const sentimentTrend = calculateSentimentTrend(tradesWithNotes)

  // Generate insights
  const insights = generateInsights(tradesWithNotes, topKeywords, emotionalPatterns, discipline)

  // Calculate sentiment vs performance correlation
  let sentimentPnLSum = 0
  let sentimentSum = 0
  let pnlSum = 0
  tradesWithNotes.forEach(trade => {
    const combinedNotes = getCombinedNotes(trade)
    const sentiment = analyzeSentiment(combinedNotes)
    const pnl = trade.pnl ?? 0
    sentimentPnLSum += sentiment.overall * pnl
    sentimentSum += sentiment.overall
    pnlSum += pnl
  })

  const n = tradesWithNotes.length || 1
  const correlation = sentimentPnLSum / n - (sentimentSum / n) * (pnlSum / n)

  return {
    totalNotes: trades.filter(t => {
      const combinedNotes = getCombinedNotes(t)
      return combinedNotes && combinedNotes.length > 0
    }).length,
    notesWithContent: tradesWithNotes.length,
    avgNoteLength: tradesWithNotes.reduce((sum, t) => {
      const combinedNotes = getCombinedNotes(t)
      return sum + combinedNotes.length
    }, 0) / n,
    overallSentiment,
    sentimentByTrade,
    sentimentTrend,
    topKeywords,
    emotionalPatterns,
    discipline,
    insights,
    sentimentVsPerformance: {
      correlation,
      description: correlation > 0.1
        ? 'Positive sentiment correlates with better performance'
        : correlation < -0.1
          ? 'Negative sentiment correlates with worse performance'
          : 'No strong correlation between sentiment and performance'
    }
  }
}
