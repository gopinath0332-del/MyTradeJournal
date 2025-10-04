import { precacheAndRoute, cleanupOutdatedCaches } from 'workbox-precaching'
import { registerRoute } from 'workbox-routing'
import { NetworkFirst, StaleWhileRevalidate, CacheFirst } from 'workbox-strategies'
import { ExpirationPlugin } from 'workbox-expiration'
import { CacheableResponsePlugin } from 'workbox-cacheable-response'
import { BackgroundSyncPlugin } from 'workbox-background-sync'

// Precache all static assets
precacheAndRoute(self.__WB_MANIFEST)

// Clean up outdated caches
cleanupOutdatedCaches()

// Immediately claim clients when the SW becomes active
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Skip waiting for new service worker to activate
self.addEventListener('install', (event) => {
  self.skipWaiting()
})

// Cache Firebase Firestore API calls
registerRoute(
  ({ url }) => url.origin === 'https://firestore.googleapis.com',
  new NetworkFirst({
    cacheName: 'firebase-firestore',
    networkTimeoutSeconds: 10,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 60 * 60 * 24, // 24 hours
        purgeOnQuotaError: true
      })
    ]
  })
)

// Cache API authentication endpoints
registerRoute(
  ({ url }) => url.origin === 'https://securetoken.googleapis.com' ||
               url.origin === 'https://identitytoolkit.googleapis.com',
  new NetworkFirst({
    cacheName: 'firebase-auth',
    networkTimeoutSeconds: 5,
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      }),
      new ExpirationPlugin({
        maxEntries: 20,
        maxAgeSeconds: 60 * 60 * 2, // 2 hours
        purgeOnQuotaError: true
      })
    ]
  })
)

// Cache images with CacheFirst strategy
registerRoute(
  ({ request }) => request.destination === 'image',
  new CacheFirst({
    cacheName: 'images',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 60,
        maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
        purgeOnQuotaError: true
      })
    ]
  })
)

// Cache CSS and JS files with StaleWhileRevalidate
registerRoute(
  ({ request }) => request.destination === 'style' ||
                   request.destination === 'script',
  new StaleWhileRevalidate({
    cacheName: 'static-resources',
    plugins: [
      new CacheableResponsePlugin({
        statuses: [0, 200]
      })
    ]
  })
)

// Background sync for offline actions
const bgSyncPlugin = new BackgroundSyncPlugin('trade-sync-queue', {
  maxRetentionTime: 24 * 60, // 24 hours in minutes
  onSync: async ({ queue }) => {
    console.log('Background sync triggered for trade operations')
    let entry
    while ((entry = await queue.shiftRequest())) {
      try {
        await fetch(entry.request.clone())
        console.log('Queued request synced successfully')
      } catch (error) {
        console.error('Failed to sync queued request:', error)
        // Re-queue the request for retry
        await queue.unshiftRequest(entry)
        throw error
      }
    }
  }
})

// Register background sync for trade operations
registerRoute(
  ({ url, request }) =>
    url.pathname.includes('/api/trades') &&
    (request.method === 'POST' || request.method === 'PUT' || request.method === 'DELETE'),
  new NetworkFirst({
    cacheName: 'trade-operations',
    networkTimeoutSeconds: 5,
    plugins: [bgSyncPlugin]
  }),
  'POST'
)

// Handle offline page for navigation requests
const OFFLINE_PAGE = '/offline.html'

registerRoute(
  ({ request }) => request.mode === 'navigate',
  async ({ event }) => {
    try {
      const preloadResponse = await event.preloadResponse
      if (preloadResponse) return preloadResponse

      return await fetch(event.request)
    } catch (error) {
      console.log('Navigation failed, serving offline page')
      const cache = await caches.open('offline-pages')
      return await cache.match(OFFLINE_PAGE) || new Response('Offline')
    }
  }
)

// Message handling for client communication
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
    return
  }

  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: '1.0.0' })
    return
  }

  if (event.data && event.data.type === 'CACHE_TRADE') {
    // Cache trade data for offline access
    event.waitUntil(
      caches.open('offline-trades').then(cache => {
        return cache.put(`/trades/${event.data.tradeId}`,
          new Response(JSON.stringify(event.data.trade), {
            headers: { 'Content-Type': 'application/json' }
          })
        )
      })
    )
    return
  }
})

// Notification handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close()

  const urlToOpen = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then(clients => {
      // Check if there's already a window/tab open with the target URL
      for (const client of clients) {
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }

      // If not, open a new window/tab
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen)
      }
    })
  )
})

// Push notification handling
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New update available',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1,
      url: '/'
    },
    actions: [
      {
        action: 'explore',
        title: 'View Details',
        icon: '/icons/explore.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('MyTradeJournal', options)
  )
})

// Sync event for background updates
self.addEventListener('sync', (event) => {
  if (event.tag === 'trade-sync') {
    event.waitUntil(syncTrades())
  }
})

async function syncTrades() {
  try {
    // Get pending trades from IndexedDB or localStorage
    const cache = await caches.open('offline-trades')
    const requests = await cache.keys()

    for (const request of requests) {
      try {
        const response = await fetch(request.clone())
        if (response.ok) {
          // Remove from offline cache after successful sync
          await cache.delete(request)
        }
      } catch (error) {
        console.error('Failed to sync trade:', error)
      }
    }
  } catch (error) {
    console.error('Background sync failed:', error)
  }
}

// Error handling
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason)
  event.preventDefault()
})
