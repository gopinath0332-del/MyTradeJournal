<!-- TradeForm.vue -->
<template>
    <div class="trade-form">
        <h2>{{ trade.id ? 'Edit Trade' : 'Log New Trade' }}</h2>
        <div class="toast" v-if="showToastOverlay" :class="toastVariant">
            <div class="toast-header">
                <strong>{{ toastTitle }}</strong>
                <button type="button" class="close-button" @click="showToastOverlay = false">&times;</button>
            </div>
            <div class="toast-body">
                {{ toastMessage }}
            </div>
        </div>
        <form @submit.prevent="handleSubmit">
            <div class="form-grid">
                <div class="form-field">
                    <label for="symbol">Symbol</label>
                    <input type="text" id="symbol" v-model="trade.symbol" @input="handleSymbolInput" required
                        placeholder="e.g., NIFTY" />
                </div>
                <div class="form-field">
                    <label for="contract">Contract (Optional)</label>
                    <input type="text" id="contract" v-model="trade.contract" @input="handleContractInput"
                        placeholder="e.g., 20OCT23" />
                </div>
                <div class="form-group">
                    <label for="tradeType">Type</label>
                    <select id="tradeType" v-model="trade.type" required :class="{
                        'type-buy': trade.type === 'BUY',
                        'type-sell': trade.type === 'SELL'
                    }">
                        <option value="">Select type</option>
                        <option value="BUY">Buy</option>
                        <option value="SELL">Sell</option>
                    </select>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="entryDate">Entry Date</label>
                    <input type="date" id="entryDate" v-model="trade.entryDate" required
                        @change="calculateHoldingDays" />
                </div>
                <div class="form-group">
                    <label for="exitDate">Exit Date (Optional)</label>
                    <input type="date" id="exitDate" v-model="trade.exitDate" @change="calculateHoldingDays"
                        :max="new Date().toISOString().slice(0, 10)" />
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="entryPrice">Entry Price</label>
                    <div class="input-with-prefix">
                        <span class="currency-prefix">₹</span>
                        <input type="number" id="entryPrice" v-model="trade.entryPrice" required step="0.01"
                            @input="calculatePnL" />
                    </div>
                </div>
                <div class="form-group">
                    <label for="exitPrice">Exit Price</label>
                    <div class="input-with-prefix">
                        <span class="currency-prefix">₹</span>
                        <input type="number" id="exitPrice" v-model="trade.exitPrice" step="0.01"
                            @input="calculatePnL" />
                    </div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="lots">Lots</label>
                    <input type="number" id="lots" v-model="trade.lots" required min="1" step="1"
                        @input="calculatePnL" />
                </div>
                <div class="form-group">
                    <label for="daysHeld">Days Held</label>
                    <input type="number" id="daysHeld" :value="trade.daysHeld" disabled />
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="capitalUsed">Capital Used</label>
                    <div class="input-with-prefix">
                        <span class="currency-prefix">₹</span>
                        <input type="number" id="capitalUsed" v-model="trade.capitalUsed" required step="0.01" min="0"
                            @input="calculatePnL" />
                    </div>
                </div>
            </div>

            <div class="trade-summary">
                <h3>Trade Summary</h3>
                <div class="summary-row">
                    <div class="summary-label">P&L Amount:</div>
                    <div class="summary-value">
                        <div class="input-with-prefix">
                            <span class="currency-prefix">₹</span>
                            <input type="number" v-model="pnl.amount" step="0.01" @input="updateReturnFromPnL"
                                :class="{ 'profit': pnl.amount > 0, 'loss': pnl.amount < 0 }" />
                        </div>
                    </div>
                </div>
                <div class="summary-row">
                    <div class="summary-label">Return %:</div>
                    <div class="summary-value" :class="{ 'profit': pnl.percentage > 0, 'loss': pnl.percentage < 0 }">
                        {{ pnl.percentage.toFixed(2) }}%
                    </div>
                </div>
            </div>

            <div class="form-group">
                <label for="screenshot">Screenshots</label>
                <input type="file" id="screenshot" @change="handleScreenshotUpload" multiple accept="image/*" />
            </div>

            <div class="form-group">
                <label for="confidence">Confidence Level (1-5)</label>
                <input type="range" id="confidence" v-model="trade.confidence" min="1" max="5" step="1" />
                <span>{{ trade.confidence }}</span>
            </div>

            <div class="form-group">
                <label for="executionQuality">Execution Quality (1-5)</label>
                <input type="range" id="executionQuality" v-model="trade.executionQuality" min="1" max="5" step="1" />
                <span>{{ trade.executionQuality }}</span>
            </div>

            <div class="form-group">
                <label for="lessonsLearned">Lessons Learned</label>
                <textarea id="lessonsLearned" v-model="trade.lessonsLearned" rows="4"
                    placeholder="What did you learn from this trade?"></textarea>
            </div>

            <button type="submit" class="submit-button" :disabled="isSubmitting">
                <span v-if="isSubmitting">
                    <span class="spinner-small"></span>
                    {{ trade.id ? 'Saving...' : 'Logging...' }}
                </span>
                <span v-else>{{ trade.id ? 'Save Changes' : 'Log Trade' }}</span>
            </button>
        </form>
    </div>
</template>

<script setup>
import { ref, inject, watch, onMounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import { tradeService } from '../../firebase/tradeService'

// Loading state
const isSubmitting = ref(false)

const editingTrade = inject('editingTrade')
const activeTab = inject('activeTab')
const refreshDashboard = inject('refreshDashboard')

const toastVariant = ref('success')
const toastTitle = ref('')
const toastMessage = ref('')
const showToastOverlay = ref(false)

const onToastHidden = () => {
    showToastOverlay.value = false
}

const showToast = (variant, title, message) => {
    toastVariant.value = variant
    toastTitle.value = title
    toastMessage.value = message
    showToastOverlay.value = true
    setTimeout(() => {
        showToastOverlay.value = false
    }, 5000)
}

const trade = ref({
    tradeId: uuidv4(),
    symbol: '',
    contract: '',
    type: '',
    entryPrice: null,
    exitPrice: null,
    entryDate: '',
    exitDate: '',
    lots: 2,
    daysHeld: 0,
    capitalUsed: null,
    notes: '',
    confidence: 3,
    executionQuality: 3,
    lessonsLearned: ''
})

// Watch for changes in editingTrade and update form
watch(editingTrade, (newTrade) => {
    if (newTrade) {
        trade.value = { ...newTrade }
    }
})

// Clear form when switching tabs
watch(activeTab, (newTab) => {
    if (newTab === 'trade' && !editingTrade.value) {
        resetForm()
    }
})

// Currency formatter for Indian Rupees
const formatCurrency = (amount) => {
    if (amount === null || amount === undefined) return ''
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    }).format(amount)
}

const pnl = ref({
    amount: 0,
    percentage: 0
})

const calculateHoldingDays = () => {
    if (trade.value.entryDate) {
        const entry = new Date(trade.value.entryDate)
        const exit = trade.value.exitDate ? new Date(trade.value.exitDate) : new Date()
        const diffTime = Math.abs(exit - entry)
        trade.value.daysHeld = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } else {
        trade.value.daysHeld = 0
    }
}

const calculatePnL = () => {
    if (!editingTrade.value?.pnlAmount && trade.value.entryPrice && trade.value.lots && trade.value.capitalUsed) {
        // If exit price is not set, use 0 for P&L calculation
        const exitPrice = trade.value.exitPrice || trade.value.entryPrice
        const priceDiff = exitPrice - trade.value.entryPrice
        const multiplier = trade.value.type === 'SELL' ? -1 : 1

        // Calculate P&L amount
        pnl.value.amount = priceDiff * trade.value.lots * multiplier

        // Calculate return percentage
        updateReturnFromPnL()
    } else if (!editingTrade.value?.pnlAmount) {
        pnl.value.amount = 0
        pnl.value.percentage = 0
    }
}



const updateReturnFromPnL = () => {
    if (trade.value.capitalUsed && pnl.value.amount) {
        pnl.value.percentage = (pnl.value.amount / trade.value.capitalUsed) * 100
    } else {
        pnl.value.percentage = 0
    }
}

const handleSymbolInput = (event) => {
    trade.value.symbol = event.target.value.toUpperCase();
}

const handleContractInput = (event) => {
    trade.value.contract = event.target.value.toUpperCase();
}

const handleScreenshotUpload = (event) => {
    // Convert FileList to array and store
    trade.value.screenshots = Array.from(event.target.files)
}

const resetForm = () => {
    trade.value = {
        tradeId: uuidv4(),
        symbol: '',
        contract: '',
        type: '',
        entryPrice: null,
        exitPrice: null,
        entryDate: '',
        exitDate: '',
        lots: 2,
        daysHeld: 0,
        capitalUsed: null,
        notes: '',
        confidence: 3,
        executionQuality: 3,
        lessonsLearned: ''
    }

    pnl.value = {
        amount: 0,
        percentage: 0
    }
}

const handleSubmit = async () => {
    isSubmitting.value = true
    try {
        // Prepare trade data
        const tradeData = {
            ...trade.value,
            pnlAmount: pnl.value.amount,
            pnlPercentage: pnl.value.percentage,
            status: trade.value.exitDate ? 'CLOSED' : 'OPEN'
        }

        // If we're editing an existing trade
        if (trade.value.id) {
            await tradeService.updateTrade(trade.value.id, tradeData)
            showToast('success', 'Trade Updated', `Successfully updated trade for ${trade.value.symbol}`)
        } else {
            // Creating a new trade
            await tradeService.addTrade(tradeData)
            showToast('success', 'Trade Added', `Successfully added new trade for ${trade.value.symbol}`)
        }

        // Refresh dashboard data
        refreshDashboard()

        // Clear editing state
        if (editingTrade) {
            editingTrade.value = null
        }
        setTimeout(() => {
            // Switch back to history view
            activeTab.value = 'history'

            // Reset form
            resetForm()
        }, 1000);

    } catch (error) {
        console.error('Error saving trade:', error)
        showToast('danger', 'Error', 'Failed to save trade. Please try again.')
    } finally {
        isSubmitting.value = false
    }
}

onMounted(() => {
    if (editingTrade.value) {
        trade.value = { ...editingTrade.value }
        pnl.value.amount = editingTrade.value.pnlAmount || 0
        pnl.value.percentage = editingTrade.value.pnlPercentage || 0
        calculateHoldingDays()
        calculatePnL()
    }
});
</script>

<style scoped>
.trade-form {
    max-width: 800px;
    margin: 0 auto;
    padding: 1rem;
}

@media (min-width: 768px) {
    .trade-form {
        padding: 20px;
    }
}

.toast-container {
    z-index: 1050;
}

:deep(.b-toast) {
    min-width: 250px;
}

:deep(.toast-body) {
    padding: 0.75rem;
}

.form-group {
    margin-bottom: 1rem;
}

@media (min-width: 768px) {
    .form-group {
        margin-bottom: 20px;
    }
}

.form-row {
    display: flex;
    flex-direction: column;
    gap: 1rem;
}

@media (min-width: 768px) {
    .form-row {
        flex-direction: row;
        gap: 20px;
    }
}

.form-row .form-group {
    flex: 1;
}

label {
    display: block;
    margin-bottom: 5px;
    font-weight: bold;
}

input[type="text"],
input[type="number"],
input[type="date"],
select,
textarea {
    width: 100%;
    padding: 12px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
    box-sizing: border-box;
    -webkit-appearance: none;
    -moz-appearance: none;
    appearance: none;
    min-height: 44px;
}

@media (min-width: 768px) {
    input[type="text"],
    input[type="number"],
    input[type="date"],
    select,
    textarea {
        padding: 8px;
    }
}

textarea {
    resize: vertical;
}

.submit-button {
    background-color: #42b883;
    color: white;
    padding: 14px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    width: 100%;
    transition: all 0.25s;
    min-height: 50px;
    touch-action: manipulation;
}

@media (min-width: 768px) {
    .submit-button {
        padding: 12px 20px;
        min-height: auto;
    }
}

.submit-button:hover {
    background-color: #3aa876;
}

.input-with-prefix {
    position: relative;
    display: flex;
    align-items: center;
}

.type-buy {
    background-color: rgba(66, 184, 131, 0.1) !important;
    color: #42b883 !important;
    border-color: #42b883 !important;
}

.type-sell {
    background-color: rgba(239, 68, 68, 0.1) !important;
    color: #ef4444 !important;
    border-color: #ef4444 !important;
}

select.type-buy option,
select.type-sell option {
    color: #1e293b;
    background-color: #ffffff;
}

.summary-value input {
    width: 100%;
    padding: 8px;
    border: 1px solid #e2e8f0;
    border-radius: 4px;
    font-size: 16px;
    text-align: right;
}

.summary-value input.profit {
    color: #42b883;
    border-color: #42b883;
    background-color: rgba(66, 184, 131, 0.1);
}

.summary-value input.loss {
    color: #ef4444;
    border-color: #ef4444;
    background-color: rgba(239, 68, 68, 0.1);
}

.currency-prefix {
    position: absolute;
    left: 10px;
    color: #64748b;
}

.input-with-prefix input {
    padding-left: 25px;
}

input[disabled] {
    background-color: #f8fafc;
    color: #64748b;
    cursor: not-allowed;
}

.profit-loss {
    padding: 15px;
    border-radius: 8px;
    text-align: center;
    width: 100%;
}

.profit-loss.profit {
    background-color: rgba(66, 184, 131, 0.1);
    color: #42b883;
}

.profit-loss.loss {
    background-color: rgba(239, 68, 68, 0.1);
    color: #ef4444;
}

.pl-details {
    display: flex;
    justify-content: center;
    gap: 15px;
    margin-top: 5px;
}

.pl-amount {
    font-size: 1.2em;
    font-weight: bold;
}

.trade-summary {
    background-color: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem 0;
}

@media (min-width: 768px) {
    .trade-summary {
        padding: 20px;
        margin: 20px 0;
    }
}

.trade-summary h3 {
    margin: 0 0 15px 0;
    color: #1e293b;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 0;
    border-bottom: 1px solid #e2e8f0;
    flex-wrap: wrap;
    gap: 0.5rem;
}

@media (min-width: 768px) {
    .summary-row {
        padding: 10px 0;
        flex-wrap: nowrap;
        gap: 0;
    }
}

.summary-row:last-child {
    border-bottom: none;
}

.summary-label {
    color: #64748b;
    font-weight: 500;
}

.summary-value {
    font-size: 1.1em;
    font-weight: 600;
}

.summary-value.profit {
    color: #42b883;
}

.summary-value.loss {
    color: #ef4444;
}

input[type="number"] {
    appearance: textfield;
    -moz-appearance: textfield;
    -webkit-appearance: textfield;
}

input[type="number"]::-webkit-outer-spin-button,
input[type="number"]::-webkit-inner-spin-button {
    -webkit-appearance: none;
    margin: 0;
}

select[id="tradeStatus"] {
    font-weight: bold;
    padding: 10px;
}

.status-profit {
    color: #42b883;
    border-color: #42b883;
}

.status-loss {
    color: #ef4444;
    border-color: #ef4444;
}

.status-breakeven {
    color: #64748b;
    border-color: #64748b;
}

.profit-loss-summary {
    background-color: #f8fafc;
    padding: 15px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}

.profit-loss-summary.profit {
    background-color: rgba(66, 184, 131, 0.1);
    border-color: #42b883;
}

.profit-loss-summary.loss {
    background-color: rgba(239, 68, 68, 0.1);
    border-color: #ef4444;
}

.pl-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 5px 0;
}

.pl-row:not(:last-child) {
    border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

/* Spinner Styles */
.spinner-small {
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid rgba(255, 255, 255, 0.3);
    border-top: 2px solid white;
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 8px;
}

@keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
}

.submit-button:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}
</style>
