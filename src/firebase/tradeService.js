import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDocs,
    query,
    orderBy
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
    }
}
