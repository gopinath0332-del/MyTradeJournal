// Custom service worker for additional functionality
// This file will be overridden by the PWA plugin during build

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
})

// Add custom caching strategies here if needed
self.addEventListener('fetch', (event) => {
  // Custom fetch handling can be added here
  // The PWA plugin will handle most caching automatically
})