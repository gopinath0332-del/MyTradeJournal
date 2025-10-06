<template>
  <div class="horizontal-bar-chart">
    <div v-if="data.length === 0" class="no-data-message">
      {{ noDataMessage || 'No data available' }}
    </div>
    <div v-else class="chart-bars">
      <div
        v-for="(item, index) in data"
        :key="item.id || index"
        class="bar-item"
      >
        <div class="item-info">
          <span v-if="showRank" class="item-rank">{{ index + 1 }}</span>
          <span class="item-name">{{ item.name }}</span>
          <span v-if="item.subtitle" class="item-subtitle">{{ item.subtitle }}</span>
        </div>
        <div class="bar-container">
          <div
            class="horizontal-bar"
            :class="{
              'positive': item.value > 0,
              'negative': item.value < 0,
              'neutral': item.value === 0
            }"
            :style="{
              width: `${Math.abs(item.value / maxValue) * 100}%`
            }"
            :title="item.tooltip || `${item.name}: ${formatValue(item.value)}`"
          >
            <span class="bar-label">
              {{ formatValue(item.value) }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  data: {
    type: Array,
    default: () => []
  },
  showRank: {
    type: Boolean,
    default: false
  },
  noDataMessage: {
    type: String,
    default: 'No data available'
  },
  valueFormatter: {
    type: Function,
    default: (value) => value.toString()
  }
})

const maxValue = computed(() => {
  if (props.data.length === 0) return 1
  return Math.max(...props.data.map(item => Math.abs(item.value)))
})

const formatValue = (value) => {
  return props.valueFormatter(value)
}
</script>

<style scoped>
.horizontal-bar-chart {
  background: #f8fafc;
  border-radius: 0.5rem;
  padding: 1rem;
}

@media (min-width: 480px) {
  .horizontal-bar-chart {
    padding: 1.25rem;
  }
}

@media (min-width: 768px) {
  .horizontal-bar-chart {
    padding: 1.5rem;
  }
}

.chart-bars {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 768px) {
  .chart-bars {
    gap: 1.25rem;
  }
}

.bar-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

@media (min-width: 480px) {
  .bar-item {
    flex-direction: row;
    align-items: center;
    gap: 1rem;
  }
}

.item-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  min-width: 0;
  flex: 0 0 auto;
}

@media (min-width: 480px) {
  .item-info {
    min-width: 180px;
    flex: 0 0 180px;
  }
}

@media (min-width: 768px) {
  .item-info {
    min-width: 200px;
    flex: 0 0 200px;
  }
}

.item-rank {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: #3b82f6;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  flex-shrink: 0;
  transition: all 0.2s ease;
}

@media (min-width: 768px) {
  .item-rank {
    width: 26px;
    height: 26px;
    font-size: 0.8rem;
  }
}

.item-name {
  font-weight: 600;
  color: #1f2937;
  font-size: 0.9rem;
  flex-shrink: 0;
}

@media (min-width: 480px) {
  .item-name {
    font-size: 0.95rem;
  }
}

@media (min-width: 768px) {
  .item-name {
    font-size: 1rem;
  }
}

.item-subtitle {
  font-size: 0.8rem;
  color: #6b7280;
  white-space: nowrap;
}

@media (min-width: 480px) {
  .item-subtitle {
    font-size: 0.85rem;
  }
}

@media (min-width: 768px) {
  .item-subtitle {
    font-size: 0.9rem;
  }
}

.bar-container {
  flex: 1;
  position: relative;
  height: 36px;
  background: #e5e7eb;
  border-radius: 0.375rem;
  overflow: hidden;
}

@media (min-width: 768px) {
  .bar-container {
    height: 40px;
  }
}

.horizontal-bar {
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding-right: 0.75rem;
  border-radius: 0.375rem;
  transition: all 0.3s ease;
  position: relative;
  min-width: 60px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.horizontal-bar.positive {
  background: linear-gradient(90deg, #10b981, #059669);
}

.horizontal-bar.negative {
  background: linear-gradient(90deg, #ef4444, #dc2626);
}

.horizontal-bar.neutral {
  background: linear-gradient(90deg, #6b7280, #4b5563);
}

.bar-label {
  color: white;
  font-weight: 700;
  font-size: 0.8rem;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  white-space: nowrap;
}

@media (min-width: 480px) {
  .bar-label {
    font-size: 0.85rem;
  }
}

@media (min-width: 768px) {
  .bar-label {
    font-size: 0.9rem;
  }
}

.no-data-message {
  text-align: center;
  color: #6b7280;
  font-style: italic;
  padding: 2rem;
}

/* Hover effects */
@media (hover: hover) {
  .horizontal-bar:hover {
    transform: scaleX(1.02);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .bar-item:hover .item-rank {
    background: #2563eb;
    transform: scale(1.1);
  }
}

.horizontal-bar:active {
  transform: scaleX(0.98);
}

.horizontal-bar:focus {
  outline: 2px solid var(--primary-color, #3b82f6);
  outline-offset: 2px;
}
</style>
