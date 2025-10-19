import { ref, computed, onMounted } from 'vue'
import { profileService } from '@/firebase/profileService'
import { logger } from '@/utils/logger'
import type { Profile, ProfileType } from '@/types/profile'

const profiles = ref<Profile[]>([])
const activeProfileId = ref<string | null>(null)
const loading = ref(false)
const error = ref<string | null>(null)

export function useProfiles() {
  // Computed properties
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

  // Load all profiles
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

      logger.info(`Loaded ${profiles.value.length} profiles`, 'useProfiles')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load profiles'
      logger.error('Error loading profiles', 'useProfiles', err)
    } finally {
      loading.value = false
    }
  }

  // Create new profile
  async function createProfile(profileData: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>) {
    loading.value = true
    error.value = null

    try {
      const newProfile = await profileService.createProfile(profileData)
      profiles.value.push(newProfile)

      logger.info(`Profile created: ${newProfile.name}`, 'useProfiles')
      return newProfile
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to create profile'
      logger.error('Error creating profile', 'useProfiles', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Update existing profile
  async function updateProfile(id: string, updates: Partial<Profile>) {
    loading.value = true
    error.value = null

    try {
      await profileService.updateProfile(id, updates)

      // Reload profiles to get latest data
      await loadProfiles()

      logger.info(`Profile updated: ${id}`, 'useProfiles')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to update profile'
      logger.error('Error updating profile', 'useProfiles', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Delete profile
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

      logger.info(`Profile deleted: ${id}`, 'useProfiles')
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to delete profile'
      logger.error('Error deleting profile', 'useProfiles', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Switch active profile
  async function switchProfile(profileId: string) {
    try {
      const profile = profiles.value.find(p => p.id === profileId)
      if (!profile) {
        throw new Error('Profile not found')
      }

      profileService.setActiveProfile(profileId)
      activeProfileId.value = profileId

      logger.info(`Switched to profile: ${profile.name}`, 'useProfiles')

      // Emit event for components to react to profile change
      window.dispatchEvent(new CustomEvent('profile-changed', {
        detail: { profileId, profile }
      }))
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to switch profile'
      logger.error('Error switching profile', 'useProfiles', err)
      throw err
    }
  }

  // Duplicate profile
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

      logger.info(`Profile duplicated: ${newName}`, 'useProfiles')
      return duplicated
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to duplicate profile'
      logger.error('Error duplicating profile', 'useProfiles', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Get profile by ID
  function getProfileById(id: string): Profile | undefined {
    return profiles.value.find(p => p.id === id)
  }

  // Initialize on mount
  onMounted(() => {
    loadProfiles()
  })

  return {
    // State
    profiles,
    activeProfile,
    activeProfileId,
    activeProfiles,
    profilesByType,
    loading,
    error,

    // Methods
    loadProfiles,
    createProfile,
    updateProfile,
    deleteProfile,
    switchProfile,
    duplicateProfile,
    getProfileById
  }
}
