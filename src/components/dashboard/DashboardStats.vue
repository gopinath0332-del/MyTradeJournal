<!-- DashboardStats.vue -->
<template>
    <div class="dashboard-stats">
        <div class="dashboard-header">
            <h2>Trading Statistics</h2>
        </div>
        <div class="stats-grid">
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

        <!-- Monthly Breakdown Section -->
        <div class="monthly-breakdown" v-if="availableYears.length > 0">
            <div class="section-header">
                <h3>Monthly Breakdown</h3>
                <div class="year-selector">
                    <label for="yearSelect">Year:</label>
                    <select id="yearSelect" v-model="selectedYear" @change="onYearChange">
                        <option v-for="year in availableYears" :key="year" :value="year">
                            {{ year }}
                        </option>
                    </select>
                </div>
            </div>
            
            <div class="monthly-grid" v-if="monthlyData.length > 0">
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

// Monthly breakdown data
const selectedYear = ref(new Date().getFullYear())
const availableYears = ref([])
const monthlyData = ref([])

const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
]

const calculateStats = async () => {
    try {
        const trades = await tradeService.getAllTrades()        // Group trades by date
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
    }
}

const calculateMonthlyBreakdown = async () => {
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
    }
}

onMounted(() => {
    calculateStats()
    calculateMonthlyBreakdown()
})

// Recalculate stats when localStorage changes
window.addEventListener('storage', (e) => {
    if (e.key === 'trades') {
        calculateStats()
        calculateMonthlyBreakdown()
    }
})

// Watch for year changes
const onYearChange = () => {
    calculateMonthlyBreakdown()
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
    text-align: center;
    margin-bottom: 1rem;
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

.year-selector {
    display: flex;
    align-items: center;
    gap: 0.5rem;
}

.year-selector label {
    font-weight: 500;
    color: var(--text-muted);
}

.year-selector select {
    padding: 0.5rem;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background-color: white;
    font-size: 1rem;
    min-width: 80px;
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
</style>
