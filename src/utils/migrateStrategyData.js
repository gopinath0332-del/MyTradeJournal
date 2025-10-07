// Utility to add strategy field to existing trades
// This can be run to populate strategy data for existing trades

import { tradeService } from '@/firebase/tradeService'

export async function migrateStrategyData() {
  try {
    console.log('Starting strategy data migration...')

    // Get all trades
    const allTrades = await tradeService.getAllTrades()
    console.log(`Found ${allTrades.length} trades`)

    let updatedCount = 0

    for (const trade of allTrades) {
      // Skip if trade already has strategy
      if (trade.strategy && trade.strategy.trim() !== '') {
        continue
      }

      // Add default strategy based on some logic or randomly assign
      const strategies = ['Supertrend', 'Donchian']
      const randomStrategy = strategies[Math.floor(Math.random() * strategies.length)]

      // Update the trade with strategy
      const updatedTrade = {
        ...trade,
        strategy: randomStrategy
      }

      await tradeService.updateTrade(updatedTrade)
      updatedCount++

      console.log(`Updated trade ${trade.id} with strategy: ${randomStrategy}`)
    }

    console.log(`Migration complete! Updated ${updatedCount} trades`)
    return { success: true, updatedCount }
  } catch (error) {
    console.error('Migration failed:', error)
    return { success: false, error: error.message }
  }
}

// Alternative function to add strategy to specific trades
export async function addStrategyToTrade(tradeId, strategy) {
  try {
    const trade = await tradeService.getTrade(tradeId)
    if (!trade) {
      throw new Error('Trade not found')
    }

    const updatedTrade = {
      ...trade,
      strategy
    }

    await tradeService.updateTrade(updatedTrade)
    console.log(`Added strategy ${strategy} to trade ${tradeId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to add strategy:', error)
    return { success: false, error: error.message }
  }
}
