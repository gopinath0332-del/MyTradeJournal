import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { profileService } from '@/firebase/profileService'
import { logger } from '@/utils/logger'
import type { Profile, ProfileType } from '@/types/profile'

export const useProfilesStore = defineStore('profiles', () => {
  // State
  const profiles = ref<Profile[]>([])
  const activeProfileId = ref<string | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters (computed)
  const activeProfile = computed(() =>
    profiles.value.find(p => p.id === activeProfileId.value) || null
  )

  const activeProfiles = computed(() =>
    profiles.value.filter(p => p.isActive)
  )

  const profilesByType = computed(() => {
    const grouped: Record<ProfileType, Profile[]> = {
      live: [],
      paper: [],
      strategy: [],
      custom: []
    }
    profiles.value.forEach(profile => {
      grouped[profile.type].push(profile)
    })
    return grouped
  })

  // Actions
  async function loadProfiles() {
    loading.value = true
    error.value = null

    try {
      profiles.value = await profileService.getAllProfiles()

      // Load active profile ID
      activeProfileId.value = profileService.getActiveProfileId()

      // Initialize default profile if none exists
      if (profiles.value.length === 0) {
        const defaultProfile = await profileService.initializeDefaultProfile()
        profiles.value = [defaultProfile]
        activeProfileId.value = defaultProfile.id || null
      }

      logger.info(`Loaded ${profiles.value.length} profiles`, 'profilesStore')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load profiles'
      logger.error('Error loading profiles', 'profilesStore', err)
    } finally {
      loading.value = false
    }
  }

  async function createProfile(profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null

    try {
      const newProfile = await profileService.createProfile(profileData)
      profiles.value.push(newProfile)

      logger.info(`Profile created: ${newProfile.name}`, 'profilesStore')
      return newProfile
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create profile'
      logger.error('Error creating profile', 'profilesStore', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function updateProfile(id: string, updates: Partial<Profile>) {
    loading.value = true
    error.value = null

    try {
      await profileService.updateProfile(id, updates)

      // Reload profiles to get latest data
      await loadProfiles()

      logger.info(`Profile updated: ${id}`, 'profilesStore')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update profile'
      logger.error('Error updating profile', 'profilesStore', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function deleteProfile(id: string) {
    loading.value = true
    error.value = null

    try {
      // Don't allow deleting the last profile
      if (profiles.value.length <= 1) {
        throw new Error('Cannot delete the last profile')
      }

      await profileService.deleteProfile(id)
      profiles.value = profiles.value.filter(p => p.id !== id)

      // If deleted profile was active, switch to another
      if (activeProfileId.value === id && profiles.value.length > 0) {
        const firstProfile = profiles.value[0]
        if (firstProfile?.id) {
          await switchProfile(firstProfile.id)
        }
      }

      logger.info(`Profile deleted: ${id}`, 'profilesStore')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete profile'
      logger.error('Error deleting profile', 'profilesStore', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function switchProfile(profileId: string) {
    try {
      const profile = profiles.value.find(p => p.id === profileId)
      if (!profile) {
        throw new Error('Profile not found')
      }

      profileService.setActiveProfile(profileId)
      activeProfileId.value = profileId

      logger.info(`Switched to profile: ${profile.name}`, 'profilesStore')

      // Emit event for components to react to profile change
      window.dispatchEvent(new CustomEvent('profile-changed', {
        detail: { profileId, profile }
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to switch profile'
      logger.error('Error switching profile', 'profilesStore', err)
      throw err
    }
  }

  async function duplicateProfile(id: string, newName: string) {
    loading.value = true
    error.value = null

    try {
      const original = profiles.value.find(p => p.id === id)
      if (!original) {
        throw new Error('Profile not found')
      }

      const { id: _, createdAt: __, updatedAt: ___, ...profileData } = original
      const duplicated = await createProfile({
        ...profileData,
        name: newName
      })

      logger.info(`Profile duplicated: ${newName}`, 'profilesStore')
      return duplicated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to duplicate profile'
      logger.error('Error duplicating profile', 'profilesStore', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function getProfileById(id: string): Profile | undefined {
    return profiles.value.find(p => p.id === id)
  }

  return {
    // State
    profiles,
    activeProfileId,
    loading,
    error,

    // Getters
    activeProfile,
    activeProfiles,
    profilesByType,

    // Actions
    loadProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    duplicateProfile,
    getProfileById
  }
})
