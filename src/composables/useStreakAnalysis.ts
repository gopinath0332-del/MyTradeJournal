import { computed, type Ref } from 'vue'
import type { Trade } from '@/types'

export interface StreakMetrics {
    currentStreak: number
    currentStreakType: 'winning' | 'losing' | 'none'
    longestWinStreak: number
    longestLoseStreak: number
    averageWinStreak: number
    averageLoseStreak: number
    totalWinStreaks: number
    totalLoseStreaks: number
    streakHistory: StreakPeriod[]
}

export interface StreakPeriod {
    type: 'winning' | 'losing'
    length: number
    startDate: string
    endDate: string
    totalPnL: number
}

export interface SymbolStreak {
    symbol: string
    currentStreak: number
    currentStreakType: 'winning' | 'losing' | 'none'
    longestWinStreak: number
    longestLoseStreak: number
    trades: number
}

export interface StrategyStreak {
    strategy: string
    currentStreak: number
    currentStreakType: 'winning' | 'losing' | 'none'
    longestWinStreak: number
    longestLoseStreak: number
    trades: number
}

export function useStreakAnalysis(trades: Ref<Trade[]>) {
    // Calculate global streak metrics
    const globalStreakMetrics = computed<StreakMetrics>(() => {
        const sortedTrades = [...trades.value]
            .filter(trade => trade.exitDate && trade.pnlAmount !== undefined)
            .sort((a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime())

        if (sortedTrades.length === 0) {
            return {
                currentStreak: 0,
                currentStreakType: 'none',
                longestWinStreak: 0,
                longestLoseStreak: 0,
                averageWinStreak: 0,
                averageLoseStreak: 0,
                totalWinStreaks: 0,
                totalLoseStreaks: 0,
                streakHistory: []
            }
        }

        let currentStreak = 0
        let currentStreakType: 'winning' | 'losing' | 'none' = 'none'
        let longestWinStreak = 0
        let longestLoseStreak = 0
        let streakHistory: StreakPeriod[] = []
        let winStreaks: number[] = []
        let loseStreaks: number[] = []

        let tempStreak = 0
        let tempStreakType: 'winning' | 'losing' | null = null
        let tempStreakPnL = 0
        let tempStreakStart = ''

        sortedTrades.forEach((trade, index) => {
            const isWin = trade.pnlAmount! > 0
            const tradeType: 'winning' | 'losing' = isWin ? 'winning' : 'losing'

            if (index === 0) {
                tempStreak = 1
                tempStreakType = tradeType
                tempStreakPnL = trade.pnlAmount!
                tempStreakStart = trade.exitDate!
            } else {
                if (tradeType === tempStreakType) {
                    tempStreak++
                    tempStreakPnL += trade.pnlAmount!
                } else {
                    // Streak ended, record it
                    if (tempStreakType === 'winning') {
                        winStreaks.push(tempStreak)
                        longestWinStreak = Math.max(longestWinStreak, tempStreak)
                    } else if (tempStreakType === 'losing') {
                        loseStreaks.push(tempStreak)
                        longestLoseStreak = Math.max(longestLoseStreak, tempStreak)
                    }

                    if (tempStreakType && index > 0) {
                        streakHistory.push({
                            type: tempStreakType,
                            length: tempStreak,
                            startDate: tempStreakStart,
                            endDate: sortedTrades[index - 1]?.exitDate || tempStreakStart,
                            totalPnL: tempStreakPnL
                        })
                    }

                    // Start new streak
                    tempStreak = 1
                    tempStreakType = tradeType
                    tempStreakPnL = trade.pnlAmount!
                    tempStreakStart = trade.exitDate!
                }
            }

            // Update current streak (last trade)
            if (index === sortedTrades.length - 1) {
                currentStreak = tempStreak
                currentStreakType = tempStreakType || 'none'

                // Record the last streak
                if (tempStreakType === 'winning') {
                    winStreaks.push(tempStreak)
                    longestWinStreak = Math.max(longestWinStreak, tempStreak)
                } else if (tempStreakType === 'losing') {
                    loseStreaks.push(tempStreak)
                    longestLoseStreak = Math.max(longestLoseStreak, tempStreak)
                }

                if (tempStreakType) {
                    streakHistory.push({
                        type: tempStreakType,
                        length: tempStreak,
                        startDate: tempStreakStart,
                        endDate: trade.exitDate!,
                        totalPnL: tempStreakPnL
                    })
                }
            }
        })

        const averageWinStreak = winStreaks.length > 0
            ? winStreaks.reduce((sum, s) => sum + s, 0) / winStreaks.length
            : 0

        const averageLoseStreak = loseStreaks.length > 0
            ? loseStreaks.reduce((sum, s) => sum + s, 0) / loseStreaks.length
            : 0

        return {
            currentStreak,
            currentStreakType,
            longestWinStreak,
            longestLoseStreak,
            averageWinStreak,
            averageLoseStreak,
            totalWinStreaks: winStreaks.length,
            totalLoseStreaks: loseStreaks.length,
            streakHistory
        }
    })

    // Calculate per-symbol streak metrics
    const symbolStreakMetrics = computed<SymbolStreak[]>(() => {
        const symbolMap = new Map<string, Trade[]>()

        trades.value
            .filter(trade => trade.exitDate && trade.pnlAmount !== undefined)
            .forEach(trade => {
                if (!symbolMap.has(trade.symbol)) {
                    symbolMap.set(trade.symbol, [])
                }
                symbolMap.get(trade.symbol)!.push(trade)
            })

        return Array.from(symbolMap.entries()).map(([symbol, symbolTrades]) => {
            const sortedTrades = symbolTrades.sort(
                (a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime()
            )

            let currentStreak = 0
            let currentStreakType: 'winning' | 'losing' | 'none' = 'none'
            let longestWinStreak = 0
            let longestLoseStreak = 0

            let tempStreak = 0
            let tempStreakType: 'winning' | 'losing' | 'none' = 'none'

            sortedTrades.forEach((trade, index) => {
                const isWin = trade.pnlAmount! > 0
                const tradeType: 'winning' | 'losing' = isWin ? 'winning' : 'losing'

                if (index === 0) {
                    tempStreak = 1
                    tempStreakType = tradeType
                } else {
                    if (tradeType === tempStreakType) {
                        tempStreak++
                    } else {
                        if (tempStreakType === 'winning') {
                            longestWinStreak = Math.max(longestWinStreak, tempStreak)
                        } else {
                            longestLoseStreak = Math.max(longestLoseStreak, tempStreak)
                        }
                        tempStreak = 1
                        tempStreakType = tradeType
                    }
                }

                if (index === sortedTrades.length - 1) {
                    currentStreak = tempStreak
                    currentStreakType = tempStreakType
                    if (tempStreakType === 'winning') {
                        longestWinStreak = Math.max(longestWinStreak, tempStreak)
                    } else {
                        longestLoseStreak = Math.max(longestLoseStreak, tempStreak)
                    }
                }
            })

            return {
                symbol,
                currentStreak,
                currentStreakType,
                longestWinStreak,
                longestLoseStreak,
                trades: symbolTrades.length
            }
        }).sort((a, b) => b.currentStreak - a.currentStreak)
    })

    // Calculate per-strategy streak metrics
    const strategyStreakMetrics = computed<StrategyStreak[]>(() => {
        const strategyMap = new Map<string, Trade[]>()

        trades.value
            .filter(trade => trade.exitDate && trade.pnlAmount !== undefined && trade.strategy)
            .forEach(trade => {
                const strategy = trade.strategy || 'No Strategy'
                if (!strategyMap.has(strategy)) {
                    strategyMap.set(strategy, [])
                }
                strategyMap.get(strategy)!.push(trade)
            })

        return Array.from(strategyMap.entries()).map(([strategy, strategyTrades]) => {
            const sortedTrades = strategyTrades.sort(
                (a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime()
            )

            let currentStreak = 0
            let currentStreakType: 'winning' | 'losing' | 'none' = 'none'
            let longestWinStreak = 0
            let longestLoseStreak = 0

            let tempStreak = 0
            let tempStreakType: 'winning' | 'losing' | 'none' = 'none'

            sortedTrades.forEach((trade, index) => {
                const isWin = trade.pnlAmount! > 0
                const tradeType: 'winning' | 'losing' = isWin ? 'winning' : 'losing'

                if (index === 0) {
                    tempStreak = 1
                    tempStreakType = tradeType
                } else {
                    if (tradeType === tempStreakType) {
                        tempStreak++
                    } else {
                        if (tempStreakType === 'winning') {
                            longestWinStreak = Math.max(longestWinStreak, tempStreak)
                        } else {
                            longestLoseStreak = Math.max(longestLoseStreak, tempStreak)
                        }
                        tempStreak = 1
                        tempStreakType = tradeType
                    }
                }

                if (index === sortedTrades.length - 1) {
                    currentStreak = tempStreak
                    currentStreakType = tempStreakType
                    if (tempStreakType === 'winning') {
                        longestWinStreak = Math.max(longestWinStreak, tempStreak)
                    } else {
                        longestLoseStreak = Math.max(longestLoseStreak, tempStreak)
                    }
                }
            })

            return {
                strategy,
                currentStreak,
                currentStreakType,
                longestWinStreak,
                longestLoseStreak,
                trades: strategyTrades.length
            }
        }).sort((a, b) => b.currentStreak - a.currentStreak)
    })

    return {
        globalStreakMetrics,
        symbolStreakMetrics,
        strategyStreakMetrics
    }
}
