import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy
} from 'firebase/firestore'
import { db } from './config'
import { logger } from '@/utils/logger'
import { authService } from './authService'
import type { Profile } from '@/types/profile'

const COLLECTION_NAME = 'profiles'
const ACTIVE_PROFILE_KEY = 'activeProfileId'

export const profileService = {
  // Create a new profile
  async createProfile(profile: Omit<Profile, 'id' | 'createdAt' | 'updatedAt'>): Promise<Profile> {
    try {
      const now = new Date().toISOString()

      // Get current user ID (required for auth)
      const userId = authService.getCurrentUserId()
      if (!userId) {
        throw new Error('User must be authenticated to create profiles')
      }

      const profileData = {
        ...profile,
        userId, // Add userId to the profile
        createdAt: now,
        updatedAt: now
      }
      const docRef = await addDoc(collection(db, COLLECTION_NAME), profileData)

      logger.info(`Profile created: ${profile.name}`, 'profileService')
      return { ...profileData, id: docRef.id }
    } catch (error) {
      logger.error('Error creating profile', 'profileService', error)
      throw error
    }
  },

  // Update an existing profile
  async updateProfile(id: string, profile: Partial<Profile>): Promise<void> {
    try {
      const profileRef = doc(db, COLLECTION_NAME, id)
      await updateDoc(profileRef, {
        ...profile,
        updatedAt: new Date().toISOString()
      })

      logger.info(`Profile updated: ${id}`, 'profileService')
    } catch (error) {
      logger.error('Error updating profile', 'profileService', error)
      throw error
    }
  },

  // Get a profile by ID
  async getProfileById(id: string): Promise<Profile | null> {
    try {
      const profileRef = doc(db, COLLECTION_NAME, id)
      const docSnap = await getDoc(profileRef)

      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as Profile
      } else {
        return null
      }
    } catch (error) {
      logger.error('Error getting profile by ID', 'profileService', error)
      throw error
    }
  },

  // Delete a profile
  async deleteProfile(id: string): Promise<void> {
    try {
      const profileRef = doc(db, COLLECTION_NAME, id)
      await deleteDoc(profileRef)

      // Clear active profile if it's the one being deleted
      const activeProfileId = this.getActiveProfileId()
      if (activeProfileId === id) {
        this.clearActiveProfile()
      }

      logger.info(`Profile deleted: ${id}`, 'profileService')
    } catch (error) {
      logger.error('Error deleting profile', 'profileService', error)
      throw error
    }
  },

  // Get all profiles
  async getAllProfiles(): Promise<Profile[]> {
    try {
      const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'))
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Profile[]
    } catch (error) {
      logger.warn('Ordered query failed, falling back to simple query', 'profileService', error)

      // Fallback to simple query without ordering
      try {
        const querySnapshot = await getDocs(collection(db, COLLECTION_NAME))
        return querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Profile[]
      } catch (fallbackError) {
        logger.error('Error getting all profiles', 'profileService', fallbackError)
        throw fallbackError
      }
    }
  },

  // Get active profiles only
  async getActiveProfiles(): Promise<Profile[]> {
    try {
      const q = query(
        collection(db, COLLECTION_NAME),
        where('isActive', '==', true),
        orderBy('name', 'asc')
      )
      const querySnapshot = await getDocs(q)

      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Profile[]
    } catch (error) {
      logger.warn('Filtered query failed, falling back to client-side filtering', 'profileService', error)

      // Fallback: get all and filter client-side
      const allProfiles = await this.getAllProfiles()
      return allProfiles.filter(p => p.isActive)
    }
  },

  // Set active profile in localStorage
  setActiveProfile(profileId: string): void {
    try {
      localStorage.setItem(ACTIVE_PROFILE_KEY, profileId)
      logger.info(`Active profile set to: ${profileId}`, 'profileService')
    } catch (error) {
      logger.error('Error setting active profile', 'profileService', error)
      throw error
    }
  },

  // Get active profile ID from localStorage
  getActiveProfileId(): string | null {
    try {
      return localStorage.getItem(ACTIVE_PROFILE_KEY)
    } catch (error) {
      logger.error('Error getting active profile', 'profileService', error)
      return null
    }
  },

  // Clear active profile
  clearActiveProfile(): void {
    try {
      localStorage.removeItem(ACTIVE_PROFILE_KEY)
      logger.info('Active profile cleared', 'profileService')
    } catch (error) {
      logger.error('Error clearing active profile', 'profileService', error)
      throw error
    }
  },

  // Get active profile with full data
  async getActiveProfile(): Promise<Profile | null> {
    const activeId = this.getActiveProfileId()
    if (!activeId) {
      return null
    }
    return this.getProfileById(activeId)
  },

  // Create default profile if none exists
  async initializeDefaultProfile(): Promise<Profile> {
    try {
      const profiles = await this.getAllProfiles()

      if (profiles.length === 0) {
        const defaultProfile = await this.createProfile({
          name: 'Default Profile',
          type: 'live',
          description: 'Main trading account',
          isActive: true,
          settings: {
            showInDashboard: true,
            includeInGlobalStats: true
          }
        })

        if (defaultProfile.id) {
          this.setActiveProfile(defaultProfile.id)
        }
        logger.info('Default profile created and activated', 'profileService')
        return defaultProfile
      }

      // If no active profile is set, activate the first one
      const activeId = this.getActiveProfileId()
      const firstProfile = profiles[0]
      if (!activeId && firstProfile?.id) {
        this.setActiveProfile(firstProfile.id)
      }

      return firstProfile || {} as Profile
    } catch (error) {
      logger.error('Error initializing default profile', 'profileService', error)
      throw error
    }
  }
}
