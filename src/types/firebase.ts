import type { Trade, TradeFilters } from './index'

// Firebase configuration types
export interface FirebaseConfig {
  apiKey: string
  authDomain: string
  projectId: string
  storageBucket: string
  messagingSenderId: string
  appId: string
  measurementId?: string
}

// Trade service interface
export interface TradeService {
  addTrade: (trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>) => Promise<Trade>
  updateTrade: (id: string, trade: Partial<Trade>) => Promise<Trade>
  deleteTrade: (id: string) => Promise<void>
  getAllTrades: () => Promise<Trade[]>
  getTradesByYear: (year: number) => Promise<Trade[]>
  getAvailableYears: () => Promise<number[]>
  getFilteredTrades: (filters: TradeFilters) => Promise<Trade[]>
  getUniqueSymbols: () => Promise<string[]>
}

// Firebase service response
export interface FirebaseResponse<T = any> {
  success: boolean
  data?: T
  error?: string
}

// Environment variables type
export interface ImportMetaEnv {
  readonly VITE_FIREBASE_API_KEY: string
  readonly VITE_FIREBASE_AUTH_DOMAIN: string
  readonly VITE_FIREBASE_PROJECT_ID: string
  readonly VITE_FIREBASE_STORAGE_BUCKET: string
  readonly VITE_FIREBASE_MESSAGING_SENDER_ID: string
  readonly VITE_FIREBASE_APP_ID: string
  readonly VITE_FIREBASE_MEASUREMENT_ID?: string
  readonly VITE_APP_TITLE?: string
  readonly VITE_APP_VERSION?: string
}

declare global {
  interface ImportMeta {
    readonly env: ImportMetaEnv
  }
}
