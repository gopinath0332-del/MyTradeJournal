// import { logger } from '@/utils/logger'

export const YAHOO_FINANCE_ENABLED = false // Disable integration; set to true to enable

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  lastUpdated: string
}

const PROXIES = [
  (url: string) => url, // Direct
  (url: string) => `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`
]

export const yahooFinanceService = {
  async getQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
    if (!YAHOO_FINANCE_ENABLED || !symbols.length) return {}

    const quotes: Record<string, StockQuote> = {}
    
    // We fetch symbols in parallel to improve speed
    const fetchPromises = symbols.map(async (symbol) => {
      const formattedSymbol = symbol.includes('.') || symbol.includes(':') ? symbol : `${symbol}.NS`
      
      // Using the v8/chart endpoint which is often more reliable
      const yahooUrl = `https://query2.finance.yahoo.com/v8/finance/chart/${formattedSymbol}?interval=1m&range=1d`
      
      for (const getProxyUrl of PROXIES) {
        try {
          const proxyUrl = getProxyUrl(yahooUrl)
          const response = await fetch(proxyUrl)
          
          if (!response.ok) continue

          let data: any
          if (proxyUrl.includes('allorigins')) {
            const wrapper = await response.json()
            data = JSON.parse(wrapper.contents)
          } else {
            data = await response.json()
          }

          const result = data?.chart?.result?.[0]
          if (result && result.meta) {
            const meta = result.meta
            quotes[symbol] = {
              symbol: symbol,
              price: meta.regularMarketPrice,
              change: meta.regularMarketPrice - meta.chartPreviousClose,
              changePercent: ((meta.regularMarketPrice - meta.chartPreviousClose) / meta.chartPreviousClose) * 100,
              lastUpdated: new Date().toISOString()
            }
            return // Success for this symbol
          }
        } catch (error) {
          // Silent fallback to next proxy
        }
      }
    })

    await Promise.all(fetchPromises)
    return quotes
  }
}
