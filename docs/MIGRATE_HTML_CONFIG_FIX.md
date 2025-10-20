# Quick Fix: Update migrate.html Firebase Config

## 🎯 The Problem

The `migrate.html` file has placeholder Firebase configuration that needs to be replaced with your actual Firebase project credentials.

## ✅ Solution Options

### Option 1: Manual Update (Recommended - 3 minutes)

#### Step 1: Get Your Firebase Config

**Method A: From Firebase Console**
1. Go to https://console.firebase.google.com/
2. Select your project
3. Click ⚙️ Settings → Project settings
4. Scroll to "Your apps" section
5. If you have a web app, click it
6. If not, click "Add app" → Web (</>) → Register app
7. Copy the `firebaseConfig` values

**Method B: From Your Running App**
1. Open your app in browser: `npm run dev`
2. Open browser DevTools (F12)
3. Go to Console tab
4. Type: `localStorage`
5. Or inspect Network tab → look for Firebase API calls

#### Step 2: Update migrate.html

1. Open `scripts/migrate.html` in your code editor
2. Find line ~291 (search for "REPLACE WITH YOUR CONFIG")
3. Replace this:
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

4. With your actual config:
   ```javascript
   const firebaseConfig = {
     apiKey: "AIzaSyA...",  // Your actual API key
     authDomain: "your-project.firebaseapp.com",
     projectId: "your-project-id",
     storageBucket: "your-project.appspot.com",
     messagingSenderId: "123456789",
     appId: "1:123456789:web:abc123"
   }
   ```

5. Save the file
6. Refresh your browser tab with migrate.html
7. Try signing in again

---

### Option 2: Copy from src/firebase/config.ts

Since your app is working, you can copy the config from there:

#### Step 1: Check Your App's Firebase Config

Run this in your terminal:

```powershell
# For PowerShell
node -e "console.log(JSON.stringify({apiKey:process.env.VITE_FIREBASE_API_KEY,authDomain:process.env.VITE_FIREBASE_AUTH_DOMAIN,projectId:process.env.VITE_FIREBASE_PROJECT_ID,storageBucket:process.env.VITE_FIREBASE_STORAGE_BUCKET,messagingSenderId:process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,appId:process.env.VITE_FIREBASE_APP_ID},null,2))"
```

Or simpler - just copy the values from your `.env` file directly.

#### Step 2: View Your .env File

```powershell
notepad .env
```

Look for these variables:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`

#### Step 3: Update migrate.html

Copy those values (without the `VITE_` prefix and without quotes) into `migrate.html`.

---

### Option 3: Use Browser DevTools (Easiest!)

1. **Run your main app:**
   ```bash
   npm run dev
   ```

2. **Open it in browser** (usually http://localhost:5173)

3. **Open DevTools** (F12 or Right-click → Inspect)

4. **Go to Console tab**

5. **Type this command:**
   ```javascript
   // Get the Firebase config from the running app
   JSON.stringify({
     apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
     authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
     projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
     storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
     messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
     appId: import.meta.env.VITE_FIREBASE_APP_ID
   }, null, 2)
   ```

6. **Copy the output**

7. **Paste into migrate.html** (replace the placeholder config)

---

## 🎯 Quick Visual Guide

### Before (Line 291 in migrate.html):
```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",          // ❌ Placeholder
  authDomain: "YOUR_AUTH_DOMAIN",  // ❌ Placeholder
  projectId: "YOUR_PROJECT_ID",    // ❌ Placeholder
  // ...
}
```

### After (Your actual values):
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBxYz...",                     // ✅ Real key
  authDomain: "my-journal.firebaseapp.com",   // ✅ Real domain
  projectId: "my-trading-journal-12345",      // ✅ Real project ID
  storageBucket: "my-journal.appspot.com",    // ✅ Real bucket
  messagingSenderId: "987654321",              // ✅ Real ID
  appId: "1:987654321:web:abc123def456"       // ✅ Real app ID
}
```

---

## ✅ Verify It Works

After updating:

1. Save `migrate.html`
2. Refresh the browser tab
3. Click "Sign in with Google"
4. Should open Google account picker ✅
5. No more "invalid API key" error ✅

---

## 🔒 Security Note

**Is it safe to put API keys in HTML?**

Yes! Firebase API keys are safe in client-side code because:
- They're meant to be public (they're in every Firebase web app)
- Security is enforced by Firestore rules, not API key secrecy
- Firebase Console restricts which domains can use the API key

However:
- Don't commit the updated `migrate.html` to Git
- After migration, you can revert it to placeholders
- Or add `scripts/migrate.html` to `.gitignore`

---

## 🆘 Still Having Issues?

### Error: "Invalid API Key"
- Double-check you copied the correct `apiKey` value
- Make sure there are no extra spaces or quotes
- Verify the key starts with "AIza"

### Error: "Project not found"
- Verify `projectId` matches your Firebase project
- Check Firebase Console to confirm project ID

### Error: "App not found"
- Verify `appId` is correct (format: `1:123:web:abc`)
- Make sure you're using a web app ID (not iOS/Android)

### Can't Find Firebase Config?
- Go to Firebase Console → Project Settings
- Under "Your apps" → Click your web app
- Or create a new web app if none exist
- Config will be displayed

---

**Need more help?** See `docs/GOOGLE_AUTHENTICATION_SETUP.md` for Firebase setup details.
