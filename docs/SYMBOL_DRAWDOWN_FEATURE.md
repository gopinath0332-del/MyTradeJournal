# Symbol Drawdown Deep Dive Feature

## Overview
The Symbol Drawdown Deep Dive provides detailed per-symbol equity curve analysis with visual drawdown identification, recovery metrics, and time-in-drawdown tracking. This feature helps traders understand how each symbol behaves during losing periods and how efficiently they recover.

## Components

### 1. Composable: `useSymbolDrawdown.ts`
Location: `/src/composables/useSymbolDrawdown.ts`

#### Purpose
Calculates comprehensive drawdown metrics for each traded symbol, including:
- Equity curve construction from trades
- Drawdown period identification and tracking
- Time-in-drawdown calculations
- Recovery efficiency scoring

#### Interfaces

```typescript
interface SymbolDrawdownMetrics {
  symbol: string
  totalTrades: number
  currentEquity: number
  peakEquity: number
  currentDrawdown: number
  currentDrawdownPercent: number
  maxDrawdown: number
  maxDrawdownPercent: number
  timeInDrawdown: number
  timeInDrawdownRatio: number
  recoveryEfficiency: number
  equityHistory: EquityPoint[]
  drawdownPeriods: DrawdownPeriod[]
  avgRecoveryTime: number
  isInDrawdown: boolean
}

interface EquityPoint {
  date: string
  equity: number
  peak: number
  drawdown: number
  drawdownPercent: number
}

interface DrawdownPeriod {
  startDate: string
  endDate: string | null
  startEquity: number
  lowestEquity: number
  recoveredEquity: number | null
  maxDrawdown: number
  maxDrawdownPercent: number
  daysInDrawdown: number
  daysToRecover: number | null
  recovered: boolean
}
```

#### Key Calculations

**Equity Curve Construction**
- Chronologically processes trades for each symbol
- Accumulates P&L to build running equity
- Tracks peak equity at each point
- Calculates drawdown from peak

**Drawdown Period Detection**
- Uses state machine pattern to track drawdown states
- Identifies entry into drawdown (equity drops below peak)
- Tracks maximum drawdown depth during the period
- Detects recovery (equity returns to previous peak)
- Handles ongoing drawdowns (not yet recovered)

**Time in Drawdown**
- Counts days where drawdown > 0
- Calculates ratio: days in drawdown / total days
- Provides percentage of time spent recovering from losses

**Recovery Efficiency Score**
- Scale: 0-100 (higher is better)
- Based on average time to recover from drawdowns
- Normalized by total trading period
- Formula: `100 - (avgRecoveryTime / totalDays * 100)`
- Only considers completed recovery periods

### 2. Component: `SymbolDrawdownDeepDive.vue`
Location: `/src/components/charts/SymbolDrawdownDeepDive.vue`

#### Visual Elements

**Overview Cards (Top Row)**
1. **Symbols in Drawdown** - Count of symbols currently below peak equity
2. **Avg Recovery Efficiency** - Mean recovery score across all symbols
3. **Avg Time in Drawdown** - Mean percentage of time in drawdown

**Equity Sparklines**
- Mini SVG charts showing equity curve for each symbol
- Blue line: Symbol in profit or recovered
- Red line: Symbol currently in drawdown
- Red shaded areas: Periods of drawdown (equity below peak)
- Visual identification of drawdown frequency and duration

**Desktop Table View**
Columns:
- Symbol name with "DD" badge if in drawdown
- Equity curve sparkline with shaded drawdowns
- Current drawdown ($ and %)
- Maximum drawdown ($ and %)
- Time in drawdown (% and days)
- Recovery efficiency score (0-100)
- Average recovery time (days)

**Mobile Card View**
Each card displays:
- Symbol name and recovery score
- Full-width equity sparkline
- Grid of key metrics (current DD, max DD, time in DD, avg recovery)

#### Color Coding

**Drawdown Severity**
- Green: 0% (at peak)
- Yellow: 0-5%
- Orange: 5-10%
- Red: >10%

**Recovery Efficiency**
- Green: 80-100 (excellent recovery)
- Yellow: 60-79 (good recovery)
- Orange: 40-59 (moderate recovery)
- Red: 0-39 (slow recovery)

## Integration

The feature is integrated into `StatisticsView.vue` under the "Symbols" tab:

```vue
<!-- Symbol Drawdown Deep Dive -->
<section class="stats-section">
  <h3>Symbol Drawdown Deep Dive</h3>
  <SymbolDrawdownDeepDive :metrics="symbolDrawdownMetrics" />
</section>
```

## User Benefits

1. **Visual Drawdown Identification**
   - Quickly see which symbols spend more time in drawdown
   - Identify symbols with frequent small drawdowns vs rare large ones

2. **Recovery Analysis**
   - Understand which symbols recover quickly from losses
   - Identify symbols that may need strategy adjustments

3. **Risk Assessment**
   - Evaluate maximum drawdown risk per symbol
   - Compare current drawdown to historical maximum

4. **Performance Optimization**
   - Focus on symbols with high recovery efficiency
   - Consider reducing exposure to symbols with poor recovery

5. **Time Management**
   - See which symbols trap capital in drawdown periods
   - Optimize position sizing based on time-in-drawdown ratios

## Calculation Examples

### Example 1: Quick Recovery
```
Symbol: AAPL
Trades: 10
Peak Equity: $1,000
Current Equity: $950
Max Drawdown: $100 (10%)
Time in Drawdown: 5 days / 30 days = 16.7%
Avg Recovery Time: 3 days
Recovery Efficiency: 90 (excellent)
```

### Example 2: Prolonged Drawdown
```
Symbol: TSLA
Trades: 10
Peak Equity: $1,000
Current Equity: $850 (still in DD)
Max Drawdown: $200 (20%)
Time in Drawdown: 20 days / 30 days = 66.7%
Avg Recovery Time: 12 days
Recovery Efficiency: 60 (moderate)
```

## Technical Implementation Details

### Sparkline Generation
- SVG viewBox: 100x30 units
- Path generation: Maps equity points to coordinates
- Shaded areas: Closed paths between equity and peak lines
- Responsive: Scales to container width while maintaining aspect ratio

### Drawdown Period Tracking
- State machine with boolean flag for drawdown state
- Accumulates metrics during drawdown period
- Closes period on recovery or end of data
- Handles partial periods (ongoing drawdowns)

### Performance Considerations
- Computed properties for reactive updates
- Efficient array operations (reduce, filter, map)
- Minimal re-renders with proper key usage
- Sorting prioritizes symbols in drawdown

## Testing Recommendations

1. **No Trades Scenario**
   - Verify empty state display
   - Check for division by zero errors

2. **Single Symbol**
   - Test with various drawdown patterns
   - Verify sparkline renders correctly

3. **Multiple Drawdowns**
   - Symbol with multiple recovery cycles
   - Check average calculations

4. **Ongoing Drawdown**
   - Symbol never recovers
   - Check null handling for recovery metrics

5. **Perfect Performance**
   - Symbol with no drawdowns
   - Verify 0% time in drawdown

6. **Responsive Design**
   - Test mobile card view
   - Verify desktop table view
   - Check sparkline scaling

## Future Enhancements

1. **Interactive Sparklines**
   - Hover to see exact values
   - Click to show detailed trade list

2. **Drawdown Alerts**
   - Notification when entering significant drawdown
   - Warning for prolonged time in drawdown

3. **Comparison Mode**
   - Compare drawdown patterns across symbols
   - Benchmark against overall portfolio

4. **Historical Comparison**
   - Year-over-year drawdown comparison
   - Trend analysis for recovery efficiency

5. **Export Functionality**
   - Download drawdown report
   - Export equity curves as images
