import { ref, computed, watch } from 'vue'
import { tradeService } from '../firebase/tradeService.js'

export function useCalendar() {
  // State
  const currentMonth = ref(new Date().getMonth())
  const currentYear = ref(new Date().getFullYear())
  const calendarData = ref([])
  const tradesCache = ref(new Map())

  // Loading states
  const isLoading = ref(false)

  // Error states
  const error = ref(null)

  // Computed current date key for caching
  const currentDateKey = computed(() => `${currentYear.value}-${currentMonth.value}`)

  // Get trades for current month (with caching)
  const getTradesForMonth = async(year, month) => {
    const cacheKey = `${year}-${month}`
    if (tradesCache.value.has(cacheKey)) {
      return tradesCache.value.get(cacheKey)
    }

    try {
      // Get first and last day of the month
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)

      // Format dates for API call
      const startDate = firstDay.toISOString().split('T')[0]
      const endDate = lastDay.toISOString().split('T')[0]

      // Get trades using the existing trade service
      const trades = await tradeService.getFilteredTrades({
        dateRange: 'custom',
        startDate,
        endDate,
        symbol: 'all',
        type: 'all',
        profitability: 'all'
      })

      tradesCache.value.set(cacheKey, trades)
      return trades
    } catch (err) {
      console.error('Error fetching trades for month:', year, month, err)
      throw new Error(`Failed to load trades for ${getMonthName(month)} ${year}. Please check your connection and try again.`)
    }
  }

  // Load calendar data for current month
  const loadCalendarData = async() => {
    isLoading.value = true
    error.value = null

    try {
      const trades = await getTradesForMonth(currentYear.value, currentMonth.value)
      calendarData.value = trades
    } catch (err) {
      error.value = err.message
      calendarData.value = []
    } finally {
      isLoading.value = false
    }
  }

  // Navigation methods
  const goToPreviousMonth = async() => {
    if (currentMonth.value === 0) {
      currentMonth.value = 11
      currentYear.value--
    } else {
      currentMonth.value--
    }
    await loadCalendarData()
  }

  const goToNextMonth = async() => {
    if (currentMonth.value === 11) {
      currentMonth.value = 0
      currentYear.value++
    } else {
      currentMonth.value++
    }
    await loadCalendarData()
  }

  // Helper function to get month name
  const getMonthName = (monthIndex) => {
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]
    return monthNames[monthIndex]
  }

  // Initialize calendar
  const initializeCalendar = async() => {
    await loadCalendarData()
  }

  // Retry function
  const retryCalendar = async() => {
    // Clear cache for current month and reload
    tradesCache.value.delete(currentDateKey.value)
    await loadCalendarData()
  }

  // Clear errors
  const clearErrors = () => {
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
