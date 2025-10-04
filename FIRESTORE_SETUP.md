# Firestore Rules for MyTradeJournal

To fix the 400 error, you need to update your Firestore security rules. Here are the correct rules for testing:

## For Development/Testing (Open Access)

Go to Firebase Console → Firestore Database → Rules and paste this:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read and write access to all documents for testing
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

## For Production (Recommended Secure Rules)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Trades collection - allow all operations for now
    match /trades/{tradeId} {
      allow read, write: if true;
    }

    // Test connection collection
    match /test-connection/{docId} {
      allow read, write: if true;
    }

    // Deny all other collections
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## Steps to Fix:

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select your project: `tradingjournal-5d147`
3. Go to "Firestore Database" in the left sidebar
4. Click on the "Rules" tab
5. Replace the existing rules with the development rules above
6. Click "Publish"

## Common Error Causes:

- **PERMISSION_DENIED**: Your rules are too restrictive
- **NOT_FOUND**: Collection or database doesn't exist
- **INVALID_ARGUMENT**: Query parameters are malformed
- **UNAUTHENTICATED**: Trying to access with no auth when rules require it

## How to Create the Database:

If you haven't created the Firestore database yet:

1. Go to Firebase Console → Firestore Database
2. Click "Create database"
3. Choose "Start in test mode" (this sets permissive rules)
4. Select a location (choose closest to your users)
5. Click "Done"

The database will be created and you can then adjust the rules as needed.
