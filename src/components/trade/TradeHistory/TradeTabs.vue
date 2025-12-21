<template>
  <div class="tabs-container">
    <div class="tabs">
      <button
        class="tab-button"
        :class="{ active: activeTab === 'open' }"
        @click="$emit('update:activeTab', 'open')"
      >
        Open Trades ({{ openCount }})
      </button>
      <button
        class="tab-button"
        :class="{ active: activeTab === 'closed' }"
        @click="$emit('update:activeTab', 'closed')"
      >
        Closed Trades ({{ closedCount }})
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  activeTab: 'open' | 'closed'
  openCount: number
  closedCount: number
}>()

defineEmits<{
  'update:activeTab': [value: 'open' | 'closed']
}>()
</script>

<style scoped>
.tabs-container {
  margin-bottom: 1.5rem;
}

.tabs {
  display: flex;
  background-color: #f8fafc;
  border-radius: 8px;
  padding: 4px;
  gap: 4px;
}

.tab-button {
  flex: 1;
  padding: 12px 16px;
  border: none;
  background: transparent;
  color: #6b7280;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  font-size: 14px;
  transition: all 0.2s ease;
  position: relative;
}

.tab-button:hover {
  color: #374151;
  background-color: #e5e7eb;
}

.tab-button.active {
  background-color: #3b82f6;
  color: white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

@media (min-width: 768px) {
  .tabs-container {
    margin-bottom: 2rem;
  }

  .tab-button {
    padding: 14px 20px;
    font-size: 15px;
  }
}
</style>
