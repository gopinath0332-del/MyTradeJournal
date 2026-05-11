import { logger } from '@/utils/logger'

export interface StockQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
  lastUpdated: string
}

export const yahooFinanceService = {
  /**
   * Fetch live quotes for multiple symbols
   * Note: This uses a public Yahoo Finance API. 
   * Indian stocks usually need .NS (NSE) or .BO (BSE) suffix.
   */
  async getQuotes(symbols: string[]): Promise<Record<string, StockQuote>> {
    if (!symbols.length) return {}

    try {
      // Append .NS to symbols that don't have a suffix (assuming Indian stocks for this journal)
      // This is a heuristic, but common for Indian traders
      const formattedSymbols = symbols.map(s => {
        if (s.includes('.') || s.includes(':')) return s
        return `${s}.NS`
      })

      const symbolsString = formattedSymbols.join(',')
      // Using corsproxy.io which is generally more reliable for Yahoo Finance
      const yahooUrl = `https://query1.finance.yahoo.com/v7/finance/quote?symbols=${symbolsString}`
      const url = `https://corsproxy.io/?${encodeURIComponent(yahooUrl)}`
      
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error(`Proxy error: ${response.statusText}`)
      }

      const data = await response.json()
      const quotes: Record<string, StockQuote> = {}

      if (data.quoteResponse && data.quoteResponse.result) {
        data.quoteResponse.result.forEach((result: any) => {
          // Remove the .NS suffix when mapping back to original symbols
          const originalSymbol = symbols.find(s => 
            s === result.symbol || `${s}.NS` === result.symbol || `${s}.BO` === result.symbol
          ) || result.symbol

          quotes[originalSymbol] = {
            symbol: originalSymbol,
            price: result.regularMarketPrice,
            change: result.regularMarketChange,
            changePercent: result.regularMarketChangePercent,
            lastUpdated: new Date().toISOString()
          }
        })
      }

      return quotes
    } catch (error) {
      logger.error('Error fetching Yahoo Finance quotes', 'yahooFinanceService', error)
      return {}
    }
  }
}
