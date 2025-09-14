<script setup>
import { ref, provide } from 'vue'
import TradeForm from './components/trade/TradeForm.vue'
import TradeHistory from './components/trade/TradeHistory.vue'
import DashboardStats from './components/dashboard/DashboardStats.vue'

const activeTab = ref('dashboard') // 'dashboard', 'trade', or 'history'
const editingTrade = ref(null)
const toasts = ref([])
let toastId = 0

// Provide the shared state to child components
provide('activeTab', activeTab)
provide('editingTrade', editingTrade)

// Function to start editing a trade
const startEditingTrade = (trade) => {
  editingTrade.value = trade
  activeTab.value = 'trade'
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
      <h1>Trade Journal</h1>
      <nav>
        <button :class="{ active: activeTab === 'dashboard' }" @click="activeTab = 'dashboard'">
          Dashboard
        </button>
        <button :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
          Trade History
        </button>
        <button :class="{ active: activeTab === 'trade' }" @click="activeTab = 'trade'">
          Log Trade
        </button>
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
  right: 20px;
  z-index: 1000;
}

.toast {
  min-width: 300px;
  margin-bottom: 10px;
  padding: 15px 20px;
  border-radius: 4px;
  background: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  animation: slideIn 0.3s ease-in-out;
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
  padding: 20px;
}

header {
  margin-bottom: 30px;
  text-align: center;
}

nav {
  margin-top: 20px;
}

nav button {
  padding: 10px 20px;
  margin: 0 10px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: #ffffff;
  cursor: pointer;
  font-size: 16px;
  background: #f0f0f0;
}

nav button.active {
  background: #42b883;
  color: white;
}

main {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
</style>
