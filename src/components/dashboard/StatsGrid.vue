<template>
  <div class="stats-grid" style="position: relative;">
    <!-- Loading overlay for stats -->
    <div v-if="isLoading" class="dashboard-loader-overlay">
      <div class="dashboard-spinner"></div>
    </div>

    <!-- Error state -->
    <div v-else-if="error" class="dashboard-loader-overlay">
      <div class="dashboard-error-card">
        <div class="dashboard-error-icon">⚠️</div>
        <div class="dashboard-error-message">{{ error }}</div>
        <button v-if="onRetry" @click="onRetry" class="dashboard-retry-button">
          Try Again
        </button>
      </div>
    </div>
    
    <div class="stat-card">
      <div class="stat-title">Total Trading Days</div>
      <div class="stat-value">{{ stats.tradingDays }}</div>
    </div>
    <div class="stat-card profit">
      <div class="stat-title">Winning Days</div>
      <div class="stat-value">{{ stats.winDays }}</div>
    </div>
    <div class="stat-card loss">
      <div class="stat-title">Loss Days</div>
      <div class="stat-value">{{ stats.lossDays }}</div>
    </div>
    <div class="stat-card streak-win">
      <div class="stat-title">Max Win Streak</div>
      <div class="stat-value">{{ stats.maxWinStreak }} days</div>
    </div>
    <div class="stat-card streak-loss">
      <div class="stat-title">Max Loss Streak</div>
      <div class="stat-value">{{ stats.maxLossStreak }} days</div>
    </div>
    <div class="stat-card win-rate">
      <div class="stat-title">Win Rate</div>
      <div class="stat-value">{{ stats.winRate }}%</div>
    </div>
    <div class="stat-card max-profit">
      <div class="stat-title">Max Profit in a Day</div>
      <div class="stat-value">₹{{ stats.maxProfitDay }}</div>
    </div>
    <div class="stat-card max-loss">
      <div class="stat-title">Max Loss in a Day</div>
      <div class="stat-value">₹{{ stats.maxLossDay }}</div>
    </div>
    <div class="stat-card avg-profit">
      <div class="stat-title">Avg Profit per Day</div>
      <div class="stat-value">₹{{ stats.avgProfitDay }}</div>
    </div>
    <div class="stat-card avg-loss">
      <div class="stat-title">Avg Loss per Day</div>
      <div class="stat-value">₹{{ stats.avgLossDay }}</div>
    </div>
    <div class="stat-card total-profit">
      <div class="stat-title">Total Profit</div>
      <div class="stat-value">₹{{ stats.totalProfit }}</div>
    </div>
    <div class="stat-card total-loss">
      <div class="stat-title">Total Loss</div>
      <div class="stat-value">₹{{ stats.totalLoss }}</div>
    </div>
    <div class="stat-card net-pnl">
      <div class="stat-title">Net P&L</div>
      <div class="stat-value" :class="{ 'dashboard-text-positive': stats.netPnL > 0, 'dashboard-text-negative': stats.netPnL < 0 }">₹{{ stats.netPnL }}</div>
    </div>
    <div class="stat-card avg-daily-pnl">
      <div class="stat-title">Avg Daily P&L</div>
      <div class="stat-value" :class="{ 'dashboard-text-positive': stats.avgDailyPnL > 0, 'dashboard-text-negative': stats.avgDailyPnL < 0 }">₹{{ stats.avgDailyPnL }}</div>
    </div>
  </div>
</template>

<script setup>
import '../../styles/dashboard.css'

const props = defineProps({
  stats: {
    type: Object,
    required: true,
    default: () => ({
      tradingDays: 0,
      winDays: 0,
      lossDays: 0,
      maxWinStreak: 0,
      maxLossStreak: 0,
      winRate: 0,
      maxProfitDay: 0,
      maxLossDay: 0,
      avgProfitDay: 0,
      avgLossDay: 0,
      totalProfit: 0,
      totalLoss: 0,
      netPnL: 0,
      avgDailyPnL: 0
    })
  },
  isLoading: {
    type: Boolean,
    default: false
  },
  error: {
    type: String,
    default: null
  },
  onRetry: {
    type: Function,
    default: null
  }
})
</script>

<style scoped>
.stats-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-top: 16px;
  max-width: 1400px;
  margin-left: auto;
  margin-right: auto;
  padding: 0 1rem;
}

@media (min-width: 480px) {
  .stats-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 14px;
  }
}

@media (min-width: 768px) {
  .stats-grid {
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-top: 20px;
    padding: 0;
  }
}

@media (min-width: 1024px) {
  .stats-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

.stat-card {
  background-color: #ffffff;
  border: 1px solid var(--border-color);
  border-radius: var(--dashboard-radius-md);
  padding: 16px;
  text-align: center;
  box-shadow: var(--shadow);
  transition: transform var(--dashboard-transition-normal);
  min-height: 80px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

@media (min-width: 768px) {
  .stat-card {
    padding: 20px;
    min-height: 100px;
  }
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-title {
  color: var(--text-muted);
  font-size: 0.8em;
  margin-bottom: 6px;
  line-height: 1.2;
}

@media (min-width: 768px) {
  .stat-title {
    font-size: 0.9em;
    margin-bottom: 8px;
  }
}

.stat-value {
  font-size: 1.4em;
  font-weight: 600;
  color: var(--text-color);
  line-height: 1.1;
}

@media (min-width: 768px) {
  .stat-value {
    font-size: 1.8em;
  }
}

/* Card type variants */
.stat-card.profit {
  border-left: 4px solid var(--primary-color);
}

.stat-card.loss {
  border-left: 4px solid var(--danger-color);
}

.stat-card.streak-win {
  border-left: 4px solid #4CAF50;
}

.stat-card.streak-loss {
  border-left: 4px solid #FF9800;
}

.stat-card.win-rate {
  border-left: 4px solid #2196F3;
}

.stat-card.max-profit {
  border-left: 4px solid var(--dashboard-success);
}

.stat-card.max-loss {
  border-left: 4px solid #D32F2F;
}

.stat-card.avg-profit {
  border-left: 4px solid #4CAF50;
}

.stat-card.avg-loss {
  border-left: 4px solid #F44336;
}

.stat-card.total-profit {
  border-left: 4px solid var(--dashboard-success);
}

.stat-card.total-loss {
  border-left: 4px solid var(--dashboard-danger);
}

.stat-card.net-pnl {
  border-left: 4px solid #1976D2;
}

.stat-card.avg-daily-pnl {
  border-left: 4px solid #0D47A1;
}
</style>