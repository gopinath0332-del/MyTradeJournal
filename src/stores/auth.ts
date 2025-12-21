import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/firebase/authService'
import { logger } from '@/utils/logger'
import type { User } from 'firebase/auth'

export const useAuthStore = defineStore('auth', () => {
  // State
  const currentUser = ref<User | null>(null)
  const isAuthReady = ref(false)
  const authLoading = ref(true)
  const authError = ref<string | null>(null)
  const loading = ref(false)

  // Auth state listener - set up once globally
  let unsubscribe: (() => void) | null = null

  // Getters (computed)
  const user = computed(() => currentUser.value)
  const isAuthenticated = computed(() => !!currentUser.value)
  const userProfile = computed(() => authService.getUserProfile())

  // Actions
  function initAuthListener() {
    if (unsubscribe) return // Already initialized

    unsubscribe = authService.onAuthStateChanged((user) => {
      currentUser.value = user
      isAuthReady.value = true
      authLoading.value = false

      if (user) {
        logger.info(`Auth state: User signed in - ${user.email}`, 'authStore')
      } else {
        logger.info('Auth state: No user signed in', 'authStore')
      }
    })
  }

  async function signInWithGoogle() {
    loading.value = true
    authError.value = null

    try {
      await authService.signInWithGoogle()
      // User state will be updated by onAuthStateChanged listener
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in'
      authError.value = message
      logger.error('Sign-in error in store', 'authStore', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    loading.value = true
    authError.value = null

    try {
      await authService.signOut()
      // User state will be updated by onAuthStateChanged listener
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out'
      authError.value = message
      logger.error('Sign-out error in store', 'authStore', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  function clearError() {
    authError.value = null
  }

  // Initialize on module load
  if (typeof window !== 'undefined') {
    initAuthListener()
  }

  return {
    // State
    currentUser,
    isAuthReady,
    authLoading,
    authError,
    loading,

    // Getters
    user,
    isAuthenticated,
    userProfile,

    // Actions
    initAuthListener,
    signInWithGoogle,
    signOut,
    clearError
  }
})
