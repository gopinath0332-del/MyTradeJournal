import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where
} from 'firebase/firestore'
import { db } from './config'
import { logger } from '@/utils/logger'
import { cacheService } from '@/utils/cache'
import type { Trade, TradeFilters } from '@/types'

const COLLECTION_NAME = 'trades'

export const tradeService = {
  // Create a new trade
  async addTrade(trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>): Promise<Trade> {
    try {
      const now = new Date().toISOString()
      const tradeData = {
        ...trade,
        createdAt: now,
        updatedAt: now
      }
      const docRef = await addDoc(collection(db, COLLECTION_NAME), tradeData)

      // Invalidate relevant caches
      this._invalidateTradesCaches()

      return { ...tradeData, id: docRef.id }
    } catch (error) {
      logger.error('Error adding trade', 'tradeService', error)
      throw error
    }
  },

  // Update an existing trade
  async updateTrade(id: string, trade: Partial<Trade>) {
    try {
      const tradeRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(tradeRef, {
        ...trade,
        updatedAt: new Date().toISOString()
      })

      // Invalidate relevant caches
      this._invalidateTradesCaches()

      return { ...trade, id }
    } catch (error) {
      logger.error('Error updating trade', 'tradeService', error)
      throw error
    }
  },

  // Get a trade by ID
  async getTradeById(id: string): Promise<Trade | null> {
    try {
      const tradeRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(tradeRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Trade
      } else {
        return null
      }
    } catch (error) {
      logger.error('Error getting trade by ID', 'tradeService', error)
      throw error
    }
  },

  // Delete a trade
  async deleteTrade(id: string) {
    try {
      const tradeRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(tradeRef)

      // Invalidate relevant caches
      this._invalidateTradesCaches()

      return id
    } catch (error) {
      logger.error('Error deleting trade', 'tradeService', error)
      throw error
    }
  },

  // Get all trades (fallback without ordering)
  async getAllTradesSimple() {
    try {
      logger.info('Attempting to get all trades (simple)', 'tradeService')
      const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
      logger.info(`Successfully retrieved ${querySnapshot.size} trades (simple)`, 'tradeService')
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[]
    } catch (error: any) {
      logger.error('Error getting trades (simple)', 'tradeService', error)
      throw new Error(`Failed to retrieve trades: ${error.message || error}`)
    }
  },

  // Get all trades with fallback
  async getAllTrades() {
    try {
      logger.info('Attempting to get all trades with ordering', 'tradeService')
      const q = query(collection(db, COLLECTION_NAME), orderBy('entryDate', 'desc'))
      const querySnapshot = await getDocs(q)
      logger.info(`Successfully retrieved ${querySnapshot.size} trades with ordering`, 'tradeService')
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[]
    } catch (error: any) {
      logger.warn('Ordered query failed, falling back to simple query', 'tradeService', error)

      // Fallback to simple query
      try {
        return await this.getAllTradesSimple()
      } catch (fallbackError: any) {
        // Enhanced error handling for debugging
        logger.error('Both ordered and simple queries failed', 'tradeService', fallbackError)

        if (fallbackError.code === 'permission-denied') {
          throw new Error(`Permission denied accessing Firestore. Please check your Firestore security rules. See FIRESTORE_SETUP.md for instructions.`)
        } else if (fallbackError.code === 'not-found') {
          throw new Error(`Firestore database or collection '${COLLECTION_NAME}' not found. Please ensure Firestore is enabled in your Firebase project.`)
        } else if (fallbackError.code === 'unauthenticated') {
          throw new Error(`Authentication required. Please check your Firebase configuration and security rules.`)
        }

        throw new Error(`Failed to retrieve trades: ${fallbackError.message || fallbackError}`)
      }
    }
  },

  // Get trades for a specific year with fallback
  async getTradesByYear(year: number) {
    try {
      // Try complex query first
      const startDate = `${year}-01-01`
      const endDate = `${year + 1}-01-01`

      const q = query(
        collection(db, COLLECTION_NAME),
        where('entryDate', '>=', startDate),
        where('entryDate', '<', endDate),
        orderBy('entryDate', 'desc')
      )
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[]
    } catch (error: any) {
      logger.warn(`Complex query for year ${year} failed, falling back to client-side filtering`, 'tradeService', error)

      // Fallback: get all trades and filter on client side
      try {
        const allTrades = await this.getAllTradesSimple()
        return allTrades.filter(trade => {
          const tradeYear = new Date(trade.entryDate).getFullYear()
          return tradeYear === year
        }).sort((a, b) => new Date(b.entryDate).getTime() - new Date(a.entryDate).getTime())
      } catch (fallbackError: any) {
        logger.error(`Error getting trades for year ${year}`, 'tradeService', fallbackError)
        throw new Error(`Failed to retrieve trades for ${year}: ${fallbackError.message || fallbackError}`)
      }
    }
  },

  // Get available years with fallback
  async getAvailableYears() {
    try {
      // Try complex query first
      const q = query(collection(db, COLLECTION_NAME), orderBy('entryDate', 'desc'))
      const querySnapshot = await getDocs(q)
      const years = [...new Set(querySnapshot.docs.map(doc =>
        new Date(doc.data().entryDate).getFullYear()
      ))]
      return years.sort((a, b) => b - a)
    } catch (error: any) {
      logger.warn('Complex query for available years failed, falling back to simple query', 'tradeService', error)

      // Fallback: get all trades and extract years on client side
      try {
        const allTrades = await this.getAllTradesSimple()
        const years = [...new Set(allTrades.map(trade =>
          new Date(trade.entryDate).getFullYear()
        ))]
        return years.sort((a, b) => b - a)
      } catch (fallbackError: any) {
        logger.error('Error getting available years', 'tradeService', fallbackError)
        throw new Error(`Failed to retrieve available years: ${fallbackError.message || fallbackError}`)
      }
    }
  },

  // Get trades with filters applied on server-side
  async getFilteredTrades(filters: TradeFilters = {}) {
    // Generate cache key from filters
    const cacheKey = `filtered-trades:${JSON.stringify(filters)}`

    // Try to get from cache first (short TTL for real-time data)
    const cached = cacheService.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      let q = query(collection(db, COLLECTION_NAME))
      const conditions = []

      // Apply date range filter
      if (filters.startDate && filters.endDate) {
        conditions.push(where('entryDate', '>=', filters.startDate))
        conditions.push(where('entryDate', '<=', filters.endDate))
      } else if (filters.dateRange && filters.dateRange !== 'all') {
        const now = new Date()
        let startDate

        if (filters.dateRange === 'current-month') {
          startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
          const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
          conditions.push(where('entryDate', '>=', startDate))
          conditions.push(where('entryDate', '<=', endDate))
        } else if (filters.dateRange === 'last-month') {
          // Get the previous month
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
          conditions.push(where('entryDate', '>=', lastMonth.toISOString()))
          conditions.push(where('entryDate', '<=', lastMonthEnd.toISOString()))
        } else if (filters.dateRange === 'last-3-months') {
          // Get the start of 3 months ago
          const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1)
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999)
          conditions.push(where('entryDate', '>=', threeMonthsAgo.toISOString()))
          conditions.push(where('entryDate', '<=', lastMonthEnd.toISOString()))
        } else if (filters.dateRange === '7') {
          const daysBack = 7
          startDate = new Date()
          startDate.setDate(startDate.getDate() - daysBack)
          conditions.push(where('entryDate', '>=', startDate.toISOString()))
        }
      }

      // Apply symbol filter
      if (filters.symbol && filters.symbol !== 'all') {
        conditions.push(where('symbol', '==', filters.symbol))
      }

      // Apply type filter
      if (filters.type && filters.type !== 'all') {
        conditions.push(where('type', '==', filters.type))
      }

      // Build query with conditions
      if (conditions.length > 0) {
        q = query(collection(db, COLLECTION_NAME), ...conditions, orderBy('entryDate', 'desc'))
      } else {
        q = query(collection(db, COLLECTION_NAME), orderBy('entryDate', 'desc'))
      }

      const querySnapshot = await getDocs(q)
      let trades = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[]

      // Apply profitability filter on client-side (since we can't easily do complex calculations in Firestore)
      if (filters.profitability && filters.profitability !== 'all') {
        trades = trades.filter(trade => {
          const pnl = trade.pnlAmount || 0
          if (filters.profitability === 'profit') {
            return pnl > 0
          } else if (filters.profitability === 'loss') {
            return pnl < 0
          }
          return true
        })
      }

      // Cache the results (1 minute TTL for filtered data)
      cacheService.set(cacheKey, trades, 60 * 1000)

      return trades
    } catch (error) {
      logger.error('Error getting filtered trades', 'tradeService', error)
      throw error
    }
  },

  // Get unique symbols without loading all trade data
  async getUniqueSymbols() {
    const cacheKey = 'unique-symbols'

    // Try to get from cache first
    const cached = cacheService.get(cacheKey)
    if (cached) {
      return cached
    }

    try {
      const q = query(collection(db, COLLECTION_NAME))
      const querySnapshot = await getDocs(q)
      const symbols = [...new Set(querySnapshot.docs.map(doc => doc.data().symbol))]
      const sortedSymbols = symbols.sort()

      // Cache for 30 minutes (symbols don't change frequently)
      cacheService.set(cacheKey, sortedSymbols, 30 * 60 * 1000)

      return sortedSymbols
    } catch (error) {
      logger.error('Error getting unique symbols', 'tradeService', error)
      throw error
    }
  },

  // Cache management methods
  _invalidateTradesCaches() {
    // Clear all trade-related caches when data changes
    const keys = ['all-trades', 'unique-symbols', 'available-years']
    keys.forEach(key => {
      cacheService.delete(key)
    })

    // Also clear any filter-based caches
    cacheService.clear() // For now, clear all - could be more selective
  },

  // Get cache statistics for debugging
  getCacheStats() {
    return cacheService.getStats()
  },

  // Clear all caches
  clearAllCaches() {
    cacheService.clear()
  }
}
