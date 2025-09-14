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

onMounted(calculateStats)

// Recalculate stats when localStorage changes
window.addEventListener('storage', (e) => {
    if (e.key === 'trades') {
        calculateStats()
    }
})

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
</style>
