import { ref, computed, watch, type Ref } from 'vue'
import { tradeService } from '@/firebase/tradeService'
import { logger } from '@/utils/logger'
import type { Trade } from '@/types'

interface CalendarComposable {
  currentMonth: Ref<number>
  currentYear: Ref<number>
  calendarData: Ref<Trade[]>
  isLoading: Ref<boolean>
  error: Ref<string | null>
  initializeCalendar: () => Promise<void>
  goToPreviousMonth: () => Promise<void>
  goToNextMonth: () => Promise<void>
  retryCalendar: () => Promise<void>
  clearErrors: () => void
  loadCalendarData: () => Promise<void>
}

export function useCalendar(): CalendarComposable {
  // State
  const currentMonth = ref<number>(new Date().getMonth())
  const currentYear = ref<number>(new Date().getFullYear())
  const calendarData = ref<Trade[]>([])
  const tradesCache = ref<Map<string, Trade[]>>(new Map())

  // Loading states
  const isLoading = ref<boolean>(false)

  // Error states
  const error = ref<string | null>(null)

  // Computed current date key for caching
  const currentDateKey = computed(() => `${currentYear.value}-${currentMonth.value}`)

  // Get trades for current month (with caching)
  const getTradesForMonth = async(year: number, month: number): Promise<Trade[]> => {
    const cacheKey = `${year}-${month}`
    if (tradesCache.value.has(cacheKey)) {
      return tradesCache.value.get(cacheKey) || []
    }

    try {
      // Get first and last day of the month
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      // Format dates for API call
      const startDate = firstDay.toISOString().split('T')[0]!
      const endDate = lastDay.toISOString().split('T')[0]!

      // Get trades using the existing trade service
      const trades = await tradeService.getFilteredTrades({
        dateRange: 'custom' as const,
        startDate,
        endDate,
        symbol: 'all' as const,
        type: 'all' as const,
        profitability: 'all' as const
      })

      tradesCache.value.set(cacheKey, trades)
      return trades
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      logger.error('Error fetching trades for month:', `Year: ${year}, Month: ${month}, Error: ${errorMessage}`)
      throw new Error(`Failed to load trades for ${getMonthName(month)} ${year}. Please check your connection and try again.`)
    }
  }

  // Load calendar data for current month
  const loadCalendarData = async(): Promise<void> => {
    isLoading.value = true
    error.value = null

    try {
      const trades = await getTradesForMonth(currentYear.value, currentMonth.value)
      calendarData.value = trades
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : String(err)
      error.value = errorMessage
      calendarData.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Navigation methods
  const goToPreviousMonth = async(): Promise<void> => {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value--
    } else {
      currentMonth.value--
    }
    await loadCalendarData()
  }

  const goToNextMonth = async(): Promise<void> => {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value++
    } else {
      currentMonth.value++
    }
    await loadCalendarData()
  }

  // Helper function to get month name
  const getMonthName = (monthIndex: number): string => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return monthNames[monthIndex] || 'Unknown'
  }

  // Initialize calendar
  const initializeCalendar = async(): Promise<void> => {
    await loadCalendarData()
  }

  // Retry function
  const retryCalendar = async(): Promise<void> => {
    // Clear cache for current month and reload
    tradesCache.value.delete(currentDateKey.value)
    await loadCalendarData()
  }

  // Clear errors
  const clearErrors = (): void => {
    error.value = null
  }

  // Watch for month/year changes to update data
  watch([currentMonth, currentYear], () => {
    loadCalendarData()
  })

  return {
    // State
    currentMonth,
    currentYear,
    calendarData,

    // Loading states
    isLoading,

    // Error states
    error,

    // Methods
    initializeCalendar,
    goToPreviousMonth,
    goToNextMonth,
    retryCalendar,
    clearErrors,
    loadCalendarData
  }
}
