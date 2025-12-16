/**
 * Profile Data Migration Utility
 *
 * This utility helps migrate trades between profiles.
 * Specifically designed to move data that doesn't belong to
 * "Swing" or "Paper" profiles to the "F&O" profile.
 */

import { collection, getDocs, updateDoc, doc, query, where } from 'firebase/firestore'
import { db } from '@/firebase/config'
import { authService } from '@/firebase/authService'
import { logger } from './logger'
import type { Trade } from '@/types'
import type { Profile } from '@/types/profile'

interface MigrationResult {
  success: boolean
  migratedCount: number
  errors: string[]
  details: {
    totalTrades: number
    swingTrades: number
    paperTrades: number
    otherTrades: number
  }
}

export const profileMigration = {
  /**
   * Migrate trades that don't belong to Swing or Paper profiles to F&O profile
   */
  async migrateToFnO(): Promise<MigrationResult> {
    const result: MigrationResult = {
      success: false,
      migratedCount: 0,
      errors: [],
      details: {
        totalTrades: 0,
        swingTrades: 0,
        paperTrades: 0,
        otherTrades: 0
      }
    }

    try {
      // Get current user ID
      const userId = authService.getCurrentUserId()
      if (!userId) {
        throw new Error('User must be authenticated to migrate profiles')
      }

      logger.info('Starting profile migration to F&O', 'profileMigration')

      // Step 1: Get all profiles
      const profilesQuery = query(
        collection(db, 'profiles'),
        where('userId', '==', userId)
      )
      const profilesSnapshot = await getDocs(profilesQuery)
      const profiles = profilesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Profile[]

      // Find profile IDs
      const swingProfile = profiles.find(p => p.name.toLowerCase() === 'swing')
      const paperProfile = profiles.find(p => p.name.toLowerCase() === 'paper')
      const fnoProfile = profiles.find(p => p.name.toLowerCase() === 'f&o')

      if (!fnoProfile) {
        throw new Error('F&O profile not found. Please create it first.')
      }

      logger.info(`Found profiles - Swing: ${swingProfile?.id}, Paper: ${paperProfile?.id}, F&O: ${fnoProfile.id}`, 'profileMigration')

      // Step 2: Get all trades
      const tradesQuery = query(
        collection(db, 'trades'),
        where('userId', '==', userId)
      )
      const tradesSnapshot = await getDocs(tradesQuery)
      const trades = tradesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[]

      result.details.totalTrades = trades.length

      // Step 3: Categorize and migrate trades
      for (const trade of trades) {
        // Count trades by profile
        if (swingProfile && trade.profileId === swingProfile.id) {
          result.details.swingTrades++
          continue // Keep in Swing
        }

        if (paperProfile && trade.profileId === paperProfile.id) {
          result.details.paperTrades++
          continue // Keep in Paper
        }

        // This trade needs to be migrated to F&O
        result.details.otherTrades++

        try {
          if (!trade.id) continue
          const tradeRef = doc(db, 'trades', trade.id)
          await updateDoc(tradeRef, {
            profileId: fnoProfile.id,
            updatedAt: new Date().toISOString()
          })
          result.migratedCount++
          logger.info(`Migrated trade ${trade.id} to F&O profile`, 'profileMigration')
        } catch (error) {
          const errorMsg = `Failed to migrate trade ${trade.id}: ${error}`
          result.errors.push(errorMsg)
          logger.error(errorMsg, 'profileMigration', error)
        }
      }

      result.success = result.errors.length === 0
      logger.info(`Migration complete: ${result.migratedCount} trades migrated to F&O`, 'profileMigration')

      return result
    } catch (error) {
      const errorMsg = `Migration failed: ${error}`
      result.errors.push(errorMsg)
      logger.error(errorMsg, 'profileMigration', error)
      return result
    }
  },

  /**
   * Preview what would be migrated without actually migrating
   */
  async previewMigration(): Promise<{
    totalTrades: number
    swingTrades: number
    paperTrades: number
    tradesToMigrate: number
    fnoProfileExists: boolean
    tradeIds: string[]
  }> {
    try {
      const userId = authService.getCurrentUserId()
      if (!userId) {
        throw new Error('User must be authenticated')
      }

      // Get all profiles
      const profilesQuery = query(
        collection(db, 'profiles'),
        where('userId', '==', userId)
      )
      const profilesSnapshot = await getDocs(profilesQuery)
      const profiles = profilesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Profile[]

      const swingProfile = profiles.find(p => p.name.toLowerCase() === 'swing')
      const paperProfile = profiles.find(p => p.name.toLowerCase() === 'paper')
      const fnoProfile = profiles.find(p => p.name.toLowerCase() === 'f&o')

      // Get all trades
      const tradesQuery = query(
        collection(db, 'trades'),
        where('userId', '==', userId)
      )
      const tradesSnapshot = await getDocs(tradesQuery)
      const trades = tradesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Trade[]

      let swingCount = 0
      let paperCount = 0
      const tradeIdsToMigrate: string[] = []

      for (const trade of trades) {
        if (swingProfile && trade.profileId === swingProfile.id) {
          swingCount++
        } else if (paperProfile && trade.profileId === paperProfile.id) {
          paperCount++
        } else {
          if (trade.id) {
            tradeIdsToMigrate.push(trade.id)
          }
        }
      }

      return {
        totalTrades: trades.length,
        swingTrades: swingCount,
        paperTrades: paperCount,
        tradesToMigrate: tradeIdsToMigrate.length,
        fnoProfileExists: !!fnoProfile,
        tradeIds: tradeIdsToMigrate
      }
    } catch (error) {
      logger.error('Error previewing migration', 'profileMigration', error)
      throw error
    }
  }
}
