# Pinia Store Documentation

This application uses Pinia for centralized state management. The stores are located in `src/stores/`.

## Available Stores

### 1. Auth Store (`stores/auth.ts`)
Manages authentication state and user information.

**State:**
- `currentUser`: The current authenticated user
- `isAuthReady`: Whether auth initialization is complete
- `authLoading`: Auth loading state
- `authError`: Authentication error messages
- `loading`: Loading state for auth operations

**Getters:**
- `user`: Current user (computed)
- `isAuthenticated`: Whether user is authenticated
- `userProfile`: User profile information

**Actions:**
- `initAuthListener()`: Initialize Firebase auth state listener
- `signInWithGoogle()`: Sign in with Google
- `signOut()`: Sign out current user
- `clearError()`: Clear error messages

**Usage:**
```typescript
import { useAuthStore } from '@/stores'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user, isAuthenticated } = storeToRefs(authStore)

// Call actions
await authStore.signInWithGoogle()
```

### 2. Profiles Store (`stores/profiles.ts`)
Manages trading profiles (live, paper, strategy, custom).

**State:**
- `profiles`: Array of all profiles
- `activeProfileId`: Currently active profile ID
- `loading`: Loading state
- `error`: Error messages

**Getters:**
- `activeProfile`: Currently active profile
- `activeProfiles`: All active profiles
- `profilesByType`: Profiles grouped by type

**Actions:**
- `loadProfiles()`: Load all profiles
- `createProfile(data)`: Create new profile
- `updateProfile(id, updates)`: Update profile
- `deleteProfile(id)`: Delete profile
- `switchProfile(id)`: Switch active profile
- `duplicateProfile(id, name)`: Duplicate profile
- `getProfileById(id)`: Get profile by ID

**Usage:**
```typescript
import { useProfilesStore } from '@/stores'
import { storeToRefs } from 'pinia'

const profilesStore = useProfilesStore()
const { activeProfile, profiles } = storeToRefs(profilesStore)

// Load profiles
await profilesStore.loadProfiles()

// Switch profile
await profilesStore.switchProfile(profileId)
```

### 3. UI Store (`stores/ui.ts`)
Manages UI state like toasts, menus, and editing state.

**State:**
- `toasts`: Array of toast notifications
- `isMobileMenuOpen`: Mobile menu state
- `showUserMenu`: User menu visibility
- `isSidebarCollapsed`: Sidebar collapse state
- `editingTrade`: Currently editing trade

**Actions:**
- `showToast(type, title, message, duration)`: Show toast notification
- `removeToast(id)`: Remove toast by ID
- `toggleMobileMenu()`: Toggle mobile menu
- `closeMobileMenu()`: Close mobile menu
- `toggleSidebar()`: Toggle sidebar
- `toggleUserMenu()`: Toggle user menu
- `closeUserMenu()`: Close user menu
- `setEditingTrade(trade)`: Set trade being edited

**Usage:**
```typescript
import { useUIStore } from '@/stores'

const uiStore = useUIStore()

// Show notification
uiStore.showToast('success', 'Success', 'Operation completed!')

// Toggle UI elements
uiStore.toggleMobileMenu()
```

## Backward Compatibility

The existing composables (`useAuth`, `useProfiles`) have been updated to wrap the Pinia stores, maintaining backward compatibility with existing components. New components can use stores directly for better type safety and performance.

## Best Practices

1. **Use `storeToRefs`** when destructuring reactive state:
   ```typescript
   import { storeToRefs } from 'pinia'
   const { user } = storeToRefs(authStore) // ✅ Maintains reactivity
   const { user } = authStore // ❌ Loses reactivity
   ```

2. **Access actions directly** without storeToRefs:
   ```typescript
   await authStore.signInWithGoogle() // ✅ Correct
   ```

3. **Initialize stores in components** when needed:
   ```typescript
   onMounted(() => {
     profilesStore.loadProfiles()
   })
   ```

## Migration Guide

For components currently using composables, you can optionally migrate to use stores directly:

**Before (using composable):**
```typescript
import { useAuth } from '@/composables/useAuth'
const { user, signOut } = useAuth()
```

**After (using store directly):**
```typescript
import { useAuthStore } from '@/stores'
import { storeToRefs } from 'pinia'

const authStore = useAuthStore()
const { user } = storeToRefs(authStore)
const { signOut } = authStore
```

Both approaches work, but using stores directly provides better TypeScript support and clearer code organization.
