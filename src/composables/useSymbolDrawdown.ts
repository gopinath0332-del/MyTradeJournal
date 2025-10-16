import { computed, type Ref } from 'vue'
import type { Trade } from '@/types'

export interface SymbolDrawdownMetrics {
    symbol: string
    totalTrades: number
    currentEquity: number
    peakEquity: number
    currentDrawdown: number
    currentDrawdownPercent: number
    maxDrawdown: number
    maxDrawdownPercent: number
    timeInDrawdown: number
    timeInDrawdownRatio: number
    recoveryEfficiency: number
    equityHistory: EquityPoint[]
    drawdownPeriods: DrawdownPeriod[]
    avgRecoveryTime: number
    isInDrawdown: boolean
}

export interface EquityPoint {
    date: string
    equity: number
    peak: number
    drawdown: number
    drawdownPercent: number
}

export interface DrawdownPeriod {
    startDate: string
    endDate: string | null
    startEquity: number
    lowestEquity: number
    recoveredEquity: number | null
    maxDrawdown: number
    maxDrawdownPercent: number
    daysInDrawdown: number
    daysToRecover: number | null
    recovered: boolean
}

export function useSymbolDrawdown(trades: Ref<Trade[]>) {
    // Calculate drawdown metrics per symbol
    const symbolDrawdownMetrics = computed<SymbolDrawdownMetrics[]>(() => {
        const symbolMap = new Map<string, Trade[]>()

        // Group trades by symbol
        trades.value
            .filter(trade => trade.exitDate && trade.pnlAmount !== undefined)
            .forEach(trade => {
                if (!symbolMap.has(trade.symbol)) {
                    symbolMap.set(trade.symbol, [])
                }
                symbolMap.get(trade.symbol)!.push(trade)
            })

        return Array.from(symbolMap.entries()).map(([symbol, symbolTrades]) => {
            // Sort trades by exit date
            const sortedTrades = symbolTrades.sort(
                (a, b) => new Date(a.exitDate!).getTime() - new Date(b.exitDate!).getTime()
            )

            // Build equity curve
            const equityHistory: EquityPoint[] = []
            let runningEquity = 0
            let peakEquity = 0

            sortedTrades.forEach(trade => {
                runningEquity += trade.pnlAmount!
                peakEquity = Math.max(peakEquity, runningEquity)

                const drawdown = peakEquity - runningEquity
                const drawdownPercent = peakEquity > 0 ? (drawdown / peakEquity) * 100 : 0

                equityHistory.push({
                    date: trade.exitDate!,
                    equity: runningEquity,
                    peak: peakEquity,
                    drawdown,
                    drawdownPercent
                })
            })

            // Identify drawdown periods
            const drawdownPeriods: DrawdownPeriod[] = []
            let inDrawdown = false
            let drawdownStartIndex = -1
            let lowestEquity = 0
            let maxDrawdown = 0
            let maxDrawdownPercent = 0

            for (let i = 0; i < equityHistory.length; i++) {
                const point = equityHistory[i]
                if (!point) continue

                if (point.drawdown > 0 && !inDrawdown) {
                    // Start of new drawdown period
                    inDrawdown = true
                    drawdownStartIndex = i
                    lowestEquity = point.equity
                    maxDrawdown = point.drawdown
                    maxDrawdownPercent = point.drawdownPercent
                } else if (point.drawdown > 0 && inDrawdown) {
                    // Update max drawdown in current period
                    if (point.equity < lowestEquity) {
                        lowestEquity = point.equity
                    }
                    if (point.drawdown > maxDrawdown) {
                        maxDrawdown = point.drawdown
                        maxDrawdownPercent = point.drawdownPercent
                    }
                } else if (point.drawdown === 0 && inDrawdown) {
                    // End of drawdown period - recovered to peak
                    const startPoint = equityHistory[drawdownStartIndex]
                    if (startPoint) {
                        drawdownPeriods.push({
                            startDate: startPoint.date,
                            endDate: point.date,
                            startEquity: startPoint.peak,
                            lowestEquity,
                            recoveredEquity: point.equity,
                            maxDrawdown,
                            maxDrawdownPercent,
                            daysInDrawdown: i - drawdownStartIndex,
                            daysToRecover: i - drawdownStartIndex,
                            recovered: true
                        })
                    }
                    inDrawdown = false
                    drawdownStartIndex = -1
                }
            }

            // If still in drawdown at the end
            if (inDrawdown && drawdownStartIndex >= 0) {
                const startPoint = equityHistory[drawdownStartIndex]
                if (startPoint) {
                    drawdownPeriods.push({
                        startDate: startPoint.date,
                        endDate: null,
                        startEquity: startPoint.peak,
                        lowestEquity,
                        recoveredEquity: null,
                        maxDrawdown,
                        maxDrawdownPercent,
                        daysInDrawdown: equityHistory.length - drawdownStartIndex,
                        daysToRecover: null,
                        recovered: false
                    })
                }
            }

            // Calculate time in drawdown
            const totalDays = equityHistory.length
            const daysInDrawdown = equityHistory.filter(p => p.drawdown > 0).length
            const timeInDrawdownRatio = totalDays > 0 ? daysInDrawdown / totalDays : 0

            // Calculate recovery efficiency
            const recoveredPeriods = drawdownPeriods.filter(p => p.recovered && p.daysToRecover !== null)
            const avgRecoveryTime = recoveredPeriods.length > 0
                ? recoveredPeriods.reduce((sum, p) => sum + p.daysToRecover!, 0) / recoveredPeriods.length
                : 0

            // Recovery efficiency: lower is better (faster recovery)
            // Scale: 0-100, where 100 is instant recovery, 0 is never recovers
            let recoveryEfficiency = 0
            if (recoveredPeriods.length > 0) {
                const normalizedRecoveryTime = avgRecoveryTime / totalDays
                // Better recovery = lower time relative to drawdown depth
                recoveryEfficiency = Math.max(0, 100 - (normalizedRecoveryTime * 100))
            }

            // Current state
            const lastPoint = equityHistory[equityHistory.length - 1] || {
                equity: 0,
                peak: 0,
                drawdown: 0,
                drawdownPercent: 0
            }

            const maxDrawdownPoint = equityHistory.reduce((max, point) =>
                point.drawdown > max.drawdown ? point : max
                , equityHistory[0] || { drawdown: 0, drawdownPercent: 0 })

            return {
                symbol,
                totalTrades: sortedTrades.length,
                currentEquity: lastPoint.equity,
                peakEquity: lastPoint.peak,
                currentDrawdown: lastPoint.drawdown,
                currentDrawdownPercent: lastPoint.drawdownPercent,
                maxDrawdown: maxDrawdownPoint.drawdown,
                maxDrawdownPercent: maxDrawdownPoint.drawdownPercent,
                timeInDrawdown: daysInDrawdown,
                timeInDrawdownRatio,
                recoveryEfficiency,
                equityHistory,
                drawdownPeriods,
                avgRecoveryTime,
                isInDrawdown: lastPoint.drawdown > 0
            }
        }).sort((a, b) => b.maxDrawdownPercent - a.maxDrawdownPercent) // Sort by worst drawdown
    })

    return {
        symbolDrawdownMetrics
    }
}
