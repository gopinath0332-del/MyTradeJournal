# Phase 5: Migration Process Flowchart

```
┌─────────────────────────────────────────────────────────────┐
│                    START: Phase 5 Migration                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│          Do you have existing Firestore data?               │
│              (trades/profiles before auth)                  │
└─────────────────────────────────────────────────────────────┘
                    ↓ YES              ↓ NO
                    ↓                  ↓
                    ↓           ┌──────────────┐
                    ↓           │ SKIP Phase 5 │
                    ↓           │ Go to Phase 6│
                    ↓           └──────────────┘
                    ↓
┌─────────────────────────────────────────────────────────────┐
│               Do documents have userId field?               │
│         Check Firebase Console → Firestore → Data           │
└─────────────────────────────────────────────────────────────┘
                    ↓ YES              ↓ NO
                    ↓                  ↓
           ┌──────────────┐            ↓
           │ SKIP Phase 5 │            ↓
           │ Go to Phase 6│            ↓
           └──────────────┘            ↓
                                       ↓
┌─────────────────────────────────────────────────────────────┐
│                STEP 1: Backup Your Data                     │
│  • Firebase Console → Firestore → Export                   │
│  • Or copy key documents manually                          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         STEP 2: Temporarily Relax Security Rules            │
│  • Firebase Console → Firestore → Rules                    │
│  • Save current rules to file                              │
│  • Apply temporary rules (allow all authenticated)         │
│  • Click Publish                                           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│            STEP 3: Choose Your Migration Tool               │
└─────────────────────────────────────────────────────────────┘
                            ↓
              ┌─────────────┴─────────────┐
              ↓                           ↓
┌─────────────────────────┐   ┌─────────────────────────┐
│  OPTION A: Browser Tool │   │ OPTION B: Node.js Script│
│  (Recommended)          │   │ (Command Line)          │
└─────────────────────────┘   └─────────────────────────┘
              ↓                           ↓
              │                           │
┌─────────────────────────┐   ┌─────────────────────────┐
│ Edit migrate.html       │   │ npm install dotenv      │
│ Add Firebase config     │   │                         │
└─────────────────────────┘   └─────────────────────────┘
              ↓                           ↓
┌─────────────────────────┐   ┌─────────────────────────┐
│ npx http-server -p 8080 │   │ node scripts/           │
│                         │   │   migrateUserIds.js     │
└─────────────────────────┘   └─────────────────────────┘
              ↓                           ↓
┌─────────────────────────┐   ┌─────────────────────────┐
│ Open in browser:        │   │ Follow interactive      │
│ localhost:8080/scripts/ │   │ prompts in terminal     │
│   migrate.html          │   │                         │
└─────────────────────────┘   └─────────────────────────┘
              ↓                           ↓
┌─────────────────────────┐   ┌─────────────────────────┐
│ Click "Sign In"         │   │ Sign in when prompted   │
│ Google popup appears    │   │ Google popup appears    │
└─────────────────────────┘   └─────────────────────────┘
              ↓                           ↓
┌─────────────────────────┐   ┌─────────────────────────┐
│ Verify your User ID     │   │ Confirm User ID         │
│ displayed on page       │   │ in terminal             │
└─────────────────────────┘   └─────────────────────────┘
              ↓                           ↓
┌─────────────────────────┐   ┌─────────────────────────┐
│ Click "Start Migration" │   │ Type 'yes' to proceed   │
└─────────────────────────┘   └─────────────────────────┘
              ↓                           ↓
              └─────────────┬─────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              MIGRATION RUNNING...                           │
│  ✅ Updated: trade-001                                      │
│  ✅ Updated: trade-002                                      │
│  ⏭️  Skipped: trade-003 (has userId)                        │
│  ...                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Migration Complete! Summary:                   │
│  • Trades: 50 total, 45 updated, 5 skipped                 │
│  • Profiles: 4 total, 4 updated, 0 skipped                 │
│  • Lessons: 0 total (collection doesn't exist)             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│        STEP 4: Verify in Firebase Console                  │
│  • Open Firebase Console → Firestore → Data                │
│  • Click on a trade document                               │
│  • Verify userId field exists with your ID                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│         STEP 5: Restore Strict Security Rules               │
│  • Firebase Console → Firestore → Rules                    │
│  • Copy from firestore.rules file                          │
│  • Click Publish                                           │
│  ⚠️ CRITICAL - Don't skip this step!                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              STEP 6: Test Your App                          │
│  • npm run dev                                             │
│  • Sign in with Google                                     │
│  • Verify data loads (Dashboard, Trade History)           │
│  • Create a new trade (should work)                        │
│  • Check for any permission errors                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              Test Data Isolation (Optional)                 │
│  • Sign out                                                │
│  • Sign in with different Google account                   │
│  • Verify you DON'T see previous user's data              │
│  • Can create separate data for this user                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│                  STEP 7: Clean Up                           │
│  • Delete migration scripts (optional):                    │
│    rm scripts/migrateUserIds.js                            │
│    rm scripts/migrate.html                                 │
│  • Or keep for reference                                   │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│              ✅ PHASE 5 COMPLETE!                           │
│         Mark complete in GoogleAuthTodo.md                  │
│           Move to Phase 6: Testing & Validation             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Quick Decision Tree

```
Need Migration?
    ├─ New project, no data? → NO, skip to Phase 6
    ├─ All data created after auth? → NO, skip to Phase 6
    └─ Data created before auth? → YES, continue

Which Tool to Use?
    ├─ Prefer visual interface? → Browser Tool (migrate.html)
    ├─ Comfortable with CLI? → Node.js Script
    └─ Not sure? → Browser Tool (easier)

After Migration?
    ├─ Data loads correctly? → ✅ Success!
    ├─ Permission errors? → Check rules restored
    └─ Missing data? → Check userId field in console
```

## ⏱️ Time Estimates

| Dataset Size | Browser Tool | Node.js Script |
|--------------|-------------|----------------|
| < 100 docs   | 5-10 min    | 5-10 min       |
| 100-500 docs | 10-15 min   | 10-15 min      |
| 500+ docs    | 15-30 min   | 15-30 min      |

*Times include setup, migration, and verification*

## 🎨 Visual Guide

### Browser Tool Interface

```
┌───────────────────────────────────────────────┐
│  🔄 Firestore Data Migration                  │
│  Add userId field to existing documents       │
├───────────────────────────────────────────────┤
│                                               │
│  ⚠️ Prerequisites - READ CAREFULLY            │
│  • Backup your data before running            │
│  • Temporarily relax Firestore rules          │
│  • Sign in with Google                        │
│  • Close all other tabs with app open        │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│  Signed in as: John Doe                       │
│  Email: john@example.com                      │
│  User ID: abc123xyz789                        │
│                                               │
├───────────────────────────────────────────────┤
│                                               │
│  [        🚀 Start Migration        ]         │
│                                               │
├───────────────────────────────────────────────┤
│  📊 Migration Status                          │
│  ────────────────────────────────────         │
│  ✅ Updated: trade-001                        │
│  ✅ Updated: trade-002                        │
│  ⏭️  Skipped: trade-003 (has userId)          │
│                                               │
│  Summary                                      │
│  ┌─────────┐  ┌─────────┐                    │
│  │   50    │  │   45    │                    │
│  │ Trades  │  │ Updated │                    │
│  └─────────┘  └─────────┘                    │
└───────────────────────────────────────────────┘
```

### Terminal Output

```
$ node scripts/migrateUserIds.js

╔═══════════════════════════════════════╗
║   USER ID MIGRATION SCRIPT            ║
╚═══════════════════════════════════════╝

⚠️ IMPORTANT PREREQUISITES:
1. Backed up Firestore data
2. Relaxed security rules
3. Ready to sign in

Proceed? (yes/no): yes

🔐 Opening Google Sign-In...
✅ Signed in as: John Doe
📋 User ID: abc123xyz789

📦 Processing: trades
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Found 50 documents
✅ Updated: trade-001
✅ Updated: trade-002
⏭️  Skipped: trade-003

✨ Migration completed!

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SUMMARY
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
TRADES:
  Total: 50
  Updated: 45 ✅
  Skipped: 5 ⏭️
  Errors: 0 ❌

📝 Next Steps:
1. Verify in Firebase Console
2. Test your app
3. Restore strict rules
```

## 📚 Documentation Map

```
Phase 5 Documentation
│
├─ 📖 PHASE5_MIGRATION_GUIDE.md (this file)
│   └─ Comprehensive guide with all details
│
├─ 📄 PHASE5_QUICK_REF.md
│   └─ One-page quick reference
│
├─ 📄 Phase5-Complete.md
│   └─ Implementation summary
│
├─ 📁 scripts/
│   ├─ migrate.html (Browser Tool)
│   ├─ migrateUserIds.js (Node.js Script)
│   └─ README.md (Scripts documentation)
│
└─ 📄 GoogleAuthTodo.md
    └─ Phase 5 checklist items
```

---

**Need Help?**
- 📖 Full Guide: `docs/PHASE5_MIGRATION_GUIDE.md`
- 🚀 Quick Start: `docs/PHASE5_QUICK_REF.md`
- 💬 Issues? Check troubleshooting section in guides
