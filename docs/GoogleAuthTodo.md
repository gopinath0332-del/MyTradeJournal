# Google Authentication Implementation TODO

This checklist tracks the implementation progress of Google Authentication for the Trading Journal application.

## 📋 Implementation Checklist

### Phase 1: Core Authentication Setup ✅

- [x] Create authentication service (`src/firebase/authService.ts`)
- [x] Create auth composable (`src/composables/useAuth.ts`)
- [x] Create login page component (`src/components/auth/LoginPage.vue`)
- [x] Create auth guard component (`src/components/auth/AuthGuard.vue`)
- [x] Update Trade type to include `userId` field
- [x] Update Profile type to include `userId` field
- [x] Update tradeService to add `userId` to new trades
- [x] Update profileService to add `userId` to new profiles
- [x] Create documentation (QUICK_START_AUTH.md, GOOGLE_AUTHENTICATION_SETUP.md)
- [x] Build and verify TypeScript compilation

### Phase 2: Firebase Console Configuration 🔧

- [ ] **Enable Google Authentication Provider**
  - [ ] Go to [Firebase Console](https://console.firebase.google.com/)
  - [ ] Select your project
  - [ ] Navigate to Authentication → Sign-in method
  - [ ] Click on Google provider
  - [ ] Toggle Enable switch ON
  - [ ] Add support email (your email address)
  - [ ] Click Save
  - [ ] ✅ Test: Verify Google appears as "Enabled" in providers list

- [ ] **Configure Authorized Domains**
  - [ ] Go to Authentication → Settings → Authorized domains
  - [ ] Verify `localhost` is listed (for development)
  - [ ] Add your production domain when deploying (e.g., `yourapp.com`)
  - [ ] ✅ Test: Verify domains are saved

### Phase 3: Update Firestore Security Rules 🔐

- [ ] **Open Firestore Rules Editor**
  - [ ] Go to Firestore Database → Rules tab
  - [ ] Backup current rules (copy to a file)

- [ ] **Update Rules for Authentication**
  ```javascript
  rules_version = '2';
  service cloud.firestore {
    match /databases/{database}/documents {
      // Helper functions
      function isAuthenticated() {
        return request.auth != null;
      }

      function isOwner(userId) {
        return request.auth.uid == userId;
      }

      // Trades collection
      match /trades/{tradeId} {
        allow read: if isAuthenticated() && isOwner(resource.data.userId);
        allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
        allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);
      }

      // Profiles collection
      match /profiles/{profileId} {
        allow read: if isAuthenticated() && isOwner(resource.data.userId);
        allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
        allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);
      }
    }
  }
  ```

- [ ] **Publish Rules**
  - [ ] Click "Publish" button
  - [ ] ✅ Test: Try accessing Firestore without auth (should fail)
  - [ ] ✅ Test: Try accessing after sign-in (should work)

### Phase 4: Application Integration 🔌

- [ ] **Update App.vue**
  - [ ] Import AuthGuard component
  - [ ] Wrap main app content with `<AuthGuard>`
  - [ ] Test that app shows loading state initially
  - [ ] Test that login page appears when not authenticated

  **Example:**
  ```vue
  <template>
    <AuthGuard>
      <div v-if="!loading" id="app">
        <!-- Your existing app content -->
        <header>
          <h1>📈 Trading Journal</h1>
          <UserMenu v-if="isAuthenticated" />
        </header>
        <nav>
          <!-- Navigation -->
        </nav>
        <main>
          <RouterView />
        </main>
      </div>
    </AuthGuard>
  </template>

  <script setup>
  import AuthGuard from '@/components/auth/AuthGuard.vue'
  import { useAuth } from '@/composables/useAuth'

  const { isAuthenticated } = useAuth()
  // ... rest of your code
  </script>
  ```

- [ ] **Add User Menu/Sign-Out Button**
  - [ ] Create a user menu component or add to header
  - [ ] Display user avatar and name
  - [ ] Add "Sign Out" button
  - [ ] Handle sign-out action

  **Example:**
  ```vue
  <template>
    <div v-if="user" class="user-menu">
      <img :src="user.photoURL" :alt="user.displayName" class="avatar" />
      <span class="user-name">{{ user.displayName }}</span>
      <button class="sign-out-btn" @click="handleSignOut">
        Sign Out
      </button>
    </div>
  </template>

  <script setup>
  import { useAuth } from '@/composables/useAuth'

  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign-out failed:', error)
    }
  }
  </script>
  ```

- [ ] **Test Integration**
  - [ ] ✅ App redirects to login when not authenticated
  - [ ] ✅ Login button works and shows Google account picker
  - [ ] ✅ After sign-in, app content appears
  - [ ] ✅ User info displays correctly (name, photo)
  - [ ] ✅ Sign-out button works
  - [ ] ✅ After sign-out, redirects back to login

### Phase 5: Data Migration (For Existing Data) 📦

**⚠️ Important: Only needed if you have existing trades/profiles without `userId`**

- [ ] **Backup Existing Data**
  - [ ] Export all trades from Firestore
  - [ ] Export all profiles from Firestore
  - [ ] Save backups to local files

- [ ] **Temporary: Relax Security Rules**
  ```javascript
  // TEMPORARY - Remove after migration
  match /trades/{tradeId} {
    allow read, write: if true;
  }
  match /profiles/{profileId} {
    allow read, write: if true;
  }
  ```

- [ ] **Option A: Manual Migration via Firebase Console**
  - [ ] Go to Firestore Database → Data tab
  - [ ] For each trade document:
    - [ ] Click on the document
    - [ ] Click "Add field"
    - [ ] Field name: `userId`
    - [ ] Field value: Your Firebase user ID (get from Auth → Users)
    - [ ] Click Add
  - [ ] Repeat for all trades
  - [ ] Repeat for all profiles

- [ ] **Option B: Create Migration Script** (Recommended for many documents)
  - [ ] Create `scripts/migrateUserIds.js`
  - [ ] Add migration logic to add `userId` to all documents
  - [ ] Run script once
  - [ ] Verify all documents have `userId` field

- [ ] **Re-enable Security Rules**
  - [ ] Restore the authenticated security rules from Phase 3
  - [ ] Publish rules
  - [ ] ✅ Test: Verify you can still access your data

- [ ] **Clean Up**
  - [ ] Remove migration script (if created)
  - [ ] Delete backup files (after confirming everything works)

### Phase 6: Testing & Validation ✅

- [ ] **Authentication Flow**
  - [ ] ✅ Test sign-in with Google account
  - [ ] ✅ Test sign-in cancellation (should handle gracefully)
  - [ ] ✅ Test sign-out
  - [ ] ✅ Test session persistence (refresh page while logged in)

- [ ] **Data Isolation**
  - [ ] ✅ Sign in as User A
  - [ ] ✅ Create some trades
  - [ ] ✅ Sign out
  - [ ] ✅ Sign in as User B (different Google account)
  - [ ] ✅ Verify User B doesn't see User A's trades
  - [ ] ✅ Create trades for User B
  - [ ] ✅ Sign out and back in as User A
  - [ ] ✅ Verify User A still sees only their trades

- [ ] **Profile Isolation**
  - [ ] ✅ Test profiles are isolated per user
  - [ ] ✅ Test each user has their own default profile
  - [ ] ✅ Test profile switching works per user

- [ ] **Error Handling**
  - [ ] ✅ Test popup blocked scenario
  - [ ] ✅ Test network error during sign-in
  - [ ] ✅ Test Firestore permission errors display properly
  - [ ] ✅ Test sign-out errors display properly

- [ ] **UI/UX Testing**
  - [ ] ✅ Login page displays correctly
  - [ ] ✅ Loading states show appropriately
  - [ ] ✅ Error messages are user-friendly
  - [ ] ✅ User avatar displays correctly
  - [ ] ✅ Mobile responsive (test on phone)

### Phase 7: Production Preparation 🚀

- [ ] **Environment Variables**
  - [ ] Verify all Firebase config vars are in `.env`
  - [ ] Ensure `.env` is in `.gitignore`
  - [ ] Create `.env.example` template
  - [ ] Document required environment variables

- [ ] **Production Firebase Project**
  - [ ] Create separate Firebase project for production (recommended)
  - [ ] Enable Google Auth in production project
  - [ ] Update production environment variables
  - [ ] Set up production Firestore security rules

- [ ] **Deployment Configuration**
  - [ ] Add production domain to Firebase authorized domains
  - [ ] Test OAuth redirect with production URL
  - [ ] Configure OAuth consent screen (if needed)

- [ ] **Performance & Optimization**
  - [ ] Verify auth state caching works
  - [ ] Check bundle size (Firebase Auth adds ~50kb)
  - [ ] Test initial load time with auth check
  - [ ] Optimize if needed

### Phase 8: Documentation & Polish 📚

- [ ] **User Documentation**
  - [ ] Create user guide for sign-in process
  - [ ] Document privacy policy (data usage)
  - [ ] Create FAQ section

- [ ] **Developer Documentation**
  - [ ] Document auth service API
  - [ ] Add JSDoc comments to auth functions
  - [ ] Create troubleshooting guide
  - [ ] Document common issues and solutions

- [ ] **Code Quality**
  - [ ] Remove console.log statements
  - [ ] Add error logging service integration
  - [ ] Review and clean up unused imports
  - [ ] Run linter and fix issues

### Phase 9: Advanced Features (Optional) ⭐

- [ ] **Additional Auth Providers**
  - [ ] Add Facebook login
  - [ ] Add Email/Password login
  - [ ] Add GitHub login
  - [ ] Add Twitter login

- [ ] **User Profile Management**
  - [ ] Create user profile page
  - [ ] Allow users to update display name
  - [ ] Allow users to upload custom avatar
  - [ ] Add account deletion feature

- [ ] **Multi-Factor Authentication**
  - [ ] Add phone number verification
  - [ ] Add authenticator app support
  - [ ] Add backup codes

- [ ] **Advanced Security**
  - [ ] Add email verification requirement
  - [ ] Add session timeout
  - [ ] Add suspicious activity detection
  - [ ] Add rate limiting

- [ ] **Analytics**
  - [ ] Track sign-in events
  - [ ] Track sign-out events
  - [ ] Track authentication errors
  - [ ] Monitor user retention

## 🎯 Current Status

**Phase:** 1/9 Complete (Core Implementation)
**Next Step:** Phase 2 - Enable Google Auth in Firebase Console
**Estimated Time to Complete:** 30-45 minutes

## 📝 Notes

- **Branch:** `feature/google-auth` (if working in a feature branch)
- **Created:** October 20, 2025
- **Last Updated:** October 20, 2025

## ⚠️ Important Reminders

1. **Always test in development first** before deploying to production
2. **Backup your Firestore data** before updating security rules
3. **Keep your Firebase API keys secure** - never commit `.env` files
4. **Test with multiple Google accounts** to verify data isolation
5. **Monitor Firebase Authentication usage** - there are quota limits

## 🆘 If You Get Stuck

1. Check the Quick Start Guide: `docs/QUICK_START_AUTH.md`
2. Check the Full Setup Guide: `docs/GOOGLE_AUTHENTICATION_SETUP.md`
3. Review Firebase Auth documentation: https://firebase.google.com/docs/auth
4. Check the browser console for error messages
5. Review Firestore security rules for permission errors

## ✅ Success Criteria

- [ ] Users can sign in with Google
- [ ] Users can sign out
- [ ] Sessions persist across page refreshes
- [ ] Each user sees only their own data
- [ ] All trades have `userId` field
- [ ] All profiles have `userId` field
- [ ] Security rules enforce user data isolation
- [ ] No console errors during auth flow
- [ ] Login page looks professional
- [ ] User experience is smooth and intuitive

---


## Next Steps:
- Enable Google Auth in Firebase Console (required)
- Update App.vue to use AuthGuard (required)
- Update Firestore Rules (required for security)
- Test the login flow (recommended)
- Add sign-out button (recommended)


**Ready to start?** Begin with Phase 2: Enable Google Authentication in Firebase Console!
