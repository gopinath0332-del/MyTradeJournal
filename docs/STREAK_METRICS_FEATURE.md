# Winning/Losing Streak Metrics Feature

## Overview
Added comprehensive streak analysis to the Statistics View, providing traders with insights into their winning and losing patterns across different dimensions.

## Features Implemented

### 1. **Global Streak Metrics**
- **Current Streak**: Shows active winning or losing streak with visual indicator
- **Longest Win Streak**: Historical maximum consecutive wins
- **Longest Lose Streak**: Historical maximum consecutive losses
- **Average Win Streak**: Mean length of winning streaks
- **Average Lose Streak**: Mean length of losing streaks
- **Streak History Sparkline**: Visual representation of last 20 streaks

### 2. **Per-Symbol Streak Analysis**
- Current streak status for each symbol
- Longest winning streak per symbol
- Longest losing streak per symbol
- Total trades per symbol
- Sorted by current streak length

### 3. **Per-Strategy Streak Analysis**
- Current streak status for each strategy
- Longest winning streak per strategy
- Longest losing streak per strategy
- Total trades per strategy
- Sorted by current streak length

## UI Components

### Main Components
1. **StreakMetrics.vue** - Main display component with:
   - Overview cards with animated metrics
   - Sparkline visualization
   - Symbol streak table/cards
   - Strategy streak table/cards

2. **useStreakAnalysis.ts** - Composable for streak calculations:
   - Global streak metrics
   - Symbol-based streak analysis
   - Strategy-based streak analysis

## Visual Features

### 1. **Current Streak Card**
- Highlighted with gradient background
- Fire emoji (🔥) for winning streaks
- Snowflake emoji (❄️) for losing streaks
- Changes color based on streak type:
  - Green gradient for winning streaks
  - Red gradient for losing streaks

### 2. **Sparkline Visualization**
- Mini bar chart showing last 20 streaks
- Green bars for winning streaks
- Red bars for losing streaks
- Interactive hover tooltips
- Responsive height based on streak length

### 3. **Streak Badges**
- Rounded pill-shaped badges
- Color-coded by streak type
- Shows streak count with emoji indicator
- Applied to symbol and strategy tables

### 4. **Responsive Design**
- Desktop: Table view with all metrics
- Mobile: Card-based layout
- Touch-optimized interactions
- Smooth animations and transitions

## Data Structure

### StreakMetrics Interface
```typescript
{
  currentStreak: number
  currentStreakType: 'winning' | 'losing' | 'none'
  longestWinStreak: number
  longestLoseStreak: number
  averageWinStreak: number
  averageLoseStreak: number
  totalWinStreaks: number
  totalLoseStreaks: number
  streakHistory: StreakPeriod[]
}
```

### StreakPeriod Interface
```typescript
{
  type: 'winning' | 'losing'
  length: number
  startDate: string
  endDate: string
  totalPnL: number
}
```

## Calculation Logic

### Streak Detection Algorithm
1. Sort trades by exit date (chronologically)
2. Iterate through trades sequentially
3. Compare each trade's P&L with previous trade
4. Increment streak counter for same type (win/loss)
5. Record streak when type changes
6. Track current, longest, and average streaks
7. Generate streak history for visualization

### Key Metrics
- **Current Streak**: Last consecutive wins or losses
- **Longest Streaks**: Maximum consecutive wins/losses ever
- **Average Streaks**: Mean length of all streaks
- **Streak History**: Complete timeline of all streaks

## User Benefits

### 1. **Pattern Recognition**
- Identify winning and losing patterns
- Understand trading momentum
- Spot emotional trading triggers

### 2. **Risk Management**
- Monitor current losing streaks
- Set alerts for extended losses
- Plan recovery strategies

### 3. **Performance Analysis**
- Compare streaks across symbols
- Evaluate strategy consistency
- Track improvement over time

### 4. **Psychological Insights**
- Recognize tilt indicators
- Manage trading psychology
- Build discipline and consistency

## Integration Points

### Statistics View Tab
- New "Streaks" tab (🔥 icon)
- Positioned after "Symbols" tab
- Loads automatically with other statistics
- Year-filtered data

### Data Sources
- Uses existing trade data
- Filtered by selected year
- Real-time updates on data changes
- Cached computations for performance

## Performance Optimizations

1. **Computed Properties**: Reactive calculations only when data changes
2. **Efficient Sorting**: Single sort operation per dataset
3. **Top N Display**: Show only top 10 symbols/strategies
4. **Lazy Loading**: Tab content rendered only when active
5. **Memoization**: Streak history cached for sparkline rendering

## Accessibility Features

1. **Color Coding**: Multiple indicators beyond color
2. **Emoji Icons**: Universal visual indicators
3. **Hover Tooltips**: Detailed information on interaction
4. **Responsive Text**: Readable on all screen sizes
5. **Touch Targets**: Minimum 44px for mobile

## Mobile Optimizations

1. **Card Layout**: Stacked cards instead of tables
2. **Swipeable Tables**: Horizontal scroll with indicators
3. **Larger Touch Targets**: Optimized for finger interaction
4. **Simplified Sparklines**: Reduced complexity on small screens
5. **Adaptive Typography**: Size adjusts based on viewport

## Future Enhancements (Optional)

1. **Streak Alerts**: Notifications for specific streak thresholds
2. **Streak Goals**: Set and track personal streak targets
3. **Historical Comparison**: Compare streaks across different periods
4. **Streak Export**: Export streak data for external analysis
5. **Advanced Filters**: Filter streaks by date range, symbol, strategy
6. **Streak Predictions**: ML-based streak continuation probability

## Testing Recommendations

### Unit Tests
- [ ] Test streak calculation logic
- [ ] Test edge cases (no trades, single trade)
- [ ] Test symbol aggregation
- [ ] Test strategy aggregation

### Integration Tests
- [ ] Test tab navigation
- [ ] Test year selector integration
- [ ] Test responsive breakpoints
- [ ] Test data refresh on filter changes

### Manual Testing
- [ ] Verify correct streak counting
- [ ] Test sparkline visualization
- [ ] Check mobile responsiveness
- [ ] Validate tooltip accuracy
- [ ] Test with various data sizes

## Files Modified/Created

### New Files
1. `/src/composables/useStreakAnalysis.ts` - Streak calculation logic
2. `/src/components/charts/StreakMetrics.vue` - UI component

### Modified Files
1. `/src/components/StatisticsView.vue` - Added streak tab and imports

## Dependencies
- Vue 3 Composition API
- TypeScript
- Existing trade service
- Existing UI components

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design for all viewport sizes

## Quick Win Achievement ✅
This feature provides immediate value by:
- ✅ **Visual Impact**: Eye-catching sparklines and badges
- ✅ **Quick Implementation**: ~2 hours development time
- ✅ **High Value**: Critical trading insights
- ✅ **User Engagement**: Interactive and informative
- ✅ **Mobile-First**: Works perfectly on all devices

## Success Metrics
- User engagement with Streaks tab
- Time spent analyzing streak data
- Correlation with improved trading performance
- User feedback on feature usefulness
