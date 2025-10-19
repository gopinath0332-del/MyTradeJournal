// Trade related types
export interface Trade {
  id?: string
  symbol: string
  contract: string
  tradeType: 'BUY' | 'SELL'
  entryDate: string
  exitDate?: string
  entryPrice: number
  exitPrice?: number
  quantity: number
  fees: number
  strategy: string
  confidence: number
  notes?: string
  remarks?: string
  lessons?: string
  screenshotUrls?: string[]
  positionSize: number
  pnl?: number
  pnlPercentage?: number
  pnlAmount?: number
  profileId?: string // Associate trade with a profile
  createdAt: string
  updatedAt: string
}

// P&L calculation types
export interface PnLCalculation {
  amount: number
  percentage: number
}

// Dashboard statistics types
export interface DashboardStats {
  tradingDays: number
  winDays: number
  lossDays: number
  maxWinStreak: number
  maxLossStreak: number
  winRate: number
  maxProfitDay: number
  maxLossDay: number
  avgProfitDay: number
  avgLossDay: number
  totalProfit: number
  totalLoss: number
  netPnL: number
  avgDailyPnL: number
}

// Monthly breakdown types
export interface MonthlyData {
  month: string
  monthNumber: number
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalPnL: number
  winRate: number
  avgPnL: number
  riskRewardRatio: number
  remarksBreakdown: Record<string, number>
  trades: Trade[]
}

// Weekly breakdown types
export interface WeeklyData {
  weekStart: Date
  weekRange: string
  totalTrades: number
  winningTrades: number
  losingTrades: number
  totalPnL: number
  winRate: number
  avgPnL: number
  riskRewardRatio: number
}

// Equity curve types
export interface EquityPoint {
  date: string
  dailyPnL: number
  cumulativePnL: number
}

// Heatmap types
export interface HeatmapDay {
  day: number
  date: string
  pnl: number
  tradeCount: number
  intensity: number
}

export interface HeatmapWeek {
  days: (HeatmapDay | null)[]
}

export interface HeatmapMonth {
  month: number
  monthName: string
  weeks: HeatmapWeek[]
}

// Filter types
export interface TradeFilters {
  year?: number
  month?: number
  symbol?: string | 'all'
  strategy?: string
  type?: 'BUY' | 'SELL' | 'all' | ''
  profitability?: 'profitable' | 'loss' | 'profit' | 'all' | ''
  startDate?: string
  endDate?: string
  dateRange?: string | 'all'
}

// Form validation types
export interface ValidationErrors {
  [key: string]: string
}

// Toast notification types
export interface ToastNotification {
  id: number
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message: string
}

// Loading states
export interface LoadingStates {
  isLoadingStats: boolean
  isLoadingMonthly: boolean
  isLoadingWeekly: boolean
  isLoadingEquityCurve: boolean
  isLoadingHeatmap: boolean
}

// Error states
export interface ErrorStates {
  statsError: string | null
  monthlyError: string | null
  weeklyError: string | null
  equityCurveError: string | null
  heatmapError: string | null
}

// Firebase service response types
export interface ServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}
