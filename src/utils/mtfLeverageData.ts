/**
 * MTF Leverage Data Service
 * Manages Zerodha MTF approved securities leverage mapping using pre-processed JSON data
 */

export interface MTFSecurity {
  isin: string
  symbol: string
  category: string
  margin: number
  leverage: number
}

let mtfSecurities: Map<string, MTFSecurity> = new Map()
let isLoaded = false

/**
 * Load MTF data from JSON file in public folder
 */
export const loadMTFData = async (): Promise<boolean> => {
  if (isLoaded && mtfSecurities.size > 0) {
    return true
  }

  try {
    const response = await fetch(`${import.meta.env.BASE_URL}mtf-securities.json`)
    if (!response.ok) {
      console.warn('MTF securities JSON not found, leverage auto-population disabled')
      isLoaded = true
      return false
    }

    const securities: MTFSecurity[] = await response.json()

    // Build map for quick lookup
    mtfSecurities.clear()
    securities.forEach(security => {
      // Ensure symbol is uppercase for consistent lookup
      const symbol = (security.symbol || '').toUpperCase()
      if (symbol) {
        mtfSecurities.set(symbol, {
          ...security,
          symbol
        })
      }
    })

    isLoaded = true
    console.log(`Loaded ${mtfSecurities.size} MTF securities from JSON`)
    return true
  } catch (error) {
    console.error('Error loading MTF data:', error)
    isLoaded = true
    return false
  }
}

/**
 * Get leverage for a given symbol
 */
export const getLeverageBySymbol = (symbol: string): number | null => {
  if (!symbol) return null

  const normalizedSymbol = symbol.trim().toUpperCase()
  const security = mtfSecurities.get(normalizedSymbol)

  return security ? security.leverage : null
}

/**
 * Get all MTF security details
 */
export const getMTFSecurity = (symbol: string): MTFSecurity | null => {
  if (!symbol) return null

  const normalizedSymbol = symbol.trim().toUpperCase()
  return mtfSecurities.get(normalizedSymbol) || null
}

/**
 * Get all loaded securities
 */
export const getAllMTFSecurities = (): MTFSecurity[] => {
  return Array.from(mtfSecurities.values())
}

/**
 * Check if data is loaded
 */
export const isMTFDataLoaded = (): boolean => {
  return isLoaded && mtfSecurities.size > 0
}

/**
 * Get total count of securities
 */
export const getMTFSecurityCount = (): number => {
  return mtfSecurities.size
}
