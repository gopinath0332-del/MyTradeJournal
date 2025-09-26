import { ref, computed, watch } from 'vue'
import { tradeService } from '@/firebase/tradeService'
import type { Trade } from '@/types'

export function useDashboardStats() {
  // Loading states
  const isLoadingStats = ref(false)
  const isLoadingMonthly = ref(false)
  const isLoadingWeekly = ref(false)

  // Error states
  const statsError = ref<string | null>(null)
  const monthlyError = ref<string | null>(null)
  const weeklyError = ref<string | null>(null)

  // Equity curve loading state
  const isLoadingEquityCurve = ref(false)
  const equityCurveError = ref<string | null>(null)

  // Heatmap loading state
  const isLoadingHeatmap = ref(false)
  const heatmapError = ref<string | null>(null)

  // Selected month for equity curve (separate from main dashboard month selection)
  const selectedEquityMonth = ref(new Date().getMonth())

  // Starting equity for the current month (configurable)
  // const _startingEquity = ref(100000) // Default starting equity

  // Year and month selection
  const selectedYear = ref<number>(new Date().getFullYear())
  const selectedMonth = ref<number>(new Date().getMonth())
  const availableYears = ref<number[]>([])
  const availableMonths = ref<number[]>([])

  // Raw trades data (cached)
  const tradesCache = ref<Map<string, Trade[]>>(new Map())

  // Computed trading days from cached trades
  const currentYearTrades = computed(() => {
    const cacheKey = `year_${selectedYear.value}`
    return tradesCache.value.get(cacheKey) || []
  })

  // Computed daily P&L data
  const dailyPnLData = computed(() => {
    if (!currentYearTrades.value.length) return []

    const tradesByDate = currentYearTrades.value.reduce((acc: Record<string, Trade[]>, trade: Trade) => {
      const date = new Date(trade.entryDate).toDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(trade)
      return acc
    }, {} as Record<string, Trade[]>)

    return Object.entries(tradesByDate).map(([date, dayTrades]) => {
      const dailyPnL = dayTrades.reduce((sum: number, trade: Trade) => sum + (trade.pnlAmount || 0), 0)
      return {
        date,
        trades: dayTrades,
        pnl: dailyPnL,
        isProfit: dailyPnL > 0,
        isLoss: dailyPnL < 0
      }
    }).sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  })

  // Computed main statistics
  const stats = computed(() => {
    const dailyData = dailyPnLData.value

    if (!dailyData.length) {
      return {
        tradingDays: 0,
        winDays: 0,
        lossDays: 0,
        maxWinStreak: 0,
        maxLossStreak: 0,
        winRate: 0,
        maxProfitDay: 0,
        maxLossDay: 0,
        avgProfitDay: 0,
        avgLossDay: 0,
        totalProfit: 0,
        totalLoss: 0,
        netPnL: 0,
        avgDailyPnL: 0
      }
    }

    const tradingDays = dailyData.length
    const winDays = dailyData.filter(d => d.isProfit).length
    const lossDays = dailyData.filter(d => d.isLoss).length

    // Calculate streaks
    let currentWinStreak = 0
    let currentLossStreak = 0
    let maxWinStreak = 0
    let maxLossStreak = 0

    dailyData.forEach(day => {
      if (day.isProfit) {
        currentWinStreak++
        currentLossStreak = 0
        maxWinStreak = Math.max(maxWinStreak, currentWinStreak)
      } else if (day.isLoss) {
        currentLossStreak++
        currentWinStreak = 0
        maxLossStreak = Math.max(maxLossStreak, currentLossStreak)
      }
    })

    // Calculate profit/loss statistics
    const profits = dailyData.filter(d => d.isProfit).map(d => d.pnl)
    const losses = dailyData.filter(d => d.isLoss).map(d => Math.abs(d.pnl))

    const totalProfit = profits.reduce((sum, p) => sum + p, 0)
    const totalLoss = losses.reduce((sum, l) => sum + l, 0)
    const netPnL = totalProfit - totalLoss

    const maxProfitDay = profits.length ? Math.max(...profits) : 0
    const maxLossDay = losses.length ? Math.max(...losses) : 0
    const avgProfitDay = profits.length ? totalProfit / profits.length : 0
    const avgLossDay = losses.length ? totalLoss / losses.length : 0
    const avgDailyPnL = tradingDays > 0 ? netPnL / tradingDays : 0

    return {
      tradingDays,
      winDays,
      lossDays,
      maxWinStreak,
      maxLossStreak,
      winRate: tradingDays > 0 ? Math.round((winDays / tradingDays) * 100) : 0,
      maxProfitDay: Math.round(maxProfitDay),
      maxLossDay: Math.round(maxLossDay),
      avgProfitDay: Math.round(avgProfitDay),
      avgLossDay: Math.round(avgLossDay),
      totalProfit: Math.round(totalProfit),
      totalLoss: Math.round(totalLoss),
      netPnL: Math.round(netPnL),
      avgDailyPnL: Math.round(avgDailyPnL)
    }
  })

  // Computed equity curve data for selected month
  const currentMonthEquityData = computed(() => {
    if (!currentYearTrades.value.length) return []

    // const _currentDate = new Date()
    const currentYear = selectedYear.value

    // Filter trades for selected equity month
    const selectedMonthTrades = currentYearTrades.value.filter((trade: Trade) => {
      const tradeDate = new Date(trade.entryDate)
      return tradeDate.getMonth() === selectedEquityMonth.value && tradeDate.getFullYear() === currentYear
    })

    if (!selectedMonthTrades.length) return []

    // Group trades by date and calculate daily P&L
    const dailyPnLMap: Record<string, number> = {}

    selectedMonthTrades.forEach((trade: Trade) => {
      const dateStr = new Date(trade.entryDate).toISOString().split('T')[0] as string
      if (!dailyPnLMap[dateStr]) {
        dailyPnLMap[dateStr] = 0
      }
      dailyPnLMap[dateStr] += (trade.pnlAmount || 0)
    })

    // Convert to array and sort by date
    const dailyPnLArray = Object.entries(dailyPnLMap)
      .map(([date, pnl]) => ({ date, dailyPnL: pnl }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

    // Calculate cumulative P&L (starting from 0)
    let cumulativePnL = 0

    return dailyPnLArray.map(dayData => {
      cumulativePnL += dayData.dailyPnL
      return {
        date: dayData.date,
        dailyPnL: dayData.dailyPnL,
        cumulativePnL
      }
    })
  })

  // Available months for equity curve
  const availableEquityMonths = computed(() => {
    if (!currentYearTrades.value.length) return []

    const monthsWithData = [...new Set(currentYearTrades.value.map((trade: Trade) =>
      new Date(trade.entryDate).getMonth()
    ))].sort((a: number, b: number) => a - b)

    return monthsWithData.map(month => ({
      value: month,
      label: monthNames[month]
    }))
  })

  // Heatmap data for calendar view
  const heatmapData = computed(() => {
    if (!currentYearTrades.value.length) return []

    const year = selectedYear.value
    const months: Array<{
      month: number;
      year: number;
      monthName: string;
      weeks: Array<Array<{
        day: number;
        date: string;
        pnl: number;
        tradeCount: number;
        intensity: number;
      } | null>>;
    }> = []

    // Generate all 12 months
    for (let month = 0; month < 12; month++) {
      const monthData = {
        month,
        year,
        monthName: monthNames[month] || '',
        weeks: [] as Array<Array<{
          day: number;
          date: string;
          pnl: number;
          tradeCount: number;
          intensity: number;
        } | null>>
      }

      // Get first day of month and number of days
      const firstDay = new Date(year, month, 1)
      const lastDay = new Date(year, month + 1, 0)
      const daysInMonth = lastDay.getDate()

      // Calculate weeks in month
      let currentWeek = []

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
        const dayTrades = currentYearTrades.value.filter(trade =>
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

      months.push(monthData)
    }

    return months
  })

  // Auto-adjust equity month selection when available months change
  watch(availableEquityMonths, (newMonths) => {
    if (newMonths.length > 0) {
      // If current selected month is not available, select the first available month
      const isCurrentMonthAvailable = newMonths.some(month => month.value === selectedEquityMonth.value)
      if (!isCurrentMonthAvailable && newMonths.length > 0) {
        selectedEquityMonth.value = newMonths[0]!.value
      }
    }
  }, { immediate: true })

  // Computed monthly breakdown
  const monthlyData = computed(() => {
    if (!currentYearTrades.value.length) return []

    const monthlyStats: Record<number, {
      month: string;
      monthNumber: number;
      trades: Trade[];
    }> = {}

    currentYearTrades.value.forEach((trade: Trade) => {
      const month = new Date(trade.entryDate).getMonth()

      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          month: monthNames[month] || `Month ${month + 1}`,
          monthNumber: month,
          trades: []
        }
      }

      monthlyStats[month]!.trades.push(trade)
    })

    return Object.values(monthlyStats).map(monthData => {
      const trades = monthData.trades
      const totalPnL = trades.reduce((sum: number, trade: Trade) => sum + (trade.pnlAmount || 0), 0)
      const winningTrades = trades.filter((trade: Trade) => (trade.pnlAmount || 0) > 0).length
      const losingTrades = trades.filter((trade: Trade) => (trade.pnlAmount || 0) < 0).length

      // Calculate risk-reward ratio
      const totalWins = trades.filter((trade: Trade) => (trade.pnlAmount || 0) > 0)
        .reduce((sum: number, trade: Trade) => sum + (trade.pnlAmount || 0), 0)
      const totalLosses = Math.abs(trades.filter((trade: Trade) => (trade.pnlAmount || 0) < 0)
        .reduce((sum: number, trade: Trade) => sum + (trade.pnlAmount || 0), 0))

      const avgWin = winningTrades > 0 ? totalWins / winningTrades : 0
      const avgLoss = losingTrades > 0 ? totalLosses / losingTrades : 0
      const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0

      // Calculate remarks breakdown
      const remarksCount: Record<string, number> = {}
      trades.forEach((trade: Trade) => {
        if (trade.remarks && trade.remarks.trim()) {
          const remark = trade.remarks.trim()
          remarksCount[remark] = (remarksCount[remark] || 0) + 1
        }
      })

      return {
        ...monthData,
        totalTrades: trades.length,
        winningTrades,
        losingTrades,
        totalPnL,
        winRate: trades.length > 0 ? Math.round((winningTrades / trades.length) * 100) : 0,
        avgPnL: Math.round(totalPnL / trades.length),
        riskRewardRatio,
        remarksCount
      }
    }).sort((a, b) => a.monthNumber - b.monthNumber)
  })

  // Computed weekly breakdown
  const weeklyData = computed(() => {
    if (!currentYearTrades.value.length) return []

    // Get available months
    const monthsWithData = [...new Set(currentYearTrades.value.map(trade =>
      new Date(trade.entryDate).getMonth()
    ))].sort((a, b) => a - b)

    availableMonths.value = monthsWithData

    // Filter trades by selected month
    const filteredTrades = currentYearTrades.value.filter(trade =>
      new Date(trade.entryDate).getMonth() === selectedMonth.value
    )

    if (!filteredTrades.length) return []

    const weeklyStats: Record<number, {
      weekStart: Date;
      weekRange: string;
      trades: Trade[];
    }> = {}

    filteredTrades.forEach((trade: Trade) => {
      const tradeDate = new Date(trade.entryDate)
      const weekStart = getWeekStart(tradeDate)
      const weekKey = weekStart.getTime()

      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = {
          weekStart,
          weekRange: formatWeekRange(weekStart),
          trades: []
        }
      }

      weeklyStats[weekKey]!.trades.push(trade)
    })

    return Object.values(weeklyStats).map(weekData => {
      const trades = weekData.trades
      const totalPnL = trades.reduce((sum: number, trade: Trade) => sum + (trade.pnlAmount || 0), 0)
      const winningTrades = trades.filter((trade: Trade) => (trade.pnlAmount || 0) > 0).length
      const losingTrades = trades.filter((trade: Trade) => (trade.pnlAmount || 0) < 0).length

      // Calculate risk-reward ratio
      const totalWins = trades.filter((trade: Trade) => (trade.pnlAmount || 0) > 0)
        .reduce((sum: number, trade: Trade) => sum + (trade.pnlAmount || 0), 0)
      const totalLosses = Math.abs(trades.filter((trade: Trade) => (trade.pnlAmount || 0) < 0)
        .reduce((sum: number, trade: Trade) => sum + (trade.pnlAmount || 0), 0))

      const avgWin = winningTrades > 0 ? totalWins / winningTrades : 0
      const avgLoss = losingTrades > 0 ? totalLosses / losingTrades : 0
      const riskRewardRatio = avgLoss > 0 ? avgWin / avgLoss : 0

      return {
        ...(weekData as any),
        totalTrades: trades.length,
        winningTrades,
        losingTrades,
        totalPnL,
        winRate: trades.length > 0 ? Math.round((winningTrades / trades.length) * 100) : 0,
        avgPnL: Math.round(totalPnL / trades.length),
        riskRewardRatio
      }
    }).sort((a, b) => b.weekStart.getTime() - a.weekStart.getTime())
  })

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Helper functions for week calculations
  const getWeekStart = (date: Date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(d.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }

  const formatWeekRange = (weekStart: Date) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)

    const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })

    return `${startStr} - ${endStr}`
  }

  // Get trades for a year (with caching and error handling)
  const getTradesForYear = async(year: number) => {
    const cacheKey = `year_${year}`
    if (tradesCache.value.has(cacheKey)) {
      return tradesCache.value.get(cacheKey)
    }

    try {
      const trades = await tradeService.getTradesByYear(year)
      tradesCache.value.set(cacheKey, trades)
      return trades
    } catch (error) {
      console.error('Error fetching trades for year:', year, error)
      throw new Error(`Failed to load trades for ${year}. Please check your connection and try again.`)
    }
  }

  // Initialize available years
  const initializeAvailableYears = async() => {
    try {
      availableYears.value = await tradeService.getAvailableYears()

      // If selectedYear is not in available years, set to latest year
      if (availableYears.value.length > 0 && !availableYears.value.includes(selectedYear.value)) {
        selectedYear.value = availableYears.value[0] || new Date().getFullYear()
      }
    } catch (error) {
      console.error('Error getting available years:', error)
      throw new Error('Failed to load available years. Please check your connection and try again.')
    }
  }

  // Load trades and update cache
  const loadTradesForYear = async(year: number) => {
    const trades = await getTradesForYear(year)
    // Trades are now cached and computed properties will automatically update
    return trades
  }

  // Calculate main statistics
  const calculateStats = async() => {
    isLoadingStats.value = true
    statsError.value = null

    try {
      await loadTradesForYear(selectedYear.value)
      // Stats are automatically computed via the computed property
    } catch (error: unknown) {
      statsError.value = error instanceof Error ? error.message : 'An error occurred'
      console.error('Error calculating trading stats:', error)
    } finally {
      isLoadingStats.value = false
    }
  }

  // Calculate monthly breakdown
  const calculateMonthlyBreakdown = async() => {
    isLoadingMonthly.value = true
    monthlyError.value = null

    try {
      await loadTradesForYear(selectedYear.value)
      // Monthly data is automatically computed via the computed property
    } catch (error: unknown) {
      monthlyError.value = error instanceof Error ? error.message : 'An error occurred'
      console.error('Error calculating monthly breakdown:', error)
    } finally {
      isLoadingMonthly.value = false
    }
  }

  // Calculate weekly breakdown
  const calculateWeeklyBreakdown = async() => {
    isLoadingWeekly.value = true
    weeklyError.value = null

    try {
      await loadTradesForYear(selectedYear.value)

      // Update available months based on current year trades
      const monthsWithData = [...new Set(currentYearTrades.value.map((trade: Trade) =>
        new Date(trade.entryDate).getMonth()
      ))].sort((a: number, b: number) => a - b)

      availableMonths.value = monthsWithData

      // If current selected month is not available and we have data, fallback to first available month
      if (monthsWithData.length > 0 && !monthsWithData.includes(selectedMonth.value)) {
        selectedMonth.value = monthsWithData[0] || 0
      }

      // Weekly data is automatically computed via the computed property
    } catch (error: unknown) {
      weeklyError.value = error instanceof Error ? error.message : 'An error occurred'
      console.error('Error calculating weekly breakdown:', error)
    } finally {
      isLoadingWeekly.value = false
    }
  }

  // Year change handler
  const onYearChange = (newYear: number) => {
    selectedYear.value = newYear
    selectedMonth.value = new Date().getMonth() // Reset to current month when year changes

    // Reset equity curve month to current month or first available month
    const currentMonth = new Date().getMonth()
    selectedEquityMonth.value = currentMonth

    // Clear cache for old year and recalculate
    tradesCache.value.clear()

    // Load new year data
    Promise.all([
      calculateStats(),
      calculateMonthlyBreakdown(),
      calculateWeeklyBreakdown()
    ]).catch(error => {
      console.error('Error changing year:', error)
    })
  }

  // Month change handler
  const onMonthChange = (newMonth: number) => {
    selectedMonth.value = newMonth
    // Weekly data will automatically update via computed property
  }

  // Equity curve month change handler
  const onEquityMonthChange = (newMonth: number) => {
    selectedEquityMonth.value = newMonth
    // Equity curve data will automatically update via computed property
  }

  // Initialize all data
  const initializeDashboard = async() => {
    try {
      await initializeAvailableYears()
      await Promise.all([
        calculateStats(),
        calculateMonthlyBreakdown(),
        calculateWeeklyBreakdown()
      ])
    } catch (error) {
      console.error('Error initializing dashboard:', error)
      // Set all errors if initialization fails
      statsError.value = 'Failed to initialize dashboard'
      monthlyError.value = 'Failed to initialize dashboard'
      weeklyError.value = 'Failed to initialize dashboard'
    }
  }

  // Clear errors
  const clearErrors = () => {
    statsError.value = null
    monthlyError.value = null
    weeklyError.value = null
  }

  // Retry functions for error recovery
  const retryStats = () => calculateStats()
  const retryMonthly = () => calculateMonthlyBreakdown()
  const retryWeekly = () => calculateWeeklyBreakdown()
  const retryHeatmap = () => {
    heatmapError.value = null
    // Heatmap data is computed automatically, just clear the error
  }

  return {
    // State
    stats,
    monthlyData,
    weeklyData,
    selectedYear,
    selectedMonth,
    availableYears,
    availableMonths,
    monthNames,
    currentYearTrades,

    // Equity curve
    currentMonthEquityData,
    selectedEquityMonth,
    availableEquityMonths,

    // Heatmap
    heatmapData,

    // Loading states
    isLoadingStats,
    isLoadingMonthly,
    isLoadingWeekly,
    isLoadingEquityCurve,
    isLoadingHeatmap,

    // Error states
    statsError,
    monthlyError,
    weeklyError,
    equityCurveError,
    heatmapError,

    // Methods
    initializeDashboard,
    onYearChange,
    onMonthChange,
    onEquityMonthChange,
    calculateStats,
    calculateMonthlyBreakdown,
    calculateWeeklyBreakdown,
    clearErrors,
    retryStats,
    retryMonthly,
    retryWeekly,
    retryHeatmap
  }
}
