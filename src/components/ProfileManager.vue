<template>
  <div class="profile-manager">
    <div class="manager-header">
      <h2>📊 Profile Management</h2>
      <p class="subtitle">Create and manage your trading workspaces</p>
      <router-link to="/profile-migration" class="migration-link">
        🔄 Migrate Data Between Profiles
      </router-link>
    </div>

    <!-- Profile List -->
    <div class="profiles-grid">
      <div
        v-for="profile in profiles"
        :key="profile.id"
        class="profile-card"
        :class="{ active: profile.id === activeProfileId }"
      >
        <div class="card-header">
          <span class="card-icon">{{ profile.icon || getTypeIcon(profile.type) }}</span>
          <div class="card-title">
            <h3>{{ profile.name }}</h3>
            <span class="type-badge" :class="`type-${profile.type}`">{{ profile.type }}</span>
          </div>
        </div>

        <p v-if="profile.description" class="card-description">
          {{ profile.description }}
        </p>

        <div class="card-stats">
          <div class="stat-item">
            <span class="stat-label">Status</span>
            <span class="stat-value">{{ profile.isActive ? 'Active' : 'Inactive' }}</span>
          </div>
        </div>

        <div class="card-actions">
          <button
            v-if="profile.id !== activeProfileId"
            class="action-btn primary"
            @click="switchToProfile(profile.id!)"
          >
            Switch
          </button>
          <span v-else class="current-badge">Current</span>
          <button class="action-btn" @click="openEditModal(profile)">Edit</button>
          <button
            class="action-btn danger"
            :disabled="profiles.length <= 1"
            @click="confirmDelete(profile)"
          >
            Delete
          </button>
        </div>
      </div>

      <!-- Add New Profile Card -->
      <div class="profile-card add-card" @click="openCreateModal">
        <div class="add-content">
          <span class="add-icon">+</span>
          <h3>Create New Profile</h3>
          <p>Set up a new trading workspace</p>
        </div>
      </div>
    </div>

    <!-- Create/Edit Modal -->
    <Transition name="modal">
      <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
        <div class="modal-content">
          <div class="modal-header">
            <h3>{{ isEditing ? 'Edit Profile' : 'Create New Profile' }}</h3>
            <button class="close-btn" @click="closeModal">×</button>
          </div>

          <div class="modal-body">
            <div class="form-group">
              <label for="profile-name">Profile Name *</label>
              <input
                id="profile-name"
                v-model="formData.name"
                type="text"
                placeholder="e.g., Live Trading, Paper Account..."
                required
              >
            </div>

            <div class="form-group">
              <label for="profile-type">Type *</label>
              <select id="profile-type" v-model="formData.type">
                <option value="live">Live Trading</option>
                <option value="paper">Paper Trading</option>
                <option value="strategy">Strategy</option>
                <option value="custom">Custom</option>
              </select>
            </div>

            <div class="form-group">
              <label for="profile-icon">Icon</label>
              <div class="icon-selector">
                <input
                  id="profile-icon"
                  v-model="formData.icon"
                  type="text"
                  placeholder="🔴 Pick an emoji..."
                  maxlength="2"
                >
                <div class="icon-suggestions">
                  <button
                    v-for="icon in iconSuggestions"
                    :key="icon"
                    type="button"
                    class="icon-btn"
                    @click="formData.icon = icon"
                  >
                    {{ icon }}
                  </button>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label for="profile-description">Description</label>
              <textarea
                id="profile-description"
                v-model="formData.description"
                rows="3"
                placeholder="Optional description..."
              />
            </div>

            <div class="form-group checkbox">
              <label>
                <input v-model="formData.isActive" type="checkbox">
                <span>Active Profile</span>
              </label>
            </div>

            <div class="form-group checkbox">
              <label>
                <input v-model="formData.settings.showInDashboard" type="checkbox">
                <span>Show in Dashboard</span>
              </label>
            </div>

            <div class="form-group checkbox">
              <label>
                <input v-model="formData.settings.includeInGlobalStats" type="checkbox">
                <span>Include in Global Statistics</span>
              </label>
            </div>

            <!-- Advanced Settings -->
            <details class="advanced-settings">
              <summary>Advanced Settings</summary>

              <div class="form-group">
                <label for="default-risk">Default Risk Per Trade (%)</label>
                <input
                  id="default-risk"
                  v-model.number="formData.settings.defaultRiskPerTrade"
                  type="number"
                  step="0.1"
                  min="0"
                  max="100"
                >
              </div>

              <div class="form-group">
                <label for="position-size">Default Position Size</label>
                <input
                  id="position-size"
                  v-model.number="formData.settings.defaultPositionSize"
                  type="number"
                  min="0"
                >
              </div>

              <div class="form-group">
                <label for="max-positions">Max Open Positions</label>
                <input
                  id="max-positions"
                  v-model.number="formData.settings.maxOpenPositions"
                  type="number"
                  min="1"
                >
              </div>

              <div class="form-group">
                <label for="broker">Broker</label>
                <input
                  id="broker"
                  v-model="formData.settings.broker"
                  type="text"
                  placeholder="e.g., Interactive Brokers"
                >
              </div>

              <div class="form-group">
                <label for="account-number">Account Number</label>
                <input
                  id="account-number"
                  v-model="formData.settings.accountNumber"
                  type="text"
                  placeholder="Optional"
                >
              </div>
            </details>
          </div>

          <div class="modal-footer">
            <button class="btn-secondary" @click="closeModal">Cancel</button>
            <button class="btn-primary" :disabled="!formData.name" @click="saveProfile">
              {{ isEditing ? 'Update' : 'Create' }} Profile
            </button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Delete Confirmation Modal -->
    <Transition name="modal">
      <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
        <div class="modal-content small">
          <div class="modal-header">
            <h3>⚠️ Confirm Deletion</h3>
          </div>
          <div class="modal-body">
            <p>Are you sure you want to delete the profile <strong>{{ profileToDelete?.name }}</strong>?</p>
            <p class="warning-text">This action cannot be undone.</p>
          </div>
          <div class="modal-footer">
            <button class="btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
            <button class="btn-danger" @click="deleteProfile">Delete</button>
          </div>
        </div>
      </div>
    </Transition>

    <!-- Loading/Error States -->
    <div v-if="loading" class="loading-overlay">
      <div class="spinner" />
    </div>

    <div v-if="error" class="error-message">
      <p>{{ error }}</p>
      <button @click="error = null">Dismiss</button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useProfiles } from '@/composables/useProfiles'
import type { Profile, ProfileType } from '@/types/profile'

const {
  profiles,
  activeProfileId,
  loading,
  error,
  createProfile,
  updateProfile,
  deleteProfile: deleteProfileService,
  switchProfile
} = useProfiles()

const showModal = ref(false)
const showDeleteConfirm = ref(false)
const isEditing = ref(false)
const editingProfileId = ref<string | null>(null)
const profileToDelete = ref<Profile | null>(null)

const iconSuggestions = ['🔴', '📝', '🎯', '⚡', '💼', '🚀', '💰', '📊', '⚙️', '🌟']

const defaultFormData = {
  name: '',
  type: 'live' as ProfileType,
  description: '',
  icon: '',
  isActive: true,
  settings: {
    showInDashboard: true,
    includeInGlobalStats: true,
    defaultRiskPerTrade: undefined,
    defaultPositionSize: undefined,
    maxOpenPositions: undefined,
    broker: '',
    accountNumber: ''
  }
}

const formData = reactive({ ...defaultFormData })

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    live: '🔴',
    paper: '📝',
    strategy: '🎯',
    custom: '⚙️'
  }
  return icons[type] || '📊'
}

function openCreateModal() {
  isEditing.value = false
  editingProfileId.value = null
  Object.assign(formData, defaultFormData)
  showModal.value = true
}

function openEditModal(profile: Profile) {
  isEditing.value = true
  editingProfileId.value = profile.id || null
  Object.assign(formData, {
    name: profile.name,
    type: profile.type,
    description: profile.description || '',
    icon: profile.icon || '',
    isActive: profile.isActive,
    settings: { ...profile.settings }
  })
  showModal.value = true
}

function closeModal() {
  showModal.value = false
  setTimeout(() => {
    isEditing.value = false
    editingProfileId.value = null
    Object.assign(formData, defaultFormData)
  }, 300)
}

async function saveProfile() {
  try {
    // Clean up undefined values from settings
    const cleanedData = {
      ...formData,
      settings: Object.fromEntries(
        Object.entries(formData.settings).filter(([_, v]) => v !== undefined && v !== '')
      )
    }

    if (isEditing.value && editingProfileId.value) {
      await updateProfile(editingProfileId.value, cleanedData)
    } else {
      await createProfile(cleanedData)
    }
    closeModal()
  } catch {
    // Error handled by composable
  }
}

function confirmDelete(profile: Profile) {
  profileToDelete.value = profile
  showDeleteConfirm.value = true
}

async function deleteProfile() {
  if (profileToDelete.value?.id) {
    try {
      await deleteProfileService(profileToDelete.value.id)
      showDeleteConfirm.value = false
      profileToDelete.value = null
    } catch {
      // Error handled by composable
    }
  }
}

async function switchToProfile(profileId: string) {
  await switchProfile(profileId)
}
</script>

<style scoped>
.profile-manager {
  padding: 2rem;
  max-width: 1400px;
  margin: 0 auto;
}

.manager-header {
  margin-bottom: 2rem;
}

.manager-header h2 {
  font-size: 2rem;
  margin: 0 0 0.5rem;
  color: #111827;
}

.subtitle {
  color: #6b7280;
  margin: 0 0 1rem;
}

.migration-link {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #3b82f6;
  color: white;
  text-decoration: none;
  border-radius: 8px;
  font-size: 0.9rem;
  font-weight: 600;
  transition: all 0.2s;
  margin-top: 0.5rem;
}

.migration-link:hover {
  background: #2563eb;
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(59, 130, 246, 0.3);
}

.profiles-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.profile-card {
  background: #ffffff;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  padding: 1.5rem;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.profile-card:hover {
  border-color: #4CAF50;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(76, 175, 80, 0.15);
}

.profile-card.active {
  border-color: #4CAF50;
  background: #f0fdf4;
}

.card-header {
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  margin-bottom: 1rem;
}

.card-icon {
  font-size: 2rem;
}

.card-title h3 {
  margin: 0 0 0.25rem;
  font-size: 1.2rem;
  color: #111827;
}

.type-badge {
  display: inline-block;
  padding: 0.2rem 0.6rem;
  border-radius: 4px;
  font-size: 0.7rem;
  text-transform: uppercase;
  font-weight: 600;
}

.type-live { background: #fee2e2; color: #dc2626; }
.type-paper { background: #dbeafe; color: #2563eb; }
.type-strategy { background: #f3e8ff; color: #9333ea; }
.type-custom { background: #f3f4f6; color: #6b7280; }

.card-description {
  color: #6b7280;
  font-size: 0.9rem;
  margin-bottom: 1rem;
}

.card-stats {
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 6px;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.stat-value {
  font-weight: 600;
  color: #111827;
}

.card-actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.action-btn {
  flex: 1;
  padding: 0.5rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  background: #f9fafb;
  color: #374151;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  font-weight: 500;
}

.action-btn:hover:not(:disabled) {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.action-btn.primary {
  background: #4CAF50;
  border-color: #4CAF50;
  color: #fff;
}

.action-btn.primary:hover {
  background: #45a049;
}

.action-btn.danger {
  color: #dc2626;
}

.action-btn.danger:hover:not(:disabled) {
  background: #fee2e2;
  border-color: #fca5a5;
}

.action-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.current-badge {
  flex: 1;
  padding: 0.5rem 1rem;
  background: #dcfce7;
  border: 1px solid #4CAF50;
  border-radius: 6px;
  color: #166534;
  text-align: center;
  font-weight: 600;
  font-size: 0.85rem;
}

.add-card {
  border-style: dashed;
  border-color: #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  min-height: 200px;
  background: #fafafa;
}

.add-card:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.add-content {
  text-align: center;
}

.add-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: 0.5rem;
  color: #9ca3af;
}

.add-content h3 {
  margin: 0 0 0.5rem;
  color: #374151;
}

.add-content p {
  color: #6b7280;
  margin: 0;
}

/* Modal styles */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
}

.modal-content {
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  max-width: 600px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.modal-content.small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.3rem;
  color: #111827;
}

.close-btn {
  background: none;
  border: none;
  font-size: 2rem;
  color: #9ca3af;
  cursor: pointer;
  line-height: 1;
  padding: 0;
  width: 2rem;
  height: 2rem;
}

.close-btn:hover {
  color: #374151;
}

.modal-body {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 500;
  color: #374151;
}

.form-group input,
.form-group select,
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  color: #111827;
  font-size: 1rem;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.form-group.checkbox {
  display: flex;
  align-items: center;
}

.form-group.checkbox label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin: 0;
  cursor: pointer;
}

.form-group.checkbox input {
  width: auto;
  cursor: pointer;
}

.icon-selector {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.icon-suggestions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.icon-btn {
  padding: 0.5rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1.2rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.icon-btn:hover {
  background: #f3f4f6;
  border-color: #4CAF50;
}

.advanced-settings {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.advanced-settings summary {
  cursor: pointer;
  font-weight: 500;
  color: #4CAF50;
  margin-bottom: 1rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-primary,
.btn-secondary,
.btn-danger {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 500;
  transition: all 0.2s ease;
}

.btn-primary {
  background: #4CAF50;
  color: #fff;
}

.btn-primary:hover:not(:disabled) {
  background: #45a049;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f9fafb;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f3f4f6;
}

.btn-danger {
  background: #dc2626;
  color: #fff;
}

.btn-danger:hover {
  background: #b91c1c;
}

.warning-text {
  color: #d97706;
  font-size: 0.9rem;
}

.loading-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.3);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.spinner {
  width: 50px;
  height: 50px;
  border: 3px solid #e5e7eb;
  border-top-color: #4CAF50;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.error-message {
  position: fixed;
  top: 2rem;
  right: 2rem;
  background: #dc2626;
  color: #fff;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  z-index: 10001;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.error-message button {
  background: none;
  border: none;
  color: #fff;
  cursor: pointer;
  font-weight: 600;
}

/* Modal transitions */
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.3s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .modal-content,
.modal-leave-active .modal-content {
  transition: transform 0.3s ease;
}

.modal-enter-from .modal-content,
.modal-leave-to .modal-content {
  transform: scale(0.9);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .profile-manager {
    padding: 1rem;
  }

  .profiles-grid {
    grid-template-columns: 1fr;
  }

  .modal-content {
    max-height: 95vh;
  }

  .modal-footer {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary,
  .btn-danger {
    width: 100%;
  }
}
</style>
