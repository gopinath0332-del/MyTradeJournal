<!-- TradeForm.vue -->
<template>
    <div class="trade-form">
        <h2>Log New Trade</h2>
        <form @submit.prevent="handleSubmit">
            <div class="form-group">
                <label for="symbol">Symbol</label>
                <input type="text" id="symbol" v-model="trade.symbol" required placeholder="e.g., AAPL" />
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="entryPrice">Entry Price</label>
                    <input type="number" id="entryPrice" v-model="trade.entryPrice" required step="0.01" />
                </div>
                <div class="form-group">
                    <label for="exitPrice">Exit Price</label>
                    <input type="number" id="exitPrice" v-model="trade.exitPrice" step="0.01" />
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="entryDate">Entry Date/Time</label>
                    <input type="datetime-local" id="entryDate" v-model="trade.entryDate" required />
                </div>
                <div class="form-group">
                    <label for="exitDate">Exit Date/Time</label>
                    <input type="datetime-local" id="exitDate" v-model="trade.exitDate" />
                </div>
            </div>

            <div class="form-group">
                <label for="strategy">Strategy</label>
                <select id="strategy" v-model="trade.strategy" required>
                    <option value="">Select a strategy</option>
                    <option value="Turtle">Turtle</option>
                    <option value="Donchian">Donchian</option>
                    <option value="SuperTrend">SuperTrend</option>
                    <option value="Other">Other</option>
                </select>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="riskRewardRatio">Risk:Reward Ratio</label>
                    <input type="number" id="riskRewardRatio" v-model="trade.riskRewardRatio" step="0.01" required />
                </div>
                <div class="form-group">
                    <label for="positionSize">Position Size</label>
                    <input type="number" id="positionSize" v-model="trade.positionSize" required />
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="investedAmount">Invested Amount</label>
                    <div class="input-with-prefix">
                        <span class="currency-prefix">₹</span>
                        <input type="number" id="investedAmount" v-model="trade.investedAmount" step="0.01" required
                            @input="validateAmount($event); calculateValues()" placeholder="0.00" min="0" />
                    </div>
                </div>
                <div class="form-group">
                    <label for="totalValue">Total Value</label>
                    <div class="input-with-prefix">
                        <span class="currency-prefix">₹</span>
                        <input type="text" id="totalValue" :value="formatCurrency(totalValue).replace('₹', '')"
                            disabled />
                    </div>
                </div>
            </div>

            <div class="form-row">
                <div class="form-group">
                    <label for="tradeStatus">Trade Status</label>
                    <select id="tradeStatus" v-model="trade.status" required :class="{
                        'status-profit': trade.status === 'PROFIT',
                        'status-loss': trade.status === 'LOSS',
                        'status-breakeven': trade.status === 'BREAKEVEN'
                    }">
                        <option value="">Select status</option>
                        <option value="PROFIT">Profit</option>
                        <option value="LOSS">Loss</option>
                        <option value="BREAKEVEN">Breakeven</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Profit/Loss Summary</label>
                    <div class="profit-loss-summary"
                        :class="{ 'profit': profitLoss.amount > 0, 'loss': profitLoss.amount < 0 }">
                        <div class="pl-details">
                            <div class="pl-row">
                                <span>Amount:</span>
                                <span class="pl-amount">{{ formatCurrency(profitLoss.amount) }}</span>
                            </div>
                            <div class="pl-row">
                                <span>% of Investment:</span>
                                <span class="pl-percentage">{{ profitLoss.percentage.toFixed(2) }}%</span>
                            </div>
                        </div>
                    </div>
                </div>
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

const trade = ref({
    symbol: '',
    entryPrice: null,
    exitPrice: null,
    entryDate: '',
    exitDate: '',
    strategy: '',
    riskRewardRatio: null,
    positionSize: null,
    investedAmount: null,
    status: '',
    notes: '',
    screenshots: [],
    confidence: 3,
    executionQuality: 3,
    lessonsLearned: ''
})

const totalValue = ref(0)
const profitLoss = ref({ amount: 0, percentage: 0 })

const validateAmount = (event) => {
    const value = event.target.value
    if (value < 0) {
        event.target.value = 0
        trade.value.investedAmount = 0
    }
}

const calculateValues = () => {
    if (trade.value.investedAmount && trade.value.exitPrice && trade.value.entryPrice) {
        // Calculate total value
        const percentageChange = ((trade.value.exitPrice - trade.value.entryPrice) / trade.value.entryPrice)
        totalValue.value = trade.value.investedAmount * (1 + percentageChange)

        // Calculate profit/loss
        profitLoss.value.amount = totalValue.value - trade.value.investedAmount
        profitLoss.value.percentage = (profitLoss.value.amount / trade.value.investedAmount) * 100

        // Auto-update trade status based on profit/loss
        if (profitLoss.value.amount > 0) {
            trade.value.status = 'PROFIT'
        } else if (profitLoss.value.amount < 0) {
            trade.value.status = 'LOSS'
        } else {
            trade.value.status = 'BREAKEVEN'
        }
    } else {
        totalValue.value = trade.value.investedAmount || 0
        profitLoss.value = { amount: 0, percentage: 0 }
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
            screenshots: [], // We'll handle file storage later
            createdAt: new Date().toISOString()
        })
        localStorage.setItem('trades', JSON.stringify(trades))

        // Reset form
        trade.value = {
            symbol: '',
            entryPrice: null,
            exitPrice: null,
            entryDate: '',
            exitDate: '',
            strategy: '',
            riskRewardRatio: null,
            positionSize: null,
            investedAmount: null,
            notes: '',
            screenshots: [],
            confidence: 3,
            executionQuality: 3,
            lessonsLearned: ''
        }
        totalValue.value = 0
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

.pl-percentage {
    font-size: 1.2em;
    opacity: 0.9;
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
