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
const isSidebarCollapsed = ref<boolean>(false)
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

// Toggle sidebar (desktop)
const toggleSidebar = (): void => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
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
      <!-- Mobile Header -->
      <div class="mobile-header">
        <button class="mobile-menu-toggle" aria-label="Toggle navigation menu" @click="toggleMobileMenu">
          <span class="hamburger-line" :class="{ active: isMobileMenuOpen }" />
          <span class="hamburger-line" :class="{ active: isMobileMenuOpen }" />
          <span class="hamburger-line" :class="{ active: isMobileMenuOpen }" />
        </button>
        <h1 class="mobile-title">
          📈 Trade Journal
        </h1>
        <div class="mobile-profile-selector">
          <ProfileSelector @open-manager="openProfileManager" />
        </div>
      </div>

      <!-- Mobile Menu Overlay -->
      <div v-if="isMobileMenuOpen" class="mobile-menu-overlay" @click="isMobileMenuOpen = false" />

      <!-- Left Sidebar Navigation -->
      <nav class="sidebar-nav" :class="{ 'sidebar-nav--open': isMobileMenuOpen, 'sidebar-nav--collapsed': isSidebarCollapsed }">
        <!-- Sidebar Header -->
        <div class="sidebar-header">
          <h1 v-if="!isSidebarCollapsed" class="sidebar-logo">
            📈 Trade Journal
          </h1>
          <!-- Desktop Toggle Button -->
          <button class="sidebar-toggle desktop-only" aria-label="Toggle sidebar" @click="toggleSidebar">
            <span class="toggle-icon">{{ isSidebarCollapsed ? '→' : '←' }}</span>
          </button>
        </div>

        <!-- Navigation Menu -->
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
          <li class="nav-item">
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
        </ul>

        <!-- Sidebar Footer -->
        <div class="sidebar-footer">
          <!-- Profile Selector (Desktop) -->
          <div class="desktop-profile-selector">
            <ProfileSelector @open-manager="openProfileManager" />
          </div>

          <!-- User Menu -->
          <div v-if="isAuthenticated" class="sidebar-user">
            <button class="sidebar-user-button" @click="toggleUserMenu">
              <img
                v-if="user?.photoURL"
                :src="user.photoURL"
                :alt="user.displayName || 'User'"
                class="user-avatar"
              >
              <span v-else class="user-avatar-placeholder">
                {{ user?.displayName?.charAt(0) || '?' }}
              </span>
              <div v-if="!isSidebarCollapsed" class="user-details">
                <span class="user-name">{{ user?.displayName }}</span>
                <span class="user-email-small">{{ user?.email }}</span>
              </div>
              <span v-if="!isSidebarCollapsed" class="dropdown-arrow">▼</span>
            </button>

            <!-- User Dropdown Menu -->
            <div v-if="showUserMenu" class="user-dropdown">
              <button class="dropdown-item" @click="handleSignOut">
                <span class="dropdown-icon">🚪</span>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      <!-- Main Content Area -->
      <div class="main-wrapper" :class="{ 'main-wrapper--expanded': isSidebarCollapsed }">
        <main>
          <RouterView />
        </main>
      </div>

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

/* App Container with Sidebar Layout */
.app-container {
  display: flex;
  min-height: 100vh;
  background: #f8f9fa;
}

@media (max-width: 767px) {
  .app-container {
    flex-direction: column;
  }
}

/* Mobile Header */
.mobile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.mobile-title {
  font-size: 1.25rem;
  margin: 0;
  color: #42b883;
  flex: 1;
  text-align: center;
}

.mobile-profile-selector {
  display: flex;
  align-items: center;
}

@media (min-width: 768px) {
  .mobile-header {
    display: none;
  }
}

/* Sidebar Navigation */
.sidebar-nav {
  width: 280px;
  background: linear-gradient(180deg, #ffffff 0%, #f8f9fa 100%);
  border-right: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
  position: fixed;
  left: 0;
  top: 0;
  height: 100vh;
  overflow-y: auto;
  overflow-x: hidden;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.05);
  z-index: 1000;
  transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Collapsed State */
.sidebar-nav--collapsed {
  width: 80px;
}

@media (max-width: 767px) {
  .sidebar-nav {
    position: fixed;
    transform: translateX(-100%);
    transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    width: 280px;
  }

  .sidebar-nav--open {
    transform: translateX(0);
  }

  /* Don't allow collapse on mobile */
  .sidebar-nav--collapsed {
    width: 280px;
  }
}

/* Sidebar Header */
.sidebar-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  background: linear-gradient(135deg, #42b883 0%, #369870 100%);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  position: relative;
  min-height: 64px;
}

.sidebar-nav--collapsed .sidebar-header {
  padding: 1rem;
  justify-content: center;
}

.sidebar-logo {
  font-size: 1.5rem;
  margin: 0;
  color: white;
  font-weight: 600;
  text-align: center;
  flex: 1;
  transition: all 0.3s ease;
  white-space: nowrap;
  overflow: hidden;
}

/* Sidebar Toggle Button */
.sidebar-toggle {
  background: rgba(255, 255, 255, 0.2);
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 8px;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: white;
  font-size: 1.125rem;
  flex-shrink: 0;
  line-height: 1;
}

.sidebar-toggle:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: scale(1.1);
}

.sidebar-nav--collapsed .sidebar-toggle {
  position: absolute;
  /* right: -18px; */
  top: 50%;
  transform: translateY(-50%);
  background: white;
  color: #42b883;
  border: 1px solid #e5e7eb;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.sidebar-nav--collapsed .sidebar-toggle:hover {
  background: #f9fafb;
  transform: translateY(-50%) scale(1.1);
}

.toggle-icon {
  display: block;
  transition: transform 0.3s ease;
}

@media (max-width: 767px) {
  .desktop-only {
    display: none !important;
  }
}

/* Sidebar User Section */
.sidebar-footer {
  margin-top: auto;
  padding: 1rem;
  border-top: 1px solid #e5e7eb;
  background: #f9fafb;
  transition: padding 0.3s ease;
}

.sidebar-nav--collapsed .sidebar-footer {
  padding: 0.75rem 0.25rem;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.desktop-profile-selector {
  margin-bottom: 1rem;
  transition: opacity 0.2s ease;
}

.sidebar-nav--collapsed .desktop-profile-selector {
  opacity: 0;
  height: 0;
  overflow: hidden;
  margin-bottom: 0;
}

@media (max-width: 767px) {
  .desktop-profile-selector {
    display: none;
  }
}

.sidebar-user {
  position: relative;
}

.sidebar-user-button {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 0.75rem;
  cursor: pointer;
  transition: all 0.2s;
  min-height: 56px;
}

.sidebar-nav--collapsed .sidebar-user-button {
  justify-content: center;
  padding: 0.5rem;
  min-height: 56px;
}

.sidebar-user-button:hover {
  background: #f9fafb;
  border-color: #42b883;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.15);
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
}

.user-avatar-placeholder {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 1.125rem;
  flex-shrink: 0;
}

.user-details {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  flex: 1;
  min-width: 0;
}

.user-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.875rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.user-email-small {
  font-size: 0.75rem;
  color: #6b7280;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  width: 100%;
}

.dropdown-arrow {
  font-size: 0.75rem;
  color: #6b7280;
  transition: transform 0.2s;
  flex-shrink: 0;
}

.sidebar-user-button:hover .dropdown-arrow {
  transform: rotate(180deg);
}

.user-dropdown {
  position: absolute;
  bottom: calc(100% + 0.5rem);
  left: 0;
  right: 0;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  overflow: hidden;
  z-index: 1001;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.875rem 1rem;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 0.875rem;
  color: #374151;
  font-weight: 500;
}

.dropdown-item:hover {
  background: linear-gradient(135deg, #e8f5f1 0%, #f1f9f6 100%);
  color: #42b883;
}

.dropdown-icon {
  font-size: 1.125rem;
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

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* Navigation List */
.nav-list {
  list-style: none;
  padding: 1rem 0.5rem;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden;
}

.sidebar-nav--collapsed .nav-list {
  padding: 1rem 0.5rem;
  gap: 0.75rem;
  align-items: center;
}

.nav-item {
  position: relative;
}

/* Navigation Links */
.nav-link {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.875rem 1rem;
  text-decoration: none;
  color: #64748b;
  font-weight: 500;
  border-radius: 12px;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
  overflow: hidden;
  margin: 0 0.25rem;
  white-space: nowrap;
  min-height: 48px;
}

.sidebar-nav--collapsed .nav-link {
  justify-content: center;
  padding: 0.75rem;
  margin: 0;
  min-height: 48px;
  width: 56px;
  flex-shrink: 0;
}

/* Ripple effect on hover */
.nav-link::before {
  content: '';
  position: absolute;
  top: 50%;
  left: 50%;
  width: 0;
  height: 0;
  border-radius: 50%;
  background: rgba(66, 184, 131, 0.1);
  transform: translate(-50%, -50%);
  transition: width 0.6s, height 0.6s;
}

.nav-link:hover::before {
  width: 300px;
  height: 300px;
}

.nav-link:hover {
  background: linear-gradient(135deg, #e8f5f1 0%, #f1f9f6 100%);
  color: #42b883;
  transform: translateX(4px);
  padding-left: 1.25rem;
}

.sidebar-nav--collapsed .nav-link:hover {
  transform: scale(1.05);
  padding-left: 0.75rem;
}

.nav-link.active {
  background: linear-gradient(135deg, #42b883 0%, #369870 100%);
  color: white;
  box-shadow: 0 2px 8px rgba(66, 184, 131, 0.3);
}

.nav-link.active::after {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 4px;
  height: 70%;
  background: rgba(255, 255, 255, 0.8);
  border-radius: 0 4px 4px 0;
  animation: slideIn 0.3s ease;
}

.sidebar-nav--collapsed .nav-link.active::after {
  width: 3px;
  height: 80%;
}

@keyframes slideIn {
  from {
    height: 0;
    opacity: 0;
  }
  to {
    height: 70%;
    opacity: 1;
  }
}

.nav-link.active:hover {
  background: linear-gradient(135deg, #369870 0%, #2d8360 100%);
  transform: translateX(4px);
}

.nav-icon {
  font-size: 1.375rem;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  transition: transform 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55);
  position: relative;
  z-index: 1;
  flex-shrink: 0;
}

.sidebar-nav--collapsed .nav-icon {
  width: 32px;
  height: 32px;
  font-size: 1.5rem;
}

.nav-link:hover .nav-icon {
  transform: scale(1.15) rotate(5deg);
}

.sidebar-nav--collapsed .nav-link:hover .nav-icon {
  transform: scale(1.1);
}

.nav-link.active .nav-icon {
  animation: bounce 0.6s ease;
}

@keyframes bounce {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.2);
  }
}

.nav-text {
  font-size: 0.9375rem;
  position: relative;
  z-index: 1;
  letter-spacing: 0.3px;
  transition: opacity 0.2s ease;
}

.sidebar-nav--collapsed .nav-text {
  opacity: 0;
  width: 0;
  overflow: hidden;
}

/* Main Content Area */
.main-wrapper {
  flex: 1;
  margin-left: 280px;
  min-height: 100vh;
  background: #f8f9fa;
  transition: margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1);
}

.main-wrapper--expanded {
  margin-left: 80px;
}

@media (max-width: 767px) {
  .main-wrapper {
    margin-left: 0;
  }

  .main-wrapper--expanded {
    margin-left: 0;
  }
}

main {
  padding: 1.5rem;
  min-height: calc(100vh - 3rem);
}

@media (min-width: 768px) {
  main {
    padding: 2rem;
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
