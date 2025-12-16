<template>
  <div class="migration-tool">
    <div class="migration-header">
      <h3>🔄 Profile Data Migration</h3>
      <p>Move trades from other profiles to F&O profile (keeping Swing and Paper unchanged)</p>
    </div>

    <div v-if="!migrationStarted" class="migration-preview">
      <button
        class="btn btn-primary"
        :disabled="loading"
        @click="loadPreview"
      >
        {{ loading ? '⏳ Loading...' : '🔍 Preview Migration' }}
      </button>

      <div v-if="preview" class="preview-results">
        <h4>Migration Preview</h4>
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-label">Total Trades</span>
            <span class="stat-value">{{ preview.totalTrades }}</span>
          </div>
          <div class="stat-card keep">
            <span class="stat-label">Swing Trades (Keep)</span>
            <span class="stat-value">{{ preview.swingTrades }}</span>
          </div>
          <div class="stat-card keep">
            <span class="stat-label">Paper Trades (Keep)</span>
            <span class="stat-value">{{ preview.paperTrades }}</span>
          </div>
          <div class="stat-card migrate">
            <span class="stat-label">Trades to Migrate to F&O</span>
            <span class="stat-value">{{ preview.tradesToMigrate }}</span>
          </div>
        </div>

        <div v-if="!preview.fnoProfileExists" class="alert alert-error">
          ⚠️ F&O profile not found! Please create a profile named "F&O" first.
        </div>

        <div v-if="preview.fnoProfileExists && preview.tradesToMigrate > 0" class="migration-actions">
          <button
            class="btn btn-success"
            :disabled="loading"
            @click="startMigration"
          >
            ✅ Start Migration
          </button>
          <p class="warning-text">
            ⚠️ This will update {{ preview.tradesToMigrate }} trade(s). This action can be undone manually if needed.
          </p>
        </div>

        <div v-if="preview.tradesToMigrate === 0" class="alert alert-success">
          ✅ No migration needed! All trades are already in correct profiles.
        </div>
      </div>
    </div>

    <div v-if="migrationStarted" class="migration-progress">
      <div v-if="loading" class="loading-state">
        <div class="spinner" />
        <p>Migrating trades to F&O profile...</p>
      </div>

      <div v-if="!loading && result" class="migration-results">
        <div v-if="result.success" class="alert alert-success">
          <h4>✅ Migration Completed Successfully!</h4>
          <p>{{ result.migratedCount }} trade(s) have been moved to F&O profile.</p>
        </div>

        <div v-if="!result.success" class="alert alert-error">
          <h4>⚠️ Migration Completed with Errors</h4>
          <p>{{ result.migratedCount }} trade(s) migrated, but {{ result.errors.length }} error(s) occurred.</p>
        </div>

        <div class="results-details">
          <h5>Migration Summary:</h5>
          <ul>
            <li>Total Trades: {{ result.details.totalTrades }}</li>
            <li>Swing Profile (unchanged): {{ result.details.swingTrades }}</li>
            <li>Paper Profile (unchanged): {{ result.details.paperTrades }}</li>
            <li>Migrated to F&O: {{ result.migratedCount }}</li>
          </ul>

          <div v-if="result.errors.length > 0" class="errors-list">
            <h5>Errors:</h5>
            <ul>
              <li v-for="(error, index) in result.errors" :key="index">{{ error }}</li>
            </ul>
          </div>
        </div>

        <button class="btn btn-primary" @click="resetMigration">
          🔄 Run Another Migration
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { profileMigration } from '@/utils/profileMigration'

interface PreviewResult {
  totalTrades: number
  swingTrades: number
  paperTrades: number
  tradesToMigrate: number
  fnoProfileExists: boolean
  tradeIds: string[]
}

interface MigrationResult {
  success: boolean
  migratedCount: number
  errors: string[]
  details: {
    totalTrades: number
    swingTrades: number
    paperTrades: number
    otherTrades: number
  }
}

const loading = ref(false)
const migrationStarted = ref(false)
const preview = ref<PreviewResult | null>(null)
const result = ref<MigrationResult | null>(null)

const loadPreview = async() => {
  loading.value = true
  try {
    preview.value = await profileMigration.previewMigration()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to load preview:', error)
  } finally {
    loading.value = false
  }
}

const startMigration = async() => {
  if (!preview.value) return

  const confirmed = window.confirm(
    `Are you sure you want to migrate ${preview.value.tradesToMigrate} trade(s) to F&O profile?\n\n` +
    `This will update the profileId for these trades.\n` +
    `Swing and Paper profile trades will remain unchanged.`
  )

  if (!confirmed) return

  loading.value = true
  migrationStarted.value = true

  try {
    result.value = await profileMigration.migrateToFnO()
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Migration failed:', error)
  } finally {
    loading.value = false
  }
}

const resetMigration = () => {
  migrationStarted.value = false
  preview.value = null
  result.value = null
}
</script>

<style scoped>
.migration-tool {
  max-width: 800px;
  margin: 2rem auto;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.migration-header {
  text-align: center;
  margin-bottom: 2rem;
}

.migration-header h3 {
  font-size: 1.5rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.migration-header p {
  color: #6b7280;
  font-size: 0.95rem;
}

.migration-preview {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.preview-results {
  margin-top: 1rem;
}

.preview-results h4 {
  font-size: 1.2rem;
  color: #1f2937;
  margin-bottom: 1rem;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.stat-card {
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
  border: 2px solid #e5e7eb;
  text-align: center;
}

.stat-card.keep {
  border-color: #10b981;
  background: #ecfdf5;
}

.stat-card.migrate {
  border-color: #3b82f6;
  background: #eff6ff;
}

.stat-label {
  display: block;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.stat-value {
  display: block;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.migration-actions {
  margin-top: 1.5rem;
  text-align: center;
}

.warning-text {
  margin-top: 1rem;
  font-size: 0.875rem;
  color: #f59e0b;
}

.alert {
  padding: 1rem;
  border-radius: 8px;
  margin: 1rem 0;
}

.alert-success {
  background: #ecfdf5;
  color: #065f46;
  border: 1px solid #10b981;
}

.alert-error {
  background: #fef2f2;
  color: #991b1b;
  border: 1px solid #ef4444;
}

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: #2563eb;
}

.btn-success {
  background: #10b981;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #059669;
}

.migration-progress {
  text-align: center;
}

.loading-state {
  padding: 2rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #e5e7eb;
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.migration-results {
  text-align: left;
}

.results-details {
  margin: 1.5rem 0;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 8px;
}

.results-details h5 {
  font-size: 1rem;
  color: #1f2937;
  margin-bottom: 0.5rem;
}

.results-details ul {
  list-style: none;
  padding-left: 0;
}

.results-details li {
  padding: 0.25rem 0;
  color: #4b5563;
}

.errors-list {
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}

.errors-list ul {
  list-style: disc;
  padding-left: 1.5rem;
}

.errors-list li {
  color: #991b1b;
  margin: 0.25rem 0;
}
</style>
