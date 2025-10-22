# Pinia Store Architecture

## Application State Flow

```
┌─────────────────────────────────────────────────────────────────┐
│                        Vue Application                          │
│                                                                 │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐        │
│  │   main.js    │  │   App.vue    │  │ Components   │        │
│  │              │  │              │  │              │        │
│  │ • Create App │  │ • Use Stores │  │ • Use Stores │        │
│  │ • Init Pinia │  │ • UI Logic   │  │ • Display    │        │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘        │
│         │                 │                  │                 │
│         └─────────────────┴──────────────────┘                 │
│                           │                                     │
└───────────────────────────┼─────────────────────────────────────┘
                            │
                    ┌───────▼────────┐
                    │  Pinia Stores   │
                    └───────┬────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼─────┐
│  Auth Store    │  │Profile Store│  │   UI Store   │
│                │  │             │  │              │
│ • currentUser  │  │ • profiles  │  │ • toasts     │
│ • isAuthReady  │  │ • activeId  │  │ • menuOpen   │
│ • loading      │  │ • loading   │  │ • sidebar    │
│                │  │             │  │ • editing    │
│ Actions:       │  │ Actions:    │  │              │
│ • signIn()     │  │ • load()    │  │ Actions:     │
│ • signOut()    │  │ • create()  │  │ • showToast()│
│ • clearError() │  │ • update()  │  │ • toggle*()  │
└───────┬────────┘  └──────┬──────┘  └────────┬─────┘
        │                  │                  │
        └──────────────────┼──────────────────┘
                           │
                  ┌────────▼─────────┐
                  │  Firebase/APIs   │
                  │                  │
                  │ • authService    │
                  │ • profileService │
                  │ • tradeService   │
                  └──────────────────┘
```

## Store Interaction Pattern

### 1. Component Uses Store Directly
```typescript
// Component
import { useAuthStore } from '@/stores'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user, isAuthenticated } = storeToRefs(authStore)

// Call action
await authStore.signInWithGoogle()
```

### 2. Component Uses Composable (Backward Compatible)
```typescript
// Component
import { useAuth } from '@/composables/useAuth'

const { user, isAuthenticated, signInWithGoogle } = useAuth()

// Composable internally calls store
await signInWithGoogle()
```

## Data Flow Example: Sign In

```
User clicks "Sign In"
        │
        ▼
┌───────────────────┐
│   LoginPage.vue   │
│                   │
│ • Calls           │
│   signInWithGoogle()
└─────────┬─────────┘
          │
          ▼
┌─────────────────────────┐
│ useAuth() composable    │ (Backward Compatibility Layer)
│ • Wraps auth store      │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│   useAuthStore()        │
│                         │
│ 1. Set loading = true   │
│ 2. Call authService     │
│ 3. Wait for callback    │
│ 4. Update currentUser   │
│ 5. Set loading = false  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│  Firebase authService   │
│                         │
│ • signInWithPopup()     │
│ • onAuthStateChanged()  │
└────────┬────────────────┘
         │
         ▼
┌─────────────────────────┐
│    All Components       │
│  (Reactively Updated)   │
│                         │
│ • App.vue updates       │
│ • AuthGuard allows      │
│ • Profile loads         │
└─────────────────────────┘
```

## Store Organization

```
src/
├── stores/
│   ├── index.ts           # Export all stores
│   ├── auth.ts            # Authentication state
│   ├── profiles.ts        # Trading profiles state
│   └── ui.ts              # UI state (toasts, menus)
│
├── composables/
│   ├── useAuth.ts         # Wraps auth store (backward compat)
│   ├── useProfiles.ts     # Wraps profiles store (backward compat)
│   └── ...                # Other domain-specific composables
│
├── components/
│   ├── auth/
│   │   ├── AuthGuard.vue  # Uses useAuth()
│   │   └── LoginPage.vue  # Uses useAuth()
│   ├── ProfileManager.vue # Uses useProfiles()
│   └── ...
│
└── main.js                # Initializes Pinia
```

## Key Principles

### 1. Single Source of Truth
- Each piece of state lives in exactly one store
- No duplication across components
- Predictable state updates

### 2. Unidirectional Data Flow
- Actions modify state
- State changes trigger reactive updates
- Components react to state changes

### 3. Separation of Concerns
```
Store Layer:     State + Business Logic
Composable:      Convenience Wrappers (optional)
Component:       UI + User Interactions
Service Layer:   External APIs + Firebase
```

### 4. Gradual Migration
```
Phase 1: ✅ Create stores
Phase 2: ✅ Wrap in composables (backward compat)
Phase 3: 🔄 Migrate components to use stores directly (optional)
Phase 4: 🔮 Remove composable wrappers (future, breaking)
```

## Benefits Visualization

### Before Pinia
```
Component A ──┐
Component B ──┼─→ useAuth() ──→ Module State (scattered)
Component C ──┘
```
- Hard to track state changes
- No centralized debugging
- State scattered across modules

### After Pinia
```
Component A ──┐
Component B ──┼─→ useAuthStore() ──→ Pinia Store (centralized)
Component C ──┘                            ↓
                                    Vue DevTools
                                    (inspect, debug)
```
- Centralized state management
- Easy debugging and time-travel
- Clear action tracking
- Better performance

## Testing Strategy

```
Unit Tests
    │
    ├─ Store Tests (actions, getters)
    │   └─ Mock services
    │
    ├─ Composable Tests
    │   └─ Mock stores
    │
    └─ Component Tests
        └─ Mock stores or composables
```

## Performance Optimization

```
Pinia Benefits:
┌─────────────────────────────────┐
│ • Lightweight (~1KB)            │
│ • Efficient reactivity          │
│ • Tree-shaking support          │
│ • No mutations needed           │
│ • TypeScript friendly           │
│ • DevTools integration          │
└─────────────────────────────────┘
```
