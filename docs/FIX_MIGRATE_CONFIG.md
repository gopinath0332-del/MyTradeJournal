# Fix Firebase Config in migrate.html

## 🔴 Error You're Seeing

```
Sign-in failed: Firebase: Error (auth/api-key-not-valid.-please-pass-a-valid-api-key.).
```

## ✅ Solution: Update Firebase Config

### Quick Fix (2 Minutes)

1. **Open your `.env` file** in the project root

2. **Find these values:**
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_STORAGE_BUCKET=...
   VITE_FIREBASE_MESSAGING_SENDER_ID=...
   VITE_FIREBASE_APP_ID=...
   ```

3. **Open `scripts/migrate.html`** in your editor

4. **Find line ~291** (search for "Firebase configuration"):
   ```javascript
   const firebaseConfig = {
     apiKey: "YOUR_API_KEY",
     authDomain: "YOUR_AUTH_DOMAIN",
     projectId: "YOUR_PROJECT_ID",
     storageBucket: "YOUR_STORAGE_BUCKET",
     messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
     appId: "YOUR_APP_ID"
   }
   ```

5. **Replace with your actual values from `.env`:**
   ```javascript
   const firebaseConfig = {
     apiKey: "copy-from-VITE_FIREBASE_API_KEY",
     authDomain: "copy-from-VITE_FIREBASE_AUTH_DOMAIN",
     projectId: "copy-from-VITE_FIREBASE_PROJECT_ID",
     storageBucket: "copy-from-VITE_FIREBASE_STORAGE_BUCKET",
     messagingSenderId: "copy-from-VITE_FIREBASE_MESSAGING_SENDER_ID",
     appId: "copy-from-VITE_FIREBASE_APP_ID"
   }
   ```

6. **Save the file**

7. **Refresh your browser** and try signing in again

---

## 🚀 Automated Solution

Run this command to automatically update the config:

```bash
node scripts/generate-migrate-config.js
```

This will:
- Read your `.env` file
- Extract Firebase configuration
- Update `migrate.html` automatically
- Show you the next steps

---

## 📋 Example

**Before (Placeholder):**
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  // ...
}
```

**After (Your Actual Config):**
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBx1234567890abcdefg",
  authDomain: "my-trading-journal.firebaseapp.com",
  projectId: "my-trading-journal",
  storageBucket: "my-trading-journal.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:abc123def456"
}
```

---

## ⚠️ Important Notes

1. **Don't commit** the updated `migrate.html` to Git (it contains your API keys)
2. **After migration**, you can revert `migrate.html` to placeholder values
3. **API Key is safe** to expose in client-side code (it's protected by Firestore rules)
4. But still **good practice** to keep it out of version control

---

## 🆘 Still Not Working?

### Check Your .env File

Make sure your `.env` file exists and has all required variables:

```bash
# View your .env file (PowerShell)
Get-Content .env
```

If `.env` doesn't exist, create it from `.env.example`:
```bash
Copy-Item .env.example .env
```

Then fill in your actual Firebase values from Firebase Console.

### Get Firebase Config from Console

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project
3. Click ⚙️ (Settings) → Project settings
4. Scroll down to "Your apps"
5. Click on your web app (or create one if none exist)
6. Copy the `firebaseConfig` object
7. Paste values into `migrate.html`

---

**After fixing:** Refresh browser and try signing in again! ✅
