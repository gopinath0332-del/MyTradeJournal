# Adding Google Sign-In Authentication

This guide walks you through adding Google Sign-In authentication to your Trading Journal application.

## Prerequisites

- Firebase project already configured ✅
- Firebase SDK already installed ✅

## Step 1: Enable Google Authentication in Firebase Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Go to **Authentication** → **Sign-in method**
4. Click on **Google** provider
5. Click **Enable**
6. Add your email as a support email
7. Click **Save**

## Step 2: Update Firestore Security Rules

Update your Firestore security rules to require authentication:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper function to check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper function to check if user owns the resource
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Trades collection - user can only access their own trades
    match /trades/{tradeId} {
      allow read, write: if isAuthenticated() &&
                           (resource == null || isOwner(resource.data.userId));
    }

    // Profiles collection - user can only access their own profiles
    match /profiles/{profileId} {
      allow read, write: if isAuthenticated() &&
                           (resource == null || isOwner(resource.data.userId));
    }
  }
}
```

## Step 3: Implementation Files

The following files have been created for you:

### Authentication Service
- `src/firebase/authService.ts` - Handles Google Sign-In/Sign-Out

### Composable
- `src/composables/useAuth.ts` - Vue composable for auth state management

### Components
- `src/components/auth/LoginPage.vue` - Login page with Google Sign-In button
- `src/components/auth/AuthGuard.vue` - Wrapper component to protect routes

### Router Configuration
- Updated `src/router/index.js` - Added auth guard to protected routes

## Step 4: Update Trade & Profile Services

Both `tradeService.ts` and `profileService.ts` have been updated to:
1. Automatically add `userId` to all documents
2. Filter queries by current user's `userId`

## Step 5: Update App.vue

Add the authentication logic to your main App.vue:

```vue
<template>
  <div id="app">
    <AuthGuard>
      <!-- Your existing app content -->
    </AuthGuard>
  </div>
</template>

<script setup>
import AuthGuard from '@/components/auth/AuthGuard.vue'
</script>
```

## Step 6: Usage

### In Components

```vue
<script setup>
import { useAuth } from '@/composables/useAuth'

const { user, loading, signInWithGoogle, signOut } = useAuth()

// Sign in
const handleSignIn = async () => {
  try {
    await signInWithGoogle()
    console.log('Signed in:', user.value)
  } catch (error) {
    console.error('Sign-in failed:', error)
  }
}

// Sign out
const handleSignOut = async () => {
  await signOut()
}
</script>

<template>
  <div v-if="user">
    <p>Welcome, {{ user.displayName }}!</p>
    <img :src="user.photoURL" alt="Profile" />
    <button @click="handleSignOut">Sign Out</button>
  </div>
  <div v-else>
    <button @click="handleSignIn">Sign In with Google</button>
  </div>
</template>
```

## Features Included

✅ **Google Sign-In** - One-click authentication
✅ **Persistent Sessions** - Stay logged in across page refreshes
✅ **User Profile** - Access user name, email, and photo
✅ **Auth State Management** - Reactive authentication state
✅ **Protected Routes** - Automatic redirection for unauthenticated users
✅ **User Data Isolation** - Each user only sees their own trades and profiles
✅ **Loading States** - Proper loading indicators during auth operations
✅ **Error Handling** - Comprehensive error messages

## Testing

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test Sign-In Flow**:
   - Click "Sign In with Google"
   - Select your Google account
   - Authorize the application
   - You should be redirected to the dashboard

3. **Test Data Isolation**:
   - Create some trades while logged in
   - Sign out
   - Sign in with a different Google account
   - Verify you don't see the previous user's trades

4. **Test Session Persistence**:
   - Sign in
   - Refresh the page
   - Verify you're still logged in

## Customization

### Change Sign-In Button Style

Edit `src/components/auth/LoginPage.vue`:

```vue
<style scoped>
.google-btn {
  background: #4285f4; /* Your custom color */
  /* Customize as needed */
}
</style>
```

### Add More Providers

To add Facebook, Twitter, or Email/Password authentication:

1. Enable the provider in Firebase Console
2. Update `authService.ts` to add new methods
3. Add buttons to `LoginPage.vue`

### Custom Redirect After Login

Edit `src/components/auth/AuthGuard.vue`:

```typescript
// Redirect to specific page after login
router.push('/your-custom-page')
```

## Security Best Practices

✅ **Never expose Firebase API keys** - They're safe in client code but don't commit `.env` files
✅ **Use Security Rules** - Always validate on the server (Firestore rules)
✅ **Validate User Input** - Never trust client-side validation alone
✅ **Use HTTPS** - Always use HTTPS in production
✅ **Limit Permissions** - Grant minimum necessary permissions in Firestore rules

## Troubleshooting

### "Auth domain not configured"
- Check that `VITE_FIREBASE_AUTH_DOMAIN` is set in your `.env` file
- Verify it matches your Firebase project settings

### "Popup blocked"
- User's browser is blocking popups
- Use `signInWithRedirect()` instead in `authService.ts`

### "User not found after sign-in"
- Check browser console for errors
- Verify Firebase Auth is enabled in console
- Check that `onAuthStateChanged` listener is working

### Data not showing after sign-in
- Check Firestore security rules
- Verify `userId` is being added to documents
- Check browser console for permission errors

## Migration for Existing Users

If you have existing trades without `userId`:

1. **Temporary: Allow Anonymous Access** (during migration):
   ```javascript
   // In security rules - TEMPORARY ONLY
   allow read, write: if true;
   ```

2. **Run Migration Script**: See `docs/DATA_MIGRATION.md`

3. **Re-enable Security Rules**: After migration complete

## Next Steps

- [ ] Enable Google Authentication in Firebase Console
- [ ] Update Firestore Security Rules
- [ ] Test sign-in flow
- [ ] Test data isolation
- [ ] Deploy to production
- [ ] (Optional) Add more authentication providers
- [ ] (Optional) Add user profile management page

---

**Created**: October 20, 2025
**Status**: Ready to implement
**Estimated Setup Time**: 15-20 minutes
