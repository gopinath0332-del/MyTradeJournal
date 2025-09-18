# Implementing trade history component with filtering and sorting capabilities
<template>
    <div class="trade-history">
        <h2>Trade History</h2>

        <!-- Filters -->
        <div class="filters">
            <div class="filter-group date-filter">
                <label for="dateRange">Date Range</label>
                <select v-model="filters.dateRange" id="dateRange">
                    <option value="7">Last 7 days</option>
                    <option value="30">Last 30 days</option>
                    <option value="90">Last 90 days</option>
                    <option value="current-month">Current Month</option>
                    <option value="custom">Custom Range</option>
                    <option value="all">All time</option>
                </select>
                <div v-if="filters.dateRange === 'custom'" class="custom-date-range">
                    <div class="date-input">
                        <label for="startDate">Start Date</label>
                        <input type="date" id="startDate" v-model="filters.startDate"
                            :max="filters.endDate || new Date().toISOString().slice(0, 10)" />
                    </div>
                    <div class="date-input">
                        <label for="endDate">End Date</label>
                        <input type="date" id="endDate" v-model="filters.endDate" :min="filters.startDate"
                            :max="new Date().toISOString().slice(0, 10)" />
                    </div>
                </div>
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

        <!-- Results Summary -->
        <div class="results-summary">
            <div class="total-results">
                Showing {{ sortedTrades.length }} trade{{ sortedTrades.length !== 1 ? 's' : '' }}
            </div>
            <div class="trades-summary">
                <div class="trades-summary">
                    <div class="summary-stats">
                        <span class="profit-count">
                            Profitable: {{sortedTrades.filter(t => t.pnlAmount > 0).length}}
                        </span>
                        <span class="loss-count">
                            Loss: {{sortedTrades.filter(t => t.pnlAmount < 0).length}} </span>
                                <span class="breakeven-count">
                                    Breakeven: {{sortedTrades.filter(t => t.pnlAmount === 0).length}}
                                </span>
                    </div>
                    <div class="net-profit" :class="{
                        'profit': calculateNetProfit > 0,
                        'loss': calculateNetProfit < 0
                    }">
                        Net P&L: {{ formatCurrency(calculateNetProfit) }}
                    </div>
                </div>
            </div>
        </div>

        <!-- Trade Table -->
        <div class="table-container" style="position: relative;">
            <!-- Loading overlay for trades table -->
            <div v-if="isLoadingTrades" class="loader-overlay">
                <div class="spinner"></div>
            </div>
            
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
                    <tr v-for="trade in sortedTrades" :key="trade.id"
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
                        <td class="actions-cell">
                            <div class="actions-container">
                                <button class="action-btn view-btn" @click="viewTradeDetails(trade)">
                                    View
                                </button>
                                <button class="action-btn edit-btn" @click="handleEdit(trade)">
                                    Edit
                                </button>
                                <button class="action-btn delete-btn" @click="deleteTrade(trade)">
                                    Delete
                                </button>
                            </div>
                        </td>
                    </tr>
                    <tr v-if="sortedTrades.length === 0">
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
                            {{ (selectedTrade.pnlPercentage || 0).toFixed(2) }}%
                        </span>
                    </div>
                    <div class="detail-row">
                        <span class="label">Days Held:</span>
                        <span class="value">{{ selectedTrade.daysHeld }}</span>
                    </div>
                    <div class="detail-row" v-if="selectedTrade.remarks">
                        <span class="label">Remarks:</span>
                        <span class="value">{{ selectedTrade.remarks }}</span>
                    </div>
                    <div class="detail-notes" v-if="selectedTrade.notes">
                        <span class="label">Notes:</span>
                        <p class="value">{{ selectedTrade.notes }}</p>
                    </div>
                    <div class="detail-notes" v-if="selectedTrade.lessonsLearned">
                        <span class="label">Lessons Learned:</span>
                        <p class="value">{{ selectedTrade.lessonsLearned }}</p>
                    </div>
                </div>
                <button class="close-btn" @click="selectedTrade = null">Close</button>
            </div>
        </div>

        <!-- Edit Trade Modal -->
        <div v-if="showEditModal" class="modal">
            <div class="modal-content">
                <h3>Edit Trade</h3>
                <form @submit.prevent="handleEditSubmit">
                    <div class="form-row">
                        <div class="form-group">
                            <label for="editSymbol">Symbol</label>
                            <input type="text" id="editSymbol" v-model="editedTrade.symbol" required />
                        </div>
                        <div class="form-group">
                            <label for="editContract">Contract (Optional)</label>
                            <input type="text" id="editContract" v-model="editedTrade.contract" />
                        </div>
                        <div class="form-group">
                            <label for="editType">Type</label>
                            <select id="editType" v-model="editedTrade.type" required>
                                <option value="BUY">Buy</option>
                                <option value="SELL">Sell</option>
                            </select>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="editEntryDate">Entry Date</label>
                            <input type="date" id="editEntryDate" v-model="editedTrade.entryDate" required />
                        </div>
                        <div class="form-group">
                            <label for="editExitDate">Exit Date (Optional)</label>
                            <input type="date" id="editExitDate" v-model="editedTrade.exitDate" 
                                :max="new Date().toISOString().slice(0, 10)" />
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="editEntryPrice">Entry Price</label>
                            <div class="input-with-prefix">
                                <span class="currency-prefix">₹</span>
                                <input type="number" id="editEntryPrice" v-model="editedTrade.entryPrice" required
                                    step="0.01" />
                            </div>
                        </div>
                        <div class="form-group">
                            <label for="editExitPrice">Exit Price</label>
                            <div class="input-with-prefix">
                                <span class="currency-prefix">₹</span>
                                <input type="number" id="editExitPrice" v-model="editedTrade.exitPrice" step="0.01" />
                            </div>
                        </div>
                    </div>

                    <div class="form-row">
                        <div class="form-group">
                            <label for="editLots">Lots</label>
                            <input type="number" id="editLots" v-model="editedTrade.lots" required min="1" />
                        </div>
                        <div class="form-group">
                            <label for="editCapitalUsed">Capital Used</label>
                            <div class="input-with-prefix">
                                <span class="currency-prefix">₹</span>
                                <input type="number" id="editCapitalUsed" v-model="editedTrade.capitalUsed" required
                                    step="0.01" min="0" />
                            </div>
                        </div>
                    </div>

                    <div class="modal-actions">
                        <button type="button" class="cancel-btn" @click="closeEditModal">Cancel</button>
                        <button type="submit" class="save-btn">Save Changes</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted } from 'vue'
import { tradeService } from '../../firebase/tradeService'

// Loading states
const isLoadingTrades = ref(false)
const isDeletingTrade = ref(false)

// Get the shared functions from App.vue
const startEditingTrade = inject('startEditingTrade')
const showToast = inject('showToast')
const refreshDashboard = inject('refreshDashboard')

// Fallback if showToast is not provided
const displayToast = (type, title, message) => {
    if (showToast) {
        showToast(type, title, message)
    } else {
        console.log(`${type}: ${title} - ${message}`)
    }
}

const selectedTrade = ref(null)
const trades = ref([])
const uniqueSymbols = ref([])
const sortKey = ref('entryDate')
const sortDir = ref('desc')
const showEditModal = ref(false)
const editedTrade = ref({})

const filters = ref({
    dateRange: 'current-month',
    startDate: '',
    endDate: '',
    symbol: 'all',
    type: 'all',
    profitability: 'all'
})

// Load trades with current filters
const loadTrades = async () => {
    isLoadingTrades.value = true
    try {
        // Build filter object for API call
        const filterParams = {
            dateRange: filters.value.dateRange,
            startDate: filters.value.startDate,
            endDate: filters.value.endDate,
            symbol: filters.value.symbol,
            type: filters.value.type,
            profitability: filters.value.profitability
        }
        
        trades.value = await tradeService.getFilteredTrades(filterParams)
    } catch (error) {
        console.error('Error loading trades:', error)
        trades.value = []
        displayToast('error', 'Error', 'Failed to load trades. Please try again.')
    } finally {
        isLoadingTrades.value = false
    }
}

// Load unique symbols for filter dropdown
const loadUniqueSymbols = async () => {
    try {
        uniqueSymbols.value = await tradeService.getUniqueSymbols()
    } catch (error) {
        console.error('Error loading unique symbols:', error)
        uniqueSymbols.value = []
    }
}

// Watch for filter changes and reload data
watch(filters, () => {
    loadTrades()
}, { deep: true })

// Initialize data on component mount
onMounted(async () => {
    await Promise.all([
        loadTrades(),
        loadUniqueSymbols()
    ])
})

// Format date
const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
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

// Function to edit a trade
const handleEdit = (trade) => {
    // Format dates for the form inputs
    const formattedTrade = {
        ...trade,
        entryDate: trade.entryDate ? new Date(trade.entryDate).toISOString().slice(0, 10) : '',
        exitDate: trade.exitDate ? new Date(trade.exitDate).toISOString().slice(0, 10) : ''
    }
    startEditingTrade(formattedTrade)
}

const calculatePnL = (trade) => {
    if (trade.entryPrice && trade.exitPrice && trade.lots) {
        const priceDiff = trade.exitPrice - trade.entryPrice
        const multiplier = trade.type === 'SELL' ? -1 : 1
        return priceDiff * trade.lots * multiplier
    }
    return 0
}

const handleEditSubmit = () => {
    try {
        const tradesData = JSON.parse(localStorage.getItem('trades') || '[]')
        const index = tradesData.findIndex(t => t.id === editedTrade.value.id)

        if (index !== -1) {
            // Calculate new P&L
            const pnlAmount = calculatePnL(editedTrade.value)
            const pnlPercentage = editedTrade.value.capitalUsed ? (pnlAmount / editedTrade.value.capitalUsed) * 100 : 0

            // Update trade with new values
            const updatedTrade = {
                ...editedTrade.value,
                pnlAmount,
                pnlPercentage,
                status: editedTrade.value.exitDate ? 'CLOSED' : 'OPEN'
            }

            tradesData[index] = updatedTrade
            localStorage.setItem('trades', JSON.stringify(tradesData))

            // Refresh the trades list
            loadTrades()
            closeEditModal()
        }
    } catch (error) {
        console.error('Error updating trade:', error)
    }
}

const closeEditModal = () => {
    showEditModal.value = false
    editedTrade.value = {}
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

// Calculate net profit from sorted trades
const calculateNetProfit = computed(() => {
    return sortedTrades.value.reduce((sum, trade) => sum + (trade.pnlAmount || 0), 0)
})

// Sort trades (filtering is now done server-side)
const sortedTrades = computed(() => {
    const sorted = [...trades.value]

    // Sort trades
    sorted.sort((a, b) => {
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

    return sorted
})

// View trade details
const viewTradeDetails = (trade) => {
    selectedTrade.value = trade
}

// Delete trade
const deleteTrade = async (trade) => {
    if (confirm('Are you sure you want to delete this trade?')) {
        isDeletingTrade.value = true
        try {
            await tradeService.deleteTrade(trade.id)
            
            // Reload filtered data instead of client-side filtering
            await loadTrades()
            
            // Also reload unique symbols in case this was the only trade for that symbol
            await loadUniqueSymbols()
            
            // Refresh dashboard data
            refreshDashboard()
            
            displayToast('success', 'Trade Deleted', `Successfully deleted trade for ${trade.symbol}`)
        } catch (error) {
            console.error('Error deleting trade:', error)
            displayToast('error', 'Error', 'Failed to delete trade. Please try again.')
        } finally {
            isDeletingTrade.value = false
        }
    }
}
</script>

<style scoped>
.trade-history {
    padding: 1rem;
}

@media (min-width: 768px) {
    .trade-history {
        padding: 20px;
    }
}

.results-summary {
    margin: 1rem 0;
    padding: 1rem;
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

@media (min-width: 768px) {
    .results-summary {
        margin: 20px 0;
        padding: 15px;
        flex-direction: row;
        justify-content: space-between;
        align-items: center;
        gap: 0;
    }
}

.total-results {
    font-size: 1.1em;
    color: #1e293b;
}

.trades-summary {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
}

@media (min-width: 768px) {
    .trades-summary {
        flex-direction: row;
        gap: 20px;
        align-items: center;
        justify-content: space-between;
        flex-wrap: wrap;
    }
}

.summary-stats {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    justify-content: center;
}

@media (min-width: 768px) {
    .summary-stats {
        gap: 20px;
        justify-content: flex-start;
        flex-wrap: nowrap;
    }
}

.summary-stats span {
    padding: 4px 12px;
    border-radius: 4px;
    font-size: 0.9em;
}

.net-profit {
    font-size: 1.1em;
    font-weight: 600;
    padding: 4px 16px;
    border-radius: 4px;
}

.net-profit.profit {
    background-color: rgba(66, 184, 131, 0.1);
    color: #42b883;
}

.net-profit.loss {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.profit-count {
    background-color: rgba(66, 184, 131, 0.1);
    color: #42b883;
}

.loss-count {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.breakeven-count {
    background-color: rgba(100, 116, 139, 0.1);
    color: #64748b;
}

.filter-group {
    margin-right: 20px;
    min-width: 150px;
}

.date-filter {
    min-width: 200px;
}

.custom-date-range {
    margin-top: 10px;
    display: flex;
    gap: 10px;
}

.date-input {
    flex: 1;
}

.date-input label {
    display: block;
    font-size: 0.9em;
    margin-bottom: 4px;
}

.date-input input[type="date"] {
    width: 100%;
    padding: 6px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 14px;
}

.modal {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
}

.modal-content {
    background-color: white;
    padding: 20px;
    border-radius: 8px;
    width: 90%;
    max-width: 800px;
    max-height: 90vh;
    overflow-y: auto;
}

.modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 20px;
}

.edit-btn {
    background-color: #4CAF50;
    color: white;
}

.save-btn {
    background-color: #4CAF50;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.cancel-btn {
    background-color: #f44336;
    color: white;
    padding: 8px 16px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
}

.filters {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
    .filters {
        flex-direction: row;
        gap: 20px;
        margin-bottom: 30px;
        flex-wrap: wrap;
    }
}

.filter-group {
    flex: 1;
    min-width: auto;
}

@media (min-width: 768px) {
    .filter-group {
        min-width: 200px;
    }
}

.filter-group label {
    display: block;
    margin-bottom: 5px;
    font-weight: 500;
}

.filter-group select {
    width: 100%;
    padding: 12px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    background-color: white;
    font-size: 16px;
    min-height: 44px;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
}

@media (min-width: 768px) {
    .filter-group select {
        padding: 8px;
        font-size: 14px;
        min-height: auto;
    }
}

.table-container {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    margin: 1rem -1rem;
    padding: 0 1rem;
}

@media (min-width: 768px) {
    .table-container {
        margin: 0;
        padding: 0;
    }
}

table {
    width: 100%;
    border-collapse: collapse;
    margin-top: 1rem;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    min-width: 800px;
    font-size: 0.875rem;
}

@media (min-width: 768px) {
    table {
        margin-top: 20px;
        min-width: 100%;
        font-size: 1rem;
    }
}

th {
    background-color: #f8fafc;
    padding: 8px;
    text-align: left;
    font-weight: 600;
    color: #1e293b;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    font-size: 0.8rem;
}

@media (min-width: 768px) {
    th {
        padding: 12px;
        font-size: 1rem;
    }
}

th.active {
    background-color: #e2e8f0;
}

td {
    padding: 8px;
    border-top: 1px solid #e2e8f0;
    white-space: nowrap;
    font-size: 0.8rem;
}

@media (min-width: 768px) {
    td {
        padding: 12px;
        font-size: 1rem;
    }
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

.actions-cell {
    min-width: 200px;
}

.actions-container {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    justify-content: center;
}

@media (min-width: 768px) {
    .actions-container {
        justify-content: flex-start;
        flex-wrap: nowrap;
        gap: 0;
    }
}

.action-btn {
    padding: 6px 10px;
    margin: 2px;
    border-radius: 4px;
    cursor: pointer;
    font-size: 12px;
    min-height: 36px;
    min-width: 60px;
    touch-action: manipulation;
    display: inline-block;
}

@media (min-width: 768px) {
    .action-btn {
        padding: 4px 8px;
        margin: 0 4px;
        font-size: 14px;
        min-height: auto;
        min-width: auto;
    }
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

.value.profit {
    color: #42b883;
}

.value.loss {
    color: #ef4444;
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

/* Loader Styles */
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
</style>
