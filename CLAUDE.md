# MyTradeJournal - Claude Code Guide

## Claude Default Behavior

**Planning mode is ON by default.** Before making any code changes, Claude must analyze the request, explore relevant files, and present a plan for approval. Do not execute changes until the plan is approved.

---

## Project Overview

MyTradeJournal is a trading journal Single Page Application (SPA) for logging trades, analyzing performance, and identifying patterns. It supports multiple trading profiles (live, paper, strategy, custom) with advanced analytics.

**Live demo:** Deployed at `/MyTradeJournal/` base path in production.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Vue 3 (Composition API + `<script setup>`) |
| Language | TypeScript 5.x (strict mode) |
| Build | Vite 7.x |
| State | Pinia 3.x |
| Backend | Firebase 12.x (Firestore + Auth + Analytics) |
| Offline | IndexedDB via `idb` package |
| Routing | Vue Router 4.x (lazy-loaded routes) |

---

## Commands

```bash
npm run dev              # Dev server at http://localhost:5173
npm run dev:prod         # Dev server with production base path
npm run build            # Production build (includes type check)
npm run build:no-check   # Fast build skipping type check
npm run type-check       # Run TypeScript checks only
npm run lint             # Lint and auto-fix
npm run lint:check       # Check linting without fixing
npm run preview          # Preview production build
```

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in Firebase values. All vars are prefixed with `VITE_`:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID   # Optional (Analytics)
VITE_APP_TITLE                 # Optional, default: "Trade Journal"
VITE_APP_VERSION               # Optional, default: "1.0.0"
```

---

## Directory Structure

```
src/
├── components/
│   ├── auth/           # AuthGuard, LoginPage
│   ├── dashboard/      # Stats, charts, heatmap, equity curve
│   ├── trade/          # TradeForm, TradeHistory, filters, modal
│   │   ├── TradeHistory/  # Table, cards, filters, tabs
│   │   └── forms/         # Form sections (BasicInfo, Pricing, etc.)
│   ├── charts/         # 9 chart components (Strategy, Symbol, Drawdown, etc.)
│   ├── analytics/      # Advanced analytics (Cohort, NLP, Markov, etc.)
│   └── ui/             # VirtualScroll, LoadingSpinner, EmptyState
├── stores/             # Pinia stores (auth, profiles, ui)
├── firebase/           # config.ts, authService, profileService, tradeService
├── composables/        # 12 custom hooks (useAuth, useDashboardStats, etc.)
├── types/              # TypeScript interfaces (index, profile, cohort, nlp, etc.)
├── utils/              # cache, logger, offlineData, profileMigration
├── router/             # index.js with lazy-loaded route definitions
└── styles/             # Global CSS
```

---

## Architecture Patterns

### Components
- All components use `<script setup lang="ts">` (Composition API)
- Scoped styles (`<style scoped>`)
- Props/emits typed via TypeScript interfaces

### State Management
- Pinia stores using composition style (`defineStore` with `setup()`)
- Three stores: `useAuthStore`, `useProfilesStore`, `useUIStore`
- Access via `useXxxStore()` in components and composables

### Firebase Service Layer
- Firebase logic lives in `src/firebase/` — never inline Firestore queries in components
- All queries filter by `userId` for multi-tenancy security
- Data is also isolated by `profileId`

### Composables
- Business logic extracted into `src/composables/use*.ts`
- Return reactive refs and computed values
- Composables consume stores and services; components consume composables

### Routing
- All routes use dynamic imports for code splitting
- Auth guarded via `AuthGuard.vue` wrapper

### Caching & Offline
- `CacheService` (TTL + LRU) in `src/utils/cache.ts`
- IndexedDB persistence in `src/utils/offlineData.ts`
- Invalidate cache on profile switches

---

## Naming Conventions

| Item | Convention | Example |
|------|-----------|---------|
| Components | PascalCase | `TradeForm.vue`, `DashboardStats.vue` |
| Composables | `use` prefix | `useAuth.ts`, `useDashboardStats.ts` |
| Stores | `useXxxStore` export | `useAuthStore`, `useProfilesStore` |
| Types/Interfaces | PascalCase | `Trade`, `ProfileSettings`, `HeatmapDay` |
| Utils | camelCase functions | `cache.ts`, `logger.ts` |
| Imports | Path aliases | `@/components/...`, `@/firebase/...` |

---

## Data Model (Key Types)

**Trade** (Firestore `trades` collection):
- Core: `symbol`, `contract`, `tradeType`, `entryDate`, `exitDate`, `entryPrice`, `exitPrice`, `quantity`
- P&L: `pnl`, `pnlPercentage`, `pnlAmount`
- Metadata: `strategy`, `confidence`, `notes`, `remarks`, `lessons`, `screenshotUrls`
- Analysis: `failureModes[]`, `failureNotes`, `failureConfidence`
- Multi-tenancy: `userId`, `profileId`, `createdAt`, `updatedAt`

**Profile** (Firestore `profiles` collection):
- `name`, `type` (`'live' | 'paper' | 'strategy' | 'custom'`), `description`
- `settings` (currency, broker, risk parameters)
- `isActive`, `userId`

---

## Git Conventions

Use conventional commits:
```
feat: add new feature
fix: fix a bug
refactor: code change without behavior change
docs: documentation only
chore: tooling, deps, config
```

---

## TypeScript Notes

- Strict mode enabled (`noUnusedLocals`, `noUnusedParameters`, strict checks)
- Explicit return types on exported functions
- All data structures typed via interfaces in `src/types/`
- Run `npm run type-check` before committing major changes

---

## No Test Suite

There are no automated tests in this project. Validate changes manually by:
1. Running `npm run dev` and exercising the affected features
2. Checking `npm run type-check` passes
3. Checking `npm run lint:check` passes
4. Testing on mobile viewport (320px+)
