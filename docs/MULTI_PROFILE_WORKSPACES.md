# Multi-Profile Workspaces

## Overview

The Multi-Profile Workspaces feature allows traders to maintain separate, isolated trading environments within a single application. Each profile acts as an independent workspace with its own trades, statistics, and settings, enabling users to:

- **Separate Live vs Paper Trading**: Keep real money trades distinct from practice/paper trading
- **Track Multiple Strategies**: Test and compare different trading strategies independently
- **Manage Multiple Accounts**: Handle different brokers or account types separately
- **Organize by Asset Class or Timeframe**: Create dedicated workspaces for stocks, options, futures, day trading, swing trading, etc.

## Key Features

### 1. Complete Data Isolation
- Each profile maintains its own set of trades
- Statistics and analytics are calculated per-profile
- Switching profiles instantly changes the entire workspace context
- No mixing of data between profiles

### 2. Profile Types
- **Live Trading** 🔴: Real money trading accounts
- **Paper Trading** 📝: Practice/simulation accounts
- **Strategy** 🎯: Specific trading strategy testing
- **Custom** ⚙️: User-defined custom workspaces

### 3. Flexible Configuration
Each profile includes customizable settings:
- Default risk per trade
- Default position size
- Maximum open positions
- Broker information
- Account number
- Display preferences (show in dashboard, include in global stats)

### 4. Visual Distinction
- Custom icons and colors for each profile
- Clear visual indicators in the UI
- Active profile displayed in header
- Profile badges on relevant pages

## User Guide

### Creating a New Profile

1. Navigate to **Profiles** from the main menu (👤 icon)
2. Click the **"+ Create New Profile"** card
3. Fill in the profile details:
   - **Name**: Descriptive name (e.g., "Live - Interactive Brokers", "Paper Account", "Momentum Strategy")
   - **Type**: Select from Live, Paper, Strategy, or Custom
   - **Icon**: Choose an emoji to represent the profile (optional)
   - **Description**: Brief description of the profile's purpose (optional)
   - **Active Status**: Toggle whether the profile is active
   - **Display Settings**: Choose visibility in dashboard and statistics
4. (Optional) Expand **Advanced Settings** to configure:
   - Default risk per trade percentage
   - Default position size
   - Maximum open positions
   - Broker name
   - Account number
5. Click **"Create Profile"**

### Switching Between Profiles

#### Method 1: Header Dropdown (Desktop)
1. Click the profile selector in the header
2. Select the desired profile from the dropdown
3. All data instantly updates to show the selected profile's trades and statistics

#### Method 2: Profile Manager
1. Navigate to **Profiles** page
2. Click **"Switch"** on the desired profile card
3. The application will reload with the new profile context

### Editing Profiles

1. Go to **Profiles** page
2. Click **"Edit"** on the profile you want to modify
3. Update any fields as needed
4. Click **"Update Profile"**

### Deleting Profiles

1. Go to **Profiles** page
2. Click **"Delete"** on the profile you want to remove
3. Confirm the deletion in the popup dialog
4. **Note**: You cannot delete the last remaining profile

### Profile-Specific Trading

Once a profile is active:
- All new trades automatically tagged with the active profile ID
- Trade history shows only trades from the active profile
- Dashboard statistics reflect only the active profile's data
- Analytics and reports are profile-specific

## Technical Architecture

### Data Model

```typescript
interface Profile {
  id?: string
  name: string
  type: 'live' | 'paper' | 'strategy' | 'custom'
  description?: string
  settings: ProfileSettings
  isActive: boolean
  color?: string
  icon?: string
  createdAt: string
  updatedAt: string
}

interface ProfileSettings {
  defaultRiskPerTrade?: number
  defaultPositionSize?: number
  maxOpenPositions?: number
  strategyName?: string
  strategyVersion?: string
  broker?: string
  accountNumber?: string
  showInDashboard?: boolean
  includeInGlobalStats?: boolean
}
```

### Storage

**Firestore Collections:**
- `profiles`: Stores all profile documents
- `trades`: Each trade document includes a `profileId` field linking to its profile

**LocalStorage:**
- `activeProfileId`: Stores the currently active profile ID for persistence across sessions

### Components

1. **ProfileSelector.vue**: Compact dropdown in header for quick profile switching
2. **ProfileManager.vue**: Full-featured CRUD interface for managing profiles
3. **useProfiles.ts**: Composable providing reactive profile state and management functions

### Services

**profileService.ts**: Firebase operations
- `createProfile()`: Create new profile
- `updateProfile()`: Update profile details
- `deleteProfile()`: Remove profile
- `getAllProfiles()`: Fetch all profiles
- `getActiveProfile()`: Get current active profile
- `setActiveProfile()`: Switch active profile

**tradeService.ts**: Enhanced with profile filtering
- Automatically tags new trades with active `profileId`
- Filters all trade queries by active profile
- Client-side filtering fallback for compatibility

### State Management

The profile system uses Vue 3 Composition API with centralized reactive state:

```typescript
// Global reactive state
const profiles = ref<Profile[]>([])
const activeProfileId = ref<string | null>(null)
const activeProfile = computed(() =>
  profiles.value.find(p => p.id === activeProfileId.value)
)
```

Profile changes emit a global event (`profile-changed`) that components can listen to for automatic data refresh.

## Best Practices

### Organization Strategies

1. **Live vs Paper Split**
   - Create separate profiles for real and paper trading
   - Use consistent naming: "Live - [Broker]" and "Paper - [Purpose]"
   - Keep paper trading profiles inactive when not in use

2. **Strategy Isolation**
   - One profile per trading strategy being tested
   - Include strategy version in advanced settings
   - Document strategy rules in the profile description

3. **Account Segregation**
   - Separate profiles for different brokers or account types
   - Store account numbers in advanced settings
   - Use broker-specific icons for quick identification

4. **Timeframe-Based**
   - Day trading vs swing trading profiles
   - Different risk parameters per timeframe
   - Track performance independently

### Data Management

- **Regular Backups**: Export your Firebase data regularly
- **Profile Naming**: Use clear, descriptive names with context
- **Archive Old Profiles**: Mark completed strategy tests as inactive rather than deleting
- **Global Stats**: Be selective about which profiles contribute to global statistics

### Performance Tips

- Keep the number of active profiles reasonable (< 10)
- Inactive profiles don't impact query performance
- Profile switching reloads data automatically—no manual refresh needed
- LocalStorage ensures your active profile persists across sessions

## Troubleshooting

### Profile Selector Not Showing
- Check that you're on a desktop viewport (hidden on mobile)
- Ensure profiles have been created
- Verify ProfileSelector component is mounted in App.vue

### Trades Not Filtering by Profile
- Confirm active profile is set (check header dropdown)
- Verify `profileId` exists on trade documents in Firestore
- Check browser console for any profile service errors
- Try switching profiles and back to force refresh

### Cannot Delete Last Profile
- By design, at least one profile must exist
- Create a new profile before deleting the current one
- Or edit the existing profile to repurpose it

### Profile Data Not Persisting
- Check Firebase connection and permissions
- Verify Firestore security rules allow profile read/write
- Check browser LocalStorage is enabled
- Clear cache and reload if profile state seems stale

## Migration Guide

### For Existing Users

If you have trades created before the multi-profile system:

1. **Automatic Default Profile**
   - A "Default Profile" is created automatically on first load
   - All existing trades without `profileId` are shown in this profile

2. **Migrating Trades** (Optional)
   - Create new profiles for organizing your existing trades
   - (Future feature) Use bulk edit to assign trades to profiles
   - Currently, trades must be manually edited to change their profile

3. **No Data Loss**
   - All existing trades remain intact
   - Trades without `profileId` are accessible when no profile is selected (admin view)
   - Can be assigned to profiles as needed

### Adding to Existing Projects

1. Copy `src/types/profile.ts`
2. Copy `src/firebase/profileService.ts`
3. Copy `src/composables/useProfiles.ts`
4. Copy `src/components/ProfileSelector.vue` and `ProfileManager.vue`
5. Update `src/types/index.ts` to add `profileId?: string` to Trade interface
6. Update `src/firebase/tradeService.ts` with profile filtering logic
7. Add profile routes to `src/router/index.js`
8. Import and integrate `ProfileSelector` in `App.vue`

## Future Enhancements

Planned improvements for the profile system:

- **Profile Analytics**: Compare performance across profiles
- **Bulk Trade Assignment**: Move multiple trades between profiles
- **Profile Export/Import**: Share or backup individual profiles
- **Profile Templates**: Preconfigured profiles for common use cases
- **Profile Tags**: Additional categorization beyond types
- **Profile Permissions**: Read-only or shared profiles for teams
- **Cross-Profile Reports**: Combined analytics across selected profiles
- **Profile Archiving**: Soft delete with restore capability

## Support

For issues, questions, or feature requests:
- Check existing documentation in `/docs`
- Review Firebase setup guides
- Open an issue in the project repository
- Contact the development team

---

**Version**: 1.0.0
**Last Updated**: 2025-10-19
**Author**: Trade Journal Development Team
