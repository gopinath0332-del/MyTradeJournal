// Failure Mode Classification Types

export type FailureModeCategory =
  | 'entry'
  | 'exit'
  | 'risk-management'
  | 'psychology'
  | 'market-conditions'
  | 'strategy'
  | 'technical'

export interface FailureMode {
  id: string
  category: FailureModeCategory
  label: string
  description: string
  color: string
  icon: string
}

export interface FailureModeTag {
  id: string
  timestamp: string
}

export interface FailureModeData {
  tags: string[] // Array of failure mode IDs
  notes?: string // Optional detailed notes about the failure
  confidence?: number // Confidence in the failure classification (1-5)
}

// Predefined failure modes with heuristic tagging
export const FAILURE_MODES: FailureMode[] = [
  // Entry-related failures
  {
    id: 'poor-entry-timing',
    category: 'entry',
    label: 'Poor Entry Timing',
    description: 'Entered too early or too late relative to optimal price',
    color: '#ef4444',
    icon: '⏱️'
  },
  {
    id: 'fomo-entry',
    category: 'entry',
    label: 'FOMO Entry',
    description: 'Fear of missing out led to chasing the price',
    color: '#f59e0b',
    icon: '🏃'
  },
  {
    id: 'missed-confirmation',
    category: 'entry',
    label: 'Missed Confirmation',
    description: 'Entered without waiting for proper signal confirmation',
    color: '#ef4444',
    icon: '⚠️'
  },
  {
    id: 'poor-risk-reward',
    category: 'entry',
    label: 'Poor Risk/Reward Setup',
    description: 'Risk/reward ratio was unfavorable at entry',
    color: '#dc2626',
    icon: '⚖️'
  },

  // Exit-related failures
  {
    id: 'premature-exit',
    category: 'exit',
    label: 'Premature Exit',
    description: 'Exited too early, leaving profit on the table',
    color: '#8b5cf6',
    icon: '🚪'
  },
  {
    id: 'held-too-long',
    category: 'exit',
    label: 'Held Too Long',
    description: 'Overstayed the position, gave back profits',
    color: '#7c3aed',
    icon: '⏳'
  },
  {
    id: 'no-stop-loss',
    category: 'exit',
    label: 'No Stop Loss',
    description: 'Failed to set or respect stop loss',
    color: '#dc2626',
    icon: '🛑'
  },
  {
    id: 'moved-stop-loss',
    category: 'exit',
    label: 'Moved Stop Loss',
    description: 'Adjusted stop loss unfavorably during trade',
    color: '#b91c1c',
    icon: '↔️'
  },
  {
    id: 'missed-target',
    category: 'exit',
    label: 'Missed Target Exit',
    description: 'Did not take profit at predetermined target',
    color: '#6366f1',
    icon: '🎯'
  },

  // Risk Management failures
  {
    id: 'oversized-position',
    category: 'risk-management',
    label: 'Oversized Position',
    description: 'Position size too large relative to account',
    color: '#dc2626',
    icon: '📊'
  },
  {
    id: 'undersized-position',
    category: 'risk-management',
    label: 'Undersized Position',
    description: 'Position size too small, missed opportunity',
    color: '#f59e0b',
    icon: '📉'
  },
  {
    id: 'over-leveraged',
    category: 'risk-management',
    label: 'Over-Leveraged',
    description: 'Used excessive leverage',
    color: '#b91c1c',
    icon: '⚡'
  },
  {
    id: 'ignored-correlation',
    category: 'risk-management',
    label: 'Ignored Correlation',
    description: 'Multiple correlated positions increased risk',
    color: '#ea580c',
    icon: '🔗'
  },

  // Psychology-related failures
  {
    id: 'emotional-decision',
    category: 'psychology',
    label: 'Emotional Decision',
    description: 'Decision driven by emotion rather than analysis',
    color: '#ec4899',
    icon: '😤'
  },
  {
    id: 'revenge-trading',
    category: 'psychology',
    label: 'Revenge Trading',
    description: 'Tried to recover losses immediately',
    color: '#db2777',
    icon: '😡'
  },
  {
    id: 'overconfidence',
    category: 'psychology',
    label: 'Overconfidence',
    description: 'Excessive confidence led to poor decision',
    color: '#f97316',
    icon: '🦁'
  },
  {
    id: 'fear-paralysis',
    category: 'psychology',
    label: 'Fear Paralysis',
    description: 'Fear prevented optimal decision-making',
    color: '#06b6d4',
    icon: '😰'
  },
  {
    id: 'lack-of-discipline',
    category: 'psychology',
    label: 'Lack of Discipline',
    description: 'Broke personal trading rules',
    color: '#d946ef',
    icon: '🎲'
  },

  // Market Conditions failures
  {
    id: 'market-reversal',
    category: 'market-conditions',
    label: 'Market Reversal',
    description: 'Market moved against position unexpectedly',
    color: '#3b82f6',
    icon: '🔄'
  },
  {
    id: 'low-volatility',
    category: 'market-conditions',
    label: 'Low Volatility',
    description: 'Insufficient market movement',
    color: '#6b7280',
    icon: '📏'
  },
  {
    id: 'high-volatility',
    category: 'market-conditions',
    label: 'Excessive Volatility',
    description: 'Market too volatile for strategy',
    color: '#ef4444',
    icon: '⚡'
  },
  {
    id: 'news-event',
    category: 'market-conditions',
    label: 'News Event Impact',
    description: 'Unexpected news affected position',
    color: '#0891b2',
    icon: '📰'
  },
  {
    id: 'gap-slippage',
    category: 'market-conditions',
    label: 'Gap/Slippage',
    description: 'Price gap or excessive slippage',
    color: '#7c3aed',
    icon: '📉'
  },

  // Strategy-related failures
  {
    id: 'wrong-strategy',
    category: 'strategy',
    label: 'Wrong Strategy',
    description: 'Strategy not suitable for market conditions',
    color: '#8b5cf6',
    icon: '🎯'
  },
  {
    id: 'incomplete-setup',
    category: 'strategy',
    label: 'Incomplete Setup',
    description: 'Not all strategy criteria were met',
    color: '#a855f7',
    icon: '✓'
  },
  {
    id: 'false-signal',
    category: 'strategy',
    label: 'False Signal',
    description: 'Setup appeared valid but was false',
    color: '#6366f1',
    icon: '🚫'
  },
  {
    id: 'counter-trend',
    category: 'strategy',
    label: 'Counter-Trend Trade',
    description: 'Traded against the prevailing trend',
    color: '#4f46e5',
    icon: '⬆️'
  },

  // Technical failures
  {
    id: 'platform-issue',
    category: 'technical',
    label: 'Platform Issue',
    description: 'Technical problem with trading platform',
    color: '#64748b',
    icon: '💻'
  },
  {
    id: 'connectivity-issue',
    category: 'technical',
    label: 'Connectivity Issue',
    description: 'Internet or connection problem',
    color: '#475569',
    icon: '📡'
  },
  {
    id: 'execution-delay',
    category: 'technical',
    label: 'Execution Delay',
    description: 'Order execution was significantly delayed',
    color: '#71717a',
    icon: '⏱️'
  }
]

// Helper functions for failure mode analysis
export const getFailureModesByCategory = (category: FailureModeCategory): FailureMode[] => {
  return FAILURE_MODES.filter(mode => mode.category === category)
}

export const getFailureModeById = (id: string): FailureMode | undefined => {
  return FAILURE_MODES.find(mode => mode.id === id)
}

export const getFailureModesByIds = (ids: string[]): FailureMode[] => {
  return ids.map(id => getFailureModeById(id)).filter(Boolean) as FailureMode[]
}

// Category metadata
export const CATEGORY_INFO: Record<FailureModeCategory, { label: string; icon: string; color: string }> = {
  'entry': {
    label: 'Entry Issues',
    icon: '🚪',
    color: '#ef4444'
  },
  'exit': {
    label: 'Exit Issues',
    icon: '🚪',
    color: '#8b5cf6'
  },
  'risk-management': {
    label: 'Risk Management',
    icon: '⚖️',
    color: '#dc2626'
  },
  'psychology': {
    label: 'Psychology',
    icon: '🧠',
    color: '#ec4899'
  },
  'market-conditions': {
    label: 'Market Conditions',
    icon: '📊',
    color: '#3b82f6'
  },
  'strategy': {
    label: 'Strategy',
    icon: '🎯',
    color: '#8b5cf6'
  },
  'technical': {
    label: 'Technical',
    icon: '💻',
    color: '#64748b'
  }
}
