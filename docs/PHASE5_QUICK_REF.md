# Phase 5 Migration - Quick Reference Card

## 🎯 Goal
Add `userId` field to all existing Firestore documents

## ⏱️ Time Required
15-30 minutes

## 🛠️ What You'll Use
**Recommended:** Browser Migration Tool (`scripts/migrate.html`)

---

## 📋 Pre-Flight Checklist

- [ ] Firestore data backed up
- [ ] Current security rules saved to file
- [ ] `.env` file has Firebase config
- [ ] All other app instances closed

---

## 🚀 Quick Steps

### 1. Relax Rules (Temporary)
**Firebase Console → Firestore → Rules:**
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
Click **Publish**

### 2. Configure Migration Tool
**Edit `scripts/migrate.html` line 212:**
```javascript
const firebaseConfig = {
  apiKey: "copy-from-your-.env",
  authDomain: "copy-from-your-.env",
  projectId: "copy-from-your-.env",
  storageBucket: "copy-from-your-.env",
  messagingSenderId: "copy-from-your-.env",
  appId: "copy-from-your-.env"
}
```

### 3. Serve Migration Page
**Terminal:**
```bash
npx http-server -p 8080
```

### 4. Run Migration
**Browser:**
1. Go to: http://localhost:8080/scripts/migrate.html
2. Click "Sign In with Google"
3. Verify your User ID
4. Click "Start Migration"
5. Wait for completion ✅

### 5. Restore Strict Rules
**Firebase Console → Firestore → Rules:**

Copy from `firestore.rules` file, then click **Publish**

### 6. Test App
```bash
npm run dev
```
- Sign in
- Verify data loads
- Check dashboard works
- Test creating new trade

---

## ✅ Success Indicators

- No permission errors
- All documents have `userId` in Firebase Console
- Data loads when signed in
- Different users see different data

---

## 🆘 Troubleshooting

| Problem | Solution |
|---------|----------|
| Permission errors | Wait 30s, rules need time to propagate |
| No documents found | Check correct Firebase project |
| Migration fails | Verify temporary rules are published |
| App still broken | Make sure you restored strict rules |

---

## 📖 Full Documentation

- **Detailed Guide:** `docs/PHASE5_MIGRATION_GUIDE.md`
- **Scripts README:** `scripts/README.md`
- **Phase Checklist:** `docs/GoogleAuthTodo.md`

---

**🎯 Bottom Line:**
Relax rules → Configure tool → Run migration → Restore rules → Test ✅
