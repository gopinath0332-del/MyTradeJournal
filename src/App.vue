<script setup>
import { ref, provide } from 'vue'
import TradeForm from './components/trade/TradeForm.vue'
import TradeHistory from './components/trade/TradeHistory.vue'
import DashboardStats from './components/dashboard/DashboardStats.vue'

const activeTab = ref('dashboard') // 'dashboard', 'trade', or 'history'
const editingTrade = ref(null)
const toasts = ref([])
const isMobileMenuOpen = ref(false)
let toastId = 0

// Provide the shared state to child components
provide('activeTab', activeTab)
provide('editingTrade', editingTrade)

// Function to start editing a trade
const startEditingTrade = (trade) => {
  editingTrade.value = trade
  activeTab.value = 'trade'
}

// Function to handle navigation and close mobile menu
const navigateTo = (tab) => {
  activeTab.value = tab
  isMobileMenuOpen.value = false
}

// Toggle mobile menu
const toggleMobileMenu = () => {
  isMobileMenuOpen.value = !isMobileMenuOpen.value
}

// Toast functions
const showToast = (type, title, message, duration = 3000) => {
  const id = toastId++
  toasts.value.push({ id, type, title, message })

  // Automatically remove the toast after duration
  setTimeout(() => {
    removeToast(id)
  }, duration)
}

const removeToast = (id) => {
  const index = toasts.value.findIndex(t => t.id === id)
  if (index !== -1) {
    toasts.value.splice(index, 1)
  }
}

// Provide functions to child components
provide('startEditingTrade', startEditingTrade)
provide('showToast', showToast)
</script>

<template>
  <div class="app-container">
    <header>
      <div class="header-content">
        <h1>📈 Trade Journal</h1>
        
        <!-- Mobile Menu Button -->
        <button class="mobile-menu-toggle" @click="toggleMobileMenu" aria-label="Toggle navigation menu">
          <span class="hamburger-line" :class="{ active: isMobileMenuOpen }"></span>
          <span class="hamburger-line" :class="{ active: isMobileMenuOpen }"></span>
          <span class="hamburger-line" :class="{ active: isMobileMenuOpen }"></span>
        </button>
      </div>
      
      <!-- Mobile Menu Overlay -->
      <div v-if="isMobileMenuOpen" class="mobile-menu-overlay" @click="isMobileMenuOpen = false"></div>
      
      <!-- Navigation Menu -->
      <nav class="nav-menu" :class="{ 'nav-menu--open': isMobileMenuOpen }">
        <ul class="nav-list">
          <li class="nav-item">
            <a href="#" class="nav-link" 
               :class="{ active: activeTab === 'dashboard' }" 
               @click.prevent="navigateTo('dashboard')">
              <span class="nav-icon">📊</span>
              <span class="nav-text">Dashboard</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link" 
               :class="{ active: activeTab === 'history' }" 
               @click.prevent="navigateTo('history')">
              <span class="nav-icon">📋</span>
              <span class="nav-text">Trade History</span>
            </a>
          </li>
          <li class="nav-item">
            <a href="#" class="nav-link" 
               :class="{ active: activeTab === 'trade' }" 
               @click.prevent="navigateTo('trade')">
              <span class="nav-icon">➕</span>
              <span class="nav-text">Log Trade</span>
            </a>
          </li>
        </ul>
      </nav>
    </header>

    <main>
      <DashboardStats v-if="activeTab === 'dashboard'" />
      <TradeHistory v-if="activeTab === 'history'" />
      <TradeForm v-if="activeTab === 'trade'" />
    </main>

    <!-- Toast Container -->
    <div class="toast-container">
      <div v-for="toast in toasts" :key="toast.id" class="toast" :class="toast.type">
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
}

header h1 {
  font-size: 1.75rem;
  margin: 0;
  color: #42b883;
}

@media (min-width: 768px) {
  header {
    margin-bottom: 30px;
    text-align: center;
  }
  
  .header-content {
    justify-content: center;
    margin-bottom: 1.5rem;
  }
  
  header h1 {
    font-size: 2.5rem;
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
</style>
