<template>
  <div ref="selectorRef" class="profile-selector">
    <button
      class="selector-trigger"
      :class="{ active: isOpen }"
      @click="toggleDropdown"
    >
      <span v-if="activeProfile" class="profile-info">
        <span class="profile-icon">{{ activeProfile.icon || getTypeIcon(activeProfile.type) }}</span>
        <span class="profile-name">{{ activeProfile.name }}</span>
        <span class="profile-type">{{ activeProfile.type }}</span>
      </span>
      <span v-else class="profile-info">
        <span class="profile-icon">📊</span>
        <span class="profile-name">Select Profile</span>
      </span>
      <span class="dropdown-arrow">▼</span>
    </button>

    <Transition name="dropdown">
      <div v-if="isOpen" class="dropdown-menu">
        <div class="dropdown-header">
          <h4>Switch Profile</h4>
        </div>

        <div class="profile-list">
          <button
            v-for="profile in activeProfiles"
            :key="profile.id"
            class="profile-option"
            :class="{ active: profile.id === activeProfileId }"
            @click="selectProfile(profile.id!)"
          >
            <span class="option-icon">{{ profile.icon || getTypeIcon(profile.type) }}</span>
            <div class="option-info">
              <span class="option-name">{{ profile.name }}</span>
              <span class="option-type">{{ profile.type }}</span>
            </div>
            <span v-if="profile.id === activeProfileId" class="check-mark">✓</span>
          </button>
        </div>

        <div class="dropdown-footer">
          <button class="manage-btn" @click="openManager">
            ⚙️ Manage Profiles
          </button>
        </div>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useProfiles } from '@/composables/useProfiles'

const emit = defineEmits<{
  openManager: []
}>()

const { activeProfile, activeProfiles, activeProfileId, switchProfile } = useProfiles()

const isOpen = ref(false)
const selectorRef = ref(null)

function toggleDropdown() {
  isOpen.value = !isOpen.value
}

function closeDropdown() {
  isOpen.value = false
}

async function selectProfile(profileId: string) {
  if (profileId !== activeProfileId.value) {
    await switchProfile(profileId)
  }
  closeDropdown()
}

function openManager() {
  closeDropdown()
  emit('openManager')
}

function getTypeIcon(type: string): string {
  const icons: Record<string, string> = {
    live: '🔴',
    paper: '📝',
    strategy: '🎯',
    custom: '⚙️'
  }
  return icons[type] || '📊'
}

// Close dropdown when clicking outside
// @ts-ignore
function handleClickOutside(event) {
  // @ts-ignore
  if (selectorRef.value && !selectorRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
.profile-selector {
  position: relative;
  display: inline-block;
}

.selector-trigger {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #ffffff;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  color: #1f2937;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
  min-width: 200px;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
}

.selector-trigger:hover {
  background: #f9fafb;
  border-color: #4CAF50;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.selector-trigger.active {
  border-color: #4CAF50;
  box-shadow: 0 0 0 3px rgba(76, 175, 80, 0.1);
}

.profile-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.profile-icon {
  font-size: 1.2rem;
}

.profile-name {
  font-weight: 500;
  flex: 1;
  text-align: left;
  color: #111827;
}

.profile-type {
  font-size: 0.75rem;
  padding: 0.15rem 0.4rem;
  background: #f3f4f6;
  border-radius: 4px;
  text-transform: uppercase;
  color: #6b7280;
  font-weight: 600;
}

.dropdown-arrow {
  font-size: 0.7rem;
  transition: transform 0.2s ease;
  color: #6b7280;
}

.selector-trigger.active .dropdown-arrow {
  transform: rotate(180deg);
}

.dropdown-menu {
  position: absolute;
  top: calc(100% + 0.5rem);
  left: 0;
  background: #ffffff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  min-width: 280px;
  z-index: 1000;
}

.dropdown-header {
  padding: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.dropdown-header h4 {
  margin: 0;
  font-size: 0.9rem;
  font-weight: 600;
  color: #6b7280;
}

.profile-list {
  max-height: 300px;
  overflow-y: auto;
  padding: 0.5rem 0;
}

.profile-option {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  width: 100%;
  padding: 0.75rem 1rem;
  background: none;
  border: none;
  color: #1f2937;
  cursor: pointer;
  transition: background 0.2s ease;
  text-align: left;
}

.profile-option:hover {
  background: #f9fafb;
}

.profile-option.active {
  background: #f0fdf4;
  color: #166534;
}

.option-icon {
  font-size: 1.3rem;
}

.option-info {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  flex: 1;
}

.option-name {
  font-weight: 500;
  font-size: 0.95rem;
  color: #111827;
}

.option-type {
  font-size: 0.7rem;
  color: #6b7280;
  text-transform: uppercase;
}

.check-mark {
  color: #4CAF50;
  font-size: 1.2rem;
  font-weight: bold;
}

.dropdown-footer {
  padding: 0.5rem;
  border-top: 1px solid #e5e7eb;
}

.manage-btn {
  width: 100%;
  padding: 0.6rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  color: #374151;
  cursor: pointer;
  font-size: 0.85rem;
  transition: all 0.2s ease;
  font-weight: 500;
}

.manage-btn:hover {
  background: #f3f4f6;
  border-color: #4CAF50;
  color: #166534;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.2s ease;
}

.dropdown-enter-from {
  opacity: 0;
  transform: translateY(-10px);
}

.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

/* Mobile responsive */
@media (max-width: 768px) {
  .selector-trigger {
    min-width: 150px;
    padding: 0.4rem 0.75rem;
  }

  .profile-name {
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .dropdown-menu {
    min-width: 240px;
  }
}
</style>
