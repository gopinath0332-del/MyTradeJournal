<script setup>
import { ref } from 'vue'
import TradeForm from './components/trade/TradeForm.vue'
import TradeHistory from './components/trade/TradeHistory.vue'

const activeTab = ref('history') // 'trade' or 'history'
</script>

<template>
  <div class="app-container">
    <header>
      <h1>Trade Journal</h1>
      <nav>
        <button :class="{ active: activeTab === 'history' }" @click="activeTab = 'history'">
          Trade History
        </button>
        <button :class="{ active: activeTab === 'trade' }" @click="activeTab = 'trade'">
          Log Trade
        </button>
      </nav>
    </header>

    <main>
      <TradeHistory v-if="activeTab === 'history'" />
      <TradeForm v-if="activeTab === 'trade'" />
    </main>
  </div>
</template>

<style>
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
