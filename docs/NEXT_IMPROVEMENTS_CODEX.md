# Next Improvements for MyTradeJournal

Generated on: 2026-04-12

## Overview

This document captures the next high-value improvements for the current state of the project after reviewing the codebase, scripts, and project health signals.

The app already has a strong feature set:

- Vue 3 + Vite + TypeScript setup
- Firebase authentication and Firestore integration
- Multi-profile support
- Analytics and charting views
- Mobile-first UI
- PWA-related assets and routing support

The best next improvements are now mostly about reliability, maintainability, scalability, and product polish.

## Highest-Value Improvements

### 1. Add automated tests

Current state:

- No proper automated test suite was found
- Only `test-spa-routing.sh` exists as a standalone script

Why this matters:

- This is a financial/trading app, so regressions in calculations or filtering are costly
- Large components and analytics logic are harder to change safely without tests

Recommended next step:

- Add `Vitest` for unit tests
- Add `@vue/test-utils` for component tests
- Add `Playwright` for end-to-end flows

Suggested first test targets:

- P&L calculations
- Trade form submission rules
- Trade filtering and sorting
- Profile switching behavior
- Firebase service behavior

### 2. Fix linting and make `lint:check` pass cleanly

Current state:

- `npm run type-check` passes
- `npm run lint:check` reports many issues
- A large share of lint noise comes from generated files being linted, especially `dev-dist/**`

Why this matters:

- The current lint signal is too noisy to be useful
- Real issues get buried under generated-file warnings and errors

Recommended next step:

- Update `eslint.config.js` to ignore generated output like `dev-dist/**`
- Then clean remaining real issues in `src/**`

Observed issues include:

- Unused variables and parameters
- `any` usage
- browser globals not declared in some utility files
- console logging scattered across utilities

### 3. Add schema-based validation before Firestore writes

Current state:

- Form logic is present in `src/components/trade/TradeForm.vue`
- Validation appears mostly UI-driven, not strongly enforced through shared programmatic schemas

Why this matters:

- Prevents invalid or inconsistent trade data from being saved
- Makes form behavior more predictable and easier to test
- Reduces future bugs in analytics and reporting

Recommended next step:

- Add `zod` or `valibot`
- Create shared schemas for `Trade`, `Profile`, and related payloads
- Validate before create/update operations

Examples of rules to enforce:

- `exitPrice` required if `exitDate` exists
- `lots` must be greater than zero
- partial exit totals should not exceed total lots
- numeric fields should reject malformed values

### 4. Paginate trade loading

Current state:

- `src/firebase/tradeService.ts` currently loads all trades for the authenticated user in `getAllTrades()`

Why this matters:

- Performance will degrade as trade history grows
- Large reads increase wait time and cost
- History and dashboard views become harder to scale

Recommended next step:

- Replace full-history fetches with cursor-based pagination
- Use `limit()` and `startAfter()` in Firestore queries
- Add "Load more" or infinite scrolling in history views

Suggested starting page size:

- 50 trades per page

### 5. Improve accessibility

Current state:

- Only a small number of `aria-*` attributes were found during a quick scan
- Accessibility coverage appears limited across forms, modals, buttons, and dynamic UI

Why this matters:

- Better usability for keyboard and assistive technology users
- Cleaner interaction patterns for all users
- Easier future compliance and UX polish

Recommended next step:

- Add labels for icon-only buttons
- Add modal semantics such as `role="dialog"` and `aria-modal="true"`
- Add focus management for overlays and dialogs
- Add keyboard interaction support for important controls
- Add `aria-live` for toast/status messaging

Priority areas:

- trade form actions
- dialogs and overlays
- chart controls
- mobile navigation

### 6. Refactor oversized components

Current state:

- `src/components/LessonsLibrary.vue` is about 1316 lines
- `src/components/StatisticsView.vue` is about 1246 lines
- `src/components/analytics/TradeNotesNLP.vue` is about 1112 lines
- `src/components/analytics/EquityDriftAnalytics.vue` is about 1071 lines

Why this matters:

- Large files are slower to understand and modify
- Bugs become harder to isolate
- Reuse and testing become much more difficult

Recommended next step:

- Split these components by domain responsibility
- Move heavy logic into composables
- Extract presentational subcomponents for filters, cards, and charts

Suggested target:

- Keep most components under 300 to 400 lines where practical

## Strong Secondary Improvements

### 7. Finish and harden the offline sync model

Current state:

- `src/utils/offlineData.ts` uses localStorage-based persistence
- Sync flow still contains simulated behavior and needs stronger production handling

Why this matters:

- Offline features are useful, but unreliable sync can damage user trust
- Conflict handling matters when users use multiple devices

Recommended next step:

- Replace simulated sync flow with real service integration
- Add exponential backoff for retryable failures
- Track sync status visibly in the UI
- Detect update conflicts using timestamps or version fields

### 8. Centralize notifications

Current state:

- Toast handling is local inside `TradeForm.vue`

Why this matters:

- Notifications will become duplicated across features
- A global pattern is easier to maintain and style consistently

Recommended next step:

- Create a Pinia notification store
- Add a single app-level toast renderer
- Standardize success, warning, and error messages

### 9. Improve logging and monitoring

Current state:

- `src/utils/logger.ts` stores logs locally and outputs to console in development
- `src/components/ui/PerformanceMonitor.vue` is useful in dev but not connected to real production monitoring

Why this matters:

- Production issues are harder to diagnose without structured monitoring
- Performance regressions may go unnoticed

Recommended next step:

- Add error tracking such as Sentry
- Add lightweight performance telemetry for key flows
- Standardize error logging from Firebase and async operations

### 10. Add dirty-state protection and draft recovery

Current state:

- Editing and entry flows can lose changes if the user navigates away

Why this matters:

- Trade-entry workflows are detail-heavy
- Losing form state creates frustration and mistrust

Recommended next step:

- Detect unsaved form changes
- Warn on route leave
- Optionally auto-save drafts locally

### 11. Add export and backup tools

Current state:

- There does not appear to be a strong export/backup workflow exposed in the project structure

Why this matters:

- Users expect ownership of their trade journal data
- Export helps with reporting, migration, and trust

Recommended next step:

- CSV export for filtered trade history
- JSON backup/restore for full profile data
- Optional PDF report generation later

### 12. Clean up documentation drift

Current state:

- README is strong overall
- README references a `LICENSE` file, but no `LICENSE` file is present in the repo root
- Some older docs appear to reflect earlier project phases

Why this matters:

- Reduces confusion for contributors and future maintenance
- Makes the repo feel more polished and trustworthy

Recommended next step:

- Add a real `LICENSE` file if intended
- Archive or label older phase docs
- Update docs to match the current architecture and priorities

## Suggested Priority Order

If only a few improvements are tackled next, this is the best order:

1. Automated tests
2. Lint cleanup and config fixes
3. Trade pagination
4. Schema validation
5. Accessibility improvements
6. Large component refactors

## Suggested Delivery Phases

### Phase 1: Stability

- Add test tooling
- Fix lint config
- Clean critical source lint errors
- Add schema validation for trade writes

### Phase 2: Scale

- Paginate trade history
- Reduce expensive full-data loads
- Improve caching and query strategy

### Phase 3: Product quality

- Accessibility pass
- Dirty-form protection
- Global notifications
- Export and backup features

### Phase 4: Reliability and polish

- Offline conflict handling
- Monitoring and error reporting
- Large component refactors
- Documentation cleanup

## Quick Wins

These are small-to-medium tasks with good payoff:

- Ignore `dev-dist/**` in ESLint
- Add a `LICENSE` file or remove the README reference
- Create a shared formatter utility for repeated formatting logic
- Move toast notifications into a global store
- Add route leave protection for unsaved trade form changes

## Summary

The project is already feature-rich and ambitious. The next best improvements are the ones that make it safer to evolve:

- stronger tests
- cleaner tooling
- stricter data validation
- scalable data loading
- better accessibility
- smaller, easier-to-maintain components

These changes will make future feature work faster and much less risky.
