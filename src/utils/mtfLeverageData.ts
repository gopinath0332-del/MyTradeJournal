/**
 * MTF Leverage Data Service
 * Parses and manages Zerodha MTF approved securities leverage mapping
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
 * Parse CSV content from Zerodha MTF approved securities file
 */
const parseCSV = (csvContent: string): MTFSecurity[] => {
  const lines = csvContent.split('\n')
  const securities: MTFSecurity[] = []

  // Skip header row
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]?.trim()
    if (!line) continue

    const parts = line.split(',')
    if (parts.length < 5) continue

    const isin = parts[0]?.trim()
    const symbol = parts[1]?.trim()
    const category = parts[2]?.trim()
    const marginStr = parts[3]?.trim()
    const leverageStr = parts[4]?.trim()

    if (!symbol || !marginStr || !leverageStr) continue

    const margin = parseFloat(marginStr)
    const leverage = parseFloat(leverageStr)

    if (!isNaN(leverage)) {
      securities.push({
        isin: isin || '',
        symbol: symbol.toUpperCase(),
        category: category || '',
        margin,
        leverage
      })
    }
  }

  return securities
}

/**
 * Load MTF data from CSV file in public folder
 */
export const loadMTFData = async (): Promise<boolean> => {
  if (isLoaded && mtfSecurities.size > 0) {
    return true
  }

  try {
    const response = await fetch('/Zerodha - Approved Securities for MTF.csv')
    if (!response.ok) {
      console.warn('MTF CSV file not found, leverage auto-population disabled')
      isLoaded = true
      return false
    }

    const csvContent = await response.text()
    const securities = parseCSV(csvContent)

    // Build map for quick lookup
    mtfSecurities.clear()
    securities.forEach(security => {
      mtfSecurities.set(security.symbol, security)
    })

    isLoaded = true
    console.log(`Loaded ${mtfSecurities.size} MTF securities`)
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
