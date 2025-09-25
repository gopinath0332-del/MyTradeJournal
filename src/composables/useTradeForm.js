import { ref, computed, reactive, watch } from 'vue'
import { tradeService } from '../../firebase/tradeService'

export function useTradeForm(initialTrade = null) {
  // Form state
  const loading = ref(false)
  const error = ref('')
  const submissionAttempted = ref(false)

  // Form data with reactive object
  const formData = reactive({
    id: '',
    symbol: '',
    contract: '',
    tradeType: '',
    entryDate: '',
    exitDate: '',
    entryPrice: '',
    exitPrice: '',
    quantity: '',
    fees: 0,
    strategy: '',
    confidence: 5,
    notes: '',
    remarks: '',
    lessons: '',
    screenshotUrls: [],
    createdAt: null,
    updatedAt: null
  })

  // Initialize form data
  if (initialTrade) {
    Object.assign(formData, initialTrade)
  }

  // Computed calculations
  const positionSize = computed(() => {
    const { entryPrice, quantity } = formData
    if (!entryPrice || !quantity) return 0
    return parseFloat((entryPrice * quantity).toFixed(2))
  })

  const pnl = computed(() => {
    const { entryPrice, exitPrice, quantity, fees } = formData
    if (!entryPrice || !exitPrice || !quantity) return 0

    const grossPnL = (exitPrice - entryPrice) * quantity
    return parseFloat((grossPnL - (fees || 0)).toFixed(2))
  })

  const pnlPercentage = computed(() => {
    if (!positionSize.value || !pnl.value) return 0
    return parseFloat(((pnl.value / positionSize.value) * 100).toFixed(2))
  })

  const isTradeComplete = computed(() => {
    return formData.exitDate && formData.exitPrice
  })

  // Form validation
  const validationErrors = computed(() => {
    const errors = {}

    if (submissionAttempted.value) {
      if (!formData.symbol.trim()) {
        errors.symbol = 'Symbol is required'
      }

      if (!formData.tradeType) {
        errors.tradeType = 'Trade type is required'
      }

      if (!formData.entryDate) {
        errors.entryDate = 'Entry date is required'
      }

      if (!formData.entryPrice || formData.entryPrice <= 0) {
        errors.entryPrice = 'Valid entry price is required'
      }

      if (!formData.quantity || formData.quantity <= 0) {
        errors.quantity = 'Valid quantity is required'
      }

      if (!formData.strategy) {
        errors.strategy = 'Strategy is required'
      }

      // Date validation - compare only dates, not times
      if (formData.entryDate && formData.exitDate) {
        const entryDate = new Date(`${formData.entryDate}T00:00:00`)
        const exitDate = new Date(`${formData.exitDate}T00:00:00`)

        if (exitDate < entryDate) {
          errors.exitDate = 'Exit date must be on or after entry date'
        }
      }

      // Exit date cannot be in the future (compare only dates)
      if (formData.exitDate) {
        const exitDate = new Date(`${formData.exitDate}T00:00:00`)
        const today = new Date()
        today.setHours(0, 0, 0, 0) // Set to start of today

        if (exitDate > today) {
          errors.exitDate = 'Exit date cannot be in the future'
        }
      }

      // Price validation
      if (formData.exitPrice && formData.exitPrice <= 0) {
        errors.exitPrice = 'Exit price must be greater than 0'
      }

      if (formData.fees < 0) {
        errors.fees = 'Fees cannot be negative'
      }
    }

    return errors
  })

  const isFormValid = computed(() => {
    return Object.keys(validationErrors.value).length === 0 &&
           formData.symbol.trim() &&
           formData.tradeType &&
           formData.entryDate &&
           formData.entryPrice > 0 &&
           formData.quantity > 0 &&
           formData.strategy
  })

  const hasValidationErrors = computed(() => {
    return Object.keys(validationErrors.value).length > 0
  })

  // File upload handling
  const uploadScreenshots = async(files) => {
    if (!files || files.length === 0) return []

    try {
      loading.value = true
      const uploadPromises = Array.from(files).map(file => {
        return tradeService.uploadScreenshot(file)
      })

      const urls = await Promise.all(uploadPromises)
      const currentUrls = formData.screenshotUrls || []
      formData.screenshotUrls = [...currentUrls, ...urls.filter(url => url)]

      return urls
    } catch (err) {
      console.error('Error uploading screenshots:', err)
      throw new Error('Failed to upload screenshots')
    } finally {
      loading.value = false
    }
  }

  // Form submission
  const submitForm = async() => {
    submissionAttempted.value = true
    error.value = ''

    if (!isFormValid.value) {
      error.value = 'Please fill in all required fields correctly'
      return false
    }

    try {
      loading.value = true

      const tradeData = {
        ...formData,
        entryPrice: parseFloat(formData.entryPrice),
        exitPrice: formData.exitPrice ? parseFloat(formData.exitPrice) : null,
        quantity: parseInt(formData.quantity),
        fees: parseFloat(formData.fees) || 0,
        confidence: parseInt(formData.confidence),
        positionSize: positionSize.value,
        pnl: isTradeComplete.value ? pnl.value : null,
        pnlPercentage: isTradeComplete.value ? pnlPercentage.value : null,
        updatedAt: new Date().toISOString()
      }

      let result
      if (formData.id) {
        // Update existing trade
        result = await tradeService.updateTrade(formData.id, tradeData)
      } else {
        // Create new trade
        tradeData.createdAt = new Date().toISOString()
        result = await tradeService.addTrade(tradeData)
      }

      return result
    } catch (err) {
      console.error('Error submitting trade:', err)
      error.value = err.message || 'Failed to save trade'
      return false
    } finally {
      loading.value = false
    }
  }

  // Reset form
  const resetForm = () => {
    Object.assign(formData, {
      id: '',
      symbol: '',
      contract: '',
      tradeType: '',
      entryDate: '',
      exitDate: '',
      entryPrice: '',
      exitPrice: '',
      quantity: '',
      fees: 0,
      strategy: '',
      confidence: 5,
      notes: '',
      remarks: '',
      lessons: '',
      screenshotUrls: [],
      createdAt: null,
      updatedAt: null
    })

    submissionAttempted.value = false
    error.value = ''
  }

  // Watch for changes to clear errors
  watch(formData, () => {
    if (error.value) {
      error.value = ''
    }
  }, { deep: true })

  return {
    // State
    formData,
    loading,
    error,
    submissionAttempted,

    // Computed
    positionSize,
    pnl,
    pnlPercentage,
    isTradeComplete,
    validationErrors,
    isFormValid,
    hasValidationErrors,

    // Methods
    uploadScreenshots,
    submitForm,
    resetForm
  }
}
