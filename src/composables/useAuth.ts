import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

/**
 * Composable for authentication
 * This is now a wrapper around the Pinia store for backward compatibility
 */
export function useAuth() {
  const authStore = useAuthStore()

  // Initialize auth listener
  authStore.initAuthListener()

  return {
    // State
    user: computed(() => authStore.user),
    isAuthenticated: computed(() => authStore.isAuthenticated),
    userProfile: computed(() => authStore.userProfile),
    loading: computed(() => authStore.loading),
    authLoading: computed(() => authStore.authLoading),
    isAuthReady: computed(() => authStore.isAuthReady),
    error: computed(() => authStore.authError),

    // Methods
    signInWithGoogle: authStore.signInWithGoogle,
    signOut: authStore.signOut,
    clearError: authStore.clearError
  }
}
