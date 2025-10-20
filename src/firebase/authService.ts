import {
  getAuth,
  signInWithPopup,
  signOut as firebaseSignOut,
  GoogleAuthProvider,
  onAuthStateChanged,
  type User
} from 'firebase/auth'
import { logger } from '@/utils/logger'

// Initialize Firebase Auth
const auth = getAuth()

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()
googleProvider.setCustomParameters({
  prompt: 'select_account' // Always show account selection
})

export const authService = {
  // Get current user
  getCurrentUser(): User | null {
    return auth.currentUser
  },

  // Get current user ID
  getCurrentUserId(): string | null {
    return auth.currentUser?.uid || null
  },

  // Sign in with Google
  async signInWithGoogle(): Promise<User> {
    try {
      logger.info('Initiating Google sign-in', 'authService')
      const result = await signInWithPopup(auth, googleProvider)
      const user = result.user

      logger.info(`User signed in: ${user.email}`, 'authService')
      return user
    } catch (error: any) {
      logger.error('Google sign-in failed', 'authService', error)

      // Handle specific error codes
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Sign-in cancelled')
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup blocked by browser. Please allow popups and try again.')
      } else if (error.code === 'auth/cancelled-popup-request') {
        throw new Error('Sign-in cancelled')
      }

      throw new Error(`Sign-in failed: ${error.message}`)
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    try {
      logger.info('Signing out user', 'authService')
      await firebaseSignOut(auth)
      logger.info('User signed out successfully', 'authService')
    } catch (error) {
      logger.error('Sign-out failed', 'authService', error)
      throw new Error('Failed to sign out. Please try again.')
    }
  },

  // Listen to auth state changes
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    return onAuthStateChanged(auth, callback)
  },

  // Get user profile information
  getUserProfile() {
    const user = this.getCurrentUser()
    if (!user) return null

    return {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      emailVerified: user.emailVerified,
      isAnonymous: user.isAnonymous,
      metadata: {
        creationTime: user.metadata.creationTime,
        lastSignInTime: user.metadata.lastSignInTime
      }
    }
  }
}
