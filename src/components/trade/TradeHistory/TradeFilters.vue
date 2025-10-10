<template>
  <div class="filters">
    <div class="filter-group date-filter">
      <label for="dateRange">Date Range</label>
      <select id="dateRange" v-model="localFilters.dateRange" @change="emitFilters">
        <option value="7">Last 7 days</option>
        <option value="last-month">Last Month</option>
        <option value="last-3-months">Last 3 Months</option>
        <option value="current-month">Current Month</option>
        <option value="custom">Custom Range</option>
        <option value="all">All time</option>
      </select>
      <div v-if="localFilters.dateRange === 'custom'" class="custom-date-range">
        <div class="date-input">
          <label for="startDate">Start Date</label>
          <input
            id="startDate"
            v-model="localFilters.startDate"
            type="date"
            :max="localFilters.endDate || new Date().toISOString().slice(0, 10)"
            @change="emitFilters"
          >
        </div>
        <div class="date-input">
          <label for="endDate">End Date</label>
          <input
            id="endDate"
            v-model="localFilters.endDate"
            type="date"
            :min="localFilters.startDate"
            :max="new Date().toISOString().slice(0, 10)"
            @change="emitFilters"
          >
        </div>
      </div>
    </div>
    <div class="filter-group">
      <label for="symbol">Symbol</label>
      <select id="symbol" v-model="localFilters.symbol" @change="emitFilters">
        <option value="all">All Symbols</option>
        <option v-for="symbol in uniqueSymbols" :key="symbol" :value="symbol">
          {{ symbol }}
        </option>
      </select>
    </div>
    <div class="filter-group">
      <label for="type">Type</label>
      <select id="type" v-model="localFilters.type" @change="emitFilters">
        <option value="all">All Types</option>
        <option value="BUY">Buy</option>
        <option value="SELL">Sell</option>
      </select>
    </div>
    <div class="filter-group">
      <label for="profitability">Profitability</label>
      <select id="profitability" v-model="localFilters.profitability" @change="emitFilters">
        <option value="all">All Trades</option>
        <option value="profit">Profitable</option>
        <option value="loss">Loss Making</option>
      </select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { reactive, watch } from 'vue'

interface Filters {
  dateRange: string
  startDate: string
  endDate: string
  symbol: string
  type: string
  profitability: string
}

const props = defineProps<{
  filters: Filters
  uniqueSymbols: string[]
}>()

const emit = defineEmits<{
  'update:filters': [value: Filters]
}>()

const localFilters = reactive({ ...props.filters })

watch(() => props.filters, (newFilters) => {
  Object.assign(localFilters, newFilters)
}, { deep: true })

const emitFilters = () => {
  emit('update:filters', { ...localFilters })
}
</script>

<style scoped>
.filters {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

@media (min-width: 768px) {
  .filters {
    flex-direction: row;
    gap: 20px;
    margin-bottom: 30px;
    flex-wrap: wrap;
  }
}

.filter-group {
  flex: 1;
  min-width: auto;
}

@media (min-width: 768px) {
  .filter-group {
    min-width: 200px;
  }
}

.date-filter {
  min-width: 200px;
}

.filter-group label {
  display: block;
  margin-bottom: 5px;
  font-weight: 500;
}

.filter-group select {
  width: 100%;
  padding: 12px;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background-color: white;
  font-size: 16px;
  min-height: 44px;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

@media (min-width: 768px) {
  .filter-group select {
    padding: 8px;
    font-size: 14px;
    min-height: auto;
  }
}

.custom-date-range {
  margin-top: 10px;
  display: flex;
  gap: 10px;
}

.date-input {
  flex: 1;
}

.date-input label {
  display: block;
  font-size: 0.9em;
  margin-bottom: 4px;
}

.date-input input[type="date"] {
  width: 100%;
  padding: 6px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 14px;
}
</style>
