<template>
  <Transition name="fade">
    <div v-if="showUpdatePrompt" class="sw-update-prompt">
      <div class="update-content">
        <div class="update-icon">🔄</div>
        <div class="update-info">
          <h4>Update Available</h4>
          <p>A new version of MyTradeJournal is ready. Refresh to get the latest features and improvements.</p>
        </div>
        <div class="update-actions">
          <button class="btn-dismiss" @click="dismissUpdate">
            Later
          </button>
          <button class="btn-update" @click="applyUpdate">
            Update Now
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Reactive state
const showUpdatePrompt = ref(false)
const swRegistration = ref(null)
const waitingWorker = ref(null)

// Update detection and handling
const checkForUpdates = async() => {
  if ('serviceWorker' in navigator) {
    try {
      const registration = await navigator.serviceWorker.ready
      swRegistration.value = registration

      // Check for waiting service worker
      if (registration.waiting) {
        waitingWorker.value = registration.waiting
        showUpdatePrompt.value = true
      }

      // Listen for new service worker updates
      registration.addEventListener('updatefound', handleUpdateFound)

      // Listen for controlling service worker changes
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange)

      // Manual check for updates
      await registration.update()
    } catch (error) {
      // Silent fail for service worker issues
    }
  }
}

const handleUpdateFound = () => {
  if (!swRegistration.value) return

  const newWorker = swRegistration.value.installing
  if (!newWorker) return

  newWorker.addEventListener('statechange', () => {
    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
      // New service worker is installed and ready
      waitingWorker.value = newWorker
      showUpdatePrompt.value = true
    }
  })
}

const handleControllerChange = () => {
  // Service worker has been updated and is now controlling the page
  if (showUpdatePrompt.value) {
    window.location.reload()
  }
}

const applyUpdate = () => {
  if (!waitingWorker.value) return

  // Send message to waiting service worker to skip waiting
  waitingWorker.value.postMessage({ type: 'SKIP_WAITING' })

  showUpdatePrompt.value = false

  // Show loading indicator or message
  showUpdateProgress()
}

const dismissUpdate = () => {
  showUpdatePrompt.value = false

  // Remember dismissal for this session
  sessionStorage.setItem('sw-update-dismissed', Date.now().toString())
}

const showUpdateProgress = () => {
  // Create a temporary progress indicator
  const progressDiv = document.createElement('div')
  progressDiv.innerHTML = `
    <div style="
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: rgba(0, 0, 0, 0.8);
      color: white;
      padding: 20px;
      border-radius: 8px;
      z-index: 10000;
      text-align: center;
    ">
      <div style="margin-bottom: 10px;">🔄</div>
      <div>Updating application...</div>
    </div>
  `
  document.body.appendChild(progressDiv)

  // Remove after 2 seconds (page should reload before this)
  setTimeout(() => {
    if (document.body.contains(progressDiv)) {
      document.body.removeChild(progressDiv)
    }
  }, 2000)
}

// Handle service worker registration messages
const handleSWMessage = (event) => {
  if (event.data && event.data.type === 'SW_UPDATED') {
    showUpdatePrompt.value = true
  }
}

// Auto-check for updates periodically
const autoCheckUpdates = () => {
  // Check for updates every 30 minutes
  setInterval(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration) {
          registration.update()
        }
      })
    }
  }, 30 * 60 * 1000) // 30 minutes
}

// Lifecycle
onMounted(() => {
  checkForUpdates()
  autoCheckUpdates()

  // Listen for service worker messages
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.addEventListener('message', handleSWMessage)
  }

  // Listen for app visibility changes to check for updates
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) {
      // Check for updates when user returns to the app
      setTimeout(checkForUpdates, 1000)
    }
  })
})

onUnmounted(() => {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.removeEventListener('message', handleSWMessage)
    navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange)
  }

  if (swRegistration.value) {
    swRegistration.value.removeEventListener('updatefound', handleUpdateFound)
  }
})

// Expose methods for parent components
defineExpose({
  checkForUpdates,
  forceUpdate: applyUpdate,
  hasUpdate: () => !!waitingWorker.value
})
</script>

<style scoped>
.sw-update-prompt {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 1000;
  max-width: 400px;
}

.update-content {
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  color: white;
  padding: 16px;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(59, 130, 246, 0.3);
  border: 1px solid rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.update-icon {
  font-size: 24px;
  text-align: center;
  margin-bottom: 12px;
  animation: spin 2s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.update-info h4 {
  margin: 0 0 8px 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.update-info p {
  margin: 0 0 16px 0;
  font-size: 0.9rem;
  line-height: 1.4;
  opacity: 0.9;
}

.update-actions {
  display: flex;
  gap: 10px;
}

.btn-dismiss,
.btn-update {
  flex: 1;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  font-size: 0.85rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-dismiss {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.btn-dismiss:hover {
  background: rgba(255, 255, 255, 0.3);
}

.btn-update {
  background: white;
  color: #1d4ed8;
  font-weight: 600;
}

.btn-update:hover {
  background: #f1f5f9;
  transform: translateY(-1px);
}

/* Transitions */
.fade-enter-active,
.fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter-from {
  opacity: 0;
  transform: translateX(100%);
}

.fade-leave-to {
  opacity: 0;
  transform: translateX(100%);
}

/* Responsive design */
@media (max-width: 480px) {
  .sw-update-prompt {
    top: 10px;
    right: 10px;
    left: 10px;
    max-width: none;
  }

  .update-content {
    padding: 12px;
  }

  .update-actions {
    flex-direction: column;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .update-content {
    background: linear-gradient(135deg, #1e40af 0%, #1e3a8a 100%);
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .update-content {
    border: 2px solid white;
  }

  .btn-dismiss {
    border: 1px solid white;
  }

  .btn-update {
    border: 1px solid #1d4ed8;
  }
}

/* Reduced motion */
@media (prefers-reduced-motion: reduce) {
  .update-icon {
    animation: none;
  }

  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }

  .fade-enter-from,
  .fade-leave-to {
    transform: none;
  }
}
</style>
