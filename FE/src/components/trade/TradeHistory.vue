# Implementing trade history component with filtering and sorting capabilities
<template>
    <div class="trade-history">
        <h2>Trade History</h2>

        <!-- Filters -->
        <div class="filters">
            <div class="filter-group">
                <label for="dateRange">Date Range</label>
                <select v-model="filters.dateRange" id="dateRange">
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="all">All time</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="symbol">Symbol</label>
                <select v-model="filters.symbol" id="symbol">
                    <option value="all">All Symbols</option>
                    <option v-for="symbol in uniqueSymbols" :key="symbol" :value="symbol">
                        {{ symbol }}
                    </option>
                </select>
            </div>
            <div class="filter-group">
                <label for="type">Type</label>
                <select v-model="filters.type" id="type">
                    <option value="all">All Types</option>
                    <option value="BUY">Buy</option>
                    <option value="SELL">Sell</option>
                </select>
            </div>
            <div class="filter-group">
                <label for="profitability">Profitability</label>
                <select v-model="filters.profitability" id="profitability">
                    <option value="all">All Trades</option>
                    <option value="profit">Profitable</option>
                    <option value="loss">Loss Making</option>
                </select>
            </div>
        </div>

        <!-- Trade Table -->
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th @click="sortBy('entryDate')" :class="{ active: sortKey === 'entryDate' }">
                            Date
                            <span class="sort-arrow">{{ getSortArrow('entryDate') }}</span>
                        </th>
                        <th @click="sortBy('symbol')" :class="{ active: sortKey === 'symbol' }">
                            Symbol
                            <span class="sort-arrow">{{ getSortArrow('symbol') }}</span>
                        </th>
                        <th @click="sortBy('type')" :class="{ active: sortKey === 'type' }">
                            Type
                            <span class="sort-arrow">{{ getSortArrow('type') }}</span>
                        </th>
                        <th @click="sortBy('entryPrice')" :class="{ active: sortKey === 'entryPrice' }">
                            Entry Price
                            <span class="sort-arrow">{{ getSortArrow('entryPrice') }}</span>
                        </th>
                        <th @click="sortBy('exitPrice')" :class="{ active: sortKey === 'exitPrice' }">
                            Exit Price
                            <span class="sort-arrow">{{ getSortArrow('exitPrice') }}</span>
                        </th>
                        <th @click="sortBy('pnlAmount')" :class="{ active: sortKey === 'pnlAmount' }">
                            P&L
                            <span class="sort-arrow">{{ getSortArrow('pnlAmount') }}</span>
                        </th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="trade in sortedAndFilteredTrades" :key="trade.id"
                        :class="{ 'profit': trade.pnlAmount > 0, 'loss': trade.pnlAmount < 0 }">
                        <td>{{ formatDate(trade.entryDate) }}</td>
                        <td>{{ trade.symbol }}</td>
                        <td :class="{ 'type-buy': trade.type === 'BUY', 'type-sell': trade.type === 'SELL' }">
                            {{ trade.type }}
                        </td>
                        <td>{{ formatCurrency(trade.entryPrice) }}</td>
                        <td>{{ formatCurrency(trade.exitPrice) }}</td>
                        <td :class="{ 'profit': trade.pnlAmount > 0, 'loss': trade.pnlAmount < 0 }">
                            {{ formatCurrency(trade.pnlAmount) }}
                        </td>
                        <td>
                            <button class="action-btn view-btn" @click="viewTradeDetails(trade)">
                                View
                            </button>
                            <button class="action-btn delete-btn" @click="deleteTrade(trade)">
                                Delete
                            </button>
                        </td>
                    </tr>
                    <tr v-if="sortedAndFilteredTrades.length === 0">
                        <td colspan="7" class="no-data">No trades found matching your filters</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Trade Details Modal -->
        <div v-if="selectedTrade" class="modal">
            <div class="modal-content">
                <h3>Trade Details</h3>
                <div class="trade-details">
                    <div class="detail-row">
                        <span class="label">Symbol:</span>
                        <span class="value">{{ selectedTrade.symbol }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Contract:</span>
                        <span class="value">{{ selectedTrade.contract }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Type:</span>
                        <span class="value"
                            :class="{ 'type-buy': selectedTrade.type === 'BUY', 'type-sell': selectedTrade.type === 'SELL' }">
                            {{ selectedTrade.type }}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Entry Date:</span>
                        <span class="value">{{ formatDate(selectedTrade.entryDate) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Exit Date:</span>
                        <span class="value">{{ formatDate(selectedTrade.exitDate) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Entry Price:</span>
                        <span class="value">{{ formatCurrency(selectedTrade.entryPrice) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Exit Price:</span>
                        <span class="value">{{ formatCurrency(selectedTrade.exitPrice) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Lots:</span>
                        <span class="value">{{ selectedTrade.lots }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Capital Used:</span>
                        <span class="value">{{ formatCurrency(selectedTrade.capitalUsed) }}</span>
                    </div>
                    <div class="detail-row">
                        <span class="label">P&L:</span>
                        <span class="value"
                            :class="{ 'profit': selectedTrade.pnlAmount > 0, 'loss': selectedTrade.pnlAmount < 0 }">
                            {{ formatCurrency(selectedTrade.pnlAmount) }}
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Return %:</span>
                        <span class="value"
                            :class="{ 'profit': selectedTrade.pnlPercentage > 0, 'loss': selectedTrade.pnlPercentage < 0 }">
                            {{ selectedTrade.pnlPercentage.toFixed(2) }}%
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Days Held:</span>
                        <span class="value">{{ selectedTrade.daysHeld }}</span>
                    </div>
                    <div class="detail-notes" v-if="selectedTrade.notes">
                        <span class="label">Notes:</span>
                        <p class="value">{{ selectedTrade.notes }}</p>
                    </div>
                </div>
                <button class="close-btn" @click="selectedTrade = null">Close</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const trades = ref([])
const selectedTrade = ref(null)
const sortKey = ref('entryDate')
const sortDir = ref('desc')

const filters = ref({
    dateRange: 'all',
    symbol: 'all',
    type: 'all',
    profitability: 'all'
})

// Load trades from localStorage
const loadTrades = () => {
    try {
        trades.value = JSON.parse(localStorage.getItem('trades') || '[]')
    } catch (error) {
        console.error('Error loading trades:', error)
        trades.value = []
    }
}

// Computed property for unique symbols
const uniqueSymbols = computed(() => {
    return [...new Set(trades.value.map(trade => trade.symbol))]
})

// Format date
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    })
}

// Format currency
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return ''
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount)
}

// Sorting functions
const sortBy = (key) => {
    if (sortKey.value === key) {
        sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
    } else {
        sortKey.value = key
        sortDir.value = 'asc'
    }
}

const getSortArrow = (key) => {
    if (sortKey.value !== key) return ''
    return sortDir.value === 'asc' ? '↑' : '↓'
}

// Filter and sort trades
const sortedAndFilteredTrades = computed(() => {
    let filtered = [...trades.value]

    // Apply date filter
    if (filters.value.dateRange !== 'all') {
        const cutoffDate = new Date()
        cutoffDate.setDate(cutoffDate.getDate() - parseInt(filters.value.dateRange))
        filtered = filtered.filter(trade => new Date(trade.entryDate) >= cutoffDate)
    }

    // Apply symbol filter
    if (filters.value.symbol !== 'all') {
        filtered = filtered.filter(trade => trade.symbol === filters.value.symbol)
    }

    // Apply type filter
    if (filters.value.type !== 'all') {
        filtered = filtered.filter(trade => trade.type === filters.value.type)
    }

    // Apply profitability filter
    if (filters.value.profitability !== 'all') {
        filtered = filtered.filter(trade => {
            if (filters.value.profitability === 'profit') {
                return trade.pnlAmount > 0
            } else {
                return trade.pnlAmount < 0
            }
        })
    }

    // Sort trades
    filtered.sort((a, b) => {
        let aVal = a[sortKey.value]
        let bVal = b[sortKey.value]

        // Handle date comparison
        if (sortKey.value.includes('Date')) {
            aVal = new Date(aVal)
            bVal = new Date(bVal)
        }

        // Handle numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
            return sortDir.value === 'asc' ? aVal - bVal : bVal - aVal
        }

        // Handle string comparison
        if (sortDir.value === 'asc') {
            return aVal > bVal ? 1 : -1
        } else {
            return aVal < bVal ? 1 : -1
        }
    })

    return filtered
})

// View trade details
const viewTradeDetails = (trade) => {
    selectedTrade.value = trade
}

// Delete trade
const deleteTrade = async (trade) => {
    if (confirm('Are you sure you want to delete this trade?')) {
        const updatedTrades = trades.value.filter(t => t.id !== trade.id)
        try {
            localStorage.setItem('trades', JSON.stringify(updatedTrades))
            trades.value = updatedTrades
        } catch (error) {
            console.error('Error deleting trade:', error)
        }
    }
}

// Load trades when component mounts
loadTrades()
</script>

<style scoped>
.trade-history {
    padding: 20px;
}

.filters {
    display: flex;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;
}

.filter-group {
    flex: 1;
    min-width: 200px;
}

.filter-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.filter-group select {
    width: 100%;
    padding: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background-color: white;
}

.table-container {
    overflow-x: auto;
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 20px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
}

th {
    background-color: #f8fafc;
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
}

th.active {
    background-color: #e2e8f0;
}

td {
    padding: 12px;
    border-top: 1px solid #e2e8f0;
}

tr:hover {
    background-color: #f1f5f9;
}

.sort-arrow {
    margin-left: 5px;
}

.type-buy {
    color: #42b883;
}

.type-sell {
    color: #ef4444;
}

tr.profit {
    background-color: rgba(66, 184, 131, 0.05);
}

tr.loss {
    background-color: rgba(239, 68, 68, 0.05);
}

td.profit {
    color: #42b883;
    font-weight: 600;
}

td.loss {
    color: #ef4444;
    font-weight: 600;
}

.action-btn {
    padding: 4px 8px;
    margin: 0 4px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
}

.view-btn {
    background-color: #3b82f6;
    color: white;
    border: none;
}

.view-btn:hover {
    background-color: #2563eb;
}

.delete-btn {
    background-color: #ef4444;
    color: white;
    border: none;
}

.delete-btn:hover {
    background-color: #dc2626;
}

.no-data {
    text-align: center;
    color: #64748b;
    padding: 40px;
}

/* Modal styles */
.modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background: white;
    padding: 30px;
    border-radius: 8px;
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
}

.trade-details {
    margin-top: 20px;
}

.detail-row {
    display: flex;
    justify-content: space-between;
    padding: 10px 0;
    border-bottom: 1px solid #e2e8f0;
}

.detail-row:last-child {
    border-bottom: none;
}

.label {
    color: #64748b;
    font-weight: 500;
}

.value {
    font-weight: 600;
}

.detail-notes {
    margin-top: 20px;
}

.detail-notes .label {
    display: block;
    margin-bottom: 10px;
}

.detail-notes .value {
    white-space: pre-wrap;
    background: #f8fafc;
    padding: 15px;
    border-radius: 4px;
    font-weight: normal;
}

.close-btn {
    margin-top: 20px;
    width: 100%;
    padding: 10px;
    background-color: #e2e8f0;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.close-btn:hover {
    background-color: #cbd5e1;
}
</style>
