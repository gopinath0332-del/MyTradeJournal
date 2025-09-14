import { ref, computed } from 'vue'
import { tradeService } from '../firebase/tradeService.js'

export function useDashboardStats() {
  // Loading states
  const isLoadingStats = ref(false)
  const isLoadingMonthly = ref(false)
  const isLoadingWeekly = ref(false)

  // Error states
  const statsError = ref(null)
  const monthlyError = ref(null)
  const weeklyError = ref(null)

  // Year and month selection
  const selectedYear = ref(new Date().getFullYear())
  const selectedMonth = ref(new Date().getMonth())
  const availableYears = ref([])
  const availableMonths = ref([])

  // Raw trades data (cached)
  const tradesCache = ref(new Map())

  // Computed trading days from cached trades
  const currentYearTrades = computed(() => {
    const cacheKey = `year_${selectedYear.value}`
    return tradesCache.value.get(cacheKey) || []
  })

  // Computed daily P&L data
  const dailyPnLData = computed(() => {
    if (!currentYearTrades.value.length) return []
    
    const tradesByDate = currentYearTrades.value.reduce((acc, trade) => {
      const date = new Date(trade.entryDate).toDateString()
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(trade)
      return acc
    }, {})

    return Object.entries(tradesByDate).map(([date, dayTrades]) => {
      const dailyPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
      return {
        date,
        trades: dayTrades,
        pnl: dailyPnL,
        isProfit: dailyPnL > 0,
        isLoss: dailyPnL < 0
      }
    }).sort((a, b) => new Date(a.date) - new Date(b.date))
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

  // Computed monthly breakdown
  const monthlyData = computed(() => {
    if (!currentYearTrades.value.length) return []

    const monthlyStats = {}
    
    currentYearTrades.value.forEach(trade => {
      const month = new Date(trade.entryDate).getMonth()
      
      if (!monthlyStats[month]) {
        monthlyStats[month] = {
          month: monthNames[month],
          monthNumber: month,
          trades: []
        }
      }
      
      monthlyStats[month].trades.push(trade)
    })
    
    return Object.values(monthlyStats).map(monthData => {
      const trades = monthData.trades
      const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
      const winningTrades = trades.filter(trade => (trade.pnlAmount || 0) > 0).length
      const losingTrades = trades.filter(trade => (trade.pnlAmount || 0) < 0).length
      
      return {
        ...monthData,
        totalTrades: trades.length,
        winningTrades,
        losingTrades,
        totalPnL,
        winRate: trades.length > 0 ? Math.round((winningTrades / trades.length) * 100) : 0,
        avgPnL: Math.round(totalPnL / trades.length)
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

    const weeklyStats = {}
    
    filteredTrades.forEach(trade => {
      const tradeDate = new Date(trade.entryDate)
      const weekStart = getWeekStart(tradeDate)
      const weekKey = weekStart.getTime()
      
      if (!weeklyStats[weekKey]) {
        weeklyStats[weekKey] = {
          weekStart: weekStart,
          weekRange: formatWeekRange(weekStart),
          trades: []
        }
      }
      
      weeklyStats[weekKey].trades.push(trade)
    })
    
    return Object.values(weeklyStats).map(weekData => {
      const trades = weekData.trades
      const totalPnL = trades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
      const winningTrades = trades.filter(trade => (trade.pnlAmount || 0) > 0).length
      const losingTrades = trades.filter(trade => (trade.pnlAmount || 0) < 0).length
      
      return {
        ...weekData,
        totalTrades: trades.length,
        winningTrades,
        losingTrades,
        totalPnL,
        winRate: trades.length > 0 ? Math.round((winningTrades / trades.length) * 100) : 0,
        avgPnL: Math.round(totalPnL / trades.length)
      }
    }).sort((a, b) => b.weekStart - a.weekStart)
  })

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  // Helper functions for week calculations
  const getWeekStart = (date) => {
    const d = new Date(date)
    const day = d.getDay()
    const diff = d.getDate() - day + (day === 0 ? -6 : 1)
    const weekStart = new Date(d.setDate(diff))
    weekStart.setHours(0, 0, 0, 0)
    return weekStart
  }
  
  const formatWeekRange = (weekStart) => {
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekEnd.getDate() + 6)
    
    const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    
    return `${startStr} - ${endStr}`
  }

  // Get trades for a year (with caching and error handling)
  const getTradesForYear = async (year) => {
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
  const initializeAvailableYears = async () => {
    try {
      availableYears.value = await tradeService.getAvailableYears()
      
      // If selectedYear is not in available years, set to latest year
      if (availableYears.value.length > 0 && !availableYears.value.includes(selectedYear.value)) {
        selectedYear.value = availableYears.value[0]
      }
    } catch (error) {
      console.error('Error getting available years:', error)
      throw new Error('Failed to load available years. Please check your connection and try again.')
    }
  }

  // Load trades and update cache
  const loadTradesForYear = async (year) => {
    try {
      const trades = await getTradesForYear(year)
      // Trades are now cached and computed properties will automatically update
      return trades
    } catch (error) {
      throw error
    }
  }

  // Calculate main statistics
  const calculateStats = async () => {
    isLoadingStats.value = true
    statsError.value = null
    
    try {
      await loadTradesForYear(selectedYear.value)
      // Stats are automatically computed via the computed property
    } catch (error) {
      statsError.value = error.message
      console.error('Error calculating trading stats:', error)
    } finally {
      isLoadingStats.value = false
    }
  }

  // Calculate monthly breakdown
  const calculateMonthlyBreakdown = async () => {
    isLoadingMonthly.value = true
    monthlyError.value = null
    
    try {
      await loadTradesForYear(selectedYear.value)
      // Monthly data is automatically computed via the computed property
    } catch (error) {
      monthlyError.value = error.message
      console.error('Error calculating monthly breakdown:', error)
    } finally {
      isLoadingMonthly.value = false
    }
  }

  // Calculate weekly breakdown
  const calculateWeeklyBreakdown = async () => {
    isLoadingWeekly.value = true
    weeklyError.value = null
    
    try {
      await loadTradesForYear(selectedYear.value)
      
      // Update available months based on current year trades
      const monthsWithData = [...new Set(currentYearTrades.value.map(trade => 
        new Date(trade.entryDate).getMonth()
      ))].sort((a, b) => a - b)
      
      availableMonths.value = monthsWithData
      
      // If current selected month is not available and we have data, fallback to first available month
      if (monthsWithData.length > 0 && !monthsWithData.includes(selectedMonth.value)) {
        selectedMonth.value = monthsWithData[0]
      }
      
      // Weekly data is automatically computed via the computed property
    } catch (error) {
      weeklyError.value = error.message
      console.error('Error calculating weekly breakdown:', error)
    } finally {
      isLoadingWeekly.value = false
    }
  }

  // Year change handler
  const onYearChange = (newYear) => {
    selectedYear.value = newYear
    selectedMonth.value = new Date().getMonth() // Reset to current month when year changes
    
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
  const onMonthChange = (newMonth) => {
    selectedMonth.value = parseInt(newMonth)
    // Weekly data will automatically update via computed property
  }

  // Initialize all data
  const initializeDashboard = async () => {
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
    
    // Loading states
    isLoadingStats,
    isLoadingMonthly,
    isLoadingWeekly,
    
    // Error states
    statsError,
    monthlyError,
    weeklyError,
    
    // Methods
    initializeDashboard,
    onYearChange,
    onMonthChange,
    calculateStats,
    calculateMonthlyBreakdown,
    calculateWeeklyBreakdown,
    clearErrors,
    retryStats,
    retryMonthly,
    retryWeekly
  }
}