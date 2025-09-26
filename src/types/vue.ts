import { Ref } from 'vue'
import type {
  Trade,
  DashboardStats,
  MonthlyData,
  WeeklyData,
  EquityPoint,
  HeatmapMonth,
  ValidationErrors,
  PnLCalculation
} from './index'

// Component Props Types
export interface StatsGridProps {
  stats: DashboardStats
}

export interface MonthlyBreakdownProps {
  monthlyData: MonthlyData[]
  selectedYear: number
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export interface WeeklyBreakdownProps {
  weeklyData: WeeklyData[]
  selectedMonth: number
  selectedYear: number
  availableMonths: number[]
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export interface EquityCurveProps {
  equityData: EquityPoint[]
  selectedMonth: number
  availableMonths: { value: number; label: string }[]
  isLoading: boolean
  error: string | null
  onMonthChange: (month: number) => void
  onRetry?: () => void
}

export interface TradingHeatmapProps {
  heatmapData: HeatmapMonth[]
  selectedYear: number
  isLoading: boolean
  error: string | null
  onRetry?: () => void
}

export interface YearSelectorProps {
  selectedYear: number
  availableYears: number[]
}

export interface TradeFormProps {
  initialTrade?: Trade | null
}

export interface TradeHistoryProps {
  refreshTrigger?: number
}

// Trade Form Sub-component Props
export interface TradeBasicInfoProps {
  symbol: string
  contract: string
  tradeType: string
  strategy: string
  confidence: number
  errors: ValidationErrors
}

export interface TradeDatesProps {
  entryDate: string
  exitDate: string
  errors: ValidationErrors
}

export interface TradePricingProps {
  entryPrice: string
  exitPrice: string
  quantity: string
  fees: string
  errors: ValidationErrors
}

export interface TradeSummaryProps {
  pnl: PnLCalculation
  capitalUsed: number
  isComplete: boolean
}

export interface TradeMetadataProps {
  notes: string
  remarks: string
  lessons: string
  screenshotUrls: string[]
}

export interface TradeActionsProps {
  isSubmitting: boolean
  isEditMode: boolean
  isFormValid: boolean
}

// Composables Return Types
export interface UseDashboardStatsReturn {
  // Data
  availableYears: Ref<number[]>
  availableMonths: Ref<number[]>
  selectedYear: Ref<number>
  selectedMonth: Ref<number>
  stats: Ref<DashboardStats>
  monthlyData: Ref<MonthlyData[]>
  weeklyData: Ref<WeeklyData[]>
  currentMonthEquityData: Ref<EquityPoint[]>
  selectedEquityMonth: Ref<number>
  availableEquityMonths: Ref<{ value: number; label: string }[]>
  heatmapData: Ref<HeatmapMonth[]>

  // Loading states
  isLoadingStats: Ref<boolean>
  isLoadingMonthly: Ref<boolean>
  isLoadingWeekly: Ref<boolean>
  isLoadingEquityCurve: Ref<boolean>
  isLoadingHeatmap: Ref<boolean>

  // Error states
  statsError: Ref<string | null>
  monthlyError: Ref<string | null>
  weeklyError: Ref<string | null>
  equityCurveError: Ref<string | null>
  heatmapError: Ref<string | null>

  // Methods
  initializeDashboard: () => Promise<void>
  onYearChange: (year: number) => void
  onMonthChange: (month: number) => void
  onEquityMonthChange: (month: number) => void
  calculateStats: () => Promise<void>
  calculateMonthlyBreakdown: () => Promise<void>
  calculateWeeklyBreakdown: () => Promise<void>
  clearErrors: () => void
  retryStats: () => Promise<void>
  retryMonthly: () => Promise<void>
  retryWeekly: () => Promise<void>
  retryHeatmap: () => Promise<void>
}

export interface UseTradeFormReturn {
  // Form data
  formData: Trade
  loading: Ref<boolean>
  error: Ref<string>
  submissionAttempted: Ref<boolean>

  // Computed
  positionSize: Ref<number>
  pnl: Ref<number>
  pnlPercentage: Ref<number>
  isTradeComplete: Ref<boolean>
  validationErrors: Ref<ValidationErrors>
  isFormValid: Ref<boolean>
  hasValidationErrors: Ref<boolean>

  // Methods
  uploadScreenshots: (files: FileList) => Promise<string[]>
  submitForm: () => Promise<Trade | null>
  resetForm: () => void
}

// Event handler types
export interface TradeFormEvents {
  'trade-saved': [trade: Trade]
  'form-reset': []
}

export interface YearSelectorEvents {
  'year-change': [year: number]
}

export interface MonthSelectorEvents {
  'month-change': [month: number]
}
