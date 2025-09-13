<!-- EquityCurveChart.vue -->
<script setup>
import { computed } from 'vue'
import { Line } from 'vue-chartjs'
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js'

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
)

const props = defineProps({
    trades: {
        type: Array,
        required: true
    }
})

const chartData = computed(() => {
    // Sort trades by entry date
    const sortedTrades = [...props.trades].sort((a, b) =>
        new Date(a.entryDate) - new Date(b.entryDate)
    )

    // Calculate cumulative equity
    let equity = 1000 // Starting equity
    const equityPoints = sortedTrades.map(trade => {
        const profitLoss = trade.exitPrice && trade.entryPrice
            ? (trade.exitPrice - trade.entryPrice) * trade.positionSize
            : 0
        equity += profitLoss
        return {
            date: new Date(trade.entryDate).toLocaleDateString(),
            equity
        }
    })

    return {
        labels: equityPoints.map(point => point.date),
        datasets: [
            {
                label: 'Equity Curve',
                data: equityPoints.map(point => point.equity),
                borderColor: '#42b883',
                backgroundColor: 'rgba(66, 184, 131, 0.1)',
                fill: true,
                tension: 0.4
            }
        ]
    }
})

const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top'
        },
        title: {
            display: true,
            text: 'Equity Curve'
        }
    },
    scales: {
        y: {
            beginAtZero: false,
            grid: {
                color: 'rgba(0, 0, 0, 0.1)'
            }
        },
        x: {
            grid: {
                display: false
            }
        }
    }
}
</script>

<template>
    <div class="chart-container">
        <Line :data="chartData" :options="chartOptions" />
    </div>
</template>

<style scoped>
.chart-container {
    height: 400px;
    background: white;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #e2e8f0;
}
</style>
