<template>
  <div class="failure-mode-selector">
    <div class="failure-mode-header">
      <h3>
        <span class="icon">🔍</span>
        Failure Analysis
      </h3>
      <p class="subtitle">Identify what went wrong to learn and improve</p>
    </div>

    <!-- Category Tabs -->
    <div class="category-tabs">
      <button
        v-for="category in categories"
        :key="category.id"
        type="button"
        class="category-tab"
        :class="{ active: activeCategory === category.id }"
        :style="{ '--category-color': category.color }"
        @click="activeCategory = category.id"
      >
        <span class="category-icon">{{ category.icon }}</span>
        <span class="category-label">{{ category.label }}</span>
        <span v-if="getCategoryCount(category.id) > 0" class="category-badge">
          {{ getCategoryCount(category.id) }}
        </span>
      </button>
    </div>

    <!-- Failure Mode Options -->
    <div class="failure-modes">
      <div
        v-for="mode in filteredModes"
        :key="mode.id"
        class="failure-mode-card"
        :class="{ selected: isSelected(mode.id) }"
        :style="{ '--mode-color': mode.color }"
        @click="toggleMode(mode.id)"
      >
        <div class="mode-header">
          <span class="mode-icon">{{ mode.icon }}</span>
          <span class="mode-label">{{ mode.label }}</span>
          <span v-if="isSelected(mode.id)" class="selected-badge">✓</span>
        </div>
        <p class="mode-description">{{ mode.description }}</p>
      </div>
    </div>

    <!-- Selected Modes Summary -->
    <div v-if="selectedModes.length > 0" class="selected-summary">
      <h4>Selected Issues ({{ selectedModes.length }})</h4>
      <div class="selected-tags">
        <span
          v-for="modeId in selectedModes"
          :key="modeId"
          class="selected-tag"
          :style="{ '--tag-color': getModeById(modeId)?.color }"
          @click="removeMode(modeId)"
        >
          {{ getModeById(modeId)?.icon }} {{ getModeById(modeId)?.label }}
          <span class="remove-icon">×</span>
        </span>
      </div>
    </div>

    <!-- Additional Notes -->
    <div class="failure-notes">
      <label for="failure-notes">
        <span class="icon">📝</span>
        Detailed Failure Analysis (Optional)
      </label>
      <textarea
        id="failure-notes"
        v-model="notes"
        placeholder="Describe what went wrong, why it happened, and what you'll do differently next time..."
        rows="4"
        @input="$emit('update:notes', notes)"
      />
    </div>

    <!-- Confidence Rating -->
    <div class="confidence-rating">
      <label>
        <span class="icon">📊</span>
        How confident are you in this analysis?
      </label>
      <div class="confidence-options">
        <button
          v-for="level in 5"
          :key="level"
          type="button"
          class="confidence-btn"
          :class="{ active: confidence === level }"
          @click="setConfidence(level)"
        >
          <span class="star">{{ confidence >= level ? '★' : '☆' }}</span>
        </button>
        <span class="confidence-label">{{ confidenceLabel }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import { FAILURE_MODES, CATEGORY_INFO, getFailureModeById } from '@/types/failureMode'

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  initialNotes: {
    type: String,
    default: ''
  },
  initialConfidence: {
    type: Number,
    default: 3
  }
})

const emit = defineEmits(['update:modelValue', 'update:notes', 'update:confidence'])

// Local state
const selectedModes = ref([...props.modelValue])
const notes = ref(props.initialNotes)
const confidence = ref(props.initialConfidence)
const activeCategory = ref('entry')

// Categories with metadata
const categories = computed(() => {
  return Object.entries(CATEGORY_INFO).map(([id, info]) => ({
    id,
    ...info
  }))
})

// Filtered modes based on active category
const filteredModes = computed(() => {
  return FAILURE_MODES.filter(mode => mode.category === activeCategory.value)
})

// Confidence label
const confidenceLabel = computed(() => {
  const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High']
  return labels[confidence.value - 1] || 'Medium'
})

// Helper functions
const isSelected = (modeId) => {
  return selectedModes.value.includes(modeId)
}

const toggleMode = (modeId) => {
  if (isSelected(modeId)) {
    removeMode(modeId)
  } else {
    selectedModes.value.push(modeId)
    emit('update:modelValue', selectedModes.value)
  }
}

const removeMode = (modeId) => {
  selectedModes.value = selectedModes.value.filter(id => id !== modeId)
  emit('update:modelValue', selectedModes.value)
}

const getModeById = (modeId) => {
  return getFailureModeById(modeId)
}

const getCategoryCount = (categoryId) => {
  return selectedModes.value.filter(modeId => {
    const mode = getModeById(modeId)
    return mode?.category === categoryId
  }).length
}

const setConfidence = (level) => {
  confidence.value = level
  emit('update:confidence', level)
}

// Watch for prop changes
watch(() => props.modelValue, (newVal) => {
  selectedModes.value = [...newVal]
})

watch(() => props.initialNotes, (newVal) => {
  notes.value = newVal
})

watch(() => props.initialConfidence, (newVal) => {
  confidence.value = newVal
})
</script>

<style scoped>
.failure-mode-selector {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  margin: 1rem 0;
}

.failure-mode-header {
  margin-bottom: 1.5rem;
}

.failure-mode-header h3 {
  margin: 0 0 0.5rem 0;
  color: #1f2937;
  font-size: 1.25rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.failure-mode-header .icon {
  font-size: 1.5rem;
}

.subtitle {
  margin: 0;
  color: #6b7280;
  font-size: 0.875rem;
}

/* Category Tabs */
.category-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
  flex-wrap: wrap;
}

.category-tab {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1rem;
  background: #f9fafb;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.875rem;
  position: relative;
}

.category-tab:hover {
  background: #f3f4f6;
  transform: translateY(-1px);
}

.category-tab.active {
  background: var(--category-color);
  color: white;
  border-color: var(--category-color);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.category-icon {
  font-size: 1.125rem;
}

.category-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--category-color);
  border-radius: 10px;
  font-size: 0.75rem;
  font-weight: 600;
}

.category-tab.active .category-badge {
  background: rgba(255, 255, 255, 0.95);
}

/* Failure Mode Cards */
.failure-modes {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.failure-mode-card {
  padding: 1rem;
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.failure-mode-card:hover {
  border-color: var(--mode-color);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.failure-mode-card.selected {
  background: var(--mode-color);
  color: white;
  border-color: var(--mode-color);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.mode-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.mode-icon {
  font-size: 1.25rem;
}

.mode-label {
  font-weight: 600;
  flex: 1;
}

.selected-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  background: rgba(255, 255, 255, 0.9);
  color: var(--mode-color);
  border-radius: 50%;
  font-weight: bold;
}

.failure-mode-card.selected .selected-badge {
  background: rgba(255, 255, 255, 0.95);
}

.mode-description {
  margin: 0;
  font-size: 0.875rem;
  line-height: 1.4;
  opacity: 0.9;
}

.failure-mode-card.selected .mode-description {
  opacity: 0.95;
}

/* Selected Summary */
.selected-summary {
  background: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1.5rem;
}

.selected-summary h4 {
  margin: 0 0 0.75rem 0;
  color: #166534;
  font-size: 1rem;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.375rem;
  padding: 0.5rem 0.75rem;
  background: white;
  border: 2px solid var(--tag-color);
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.selected-tag:hover {
  background: var(--tag-color);
  color: white;
  transform: scale(1.05);
}

.remove-icon {
  font-size: 1.125rem;
  font-weight: bold;
  opacity: 0.7;
}

.selected-tag:hover .remove-icon {
  opacity: 1;
}

/* Failure Notes */
.failure-notes {
  margin-bottom: 1.5rem;
}

.failure-notes label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
  color: #374151;
  font-weight: 600;
}

.failure-notes textarea {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e5e7eb;
  border-radius: 8px;
  font-family: inherit;
  font-size: 0.875rem;
  resize: vertical;
  transition: border-color 0.2s ease;
}

.failure-notes textarea:focus {
  outline: none;
  border-color: #3b82f6;
}

/* Confidence Rating */
.confidence-rating label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  color: #374151;
  font-weight: 600;
}

.confidence-options {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.confidence-btn {
  padding: 0.5rem;
  background: transparent;
  border: none;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.confidence-btn:hover {
  transform: scale(1.2);
}

.confidence-btn .star {
  font-size: 1.75rem;
  color: #d1d5db;
  transition: color 0.2s ease;
}

.confidence-btn.active .star {
  color: #fbbf24;
}

.confidence-label {
  margin-left: 0.5rem;
  color: #6b7280;
  font-weight: 600;
}

@media (max-width: 768px) {
  .failure-modes {
    grid-template-columns: 1fr;
  }

  .category-tabs {
    gap: 0.375rem;
  }

  .category-tab {
    padding: 0.5rem 0.75rem;
    font-size: 0.8125rem;
  }
}
</style>
