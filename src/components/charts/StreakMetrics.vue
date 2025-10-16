<template>
    <div class="streak-metrics">
        <!-- Global Streak Overview -->
        <div class="streak-overview">
            <div class="metric-card current-streak" :class="streakClass">
                <div class="metric-icon">{{ streakIcon }}</div>
                <div class="metric-content">
                    <div class="metric-label">Current Streak</div>
                    <div class="metric-value">
                        {{ globalMetrics.currentStreak }}
                        <span class="streak-type">{{ streakTypeLabel }}</span>
                    </div>
                    <div class="streak-sparkline">
                        <div v-for="(period, index) in recentStreakHistory" :key="index" class="sparkline-bar"
                            :class="period.type" :style="{ height: getSparklineHeight(period.length) }"
                            :title="`${period.type} streak: ${period.length} trades`" />
                    </div>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon">🏆</div>
                <div class="metric-content">
                    <div class="metric-label">Longest Win Streak</div>
                    <div class="metric-value positive">{{ globalMetrics.longestWinStreak }}</div>
                    <div class="metric-sublabel">trades</div>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon">📉</div>
                <div class="metric-content">
                    <div class="metric-label">Longest Lose Streak</div>
                    <div class="metric-value negative">{{ globalMetrics.longestLoseStreak }}</div>
                    <div class="metric-sublabel">trades</div>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon">📊</div>
                <div class="metric-content">
                    <div class="metric-label">Avg Win Streak</div>
                    <div class="metric-value">{{ formatNumber(globalMetrics.averageWinStreak, 1) }}</div>
                    <div class="metric-sublabel">trades</div>
                </div>
            </div>

            <div class="metric-card">
                <div class="metric-icon">📉</div>
                <div class="metric-content">
                    <div class="metric-label">Avg Lose Streak</div>
                    <div class="metric-value">{{ formatNumber(globalMetrics.averageLoseStreak, 1) }}</div>
                    <div class="metric-sublabel">trades</div>
                </div>
            </div>
        </div>

        <!-- Symbol Streaks -->
        <div v-if="symbolMetrics.length > 0" class="streak-section">
            <h4>Symbol Streaks</h4>
            <div class="streak-table-container">
                <table class="streak-table">
                    <thead>
                        <tr>
                            <th>Symbol</th>
                            <th>Current Streak</th>
                            <th>Longest Win</th>
                            <th>Longest Loss</th>
                            <th>Total Trades</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="symbol in topSymbolStreaks" :key="symbol.symbol">
                            <td class="symbol-name">{{ symbol.symbol }}</td>
                            <td>
                                <span class="streak-badge" :class="symbol.currentStreakType">
                                    {{ symbol.currentStreak }} {{ symbol.currentStreakType === 'winning' ? '🔥' : '❄️'
                                    }}
                                </span>
                            </td>
                            <td class="positive">{{ symbol.longestWinStreak }}</td>
                            <td class="negative">{{ symbol.longestLoseStreak }}</td>
                            <td>{{ symbol.trades }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Strategy Streaks -->
        <div v-if="strategyMetrics.length > 0" class="streak-section">
            <h4>Strategy Streaks</h4>
            <div class="streak-table-container">
                <table class="streak-table">
                    <thead>
                        <tr>
                            <th>Strategy</th>
                            <th>Current Streak</th>
                            <th>Longest Win</th>
                            <th>Longest Loss</th>
                            <th>Total Trades</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="strategy in topStrategyStreaks" :key="strategy.strategy">
                            <td class="strategy-name">{{ strategy.strategy }}</td>
                            <td>
                                <span class="streak-badge" :class="strategy.currentStreakType">
                                    {{ strategy.currentStreak }} {{ strategy.currentStreakType === 'winning' ? '🔥' :
                                    '❄️' }}
                                </span>
                            </td>
                            <td class="positive">{{ strategy.longestWinStreak }}</td>
                            <td class="negative">{{ strategy.longestLoseStreak }}</td>
                            <td>{{ strategy.trades }}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- Mobile Cards View -->
        <div class="mobile-only">
            <!-- Symbol Streak Cards -->
            <div v-if="symbolMetrics.length > 0" class="streak-section-mobile">
                <h4>Symbol Streaks</h4>
                <div class="streak-cards">
                    <div v-for="symbol in topSymbolStreaks" :key="symbol.symbol" class="streak-card">
                        <div class="card-header">
                            <span class="card-title">{{ symbol.symbol }}</span>
                            <span class="streak-badge" :class="symbol.currentStreakType">
                                {{ symbol.currentStreak }} {{ symbol.currentStreakType === 'winning' ? '🔥' : '❄️' }}
                            </span>
                        </div>
                        <div class="card-stats">
                            <div class="stat-item">
                                <span class="stat-label">Longest Win</span>
                                <span class="stat-value positive">{{ symbol.longestWinStreak }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Longest Loss</span>
                                <span class="stat-value negative">{{ symbol.longestLoseStreak }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Total Trades</span>
                                <span class="stat-value">{{ symbol.trades }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Strategy Streak Cards -->
            <div v-if="strategyMetrics.length > 0" class="streak-section-mobile">
                <h4>Strategy Streaks</h4>
                <div class="streak-cards">
                    <div v-for="strategy in topStrategyStreaks" :key="strategy.strategy" class="streak-card">
                        <div class="card-header">
                            <span class="card-title">{{ strategy.strategy }}</span>
                            <span class="streak-badge" :class="strategy.currentStreakType">
                                {{ strategy.currentStreak }} {{ strategy.currentStreakType === 'winning' ? '🔥' : '❄️'
                                }}
                            </span>
                        </div>
                        <div class="card-stats">
                            <div class="stat-item">
                                <span class="stat-label">Longest Win</span>
                                <span class="stat-value positive">{{ strategy.longestWinStreak }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Longest Loss</span>
                                <span class="stat-value negative">{{ strategy.longestLoseStreak }}</span>
                            </div>
                            <div class="stat-item">
                                <span class="stat-label">Total Trades</span>
                                <span class="stat-value">{{ strategy.trades }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
    globalMetrics: {
        type: Object,
        required: true
    },
    symbolMetrics: {
        type: Array,
        default: () => []
    },
    strategyMetrics: {
        type: Array,
        default: () => []
    }
})

const formatNumber = (num, decimals = 0) => {
    return Number(num).toFixed(decimals)
}

const streakClass = computed(() => {
    if (props.globalMetrics.currentStreakType === 'winning') return 'winning-streak'
    if (props.globalMetrics.currentStreakType === 'losing') return 'losing-streak'
    return ''
})

const streakIcon = computed(() => {
    if (props.globalMetrics.currentStreakType === 'winning') return '🔥'
    if (props.globalMetrics.currentStreakType === 'losing') return '❄️'
    return '➖'
})

const streakTypeLabel = computed(() => {
    if (props.globalMetrics.currentStreakType === 'winning') return 'wins'
    if (props.globalMetrics.currentStreakType === 'losing') return 'losses'
    return ''
})

const recentStreakHistory = computed(() => {
    return props.globalMetrics.streakHistory.slice(-20)
})

const getSparklineHeight = (length) => {
    const maxLength = Math.max(
        ...props.globalMetrics.streakHistory.map(s => s.length),
        1
    )
    return `${(length / maxLength) * 100}%`
}

const topSymbolStreaks = computed(() => {
    return props.symbolMetrics.slice(0, 10)
})

const topStrategyStreaks = computed(() => {
    return props.strategyMetrics.slice(0, 10)
})
</script>

<style scoped>
.streak-metrics {
    display: flex;
    flex-direction: column;
    gap: 2rem;
}

/* Streak Overview Grid */
.streak-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

@media (max-width: 768px) {
    .streak-overview {
        grid-template-columns: 1fr;
        gap: 0.75rem;
    }
}

.metric-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1.25rem;
    display: flex;
    gap: 1rem;
    align-items: flex-start;
    transition: all 0.2s ease;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.metric-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    transform: translateY(-2px);
}

.metric-card.current-streak {
    grid-column: 1 / -1;
    background: linear-gradient(135deg, #f8fafc 0%, #e5e7eb 100%);
}

.metric-card.winning-streak {
    background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
    border-color: #86efac;
}

.metric-card.losing-streak {
    background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
    border-color: #fca5a5;
}

.metric-icon {
    font-size: 2rem;
    line-height: 1;
}

.metric-content {
    flex: 1;
}

.metric-label {
    font-size: 0.875rem;
    color: #6b7280;
    font-weight: 500;
    margin-bottom: 0.5rem;
}

.metric-value {
    font-size: 2rem;
    font-weight: 700;
    color: #1f2937;
    line-height: 1;
    display: flex;
    align-items: baseline;
    gap: 0.5rem;
}

.streak-type {
    font-size: 1rem;
    color: #6b7280;
    font-weight: 500;
}

.metric-sublabel {
    font-size: 0.75rem;
    color: #9ca3af;
    margin-top: 0.25rem;
}

/* Sparkline */
.streak-sparkline {
    display: flex;
    align-items: flex-end;
    gap: 2px;
    height: 40px;
    margin-top: 0.75rem;
}

.sparkline-bar {
    flex: 1;
    min-width: 3px;
    background: #d1d5db;
    border-radius: 2px;
    transition: all 0.2s ease;
    cursor: pointer;
}

.sparkline-bar.winning {
    background: #22c55e;
}

.sparkline-bar.losing {
    background: #ef4444;
}

.sparkline-bar:hover {
    opacity: 0.8;
    transform: scaleY(1.1);
}

/* Streak Sections */
.streak-section {
    background: white;
    border-radius: 12px;
    padding: 1.5rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.streak-section h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
}

.streak-table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
}

.streak-table {
    width: 100%;
    border-collapse: collapse;
}

.streak-table th,
.streak-table td {
    padding: 0.75rem;
    text-align: left;
    border-bottom: 1px solid #f3f4f6;
}

.streak-table th {
    background: #f9fafb;
    font-weight: 600;
    color: #374151;
    font-size: 0.875rem;
    position: sticky;
    top: 0;
    z-index: 10;
}

.streak-table tbody tr:hover {
    background: #f9fafb;
}

.symbol-name,
.strategy-name {
    font-weight: 600;
    color: #1f2937;
}

.streak-badge {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.375rem 0.75rem;
    border-radius: 9999px;
    font-size: 0.875rem;
    font-weight: 600;
}

.streak-badge.winning {
    background: #dcfce7;
    color: #166534;
}

.streak-badge.losing {
    background: #fee2e2;
    color: #991b1b;
}

.streak-badge.none {
    background: #f3f4f6;
    color: #6b7280;
}

.positive {
    color: #22c55e;
    font-weight: 600;
}

.negative {
    color: #ef4444;
    font-weight: 600;
}

/* Mobile Cards */
.mobile-only {
    display: none;
}

@media (max-width: 768px) {
    .mobile-only {
        display: block;
    }

    .streak-table-container {
        display: none;
    }
}

.streak-section-mobile {
    margin-bottom: 1.5rem;
}

.streak-section-mobile h4 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 1rem 0;
}

.streak-cards {
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
}

.streak-card {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 12px;
    padding: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0.75rem;
    padding-bottom: 0.75rem;
    border-bottom: 1px solid #f3f4f6;
}

.card-title {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
}

.card-stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.75rem;
}

.stat-item {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
}

.stat-label {
    font-size: 0.75rem;
    color: #6b7280;
}

.stat-value {
    font-size: 1rem;
    font-weight: 600;
    color: #1f2937;
}

/* Mobile Optimizations */
@media (max-width: 480px) {
    .metric-card {
        padding: 1rem;
    }

    .metric-icon {
        font-size: 1.5rem;
    }

    .metric-value {
        font-size: 1.5rem;
    }

    .streak-sparkline {
        height: 30px;
    }

    .card-stats {
        grid-template-columns: 1fr;
        gap: 0.5rem;
    }

    .stat-item {
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
    }

    .stat-label {
        font-size: 0.875rem;
    }

    .stat-value {
        font-size: 0.875rem;
    }
}
</style>
