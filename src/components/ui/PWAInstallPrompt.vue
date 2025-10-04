<template>
  <Transition name="slide-up">
    <div v-if="showInstallPrompt" class="pwa-install-prompt">
      <div class="prompt-content">
        <div class="prompt-header">
          <div class="app-icon">📊</div>
          <div class="app-info">
            <h3>Install MyTradeJournal</h3>
            <p>Get the full app experience with offline access and faster loading</p>
          </div>
          <button class="close-btn" aria-label="Close" @click="dismissPrompt">×</button>
        </div>

        <div class="prompt-features">
          <div class="feature">
            <span class="feature-icon">⚡</span>
            <span>Faster loading</span>
          </div>
          <div class="feature">
            <span class="feature-icon">📱</span>
            <span>Works offline</span>
          </div>
          <div class="feature">
            <span class="feature-icon">🔔</span>
            <span>Push notifications</span>
          </div>
        </div>

        <div class="prompt-actions">
          <button class="btn-secondary" @click="dismissPrompt">
            Maybe Later
          </button>
          <button class="btn-primary" @click="installApp">
            <span class="btn-icon">⬇️</span>
            Install App
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue'

// Reactive state
const showInstallPrompt = ref(false)
const deferredPrompt = ref(null)

// Install prompt logic
const handleBeforeInstallPrompt = (e) => {
  // Prevent the mini-infobar from appearing on mobile
  e.preventDefault()

  // Stash the event so it can be triggered later
  deferredPrompt.value = e

  // Check if user has previously dismissed the prompt
  const dismissedTime = localStorage.getItem('pwa-prompt-dismissed')
  const currentTime = Date.now()
  const oneWeek = 7 * 24 * 60 * 60 * 1000 // 1 week in milliseconds

  // Show prompt if never dismissed or dismissed more than a week ago
  if (!dismissedTime || (currentTime - parseInt(dismissedTime)) > oneWeek) {
    // Delay showing the prompt to not interrupt the user immediately
    setTimeout(() => {
      showInstallPrompt.value = true
    }, 3000) // Show after 3 seconds
  }
}

const installApp = async() => {
  if (!deferredPrompt.value) return

  try {
    // Show the install prompt
    await deferredPrompt.value.prompt()

    // Wait for the user to respond to the prompt
    const choiceResult = await deferredPrompt.value.userChoice

    if (choiceResult.outcome === 'accepted') {
      console.log('User accepted the install prompt')
      // Track successful installation
      trackEvent('pwa_install', 'accepted')
    } else {
      console.log('User dismissed the install prompt')
      trackEvent('pwa_install', 'dismissed')
    }

    // Clear the deferredPrompt
    deferredPrompt.value = null
    showInstallPrompt.value = false
  } catch (error) {
    console.error('Error during app installation:', error)
  }
}

const dismissPrompt = () => {
  showInstallPrompt.value = false

  // Remember that user dismissed the prompt
  localStorage.setItem('pwa-prompt-dismissed', Date.now().toString())

  // Track dismissal
  trackEvent('pwa_install_prompt', 'dismissed')
}

// Check if app is already installed
const isAppInstalled = () => {
  // Check if running in standalone mode (installed PWA)
  if (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) {
    return true
  }

  // Check for iOS Safari standalone mode
  if (window.navigator.standalone === true) {
    return true
  }

  return false
}

// Simple event tracking (replace with your analytics)
const trackEvent = (eventName, action) => {
  console.log(`Track event: ${eventName} - ${action}`)
  // Replace with your analytics implementation
  // e.g., gtag('event', action, { event_category: eventName })
}

// Handle app installed event
const handleAppInstalled = () => {
  console.log('PWA was installed')
  showInstallPrompt.value = false
  trackEvent('pwa_installed', 'success')
}

// Lifecycle
onMounted(() => {
  // Don't show prompt if app is already installed
  if (isAppInstalled()) {
    return
  }

  // Listen for the beforeinstallprompt event
  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

  // Listen for app installed event
  window.addEventListener('appinstalled', handleAppInstalled)

  // For iOS Safari, show a custom prompt since beforeinstallprompt isn't supported
  if (isIOSSafari() && !isAppInstalled()) {
    setTimeout(() => {
      showIOSInstallPrompt()
    }, 5000)
  }
})

onUnmounted(() => {
  window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  window.removeEventListener('appinstalled', handleAppInstalled)
})

// iOS Safari detection and custom prompt
const isIOSSafari = () => {
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent)
  const isSafari = /Safari/.test(navigator.userAgent) && !/CriOS|FxiOS|OPiOS|EdgiOS/.test(navigator.userAgent)
  return isIOS && isSafari
}

const showIOSInstallPrompt = () => {
  const dismissed = localStorage.getItem('ios-install-dismissed')
  const currentTime = Date.now()
  const oneWeek = 7 * 24 * 60 * 60 * 1000

  if (!dismissed || (currentTime - parseInt(dismissed)) > oneWeek) {
    // Show iOS-specific install instructions
    showInstallPrompt.value = true
  }
}

// Expose methods for parent components
defineExpose({
  showPrompt: () => { showInstallPrompt.value = true },
  hidePrompt: () => { showInstallPrompt.value = false },
  isInstallable: () => !!deferredPrompt.value,
  isInstalled: isAppInstalled
})
</script>

<style scoped>
.pwa-install-prompt {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(10px);
  padding: 16px;
}

.prompt-content {
  background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  border-radius: 16px;
  padding: 20px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
  max-width: 400px;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.3);
}

.prompt-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.app-icon {
  font-size: 40px;
  width: 50px;
  height: 50px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(45deg, #10b981, #059669);
  border-radius: 12px;
  flex-shrink: 0;
}

.app-info {
  flex: 1;
}

.app-info h3 {
  margin: 0 0 4px 0;
  font-size: 1.2rem;
  font-weight: 600;
  color: #1f2937;
}

.app-info p {
  margin: 0;
  font-size: 0.9rem;
  color: #6b7280;
  line-height: 1.4;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #9ca3af;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: #f3f4f6;
  color: #374151;
}

.prompt-features {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.feature {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 0.85rem;
  color: #4b5563;
  background: #f9fafb;
  padding: 6px 10px;
  border-radius: 20px;
  border: 1px solid #e5e7eb;
}

.feature-icon {
  font-size: 0.9rem;
}

.prompt-actions {
  display: flex;
  gap: 12px;
}

.btn-secondary,
.btn-primary {
  flex: 1;
  padding: 12px 16px;
  border-radius: 8px;
  font-weight: 500;
  font-size: 0.9rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-primary {
  background: linear-gradient(45deg, #10b981, #059669);
  color: white;
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 6px 16px rgba(16, 185, 129, 0.4);
}

.btn-icon {
  font-size: 1rem;
}

/* Transitions */
.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.slide-up-enter-from {
  transform: translateY(100%);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(100%);
  opacity: 0;
}

/* Responsive design */
@media (max-width: 480px) {
  .pwa-install-prompt {
    padding: 12px;
  }

  .prompt-content {
    padding: 16px;
  }

  .prompt-features {
    justify-content: center;
  }

  .feature {
    font-size: 0.8rem;
    padding: 4px 8px;
  }

  .prompt-actions {
    flex-direction: column;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .prompt-content {
    background: linear-gradient(135deg, #1f2937 0%, #111827 100%);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .app-info h3 {
    color: #f9fafb;
  }

  .app-info p {
    color: #d1d5db;
  }

  .close-btn {
    color: #9ca3af;
  }

  .close-btn:hover {
    background: #374151;
    color: #e5e7eb;
  }

  .feature {
    background: #374151;
    color: #d1d5db;
    border: 1px solid #4b5563;
  }

  .btn-secondary {
    background: #374151;
    color: #e5e7eb;
  }

  .btn-secondary:hover {
    background: #4b5563;
  }
}
</style>
