import { computed, onMounted } from 'vue'
import { useProfilesStore } from '@/stores/profiles'

/**
 * Composable for profiles management
 * This is now a wrapper around the Pinia store for backward compatibility
 */
export function useProfiles() {
  const profilesStore = useProfilesStore()

  // Load profiles on mount
  onMounted(() => {
    profilesStore.loadProfiles()
  })

  return {
    // State
    profiles: computed(() => profilesStore.profiles),
    activeProfile: computed(() => profilesStore.activeProfile),
    activeProfileId: computed(() => profilesStore.activeProfileId),
    activeProfiles: computed(() => profilesStore.activeProfiles),
    profilesByType: computed(() => profilesStore.profilesByType),
    loading: computed(() => profilesStore.loading),
    error: computed(() => profilesStore.error),

    // Methods
    loadProfiles: profilesStore.loadProfiles,
    createProfile: profilesStore.createProfile,
    updateProfile: profilesStore.updateProfile,
    deleteProfile: profilesStore.deleteProfile,
    switchProfile: profilesStore.switchProfile,
    duplicateProfile: profilesStore.duplicateProfile,
    getProfileById: profilesStore.getProfileById,

    // Helpers
    currencySymbol: computed(() => {
      const profile = profilesStore.activeProfile
      if (profile?.settings?.currency) return profile.settings.currency

      // Smart fallback for crypto profiles
      if (profile?.name?.toLowerCase().includes('crypto')) return '$'

      return '₹'
    })
  }
}
