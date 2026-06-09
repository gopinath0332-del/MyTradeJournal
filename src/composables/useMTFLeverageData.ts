/**
 * Composable for MTF Leverage Data
 * Provides easy access to MTF security information
 */
import { ref, onMounted } from 'vue'
import { loadMTFData, getLeverageBySymbol, getMTFSecurity, isMTFDataLoaded } from '@/utils/mtfLeverageData'

const isLoading = ref(false)

export const useMTFLeverageData = () => {
  onMounted(async () => {
    if (!isMTFDataLoaded()) {
      isLoading.value = true
      await loadMTFData()
      isLoading.value = false
    }
  })

  const getLeverage = (symbol: string): number | null => {
    return getLeverageBySymbol(symbol)
  }

  const getSecurity = (symbol: string) => {
    return getMTFSecurity(symbol)
  }

  const getRecommendedLeverage = (symbol: string): number | null => {
    const leverage = getLeverageBySymbol(symbol)
    if (!leverage) return null
    // Round to nearest standard leverage (2x, 3x, 4x, 5x)
    const rounded = Math.round(leverage)
    return Math.max(2, Math.min(5, rounded))
  }

  return {
    isLoading,
    getLeverage,
    getSecurity,
    getRecommendedLeverage,
    isMTFDataLoaded
  }
}
