# Quick Start: Adding Google Authentication

Follow these simple steps to enable Google Sign-In for your Trading Journal application.

## 📋 Prerequisites

✅ Firebase project created
✅ Firebase configured in your app
✅ All authentication files created (done!)

## 🚀 Quick Setup (5 minutes)

### Step 1: Enable Google Auth in Firebase Console

1. Go to https://console.firebase.google.com
2. Select your project
3. Click **Authentication** in the left menu
4. Click **Get Started** (if first time)
5. Click the **Sign-in method** tab
6. Find **Google** in the providers list
7. Click Google → Click **Enable** toggle
8. Select/enter a support email (your email)
9. Click **Save**

**That's it for Firebase Console! ✅**

### Step 2: Update Your App.vue

Wrap your app content with the AuthGuard component:

```vue
<template>
  <AuthGuard>
    <!-- Your existing app content goes here -->
    <div v-if="!loading" id="app">
      <header>
        <!-- Your header -->
      </header>

      <nav>
        <!-- Your navigation -->
      </nav>

      <main>
        <RouterView />
      </main>
    </div>
  </AuthGuard>
</template>

<script setup>
import AuthGuard from '@/components/auth/AuthGuard.vue'
// ... rest of your imports
</script>
```

### Step 3: Add Sign-Out Button (Optional)

Add a sign-out button to your header:

```vue
<template>
  <header>
    <h1>Trading Journal</h1>

    <!-- Add this section -->
    <div v-if="user" class="user-menu">
      <img :src="user.photoURL" alt="Profile" class="user-avatar" />
      <span>{{ user.displayName }}</span>
      <button @click="handleSignOut">Sign Out</button>
    </div>
  </header>
</template>

<script setup>
import { useAuth } from '@/composables/useAuth'

const { user, signOut } = useAuth()

const handleSignOut = async() => {
  await signOut()
}
</script>

<style scoped>
.user-menu {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
}
</style>
```

### Step 4: Update Firestore Security Rules

Go to Firebase Console → Firestore Database → Rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Helper: Check if user is authenticated
    function isAuthenticated() {
      return request.auth != null;
    }

    // Helper: Check if user owns the resource
    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    // Trades: Users can only access their own trades
    match /trades/{tradeId} {
      allow read, write: if isAuthenticated() &&
                           (resource == null || isOwner(resource.data.userId));
    }

    // Profiles: Users can only access their own profiles
    match /profiles/{profileId} {
      allow read, write: if isAuthenticated() &&
                           (resource == null || isOwner(resource.data.userId));
    }
  }
}
```

Click **Publish**

### Step 5: Test It!

```bash
npm run dev
```

1. Open your app
2. You should see the login page
3. Click "Sign in with Google"
4. Select your Google account
5. Authorize the app
6. You're in! 🎉

## ✨ What You Get

✅ **Beautiful Login Page** - Professional Google Sign-In button
✅ **User Profile** - Access to name, email, photo
✅ **Persistent Sessions** - Stay logged in across page refreshes
✅ **Data Isolation** - Each user sees only their own data
✅ **Loading States** - Smooth loading indicators
✅ **Error Handling** - User-friendly error messages

## 🔧 Troubleshooting

### Login page shows but button doesn't work?

**Check your Firebase config in `.env`:**
```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-app.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
# ... other keys
```

**Make sure `authDomain` is correct!**

### "Popup blocked" error?

- Allow popups in your browser for localhost
- Or change `authService.ts` to use redirect instead of popup

### Can't create trades after signing in?

- Check Firestore security rules are published
- Check browser console for "permission-denied" errors
- Verify trades are being saved with `userId` field

### Existing trades not showing?

- Old trades don't have `userId` field
- See `docs/DATA_MIGRATION.md` for migration steps
- Temporary fix: Update security rules to allow reading all docs

## 📚 More Information

- **Full Setup Guide**: `docs/GOOGLE_AUTHENTICATION_SETUP.md`
- **API Documentation**: See `src/firebase/authService.ts`
- **Usage Examples**: See `src/components/auth/LoginPage.vue`

## 🎯 Next Steps

- [ ] Test sign-in flow
- [ ] Add sign-out button to your header
- [ ] Update Firestore security rules
- [ ] Test data isolation with different accounts
- [ ] (Optional) Customize login page styling
- [ ] (Optional) Add user profile page
- [ ] (Optional) Add more auth providers (Facebook, Email/Password)

---

**Need Help?** Check the troubleshooting section or Firebase Auth documentation.

**Estimated Setup Time**: 5-10 minutes
**Difficulty**: Easy ⭐
