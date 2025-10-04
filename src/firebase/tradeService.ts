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

  // Get all trades
  async getAllTrades() {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('entryDate', 'desc'))
      const querySnapshot = await getDocs(q)
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[]
    } catch (error) {
      logger.error('Error getting trades', 'tradeService', error)
      throw error
    }
  },

  // Get trades for a specific year
  async getTradesByYear(year: number) {
    try {
      // Create date range for the year
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
    } catch (error) {
      logger.error('Error getting trades by year', 'tradeService', error)
      throw error
    }
  },

  // Get available years (for year selector dropdown)
  async getAvailableYears() {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('entryDate', 'desc'))
      const querySnapshot = await getDocs(q)
      const years = [...new Set(querySnapshot.docs.map(doc =>
        new Date(doc.data().entryDate).getFullYear()
      ))]
      return years.sort((a, b) => b - a)
    } catch (error) {
      logger.error('Error getting available years', 'tradeService', error)
      throw error
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
        } else if (filters.dateRange === '7' || filters.dateRange === '30' || filters.dateRange === '90') {
          const daysBack = parseInt(filters.dateRange)
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
