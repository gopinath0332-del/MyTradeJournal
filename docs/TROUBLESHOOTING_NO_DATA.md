# Troubleshooting: No Data Displayed in TradeHistory

## 🔍 Problem: No trades are showing in TradeHistory.vue

After implementing userId filtering for security, **all database queries now require authentication**. If you're not seeing any data, here are the most common causes:

---

## ✅ Solution 1: Sign In with Google (MOST COMMON)

### The Issue
After the recent userId filtering implementation, you MUST be signed in to view any trades.

### How to Fix
1. **Look at the top-right corner** of your app
2. **Click "Sign in with Google"** button
3. Select your Google account
4. Once signed in, your trades should load automatically

### How to Verify
- You should see your Google profile picture/name in the top-right corner
- If you see "Sign in with Google" button, you're NOT signed in

---

## ✅ Solution 2: Update Firestore Security Rules

### The Issue
Your Firestore database rules in Firebase Console are blocking access.

### How to Fix

#### Quick Check: Are rules the problem?
Open your browser's Developer Console (F12) and look for this error:
```
FirebaseError: Missing or insufficient permissions
```

If you see this, you need to update Firestore rules.

#### Steps to Update Rules

1. **Go to Firebase Console**
   - https://console.firebase.google.com/
   - Open project: `tradingjournal-5d147`

2. **Navigate to Rules**
   - Click "Firestore Database" (left sidebar)
   - Click "Rules" tab (at the top)

3. **Paste Development Rules**

   Delete everything and paste this:

   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       // Development rules - allow authenticated users
       match /{document=**} {
         allow read, write: if request.auth != null;
       }
     }
   }
   ```

4. **Click "Publish"**

5. **Refresh your app** and try again

📖 **See also:** `docs/FIX_FIRESTORE_PERMISSIONS_NOW.md` for detailed instructions

---

## ✅ Solution 3: Check if You Have Any Trades

### The Issue
Maybe you just don't have any trades in the database yet!

### How to Check
1. Sign in with Google (if not already)
2. Go to Firebase Console → Firestore Database → Data tab
3. Look for the `trades` collection
4. Check if there are any documents inside

### If No Trades Exist
1. Click the "+" tab in your app to go to Trade Form
2. Create a test trade
3. Go back to Trade History
4. Your trade should now appear

---

## ✅ Solution 4: Check Active Profile

### The Issue
Trades are filtered by the currently active profile. You might be viewing the wrong profile.

### How to Fix
1. Look for the profile selector in your app (usually at the top)
2. Try switching to different profiles:
   - 🔴 Default Profile (Live)
   - 📝 Paper Trading
   - 🎯 Strategy Testing
   - ⚙️ Custom profiles
3. Trades are isolated per profile

---

## 🔧 Advanced Debugging

### Check Browser Console (F12)

Look for these errors:

#### 1. Authentication Error
```
Error: User must be authenticated to access trades
```
**Solution:** Sign in with Google

#### 2. Permission Error
```
FirebaseError: Missing or insufficient permissions
```
**Solution:** Update Firestore rules (see Solution 2)

#### 3. Network Error
```
Failed to fetch
```
**Solution:** Check internet connection and Firebase project status

### Check Application Logs

The app logs detailed information to the console. Look for:
- `[tradeService] Attempting to get all trades`
- `[tradeService] Successfully retrieved X trades`
- `[authService] User signed in: your@email.com`

### Verify Firebase Configuration

Check that your `.env` file has correct Firebase config:
```
VITE_FIREBASE_API_KEY=AIzaSyDE4Gf_sQrWxsdG-1jXAbW7DeaaPd3HCdg
VITE_FIREBASE_AUTH_DOMAIN=tradingjournal-5d147.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tradingjournal-5d147
```

---

## 📋 Quick Checklist

Before asking for help, verify:

- [ ] I am signed in with Google (see profile picture in top-right)
- [ ] Firestore rules are updated in Firebase Console
- [ ] I have at least one trade in the database
- [ ] I checked the browser console (F12) for errors
- [ ] My internet connection is working
- [ ] I'm looking at the correct profile

---

## 🎯 Most Likely Solution

**99% of the time, the issue is one of these two:**

1. ✅ **Sign in with Google** (look for button in top-right corner)
2. ✅ **Update Firestore rules** in Firebase Console (see Solution 2 above)

After doing both of these, refresh your page and your trades should load!

---

## 📞 Still Having Issues?

If you've tried all of the above and still see no data:

1. Open browser console (F12)
2. Copy the error message
3. Check the following docs:
   - `docs/FIX_FIRESTORE_PERMISSIONS_NOW.md` - Permission errors
   - `docs/USERID_FILTER_IMPLEMENTATION.md` - How userId filtering works
   - `docs/GoogleAuthTodo.md` - Authentication setup

4. Verify your Firebase project setup:
   - Authentication → Sign-in method → Google provider is enabled
   - Firestore Database → Rules are published
   - Firestore Database → Data → trades collection exists
