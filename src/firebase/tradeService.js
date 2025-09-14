import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy,
    where
} from 'firebase/firestore'
import { db } from './config'

const COLLECTION_NAME = 'trades'

export const tradeService = {
    // Create a new trade
    async addTrade(trade) {
        try {
            const docRef = await addDoc(collection(db, COLLECTION_NAME), {
                ...trade,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            })
            return { ...trade, id: docRef.id }
        } catch (error) {
            console.error('Error adding trade:', error)
            throw error
        }
    },

    // Update an existing trade
    async updateTrade(id, trade) {
        try {
            const tradeRef = doc(db, COLLECTION_NAME, id)
            await updateDoc(tradeRef, {
                ...trade,
                updatedAt: new Date().toISOString()
            })
            return { ...trade, id }
        } catch (error) {
            console.error('Error updating trade:', error)
            throw error
        }
    },

    // Delete a trade
    async deleteTrade(id) {
        try {
            const tradeRef = doc(db, COLLECTION_NAME, id)
            await deleteDoc(tradeRef)
            return id
        } catch (error) {
            console.error('Error deleting trade:', error)
            throw error
        }
    },

    // Get all trades
    async getAllTrades() {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('entryDate', 'desc'))
            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
        } catch (error) {
            console.error('Error getting trades:', error)
            throw error
        }
    },

    // Get trades for a specific year
    async getTradesByYear(year) {
        try {
            // Create date range for the year
            const startDate = `${year}-01-01`
            const endDate = `${year + 1}-01-01`
            
            const q = query(
                collection(db, COLLECTION_NAME),
                where('entryDate', '>=', startDate),
                where('entryDate', '<', endDate),
                orderBy('entryDate', 'desc')
            )
            const querySnapshot = await getDocs(q)
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))
        } catch (error) {
            console.error('Error getting trades by year:', error)
            throw error
        }
    },

    // Get available years (for year selector dropdown)
    async getAvailableYears() {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy('entryDate', 'desc'))
            const querySnapshot = await getDocs(q)
            const years = [...new Set(querySnapshot.docs.map(doc => 
                new Date(doc.data().entryDate).getFullYear()
            ))]
            return years.sort((a, b) => b - a)
        } catch (error) {
            console.error('Error getting available years:', error)
            throw error
        }
    }
}
