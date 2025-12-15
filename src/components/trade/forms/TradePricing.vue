<template>
  <div class="trade-pricing">
    <div class="form-row">
      <div class="form-group">
        <label for="entryPrice">Entry Price</label>
        <div class="input-with-prefix">
          <span class="currency-prefix">₹</span>
          <input
            id="entryPrice"
            type="number"
            :value="modelValue.entryPrice"
            required
            step="0.01"
            inputmode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            @input="handlePriceChange('entryPrice', $event)"
          />
        </div>
      </div>
      <div class="form-group">
        <label for="exitPrice">Exit Price</label>
        <div class="input-with-prefix">
          <span class="currency-prefix">₹</span>
          <input
            id="exitPrice"
            type="number"
            :value="modelValue.exitPrice"
            step="0.01"
            inputmode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            @input="handlePriceChange('exitPrice', $event)"
          />
        </div>
      </div>
    </div>

    <div class="form-row">
      <div class="form-group">
        <label for="lots">Size</label>
        <input
          id="lots"
          type="number"
          :value="modelValue.lots"
          required
          min="1"
          step="1"
          inputmode="numeric"
          pattern="[0-9]*"
          @input="handleNumberChange('lots', $event)"
        />
      </div>
      <div class="form-group">
        <label for="capitalUsed">Capital Used</label>
        <div class="input-with-prefix">
          <span class="currency-prefix">₹</span>
          <input
            id="capitalUsed"
            type="number"
            :value="modelValue.capitalUsed"
            required
            step="0.01"
            min="0"
            inputmode="decimal"
            pattern="[0-9]*\.?[0-9]*"
            @input="handlePriceChange('capitalUsed', $event)"
          />
        </div>
      </div>
    </div>

    <!-- Partial Exits Section -->
    <div v-if="!modelValue.exitDate" class="partial-exits-section">
      <h3>Partial Exits</h3>

      <div class="partial-exit-form">
        <div class="form-row compact">
          <div class="form-group">
            <label for="pe-date">Date</label>
            <input id="pe-date" type="date" v-model="newPartialExit.date" />
          </div>
          <div class="form-group">
            <label for="pe-price">Price</label>
            <div class="input-with-prefix">
              <span class="currency-prefix">₹</span>
              <input
                id="pe-price"
                type="number"
                v-model.number="newPartialExit.price"
                step="0.01"
              />
            </div>
          </div>
          <div class="form-group">
            <label for="pe-lots">Lots</label>
            <input
              id="pe-lots"
              type="number"
              v-model.number="newPartialExit.lots"
              step="1"
            />
          </div>
          <div class="form-group button-group">
            <button
              type="button"
              class="btn-add"
              @click="addPartialExit"
              :disabled="!isValidPartialExit"
            >
              Add
            </button>
          </div>
        </div>
      </div>

      <div
        v-if="modelValue.partialExits && modelValue.partialExits.length > 0"
        class="partial-exits-list"
      >
        <div
          v-for="(exit, index) in modelValue.partialExits"
          :key="index"
          class="partial-exit-item"
        >
          <span>{{ formatDate(exit.date) }}</span>
          <span>@ ₹{{ exit.price }}</span>
          <span>{{ exit.lots }} Lots</span>
          <button
            type="button"
            class="btn-remove"
            @click="removePartialExit(index)"
          >
            &times;
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from "vue";

const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
});

const emit = defineEmits(["update:modelValue", "calculate-pnl"]);

// Partial Exit State
const newPartialExit = ref({
  date: "",
  price: null,
  lots: null,
});

const isValidPartialExit = computed(() => {
  return (
    newPartialExit.value.date &&
    newPartialExit.value.price > 0 &&
    newPartialExit.value.lots > 0
  );
});

const addPartialExit = () => {
  if (!isValidPartialExit.value) return;

  const currentPartialExits = props.modelValue.partialExits || [];
  const updatedPartialExits = [
    ...currentPartialExits,
    { ...newPartialExit.value },
  ];

  updateField("partialExits", updatedPartialExits);

  // Reset form
  newPartialExit.value = {
    date: "",
    price: null,
    lots: null,
  };

  emit("calculate-pnl");
};

const removePartialExit = (index) => {
  const currentPartialExits = props.modelValue.partialExits || [];
  const updatedPartialExits = currentPartialExits.filter((_, i) => i !== index);

  updateField("partialExits", updatedPartialExits);
  emit("calculate-pnl");
};

const formatDate = (dateString) => {
  if (!dateString) return "";
  return new Date(dateString).toLocaleDateString();
};

const updateField = (field, value) => {
  emit("update:modelValue", {
    ...props.modelValue,
    [field]: value,
  });
};

const handlePriceChange = (field, event) => {
  const value = parseFloat(event.target.value) || null;
  updateField(field, value);
  emit("calculate-pnl");
};

const handleNumberChange = (field, event) => {
  const value = parseInt(event.target.value) || null;
  updateField(field, value);
  emit("calculate-pnl");
};
</script>

<style scoped>
.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-row.compact {
  grid-template-columns: 2fr 2fr 1fr auto;
  align-items: end;
  gap: 0.5rem;
}

@media (max-width: 768px) {
  .form-row {
    grid-template-columns: 1fr;
    gap: 0.5rem;
  }

  .form-row.compact {
    grid-template-columns: 1fr 1fr;
  }

  .form-row.compact .button-group {
    grid-column: span 2;
  }
}

.form-group {
  display: flex;
  flex-direction: column;
}

label {
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: var(--text-color);
}

input {
  padding: 0.75rem;
  border: 1px solid var(--border-color);
  border-radius: 0.375rem;
  font-size: 1rem;
  transition: border-color 0.2s ease;
  width: 100%;
}

input:focus {
  outline: none;
  border-color: var(--primary-color);
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
}

.input-with-prefix {
  position: relative;
  display: flex;
  align-items: center;
}

.currency-prefix {
  position: absolute;
  left: 0.75rem;
  color: #6b7280;
  font-weight: 500;
  z-index: 1;
}

.input-with-prefix input {
  padding-left: 2.5rem;
}

/* Partial Exits Styles */
.partial-exits-section {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px dashed var(--border-color);
}

.partial-exits-section h3 {
  font-size: 1.1rem;
  margin-bottom: 1rem;
  color: var(--text-color);
}

.btn-add {
  padding: 0.75rem 1.5rem;
  background-color: var(--primary-color, #3b82f6);
  color: white;
  border: none;
  border-radius: 0.375rem;
  cursor: pointer;
  font-weight: 500;
  height: 42px; /* Match input height */
}

.btn-add:disabled {
  background-color: #9ca3af;
  cursor: not-allowed;
}

.partial-exits-list {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.partial-exit-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background-color: var(--bg-secondary, #f3f4f6);
  border-radius: 0.375rem;
  font-size: 0.9rem;
}

.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.5rem;
}

.btn-remove:hover {
  color: #dc2626;
}
</style>
