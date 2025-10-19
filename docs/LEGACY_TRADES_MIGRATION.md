# Legacy Trades Migration Guide

## Overview

This document explains how the application handles trades created before the multi-profile system was implemented.

## Problem

When the multi-profile workspace feature was added, existing trades in the database did not have a `profileId` field. This caused them to be filtered out and not appear in any profile view.

## Solution

The trade service has been enhanced to automatically associate legacy trades (those without a `profileId`) with the **Default Profile** (Live profile).

## How It Works

### 1. Default Profile Identification

The system identifies the "Default Profile" by:
- Looking for a profile named "Default Profile"
- With type set to 'live'
- This profile is automatically created on first run if no profiles exist

### 2. Trade Filtering Logic

When filtering trades by profile, the system now:

```typescript
// For trades WITH profileId
if (trade.profileId) {
  return trade.profileId === currentProfileId
}

// For trades WITHOUT profileId (legacy trades)
// They belong to the Default Profile
return currentProfileId === defaultProfileId
```

### 3. New Trade Creation

When creating new trades:
- If an active profile is selected → trade gets that `profileId`
- If no profile is selected → trade gets the Default Profile's `profileId`

This ensures all new trades have a profile assignment.

## Benefits

✅ **Backward Compatible**: Existing trades without `profileId` remain accessible
✅ **Automatic Migration**: No manual data migration needed
✅ **Seamless Experience**: Users see all their historical trades in the Default Profile
✅ **Future-Proof**: New trades always have proper profile assignment

## What Users See

### Default Profile (Live)
- ✅ All new trades created in this profile
- ✅ All legacy trades (created before multi-profile feature)
- ✅ Trades explicitly created with this profile selected

### Other Profiles (Paper, Strategy, Custom)
- ✅ Only trades explicitly created with those profiles selected
- ❌ Legacy trades do NOT appear here (they belong to Default Profile)

## Technical Implementation

### Files Modified

1. **`src/firebase/tradeService.ts`**
   - Added `_getDefaultProfileId()` method with caching
   - Made `_filterByProfile()` async to handle profile lookups
   - Updated `addTrade()` to assign Default Profile if no active profile
   - Added `await` to all `_filterByProfile()` calls

### Key Methods

```typescript
// Get default profile ID (cached for performance)
async _getDefaultProfileId(): Promise<string | null>

// Filter trades considering legacy trades
async _filterByProfile(trades: Trade[]): Promise<Trade[]>

// Create trade with proper profile assignment
async addTrade(trade: Omit<Trade, 'id' | 'createdAt' | 'updatedAt'>)
```

## Migration Path (Optional)

If you want to explicitly add `profileId` to all legacy trades:

1. Get the Default Profile ID from the profiles collection
2. Query all trades where `profileId` is `null` or `undefined`
3. Update each trade with `profileId: <default-profile-id>`

**Note**: This is optional - the system works perfectly without explicit migration!

## Testing

To verify the feature works:

1. Create some test trades without selecting any profile
2. Switch to different profiles
3. Legacy trades should always appear in "Default Profile (Live)"
4. New trades in other profiles should NOT see legacy trades

## Performance

- **Default Profile ID Caching**: First lookup cached in memory
- **Async Filtering**: Minimal performance impact (only on initial load)
- **No Database Queries**: Uses client-side filtering after fetching trades

---

**Last Updated**: October 19, 2025
**Feature Version**: Multi-Profile Workspaces v1.1
