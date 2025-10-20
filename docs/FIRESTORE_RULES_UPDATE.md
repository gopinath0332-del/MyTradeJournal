# Firestore Security Rules Update - REQUIRED

**Date:** October 20, 2025
**Status:** ⚠️ ACTION REQUIRED
**Priority:** HIGH - App cannot access data until rules are updated

## Problem

You're seeing this error:
```
[profileService] Error getting all profiles FirebaseError: Missing or insufficient permissions.
```

This is because the default Firestore security rules block all access. We need to update them to allow authenticated users to access their own data.

## Solution: Update Firestore Rules

### Option 1: Quick Fix (Temporary - Development Only)

⚠️ **WARNING**: This allows read/write access for anyone. Use ONLY for testing!

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace with:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```
5. Click **Publish**

### Option 2: Production-Ready Rules (Recommended)

This implements proper user-based access control:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Navigate to **Firestore Database** → **Rules** tab
4. Replace with the contents of `firestore.rules` in your project root:

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

    // Lessons collection
    match /lessons/{lessonId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
  }
}
```

5. Click **Publish**

## ⚠️ Important: Existing Data Migration

If you have **existing trades or profiles** in Firestore (created before authentication), they don't have a `userId` field. The new rules will block access to them.

### Check if You Have Existing Data

Run this in your browser console (after signing in):
```javascript
// Check trades
const tradesSnapshot = await firebase.firestore().collection('trades').limit(1).get()
const firstTrade = tradesSnapshot.docs[0]?.data()
console.log('First trade:', firstTrade)
console.log('Has userId?', 'userId' in firstTrade)

// Check profiles
const profilesSnapshot = await firebase.firestore().collection('profiles').limit(1).get()
const firstProfile = profilesSnapshot.docs[0]?.data()
console.log('First profile:', firstProfile)
console.log('Has userId?', 'userId' in firstProfile)
```

### If You Have Existing Data Without userId

You have two options:

**Option A: Use Quick Fix Temporarily**
1. Use Option 1 (quick fix) rules temporarily
2. Sign in to your app
3. Your app's services will automatically add `userId` to new data
4. Existing data will remain accessible but won't be user-isolated
5. Later, manually add `userId` to old data in Firebase Console

**Option B: Migrate Data First**
1. Go to Firebase Console → Firestore Database
2. For each document in `trades` and `profiles` collections:
   - Click the document
   - Click "Add field"
   - Field: `userId`
   - Value: Your Firebase user ID (get from Authentication tab)
   - Click Add
3. Once all data has `userId`, use Option 2 (production rules)

## Step-by-Step Instructions

### 1. Go to Firebase Console

Open: https://console.firebase.google.com/

### 2. Navigate to Firestore Rules

```
Firebase Console
  └─ Select your project
      └─ Firestore Database (left sidebar)
          └─ Rules tab (top)
```

### 3. Backup Current Rules

Copy the current rules and save them somewhere safe (just in case).

### 4. Paste New Rules

Choose Option 1 (quick fix) or Option 2 (production) from above.

### 5. Publish

Click the **Publish** button (top right).

### 6. Test

1. Refresh your app
2. Try to load data
3. The error should be gone!

## Verification

After updating rules, you should see:

✅ No more "Missing or insufficient permissions" errors
✅ Profiles load correctly
✅ Trades load correctly
✅ Data is properly isolated per user (with Option 2)

## Security Comparison

| Feature | Quick Fix (Option 1) | Production (Option 2) |
|---------|---------------------|---------------------|
| Requires authentication | ✅ Yes | ✅ Yes |
| User isolation | ❌ No | ✅ Yes |
| User A can see User B's data | ⚠️ YES | ❌ NO |
| Suitable for production | ❌ No | ✅ Yes |
| Works with existing data | ✅ Yes | ⚠️ Only if userId exists |

## Troubleshooting

### Still Getting Permission Errors?

1. **Wait 30 seconds** - Rules take a moment to propagate
2. **Hard refresh** - Ctrl+Shift+R (or Cmd+Shift+R on Mac)
3. **Check Authentication** - Make sure you're signed in
4. **Check userId field** - Verify documents have `userId` field
5. **Check Console** - Look for specific error messages

### Rules Not Updating?

- Make sure you clicked **Publish** (not just Save)
- Check that you're in the correct Firebase project
- Try closing and reopening the Rules tab

## Next Steps

After updating the rules:

✅ **Phase 3 Complete!** Mark it in `docs/GoogleAuthTodo.md`

Still TODO:
- Phase 5: Data Migration (if you have existing data)
- Phase 6: Testing & Validation

## Related Files

- `firestore.rules` - Production-ready rules (copy to Firebase Console)
- `docs/GoogleAuthTodo.md` - Full implementation checklist
- `docs/GOOGLE_AUTHENTICATION_SETUP.md` - Complete auth guide

---

**Action Required:** Update Firestore rules in Firebase Console NOW to fix the permissions error.

**Estimated Time:** 2-5 minutes
