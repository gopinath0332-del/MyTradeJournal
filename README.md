# MyTradeJournal 📈

A comprehensive, modern trading journal application built with Vue 3, TypeScript, and Firebase. Track, analyze, and improve your trading performance with advanced analytics, mobile-optimized interface, and real-time data synchronization.

## 🌟 Live Demo

**🚀 [Visit MyTradeJournal](https://gopinath0332-del.github.io/MyTradeJournal/)**

Experience the full application with all features including:
- Dashboard with real-time analytics
- Advanced statistics and performance analysis
- Mobile-optimized interface
- Trade management and history
- Interactive charts and visualizations

## 📱 Mobile Optimization

### Mobile-First Design
- **Responsive Layouts**: Optimized for screens from 320px to 4K displays
- **Touch-Friendly Interface**: Enhanced touch targets (44px minimum) for better mobile UX
- **Progressive Enhancement**: Advanced features on larger screens, core functionality on mobile

### Mobile Features
- **Tab Navigation**: Horizontally scrollable tabs with visual scroll hints
- **Touch Interactions**: Smooth scrolling with momentum and snap-to-tab functionality
- **Compact UI**: Space-efficient layouts with adaptive typography
- **Mobile Charts**: Touch-optimized charts and data visualizations
- **Offline Support**: Service worker caching for offline functionality

### Cross-Device Compatibility
- **📱 Mobile (320px-768px)**: Icon-based navigation, stacked layouts, touch-first interactions
- **📱 Tablet (768px-1024px)**: Enhanced touch targets, adaptive layouts
- **💻 Desktop (1024px+)**: Full feature set with hover states and keyboard navigation
- **🖥️ Large Screens (1400px+)**: Optimized layouts with maximum content width

## 🔒 Environment Configuration

### Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the frontend:

| Variable | Description | Required | Example |
|----------|-------------|----------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | ✅ Yes | `AIzaSyC...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | ✅ Yes | `myproject.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | ✅ Yes | `my-trading-journal` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | ✅ Yes | `myproject.firebasestorage.app` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | ✅ Yes | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | ✅ Yes | `1:123:web:abc` |
| `VITE_FIREBASE_MEASUREMENT_ID` | Analytics Measurement ID | ❌ No | `G-XXXXXXXXXX` |

### Environment Files
```bash
.env.local          # Local development (gitignored)
.env.development    # Development environment
.env.production     # Production environment
.env.example        # Template file (committed to repo)
```

### Security Best Practices
- **Never commit `.env` files** to version control (except `.env.example`)
- Use **different Firebase projects** for development and production
- Firebase configuration values are **safe to expose** in client-side code
- Environment variables are **validated at build time** for required values

## 🔧 Performance Optimization

### Build Optimization
- **Code Splitting**: Automatic route-based code splitting with Vue Router
- **Tree Shaking**: Eliminates unused code from final bundle
- **Asset Optimization**: Compressed images, minified CSS/JS
- **Lazy Loading**: Components loaded on-demand for faster initial load

### Runtime Performance
- **Virtual Scrolling**: Efficient rendering of large trade lists
- **Data Caching**: Intelligent caching with automatic invalidation
- **Computed Optimization**: Memoized calculations for expensive operations
- **Component Lazy Loading**: Route-based component splitting

### Firebase Optimization
- **Query Optimization**: Efficient Firestore queries with proper indexing
- **Offline Persistence**: Local data caching with sync when online
- **Batch Operations**: Grouped reads/writes for better performance
- **Connection Pooling**: Optimized Firebase connection management

## 🤝 Contributing

We welcome contributions to MyTradeJournal! Here's how you can help:

### Development Setup
1. Fork the repository and clone your fork
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Set up your development environment with `.env.local`
5. Make your changes and test thoroughly
6. Commit with descriptive messages: `git commit -m 'Add amazing feature'`
7. Push to your branch: `git push origin feature/amazing-feature`
8. Open a Pull Request with a clear description

### Contribution Guidelines
- **Code Quality**: Follow ESLint rules and maintain TypeScript compatibility
- **Testing**: Test your changes across different screen sizes and browsers
- **Documentation**: Update README and add comments for complex logic
- **Performance**: Consider performance impact of your changes
- **Mobile**: Ensure mobile compatibility for all new features

### Areas for Contribution
- 🐛 Bug fixes and performance improvements
- 📱 Mobile UX enhancements
- 📊 New chart types and analytics features
- 🎨 UI/UX improvements and accessibility
- 🔧 Developer experience and tooling
- 📖 Documentation and examples

### 📚 Documentation

For comprehensive feature documentation and development guides:

### Core Documentation
- **[Feature Documentation](./docs/README.md)** - Complete feature specifications and roadmap
- **[Analytics Features](./docs/analytics-features.md)** - Advanced analytics and performance metrics
- **[ESLint Configuration](./docs/ESLINT.md)** - Code quality rules and troubleshooting
- **[Trade History Refactoring](./docs/TRADE_HISTORY_REFACTORING.md)** - Component architecture and refactoring details

### Implementation Guides
- **[Strategy Management](./docs/strategy-management.md)** - Trading strategies and risk management
- **[Technical Features](./docs/technical-features.md)** - API integrations and infrastructure
- **[Implementation Roadmap](./docs/implementation-roadmap.md)** - Development priorities and timeline

### User Experience
- **[UX & Mobile Features](./docs/ux-mobile-features.md)** - User experience and mobile optimization
- **[AI & Automation](./docs/ai-automation.md)** - Machine learning and automation features
- **[Learning & Community](./docs/learning-community.md)** - Educational and social features

## 🛠️ Troubleshooting

### Common Issues

#### Firebase Connection Issues
```bash
# Check Firebase configuration
npm run build  # Validates environment variables
```

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Mobile Layout Issues
```bash
# Test responsive design
npm run dev
# Open browser dev tools and test different screen sizes
```

#### SPA Routing on GitHub Pages
```bash
# Test SPA routing fix
./test-spa-routing.sh
```

### Getting Help
- 📖 Check the [documentation](./docs/) for detailed guides
- 🐛 Search [existing issues](https://github.com/gopinath0332-del/MyTradeJournal/issues)
- 💬 Open a new issue with detailed reproduction steps
- 📧 Contact the maintainers for complex issues

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Vue.js Team** for the amazing Vue 3 framework
- **Firebase Team** for robust backend services
- **Vite Team** for lightning-fast build tooling
- **Trading Community** for feedback and feature requests

---

**Built with ❤️ using Vue 3, TypeScript, and Firebase**

*MyTradeJournal - Track, Analyze, Improve your Trading Performance* 📈

## ✨ Key Features

### 📊 **Advanced Analytics Dashboard**
- **Real-time Performance Metrics**: Live P&L tracking, win rates, and risk metrics
- **Interactive Charts**: Equity curves, P&L distribution, drawdown analysis
- **Multi-timeframe Analysis**: Daily, weekly, monthly, and yearly breakdowns
- **Trading Heatmaps**: Calendar-based activity visualization
- **Symbol Performance**: Detailed analysis per trading instrument

### 🎯 **Comprehensive Statistics**
- **Performance KPIs**: Sharpe ratio, profit factor, expectancy calculations
- **Risk Analysis**: Maximum drawdown, risk-reward ratios, consistency metrics
- **Strategy Breakdown**: Performance analysis by trading strategies
- **Time-based Patterns**: Day-of-week and seasonal performance trends
- **Hold Time Distribution**: Analysis of trade duration patterns

### � **Mobile-First Design**
- **Responsive Interface**: Optimized for all screen sizes (320px to 4K)
- **Touch-Friendly Navigation**: Enhanced mobile interactions with smooth scrolling
- **Progressive Web App**: Installable on mobile devices
- **Offline Capability**: Local data caching for offline access

### 🔄 **Trade Management**
- **Intuitive Trade Entry**: Streamlined form with real-time P&L calculations
- **Bulk Operations**: Import/export trades, batch editing
- **Trade History**: Advanced filtering, sorting, and search capabilities
- **Automated Calculations**: Automatic P&L, fees, and performance calculations

### 🔧 **Developer Experience**
- **TypeScript Integration**: Full type safety and IntelliSense support
- **Component Architecture**: Modular, reusable Vue 3 components with refactored structure
- **Composition API**: Modern Vue patterns with composables
- **ESLint Configuration**: Consistent code quality and formatting
- **Refactored Components**: Smaller, maintainable components (e.g., TradeHistory reduced by 72%)

## 🛠️ Tech Stack

- **Frontend Framework**: Vue 3 with Composition API & TypeScript
- **Build Tool**: Vite for fast development and optimized builds
- **Database**: Firebase Firestore for real-time data synchronization
- **Styling**: Custom CSS with mobile-first responsive design
- **State Management**: Vue 3 Composition API with provide/inject pattern
- **Deployment**: GitHub Pages with automated CI/CD
- **Code Quality**: ESLint with Vue 3 and TypeScript rules

## 🔍 Code Quality & Linting

This project maintains high code quality with comprehensive ESLint configuration:

### ESLint Features
- **Vue 3 Composition API** support with recommended rules
- **TypeScript** integration for type safety
- **Consistent formatting** (2-space indentation, single quotes, no semicolons)
- **Vue-specific rules** for component structure and naming
- **VS Code integration** for automatic fixing on save

### Usage
```bash
npm run lint:check    # Check for issues
npm run lint:fix      # Fix auto-fixable issues
```

### Key Rules
- Use `const`/`let` appropriately
- Single quotes for strings
- 2-space indentation
- PascalCase for Vue components
- camelCase for props and variables
- No unused variables (prefix with `_` if needed)

See [`docs/ESLINT.md`](./docs/ESLINT.md) for detailed configuration and troubleshooting guide.

## 🔥 Firebase Integration

The application uses Firebase for robust backend services:

- **Firestore Database**: Real-time trade data storage and synchronization
- **Security Rules**: Configured for data protection and user isolation
- **Offline Support**: Local caching with automatic sync when online
- **Performance Optimization**: Efficient queries and data pagination

### Security Best Practices
- Environment variables for Firebase configuration
- Client-side security rules validation
- Data validation and sanitization
- Firebase configuration values are safe to expose in client-side code as they identify your project publicly

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/              # Dashboard analytics components
│   │   ├── DashboardStats.vue  # Main dashboard with KPIs
│   │   ├── EquityCurve.vue     # Account equity visualization
│   │   ├── MonthlyBreakdown.vue # Monthly performance analysis
│   │   ├── StatsGrid.vue       # Performance metrics grid
│   │   ├── SymbolPieChart.vue  # Symbol distribution chart
│   │   ├── TradingHeatmap.vue  # Calendar activity heatmap
│   │   ├── WeeklyBreakdown.vue # Weekly performance trends
│   │   └── YearSelector.vue    # Year filtering component
│   ├── charts/                 # Specialized chart components
│   │   ├── DrawdownAnalysis.vue # Drawdown visualization
│   │   ├── HoldTimeDistribution.vue # Trade duration analysis
│   │   ├── HorizontalBarChart.vue # Reusable bar chart
│   │   ├── PnLHistogram.vue    # P&L distribution chart
│   │   ├── StrategyPerformance.vue # Strategy breakdown
│   │   ├── SymbolCards.vue     # Mobile symbol cards
│   │   └── TradingEfficiencyMetrics.vue # Efficiency analysis
│   ├── trade/                  # Trade management components
│   │   ├── forms/              # Modular trade form components
│   │   │   ├── TradeActions.vue # Form action buttons
│   │   │   ├── TradeBasicInfo.vue # Symbol and type info
│   │   │   ├── TradeDates.vue  # Date selection
│   │   │   ├── TradeMetadata.vue # Notes and metadata
│   │   │   ├── TradePricing.vue # Price and quantity
│   │   │   └── TradeSummary.vue # P&L summary
│   │   ├── TradeHistory/       # Refactored trade history components
│   │   │   ├── TradeCards.vue  # Mobile card view
│   │   │   ├── TradeDetailsModal.vue # Trade details modal
│   │   │   ├── TradeFilters.vue # Filter controls
│   │   │   ├── TradeResultsSummary.vue # Results summary
│   │   │   ├── TradeTabs.vue   # Tab navigation
│   │   │   ├── TradeTable.vue  # Desktop table view
│   │   │   └── tradeHistoryUtils.ts # Shared utilities
│   │   ├── TradeForm.vue       # Main trade form container
│   │   ├── TradeHistory.vue    # Trade history orchestrator
│   │   └── TradeRow.vue        # Individual trade display
│   ├── ui/                     # Reusable UI components
│   │   ├── EmptyState.vue      # Empty state messaging
│   │   ├── LoadingSpinner.vue  # Loading indicators
│   │   ├── PerformanceMonitor.vue # Debug performance tool
│   │   └── VirtualScroll.vue   # Virtual scrolling for large lists
│   ├── CalendarView.vue        # Calendar-based trade view
│   ├── HeatmapView.vue         # Trading activity heatmap
│   └── StatisticsView.vue      # Advanced statistics dashboard
├── composables/                # Reusable composition functions
│   ├── useDashboardStats.ts    # Dashboard data and calculations
│   ├── useDrawdownAnalysis.ts  # Drawdown analysis logic
│   ├── useMultiYearHeatmap.ts  # Multi-year heatmap data
│   ├── useStrategyAnalysis.ts  # Strategy performance analysis
│   ├── useSymbolPerformance.ts # Symbol-specific metrics
│   ├── useTimeAnalysis.ts      # Time-based performance patterns
│   ├── useTradeForm.ts         # Trade form logic and validation
│   └── useCalendar.ts          # Calendar view functionality
├── firebase/                   # Firebase configuration and services
│   ├── config.ts               # Firebase project configuration
│   └── tradeService.ts         # Trade CRUD operations and queries
├── router/                     # Vue Router configuration
│   └── index.js                # Route definitions and navigation guards
├── styles/                     # CSS stylesheets and themes
│   └── dashboard.css           # Dashboard-specific styles
├── types/                      # TypeScript type definitions
│   ├── index.ts                # Core application types
│   ├── firebase.ts             # Firebase-related types
│   └── vue.ts                  # Vue component types
├── utils/                      # Utility functions and helpers
│   ├── cache.ts                # Data caching utilities
│   ├── logger.ts               # Logging and debugging
│   └── offlineData.ts          # Offline data management
├── App.vue                     # Main application component
├── main.js                     # Application entry point
└── style.css                  # Global styles and CSS variables
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v18 or higher) 
- **npm** or **yarn** package manager
- **Firebase project** (for backend services)
- **Modern web browser** (Chrome, Firefox, Safari, Edge)

### Quick Start

1. **Clone the repository:**
```bash
git clone https://github.com/gopinath0332-del/MyTradeJournal.git
cd MyTradeJournal
```

2. **Install dependencies:**
```bash
npm install
```

3. **Configure Environment Variables:**
   Create a `.env.local` file in the root directory:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. **Set up Firebase:**
   - Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
   - Enable **Firestore Database** in your project
   - Copy your configuration from **Project Settings → General → Your apps**
   - Update the `.env.local` file with your Firebase credentials

5. **Start the development server:**
```bash
npm run dev
```

6. **Open your browser** and navigate to `http://localhost:5173`

### 🔧 Development Scripts

#### Core Development
```bash
npm run dev              # Start development server (recommended)
npm run dev:prod         # Development server with production config
npm run build            # Build for production
npm run build:dev        # Build for development environment
npm run build:prod       # Build for production environment
npm run preview          # Preview production build locally
npm run preview:prod     # Preview with production config
```

#### Code Quality & Testing
```bash
npm run type-check       # TypeScript type checking
npm run lint             # Run ESLint and fix auto-fixable issues
npm run lint:check       # Check for linting issues without fixing
npm run lint:fix         # Fix all auto-fixable ESLint issues
```

#### Testing & Deployment
```bash
npm run test:spa         # Test SPA routing configuration
./test-spa-routing.sh    # Test GitHub Pages SPA routing fix
```

## 📊 Components Overview

### 🎯 **Core Application Views**
- **DashboardStats**: Main dashboard with comprehensive KPIs and real-time analytics
- **StatisticsView**: Advanced statistics with 6 specialized analysis tabs (mobile-optimized)
- **TradeHistory**: Complete trade management with filtering, sorting, and bulk operations
- **CalendarView**: Calendar-based trade visualization and activity tracking
- **HeatmapView**: Interactive trading activity heatmap with performance color coding

### 📈 **Advanced Analytics Components**
- **EquityCurve**: Account equity progression with drawdown visualization
- **MonthlyBreakdown**: Detailed monthly performance analysis with metrics
- **WeeklyBreakdown**: Weekly performance trends and patterns
- **SymbolPieChart**: Trading symbol distribution and performance
- **TradingHeatmap**: Calendar-based activity and performance visualization

### 📊 **Specialized Chart Components**
- **DrawdownAnalysis**: Maximum drawdown periods and recovery analysis
- **PnLHistogram**: Profit/Loss distribution with statistical analysis
- **HoldTimeDistribution**: Trade duration patterns and optimization insights
- **StrategyPerformance**: Detailed performance breakdown by trading strategies
- **TradingEfficiencyMetrics**: Efficiency and consistency analysis
- **HorizontalBarChart**: Reusable chart component for various metrics

### 🔧 **Trade Management Components**

#### Modular Trade Form Architecture
- **TradeForm**: Main container orchestrating all form components
- **TradeBasicInfo**: Symbol selection, trade type, and basic information
- **TradeDates**: Entry/exit date selection with automatic calculations
- **TradePricing**: Price entry, quantity, and commission management
- **TradeSummary**: Real-time P&L calculations and performance metrics
- **TradeMetadata**: Notes, strategy, confidence, and additional metadata
- **TradeActions**: Form submission, validation, and action buttons

#### Refactored Trade History Components
The TradeHistory component has been refactored into a modular architecture for better maintainability:

- **TradeHistory.vue**: Main orchestrator component (reduced from 900+ to 250 lines)
- **TradeTabs.vue**: Tab navigation between open and closed trades
- **TradeFilters.vue**: Advanced filtering controls (date range, symbol, type, profitability)
- **TradeResultsSummary.vue**: Summary statistics and net P&L display
- **TradeTable.vue**: Desktop table view with sortable columns
- **TradeCards.vue**: Mobile-optimized card layout with touch interactions
- **TradeDetailsModal.vue**: Detailed trade information modal
- **tradeHistoryUtils.ts**: Shared utility functions for formatting and calculations

**Benefits of the refactored architecture:**
- 72% reduction in main component size
- Improved maintainability and testability
- Better separation of concerns
- Reusable components across the application
- Enhanced developer experience

See [docs/TRADE_HISTORY_REFACTORING.md](./docs/TRADE_HISTORY_REFACTORING.md) for detailed documentation.

### 🎨 **UI & Utility Components**
- **LoadingSpinner**: Consistent loading states with customizable messages
- **EmptyState**: User-friendly empty state with actionable guidance
- **VirtualScroll**: Performance-optimized scrolling for large datasets
- **PerformanceMonitor**: Development tool for performance debugging

### 🧩 **Composables (Business Logic)**
- **useDashboardStats**: Dashboard calculations, caching, and data management
- **useTradeForm**: Form validation, submission, and trade management logic
- **useSymbolPerformance**: Symbol-specific performance analysis
- **useTimeAnalysis**: Time-based pattern analysis and calculations
- **useStrategyAnalysis**: Strategy performance breakdown and comparison
- **useDrawdownAnalysis**: Risk analysis and drawdown calculations
- **useMultiYearHeatmap**: Multi-year heatmap data processing

## 🌐 Deployment & GitHub Pages

### Live Application
The application is automatically deployed to GitHub Pages with every push to the main branch:
- **Production URL**: https://gopinath0332-del.github.io/MyTradeJournal/
- **Automatic Deployment**: GitHub Actions CI/CD pipeline
- **SPA Routing Support**: Custom 404.html handling for client-side routing

### GitHub Pages Configuration
- **Base Path**: `/MyTradeJournal/` configured in Vite and Vue Router
- **SPA Routing Fix**: Custom redirect solution for refresh on direct URLs
- **Optimized Build**: Production builds with code splitting and optimization
- **Asset Optimization**: Compressed assets and efficient caching

### Deployment Features
- ✅ **Zero-config deployment** with GitHub Actions
- ✅ **SPA routing support** - no 404 errors on page refresh
- ✅ **Mobile PWA capabilities** with offline support
- ✅ **Performance optimized** builds with tree-shaking
- ✅ **Automatic SSL** with GitHub Pages HTTPS

## � Environment Configuration

This project uses environment variables to manage configuration across different environments (development, staging, production).

### Environment Variables

All environment variables must be prefixed with `VITE_` to be accessible in the frontend:

| Variable | Description | Required |
|----------|-------------|----------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | Yes |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | Yes |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | Yes |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | Yes |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Yes |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | Yes |
| `VITE_FIREBASE_MEASUREMENT_ID` | Firebase Analytics Measurement ID | No |
| `VITE_APP_TITLE` | Application Title | No |
| `VITE_APP_VERSION` | Application Version | No |

### Security Best Practices

- **Never commit `.env` files** to version control
- Use `.env.example` as a template for required variables
- Different environments should have separate `.env` files
- Firebase configuration values are safe to expose in client-side code as they identify your project publicly

## �🔥 Firebase Integration

The application uses Firebase Firestore for:
- Real-time trade data storage
- User authentication (if implemented)
- Data synchronization across devices

## 🎨 Styling

- Custom CSS with CSS Grid and Flexbox layouts
- Responsive design for mobile and desktop
- Clean, modern interface optimized for data visualization

## 🤝 Contributing

We welcome contributions to MyTradeJournal! Here's how you can help:

### Development Setup
1. Fork the repository and clone your fork
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Install dependencies: `npm install`
4. Set up your development environment with `.env.local`
5. Make your changes and test thoroughly
6. Commit with descriptive messages: `git commit -m 'Add amazing feature'`
7. Push to your branch: `git push origin feature/amazing-feature`
8. Open a Pull Request with a clear description

### Contribution Guidelines
- **Code Quality**: Follow ESLint rules and maintain TypeScript compatibility
- **Testing**: Test your changes across different screen sizes and browsers
- **Documentation**: Update README and add comments for complex logic
- **Performance**: Consider performance impact of your changes
- **Mobile**: Ensure mobile compatibility for all new features

### Areas for Contribution
- 🐛 Bug fixes and performance improvements
- 📱 Mobile UX enhancements
- 📊 New chart types and analytics features
- 🎨 UI/UX improvements and accessibility
- 🔧 Developer experience and tooling
- 📖 Documentation and examples

### 📚 Documentation

For comprehensive feature documentation and development guides:

### Core Documentation
- **[Feature Documentation](./docs/README.md)** - Complete feature specifications and roadmap
- **[Analytics Features](./docs/analytics-features.md)** - Advanced analytics and performance metrics
- **[ESLint Configuration](./docs/ESLINT.md)** - Code quality rules and troubleshooting
- **[Trade History Refactoring](./docs/TRADE_HISTORY_REFACTORING.md)** - Component architecture and refactoring details

### Implementation Guides
- **[Strategy Management](./docs/strategy-management.md)** - Trading strategies and risk management
- **[Technical Features](./docs/technical-features.md)** - API integrations and infrastructure
- **[Implementation Roadmap](./docs/implementation-roadmap.md)** - Development priorities and timeline

### User Experience
- **[UX & Mobile Features](./docs/ux-mobile-features.md)** - User experience and mobile optimization
- **[AI & Automation](./docs/ai-automation.md)** - Machine learning and automation features
- **[Learning & Community](./docs/learning-community.md)** - Educational and social features

## 🛠️ Troubleshooting

### Common Issues

#### Firebase Connection Issues
```bash
# Check Firebase configuration
npm run build  # Validates environment variables
```

#### Build Failures
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

#### Mobile Layout Issues
```bash
# Test responsive design
npm run dev
# Open browser dev tools and test different screen sizes
```

#### SPA Routing on GitHub Pages
```bash
# Test SPA routing fix
./test-spa-routing.sh
```

### Getting Help
- 📖 Check the [documentation](./docs/) for detailed guides
- 🐛 Search [existing issues](https://github.com/gopinath0332-del/MyTradeJournal/issues)
- 💬 Open a new issue with detailed reproduction steps
- 📧 Contact the maintainers for complex issues

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](./LICENSE) file for details.

## 🙏 Acknowledgments

- **Vue.js Team** for the amazing Vue 3 framework
- **Firebase Team** for robust backend services
- **Vite Team** for lightning-fast build tooling
- **Trading Community** for feedback and feature requests

---

**Built with ❤️ using Vue 3, TypeScript, and Firebase**

*MyTradeJournal - Track, Analyze, Improve your Trading Performance* 📈
