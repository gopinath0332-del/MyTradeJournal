# 🎨 Lessons Library - Component Visual Guide

## Component Structure

```
LessonsLibrary.vue
├── Header Section
│   ├── Title: "📚 Trading Lessons Library"
│   └── Subtitle: "Learn from your trading experiences..."
│
├── Statistics Dashboard
│   ├── [📝 Total Lessons]
│   ├── [✅ From Wins]
│   ├── [❌ From Losses]
│   └── [🏷️ Categories]
│
├── Filter Section
│   ├── [All Lessons] (active)
│   ├── [🛡️ Risk Management (12)]
│   ├── [🎯 Entry/Exit (8)]
│   ├── [🧠 Psychology (15)]
│   ├── [📊 Strategy (10)]
│   ├── [🔍 Analysis (6)]
│   └── [📜 Trading Rules (9)]
│
├── Lessons Grid
│   ├── Lesson Card 1 (Green - Profit)
│   │   ├── Date: "15 Oct 2025"
│   │   ├── Symbol: "NIFTY"
│   │   ├── Badge: "✅ Win"
│   │   ├── Text: "Followed stop loss discipline..."
│   │   ├── Tags: [Stop Loss] [Discipline]
│   │   └── P&L: ₹12,500
│   │
│   ├── Lesson Card 2 (Red - Loss)
│   │   ├── Date: "12 Oct 2025"
│   │   ├── Symbol: "BANKNIFTY"
│   │   ├── Badge: "❌ Loss"
│   │   ├── Text: "Entered too early without confirmation..."
│   │   ├── Tags: [Entry] [Patience]
│   │   └── P&L: -₹8,200
│   │
│   └── [More cards...]
│
├── Wisdom Board
│   ├── [💡 Most Profitable Lesson]
│   │   ├── "Waited for clear trend confirmation..."
│   │   └── ₹25,000
│   │
│   ├── [⚠️ Biggest Loss Lesson]
│   │   ├── "Ignored stop loss due to hope..."
│   │   └── -₹18,500
│   │
│   └── [📈 Most Common Theme]
│       └── "Psychology"
│
└── Timeline View
    ├── 📅 Lessons Timeline
    │
    ├── Timeline Item 1 (Recent)
    │   ├── ● Marker (Green)
    │   ├── "15 Oct 2025 | NIFTY | ₹12,500"
    │   ├── "Followed my trading plan perfectly..."
    │   └── [Tags: Discipline, Plan]
    │
    ├── Timeline Item 2
    │   ├── ● Marker (Red)
    │   ├── "12 Oct 2025 | BANKNIFTY | -₹8,200"
    │   ├── "Let emotions override strategy..."
    │   └── [Tags: Psychology, Emotion]
    │
    └── [More timeline items...]
```

## Color Palette

### Statistics Cards
```css
Card 1: Purple gradient   (#667eea → #764ba2)
Card 2: Green gradient    (#10b981 → #059669)
Card 3: Red gradient      (#ef4444 → #dc2626)
Card 4: Orange gradient   (#f59e0b → #d97706)
```

### Lesson Cards
```css
Profit Cards:
  - Border: #10b981 (green)
  - Background: white → #f0fdf4 (light green gradient)
  - Badge: #d1fae5 background, #065f46 text

Loss Cards:
  - Border: #ef4444 (red)
  - Background: white → #fef2f2 (light red gradient)
  - Badge: #fee2e2 background, #991b1b text
```

### Wisdom Board
```css
Success Card: #d1fae5 → #a7f3d0 (green gradient)
Warning Card: #fee2e2 → #fecaca (red gradient)
Info Card:    #dbeafe → #bfdbfe (blue gradient)
```

## Layout Breakpoints

### Desktop (> 768px)
- Statistics: 4 columns
- Lessons Grid: 3 columns (auto-fit 320px min)
- Wisdom Cards: 3 columns
- Timeline: Full width with left border

### Mobile (< 768px)
- Statistics: 2 columns
- Lessons Grid: 1 column
- Wisdom Cards: 1 column
- Timeline: Adjusted padding

## Interactive States

### Filter Buttons
```
Default:
  - Border: #e2e8f0 (light gray)
  - Background: white
  - Text: default color

Hover:
  - Border: #667eea (purple)
  - Text: #667eea (purple)

Active:
  - Background: #667eea (purple)
  - Border: #667eea (purple)
  - Text: white
```

### Lesson Cards
```
Default:
  - Shadow: 0 2px 8px rgba(0,0,0,0.1)
  - Transform: none

Hover:
  - Shadow: 0 8px 16px rgba(0,0,0,0.15)
  - Transform: translateY(-4px)
```

## Auto-Categorization Logic

```javascript
Input: "Should have used stop loss, got greedy and lost big"

Processing:
1. Text Analysis: "stop loss" + "greedy" + "lost"
2. Category Match:
   - "stop loss" → Risk Management 🛡️
   - "greedy" → Psychology 🧠
3. Tag Extraction:
   - "stop loss" → Stop Loss
   - "greedy" → Greed
   - "lost" → (implied loss context)

Output:
Categories: [Risk Management 🛡️, Psychology 🧠]
Tags: [Stop Loss, Greed]
Context: Loss trade (red card)
```

## Tag Mapping Reference

```javascript
{
  'Stop Loss': /stop.?loss/,
  'Risk Management': /risk/,
  'Entry': /entry/,
  'Exit': /exit/,
  'Patience': /patience|wait/,
  'Discipline': /discipline/,
  'FOMO': /fomo|fear.?of.?missing/,
  'Greed': /greed|profit.?target/,
  'Analysis': /analysis|analyze/,
  'Strategy': /strategy/,
  'Trend': /trend/,
  'Position Size': /position.?size/
}
```

## Data Flow

```
Trade Form
    ↓
  [Lessons Learned Input]
    ↓
Firebase/Firestore
    ↓
LessonsLibrary Component
    ↓
    ├─→ categorizeLesson() → Categories
    ├─→ extractTags() → Tags
    ├─→ Link to Trade → P&L, Symbol, Date
    └─→ Sort by Date → Display
    ↓
    ├─→ Statistics Dashboard
    ├─→ Filtered Grid
    ├─→ Wisdom Board
    └─→ Timeline View
```

## Animations

### Card Entry
```css
Stagger animation on load
Fade-in + scale effect
Duration: 0.3s
```

### Hover Effects
```css
Transform: translateY(-4px)
Shadow elevation
Duration: 0.3s ease
```

### Filter Transitions
```css
Color and background transitions
Duration: 0.3s
Smooth state changes
```

## Empty States

### No Lessons
```
Icon: 📖
Title: "No lessons recorded yet"
Message: "Start adding lessons learned from your trades..."
CTA: (Implicit - go log trades)
```

### Loading
```
Spinner component
Message: "Loading your lessons..."
Size: medium
```

## Accessibility Features

- **Semantic HTML**: Proper heading hierarchy
- **Color Contrast**: WCAG AA compliant
- **Keyboard Navigation**: Tab-friendly
- **Screen Reader**: Meaningful labels
- **Touch Targets**: 44px minimum (mobile)
- **Focus States**: Visible outlines

---

This visual guide provides a complete overview of the Lessons Library component structure, styling, and behavior! 🎨
