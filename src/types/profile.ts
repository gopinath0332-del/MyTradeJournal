// Profile type definitions
export type ProfileType = 'live' | 'paper' | 'strategy' | 'custom'

export interface Profile {
  id?: string
  name: string
  type: ProfileType
  description?: string
  settings: ProfileSettings
  isActive: boolean
  color?: string // UI color for visual distinction
  icon?: string // emoji or icon identifier
  userId?: string // Associate profile with a user (for authentication)
  createdAt: string
  updatedAt: string
}

export interface ProfileSettings {
  // Trading parameters
  defaultRiskPerTrade?: number
  defaultPositionSize?: number
  maxOpenPositions?: number

  // Strategy specific
  strategyName?: string
  strategyVersion?: string

  // Environment
  broker?: string
  accountNumber?: string

  // Display preferences
  showInDashboard?: boolean
  includeInGlobalStats?: boolean
}

export interface ProfileStats {
  totalTrades: number
  netPnL: number
  winRate: number
  avgPnL: number
  lastTradeDate?: string
}
