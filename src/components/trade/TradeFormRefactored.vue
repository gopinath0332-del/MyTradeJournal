<template>
  <div class="trade-form-container">
    <div class="card">
      <div class="card-header">
        <h2>{{ isEditing ? 'Edit Trade' : 'Add New Trade' }}</h2>
      </div>
      
      <form @submit.prevent="handleSubmit" class="trade-form">
        <TradeBasicInfo 
          v-model="formData"
          :errors="validationErrors"
        />
        
        <TradeDates 
          v-model="formData"
          :errors="validationErrors"
        />
        
        <TradePrices 
          v-model="formData"
          :errors="validationErrors"
        />
        
        <TradeNotes 
          v-model="formData"
          :errors="validationErrors"
          @file-upload="handleFileUpload"
        />
        
        <TradeActions
          :loading="loading"
          :is-form-valid="isFormValid"
          :is-editing="isEditing"
          :error="error"
          @cancel="handleCancel"
        />
      </form>
    </div>
  </div>
</template>

<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import TradeBasicInfo from './TradeBasicInfo.vue'
import TradeDates from './TradeDates.vue'
import TradePrices from './TradePrices.vue'
import TradeNotes from './TradeNotes.vue'
import TradeActions from './TradeActions.vue'
import { useTradeForm } from '../../composables/useTradeForm'

const props = defineProps({
  trade: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['trade-saved', 'trade-cancelled'])

const router = useRouter()

// Use the trade form composable
const {
  formData,
  loading,
  error,
  validationErrors,
  isFormValid,
  uploadScreenshots,
  submitForm,
  resetForm
} = useTradeForm(props.trade)

const isEditing = computed(() => !!props.trade?.id)

// Initialize form data when trade prop changes
onMounted(() => {
  if (props.trade) {
    Object.assign(formData, props.trade)
  }
})

const handleFileUpload = async (files) => {
  try {
    await uploadScreenshots(files)
  } catch (err) {
    console.error('File upload error:', err)
    // Error is already set by the composable
  }
}

const handleSubmit = async () => {
  const result = await submitForm()
  
  if (result) {
    emit('trade-saved', result)
    
    // Show success message and redirect if not in a modal context
    if (!props.trade) {
      resetForm()
      router.push('/trades')
    }
  }
}

const handleCancel = () => {
  emit('trade-cancelled')
  
  if (!props.trade) {
    router.push('/trades')
  }
}
</script>

<style scoped>
.trade-form-container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}

.card {
  background: white;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.card-header {
  background: #f8f9fa;
  padding: 20px;
  border-bottom: 1px solid #dee2e6;
}

.card-header h2 {
  margin: 0;
  color: #333;
  font-size: 24px;
  font-weight: 600;
}

.trade-form {
  padding: 20px;
}

@media (max-width: 767px) {
  .trade-form-container {
    padding: 10px;
  }
  
  .card-header {
    padding: 15px;
  }
  
  .card-header h2 {
    font-size: 20px;
  }
  
  .trade-form {
    padding: 15px;
  }
}
</style>