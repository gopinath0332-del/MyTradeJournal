# Profile Data Migration Guide

## Overview

This guide explains how to migrate trades between profiles in your Trade Journal. Specifically, it helps you move data that doesn't belong to **Swing** or **Paper** profiles to the **F&O** profile.

## When to Use This Tool

Use the Profile Migration Tool when:
- You want to consolidate trades from multiple profiles into F&O
- You need to keep Swing and Paper profiles unchanged
- You're reorganizing your trading data by profile type

## Prerequisites

Before running the migration:

1. ✅ **Create the F&O Profile** (if it doesn't exist)
   - Go to Profile Management
   - Create a new profile named "F&O"
   - Type can be "live" or "custom"

2. ✅ **Backup Your Data** (recommended)
   - Export your current trades
   - Or take note of important trade counts

## How to Use

### Step 1: Access the Migration Tool

Navigate to the Profile Migration Tool:
- From Profile Management page, click "🔄 Migrate Data Between Profiles"
- Or directly visit: `/profile-migration`

### Step 2: Preview Migration

1. Click "🔍 Preview Migration" button
2. Review the migration summary:
   - **Total Trades**: All trades in your account
   - **Swing Trades (Keep)**: Trades that will remain in Swing profile
   - **Paper Trades (Keep)**: Trades that will remain in Paper profile
   - **Trades to Migrate to F&O**: Trades that will be moved to F&O profile

### Step 3: Execute Migration

1. If the preview looks correct, click "✅ Start Migration"
2. Confirm the migration in the dialog box
3. Wait for the migration to complete (usually takes a few seconds)

### Step 4: Verify Results

After migration completes:
1. Check the migration summary for:
   - Number of trades successfully migrated
   - Any errors that occurred
2. Switch to F&O profile and verify your trades appear correctly
3. Check Swing and Paper profiles to ensure they're unchanged

## What Gets Migrated

### Trades That Stay in Original Profiles:
- ✅ Trades in **Swing** profile → Stay in Swing
- ✅ Trades in **Paper** profile → Stay in Paper

### Trades That Get Migrated to F&O:
- 🔄 Trades in **Default Profile (Live)**
- 🔄 Trades in any **other custom profiles**
- 🔄 Legacy trades without a profileId

## Safety Features

1. **Preview Before Migrate**: Always see what will be changed before executing
2. **Confirmation Dialog**: Requires explicit confirmation before migrating
3. **Error Handling**: Shows detailed error messages if something fails
4. **Reversible**: Changes can be manually reversed if needed

## Technical Details

### What Changes in the Database

For each migrated trade:
- `profileId` field is updated to the F&O profile ID
- `updatedAt` timestamp is updated to current time
- All other trade data remains unchanged (symbol, P&L, dates, etc.)

### Profile Identification

Profiles are identified by name (case-insensitive):
- "Swing" → Keeps its trades
- "Paper" → Keeps its trades  
- "F&O" → Receives migrated trades

## Troubleshooting

### "F&O profile not found" Error

**Solution**: Create a profile named "F&O" first
1. Go to Profile Management
2. Click "Create New Profile"
3. Name: "F&O"
4. Type: Live or Custom
5. Save and try migration again

### "No migration needed" Message

This means all your trades are already in the correct profiles. No action needed!

### Migration Failed with Errors

1. Check the error messages in the results section
2. Verify you have internet connectivity
3. Ensure you're logged in
4. Try refreshing the page and running migration again
5. If errors persist, check browser console for technical details

## Example Scenarios

### Scenario 1: Clean Separation

**Before Migration:**
- Default Profile: 100 trades
- Swing Profile: 20 trades
- Paper Profile: 15 trades

**After Migration:**
- F&O Profile: 100 trades (migrated from Default)
- Swing Profile: 20 trades (unchanged)
- Paper Profile: 15 trades (unchanged)

### Scenario 2: Multiple Profiles

**Before Migration:**
- Default Profile: 50 trades
- Swing Profile: 30 trades
- Paper Profile: 10 trades
- Strategy X Profile: 25 trades

**After Migration:**
- F&O Profile: 75 trades (50 from Default + 25 from Strategy X)
- Swing Profile: 30 trades (unchanged)
- Paper Profile: 10 trades (unchanged)

## Best Practices

1. ✅ Always preview before migrating
2. ✅ Run migration when market is closed (to avoid data conflicts)
3. ✅ Verify results after migration
4. ✅ Keep Swing and Paper profiles for their specific purposes
5. ✅ Use F&O profile for all other live trading data

## Frequently Asked Questions

### Q: Can I undo the migration?
**A:** Yes, but manually. You would need to identify which trades were migrated and update their profileId back to the original profile.

### Q: Will this affect my trade statistics?
**A:** Yes, statistics are profile-specific. After migration, F&O profile will show statistics for all migrated trades.

### Q: Can I run the migration multiple times?
**A:** Yes, it's safe to run multiple times. Each run will only migrate trades that aren't already in Swing or Paper profiles.

### Q: What if I have multiple profiles named "Swing"?
**A:** The tool finds the first profile with name "Swing" (case-insensitive). Consider renaming duplicates before migration.

### Q: Will this delete any data?
**A:** No! The migration only **updates** the profileId field. No trades are deleted.

## Support

If you encounter issues not covered in this guide:
1. Check browser console for detailed error messages
2. Verify your internet connection and authentication
3. Try refreshing the page and running migration again

---

**Version**: 1.0.0  
**Last Updated**: December 16, 2025  
**Compatible With**: MyTradeJournal v2.0+
