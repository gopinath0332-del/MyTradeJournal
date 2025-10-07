import {
  query,
  limit,
  startAfter,
  getDocs,
  type Query,
  type DocumentSnapshot,
  type QuerySnapshot
} from 'firebase/firestore'

// Enhanced caching service for Firebase data
class CacheService {
  private cache: Map<string, any>
  private expirationTimes: Map<string, number>
  private accessTimes: Map<string, number>
  private maxSize: number
  private defaultTTL: number

  constructor() {
    this.cache = new Map()
    this.expirationTimes = new Map()
    this.accessTimes = new Map()
    this.maxSize = 100 // Maximum number of cached items
    this.defaultTTL = 5 * 60 * 1000 // 5 minutes in milliseconds
  }

  // Set item in cache with optional TTL
  set(key: string, value: any, ttl: number = this.defaultTTL): void {
    this._evictIfNeeded()

    const expirationTime = Date.now() + ttl
    this.cache.set(key, value)
    this.expirationTimes.set(key, expirationTime)
    this.accessTimes.set(key, Date.now())
  }

  // Get item from cache
  get(key: string): any {
    const now = Date.now()

    // Check if item exists and is not expired
    if (!this.cache.has(key)) {
      return null
    }

    const expirationTime = this.expirationTimes.get(key)
    if (expirationTime && now > expirationTime) {
      this.delete(key)
      return null
    }

    // Update access time for LRU eviction
    this.accessTimes.set(key, now)
    return this.cache.get(key)
  }

  // Check if item exists and is valid
  has(key: string): boolean {
    return this.get(key) !== null
  }

  // Delete item from cache
  delete(key: string): void {
    this.cache.delete(key)
    this.expirationTimes.delete(key)
    this.accessTimes.delete(key)
  }

  // Clear all cache
  clear(): void {
    this.cache.clear()
    this.expirationTimes.clear()
    this.accessTimes.clear()
  }

  // Get cache statistics
  getStats() {
    const now = Date.now()
    let validEntries = 0
    let expiredEntries = 0

    this.expirationTimes.forEach((expirationTime) => {
      if (now <= expirationTime) {
        validEntries++
      } else {
        expiredEntries++
      }
    })

    return {
      totalEntries: this.cache.size,
      validEntries,
      expiredEntries,
      maxSize: this.maxSize
    }
  }

  // Clean up expired entries
  cleanup(): number {
    const now = Date.now()
    const keysToDelete: string[] = []

    this.expirationTimes.forEach((expirationTime, key) => {
      if (now > expirationTime) {
        keysToDelete.push(key)
      }
    })

    keysToDelete.forEach(key => this.delete(key))
    return keysToDelete.length
  }

  // Evict least recently used items if cache is full
  private _evictIfNeeded(): void {
    while (this.cache.size >= this.maxSize) {
      // Find the least recently used item
      let oldestKey: string | null = null
      let oldestTime = Date.now()

      this.accessTimes.forEach((accessTime, key) => {
        if (accessTime < oldestTime) {
          oldestTime = accessTime
          oldestKey = key
        }
      })

      if (oldestKey) {
        this.delete(oldestKey)
      } else {
        // Fallback: delete first item
        const firstKey = this.cache.keys().next().value
        if (firstKey) {
          this.delete(firstKey)
        }
      }
    }
  }

  // Generate cache key from parameters
  static generateKey(prefix: string, params: Record<string, any> = {}): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((result: Record<string, any>, key) => {
        result[key] = params[key]
        return result
      }, {})

    return `${prefix}:${JSON.stringify(sortedParams)}`
  }
}

// Create singleton instance
export const cacheService = new CacheService()

// Query optimization helpers
export const QueryOptimizer = {
  // Batch multiple queries together
  batchQueries: async(queries: Promise<any>[]): Promise<any[]> => {
    try {
      const results = await Promise.all(queries)
      return results
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Batch query failed: ${message}`)
    }
  },

  // Debounce function for search queries
  debounce: (func: (...args: any[]) => void, wait: number) => {
    let timeout: NodeJS.Timeout | null = null
    return function executedFunction(...args: any[]) {
      const later = () => {
        if (timeout) clearTimeout(timeout)
        func(...args)
      }
      if (timeout) clearTimeout(timeout)
      timeout = setTimeout(later, wait)
    }
  }
}

// Pagination helper
export class PaginationHelper {
  private pageSize: number
  private lastDoc: DocumentSnapshot | null
  private hasMore: boolean

  constructor(pageSize = 50) {
    this.pageSize = pageSize
    this.lastDoc = null
    this.hasMore = true
  }

  reset(): void {
    this.lastDoc = null
    this.hasMore = true
  }

  async getNextPage(baseQuery: Query): Promise<{ items: any[], hasMore: boolean }> {
    if (!this.hasMore) {
      return { items: [], hasMore: false }
    }

    let paginatedQuery = query(baseQuery, limit(this.pageSize))

    if (this.lastDoc) {
      paginatedQuery = query(paginatedQuery, startAfter(this.lastDoc))
    }

    const snapshot: QuerySnapshot = await getDocs(paginatedQuery)
    const items = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))

    this.hasMore = items.length === this.pageSize
    if (items.length > 0 && snapshot.docs.length > 0) {
      this.lastDoc = snapshot.docs[snapshot.docs.length - 1] || null
    }

    return { items, hasMore: this.hasMore }
  }
}

// Performance monitoring
export const PerformanceMonitor = {
  timers: new Map<string, number>(),

  start(operation: string): void {
    this.timers.set(operation, performance.now())
  },

  end(operation: string): number {
    const startTime = this.timers.get(operation)
    if (startTime) {
      const duration = performance.now() - startTime
      this.timers.delete(operation)
      console.debug(`Operation "${operation}" took ${duration.toFixed(2)}ms`)
      return duration
    }
    return 0
  },

  measure<T>(operation: string, func: (...args: any[]) => Promise<T>) {
    return async(...args: any[]): Promise<T> => {
      this.start(operation)
      try {
        const result = await func(...args)
        return result
      } finally {
        this.end(operation)
      }
    }
  }
}
