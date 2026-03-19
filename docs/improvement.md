# MyTradeJournal — Improvement Suggestions

---

## 🔴 Critical

### 1. Add a Test Suite
No automated tests exist. This is risky for a financial app.
- Add **Vitest** + **@vue/test-utils** for unit/component tests
- Add **Playwright** for E2E tests
- Focus first on P&L calculation logic and Firebase service layer

### 2. Input Validation Before API Calls
Currently only HTML5 `required`/`pattern` attributes guard forms. No programmatic validation occurs before Firestore writes.
- Add **Zod** or **Valibot** schemas for `Trade` and `Profile`
- Validate business rules (e.g., exit price required if exit date set, lots > 0)
- Surface validation errors inline on the form

### 3. Firebase Error Handling & Retry Logic
Firebase calls have basic `try/catch` but no retry strategy for transient network failures.
- Implement **exponential backoff** for retryable errors
- Distinguish recoverable vs. permanent errors
- Show meaningful error messages to the user (not just console logs)

### 4. Accessibility (A11Y)
Zero `aria-*` attributes found across the codebase.
- Add `aria-label` to all icon-only buttons (close, delete, ×)
- Add `role="dialog"` + `aria-modal="true"` to modals with focus trapping
- Add `aria-live="polite"` region for toast notifications
- Ensure all form fields have associated `<label>` elements

---

## 🟠 High Priority

### 5. Refactor Oversized Components
Several components are far too large and hard to maintain:

| Component | Lines | Action |
|-----------|-------|--------|
| `LessonsLibrary.vue` | ~1,316 | Split into LessonCard, LessonFilters, LessonStats |
| `StatisticsView.vue` | ~1,246 | Split by section (overview, by-symbol, by-strategy) |
| `TradeNotesNLP.vue` | ~1,112 | Extract NLP logic into a composable |
| `EquityDriftAnalytics.vue` | ~1,071 | Split chart and controls |

Target: max ~300 lines per component.

### 6. Centralize Duplicate Formatting Logic
`formatDate()` and `formatVal()` are re-implemented in multiple components.
- Move to `src/utils/formatters.ts`
- Export a single `useCurrency()` composable wrapping currency symbol + formatting

### 7. Paginate `getAllTrades()`
Currently fetches **all trades** in one Firestore query. This will cause performance issues as data grows.
- Implement cursor-based pagination in `tradeService.ts`
- Load trades in pages of ~50, with infinite scroll or "Load More"

### 8. Centralize Toast Notifications
Toast logic is duplicated inside `TradeForm.vue`. Create a Pinia `useNotificationStore` so any component can trigger toasts without local state.

### 9. Add `partialExits` to the `Trade` Type
`partialExits` is used across the app but not declared in `src/types/index.ts`.
```typescript
partialExits?: Array<{ date: string; price: number; lots: number }>
```

---

## 🟡 Medium Priority

### 10. Form Auto-Save / Dirty State
When editing a trade, navigating away silently discards changes.
- Track form dirty state
- Show a confirmation dialog ("You have unsaved changes") on route leave
- Consider auto-saving drafts to localStorage

### 11. Data Export
No way to export trade data.
- Add CSV export for trade history (filterable by date range, symbol, strategy)
- Add JSON backup/restore for full data portability

### 12. Global Search
No way to search across trades by symbol, notes, or strategy.
- Add a search bar to TradeHistory
- Index `symbol`, `strategy`, `notes` fields for client-side fuzzy search

### 13. Offline Conflict Resolution
If a trade is edited both offline and on another device, the last write wins silently.
- Detect conflicts using `updatedAt` timestamps
- Show a merge UI or at minimum warn the user

### 14. Encrypt Offline/localStorage Data
Trade data (P&L, strategy) is stored in plaintext in localStorage.
- Encrypt with a user-derived key before writing
- Add data expiration (e.g., auto-clear after 30 days)

### 15. Date Handling Library
Native `Date` is used everywhere — fragile across timezones.
- Add **date-fns** or **dayjs** for consistent parsing, formatting, and timezone handling

---

## 🟢 Low Priority / Polish

### 16. Skeleton Loaders
Replace spinner with skeleton loaders for dashboard cards and trade list to improve perceived performance.

### 17. Keyboard Shortcuts
Power users (traders) benefit from keyboard-driven workflows.
- `N` → New trade
- `F` → Focus filter bar
- `Esc` → Close modal

### 18. Optimistic UI Updates
Currently, every save waits for Firestore confirmation before updating the UI. Adding optimistic updates (update UI immediately, roll back on error) would make the app feel faster.

### 19. Performance Monitoring
`PerformanceMonitor` exists but only logs to `console.debug` — invisible in production. Send key metrics (page load time, query duration) to Firebase Analytics.

### 20. Component Error Boundaries
If an analytics component throws a runtime error, it breaks the entire page. Wrap complex analytics with an error boundary component that shows a fallback UI.

### 21. Tooltip / Help Text
Complex trading fields (e.g., "Confidence Level", "Execution Quality", "Failure Modes") have no explanatory tooltips. Add `title` attributes or a small `?` popover for new users.

### 22. Add Branded Types for IDs
Prevent accidentally passing a `userId` where a `profileId` is expected:
```typescript
type UserId = string & { readonly __brand: 'UserId' }
type ProfileId = string & { readonly __brand: 'ProfileId' }
```

---

## Summary Table

| Area | Priority | Effort |
|------|----------|--------|
| Test suite (Vitest + Playwright) | Critical | High |
| Input validation (Zod) | Critical | Medium |
| Firebase retry logic | Critical | Medium |
| Accessibility (ARIA) | Critical | Medium |
| Refactor large components | High | High |
| Deduplicate formatters | High | Low |
| Paginate trade queries | High | Medium |
| Central toast store | High | Low |
| Type `partialExits` | High | Low |
| Form dirty-state guard | Medium | Low |
| CSV export | Medium | Low |
| Global search | Medium | Medium |
| Offline conflict resolution | Medium | High |
| Encrypt localStorage | Medium | Medium |
| date-fns / dayjs | Medium | Low |
| Skeleton loaders | Low | Low |
| Keyboard shortcuts | Low | Low |
| Optimistic UI updates | Low | Medium |
| Error boundaries | Low | Low |
| Tooltips/help text | Low | Low |
