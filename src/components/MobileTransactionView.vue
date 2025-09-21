<template>
  <div class="mobile-transaction-view bg-dark text-light min-vh-100">
    <!-- Header -->
    <div class="header-section bg-dark sticky-top">
      <!-- Status Bar -->
      <div class="status-bar d-flex justify-content-between align-items-center px-3 py-2">
        <div class="time fw-semibold">{{ currentTime }}</div>
        <div class="status-icons d-flex align-items-center gap-2">
          <div class="signal-bars d-flex gap-1 align-items-end">
            <div class="bar bar-1"></div>
            <div class="bar bar-2"></div>
            <div class="bar bar-3"></div>
            <div class="bar bar-4"></div>
          </div>
          <div class="wifi-icon">📶</div>
          <div class="battery d-flex align-items-center">
            <span class="battery-percentage me-1 small">85</span>
            <div class="battery-icon"></div>
          </div>
        </div>
      </div>

      <!-- Main Header -->
      <div class="main-header d-flex justify-content-between align-items-center px-3 py-3">
        <i class="search-icon text-light fs-4">🔍</i>
        <h1 class="header-title mb-0 text-light fw-bold">Trans.</h1>
        <div class="header-actions d-flex gap-3">
          <i class="star-icon text-light fs-4">⭐</i>
          <i class="filter-icon text-light fs-4">⚙️</i>
        </div>
      </div>

      <!-- Date Navigation -->
      <div class="date-navigation d-flex justify-content-center align-items-center py-3">
        <button class="btn btn-link text-light p-0 me-3" @click="previousMonth">
          <i class="chevron-left">‹</i>
        </button>
        <h2 class="date-title mb-0 text-light fw-semibold">{{ currentMonth }}</h2>
        <button class="btn btn-link text-light p-0 ms-3" @click="nextMonth">
          <i class="chevron-right">›</i>
        </button>
      </div>

      <!-- Tab Navigation -->
      <div class="tab-navigation px-3">
        <div class="nav nav-tabs border-0">
          <button 
            v-for="tab in tabs" 
            :key="tab.id"
            class="nav-link border-0 bg-transparent text-light px-3 py-2"
            :class="{ active: activeTab === tab.id }"
            @click="setActiveTab(tab.id)"
          >
            {{ tab.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Statistics Section -->
    <div class="statistics-section px-3 py-4">
      <div class="row text-center">
        <div class="col-4">
          <div class="stat-item">
            <div class="stat-label text-muted small">Income</div>
            <div class="stat-value text-info fw-bold fs-5">{{ income }}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="stat-item">
            <div class="stat-label text-muted small">Exp.</div>
            <div class="stat-value text-danger fw-bold fs-5">{{ expense }}</div>
          </div>
        </div>
        <div class="col-4">
          <div class="stat-item">
            <div class="stat-label text-muted small">Total</div>
            <div class="stat-value text-light fw-bold fs-5">{{ total }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <div class="empty-state d-flex flex-column justify-content-center align-items-center flex-grow-1 px-4">
      <div class="empty-icon mb-4">
        <div class="folder-stack">
          <div class="folder-item folder-back"></div>
          <div class="folder-item folder-middle"></div>
          <div class="folder-item folder-front">
            <div class="person-icon">👤</div>
            <div class="speech-bubble">💬</div>
          </div>
        </div>
      </div>
      <p class="empty-text text-muted text-center mb-0">No data available.</p>
    </div>

    <!-- Floating Action Buttons -->
    <div class="floating-actions position-fixed">
      <div class="fab-container d-flex flex-column gap-3">
        <button class="fab btn btn-secondary rounded-circle">
          <i class="fab-icon">📋</i>
        </button>
        <button class="fab btn btn-secondary rounded-circle">
          <i class="fab-icon">📄</i>
        </button>
        <button class="fab btn btn-danger rounded-circle main-fab">
          <i class="fab-icon text-light">+</i>
        </button>
      </div>
    </div>

    <!-- Ad Banner -->
    <div class="ad-banner bg-danger mx-3 mb-3 rounded d-flex align-items-center p-3">
      <div class="ad-icon me-3">
        <div class="calculator-icon bg-light rounded p-2">
          <i class="text-danger">🧮</i>
        </div>
      </div>
      <div class="ad-content flex-grow-1">
        <div class="ad-title text-light fw-bold">CalcBox</div>
        <div class="ad-subtitle text-light small">All in One Calculator</div>
      </div>
      <button class="btn btn-light btn-sm rounded-pill px-3">
        Download &gt;
      </button>
    </div>

    <!-- Bottom Navigation -->
    <div class="bottom-navigation bg-dark border-top border-secondary">
      <div class="row g-0 text-center">
        <div class="col-3">
          <button class="btn btn-link text-light w-100 py-3 border-0" :class="{ active: bottomActiveTab === 'date' }" @click="bottomActiveTab = 'date'">
            <div class="bottom-nav-icon mb-1">📅</div>
            <div class="bottom-nav-label small">21/09</div>
          </button>
        </div>
        <div class="col-3">
          <button class="btn btn-link text-light w-100 py-3 border-0" :class="{ active: bottomActiveTab === 'stats' }" @click="bottomActiveTab = 'stats'">
            <div class="bottom-nav-icon mb-1">📊</div>
            <div class="bottom-nav-label small">Stats</div>
          </button>
        </div>
        <div class="col-3">
          <button class="btn btn-link text-light w-100 py-3 border-0" :class="{ active: bottomActiveTab === 'accounts' }" @click="bottomActiveTab = 'accounts'">
            <div class="bottom-nav-icon mb-1">💰</div>
            <div class="bottom-nav-label small">Accounts</div>
          </button>
        </div>
        <div class="col-3">
          <button class="btn btn-link text-light w-100 py-3 border-0" :class="{ active: bottomActiveTab === 'more' }" @click="bottomActiveTab = 'more'">
            <div class="bottom-nav-icon mb-1">⋯</div>
            <div class="bottom-nav-label small">More</div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

// Reactive data
const currentTime = ref('')
const currentDate = ref(new Date())
const activeTab = ref('daily')
const bottomActiveTab = ref('date')

// Data
const income = ref('0.00')
const expense = ref('0.00')
const tabs = [
  { id: 'daily', label: 'Daily' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'summary', label: 'Summary' },
  { id: 'description', label: 'Description' }
]

// Computed properties
const currentMonth = computed(() => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${months[currentDate.value.getMonth()]} ${currentDate.value.getFullYear()}`
})

const total = computed(() => {
  const inc = parseFloat(income.value) || 0
  const exp = parseFloat(expense.value) || 0
  return (inc - exp).toFixed(2)
})

// Methods
const updateTime = () => {
  const now = new Date()
  currentTime.value = now.toLocaleTimeString('en-US', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false 
  })
}

const setActiveTab = (tabId) => {
  activeTab.value = tabId
}

const previousMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() - 1)
  currentDate.value = newDate
}

const nextMonth = () => {
  const newDate = new Date(currentDate.value)
  newDate.setMonth(newDate.getMonth() + 1)
  currentDate.value = newDate
}

// Lifecycle
let timeInterval
onMounted(() => {
  updateTime()
  timeInterval = setInterval(updateTime, 1000)
})

onUnmounted(() => {
  if (timeInterval) {
    clearInterval(timeInterval)
  }
})
</script>

<style scoped>
.mobile-transaction-view {
  max-width: 430px;
  margin: 0 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  background-color: #1a1a1a !important;
}

/* Status Bar */
.status-bar {
  font-size: 14px;
  font-weight: 600;
}

.signal-bars {
  align-items: flex-end;
}

.bar {
  width: 3px;
  background: #fff;
  border-radius: 1px;
}

.bar-1 { height: 4px; }
.bar-2 { height: 6px; }
.bar-3 { height: 8px; }
.bar-4 { height: 10px; }

.battery-icon {
  width: 20px;
  height: 10px;
  border: 1px solid #fff;
  border-radius: 2px;
  position: relative;
  background: #4ade80;
}

.battery-icon::after {
  content: '';
  position: absolute;
  right: -3px;
  top: 3px;
  width: 2px;
  height: 4px;
  background: #fff;
  border-radius: 0 1px 1px 0;
}

/* Header */
.header-title {
  font-size: 1.5rem;
}

/* Tab Navigation */
.nav-link {
  position: relative;
  transition: all 0.3s ease;
}

.nav-link.active {
  color: #fff !important;
}

.nav-link.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 30px;
  height: 3px;
  background: #dc3545;
  border-radius: 2px;
}

/* Statistics */
.stat-item {
  padding: 0.5rem 0;
}

.stat-value {
  font-size: 1.25rem;
}

/* Empty State */
.empty-state {
  min-height: 40vh;
}

.folder-stack {
  position: relative;
  width: 100px;
  height: 80px;
}

.folder-item {
  position: absolute;
  background: #374151;
  border-radius: 8px;
}

.folder-back {
  width: 70px;
  height: 50px;
  top: 20px;
  left: 15px;
  background: #4b5563;
}

.folder-middle {
  width: 75px;
  height: 55px;
  top: 10px;
  left: 10px;
  background: #6b7280;
}

.folder-front {
  width: 80px;
  height: 60px;
  top: 0;
  left: 5px;
  background: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.person-icon {
  font-size: 20px;
  opacity: 0.8;
  margin-right: 5px;
}

.speech-bubble {
  font-size: 14px;
  opacity: 0.6;
}

/* Floating Action Buttons */
.floating-actions {
  bottom: 140px;
  right: 20px;
  z-index: 1000;
}

.fab {
  width: 50px;
  height: 50px;
  border: none;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}

.main-fab {
  width: 60px;
  height: 60px;
  background: #ff6b6b !important;
  border: none !important;
}

.fab-icon {
  font-size: 20px;
  font-weight: bold;
}

/* Ad Banner */
.ad-banner {
  background: #ff4757 !important;
}

.calculator-icon {
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Bottom Navigation */
.bottom-navigation {
  background: #1a1a1a !important;
  position: sticky;
  bottom: 0;
  z-index: 1000;
}

.bottom-navigation .btn {
  background: transparent !important;
  border: none !important;
  transition: all 0.3s ease;
}

.bottom-navigation .btn.active {
  color: #dc3545 !important;
}

.bottom-nav-icon {
  font-size: 20px;
}

.bottom-nav-label {
  font-size: 12px;
  opacity: 0.8;
}

/* Responsive adjustments */
@media (max-width: 430px) {
  .mobile-transaction-view {
    max-width: 100%;
  }
  
  .tab-navigation .nav-link {
    font-size: 14px;
    padding: 0.5rem 0.75rem !important;
  }
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 4px;
}

::-webkit-scrollbar-track {
  background: #1a1a1a;
}

::-webkit-scrollbar-thumb {
  background: #374151;
  border-radius: 2px;
}

::-webkit-scrollbar-thumb:hover {
  background: #4b5563;
}
</style>