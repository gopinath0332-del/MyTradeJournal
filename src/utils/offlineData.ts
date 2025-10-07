// Offline data management service
class OfflineDataManager {
  private isOnline: boolean = navigator.onLine
  private syncInProgress = false

  constructor() {
    this.setupEventListeners()
  }

  private setupEventListeners() {
    window.addEventListener('online', () => {
      this.isOnline = true
      this.syncOfflineData()
    })

    window.addEventListener('offline', () => {
      this.isOnline = false
    })
  }

  // Store data for offline access using localStorage as fallback
  async storeOfflineData(collection: string, id: string, data: any): Promise<void> {
    try {
      const storageKey = `offline_${collection}_${id}`
      const item = {
        data,
        timestamp: Date.now(),
        synced: this.isOnline
      }
      localStorage.setItem(storageKey, JSON.stringify(item))
    } catch (error) {
      console.error('Failed to store offline data:', error)
    }
  }

  // Get offline data
  async getOfflineData(collection: string, id?: string): Promise<any> {
    try {
      if (id) {
        const storageKey = `offline_${collection}_${id}`
        const stored = localStorage.getItem(storageKey)
        if (stored) {
          const parsed = JSON.parse(stored)
          return parsed.data
        }
        return null
      } else {
        const allData = []
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i)
          if (key?.startsWith(`offline_${collection}_`)) {
            const stored = localStorage.getItem(key)
            if (stored) {
              const parsed = JSON.parse(stored)
              allData.push(parsed.data)
            }
          }
        }
        return allData
      }
    } catch (error) {
      console.error('Failed to get offline data:', error)
      return null
    }
  }

  // Queue action for offline sync
  async queueOfflineAction(
    type: 'create' | 'update' | 'delete',
    collection: string,
    data: any,
    id?: string
  ): Promise<void> {
    try {
      const actionId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const queueKey = `offline_queue_${actionId}`

      const action = {
        id: actionId,
        type,
        collection,
        data: { ...data, id: id || data.id },
        timestamp: Date.now(),
        retryCount: 0
      }

      localStorage.setItem(queueKey, JSON.stringify(action))

      // If online, try to sync immediately
      if (this.isOnline) {
        this.syncOfflineData()
      }
    } catch (error) {
      console.error('Failed to queue offline action:', error)
    }
  }

  // Sync offline data when back online
  async syncOfflineData(): Promise<void> {
    if (!this.isOnline || this.syncInProgress) return

    this.syncInProgress = true

    try {
      const queueKeys = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('offline_queue_')) {
          queueKeys.push(key)
        }
      }

      for (const queueKey of queueKeys) {
        try {
          const stored = localStorage.getItem(queueKey)
          if (stored) {
            const action = JSON.parse(stored)
            await this.processOfflineAction(action)
            localStorage.removeItem(queueKey)
          }
        } catch (error) {
          console.error('Failed to sync action:', error)

          // Handle retry logic
          const stored = localStorage.getItem(queueKey)
          if (stored) {
            const action = JSON.parse(stored)
            action.retryCount += 1

            if (action.retryCount > 3) {
              localStorage.removeItem(queueKey)
              console.warn('Removed action after too many retries:', action)
            } else {
              localStorage.setItem(queueKey, JSON.stringify(action))
            }
          }
        }
      }

      console.log('Offline data sync completed')
    } catch (error) {
      console.error('Failed to sync offline data:', error)
    } finally {
      this.syncInProgress = false
    }
  }

  private async processOfflineAction(action: any): Promise<void> {
    // This would integrate with your Firebase service
    console.log('Processing offline action:', action)

    // Simulate API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.1) { // 90% success rate simulation
          resolve()
        } else {
          reject(new Error('Simulated network error'))
        }
      }, 100)
    })
  }

  // Enhanced cache with localStorage persistence
  async setCachedData(key: string, data: any, ttl: number = 5 * 60 * 1000): Promise<void> {
    try {
      const cacheItem = {
        data,
        timestamp: Date.now(),
        expiration: Date.now() + ttl
      }
      localStorage.setItem(`cache_${key}`, JSON.stringify(cacheItem))
    } catch (error) {
      console.error('Failed to cache data:', error)
    }
  }

  async getCachedData(key: string): Promise<any> {
    try {
      const stored = localStorage.getItem(`cache_${key}`)
      if (!stored) return null

      const cached = JSON.parse(stored)

      // Check expiration
      if (Date.now() > cached.expiration) {
        localStorage.removeItem(`cache_${key}`)
        return null
      }

      return cached.data
    } catch (error) {
      console.error('Failed to get cached data:', error)
      return null
    }
  }

  // Clean expired cache entries
  async cleanExpiredCache(): Promise<number> {
    try {
      let cleanedCount = 0
      const keysToRemove = []

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('cache_')) {
          const stored = localStorage.getItem(key)
          if (stored) {
            try {
              const cached = JSON.parse(stored)
              if (Date.now() > cached.expiration) {
                keysToRemove.push(key)
              }
            } catch (e) {
              keysToRemove.push(key) // Remove corrupted entries
            }
          }
        }
      }

      keysToRemove.forEach(key => {
        localStorage.removeItem(key)
        cleanedCount++
      })

      return cleanedCount
    } catch (error) {
      console.error('Failed to clean expired cache:', error)
      return 0
    }
  }

  // Get sync status
  async getSyncStatus(): Promise<{
    pendingActions: number
    lastSync: number | null
    isOnline: boolean
  }> {
    try {
      let pendingCount = 0
      let lastSyncTime = null

      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('offline_queue_')) {
          pendingCount++
          const stored = localStorage.getItem(key)
          if (stored) {
            const action = JSON.parse(stored)
            if (!lastSyncTime || action.timestamp > lastSyncTime) {
              lastSyncTime = action.timestamp
            }
          }
        }
      }

      return {
        pendingActions: pendingCount,
        lastSync: lastSyncTime,
        isOnline: this.isOnline
      }
    } catch (error) {
      console.error('Failed to get sync status:', error)
      return {
        pendingActions: 0,
        lastSync: null,
        isOnline: this.isOnline
      }
    }
  }

  // Force sync (useful for manual refresh)
  async forceSync(): Promise<void> {
    if (this.isOnline) {
      await this.syncOfflineData()
    }
  }

  // Clear all offline data (useful for logout)
  async clearOfflineData(): Promise<void> {
    try {
      const keysToRemove = []
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key?.startsWith('offline_') || key?.startsWith('cache_')) {
          keysToRemove.push(key)
        }
      }

      keysToRemove.forEach(key => localStorage.removeItem(key))
    } catch (error) {
      console.error('Failed to clear offline data:', error)
    }
  }
}

// Create singleton instance
export const offlineDataManager = new OfflineDataManager()

// Export utilities for components
export const useOfflineData = () => {
  return {
    storeOfflineData: offlineDataManager.storeOfflineData.bind(offlineDataManager),
    getOfflineData: offlineDataManager.getOfflineData.bind(offlineDataManager),
    queueOfflineAction: offlineDataManager.queueOfflineAction.bind(offlineDataManager),
    syncOfflineData: offlineDataManager.syncOfflineData.bind(offlineDataManager),
    getSyncStatus: offlineDataManager.getSyncStatus.bind(offlineDataManager),
    forceSync: offlineDataManager.forceSync.bind(offlineDataManager),
    setCachedData: offlineDataManager.setCachedData.bind(offlineDataManager),
    getCachedData: offlineDataManager.getCachedData.bind(offlineDataManager),
    isOnline: () => navigator.onLine
  }
}
