<template>
  <div class="daily-transactions">
    <!-- Header Section -->
    <header class="transactions-header">
      <div class="header-top">
        <button class="search-btn" aria-label="Search">
          <span class="search-icon">🔍</span>
        </button>
        <h1 class="app-title">Trans.</h1>
        <div class="header-actions">
          <button class="filter-btn" aria-label="Filter">
            <span class="filter-icon">⭐</span>
          </button>
          <button class="settings-btn" aria-label="Settings">
            <span class="settings-icon">☰</span>
          </button>
        </div>
      </div>

      <!-- Month Navigation -->
      <div class="month-navigation">
        <button class="nav-btn prev" @click="previousMonth" aria-label="Previous month">
          <span>‹</span>
        </button>
        <h2 class="current-month">{{ formatMonth(currentDate) }}</h2>
        <button class="nav-btn next" @click="nextMonth" aria-label="Next month">
          <span>›</span>
        </button>
      </div>

      <!-- Tab Navigation -->
      <nav class="tab-navigation">
        <button 
          v-for="tab in tabs" 
          :key="tab.id"
          class="tab-btn"
          :class="{ active: activeTab === tab.id }"
          @click="setActiveTab(tab.id)"
        >
          {{ tab.label }}
        </button>
      </nav>

      <!-- Summary Section -->
      <div class="summary-section">
        <div class="summary-item income">
          <span class="summary-label">Income</span>
          <span class="summary-value">{{ formatCurrency(totalIncome) }}</span>
        </div>
        <div class="summary-item expense">
          <span class="summary-label">Exp.</span>
          <span class="summary-value">{{ formatCurrency(totalExpense) }}</span>
        </div>
        <div class="summary-item total">
          <span class="summary-label">Total</span>
          <span class="summary-value" :class="{ negative: netTotal < 0 }">
            {{ formatCurrency(netTotal) }}
          </span>
        </div>
      </div>
    </header>

    <!-- Transactions List -->
    <main class="transactions-content">
      <div class="transactions-list">
        <div 
          v-for="group in groupedTransactions" 
          :key="group.date"
          class="transaction-group"
        >
          <!-- Date Header -->
          <div class="date-header">
            <div class="date-info">
              <span class="date-number">{{ getDayNumber(group.date) }}</span>
              <span class="day-name">{{ getDayName(group.date) }}</span>
            </div>
            <div class="daily-summary">
              <span class="daily-income">₹ {{ formatAmount(group.totalIncome) }}</span>
              <span class="daily-expense">₹ {{ formatAmount(group.totalExpense) }}</span>
            </div>
          </div>

          <!-- Transaction Items -->
          <div class="transaction-items">
            <div 
              v-for="transaction in group.transactions" 
              :key="transaction.id"
              class="transaction-item"
            >
              <div class="transaction-main">
                <div class="transaction-info">
                  <span class="category">{{ transaction.category }}</span>
                  <span class="merchant">{{ transaction.merchant }}</span>
                </div>
                <div class="payment-method">{{ transaction.paymentMethod }}</div>
                <div class="transaction-amount" :class="transaction.type">
                  ₹ {{ formatAmount(transaction.amount) }}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- Bottom Navigation -->
    <footer class="bottom-navigation">
      <div class="nav-items">
        <button class="nav-item active">
          <span class="nav-icon">📊</span>
          <span class="nav-label">19/09</span>
        </button>
        <button class="nav-item">
          <span class="nav-icon">📈</span>
          <span class="nav-label">Stats</span>
        </button>
        <button class="nav-item">
          <span class="nav-icon">💳</span>
          <span class="nav-label">Accounts</span>
        </button>
        <button class="nav-item">
          <span class="nav-icon">⋯</span>
          <span class="nav-label">More</span>
        </button>
      </div>

      <!-- Floating Action Buttons -->
      <div class="floating-actions">
        <button class="fab secondary" aria-label="Quick action 1">
          <span class="fab-icon">📋</span>
        </button>
        <button class="fab secondary" aria-label="Quick action 2">
          <span class="fab-icon">📁</span>
        </button>
        <button class="fab primary" aria-label="Add transaction">
          <span class="fab-icon">+</span>
        </button>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'

// Reactive state
const currentDate = ref(new Date(2025, 6)) // July 2025 as shown in screenshot
const activeTab = ref('daily')

// Tab configuration
const tabs = [
  { id: 'daily', label: 'Daily' },
  { id: 'calendar', label: 'Calendar' },
  { id: 'monthly', label: 'Monthly' },
  { id: 'summary', label: 'Summary' },
  { id: 'description', label: 'Description' }
]

// Mock transaction data based on the screenshot
const transactions = ref([
  // July 28 (Monday)
  {
    id: 1,
    date: '2025-07-28',
    category: 'Food',
    merchant: 'Zomato',
    paymentMethod: 'UPI',
    amount: 1116.81,
    type: 'expense'
  },
  
  // July 25 (Friday)
  {
    id: 2,
    date: '2025-07-25',
    category: 'Shopping',
    merchant: 'Amazon',
    paymentMethod: 'UPI',
    amount: 1204.00,
    type: 'expense'
  },
  {
    id: 3,
    date: '2025-07-25',
    category: 'Health',
    merchant: 'Shanmuga medical',
    paymentMethod: 'UPI',
    amount: 140.00,
    type: 'expense'
  },
  {
    id: 4,
    date: '2025-07-25',
    category: 'Food',
    merchant: 'Coke',
    paymentMethod: 'UPI',
    amount: 40.00,
    type: 'expense'
  },
  {
    id: 5,
    date: '2025-07-25',
    category: 'Food',
    merchant: 'Zomato',
    paymentMethod: 'UPI',
    amount: 898.80,
    type: 'expense'
  },
  {
    id: 6,
    date: '2025-07-25',
    category: 'Food',
    merchant: 'Zomato',
    paymentMethod: 'UPI',
    amount: 30.00,
    type: 'expense'
  },

  // July 23 (Wednesday)
  {
    id: 7,
    date: '2025-07-23',
    category: 'Grocery',
    merchant: 'Golden supermarket',
    paymentMethod: 'UPI',
    amount: 58.00,
    type: 'expense'
  },

  // July 22 (Tuesday)
  {
    id: 8,
    date: '2025-07-22',
    category: 'Other',
    merchant: 'UPI',
    paymentMethod: 'UPI',
    amount: 367.77,
    type: 'expense'
  }
])

// Computed properties
const groupedTransactions = computed(() => {
  const groups = {}
  
  transactions.value.forEach(transaction => {
    const date = transaction.date
    if (!groups[date]) {
      groups[date] = {
        date,
        transactions: [],
        totalIncome: 0,
        totalExpense: 0
      }
    }
    
    groups[date].transactions.push(transaction)
    
    if (transaction.type === 'income') {
      groups[date].totalIncome += transaction.amount
    } else {
      groups[date].totalExpense += transaction.amount
    }
  })
  
  // Sort by date (newest first)
  return Object.values(groups).sort((a, b) => new Date(b.date) - new Date(a.date))
})

const totalIncome = computed(() => {
  return transactions.value
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0)
})

const totalExpense = computed(() => {
  return transactions.value
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0)
})

const netTotal = computed(() => totalIncome.value - totalExpense.value)

// Methods
const formatMonth = (date) => {
  return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

const formatCurrency = (amount) => {
  return amount.toFixed(2)
}

const formatAmount = (amount) => {
  return amount.toFixed(2)
}

const getDayNumber = (dateString) => {
  return new Date(dateString).getDate()
}

const getDayName = (dateString) => {
  return new Date(dateString).toLocaleDateString('en-US', { weekday: 'short' })
}

const setActiveTab = (tabId) => {
  activeTab.value = tabId
}

const previousMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() - 1)
}

const nextMonth = () => {
  currentDate.value = new Date(currentDate.value.getFullYear(), currentDate.value.getMonth() + 1)
}

onMounted(() => {
  // Component initialization if needed
})
</script>

<style scoped>
.daily-transactions {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

/* Header Styles */
.transactions-header {
  background-color: #ffffff;
  border-bottom: 1px solid #f0f0f0;
  padding: 1rem;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.search-btn, .filter-btn, .settings-btn {
  background: none;
  border: none;
  font-size: 1.2rem;
  padding: 0.5rem;
  border-radius: 50%;
  cursor: pointer;
  transition: background-color 0.2s;
}

.search-btn:hover, .filter-btn:hover, .settings-btn:hover {
  background-color: #f5f5f5;
}

.app-title {
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0;
  color: #000;
}

.header-actions {
  display: flex;
  gap: 0.5rem;
}

/* Month Navigation */
.month-navigation {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.nav-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 50%;
  transition: background-color 0.2s;
}

.nav-btn:hover {
  background-color: #f5f5f5;
}

.current-month {
  font-size: 1.1rem;
  font-weight: 500;
  margin: 0;
  color: #000;
}

/* Tab Navigation */
.tab-navigation {
  display: flex;
  gap: 0;
  margin-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.tab-btn {
  background: none;
  border: none;
  padding: 0.75rem 1rem;
  font-size: 0.9rem;
  color: #666;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s;
  white-space: nowrap;
}

.tab-btn.active {
  color: #ff4444;
  border-bottom-color: #ff4444;
}

.tab-btn:hover {
  color: #ff4444;
}

/* Summary Section */
.summary-section {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  margin-bottom: 0.5rem;
}

.summary-item {
  text-align: center;
  flex: 1;
}

.summary-label {
  display: block;
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.25rem;
}

.summary-value {
  display: block;
  font-size: 1.1rem;
  font-weight: 600;
}

.summary-item.income .summary-value {
  color: #007AFF;
}

.summary-item.expense .summary-value {
  color: #FF3B30;
}

.summary-item.total .summary-value {
  color: #000;
}

.summary-value.negative {
  color: #FF3B30;
}

/* Transactions Content */
.transactions-content {
  flex: 1;
  padding: 0 1rem;
  overflow-y: auto;
}

.transaction-group {
  margin-bottom: 1.5rem;
}

/* Date Header */
.date-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.75rem;
  padding: 0.5rem 0;
}

.date-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.date-number {
  font-size: 1.5rem;
  font-weight: 700;
  color: #000;
}

.day-name {
  background-color: #666;
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
  text-transform: uppercase;
}

.daily-summary {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25rem;
}

.daily-income {
  color: #007AFF;
  font-size: 0.9rem;
  font-weight: 500;
}

.daily-expense {
  color: #FF3B30;
  font-size: 0.9rem;
  font-weight: 500;
}

/* Transaction Items */
.transaction-items {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.transaction-item {
  background-color: #ffffff;
  border-radius: 8px;
  padding: 0.75rem;
  border: 1px solid #f0f0f0;
}

.transaction-main {
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 1rem;
}

.transaction-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.category {
  color: #666;
  font-size: 0.85rem;
}

.merchant {
  font-weight: 500;
  color: #000;
  font-size: 0.95rem;
}

.payment-method {
  color: #666;
  font-size: 0.85rem;
  text-align: center;
}

.transaction-amount {
  font-weight: 600;
  font-size: 1rem;
  text-align: right;
}

.transaction-amount.income {
  color: #007AFF;
}

.transaction-amount.expense {
  color: #FF3B30;
}

/* Bottom Navigation */
.bottom-navigation {
  background-color: #ffffff;
  border-top: 1px solid #f0f0f0;
  padding: 0.75rem 1rem 1rem;
  position: relative;
}

.nav-items {
  display: flex;
  justify-content: space-around;
  align-items: center;
}

.nav-item {
  background: none;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  padding: 0.5rem;
  cursor: pointer;
  transition: color 0.2s;
}

.nav-item.active {
  color: #FF3B30;
}

.nav-item:hover {
  color: #FF3B30;
}

.nav-icon {
  font-size: 1.2rem;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 500;
}

/* Floating Action Buttons */
.floating-actions {
  position: absolute;
  right: 1rem;
  bottom: 5rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  align-items: flex-end;
}

.fab {
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.2rem;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s, box-shadow 0.2s;
}

.fab:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
}

.fab.primary {
  background-color: #FF3B30;
  color: white;
  width: 3.5rem;
  height: 3.5rem;
  font-size: 1.5rem;
  font-weight: bold;
}

.fab.secondary {
  background-color: white;
  color: #FF3B30;
  border: 2px solid #FF3B30;
  width: 2.5rem;
  height: 2.5rem;
  font-size: 1rem;
}

.fab-icon {
  display: flex;
  align-items: center;
  justify-content: center;
}

/* Responsive Design */
@media (max-width: 768px) {
  .daily-transactions {
    margin: 0;
  }
  
  .transactions-header {
    padding: 1rem 0.75rem;
  }
  
  .transactions-content {
    padding: 0 0.75rem;
  }
  
  .summary-section {
    padding: 0.75rem 0;
  }
  
  .tab-btn {
    padding: 0.5rem 0.75rem;
    font-size: 0.85rem;
  }
}

@media (min-width: 769px) {
  .daily-transactions {
    max-width: 480px;
    margin: 0 auto;
    border-left: 1px solid #f0f0f0;
    border-right: 1px solid #f0f0f0;
  }
}
</style>