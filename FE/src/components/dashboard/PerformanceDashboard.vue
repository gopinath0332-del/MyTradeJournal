<!-- PerformanceDashboard.vue -->
<template>
    <div class="dashboard">
        <div class="filters">
            <div class="filter-group">
                <label for="dateRange">Date Range</label>
                <select v-model="filters.dateRange">
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="365">Last year</option>
                    <option value="all">All time</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="strategy">Strategy</label>
                <select v-model="filters.strategy">
                    <option value="all">All Strategies</option>
                    <option value="Turtle">Turtle</option>
                    <option value="Donchian">Donchian</option>
                    <option value="SuperTrend">SuperTrend</option>
                </select>
            </div>

            <div class="filter-group">
                <label for="symbol">Symbol</label>
                <select v-model="filters.symbol">
                    <option value="all">All Symbols</option>
                    <option v-for="symbol in uniqueSymbols" :key="symbol" :value="symbol">
                        {{ symbol }}
                    </option>
                </select>
            </div>
        </div>

        <div class="metrics-grid">
            <div class="metric-card">
                <h3>Win Rate</h3>
                <div class="metric-value">{{ metrics.winRate }}%</div>
            </div>

            <div class="metric-card">
                <h3>Average R:R</h3>
                <div class="metric-value">{{ metrics.averageRR }}:1</div>
            </div>

            <div class="metric-card">
                <h3>Profit Factor</h3>
                <div class="metric-value">{{ metrics.profitFactor }}</div>
            </div>

            <div class="metric-card">
                <h3>Total Trades</h3>
                <div class="metric-value">{{ metrics.totalTrades }}</div>
            </div>
        </div>

        <div class="charts">
            <div class="chart-container">
                <EquityCurveChart :trades="filteredTrades" />
            </div>

            <div class="chart-container">
                <h3>Strategy Performance</h3>
                <!-- Placeholder for strategy performance chart -->
                <div class="chart-placeholder">
                    Strategy performance breakdown will be implemented with a charting library
                </div>
            </div>
        </div>

        <div class="tag-cloud">
            <h3>Strategy Tags</h3>
            <div class="tags">
                <span v-for="(count, strategy) in strategyStats" :key="strategy" class="tag"
                    :style="{ fontSize: getTagSize(count) + 'px' }">
                    {{ strategy }} ({{ count }})
                </span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import EquityCurveChart from './EquityCurveChart.vue'

const filters = ref({
    dateRange: '30',
    strategy: 'all',
    symbol: 'all'
})

const trades = ref([])

// Load trades from localStorage
const loadTrades = () => {
    try {
        trades.value = JSON.parse(localStorage.getItem('trades') || '[]')
    } catch (error) {
        console.error('Error loading trades:', error)
        trades.value = []
    }
}

// Compute filtered trades based on current filters
const filteredTrades = computed(() => {
    let filtered = [...trades.value]

    if (filters.value.dateRange !== 'all') {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(filters.value.dateRange))
        filtered = filtered.filter(trade => new Date(trade.entryDate) >= cutoffDate)
    }

    if (filters.value.strategy !== 'all') {
        filtered = filtered.filter(trade => trade.strategy === filters.value.strategy)
    }

    if (filters.value.symbol !== 'all') {
        filtered = filtered.filter(trade => trade.symbol === filters.value.symbol)
    }

    return filtered
})

// Compute metrics based on filtered trades
const metrics = computed(() => {
    const ft = filteredTrades.value
    const winningTrades = ft.filter(t => t.exitPrice > t.entryPrice)

    return {
        winRate: ft.length ? ((winningTrades.length / ft.length) * 100).toFixed(2) : 0,
        averageRR: ft.length ? (ft.reduce((acc, t) => acc + t.riskRewardRatio, 0) / ft.length).toFixed(2) : 0,
        profitFactor: calculateProfitFactor(ft),
        totalTrades: ft.length
    }
})

// Compute unique symbols for filter dropdown
const uniqueSymbols = computed(() => {
    return [...new Set(trades.value.map(t => t.symbol))]
})

// Compute strategy statistics for tag cloud
const strategyStats = computed(() => {
    return trades.value.reduce((acc, trade) => {
        acc[trade.strategy] = (acc[trade.strategy] || 0) + 1
        return acc
    }, {})
})

// Helper function to calculate profit factor
const calculateProfitFactor = (trades) => {
    const profits = trades.reduce((acc, t) => {
        const profit = t.exitPrice - t.entryPrice
        return profit > 0 ? acc + profit : acc
    }, 0)

    const losses = trades.reduce((acc, t) => {
        const loss = t.exitPrice - t.entryPrice
        return loss < 0 ? acc + Math.abs(loss) : acc
    }, 0)

    return losses === 0 ? profits : (profits / losses).toFixed(2)
}

// Helper function for tag cloud font sizing
const getTagSize = (count) => {
    const baseSize = 14
    const maxSize = 24
    const scale = count / Math.max(...Object.values(strategyStats.value))
    return baseSize + (maxSize - baseSize) * scale
}

// Load trades when component mounts
onMounted(() => {
    loadTrades()
})
</script>

<style scoped>
.dashboard {
    padding: 20px;
}

.filters {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
}

.filter-group {
    flex: 1;
}

.filter-group label {
    display: block;
    margin-bottom: 5px;
}

.filter-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
}

.metrics-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.metric-card {
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
    border: 1px solid #e2e8f0;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-value {
    font-size: 24px;
    font-weight: bold;
    color: #333;
}

.charts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin-bottom: 30px;
}

.chart-container {
    background: #fff;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.chart-placeholder {
    height: 300px;
    background: #f8fafc;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: #64748b;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
}

.tag-cloud {
    background: #fff;
    padding: 20px;
    border: 1px solid #ddd;
    border-radius: 8px;
}

.tags {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
}

.tag {
    background: #f0f0f0;
    padding: 5px 10px;
    border-radius: 15px;
    display: inline-block;
}
</style>
