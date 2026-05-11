import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { yahooFinanceService, type StockQuote } from '@/services/yahooFinanceService'
import { useProfilesStore } from './profiles'
import { tradeService } from '@/firebase/tradeService'
import { logger } from '@/utils/logger'

export const useLiveDataStore = defineStore('liveData', () => {
  const prices = ref<Record<string, StockQuote>>({})
  const isLoading = ref(false)
  const lastUpdated = ref<string | null>(null)
  // let pollingInterval: number | null = null

  const profilesStore = useProfilesStore()

  /**
   * Fetch live prices for symbols in open trades
   */
  async function refreshPrices() {
    const activeProfile = profilesStore.activeProfile
    if (!activeProfile?.settings?.fetchLiveData) {
      return
    }

    isLoading.value = true
    try {
      // 1. Get all open trades for the active profile
      const allTrades = await tradeService.getAllTrades()
      const openTrades = allTrades.filter(t => !t.exitPrice || t.exitPrice === 0)
      
      // 2. Extract unique symbols
      const symbols = [...new Set(openTrades.map(t => t.symbol))]
      
      if (symbols.length > 0) {
        // 3. Fetch live prices
        const newQuotes = await yahooFinanceService.getQuotes(symbols)
        
        // 4. Update prices state
        prices.value = { ...prices.value, ...newQuotes }
        lastUpdated.value = new Date().toISOString()
        
        logger.info(`Updated live prices for ${Object.keys(newQuotes).length} symbols`, 'liveDataStore')
      }
    } catch (error) {
      logger.error('Failed to refresh live prices', 'liveDataStore', error)
    } finally {
      isLoading.value = false
    }
  }

  // Watch for profile changes to refresh once
  watch(() => profilesStore.activeProfile?.settings?.fetchLiveData, (shouldFetch) => {
    if (shouldFetch) {
      refreshPrices()
    }
  }, { immediate: true })

  // Watch for profile ID changes to force a refresh
  watch(() => profilesStore.activeProfileId, () => {
    if (profilesStore.activeProfile?.settings?.fetchLiveData) {
      refreshPrices()
    }
  })

  return {
    prices,
    isLoading,
    lastUpdated,
    refreshPrices
  }
})
