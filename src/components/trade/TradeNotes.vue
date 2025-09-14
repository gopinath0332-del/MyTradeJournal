<template>
  <div class="trade-notes">
    <div class="form-group">
      <label for="strategy">Strategy</label>
      <select 
        id="strategy" 
        :value="modelValue.strategy"
        @change="updateField('strategy', $event.target.value)"
        required
        :class="{ 'error': errors.strategy }"
      >
        <option value="">Select a strategy</option>
        <option value="Momentum">Momentum</option>
        <option value="Reversal">Reversal</option>
        <option value="Breakout">Breakout</option>
        <option value="Scalping">Scalping</option>
        <option value="Swing">Swing</option>
        <option value="Day Trading">Day Trading</option>
        <option value="Position">Position</option>
        <option value="Arbitrage">Arbitrage</option>
        <option value="Other">Other</option>
      </select>
      <div v-if="errors.strategy" class="error-message">{{ errors.strategy }}</div>
    </div>

    <div class="form-group">
      <label for="confidence">Confidence Level</label>
      <div class="confidence-container">
        <input 
          type="range" 
          id="confidence" 
          :value="modelValue.confidence || 5"
          @input="updateField('confidence', parseInt($event.target.value))"
          min="1" 
          max="10" 
          step="1"
          class="confidence-slider"
        />
        <span class="confidence-value">{{ modelValue.confidence || 5 }}/10</span>
      </div>
      <div class="confidence-labels">
        <span>Low</span>
        <span>Medium</span>
        <span>High</span>
      </div>
    </div>

    <div class="form-group">
      <label for="notes">Trade Notes</label>
      <textarea 
        id="notes" 
        :value="modelValue.notes"
        @input="updateField('notes', $event.target.value)"
        placeholder="Enter your trade reasoning, setup, or observations..."
        rows="4"
      ></textarea>
    </div>

    <div class="form-group">
      <label for="lessons">Lessons Learned</label>
      <textarea 
        id="lessons" 
        :value="modelValue.lessons"
        @input="updateField('lessons', $event.target.value)"
        placeholder="What did you learn from this trade? What would you do differently?"
        rows="3"
      ></textarea>
    </div>

    <div class="form-group" v-if="showScreenshotUpload">
      <label for="screenshots">Trade Screenshots</label>
      <input 
        type="file" 
        id="screenshots" 
        @change="handleFileUpload"
        multiple 
        accept="image/*"
        class="file-input"
      />
      <div v-if="modelValue.screenshotUrls && modelValue.screenshotUrls.length" class="screenshot-preview">
        <div v-for="(url, index) in modelValue.screenshotUrls" :key="index" class="screenshot-item">
          <img :src="url" :alt="`Screenshot ${index + 1}`" />
          <button type="button" @click="removeScreenshot(index)" class="remove-btn">×</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true
  },
  showScreenshotUpload: {
    type: Boolean,
    default: true
  },
  errors: {
    type: Object,
    default: () => ({})
  }
})

const emit = defineEmits(['update:modelValue', 'file-upload'])

const updateField = (field, value) => {
  emit('update:modelValue', {
    ...props.modelValue,
    [field]: value
  })
}

const handleFileUpload = (event) => {
  const files = Array.from(event.target.files)
  emit('file-upload', files)
}

const removeScreenshot = (index) => {
  const screenshots = [...(props.modelValue.screenshotUrls || [])]
  screenshots.splice(index, 1)
  updateField('screenshotUrls', screenshots)
}
</script>

<style scoped>
.form-group {
  margin-bottom: 1rem;
}

@media (min-width: 768px) {
  .form-group {
    margin-bottom: 20px;
  }
}

label {
  display: block;
  margin-bottom: 5px;
  font-weight: bold;
}

select, textarea {
  width: 100%;
  padding: 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  box-sizing: border-box;
  font-family: inherit;
  min-height: 44px;
}

select.error, textarea.error {
  border-color: #dc3545;
  box-shadow: 0 0 0 0.2rem rgba(220, 53, 69, 0.25);
}

.error-message {
  color: #dc3545;
  font-size: 12px;
  margin-top: 5px;
}

@media (min-width: 768px) {
  select, textarea {
    padding: 8px;
  }
}

textarea {
  resize: vertical;
  min-height: 80px;
}

.confidence-container {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 5px;
}

.confidence-slider {
  flex: 1;
  height: 6px;
  background: #ddd;
  border-radius: 3px;
  outline: none;
  -webkit-appearance: none;
  appearance: none;
}

.confidence-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  width: 20px;
  height: 20px;
  background: #007bff;
  border-radius: 50%;
  cursor: pointer;
}

.confidence-slider::-moz-range-thumb {
  width: 20px;
  height: 20px;
  background: #007bff;
  border-radius: 50%;
  border: none;
  cursor: pointer;
}

.confidence-value {
  font-weight: bold;
  color: #007bff;
  min-width: 40px;
}

.confidence-labels {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #666;
  margin-top: 5px;
}

.file-input {
  width: 100%;
  padding: 8px;
  border: 2px dashed #ddd;
  border-radius: 4px;
  background: #f9f9f9;
  cursor: pointer;
}

.file-input:hover {
  border-color: #007bff;
}

.screenshot-preview {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 10px;
}

.screenshot-item {
  position: relative;
  width: 100px;
  height: 100px;
}

.screenshot-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  border-radius: 4px;
  border: 1px solid #ddd;
}

.remove-btn {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 50%;
  width: 20px;
  height: 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
}
</style>