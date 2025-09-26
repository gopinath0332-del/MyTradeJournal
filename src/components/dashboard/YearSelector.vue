<template>
  <div class="year-selector">
    <label for="yearSelect">Year:</label>
    <select
      id="yearSelect"
      :value="selectedYear"
      @change="emit('year-change', parseInt(($event.target as HTMLSelectElement)?.value || '0'))"
    >
      <option v-for="year in availableYears" :key="year" :value="year">
        {{ year }}
      </option>
    </select>
  </div>
</template>

<script setup lang="ts">
import type { YearSelectorProps } from '../../types/vue'

defineProps<YearSelectorProps>()

const emit = defineEmits<{
  'year-change': [year: number]
}>()
</script>

<style scoped>
.year-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.year-selector label {
  font-weight: 500;
  color: var(--text-muted);
  font-size: 0.9rem;
}

.year-selector select {
  padding: 0.4rem 0.75rem;
  border: 1px solid #e2e8f0;
  border-radius: 4px;
  background: white;
  color: var(--text-color);
  font-size: 0.9rem;
  cursor: pointer;
}

.year-selector select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}
</style>
