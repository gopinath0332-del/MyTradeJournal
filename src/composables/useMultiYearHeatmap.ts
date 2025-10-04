import { ref, computed } from 'vue'
import { tradeService } from '@/firebase/tradeService'
import { logger } from '@/utils/logger'
import type { Trade } from '@/types'

export function useMultiYearHeatmap() {
  // Loading states
  const isLoadingHeatmap = ref(false)
  const heatmapError = ref<string | null>(null)

  // Data storage
  const availableYears = ref<number[]>([])
  const tradesCache = ref<Map<string, Trade[]>>(new Map())

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Get all trades from cache (across all years)
  const allTrades = computed(() => {
    const trades = []
    for (const yearTrades of tradesCache.value.values()) {
      trades.push(...yearTrades)
    }
    return trades.sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
  })

  // Multi-year heatmap data
  const heatmapData = computed(() => {
    if (!allTrades.value.length || !availableYears.value.length) return []

    type DayData = {
      day: number;
      date: string;
      pnl: number;
      tradeCount: number;
      intensity: number;
    };

    type MonthData = {
      month: number;
      year: number;
      monthName: string;
      weeks: Array<Array<DayData | null>>;
    };

    type YearData = {
      year: number;
      months: MonthData[];
    };

    const allYearData: YearData[] = []

    // Process each year's data
    availableYears.value.forEach(year => {
      const yearTrades = allTrades.value.filter(trade =>
        new Date(trade.entryDate).getFullYear() === year
      )

      if (yearTrades.length === 0) return

      const yearData: YearData = {
        year,
        months: []
      }

      // Generate all 12 months for this year
      for (let month = 0; month < 12; month++) {
        const monthData: MonthData = {
          month,
          year,
          monthName: monthNames[month] || '',
          weeks: []
        }

        // Get first day of month and number of days
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)
        const daysInMonth = lastDay.getDate()

        // Calculate weeks in month
        let currentWeek: Array<DayData | null> = []

        // Add empty cells for days before month starts
        const startDay = firstDay.getDay() // 0 = Sunday
        for (let i = 0; i < startDay; i++) {
          currentWeek.push(null)
        }

        // Add all days of the month
        for (let day = 1; day <= daysInMonth; day++) {
          const date = new Date(year, month, day)
          const dateString = date.toDateString()

          // Find trades for this day
          const dayTrades = yearTrades.filter(trade =>
            new Date(trade.entryDate).toDateString() === dateString
          )

          const dayPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)

          currentWeek.push({
            day,
            date: dateString,
            pnl: dayPnL,
            tradeCount: dayTrades.length,
            intensity: dayPnL === 0 ? 0 : Math.min(4, Math.ceil(Math.abs(dayPnL) / 1000))
          })

          // If week is complete (7 days) or it's the last day of month
          if (currentWeek.length === 7 || day === daysInMonth) {
            // Fill remaining days of week with null if needed
            while (currentWeek.length < 7 && day === daysInMonth) {
              currentWeek.push(null)
            }

            if (currentWeek.length === 7) {
              monthData.weeks.push([...currentWeek])
              currentWeek = []
            }
          }
        }

        yearData.months.push(monthData)
      }

      allYearData.push(yearData)
    })

    return allYearData
  })

  // Get trades for a specific year (with caching)
  const getTradesForYear = async(year: number) => {
    const cacheKey = `year_${year}`
    if (tradesCache.value.has(cacheKey)) {
      return tradesCache.value.get(cacheKey)
    }

    try {
      const trades = await tradeService.getTradesByYear(year) as Trade[]
      tradesCache.value.set(cacheKey, trades)
      return trades
    } catch (error) {
      logger.error(`Error fetching trades for year ${year}`, 'useMultiYearHeatmap', error)
      throw new Error(`Failed to load trades for ${year}. Please check your connection and try again.`)
    }
  }

  // Initialize available years
  const initializeAvailableYears = async() => {
    try {
      availableYears.value = await tradeService.getAvailableYears()
    } catch (error) {
      logger.error('Error getting available years', 'useMultiYearHeatmap', error)
      throw new Error('Failed to load available years. Please check your connection and try again.')
    }
  }

  // Load all years' data
  const loadAllYearsData = async() => {
    isLoadingHeatmap.value = true
    heatmapError.value = null

    try {
      // Load each year's data one by one
      for (const year of availableYears.value) {
        await getTradesForYear(year)
      }
    } catch (error: unknown) {
      heatmapError.value = error instanceof Error ? error.message : 'An error occurred'
      logger.error('Error loading multi-year heatmap data', 'useMultiYearHeatmap', error)
    } finally {
      isLoadingHeatmap.value = false
    }
  }

  // Initialize heatmap data
  const initializeHeatmap = async() => {
    try {
      await initializeAvailableYears()
      if (availableYears.value.length > 0) {
        await loadAllYearsData()
      }
    } catch (error) {
      logger.error('Error initializing heatmap', 'useMultiYearHeatmap', error)
      heatmapError.value = 'Failed to initialize heatmap data'
    }
  }

  // Retry function for error recovery
  const retryHeatmap = async() => {
    await loadAllYearsData()
  }

  return {
    // State
    availableYears,
    heatmapData,

    // Loading states
    isLoadingHeatmap,

    // Error states
    heatmapError,

    // Methods
    initializeHeatmap,
    retryHeatmap
  }
}
