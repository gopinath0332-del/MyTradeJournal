import { computed } from 'vue'
import type { Trade } from '@/types'

export function useTimeAnalysis(trades: any) {
  // Day of week performance (weekdays only)
  const dayOfWeekPerformance = computed(() => {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const allDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const dayStats: Record<string, { trades: number; totalPnL: number }> = {}

    days.forEach(day => {
      dayStats[day] = { trades: 0, totalPnL: 0 }
    })

    trades.value.forEach((trade: Trade) => {
      const dayOfWeek = allDays[new Date(trade.entryDate).getDay()]
      // Only process weekday trades (skip Sunday and Saturday)
      if (dayOfWeek && days.includes(dayOfWeek) && dayStats[dayOfWeek]) {
        dayStats[dayOfWeek].trades++
        dayStats[dayOfWeek].totalPnL += (trade.pnlAmount || 0)
      }
    })

    return days.map(day => ({
      day,
      trades: dayStats[day]?.trades || 0,
      avgPnL: (dayStats[day]?.trades || 0) > 0 ? (dayStats[day]?.totalPnL || 0) / (dayStats[day]?.trades || 1) : 0
    }))
  })

  // Helper computed property for day of week bar chart scaling
  const maxDayPnL = computed(() => {
    if (dayOfWeekPerformance.value.length === 0) return 1
    return Math.max(...dayOfWeekPerformance.value.map(day => Math.abs(day.avgPnL)))
  })

  // Monthly trend calculation
  const monthlyTrend = computed(() => {
    const months: Record<number, { monthName: string; pnl: number; tradeCount: number }> = {}
    const monthNames = [
      'January', 'February', 'March', 'April', 'May', 'June',
      'July', 'August', 'September', 'October', 'November', 'December'
    ]

    monthNames.forEach((name, index) => {
      months[index] = { monthName: name, pnl: 0, tradeCount: 0 }
    })

    trades.value.forEach((trade: Trade) => {
      const month = new Date(trade.entryDate).getMonth()
      if (months[month]) {
        months[month].pnl += (trade.pnlAmount || 0)
        months[month].tradeCount += 1
      }
    })

    return Object.keys(months)
      .map(key => {
        const monthIndex = parseInt(key)
        const monthData = months[monthIndex]
        return {
          month: monthIndex,
          monthName: monthData?.monthName || '',
          pnl: monthData?.pnl || 0,
          tradeCount: monthData?.tradeCount || 0
        }
      })
      .filter(monthData => monthData.pnl !== 0) // Only include months with non-zero P&L
      .sort((a, b) => b.month - a.month) // Sort by month in descending order (most recent first)
  })

  // Helper computed property for monthly bar chart scaling
  const maxMonthlyPnL = computed(() => {
    if (monthlyTrend.value.length === 0) return 1
    const pnls = monthlyTrend.value.map(m => Math.abs(m.pnl))
    return Math.max(...pnls, 1) // Avoid division by zero
  })

  return {
    dayOfWeekPerformance,
    maxDayPnL,
    monthlyTrend,
    maxMonthlyPnL
  }
}
