<template>
  <div v-if="isOpen" class="modal-overlay" @click.self="close">
    <div class="modal-content">
      <div class="modal-header">
        <h3>📥 Import Orders (Zerodha Kite)</h3>
        <button class="close-btn" @click="close">&times;</button>
      </div>

      <div class="modal-body">
        <!-- File Selector -->
        <div v-if="!parsedTrades.length" class="upload-section">
          <div class="upload-box" @click="$refs.fileInput.click()">
            <span class="upload-icon">📄</span>
            <p>Click to select Zerodha orders CSV file</p>
            <input
              ref="fileInput"
              type="file"
              accept=".csv"
              style="display: none"
              @change="handleFileSelect"
            >
          </div>
        </div>

        <!-- Preview List -->
        <div v-else class="preview-section">
          <div class="import-summary">
            <div class="summary-card">
              <span class="label">Total Trades</span>
              <span class="value">{{ parsedTrades.length }}</span>
            </div>
            <div class="summary-card">
              <span class="label">Buy Orders</span>
              <span class="value">{{ stats.buyCount }}</span>
            </div>
            <div class="summary-card">
              <span class="label">Sell Orders</span>
              <span class="value">{{ stats.sellCount }}</span>
            </div>
            <div class="summary-card primary">
              <span class="label">Total Capital Invested</span>
              <span class="value">{{ currencySymbol }}{{ stats.totalCapital.toLocaleString() }}</span>
            </div>
          </div>

          <!-- Global Settings -->
          <div class="global-settings">
            <div class="form-group">
              <label for="global-strategy">Set Strategy for All Trades</label>
              <select id="global-strategy" v-model="defaultStrategy" @change="applyStrategyToAll">
                <option v-for="s in strategies" :key="s" :value="s">{{ s }}</option>
              </select>
            </div>
            <div class="form-group">
              <label for="global-funding">Set Funding Type for All Trades</label>
              <select id="global-funding" v-model="defaultFundingType" @change="applyFundingTypeToAll">
                <option value="CASH">Cash</option>
                <option value="MTF">MTF (Margin Trade Funding)</option>
                <option value="MARGIN">Margin</option>
                <option value="MARGIN_PLUS">Margin+</option>
              </select>
            </div>
          </div>

          <div class="table-container">
            <table>
              <thead>
                <tr>
                  <th>Instrument</th>
                  <th>Type</th>
                  <th>Qty</th>
                  <th>Entry Price</th>
                  <th>Exit Price</th>
                  <th>Capital</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(trade, index) in parsedTrades" :key="index">
                  <td>
                    <div class="symbol-info">
                      <div class="symbol-header">
                        <strong>{{ trade.symbol }}</strong>
                        <span v-if="trade.isClosure" class="closure-badge">CLOSURE</span>
                      </div>
                      <span class="trade-date">{{ trade.entryDate }}</span>
                    </div>
                  </td>
                  <td>
                    <span class="type-badge" :class="trade.type.toLowerCase()">
                      {{ trade.type }}
                    </span>
                  </td>
                  <td>{{ trade.lots }}</td>
                  <td>{{ currencySymbol }}{{ trade.entryPrice }}</td>
                  <td>{{ trade.exitPrice ? currencySymbol + trade.exitPrice : '-' }}</td>
                  <td>{{ currencySymbol }}{{ trade.capitalUsed.toLocaleString() }}</td>
                  <td>
                    <div class="row-actions">
                      <button class="btn-edit" @click="editTrade(trade, index)">Edit</button>
                      <button class="btn-remove" @click="removeTrade(index)">&times;</button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-secondary" @click="close">Cancel</button>
        <button v-if="parsedTrades.length" class="btn-secondary danger" @click="clear">Clear All</button>
        <button
          v-if="parsedTrades.length"
          class="btn-primary"
          :disabled="isSaving"
          @click="saveAllTrades"
        >
          {{ isSaving ? 'Saving...' : 'Save All Trades' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, inject } from 'vue'
import { useProfiles } from '@/composables/useProfiles'
import { tradeService } from '../../firebase/tradeService'
import { logger } from '../../utils/logger'
import { v4 as uuidv4 } from 'uuid'
import { loadMTFData, getLeverageBySymbol } from '@/utils/mtfLeverageData'

const isOpen = ref(false)
const isSaving = ref(false)
const parsedTrades = ref([])
const openPositions = ref([])
const defaultStrategy = ref('Donchian')
const defaultFundingType = ref('MTF')
const { currencySymbol, activeProfile, updateProfile } = useProfiles()

const startEditingTrade = inject('startEditingTrade')
const showToast = inject('showToast')
const refreshDashboard = inject('refreshDashboard')

const strategies = [
  'Bharat Market Outperformers',
  'Donchian',
  'Bollinger Bands',
  'Swing-02',
  'RSI-Long',
  '52-Low',
  'Double dip',
  'Weekly momentum',
  'CCI-EMA',
  'RSI+Supertrend',
  'Swing-01'
]

const stats = computed(() => {
  return parsedTrades.value.reduce((acc, trade) => {
    if (trade.type === 'BUY') acc.buyCount++
    if (trade.type === 'SELL') acc.sellCount++
    acc.totalCapital += (trade.entryPrice * trade.lots)
    return acc
  }, { buyCount: 0, sellCount: 0, totalCapital: 0 })
})

const open = async() => {
  isOpen.value = true
  await Promise.all([
    fetchOpenPositions(),
    loadMTFData()
  ])
}

const fetchOpenPositions = async() => {
  try {
    const trades = await tradeService.getFilteredTrades({ status: 'OPEN' })
    openPositions.value = trades || []
  } catch (err) {
    logger.error('Failed to fetch open positions', 'OrderImport', err)
  }
}

const close = () => {
  isOpen.value = false
  if (!parsedTrades.value.length) {
    clear()
  }
}

const clear = () => {
  parsedTrades.value = []
}

const applyStrategyToAll = () => {
  parsedTrades.value.forEach(t => {
    t.strategy = defaultStrategy.value
  })
}

const applyFundingTypeToAll = () => {
  parsedTrades.value.forEach(t => {
    t.fundingType = defaultFundingType.value
    updateTradeFunding(t)
  })
}

const normalizeDate = (dateStr) => {
  if (!dateStr) return ''

  // 1. Already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr

  // 2. Handle DD-MM-YYYY or DD/MM/YYYY
  const dmYMatch = dateStr.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})$/)
  if (dmYMatch) {
    const [_, day, month, year] = dmYMatch
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
  }

  // 3. Fallback attempt with native Date
  const d = new Date(dateStr)
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0]
  }

  return dateStr // Return as-is if no format matches
}

const calculateTradePnL = (trade) => {
  if (!trade.exitPrice) return { amount: 0, percentage: 0 }

  const multiplier = trade.type === 'SELL' ? -1 : 1
  const grossPnL = (trade.exitPrice - trade.entryPrice) * trade.lots * (trade.lotMultiplier || 1) * multiplier
  const interestPaid = parseFloat((trade.interestPaid || 0).toString())
  const pnlAmount = grossPnL - interestPaid
  const pnlPercentage = trade.capitalUsed > 0 ? (pnlAmount / trade.capitalUsed) * 100 : 0

  return {
    amount: parseFloat(pnlAmount.toFixed(2)),
    percentage: parseFloat(pnlPercentage.toFixed(2))
  }
}

const calculateHoldingDays = (entryDate, exitDate) => {
  if (!entryDate || !exitDate) return 0
  const entry = new Date(entryDate)
  const exit = new Date(exitDate)
  const diffTime = Math.abs(exit - entry)
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

const handleFileSelect = (event) => {
  const file = event.target.files[0]
  if (!file) return

  const reader = new FileReader()
  reader.onload = (e) => {
    const text = e.target.result
    processCSV(text)
  }
  reader.readAsText(file)
}

const processCSV = (text) => {
  const lines = text.split(/\r?\n/)
  if (lines.length < 2) return

  const orders = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    const parts = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || []
    const cleanParts = parts.map(p => p.replace(/^"|"$/g, ''))

    if (cleanParts.length < 6) continue

    const [time, type, instrument, product, qtyStr, avgPriceStr] = cleanParts
    const qtyParts = qtyStr.split('/')
    const qty = parseFloat(qtyParts[qtyParts.length - 1]) || 0
    const avgPrice = parseFloat(avgPriceStr) || 0

    if (qty > 0) {
      orders.push({ time, type: type.toUpperCase(), symbol: instrument, qty, avgPrice })
    }
  }

  consolidateOrders(orders)
}

const consolidateOrders = (orders) => {
  const groups = {}
  orders.forEach(order => {
    if (!groups[order.symbol]) groups[order.symbol] = []
    groups[order.symbol].push(order)
  })

  const trades = []
  Object.keys(groups).forEach(symbol => {
    const symbolOrders = groups[symbol]
    const buys = symbolOrders.filter(o => o.type === 'BUY')
    const sells = symbolOrders.filter(o => o.type === 'SELL')

    const totalBuyQty = buys.reduce((sum, o) => sum + o.qty, 0)
    const totalSellQty = sells.reduce((sum, o) => sum + o.qty, 0)

    const avgBuyPrice = totalBuyQty > 0
      ? buys.reduce((sum, o) => sum + (o.avgPrice * o.qty), 0) / totalBuyQty
      : 0

    const avgSellPrice = totalSellQty > 0
      ? sells.reduce((sum, o) => sum + (o.avgPrice * o.qty), 0) / totalSellQty
      : 0

    if (totalBuyQty > 0 && totalSellQty === 0) {
      trades.push(createTradeObj(symbol, 'BUY', totalBuyQty, avgBuyPrice, null, buys[0].time))
    } else if (totalSellQty > 0 && totalBuyQty === 0) {
      const openMatch = openPositions.value.find(p => p.symbol === symbol && p.status === 'OPEN')

      if (openMatch) {
        trades.push(createClosureObj(openMatch, avgSellPrice, sells[0].time))
      } else {
        trades.push(createTradeObj(symbol, 'SELL', totalSellQty, avgSellPrice, null, sells[0].time))
      }
    } else if (totalBuyQty === totalSellQty) {
      trades.push(createTradeObj(symbol, 'BUY', totalBuyQty, avgBuyPrice, avgSellPrice, buys[0].time, sells[0].time))
    } else {
      if (totalBuyQty > 0) trades.push(createTradeObj(symbol, 'BUY', totalBuyQty, avgBuyPrice, null, buys[0].time))
      if (totalSellQty > 0) trades.push(createTradeObj(symbol, 'SELL', totalSellQty, avgSellPrice, null, sells[0].time))
    }
  })

  parsedTrades.value = trades
}

const calculateMTFDetails = (trade) => {
  if (trade.fundingType !== 'MTF') {
    delete trade.mtfLeverage
    delete trade.investedAmount
    delete trade.interestPaid
    return
  }

  const leverage = getLeverageBySymbol(trade.symbol)
  if (leverage) {
    trade.mtfLeverage = leverage
    const investedAmount = trade.capitalUsed / leverage
    trade.investedAmount = parseFloat(investedAmount.toFixed(2))

    if (trade.status === 'CLOSED') {
      const daysHeld = calculateHoldingDays(trade.entryDate, trade.exitDate)
      const borrowedAmount = trade.capitalUsed - trade.investedAmount
      const dailyRate = 0.0004
      const interestPaid = borrowedAmount * dailyRate * daysHeld
      trade.interestPaid = parseFloat(interestPaid.toFixed(2))
    }
  }
}

const createTradeObj = (symbol, type, lots, entryPrice, exitPrice, entryTime, exitTime) => {
  const capitalUsed = parseFloat((entryPrice * lots).toFixed(2))
  const fundingType = defaultFundingType.value
  const trade = {
    tradeId: uuidv4(),
    symbol,
    type,
    lots,
    lotMultiplier: 1,
    entryPrice: parseFloat(entryPrice.toFixed(4)),
    exitPrice: exitPrice ? parseFloat(exitPrice.toFixed(4)) : null,
    entryDate: normalizeDate(entryTime ? entryTime.split(' ')[0] : new Date().toISOString().split('T')[0]),
    exitDate: normalizeDate(exitTime ? exitTime.split(' ')[0] : ''),
    capitalUsed,
    status: exitPrice ? 'CLOSED' : 'OPEN',
    strategy: defaultStrategy.value,
    fundingType,
    notes: 'Imported from Zerodha Kite',
    isNew: true
  }

  calculateMTFDetails(trade)

  if (trade.status === 'CLOSED') {
    const pnl = calculateTradePnL(trade)
    trade.pnlAmount = pnl.amount
    trade.pnlPercentage = pnl.percentage
    trade.daysHeld = calculateHoldingDays(trade.entryDate, trade.exitDate)
  }

  return trade
}

const createClosureObj = (existingTrade, exitPrice, exitTime) => {
  const exitDate = normalizeDate(exitTime ? exitTime.split(' ')[0] : new Date().toISOString().split('T')[0])

  const trade = {
    ...existingTrade,
    exitPrice: parseFloat(exitPrice.toFixed(4)),
    exitDate,
    status: 'CLOSED',
    isClosure: true,
    notes: (existingTrade.notes || '') + '\n[Imported exit from Zerodha]'
  }

  const pnl = calculateTradePnL(trade)
  trade.pnlAmount = pnl.amount
  trade.pnlPercentage = pnl.percentage
  trade.daysHeld = calculateHoldingDays(trade.entryDate, trade.exitDate)

  calculateMTFDetails(trade)

  return trade
}

const updateTradeFunding = (trade) => {
  calculateMTFDetails(trade)
}

const decrementTradeCounter = async() => {
  const profile = activeProfile.value
  const isCounterEnabled = profile?.settings?.showTradeCounter === true
  if (!profile?.id || !isCounterEnabled) return

  const max = profile.settings?.tradeCounterMax || 100
  const current = profile.settings?.tradeCounter ?? max
  const newCount = Math.max(0, current - 1)

  try {
    await updateProfile(profile.id, {
      settings: {
        ...profile.settings,
        tradeCounter: newCount,
        tradeCounterMax: max
      }
    })
  } catch (err) {
    logger.error('Error decrementing trade counter', 'OrderImport', err)
  }
}

const saveAllTrades = async() => {
  if (!confirm(`Are you sure you want to save all ${parsedTrades.value.length} trades?`)) return

  isSaving.value = true
  let savedCount = 0

  try {
    for (const trade of parsedTrades.value) {
      if (trade.isClosure && trade.id) {
        await tradeService.updateTrade(trade.id, trade)
      } else {
        await tradeService.addTrade(trade)
        await decrementTradeCounter()
      }
      savedCount++
    }

    showToast('success', 'Import Successful', `Successfully processed ${savedCount} trades.`)
    refreshDashboard()
    close()
  } catch (error) {
    logger.error('Error in bulk save', 'OrderImport', error)
    showToast('error', 'Import Failed', 'An error occurred while saving trades. Some trades may have been saved.')
  } finally {
    isSaving.value = false
  }
}

const editTrade = (trade, index) => {
  startEditingTrade(trade)
}

const removeTrade = (index) => {
  parsedTrades.value.splice(index, 1)
}

defineExpose({ open })
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 12px;
  width: 100%;
  max-width: 900px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.25rem;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  color: #9ca3af;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.upload-section {
  padding: 3rem;
  display: flex;
  justify-content: center;
}

.upload-box {
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  padding: 2.5rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  width: 100%;
  max-width: 400px;
}

.upload-box:hover {
  border-color: #3b82f6;
  background: #f0f9ff;
}

.upload-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
  display: block;
}

.import-summary {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.summary-card {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #e5e7eb;
  display: flex;
  flex-direction: column;
}

.summary-card.primary {
  background: #eff6ff;
  border-color: #bfdbfe;
}

.summary-card .label {
  font-size: 0.75rem;
  color: #6b7280;
  text-transform: uppercase;
  font-weight: 600;
}

.summary-card .value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #111827;
}

.global-settings {
  background: #fdf2f8;
  padding: 1rem;
  border-radius: 8px;
  border: 1px solid #fbcfe8;
  margin-bottom: 1.5rem;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

@media (max-width: 600px) {
  .global-settings {
    grid-template-columns: 1fr;
  }
}

.global-settings .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.global-settings label {
  font-size: 0.875rem;
  font-weight: 600;
  color: #9d174d;
}

.global-settings select {
  padding: 0.6rem;
  border: 1px solid #f9a8d4;
  border-radius: 6px;
  font-size: 0.9rem;
}

.table-container {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  overflow: hidden;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.875rem;
}

th {
  background: #f9fafb;
  padding: 0.75rem 1rem;
  text-align: left;
  font-weight: 600;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
}

td {
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  vertical-align: middle;
}

.symbol-info {
  display: flex;
  flex-direction: column;
}

.symbol-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.closure-badge {
  background: #ede9fe;
  color: #5b21b6;
  font-size: 0.6rem;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;
  font-weight: 700;
  border: 1px solid #ddd6fe;
}

.trade-date {
  font-size: 0.7rem;
  color: #6b7280;
  margin-top: 2px;
}

.type-badge {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.type-badge.buy { background: #dcfce7; color: #166534; }
.type-badge.sell { background: #fee2e2; color: #991b1b; }

.row-actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.btn-edit {
  background: #f3f4f6;
  color: #374151;
  border: 1px solid #d1d5db;
  padding: 0.4rem 0.8rem;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.btn-remove {
  background: none;
  border: none;
  color: #ef4444;
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0 0.5rem;
}

.modal-footer {
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
}

.btn-secondary {
  padding: 0.6rem 1.2rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 500;
}

.btn-secondary.danger {
  color: #dc2626;
  border-color: #fecaca;
}

.btn-primary {
  padding: 0.6rem 1.2rem;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: background 0.2s;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-primary:disabled {
  background: #9ca3af;
  cursor: not-allowed;
}

</style>
