# Phase 5: Data Migration Guide

**Date:** October 20, 2025
**Phase:** 5 of 9
**Estimated Time:** 15-30 minutes
**Difficulty:** Medium

## 📋 Overview

This guide helps you migrate existing Firestore data to include the `userId` field required for Google Authentication. If you have trades or profiles created before implementing authentication, they won't have a `userId` field and will be inaccessible with the new security rules.

## ⚠️ Do You Need This?

You need migration if:
- ✅ You have existing trades/profiles in Firestore
- ✅ Those documents were created before implementing Google Auth
- ✅ You're getting "Missing or insufficient permissions" errors

You DON'T need migration if:
- ❌ This is a new project with no existing data
- ❌ All your data was created after implementing auth (already has `userId`)

## 🔍 Check If You Need Migration

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Navigate to Firestore Database → Data
3. Open the `trades` collection
4. Click on any document
5. Check if it has a `userId` field

**Has userId?** → No migration needed ✅
**No userId?** → Continue with migration ⚠️

## 📦 Two Migration Options

### Option A: Manual Migration (Small Datasets)
**Best for:** < 50 documents
**Time:** 5-10 minutes
**Difficulty:** Easy

### Option B: Automated Migration (Recommended)
**Best for:** Any size dataset
**Time:** 15-30 minutes
**Difficulty:** Medium

---

## 🛠️ Option B: Automated Migration (Recommended)

This creates and runs a migration script to automatically add `userId` to all documents.

### Step 1: Backup Your Data

**CRITICAL:** Always backup before migrating!

#### Using Firebase Console (Recommended)
1. Go to Firebase Console → Firestore Database
2. Click "Usage" tab
3. Use "Import/Export" to create a backup
4. Or use `gcloud` CLI:
   ```bash
   gcloud firestore export gs://YOUR_BUCKET/backup-$(date +%Y%m%d)
   ```

#### Using Local Script (Quick Backup)
Just copy a few key documents manually as a safety net.

### Step 2: Temporarily Relax Firestore Rules

**IMPORTANT:** This is temporary - we'll restore strict rules after migration!

1. Go to Firebase Console → Firestore Database → Rules
2. **BACKUP YOUR CURRENT RULES** (copy to a file)
3. Replace with temporary rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      // TEMPORARY - Remove after migration
      allow read, write: if request.auth != null;
    }
  }
}
```

4. Click **Publish**
5. ⚠️ **Remember:** You MUST restore strict rules after migration!

### Step 3A: Browser-Based Migration (Easiest)

We've created a user-friendly HTML page for the migration:

1. **Configure the Migration Page**

   Open `scripts/migrate.html` in your code editor and update the Firebase config:

   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",           // Get from .env file
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   }
   ```

   💡 **Tip:** Copy these values from your `.env` file or `src/firebase/config.ts`

2. **Serve the Migration Page**

   Open a terminal and run:
   ```bash
   # Option 1: Using Python (if installed)
   python -m http.server 8080

   # Option 2: Using Node.js http-server (install globally first)
   npx http-server -p 8080

   # Option 3: Using VS Code Live Server extension
   # Right-click migrate.html → "Open with Live Server"
   ```

3. **Run the Migration**

   - Open your browser to: http://localhost:8080/scripts/migrate.html
   - Click "Sign In with Google"
   - Sign in with YOUR Google account (the one you want to own the data)
   - Verify your User ID is correct
   - Click "Start Migration"
   - Wait for completion
   - Review the summary

4. **Verify the Migration**

   - Go to Firebase Console → Firestore Database
   - Check a few documents in `trades` and `profiles`
   - Verify they now have `userId` field with your ID

### Step 3B: Node.js Script Migration (Alternative)

If you prefer a command-line approach:

1. **Update Environment Variables**

   Make sure your `.env` file has all Firebase config variables.

2. **Install Dependencies**

   ```bash
   npm install dotenv
   ```

3. **Run the Migration Script**

   ```bash
   node scripts/migrateUserIds.js
   ```

4. **Follow the Prompts**

   - The script will ask you to sign in with Google
   - Confirm your User ID
   - The script will process all collections
   - Review the summary when complete

### Step 4: Restore Strict Security Rules

**CRITICAL:** Don't forget this step!

1. Go to Firebase Console → Firestore Database → Rules
2. Replace with production-ready rules from `firestore.rules`:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    function isAuthenticated() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return request.auth.uid == userId;
    }

    match /trades/{tradeId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);
    }

    match /profiles/{profileId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);
    }

    match /lessons/{lessonId} {
      allow read: if isAuthenticated() && isOwner(resource.data.userId);
      allow create: if isAuthenticated() && isOwner(request.resource.data.userId);
      allow update, delete: if isAuthenticated() && isOwner(resource.data.userId);
    }
  }
}
```

3. Click **Publish**

### Step 5: Test Your App

1. **Open Your App**
   ```bash
   npm run dev
   ```

2. **Sign In**
   - Sign in with the same Google account you used for migration

3. **Verify Data Loads**
   - Check Dashboard - should show your trades
   - Check Trade History - should show all your trades
   - Check Profiles - should show your profiles
   - Verify statistics calculate correctly

4. **Test Creating New Data**
   - Create a new trade
   - Create a new profile
   - Verify they work correctly

5. **Test Data Isolation** (if possible)
   - Sign out
   - Sign in with a different Google account
   - Verify you DON'T see the migrated data
   - Verify you can create separate data for this user

### Step 6: Clean Up

1. **Delete Migration Files** (Optional)
   ```bash
   # After successful migration, you can remove:
   rm scripts/migrateUserIds.js
   rm scripts/migrate.html
   # Or keep them for reference
   ```

2. **Update Documentation**
   - Mark Phase 5 as complete in `docs/GoogleAuthTodo.md`

---

## 🎯 Migration Checklist

Use this checklist to track your progress:

- [ ] **Pre-Migration**
  - [ ] Checked if migration is needed
  - [ ] Backed up Firestore data
  - [ ] Saved current Firestore rules to a file
  - [ ] Installed required dependencies (if using Node.js script)

- [ ] **Migration Setup**
  - [ ] Updated temporary Firestore rules
  - [ ] Published temporary rules
  - [ ] Configured migration script/page with Firebase config
  - [ ] Closed all other app instances

- [ ] **Run Migration**
  - [ ] Started migration tool (HTML page or Node.js script)
  - [ ] Signed in with Google
  - [ ] Verified User ID is correct
  - [ ] Ran migration
  - [ ] Reviewed migration summary
  - [ ] Verified no errors in console

- [ ] **Post-Migration**
  - [ ] Verified documents in Firebase Console have `userId`
  - [ ] Restored strict Firestore security rules
  - [ ] Published production rules
  - [ ] Tested app with migrated data
  - [ ] Tested data isolation with different user
  - [ ] Deleted migration scripts (optional)

---

## ❌ Troubleshooting

### "Missing or insufficient permissions" during migration

**Solution:**
- Make sure you published the temporary rules
- Wait 30 seconds for rules to propagate
- Try again

### "User is not signed in"

**Solution:**
- Click "Sign In with Google" first
- Make sure popup blocker isn't blocking the auth popup
- Try in an incognito window

### Migration shows 0 documents

**Solution:**
- Check that you're looking at the correct Firebase project
- Verify documents exist in Firebase Console
- Make sure you're signed in

### Some documents failed to update

**Solution:**
- Check the error message in the console
- Verify Firestore rules allow writes
- Try running migration again (it will skip already-migrated docs)
- Manually update failed documents in Firebase Console

### App still shows permission errors after migration

**Solution:**
- Make sure you restored the production Firestore rules
- Verify documents have `userId` field
- Check that `userId` matches your signed-in user ID
- Hard refresh the app (Ctrl+Shift+R)

---

## 📊 Expected Results

After successful migration:

### Collections Updated
- ✅ **trades** - All documents have `userId: "your-firebase-uid"`
- ✅ **profiles** - All documents have `userId: "your-firebase-uid"`
- ✅ **lessons** - All documents have `userId: "your-firebase-uid"` (if exists)

### App Behavior
- ✅ No more permission errors
- ✅ Data loads correctly when signed in
- ✅ Other users can't see your data
- ✅ You can't see other users' data
- ✅ New data automatically gets `userId`

### Security
- ✅ Strict Firestore rules enforced
- ✅ User isolation working
- ✅ Data properly secured per user

---

## 📝 Next Steps

After completing Phase 5:

### ✅ Mark Phase 5 Complete
Update `docs/GoogleAuthTodo.md`:
```markdown
### Phase 5: Data Migration ✅
- [x] Backed up existing data
- [x] Relaxed security rules temporarily
- [x] Ran migration script
- [x] Verified all documents have userId
- [x] Restored strict security rules
- [x] Tested app with migrated data
```

### ➡️ Move to Phase 6: Testing & Validation
- Test authentication flow
- Test data isolation
- Test error handling
- Test UI/UX
- Document any issues

See `docs/GoogleAuthTodo.md` for Phase 6 details.

---

## 🆘 Need Help?

### Documentation
- 📖 Quick Start: `docs/QUICK_START_AUTH.md`
- 📖 Full Setup: `docs/GOOGLE_AUTHENTICATION_SETUP.md`
- 📖 Todo Checklist: `docs/GoogleAuthTodo.md`
- 📖 Firestore Rules: `docs/FIRESTORE_RULES_UPDATE.md`

### Common Issues
- Check browser console for errors
- Check Firebase Console Rules tab
- Verify you're using the correct Google account
- Make sure all environment variables are set

### Firebase Documentation
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [Firebase Authentication](https://firebase.google.com/docs/auth)

---

**Migration Time:** ~15-30 minutes
**Difficulty:** Medium
**One-time:** Yes - run only once
**Reversible:** Yes - you have backups

✨ **You've got this!** Follow the steps carefully and you'll have your data migrated in no time.
