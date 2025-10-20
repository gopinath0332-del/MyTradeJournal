import { ref, computed, onMounted } from 'vue'
import { authService } from '@/firebase/authService'
import { logger } from '@/utils/logger'
import type { User } from 'firebase/auth'

// Shared state across all instances
const currentUser = ref<User | null>(null)
const isAuthReady = ref(false)
const authLoading = ref(true)
const authError = ref<string | null>(null)

// Auth state listener - set up once globally
let unsubscribe: (() => void) | null = null

const initAuthListener = () => {
  if (unsubscribe) return // Already initialized

  unsubscribe = authService.onAuthStateChanged((user) => {
    currentUser.value = user
    isAuthReady.value = true
    authLoading.value = false

    if (user) {
      logger.info(`Auth state: User signed in - ${user.email}`, 'useAuth')
    } else {
      logger.info('Auth state: No user signed in', 'useAuth')
    }
  })
}

// Initialize on module load
if (typeof window !== 'undefined') {
  initAuthListener()
}

export function useAuth() {
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Computed properties
  const user = computed(() => currentUser.value)
  const isAuthenticated = computed(() => !!currentUser.value)
  const userProfile = computed(() => authService.getUserProfile())

  // Sign in with Google
  const signInWithGoogle = async() => {
    loading.value = true
    error.value = null

    try {
      await authService.signInWithGoogle()
      // User state will be updated by onAuthStateChanged listener
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign in'
      error.value = message
      authError.value = message
      logger.error('Sign-in error in composable', 'useAuth', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Sign out
  const signOut = async() => {
    loading.value = true
    error.value = null

    try {
      await authService.signOut()
      // User state will be updated by onAuthStateChanged listener
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to sign out'
      error.value = message
      authError.value = message
      logger.error('Sign-out error in composable', 'useAuth', err)
      throw err
    } finally {
      loading.value = false
    }
  }

  // Clear error
  const clearError = () => {
    error.value = null
    authError.value = null
  }

  // Initialize listener if not already done
  onMounted(() => {
    initAuthListener()
  })

  return {
    // State
    user,
    isAuthenticated,
    userProfile,
    loading,
    authLoading,
    isAuthReady,
    error,

    // Methods
    signInWithGoogle,
    signOut,
    clearError
  }
}
