<template>
  <div class="trade-history">
    <h2>Trade History</h2>

    <!-- Tabs Component -->
    <TradeTabs
      v-model:active-tab="activeTab"
      :open-count="openTrades.length"
      :closed-count="closedTrades.length"
    />

    <!-- Filters Component -->
    <TradeFilters
      v-model:filters="filters"
      :unique-symbols="uniqueSymbols"
    />

    <!-- Results Summary Component -->
    <TradeResultsSummary
      :trades="currentTabTrades"
      :active-tab="activeTab"
    />

    <!-- Desktop Table Component -->
    <TradeTable
      :trades="currentTabTrades"
      :sort-key="sortKey"
      :sort-order="sortDir"
      :is-loading="isLoadingTrades"
      :active-tab="activeTab"
      @sort="sortBy"
      @view="viewTradeDetails"
      @edit="handleEdit"
      @delete="deleteTrade"
    />

    <!-- Mobile Cards Component -->
    <TradeCards
      :trades="currentTabTrades"
      :sort-key="sortKey"
      :sort-order="sortDir"
      :is-loading="isLoadingTrades"
      :active-tab="activeTab"
      @sort="sortBy"
      @toggle-sort="toggleSortOrder"
      @view="viewTradeDetails"
      @edit="handleEdit"
      @delete="deleteTrade"
    />

    <!-- Trade Details Modal Component -->
    <TradeDetailsModal
      :trade="selectedTrade"
      @close="selectedTrade = null"
    />
  </div>
</template>

<script setup>
import { ref, computed, inject, watch, onMounted } from 'vue'
import { tradeService } from '../../firebase/tradeService'
import { logger } from '@/utils/logger'
import TradeTabs from './TradeHistory/TradeTabs.vue'
import TradeFilters from './TradeHistory/TradeFilters.vue'
import TradeResultsSummary from './TradeHistory/TradeResultsSummary.vue'
import TradeTable from './TradeHistory/TradeTable.vue'
import TradeCards from './TradeHistory/TradeCards.vue'
import TradeDetailsModal from './TradeHistory/TradeDetailsModal.vue'

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
    logger.info(`${type}: ${title} - ${message}`, 'TradeHistory')
  }
}

const selectedTrade = ref(null)
const trades = ref([])
const uniqueSymbols = ref([])
const sortKey = ref('entryDate')
const sortDir = ref('desc')
const activeTab = ref('closed') // Default to closed trades

const filters = ref({
  dateRange: 'current-month',
  startDate: '',
  endDate: '',
  symbol: 'all',
  type: 'all',
  profitability: 'all'
})

// Load trades with current filters
const loadTrades = async() => {
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
    logger.error('Error loading trades', 'TradeHistory', error)
    trades.value = []

    // Show more helpful error messages
    const errorMessage = error instanceof Error ? error.message : String(error)
    if (errorMessage.includes('authenticated')) {
      displayToast('error', 'Authentication Required', 'Please sign in with Google to view your trades.')
    } else if (errorMessage.includes('permission')) {
      displayToast('error', 'Permission Error', 'Database access denied. Please check Firestore rules.')
    } else {
      displayToast('error', 'Error', 'Failed to load trades. Please try again.')
    }
  } finally {
    isLoadingTrades.value = false
  }
}

// Load unique symbols for filter dropdown
const loadUniqueSymbols = async() => {
  try {
    uniqueSymbols.value = await tradeService.getUniqueSymbols()
  } catch (error) {
    logger.error('Error loading unique symbols', 'TradeHistory', error)
    uniqueSymbols.value = []
    // Symbols are not critical, so just log the error
  }
}

// Watch for filter changes and reload data
watch(filters, () => {
  loadTrades()
}, { deep: true })

// Initialize data on component mount
onMounted(async() => {
  await Promise.all([
    loadTrades(),
    loadUniqueSymbols()
  ])
})

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

// Sorting functions
const sortBy = (key) => {
  if (sortKey.value === key) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortKey.value = key
    sortDir.value = 'asc'
  }
}

const toggleSortOrder = () => {
  sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
}

// Separate open and closed trades
const openTrades = computed(() => {
  return sortedTrades.value.filter(trade => !trade.exitPrice || trade.exitPrice === null || trade.exitPrice === 0)
})

const closedTrades = computed(() => {
  return sortedTrades.value.filter(trade => trade.exitPrice && trade.exitPrice !== null && trade.exitPrice !== 0)
})

// Current tab trades based on active tab
const currentTabTrades = computed(() => {
  return activeTab.value === 'open' ? openTrades.value : closedTrades.value
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
const deleteTrade = async(trade) => {
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
      logger.error('Error deleting trade', 'TradeHistory', error)
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
</style>
