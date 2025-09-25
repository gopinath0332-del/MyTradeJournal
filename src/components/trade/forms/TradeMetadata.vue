<template>
  <div class="trade-metadata">
    <div class="form-group">
      <label for="screenshot">Screenshots</label>
      <input
        id="screenshot"
        type="file"
        multiple
        accept="image/*"
        class="file-input"
        @change="handleScreenshotUpload"
      >
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="confidence">Confidence Level (1-5)</label>
        <div class="range-input">
          <input
            id="confidence"
            type="range"
            :value="modelValue.confidence"
            min="1"
            max="5"
            step="1"
            @input="updateField('confidence', parseInt($event.target.value))"
          >
          <span class="range-value">{{ modelValue.confidence }}</span>
        </div>
      </div>

      <div class="form-group">
        <label for="executionQuality">Execution Quality (1-5)</label>
        <div class="range-input">
          <input
            id="executionQuality"
            type="range"
            :value="modelValue.executionQuality"
            min="1"
            max="5"
            step="1"
            @input="updateField('executionQuality', parseInt($event.target.value))"
          >
          <span class="range-value">{{ modelValue.executionQuality }}</span>
        </div>
      </div>
    </div>

    <div class="form-group">
      <label for="remarks">Remarks</label>
      <select
        id="remarks"
        :value="modelValue.remarks"
        @change="updateField('remarks', $event.target.value)"
      >
        <option value="">Select remarks (optional)</option>
        <option value="Early exit">Early exit</option>
        <option value="rush trade">rush trade</option>
        <option value="Against rules">Against rules</option>
        <option value="over trade">over trade</option>
        <option value="greedy">greedy</option>
        <option value="Early Entry">Early Entry</option>
        <option value="Late entry - over analysis">Late entry - over analysis</option>
        <option value="Late entry - time past">Late entry - time past</option>
      </select>
    </div>

    <div class="form-group">
      <label for="lessonsLearned">Lessons Learned</label>
      <textarea
        id="lessonsLearned"
        :value="modelValue.lessonsLearned"
        rows="4"
        placeholder="What did you learn from this trade?"
        @input="updateField('lessonsLearned', $event.target.value)"
      />
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'screenshot-upload'])

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const handleScreenshotUpload = (event) => {
  const files = Array.from(event.target.files)
  updateField('screenshots', files)
  emit('screenshot-upload', files)
}
</script>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
  margin-bottom: 1rem;
}

label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

select, textarea {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  font-family: inherit;
}

select:focus, textarea:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.file-input {
  padding: 0.75rem;
  border: 2px dashed var(--border-color);
  border-radius: 0.375rem;
  background-color: #f9fafb;
  cursor: pointer;
  transition: border-color 0.2s ease;
}

.file-input:hover {
  border-color: var(--primary-color);
}

.range-input {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.range-input input[type="range"] {
  flex: 1;
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.range-input input[type="range"]::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: var(--primary-color);
  border-radius: 50%;
  cursor: pointer;
}

.range-input input[type="range"]::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: var(--primary-color);
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.range-value {
  font-weight: 600;
  color: var(--primary-color);
  min-width: 20px;
  text-align: center;
}

textarea {
  resize: vertical;
  min-height: 100px;
}
</style>
