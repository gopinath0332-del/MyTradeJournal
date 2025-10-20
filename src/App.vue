<script setup lang="ts">
import { ref, provide, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import AuthGuard from './components/auth/AuthGuard.vue'
import { useAuth } from './composables/useAuth'
import ProfileSelector from './components/ProfileSelector.vue'
import type { Trade as TradeType } from '@/types'

interface Toast {
  id: number
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message: string
}

const router = useRouter()
const { user, isAuthenticated, signOut } = useAuth()
const editingTrade = ref<TradeType | null>(null)
const toasts = ref<Toast[]>([])
const isMobileMenuOpen = ref<boolean>(false)
const showUserMenu = ref<boolean>(false)
let toastId = 0

// Provide the shared state to child components
provide('editingTrade', editingTrade)

// Function to start editing a trade
const startEditingTrade = (trade: TradeType): void => {
  editingTrade.value = trade
  router.push({ name: 'EditTrade', params: { id: trade.id || '' } })
}

// Function to handle navigation and close mobile menu
const navigateTo = (routeName: string): void => {
  router.push({ name: routeName })
  isMobileMenuOpen.value = false
}

// Toggle mobile menu
const toggleMobileMenu = (): void => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Toggle user menu
const toggleUserMenu = (): void => {
  showUserMenu.value = !showUserMenu.value
}

// Handle sign out
const handleSignOut = async(): Promise<void> => {
  try {
    showUserMenu.value = false
    isMobileMenuOpen.value = false
    await signOut()
    showToast('success', 'Signed Out', 'You have been successfully signed out.')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to sign out'
    showToast('error', 'Sign Out Failed', message)
  }
}

// Handle profile manager opening
const openProfileManager = (): void => {
  router.push({ name: 'Profiles' })
  isMobileMenuOpen.value = false
}

// Listen for profile changes and reload data
const handleProfileChange = (): void => {
  // Components will automatically react to profile change via the composable
  // Force reload current route to refresh data
  const currentRoute = router.currentRoute.value
  router.push('/temp-redirect').then(() => {
    router.push(currentRoute.fullPath)
  })
}

// Close user menu when clicking outside
const handleClickOutside = (event: MouseEvent): void => {
  const target = event.target as HTMLElement
  if (!target.closest('.user-menu-wrapper')) {
    showUserMenu.value = false
  }
}

// Add event listeners
onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('profile-changed', handleProfileChange)
    document.addEventListener('click', handleClickOutside)
  }
})

onUnmounted(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('profile-changed', handleProfileChange)
    document.removeEventListener('click', handleClickOutside)
  }
})

// Toast functions
const showToast = (
  type: Toast['type'],
  title: string,
  message: string,
  duration = 3000
): void => {
  const id = toastId++
  toasts.value.push({ id, type, title, message })

  // Automatically remove the toast after duration
  setTimeout(() => {
    removeToast(id)
  }, duration)
}

const removeToast = (id: number): void => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

// Function to refresh dashboard data (may not be needed with router)
const refreshDashboard = (): void => {
  // With router, we could navigate to dashboard to refresh
  if (router.currentRoute.value.name === 'Dashboard') {
    window.location.reload()
  }
}

// Provide functions to child components
provide('startEditingTrade', startEditingTrade)
provide('showToast', showToast)
provide('refreshDashboard', refreshDashboard)
provide('navigateTo', navigateTo)
</script>

<template>
  <AuthGuard>
    <div class="app-container">
      <header>
        <div class="header-content">
          <h1>📈 Trade Journal</h1>

          <!-- User Menu (Desktop) -->
          <div v-if="isAuthenticated" class="user-menu-wrapper">
            <button class="user-menu-button" @click="toggleUserMenu">
              <img
                v-if="user?.photoURL"
                :src="user.photoURL"
                :alt="user.displayName || 'User'"
                class="user-avatar"
              >
              <span v-else class="user-avatar-placeholder">
                {{ user?.displayName?.charAt(0) || '?' }}
              </span>
              <span class="user-name">{{ user?.displayName }}</span>
              <span class="dropdown-arrow">▼</span>
            </button>

            <!-- User Dropdown Menu -->
            <div v-if="showUserMenu" class="user-dropdown">
              <div class="user-info">
                <div class="user-email">{{ user?.email }}</div>
              </div>
              <div class="dropdown-divider" />
              <button class="dropdown-item" @click="handleSignOut">
                <span class="dropdown-icon">🚪</span>
                Sign Out
              </button>
            </div>
          </div>

          <!-- Profile Selector -->
          <div class="profile-selector-wrapper">
            <ProfileSelector @open-manager="openProfileManager" />
          </div>

          <!-- Mobile Menu Button -->
          <button class="mobile-menu-toggle" aria-label="Toggle navigation menu" @click="toggleMobileMenu">
            <span class="hamburger-line" :class="{ active: isMobileMenuOpen }" />
            <span class="hamburger-line" :class="{ active: isMobileMenuOpen }" />
            <span class="hamburger-line" :class="{ active: isMobileMenuOpen }" />
          </button>
        </div>

        <!-- Mobile Menu Overlay -->
        <div v-if="isMobileMenuOpen" class="mobile-menu-overlay" @click="isMobileMenuOpen = false" />

        <!-- Navigation Menu -->
        <nav class="nav-menu" :class="{ 'nav-menu--open': isMobileMenuOpen }">
          <ul class="nav-list">
            <li class="nav-item">
              <RouterLink
                to="/dashboard"
                class="nav-link"
                active-class="active"
                @click="isMobileMenuOpen = false"
              >
                <span class="nav-icon">📊</span>
                <span class="nav-text">Dashboard</span>
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink
                to="/history"
                class="nav-link"
                active-class="active"
                @click="isMobileMenuOpen = false"
              >
                <span class="nav-icon">📋</span>
                <span class="nav-text">Trade History</span>
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink
                to="/statistics"
                class="nav-link"
                active-class="active"
                @click="isMobileMenuOpen = false"
              >
                <span class="nav-icon">📈</span>
                <span class="nav-text">Statistics</span>
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink
                to="/calendar"
                class="nav-link"
                active-class="active"
                @click="isMobileMenuOpen = false"
              >
                <span class="nav-icon">📅</span>
                <span class="nav-text">Calendar</span>
              </RouterLink>
            </li>
            <li class="nav-item desktop-only">
              <RouterLink
                to="/heatmap"
                class="nav-link"
                active-class="active"
                @click="isMobileMenuOpen = false"
              >
                <span class="nav-icon">🔥</span>
                <span class="nav-text">Heatmap</span>
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink
                to="/lessons"
                class="nav-link"
                active-class="active"
                @click="isMobileMenuOpen = false"
              >
                <span class="nav-icon">📚</span>
                <span class="nav-text">Lessons</span>
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink
                to="/profiles"
                class="nav-link"
                active-class="active"
                @click="isMobileMenuOpen = false"
              >
                <span class="nav-icon">👤</span>
                <span class="nav-text">Profiles</span>
              </RouterLink>
            </li>
            <li class="nav-item">
              <RouterLink
                to="/trade"
                class="nav-link"
                active-class="active"
                @click="isMobileMenuOpen = false"
              >
                <span class="nav-icon">➕</span>
                <span class="nav-text">Log Trade</span>
              </RouterLink>
            </li>
            <li class="nav-item mobile-only">
              <button
                class="nav-link nav-button"
                @click="handleSignOut"
              >
                <span class="nav-icon">🚪</span>
                <span class="nav-text">Sign Out</span>
              </button>
            </li>
          </ul>
        </nav>
      </header>

      <main>
        <RouterView />
      </main>

      <!-- Toast Container -->
      <div class="toast-container">
        <div
          v-for="toast in toasts"
          :key="toast.id"
          class="toast"
          :class="toast.type"
        >
          <div class="toast-header">
            <strong>{{ toast.title }}</strong>
            <button class="close-button" @click="removeToast(toast.id)">&times;</button>
          </div>
          <div class="toast-body">
            {{ toast.message }}
          </div>
        </div>
      </div>
    </div>
  </AuthGuard>
</template>

<style>
/* Toast Styles */
.toast-container {
  position: fixed;
  top: 20px;
  left: 20px;
  right: 20px;
  z-index: 1000;
}

@media (min-width: 768px) {
  .toast-container {
    left: auto;
    width: auto;
    max-width: 400px;
  }
}

.toast {
  min-width: auto;
  margin-bottom: 10px;
  padding: 15px 20px;
  border-radius: 4px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-in-out;
}

@media (min-width: 768px) {
  .toast {
    min-width: 300px;
  }
}

.toast-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.toast.success {
  background-color: #42b883;
  color: white;
}

.toast.error {
  background-color: #ef4444;
  color: white;
}

.toast.info {
  background-color: #3b82f6;
  color: white;
}

.close-button {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 18px;
  padding: 0 5px;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }

  to {
    transform: translateX(0);
    opacity: 1;
  }
}

.app-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

@media (min-width: 768px) {
  .app-container {
    padding: 20px;
  }
}

header {
  margin-bottom: 1.5rem;
}

.header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  gap: 1rem;
  flex-wrap: wrap;
}

.profile-selector-wrapper {
  display: none;
  order: 3;
}

/* User Menu Styles */
.user-menu-wrapper {
  position: relative;
  display: none;
  order: 2;
}

.user-menu-button {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.5rem 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
}

.user-menu-button:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  object-fit: cover;
}

.user-avatar-placeholder {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1rem;
}

.user-name {
  max-width: 150px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: #1f2937;
  font-weight: 500;
}

.dropdown-arrow {
  font-size: 0.75rem;
  color: #6b7280;
  transition: transform 0.2s;
}

.user-menu-button:hover .dropdown-arrow {
  transform: translateY(2px);
}

.user-dropdown {
  position: absolute;
  top: calc(100% + 0.5rem);
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  min-width: 220px;
  z-index: 1000;
  overflow: hidden;
}

.user-info {
  padding: 0.75rem 1rem;
  background: #f9fafb;
}

.user-email {
  font-size: 0.875rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.dropdown-divider {
  height: 1px;
  background: #e5e7eb;
  margin: 0;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: background 0.2s;
  font-size: 0.875rem;
  color: #374151;
}

.dropdown-item:hover {
  background: #f3f4f6;
}

.dropdown-icon {
  font-size: 1rem;
}

header h1 {
  font-size: 1.75rem;
  margin: 0;
  color: #42b883;
  flex: 0 0 auto;
  order: 1;
}

@media (min-width: 768px) {
  header {
    margin-bottom: 30px;
  }

  .header-content {
    justify-content: space-between;
    flex-wrap: nowrap;
    margin-bottom: 1.5rem;
  }

  .user-menu-wrapper {
    display: block;
    order: 1;
  }

  .profile-selector-wrapper {
    display: block;
    order: 3;
    flex: 0 0 auto;
  }

  header h1 {
    font-size: 2.5rem;
    flex: 1 1 auto;
    text-align: left;
    order: 2;
  }
}

/* Mobile Menu Toggle */
.mobile-menu-toggle {
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  width: 30px;
  height: 24px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0;
}

@media (min-width: 768px) {
  .mobile-menu-toggle {
    display: none;
  }
}

.hamburger-line {
  width: 100%;
  height: 3px;
  background-color: #42b883;
  border-radius: 2px;
  transition: all 0.3s ease;
  transform-origin: center;
}

.hamburger-line.active:nth-child(1) {
  transform: rotate(45deg) translate(6px, 6px);
}

.hamburger-line.active:nth-child(2) {
  opacity: 0;
}

.hamburger-line.active:nth-child(3) {
  transform: rotate(-45deg) translate(6px, -6px);
}

/* Mobile Menu Overlay */
@media (max-width: 767px) {
  .mobile-menu-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    animation: fadeIn 0.3s ease;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Navigation Menu */
.nav-menu {
  position: relative;
}

@media (max-width: 767px) {
  .nav-menu {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transform: translateY(-100%);
    opacity: 0;
    visibility: hidden;
    transition: all 0.3s ease;
    z-index: 1000;
    padding: 1rem 0;
  }

  .nav-menu--open {
    transform: translateY(0);
    opacity: 1;
    visibility: visible;
  }
}

.nav-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

@media (max-width: 767px) {
  .nav-list {
    padding: 1rem;
  }
}

@media (min-width: 768px) {
  .nav-list {
    flex-direction: row;
    justify-content: center;
    gap: 1rem;
  }
}

.nav-item {
  position: relative;
}

.nav-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  border-radius: 8px;
  transition: all 0.3s ease;
  cursor: pointer;
}

@media (min-width: 768px) {
  .nav-link {
    padding: 0.75rem 1.5rem;
    border-radius: 25px;
    border: 2px solid transparent;
  }
}

.nav-link:hover {
  background-color: #f1f5f9;
  color: #42b883;
}

.nav-link.active {
  background-color: #42b883;
  color: white;
}

.nav-link.active:hover {
  background-color: #369870;
}

.nav-icon {
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
}

.nav-text {
  font-size: 1rem;
}

main {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;
}

@media (min-width: 768px) {
  main {
    margin-top: 0;
  }
}

/* Hide heatmap menu on mobile devices */
@media (max-width: 767px) {
  .nav-item.desktop-only {
    display: none;
  }
}

/* Show mobile-only items only on mobile */
.nav-item.mobile-only {
  display: block;
}

@media (min-width: 768px) {
  .nav-item.mobile-only {
    display: none;
  }
}

/* Style for nav buttons (like sign out) */
.nav-button {
  width: 100%;
  background: none;
  border: none;
  cursor: pointer;
  font-family: inherit;
  font-size: inherit;
}
</style>
