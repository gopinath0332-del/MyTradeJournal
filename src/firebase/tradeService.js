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

// LocalStorage fallback functions
const localStorageService = {
    getTrades() {
        return JSON.parse(localStorage.getItem('trades') || '[]')
    },
    
    saveTrades(trades) {
        localStorage.setItem('trades', JSON.stringify(trades))
    },
    
    addTrade(trade) {
        const trades = this.getTrades()
        const newTrade = {
            ...trade,
            id: Date.now().toString(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        }
        trades.push(newTrade)
        this.saveTrades(trades)
        return newTrade
    },
    
    updateTrade(id, updatedTrade) {
        const trades = this.getTrades()
        const index = trades.findIndex(t => t.id === id)
        if (index !== -1) {
            trades[index] = { ...updatedTrade, id, updatedAt: new Date().toISOString() }
            this.saveTrades(trades)
            return trades[index]
        }
        throw new Error('Trade not found')
    },
    
    deleteTrade(id) {
        const trades = this.getTrades()
        const filteredTrades = trades.filter(t => t.id !== id)
        this.saveTrades(filteredTrades)
        return id
    }
}

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
            console.error('Error adding trade to Firebase, falling back to localStorage:', error)
            return localStorageService.addTrade(trade)
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
            console.error('Error updating trade in Firebase, falling back to localStorage:', error)
            return localStorageService.updateTrade(id, trade)
        }
    },

    // Delete a trade
    async deleteTrade(id) {
        try {
            const tradeRef = doc(db, COLLECTION_NAME, id)
            await deleteDoc(tradeRef)
            return id
        } catch (error) {
            console.error('Error deleting trade from Firebase, falling back to localStorage:', error)
            return localStorageService.deleteTrade(id)
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
    },

    // Get trades with filters applied on server-side
    async getFilteredTrades(filters = {}) {
        try {
            let q = query(collection(db, COLLECTION_NAME))
            const conditions = []

            // Apply date range filter
            if (filters.startDate && filters.endDate) {
                conditions.push(where('entryDate', '>=', filters.startDate))
                conditions.push(where('entryDate', '<=', filters.endDate))
            } else if (filters.dateRange && filters.dateRange !== 'all') {
                const now = new Date()
                let startDate

                if (filters.dateRange === 'current-month') {
                    startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
                    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999).toISOString()
                    conditions.push(where('entryDate', '>=', startDate))
                    conditions.push(where('entryDate', '<=', endDate))
                } else if (filters.dateRange === '7' || filters.dateRange === '30' || filters.dateRange === '90') {
                    const daysBack = parseInt(filters.dateRange)
                    startDate = new Date()
                    startDate.setDate(startDate.getDate() - daysBack)
                    conditions.push(where('entryDate', '>=', startDate.toISOString()))
                }
            }

            // Apply symbol filter
            if (filters.symbol && filters.symbol !== 'all') {
                conditions.push(where('symbol', '==', filters.symbol))
            }

            // Apply type filter
            if (filters.type && filters.type !== 'all') {
                conditions.push(where('type', '==', filters.type))
            }

            // Build query with conditions
            if (conditions.length > 0) {
                q = query(collection(db, COLLECTION_NAME), ...conditions, orderBy('entryDate', 'desc'))
            } else {
                q = query(collection(db, COLLECTION_NAME), orderBy('entryDate', 'desc'))
            }

            const querySnapshot = await getDocs(q)
            let trades = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }))

            // Apply profitability filter on client-side (since we can't easily do complex calculations in Firestore)
            if (filters.profitability && filters.profitability !== 'all') {
                trades = trades.filter(trade => {
                    const pnl = trade.pnlAmount || 0
                    if (filters.profitability === 'profit') {
                        return pnl > 0
                    } else if (filters.profitability === 'loss') {
                        return pnl < 0
                    }
                    return true
                })
            }

            return trades
        } catch (error) {
            console.error('Error getting filtered trades from Firebase, falling back to localStorage:', error)
            // Fallback to localStorage and apply filters client-side
            let trades = localStorageService.getTrades()
            
            // Apply filters client-side
            if (filters.dateRange && filters.dateRange !== 'all') {
                const now = new Date()
                if (filters.dateRange === 'current-month') {
                    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
                    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0)
                    trades = trades.filter(trade => {
                        const tradeDate = new Date(trade.entryDate)
                        return tradeDate >= startOfMonth && tradeDate <= endOfMonth
                    })
                } else if (['7', '30', '90'].includes(filters.dateRange)) {
                    const daysBack = parseInt(filters.dateRange)
                    const cutoffDate = new Date()
                    cutoffDate.setDate(cutoffDate.getDate() - daysBack)
                    trades = trades.filter(trade => new Date(trade.entryDate) >= cutoffDate)
                }
            }
            
            if (filters.startDate && filters.endDate) {
                trades = trades.filter(trade => {
                    const tradeDate = new Date(trade.entryDate)
                    return tradeDate >= new Date(filters.startDate) && tradeDate <= new Date(filters.endDate)
                })
            }
            
            if (filters.symbol && filters.symbol !== 'all') {
                trades = trades.filter(trade => trade.symbol === filters.symbol)
            }
            
            if (filters.type && filters.type !== 'all') {
                trades = trades.filter(trade => trade.type === filters.type)
            }
            
            if (filters.profitability && filters.profitability !== 'all') {
                trades = trades.filter(trade => {
                    const pnl = trade.pnlAmount || 0
                    if (filters.profitability === 'profit') {
                        return pnl > 0
                    } else if (filters.profitability === 'loss') {
                        return pnl < 0
                    }
                    return true
                })
            }
            
            // Sort by entry date descending
            trades.sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
            
            return trades
        }
    },

    // Get unique symbols without loading all trade data
    async getUniqueSymbols() {
        try {
            const q = query(collection(db, COLLECTION_NAME))
            const querySnapshot = await getDocs(q)
            const symbols = [...new Set(querySnapshot.docs.map(doc => doc.data().symbol))]
            return symbols.sort()
        } catch (error) {
            console.error('Error getting unique symbols from Firebase, falling back to localStorage:', error)
            const trades = localStorageService.getTrades()
            const symbols = [...new Set(trades.map(trade => trade.symbol))]
            return symbols.sort()
        }
    }
}
