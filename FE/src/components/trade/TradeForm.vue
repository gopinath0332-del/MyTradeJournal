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
    entryPrice: null,
    exitPrice: null,
    entryDate: '',
    exitDate: '',
    strategy: '',
    riskRewardRatio: null,
    positionSize: null,
    notes: '',
    screenshots: [],
    confidence: 3,
    executionQuality: 3,
    lessonsLearned: ''
})

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
            notes: '',
            screenshots: [],
            confidence: 3,
            executionQuality: 3,
            lessonsLearned: ''
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
    background-color: #4CAF50;
    color: white;
    padding: 12px 20px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-size: 16px;
    width: 100%;
}

.submit-button:hover {
    background-color: #45a049;
}
</style>
