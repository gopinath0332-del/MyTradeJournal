import { describe, it, expect, beforeEach, vi } from 'vitest'
import { useTradeForm } from '../../composables/useTradeForm'

// Mock Firebase to avoid issues in tests
vi.mock('../../firebase/config.js', () => ({
  db: {}
}))

vi.mock('../../firebase/tradeService.js', () => ({
  tradeService: {
    addTrade: vi.fn(),
    updateTrade: vi.fn(),
    deleteTrade: vi.fn(),
    getAllTrades: vi.fn(() => Promise.resolve([])),
    getTradesByDateRange: vi.fn(() => Promise.resolve([]))
  }
}))

describe('useTradeForm', () => {
  let tradeForm

  beforeEach(() => {
    tradeForm = useTradeForm()
  })

  it('should initialize with empty form data', () => {
    expect(tradeForm.formData.symbol).toBe('')
    expect(tradeForm.formData.quantity).toBe('')
    expect(tradeForm.formData.entryPrice).toBe('')
  })

  it('should calculate position size correctly', () => {
    tradeForm.formData.entryPrice = '100'
    tradeForm.formData.quantity = '10'
    
    expect(tradeForm.positionSize.value).toBe(1000)
  })

  it('should calculate PnL correctly', () => {
    tradeForm.formData.entryPrice = '100'
    tradeForm.formData.exitPrice = '110'
    tradeForm.formData.quantity = '10'
    tradeForm.formData.fees = 5
    
    expect(tradeForm.pnl.value).toBe(95) // (110-100)*10 - 5 = 95
  })

  it('should calculate PnL percentage correctly', () => {
    tradeForm.formData.entryPrice = '100'
    tradeForm.formData.exitPrice = '110'
    tradeForm.formData.quantity = '10'
    tradeForm.formData.fees = 0
    
    expect(tradeForm.pnlPercentage.value).toBe(10) // 10% gain
  })

  it('should validate required fields', () => {
    tradeForm.submissionAttempted.value = true
    
    const errors = tradeForm.validationErrors.value
    expect(errors.symbol).toBe('Symbol is required')
    expect(errors.tradeType).toBe('Trade type is required')
  })
})