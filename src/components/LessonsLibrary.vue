<template>
  <div class="lessons-library">
    <div class="lessons-header">
      <h2>📚 Trading Lessons Library</h2>
      <p class="subtitle">Learn from your trading experiences and improve your strategy</p>
    </div>

    <!-- Loading State -->
    <LoadingSpinner
      v-if="isLoading"
      message="Loading your lessons..."
      size="medium"
    />

    <!-- Empty State -->
    <div v-else-if="!isLoading && allLessons.length === 0" class="empty-state-custom">
      <EmptyState
        icon="📖"
        title="No lessons recorded yet"
        message="Add 'Lessons Learned' notes to your trades to build your knowledge base. These lessons will appear here automatically."
        :full-height="false"
      />

      <div class="getting-started-card">
        <h3>🚀 Getting Started with Lessons</h3>
        <div class="steps">
          <div class="step">
            <span class="step-number">1</span>
            <div class="step-content">
              <strong>Create or Edit a Trade</strong>
              <p>Go to the Trade Form or edit an existing trade</p>
            </div>
          </div>
          <div class="step">
            <span class="step-number">2</span>
            <div class="step-content">
              <strong>Add Lessons Learned</strong>
              <p>Scroll to the "Lessons Learned" field and write what you learned</p>
            </div>
          </div>
          <div class="step">
            <span class="step-number">3</span>
            <div class="step-content">
              <strong>Save the Trade</strong>
              <p>Your lesson will automatically appear here with insights and categorization</p>
            </div>
          </div>
        </div>

        <div class="example-lessons">
          <h4>💡 Example Lessons:</h4>
          <ul>
            <li>"Waited too long to exit - should have taken profit at resistance"</li>
            <li>"Entry was perfect, followed my strategy exactly"</li>
            <li>"FOMO trade - entered without proper setup"</li>
            <li>"Stop loss was too tight, got shaken out before the move"</li>
          </ul>
        </div>
      </div>
    </div>

    <!-- Main Content -->
    <div v-else class="lessons-content">
      <!-- Stats Overview -->
      <div class="lessons-stats">
        <div class="stat-card">
          <div class="stat-icon">📝</div>
          <div class="stat-value">{{ allLessons.length }}</div>
          <div class="stat-label">Total Lessons</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-value">{{ profitableLessons.length }}</div>
          <div class="stat-label">From Wins</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">❌</div>
          <div class="stat-value">{{ lossLessons.length }}</div>
          <div class="stat-label">From Losses</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">🏷️</div>
          <div class="stat-value">{{ categorizedLessons.length }}</div>
          <div class="stat-label">Categories</div>
        </div>
      </div>

      <!-- Failure Mode Analysis Section -->
      <div v-if="hasFailureAnalysis" class="failure-analysis-section">
        <div class="section-header">
          <h3>🔍 Failure Mode Analysis</h3>
          <p class="section-subtitle">Understanding what went wrong in losing trades</p>
        </div>

        <div class="failure-stats-grid">
          <div class="failure-stat-card">
            <div class="stat-icon">📉</div>
            <div class="stat-value">{{ analyzedLosses }}</div>
            <div class="stat-label">Analyzed Losses</div>
          </div>
          <div class="failure-stat-card">
            <div class="stat-icon">🎯</div>
            <div class="stat-value">{{ topFailureMode?.count || 0 }}</div>
            <div class="stat-label">Most Common Issue</div>
          </div>
          <div class="failure-stat-card">
            <div class="stat-icon">📊</div>
            <div class="stat-value">{{ failureCategoryCount }}</div>
            <div class="stat-label">Issue Categories</div>
          </div>
        </div>

        <!-- Top Failure Modes -->
        <div class="top-failure-modes">
          <h4>Most Common Failure Patterns</h4>
          <div class="failure-mode-list">
            <div
              v-for="mode in topFailureModes.slice(0, 5)"
              :key="mode.id"
              class="failure-mode-item"
            >
              <div class="failure-mode-header">
                <span class="failure-mode-icon">{{ mode.icon }}</span>
                <span class="failure-mode-label">{{ mode.label }}</span>
                <span class="failure-mode-count">{{ mode.count }}×</span>
              </div>
              <div class="failure-mode-bar">
                <div
                  class="failure-mode-bar-fill"
                  :style="{
                    width: `${mode.percentage}%`,
                    backgroundColor: mode.color
                  }"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Lessons with Failure Analysis -->
        <div class="analyzed-lessons">
          <h4>Recent Analyzed Losses</h4>
          <div class="analyzed-lessons-grid">
            <div
              v-for="lesson in lessonsWithFailureAnalysis.slice(0, 6)"
              :key="lesson.trade.id"
              class="analyzed-lesson-card"
            >
              <div class="analyzed-lesson-header">
                <span class="lesson-symbol-large">{{ lesson.symbol }}</span>
                <span class="lesson-date-small">{{ formatDate(lesson.date) }}</span>
              </div>

              <div class="failure-modes-tags">
                <span
                  v-for="modeId in lesson.trade.failureModes"
                  :key="modeId"
                  class="failure-mode-tag"
                  :style="{ '--tag-color': getFailureModeColor(modeId) }"
                >
                  {{ getFailureModeIcon(modeId) }} {{ getFailureModeLabel(modeId) }}
                </span>
              </div>

              <div v-if="lesson.trade.failureNotes" class="failure-notes-preview">
                {{ truncateText(lesson.trade.failureNotes, 120) }}
              </div>

              <div class="analyzed-lesson-footer">
                <span class="lesson-pnl-large loss">{{ formatCurrency(lesson.pnl) }}</span>
                <span v-if="lesson.trade.failureConfidence" class="confidence-stars">
                  <span v-for="i in lesson.trade.failureConfidence" :key="i">★</span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Category Filter -->
      <div class="filter-section">
        <div class="filter-buttons">
          <button
            class="filter-btn"
            :class="{ active: selectedCategory === 'all' }"
            @click="selectedCategory = 'all'"
          >
            All Lessons
          </button>
          <button
            v-for="category in categorizedLessons"
            :key="category.name"
            class="filter-btn"
            :class="{ active: selectedCategory === category.name }"
            @click="selectedCategory = category.name"
          >
            {{ category.icon }} {{ category.name }} ({{ category.lessons.length }})
          </button>
        </div>
      </div>

      <!-- Lessons Display -->
      <div class="lessons-grid">
        <div
          v-for="(lesson, index) in filteredLessons"
          :key="index"
          class="lesson-card"
          :class="lesson.tradeResult"
        >
          <div class="lesson-header">
            <div class="lesson-meta">
              <span class="lesson-date">{{ formatDate(lesson.date) }}</span>
              <span class="lesson-symbol">{{ lesson.symbol }}</span>
            </div>
            <div class="lesson-badge" :class="lesson.tradeResult">
              {{ lesson.tradeResult === 'profit' ? '✅ Win' : '❌ Loss' }}
            </div>
          </div>

          <div class="lesson-content">
            <p class="lesson-text">{{ lesson.text }}</p>
          </div>

          <div class="lesson-footer">
            <div class="lesson-tags">
              <span
                v-for="tag in lesson.tags"
                :key="tag"
                class="lesson-tag"
              >
                {{ tag }}
              </span>
            </div>
            <div class="lesson-pnl" :class="lesson.tradeResult">
              {{ formatCurrency(lesson.pnl) }}
            </div>
          </div>
        </div>
      </div>

      <!-- Wisdom Board - Top Insights -->
      <div class="wisdom-board">
        <h3>🎯 Top Trading Insights</h3>
        <div class="wisdom-cards">
          <div class="wisdom-card success">
            <div class="wisdom-icon">💡</div>
            <div class="wisdom-title">Most Profitable Lesson</div>
            <div class="wisdom-content">
              {{ mostProfitableLesson?.text || 'Keep trading to discover!' }}
            </div>
            <div v-if="mostProfitableLesson" class="wisdom-value profit">
              {{ formatCurrency(mostProfitableLesson.pnl) }}
            </div>
          </div>

          <div class="wisdom-card warning">
            <div class="wisdom-icon">⚠️</div>
            <div class="wisdom-title">Biggest Loss Lesson</div>
            <div class="wisdom-content">
              {{ biggestLossLesson?.text || 'Stay disciplined!' }}
            </div>
            <div v-if="biggestLossLesson" class="wisdom-value loss">
              {{ formatCurrency(biggestLossLesson.pnl) }}
            </div>
          </div>

          <div class="wisdom-card info">
            <div class="wisdom-icon">📈</div>
            <div class="wisdom-title">Most Common Theme</div>
            <div class="wisdom-content">
              {{ mostCommonTheme || 'Record more lessons to see patterns' }}
            </div>
          </div>
        </div>
      </div>

      <!-- Timeline View -->
      <div class="lessons-timeline">
        <h3>📅 Lessons Timeline</h3>
        <div class="timeline">
          <div
            v-for="(lesson, index) in recentLessons"
            :key="index"
            class="timeline-item"
            :class="lesson.tradeResult"
          >
            <div class="timeline-marker" />
            <div class="timeline-content">
              <div class="timeline-header">
                <span class="timeline-date">{{ formatDate(lesson.date) }}</span>
                <span class="timeline-symbol">{{ lesson.symbol }}</span>
                <span class="timeline-pnl" :class="lesson.tradeResult">
                  {{ formatCurrency(lesson.pnl) }}
                </span>
              </div>
              <p class="timeline-text">{{ lesson.text }}</p>
              <div class="timeline-tags">
                <span
                  v-for="tag in lesson.tags"
                  :key="tag"
                  class="timeline-tag"
                >
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { tradeService } from '@/firebase/tradeService'
import { getFailureModeById } from '@/types/failureMode'
import LoadingSpinner from './ui/LoadingSpinner.vue'
import EmptyState from './ui/EmptyState.vue'

// State
const isLoading = ref(false)
const trades = ref([])
const selectedCategory = ref('all')

// Auto-categorize lessons using keywords
const categorizeLesson = (lessonText) => {
  const text = lessonText.toLowerCase()
  const categories = []

  // Risk Management
  if (text.match(/stop.?loss|risk|position.?size|exit|cut.?loss/)) {
    categories.push({ name: 'Risk Management', icon: '🛡️' })
  }

  // Entry/Exit
  if (text.match(/entry|exit|timing|early|late|price.?action/)) {
    categories.push({ name: 'Entry/Exit', icon: '🎯' })
  }

  // Emotions
  if (text.match(/emotion|fear|greed|fomo|patience|discipline|rush/)) {
    categories.push({ name: 'Psychology', icon: '🧠' })
  }

  // Strategy
  if (text.match(/strategy|setup|pattern|trend|indicator|signal/)) {
    categories.push({ name: 'Strategy', icon: '📊' })
  }

  // Analysis
  if (text.match(/analysis|over.?analy|chart|technical|fundamental/)) {
    categories.push({ name: 'Analysis', icon: '🔍' })
  }

  // Rules
  if (text.match(/rule|plan|trading.?plan|system|follow/)) {
    categories.push({ name: 'Trading Rules', icon: '📜' })
  }

  return categories.length > 0 ? categories : [{ name: 'General', icon: '📝' }]
}

// Extract tags from lesson text
const extractTags = (lessonText) => {
  const tags = []
  const text = lessonText.toLowerCase()

  const tagMapping = {
    'Stop Loss': /stop.?loss/,
    'Risk Management': /risk/,
    'Entry': /entry/,
    'Exit': /exit/,
    'Patience': /patience|wait/,
    'Discipline': /discipline/,
    'FOMO': /fomo|fear.?of.?missing/,
    'Greed': /greed|profit.?target/,
    'Analysis': /analysis|analyze/,
    'Strategy': /strategy/,
    'Trend': /trend/,
    'Position Size': /position.?size/
  }

  Object.entries(tagMapping).forEach(([tag, pattern]) => {
    if (pattern.test(text)) {
      tags.push(tag)
    }
  })

  return tags.length > 0 ? tags : ['Insight']
}

// Process lessons from trades
const allLessons = computed(() => {
  return trades.value
    .filter(trade => trade.lessonsLearned && trade.lessonsLearned.trim())
    .map(trade => ({
      text: trade.lessonsLearned,
      date: trade.exitDate || trade.entryDate,
      symbol: trade.symbol,
      pnl: trade.pnlAmount || 0,
      tradeResult: trade.pnlAmount >= 0 ? 'profit' : 'loss',
      categories: categorizeLesson(trade.lessonsLearned),
      tags: extractTags(trade.lessonsLearned),
      trade
    }))
    .sort((a, b) => new Date(b.date) - new Date(a.date))
})

const profitableLessons = computed(() =>
  allLessons.value.filter(l => l.tradeResult === 'profit')
)

const lossLessons = computed(() =>
  allLessons.value.filter(l => l.tradeResult === 'loss')
)

const categorizedLessons = computed(() => {
  const categoryMap = new Map()

  allLessons.value.forEach(lesson => {
    lesson.categories.forEach(cat => {
      if (!categoryMap.has(cat.name)) {
        categoryMap.set(cat.name, { ...cat, lessons: [] })
      }
      categoryMap.get(cat.name).lessons.push(lesson)
    })
  })

  return Array.from(categoryMap.values())
})

const filteredLessons = computed(() => {
  if (selectedCategory.value === 'all') {
    return allLessons.value
  }

  return allLessons.value.filter(lesson =>
    lesson.categories.some(cat => cat.name === selectedCategory.value)
  )
})

const recentLessons = computed(() => allLessons.value.slice(0, 10))

const mostProfitableLesson = computed(() => {
  return [...profitableLessons.value].sort((a, b) => b.pnl - a.pnl)[0]
})

const biggestLossLesson = computed(() => {
  return [...lossLessons.value].sort((a, b) => a.pnl - b.pnl)[0]
})

const mostCommonTheme = computed(() => {
  if (categorizedLessons.value.length === 0) return null

  return [...categorizedLessons.value]
    .sort((a, b) => b.lessons.length - a.lessons.length)[0]?.name
})

// Failure Mode Analysis Computed Properties
const lessonsWithFailureAnalysis = computed(() => {
  return allLessons.value.filter(lesson =>
    lesson.trade.failureModes && lesson.trade.failureModes.length > 0
  )
})

const hasFailureAnalysis = computed(() => {
  return lessonsWithFailureAnalysis.value.length > 0
})

const analyzedLosses = computed(() => {
  return lessonsWithFailureAnalysis.value.length
})

const topFailureModes = computed(() => {
  const modeCount = {}

  lessonsWithFailureAnalysis.value.forEach(lesson => {
    lesson.trade.failureModes.forEach(modeId => {
      modeCount[modeId] = (modeCount[modeId] || 0) + 1
    })
  })

  return Object.entries(modeCount)
    .map(([id, count]) => {
      const mode = getFailureModeById(id)
      return {
        id,
        label: mode?.label || id,
        icon: mode?.icon || '❓',
        color: mode?.color || '#6b7280',
        count,
        percentage: (count / analyzedLosses.value) * 100
      }
    })
    .sort((a, b) => b.count - a.count)
})

const topFailureMode = computed(() => topFailureModes.value[0])

const failureCategoryCount = computed(() => {
  const categories = new Set()
  topFailureModes.value.forEach(mode => {
    const modeData = getFailureModeById(mode.id)
    if (modeData?.category) {
      categories.add(modeData.category)
    }
  })
  return categories.size
})

// Helper functions for failure modes
const getFailureModeIcon = (modeId) => {
  return getFailureModeById(modeId)?.icon || '❓'
}

const getFailureModeLabel = (modeId) => {
  return getFailureModeById(modeId)?.label || modeId
}

const getFailureModeColor = (modeId) => {
  return getFailureModeById(modeId)?.color || '#6b7280'
}

const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

// Formatting functions
const formatDate = (dateStr) => {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  })
}

const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount)
}

// Load trades
const loadTrades = async() => {
  isLoading.value = true
  try {
    trades.value = await tradeService.getAllTrades()
  } catch {
    // Error loading lessons - show empty state
    trades.value = []
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  loadTrades()
})
</script>

<style scoped>
.lessons-library {
  padding: 1.5rem;
  max-width: 1400px;
  margin: 0 auto;
}

.lessons-header {
  text-align: center;
  margin-bottom: 2rem;
}

.lessons-header h2 {
  font-size: 2rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.subtitle {
  color: #64748b;
  font-size: 1rem;
}

/* Empty State Custom */
.empty-state-custom {
  max-width: 900px;
  margin: 0 auto;
}

.getting-started-card {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-top: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.getting-started-card h3 {
  font-size: 1.5rem;
  color: #1e293b;
  margin-bottom: 1.5rem;
  text-align: center;
}

.steps {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin-bottom: 2rem;
}

.step {
  display: flex;
  gap: 1rem;
  align-items: flex-start;
}

.step-number {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 1.25rem;
}

.step-content {
  flex: 1;
}

.step-content strong {
  display: block;
  color: #1e293b;
  margin-bottom: 0.25rem;
  font-size: 1.125rem;
}

.step-content p {
  color: #64748b;
  margin: 0;
}

.example-lessons {
  background: #f8fafc;
  border-left: 4px solid #667eea;
  padding: 1.5rem;
  border-radius: 8px;
}

.example-lessons h4 {
  color: #1e293b;
  margin-bottom: 1rem;
  font-size: 1.125rem;
}

.example-lessons ul {
  list-style: none;
  padding: 0;
  margin: 0;
}

.example-lessons li {
  color: #475569;
  padding: 0.5rem 0;
  padding-left: 1.5rem;
  position: relative;
  line-height: 1.6;
}

.example-lessons li::before {
  content: '→';
  position: absolute;
  left: 0;
  color: #667eea;
  font-weight: bold;
}

/* Stats Overview */
.lessons-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.stat-card {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1.5rem;
  border-radius: 12px;
  text-align: center;
  color: white;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-card:nth-child(2) {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}

.stat-card:nth-child(3) {
  background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
}

.stat-card:nth-child(4) {
  background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
}

.stat-icon {
  font-size: 2rem;
  margin-bottom: 0.5rem;
}

.stat-value {
  font-size: 2.5rem;
  font-weight: bold;
  margin-bottom: 0.25rem;
}

.stat-label {
  font-size: 0.875rem;
  opacity: 0.9;
}

/* Filter Section */
.filter-section {
  margin-bottom: 2rem;
}

.filter-buttons {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.filter-btn {
  padding: 0.5rem 1rem;
  border: 2px solid #e2e8f0;
  background: white;
  border-radius: 20px;
  cursor: pointer;
  transition: all 0.3s;
  font-size: 0.875rem;
  font-weight: 500;
}

.filter-btn:hover {
  border-color: #667eea;
  color: #667eea;
}

.filter-btn.active {
  background: #667eea;
  color: white;
  border-color: #667eea;
}

/* Lessons Grid */
.lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
  margin-bottom: 3rem;
}

.lesson-card {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #667eea;
  transition: transform 0.3s, box-shadow 0.3s;
}

.lesson-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 16px rgba(0, 0, 0, 0.15);
}

.lesson-card.profit {
  border-left-color: #10b981;
  background: linear-gradient(135deg, #ffffff 0%, #f0fdf4 100%);
}

.lesson-card.loss {
  border-left-color: #ef4444;
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
}

.lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
}

.lesson-meta {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.lesson-date {
  font-size: 0.75rem;
  color: #64748b;
}

.lesson-symbol {
  font-weight: 600;
  color: #1e293b;
  font-size: 0.875rem;
}

.lesson-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.lesson-badge.profit {
  background: #d1fae5;
  color: #065f46;
}

.lesson-badge.loss {
  background: #fee2e2;
  color: #991b1b;
}

.lesson-content {
  margin-bottom: 1rem;
}

.lesson-text {
  color: #334155;
  line-height: 1.6;
  font-size: 0.9375rem;
}

.lesson-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.lesson-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.lesson-tag {
  padding: 0.25rem 0.5rem;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 500;
}

.lesson-pnl {
  font-weight: 700;
  font-size: 1rem;
}

.lesson-pnl.profit {
  color: #10b981;
}

.lesson-pnl.loss {
  color: #ef4444;
}

/* Wisdom Board */
.wisdom-board {
  margin-bottom: 3rem;
}

.wisdom-board h3 {
  font-size: 1.5rem;
  margin-bottom: 1.5rem;
  color: #1e293b;
}

.wisdom-cards {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
}

.wisdom-card {
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.wisdom-card.success {
  background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
}

.wisdom-card.warning {
  background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
}

.wisdom-card.info {
  background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
}

.wisdom-icon {
  font-size: 3rem;
  margin-bottom: 1rem;
}

.wisdom-title {
  font-weight: 600;
  font-size: 1rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.wisdom-content {
  color: #334155;
  line-height: 1.6;
  min-height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-style: italic;
}

.wisdom-value {
  margin-top: 1rem;
  font-size: 1.5rem;
  font-weight: 700;
}

.wisdom-value.profit {
  color: #059669;
}

.wisdom-value.loss {
  color: #dc2626;
}

/* Timeline */
.lessons-timeline {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.lessons-timeline h3 {
  font-size: 1.5rem;
  margin-bottom: 2rem;
  color: #1e293b;
}

.timeline {
  position: relative;
  padding-left: 2.5rem;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 0.625rem;
  top: 0;
  bottom: 0;
  width: 2px;
  background: linear-gradient(to bottom, #667eea, #764ba2);
}

.timeline-item {
  position: relative;
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e2e8f0;
}

.timeline-item:last-child {
  border-bottom: none;
}

.timeline-marker {
  position: absolute;
  left: -1.875rem;
  top: 0.25rem;
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: white;
  border: 3px solid #667eea;
  z-index: 1;
}

.timeline-item.profit .timeline-marker {
  border-color: #10b981;
}

.timeline-item.loss .timeline-marker {
  border-color: #ef4444;
}

.timeline-header {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
  flex-wrap: wrap;
  align-items: center;
}

.timeline-date {
  font-size: 0.875rem;
  color: #64748b;
}

.timeline-symbol {
  font-weight: 600;
  color: #1e293b;
}

.timeline-pnl {
  font-weight: 700;
  margin-left: auto;
}

.timeline-pnl.profit {
  color: #10b981;
}

.timeline-pnl.loss {
  color: #ef4444;
}

.timeline-text {
  color: #334155;
  line-height: 1.6;
  margin-bottom: 0.75rem;
}

.timeline-tags {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.timeline-tag {
  padding: 0.25rem 0.5rem;
  background: #f1f5f9;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #475569;
  font-weight: 500;
}

/* Failure Analysis Section */
.failure-analysis-section {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  margin-bottom: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  border: 2px solid #fef2f2;
}

.section-header {
  margin-bottom: 1.5rem;
}

.section-header h3 {
  font-size: 1.5rem;
  color: #1e293b;
  margin-bottom: 0.5rem;
}

.section-subtitle {
  color: #64748b;
  font-size: 0.875rem;
  margin: 0;
}

.failure-stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
}

.failure-stat-card {
  background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
  padding: 1.5rem;
  border-radius: 10px;
  text-align: center;
  border: 2px solid #fecaca;
}

.top-failure-modes {
  margin-bottom: 2rem;
}

.top-failure-modes h4 {
  font-size: 1.125rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.failure-mode-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.failure-mode-item {
  background: #f9fafb;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #ef4444;
}

.failure-mode-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.failure-mode-icon {
  font-size: 1.25rem;
}

.failure-mode-label {
  flex: 1;
  font-weight: 600;
  color: #374151;
}

.failure-mode-count {
  background: #ef4444;
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
}

.failure-mode-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.failure-mode-bar-fill {
  height: 100%;
  transition: width 0.3s ease;
}

.analyzed-lessons {
  margin-top: 2rem;
}

.analyzed-lessons h4 {
  font-size: 1.125rem;
  color: #1e293b;
  margin-bottom: 1rem;
}

.analyzed-lessons-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.analyzed-lesson-card {
  background: linear-gradient(135deg, #ffffff 0%, #fef2f2 100%);
  border: 2px solid #fecaca;
  border-radius: 10px;
  padding: 1.25rem;
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.analyzed-lesson-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.analyzed-lesson-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.lesson-symbol-large {
  font-size: 1.125rem;
  font-weight: 700;
  color: #1e293b;
}

.lesson-date-small {
  font-size: 0.75rem;
  color: #64748b;
}

.failure-modes-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.failure-mode-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.625rem;
  background: white;
  border: 1.5px solid var(--tag-color);
  color: var(--tag-color);
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 600;
}

.failure-notes-preview {
  font-size: 0.875rem;
  color: #475569;
  line-height: 1.5;
  margin-bottom: 1rem;
  font-style: italic;
  background: white;
  padding: 0.75rem;
  border-radius: 6px;
  border-left: 3px solid #ef4444;
}

.analyzed-lesson-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.lesson-pnl-large {
  font-size: 1.125rem;
  font-weight: 700;
}

.lesson-pnl-large.loss {
  color: #ef4444;
}

.confidence-stars {
  color: #fbbf24;
  font-size: 1rem;
}

/* Responsive */
@media (max-width: 768px) {
  .lessons-library {
    padding: 1rem;
  }

  .lessons-header h2 {
    font-size: 1.5rem;
  }

  .lessons-stats {
    grid-template-columns: repeat(2, 1fr);
  }

  .lessons-grid {
    grid-template-columns: 1fr;
  }

  .wisdom-cards {
    grid-template-columns: 1fr;
  }

  .timeline {
    padding-left: 2rem;
  }

  .timeline::before {
    left: 0.5rem;
  }

  .timeline-marker {
    left: -1.5rem;
    width: 12px;
    height: 12px;
  }

  .timeline-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }

  .timeline-pnl {
    margin-left: 0;
  }
}
</style>
