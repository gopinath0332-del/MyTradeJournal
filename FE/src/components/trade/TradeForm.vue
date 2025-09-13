<!-- TradeForm.vue -->
<template>
    <div class="trade-form">
        <h2>Log New Trade</h2>
        <form @submit.prevent="handleSubmit">
            <div class="form-row">
                <div class="form-group">
                    <label for="symbol">Symbol</label>
                    <input type="text" id="symbol" v-model="trade.symbol" required placeholder="e.g., NIFTY" />
                </div>
                <div class="form-group">
                    <label for="contract">Contract</label>
                    <input type="text" id="contract" v-model="trade.contract" required placeholder="e.g., 20OCT23" />
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
                    <input type="datetime-local" id="entryDate" v-model="trade.entryDate" required
                        @change="calculateHoldingDays" />
                </div>
                <div class="form-group">
                    <label for="exitDate">Exit Date</label>
                    <input type="datetime-local" id="exitDate" v-model="trade.exitDate"
                        @change="calculateHoldingDays" />
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
                <label for="notes">Notes</label>
                <textarea id="notes" v-model="trade.notes" rows="4"
                    placeholder="Add your trade notes here..."></textarea>
            </div>

            <div class="form-group">
                <label for="notes">Notes</label>
                <textarea id="notes" v-model="trade.notes" rows="4"
                    placeholder="Add your trade notes here..."></textarea>
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

            <button type="submit" class="submit-button">Log Trade</button>
        </form>
    </div>
</template>

<script setup>
import { ref } from 'vue'

const trade = ref({
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

const resetForm = () => {
    trade.value = {
        symbol: '',
        contract: '',
        type: '',
        entryPrice: null,
        exitPrice: null,
        entryDate: '',
        exitDate: '',
        lots: 2,
        daysHeld: 0,
        capitalUsed: null
    }
}

const pnl = ref({
    amount: 0,
    percentage: 0
})

const calculateHoldingDays = () => {
    if (trade.value.entryDate && trade.value.exitDate) {
        const entry = new Date(trade.value.entryDate)
        const exit = new Date(trade.value.exitDate)
        const diffTime = Math.abs(exit - entry)
        trade.value.daysHeld = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    } else {
        trade.value.daysHeld = 0
    }
}

const calculatePnL = () => {
    if (trade.value.entryPrice && trade.value.exitPrice && trade.value.lots && trade.value.capitalUsed) {
        const priceDiff = trade.value.exitPrice - trade.value.entryPrice
        const multiplier = trade.value.type === 'SELL' ? -1 : 1

        // Calculate P&L amount
        pnl.value.amount = priceDiff * trade.value.lots * multiplier

        // Calculate return percentage
        updateReturnFromPnL()
    } else {
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

const handleScreenshotUpload = (event) => {
    // Convert FileList to array and store
    trade.value.screenshots = Array.from(event.target.files)
}

const handleSubmit = async () => {
    try {
        // For now, store in localStorage
        const trades = JSON.parse(localStorage.getItem('trades') || '[]')
        trades.push({
            ...trade.value,
            id: Date.now(), // Simple unique ID
            createdAt: new Date().toISOString()
        })
        localStorage.setItem('trades', JSON.stringify(trades))

        // Reset form
        trade.value = {
            symbol: '',
            type: '',
            entryPrice: null,
            exitPrice: null,
            entryDate: '',
            exitDate: '',
            lots: 2, // Keeping default value
            daysHeld: 0,
            capitalUsed: null,
            notes: ''
        }

        // Reset P&L values
        pnl.value = {
            amount: 0,
            percentage: 0
        }
    } catch (error) {
        console.error('Error saving trade:', error)
    }
}
</script>

<style scoped>
.trade-form {
    max-width: 800px;
    margin: 0 auto;
    padding: 20px;
}

.form-group {
    margin-bottom: 20px;
}

.form-row {
    display: flex;
    gap: 20px;
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
input[type="datetime-local"],
select,
textarea {
    width: 100%;
    padding: 8px;
    border: 1px solid #ddd;
    border-radius: 4px;
    font-size: 16px;
}

textarea {
    resize: vertical;
}

.submit-button {
    background-color: #42b883;
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    width: 100%;
    transition: all 0.25s;
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
    padding: 20px;
    margin: 20px 0;
}

.trade-summary h3 {
    margin: 0 0 15px 0;
    color: #1e293b;
}

.summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px 0;
    border-bottom: 1px solid #e2e8f0;
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
</style>
