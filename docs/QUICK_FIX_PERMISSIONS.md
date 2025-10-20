# Fix Firestore Permissions Error - Quick Guide

## The Error
```
[profileService] Error getting all profiles
FirebaseError: Missing or insufficient permissions.
```

## The Fix (5 Minutes)

### Step 1: Open Firebase Console
🔗 https://console.firebase.google.com/

### Step 2: Navigate to Rules
```
Your Project → Firestore Database → Rules Tab
```

### Step 3: Choose Your Option

#### 🟡 Option A: Quick Development Fix (Temporary)
**Use this if you want to test quickly (not secure for production)**

Paste this:
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

#### 🟢 Option B: Production-Ready (Recommended)
**Use this for proper user data isolation**

Paste this:
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

### Step 4: Publish
Click the **"Publish"** button (top right corner)

### Step 5: Test
Refresh your app - the error should be gone! ✅

---

## ⚠️ If You Have Existing Data

If you created trades/profiles before authentication, they don't have `userId` field.

**Temporary Solution:** Use Option A first, then migrate data later.

**Permanent Solution:** Add `userId` field to existing documents in Firebase Console:
1. Go to Firestore Database → Data tab
2. Open each collection (trades, profiles)
3. For each document:
   - Click "Add field"
   - Name: `userId`
   - Value: (your Firebase user ID from Authentication tab)
   - Save

Then switch to Option B rules.

---

## Need More Help?

📖 Detailed guide: `docs/FIRESTORE_RULES_UPDATE.md`
📋 Full checklist: `docs/GoogleAuthTodo.md`

---

**🎯 Bottom Line:** Go to Firebase Console → Firestore → Rules → Paste code above → Publish → Done!
