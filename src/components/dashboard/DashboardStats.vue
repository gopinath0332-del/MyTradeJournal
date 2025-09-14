<!-- DashboardStats.vue -->
<template>
    <div class="dashboard-stats">
        <div class="dashboard-header">
            <h2>Trading Statistics</h2>
            <div class="global-year-selector" v-if="availableYears.length > 0">
                <label for="globalYearSelect">Year:</label>
                <select id="globalYearSelect" v-model="selectedYear" @change="onGlobalYearChange">
                    <option v-for="year in availableYears" :key="`global-${year}`" :value="year">
                        {{ year }}
                    </option>
                </select>
            </div>
        </div>
        <div class="stats-grid" style="position: relative;">
            <!-- Loading overlay for stats -->
            <div v-if="isLoadingStats" class="loader-overlay">
                <div class="spinner"></div>
            </div>
            
            <div class="stat-card">
                <div class="stat-title">Total Trading Days</div>
                <div class="stat-value">{{ tradingDays }}</div>
            </div>
            <div class="stat-card profit">
                <div class="stat-title">Winning Days</div>
                <div class="stat-value">{{ winDays }}</div>
            </div>
            <div class="stat-card loss">
                <div class="stat-title">Loss Days</div>
                <div class="stat-value">{{ lossDays }}</div>
            </div>
            <div class="stat-card streak-win">
                <div class="stat-title">Max Win Streak</div>
                <div class="stat-value">{{ maxWinStreak }} days</div>
            </div>
            <div class="stat-card streak-loss">
                <div class="stat-title">Max Loss Streak</div>
                <div class="stat-value">{{ maxLossStreak }} days</div>
            </div>
            <div class="stat-card win-rate">
                <div class="stat-title">Win Rate</div>
                <div class="stat-value">{{ winRate }}%</div>
            </div>
            <div class="stat-card max-profit">
                <div class="stat-title">Max Profit in a Day</div>
                <div class="stat-value">₹{{ maxProfitDay }}</div>
            </div>
            <div class="stat-card max-loss">
                <div class="stat-title">Max Loss in a Day</div>
                <div class="stat-value">₹{{ maxLossDay }}</div>
            </div>
            <div class="stat-card avg-profit">
                <div class="stat-title">Avg Profit per Day</div>
                <div class="stat-value">₹{{ avgProfitDay }}</div>
            </div>
            <div class="stat-card avg-loss">
                <div class="stat-title">Avg Loss per Day</div>
                <div class="stat-value">₹{{ avgLossDay }}</div>
            </div>
            <div class="stat-card total-profit">
                <div class="stat-title">Total Profit</div>
                <div class="stat-value">₹{{ totalProfit }}</div>
            </div>
            <div class="stat-card total-loss">
                <div class="stat-title">Total Loss</div>
                <div class="stat-value">₹{{ totalLoss }}</div>
            </div>
            <div class="stat-card net-pnl">
                <div class="stat-title">Net P&L</div>
                <div class="stat-value" :class="{ 'positive': netPnL > 0, 'negative': netPnL < 0 }">₹{{ netPnL }}</div>
            </div>
            <div class="stat-card avg-daily-pnl">
                <div class="stat-title">Avg Daily P&L</div>
                <div class="stat-value" :class="{ 'positive': avgDailyPnL > 0, 'negative': avgDailyPnL < 0 }">₹{{
                    avgDailyPnL }}</div>
            </div>
        </div>

        <!-- Weekly Breakdown Section -->
        <div class="weekly-breakdown" v-if="availableYears.length > 0">
            <div class="section-header">
                <h3>Weekly Breakdown</h3>
                <div class="filters-container">
                    <div class="month-selector">
                        <label for="monthSelect">Month:</label>
                        <select id="monthSelect" v-model="selectedMonth" @change="onMonthChange" :disabled="availableMonths.length === 0">
                            <option v-if="availableMonths.length === 0" value="">No data available</option>
                            <option v-for="monthIndex in availableMonths" :key="monthIndex" :value="monthIndex">
                                {{ monthNames[monthIndex] }}
                            </option>
                        </select>
                    </div>
                </div>
            </div>
            
            <!-- Loading state for weekly breakdown -->
            <div v-if="isLoadingWeekly" class="loader-container">
                <div class="spinner"></div>
            </div>
            
            <div v-else-if="weeklyData.length > 0" class="weekly-grid">
                <div v-for="week in weeklyData" :key="week.weekRange" 
                     class="weekly-card" 
                     :class="{ 
                         'profitable': week.totalPnL > 0,
                         'loss': week.totalPnL < 0
                     }">
                    <div class="weekly-header">
                        <h4>{{ week.weekRange }}</h4>
                        <span class="trade-count">{{ week.totalTrades }} trades</span>
                    </div>
                    
                    <div class="weekly-stats">
                        <div class="weekly-stat">
                            <span class="stat-label">P&L:</span>
                            <span class="stat-value" :class="{ 'positive': week.totalPnL > 0, 'negative': week.totalPnL < 0 }">
                                ₹{{ week.totalPnL.toLocaleString() }}
                            </span>
                        </div>
                        <div class="weekly-stat">
                            <span class="stat-label">Win Rate:</span>
                            <span class="stat-value">{{ week.winRate }}%</span>
                        </div>
                        <div class="weekly-stat">
                            <span class="stat-label">Avg P&L:</span>
                            <span class="stat-value" :class="{ 'positive': week.avgPnL > 0, 'negative': week.avgPnL < 0 }">
                                ₹{{ week.avgPnL.toLocaleString() }}
                            </span>
                        </div>
                        <div class="win-loss-breakdown">
                            <span class="wins">{{ week.winningTrades }}W</span>
                            <span class="losses">{{ week.losingTrades }}L</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div v-else-if="availableYears.length > 0" class="no-data-message">
                <p v-if="availableMonths.length === 0">No trading data available for {{ selectedYear }}.</p>
                <p v-else>No trading data available for {{ monthNames[selectedMonth] }} {{ selectedYear }}.</p>
                <p>Select a different {{ availableMonths.length === 0 ? 'year' : 'month' }} or start logging trades!</p>
            </div>
        </div>

        <!-- Monthly Breakdown Section -->
        <div class="monthly-breakdown" v-if="availableYears.length > 0">
            <div class="section-header">
                <h3>Monthly Breakdown</h3>
            </div>
            
            <!-- Loading state for monthly breakdown -->
            <div v-if="isLoadingMonthly" class="loader-container">
                <div class="spinner"></div>
            </div>
            
            <div v-else-if="monthlyData.length > 0" class="monthly-grid">
                <div v-for="month in monthlyData" :key="month.month" 
                     class="monthly-card" 
                     :class="{ 
                         'profitable': month.totalPnL > 0,
                         'loss': month.totalPnL < 0
                     }">
                    <div class="monthly-header">
                        <h4>{{ month.month }}</h4>
                        <span class="trade-count">{{ month.totalTrades }} trades</span>
                    </div>
                    
                    <div class="monthly-stats">
                        <div class="monthly-stat">
                            <span class="stat-label">P&L:</span>
                            <span class="stat-value" :class="{ 'positive': month.totalPnL > 0, 'negative': month.totalPnL < 0 }">
                                ₹{{ month.totalPnL.toLocaleString() }}
                            </span>
                        </div>
                        <div class="monthly-stat">
                            <span class="stat-label">Win Rate:</span>
                            <span class="stat-value">{{ month.winRate }}%</span>
                        </div>
                        <div class="monthly-stat">
                            <span class="stat-label">Avg P&L:</span>
                            <span class="stat-value" :class="{ 'positive': month.avgPnL > 0, 'negative': month.avgPnL < 0 }">
                                ₹{{ month.avgPnL.toLocaleString() }}
                            </span>
                        </div>
                        <div class="win-loss-breakdown">
                            <span class="wins">{{ month.winningTrades }}W</span>
                            <span class="losses">{{ month.losingTrades }}L</span>
                        </div>
                    </div>
                </div>
            </div>
            
            <div v-else-if="availableYears.length > 0" class="no-data-message">
                <p>No trading data available for {{ selectedYear }}.</p>
                <p>Select a different year or start logging trades!</p>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watchEffect } from 'vue'

import { tradeService } from '../../firebase/tradeService.js'

// Loading states
const isLoadingStats = ref(false)
const isLoadingMonthly = ref(false)
const isLoadingWeekly = ref(false)

const tradingDays = ref(0)
const winDays = ref(0)
const lossDays = ref(0)
const maxWinStreak = ref(0)
const maxLossStreak = ref(0)
const winRate = ref(0)
const maxProfitDay = ref(0)
const maxLossDay = ref(0)
const avgProfitDay = ref(0)
const avgLossDay = ref(0)
const totalProfit = ref(0)
const totalLoss = ref(0)
const netPnL = ref(0)
const avgDailyPnL = ref(0)

// Global year selection for all dashboard statistics
const selectedYear = ref(new Date().getFullYear())
const availableYears = ref([])
const monthlyData = ref([])

// Weekly breakdown data
const weeklyData = ref([])
const selectedMonth = ref(new Date().getMonth()) // Default to current month (September = 8)
const availableMonths = ref([]) // Months that have trading data

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const calculateStats = async () => {
    isLoadingStats.value = true
    try {
        const allTrades = await tradeService.getAllTrades()
        
        // Set available years for year selectors
        const years = [...new Set(allTrades.map(trade => new Date(trade.entryDate).getFullYear()))]
        availableYears.value = years.sort((a, b) => b - a)
        
        // If selectedYear is not in available years, set to latest year
        if (availableYears.value.length > 0 && !availableYears.value.includes(selectedYear.value)) {
            selectedYear.value = availableYears.value[0]
        }
        
        // Filter trades by selected year
        const trades = allTrades.filter(trade => 
            new Date(trade.entryDate).getFullYear() === selectedYear.value
        )
        
        // Group trades by date
        const tradesByDate = trades.reduce((acc, trade) => {
            const date = new Date(trade.entryDate).toDateString()
            if (!acc[date]) {
                acc[date] = []
            }
            acc[date].push(trade)
            return acc
        }, {})

        // Calculate total trading days
        tradingDays.value = Object.keys(tradesByDate).length

        // Calculate win/loss days
        let winDaysCount = 0
        let lossDaysCount = 0
        let currentWinStreak = 0
        let currentLossStreak = 0
        let maxWinStreakCount = 0
        let maxLossStreakCount = 0

        let maxProfit = 0
        let maxLoss = 0

        Object.values(tradesByDate).forEach(dayTrades => {
            // Calculate daily P&L
            const dailyPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)

            // Update max profit and loss
            if (dailyPnL > maxProfit) {
                maxProfit = dailyPnL
            }
            if (dailyPnL < maxLoss) {
                maxLoss = dailyPnL
            }

            if (dailyPnL > 0) {
                winDaysCount++
                currentWinStreak++
                currentLossStreak = 0
                maxWinStreakCount = Math.max(maxWinStreakCount, currentWinStreak)
            } else if (dailyPnL < 0) {
                lossDaysCount++
                currentLossStreak++
                currentWinStreak = 0
                maxLossStreakCount = Math.max(maxLossStreakCount, currentLossStreak)
            }
        })

        winDays.value = winDaysCount
        lossDays.value = lossDaysCount
        maxWinStreak.value = maxWinStreakCount
        maxLossStreak.value = maxLossStreakCount

        // Calculate win rate
        winRate.value = tradingDays.value > 0
            ? Math.round((winDaysCount / tradingDays.value) * 100)
            : 0

        // Calculate total profit and loss
        let totalProfitVal = 0
        let totalLossVal = 0
        let profitDaysForAvg = 0
        let lossDaysForAvg = 0

        Object.values(tradesByDate).forEach(dayTrades => {
            const dailyPnL = dayTrades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
            if (dailyPnL > 0) {
                totalProfitVal += dailyPnL
                profitDaysForAvg++
            } else if (dailyPnL < 0) {
                totalLossVal += Math.abs(dailyPnL)
                lossDaysForAvg++
            }
        })

        // Update all statistics
        maxProfitDay.value = Math.round(maxProfit)
        maxLossDay.value = Math.abs(Math.round(maxLoss))
        avgProfitDay.value = profitDaysForAvg > 0 ? Math.round(totalProfitVal / profitDaysForAvg) : 0
        avgLossDay.value = lossDaysForAvg > 0 ? Math.round(totalLossVal / lossDaysForAvg) : 0
        totalProfit.value = Math.round(totalProfitVal)
        totalLoss.value = Math.round(totalLossVal)
        netPnL.value = Math.round(totalProfitVal - totalLossVal)
        avgDailyPnL.value = tradingDays.value > 0 ? Math.round((totalProfitVal - totalLossVal) / tradingDays.value) : 0

    } catch (error) {
        console.error('Error calculating trading stats:', error)
    } finally {
        isLoadingStats.value = false
    }
}

const calculateMonthlyBreakdown = async () => {
    isLoadingMonthly.value = true
    try {
        const trades = await tradeService.getAllTrades()
        
        // Get available years from trades
        const years = [...new Set(trades.map(trade => new Date(trade.entryDate).getFullYear()))]
        availableYears.value = years.sort((a, b) => b - a) // Sort descending
        
        // If selected year is not in available years, select the latest year
        if (availableYears.value.length > 0 && !availableYears.value.includes(selectedYear.value)) {
            selectedYear.value = availableYears.value[0]
        }
        
        // Group trades by month for selected year
        const yearTrades = trades.filter(trade => 
            new Date(trade.entryDate).getFullYear() === selectedYear.value
        )
        
        const monthlyStats = {}
        
        // Group trades by month (only create entries for months with data)
        yearTrades.forEach(trade => {
            const month = new Date(trade.entryDate).getMonth()
            
            if (!monthlyStats[month]) {
                monthlyStats[month] = {
                    month: monthNames[month],
                    monthNumber: month,
                    trades: [],
                    totalTrades: 0,
                    winningTrades: 0,
                    losingTrades: 0,
                    totalPnL: 0,
                    winRate: 0,
                    avgPnL: 0
                }
            }
            
            monthlyStats[month].trades.push(trade)
        })
        
        // Calculate monthly statistics for months with data
        Object.keys(monthlyStats).forEach(month => {
            const monthData = monthlyStats[month]
            const trades = monthData.trades
            
            monthData.totalTrades = trades.length
            monthData.totalPnL = trades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
            monthData.winningTrades = trades.filter(trade => (trade.pnlAmount || 0) > 0).length
            monthData.losingTrades = trades.filter(trade => (trade.pnlAmount || 0) < 0).length
            monthData.winRate = monthData.totalTrades > 0 ? Math.round((monthData.winningTrades / monthData.totalTrades) * 100) : 0
            monthData.avgPnL = Math.round(monthData.totalPnL / monthData.totalTrades)
        })
        
        // Sort months by month number and convert to array
        monthlyData.value = Object.values(monthlyStats).sort((a, b) => a.monthNumber - b.monthNumber)
        
    } catch (error) {
        console.error('Error calculating monthly breakdown:', error)
    } finally {
        isLoadingMonthly.value = false
    }
}

const calculateWeeklyBreakdown = async () => {
    isLoadingWeekly.value = true
    try {
        const trades = await tradeService.getAllTrades()
        
        // Filter trades by selected year
        const yearTrades = trades.filter(trade => 
            new Date(trade.entryDate).getFullYear() === selectedYear.value
        )
        
        // Get available months (months that have trading data)
        const monthsWithData = [...new Set(yearTrades.map(trade => 
            new Date(trade.entryDate).getMonth()
        ))].sort((a, b) => a - b)
        
        availableMonths.value = monthsWithData
        
        // If current selected month is not available and we have data, fallback to first available month
        if (monthsWithData.length > 0 && !monthsWithData.includes(selectedMonth.value)) {
            selectedMonth.value = monthsWithData[0]
        }
        
        // If no months have data, clear weekly data and return early
        if (monthsWithData.length === 0) {
            weeklyData.value = []
            return
        }
        
        // Filter trades by selected month
        const filteredTrades = yearTrades.filter(trade => 
            new Date(trade.entryDate).getMonth() === selectedMonth.value
        )
        
        const weeklyStats = {}
        
        // Helper function to get week start date (Monday)
        const getWeekStart = (date) => {
            const d = new Date(date)
            const day = d.getDay()
            const diff = d.getDate() - day + (day === 0 ? -6 : 1) // Adjust when day is Sunday
            const weekStart = new Date(d.setDate(diff))
            weekStart.setHours(0, 0, 0, 0)
            return weekStart
        }
        
        // Helper function to format week range
        const formatWeekRange = (weekStart) => {
            const weekEnd = new Date(weekStart)
            weekEnd.setDate(weekEnd.getDate() + 6)
            
            const startStr = weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            const endStr = weekEnd.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
            
            return `${startStr} - ${endStr}`
        }
        
        // Group trades by week (only create entries for weeks with data)
        filteredTrades.forEach(trade => {
            const tradeDate = new Date(trade.entryDate)
            const weekStart = getWeekStart(tradeDate)
            const weekKey = weekStart.getTime()
            
            if (!weeklyStats[weekKey]) {
                weeklyStats[weekKey] = {
                    weekStart: weekStart,
                    weekRange: formatWeekRange(weekStart),
                    trades: [],
                    totalTrades: 0,
                    winningTrades: 0,
                    losingTrades: 0,
                    totalPnL: 0,
                    winRate: 0,
                    avgPnL: 0
                }
            }
            
            weeklyStats[weekKey].trades.push(trade)
        })
        
        // Calculate weekly statistics for weeks with data
        Object.keys(weeklyStats).forEach(weekKey => {
            const weekData = weeklyStats[weekKey]
            const trades = weekData.trades
            
            weekData.totalTrades = trades.length
            weekData.totalPnL = trades.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
            weekData.winningTrades = trades.filter(trade => (trade.pnlAmount || 0) > 0).length
            weekData.losingTrades = trades.filter(trade => (trade.pnlAmount || 0) < 0).length
            weekData.winRate = weekData.totalTrades > 0 ? Math.round((weekData.winningTrades / weekData.totalTrades) * 100) : 0
            weekData.avgPnL = Math.round(weekData.totalPnL / weekData.totalTrades)
        })
        
        // Sort weeks by date and convert to array (most recent first)
        weeklyData.value = Object.values(weeklyStats).sort((a, b) => b.weekStart - a.weekStart)
        
    } catch (error) {
        console.error('Error calculating weekly breakdown:', error)
    } finally {
        isLoadingWeekly.value = false
    }
}

onMounted(() => {
    calculateStats()
    calculateMonthlyBreakdown()
    calculateWeeklyBreakdown()
})

// Recalculate stats when localStorage changes
window.addEventListener('storage', (e) => {
    if (e.key === 'trades') {
        calculateStats()
        calculateMonthlyBreakdown()
        calculateWeeklyBreakdown()
    }
})

// Watch for year changes
// Global year change handler - updates all sections
const onGlobalYearChange = () => {
    selectedMonth.value = new Date().getMonth() // Reset to current month when year changes
    calculateStats()
    calculateMonthlyBreakdown()
    calculateWeeklyBreakdown()
}

// Watch for month changes
const onMonthChange = () => {
    calculateWeeklyBreakdown()
}

// Cleanup event listener
onUnmounted(() => {
    window.removeEventListener('storage', calculateStats)
})
</script>

<style scoped>
.dashboard-stats {
    padding: 1rem;
}

@media (min-width: 768px) {
    .dashboard-stats {
        padding: 2rem;
    }
}

.dashboard-header {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1rem;
    margin-bottom: 1rem;
}

@media (min-width: 768px) {
    .dashboard-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }
}

.dashboard-header h2 {
    font-size: 1.5rem;
    margin: 0;
}

@media (min-width: 768px) {
    .dashboard-header h2 {
        font-size: 2rem;
    }
}

.global-year-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.global-year-selector label {
    font-weight: 500;
    color: var(--text-muted);
    font-size: 0.9rem;
}

.global-year-selector select {
    padding: 0.4rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background: white;
    color: var(--text-color);
    font-size: 0.9rem;
    cursor: pointer;
}

.global-year-selector select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.stats-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-top: 16px;
    max-width: 1400px;
    margin-left: auto;
    margin-right: auto;
    padding: 0 1rem;
}

@media (min-width: 480px) {
    .stats-grid {
        grid-template-columns: repeat(2, 1fr);
        gap: 14px;
    }
}

@media (min-width: 768px) {
    .stats-grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 16px;
        margin-top: 20px;
        padding: 0;
    }
}

@media (min-width: 1024px) {
    .stats-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

.stat-card {
    background-color: #ffffff;
    border: 1px solid var(--border-color);
    border-radius: 8px;
    padding: 16px;
    text-align: center;
    box-shadow: var(--shadow);
    transition: transform 0.2s;
    min-height: 80px;
    display: flex;
    flex-direction: column;
    justify-content: center;
}

@media (min-width: 768px) {
    .stat-card {
        padding: 20px;
        min-height: 100px;
    }
}

.stat-card:hover {
    transform: translateY(-2px);
}

.stat-title {
    color: var(--text-muted);
    font-size: 0.8em;
    margin-bottom: 6px;
    line-height: 1.2;
}

@media (min-width: 768px) {
    .stat-title {
        font-size: 0.9em;
        margin-bottom: 8px;
    }
}

.stat-value {
    font-size: 1.4em;
    font-weight: 600;
    color: var(--text-color);
    line-height: 1.1;
}

@media (min-width: 768px) {
    .stat-value {
        font-size: 1.8em;
    }
}

.stat-card.profit {
    border-left: 4px solid var(--primary-color);
}

.stat-card.loss {
    border-left: 4px solid var(--danger-color);
}

.stat-card.streak-win {
    border-left: 4px solid #4CAF50;
}

.stat-card.streak-loss {
    border-left: 4px solid #FF9800;
}

.stat-card.win-rate {
    border-left: 4px solid #2196F3;
}

.stat-card.max-profit {
    border-left: 4px solid #00C853;
}

.stat-card.max-loss {
    border-left: 4px solid #D32F2F;
}

.stat-card.avg-profit {
    border-left: 4px solid #4CAF50;
}

.stat-card.avg-loss {
    border-left: 4px solid #F44336;
}

.stat-card.total-profit {
    border-left: 4px solid #00C853;
}

.stat-card.total-loss {
    border-left: 4px solid #D50000;
}

.stat-card.net-pnl {
    border-left: 4px solid #1976D2;
}

.stat-card.avg-daily-pnl {
    border-left: 4px solid #0D47A1;
}

.stat-value.positive {
    color: #00C853;
}

.stat-value.negative {
    color: #D50000;
}

/* Weekly Breakdown Styles */
.weekly-breakdown {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #e2e8f0;
}

.weekly-breakdown .section-header .filters-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
}

@media (min-width: 768px) {
    .weekly-breakdown .section-header .filters-container {
        flex-direction: row;
        align-items: center;
        gap: 1.5rem;
    }
}

.weekly-breakdown .month-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.weekly-breakdown .month-selector label {
    font-weight: 500;
    color: var(--text-muted);
    font-size: 0.9rem;
}

.weekly-breakdown .month-selector select {
    padding: 0.4rem 0.75rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background: white;
    color: var(--text-color);
    font-size: 0.9rem;
    cursor: pointer;
}

.weekly-breakdown .month-selector select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.weekly-breakdown .month-selector select:disabled {
    background: #f8fafc;
    color: var(--text-muted);
    cursor: not-allowed;
    opacity: 0.6;
}

.weekly-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 1rem;
    margin-top: 1rem;
}

@media (min-width: 768px) {
    .weekly-grid {
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
    }
}

.weekly-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.2s ease;
    min-height: 140px;
    border-left: 4px solid #64748b;
}

.weekly-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.weekly-card.profitable {
    border-left: 4px solid #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.02) 0%, rgba(255, 255, 255, 1) 100%);
}

.weekly-card.loss {
    border-left: 4px solid #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.02) 0%, rgba(255, 255, 255, 1) 100%);
}

.weekly-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.weekly-header h4 {
    margin: 0;
    font-size: 1rem;
    color: var(--text-color);
    font-weight: 600;
}

.weekly-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 0.75rem;
}

.weekly-stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.weekly-stat .stat-label {
    font-size: 0.75rem;
    color: var(--text-muted);
    font-weight: 500;
}

.weekly-stat .stat-value {
    font-size: 0.9rem;
    font-weight: 600;
    color: var(--text-color);
}

/* Monthly Breakdown Styles */
.monthly-breakdown {
    margin-top: 2rem;
    padding-top: 2rem;
    border-top: 2px solid #e2e8f0;
}

.section-header {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
    align-items: flex-start;
}

@media (min-width: 768px) {
    .section-header {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 0;
    }
}

.section-header h3 {
    margin: 0;
    color: var(--text-color);
    font-size: 1.5rem;
}

.monthly-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
}

@media (min-width: 480px) {
    .monthly-grid {
        grid-template-columns: repeat(2, 1fr);
    }
}

@media (min-width: 768px) {
    .monthly-grid {
        grid-template-columns: repeat(3, 1fr);
    }
}

@media (min-width: 1024px) {
    .monthly-grid {
        grid-template-columns: repeat(4, 1fr);
    }
}

.monthly-card {
    background-color: #ffffff;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    transition: all 0.2s ease;
    min-height: 140px;
}

.monthly-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.monthly-card.profitable {
    border-left: 4px solid #00C853;
    background: linear-gradient(135deg, rgba(0, 200, 83, 0.02) 0%, rgba(255, 255, 255, 1) 100%);
}

.monthly-card.loss {
    border-left: 4px solid #D50000;
    background: linear-gradient(135deg, rgba(213, 0, 0, 0.02) 0%, rgba(255, 255, 255, 1) 100%);
}

.monthly-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;
}

.monthly-header h4 {
    margin: 0;
    font-size: 1.1rem;
    color: var(--text-color);
}

.trade-count {
    font-size: 0.85rem;
    color: var(--text-muted);
    background: #f1f5f9;
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
}

.monthly-stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
}

.monthly-stat {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.stat-label {
    font-size: 0.85rem;
    color: var(--text-muted);
}

.monthly-stat .stat-value {
    font-size: 0.9rem;
    font-weight: 600;
}

.monthly-stat .stat-value.positive {
    color: #00C853;
}

.monthly-stat .stat-value.negative {
    color: #D50000;
}

.win-loss-breakdown {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
    justify-content: center;
}

.wins, .losses {
    padding: 0.25rem 0.5rem;
    border-radius: 12px;
    font-size: 0.8rem;
    font-weight: 500;
}

.wins {
    background: rgba(0, 200, 83, 0.1);
    color: #00C853;
}

.losses {
    background: rgba(213, 0, 0, 0.1);
    color: #D50000;
}

/* Loader Styles */
.loader-container {
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 2rem;
    background: rgba(255, 255, 255, 0.9);
    border-radius: 8px;
    position: relative;
}

.loader-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.9);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 8px;
    z-index: 10;
}

.spinner {
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.spinner-small {
    width: 20px;
    height: 20px;
    border-width: 2px;
}
</style>
