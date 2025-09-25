# MyTradeJournal

A modern trading journal application built with Vue 3 and Firebase to help traders track, analyze, and improve their trading performance.

## 🚀 Features- **Firebase configuration values are safe to expose in client-side code as they identify your project publicly

## 🔍 Code Quality & Linting

This project uses ESLint for maintaining code quality and consistency:

### ESLint Configuration
- **Vue 3 Composition API** support with recommended rules
- **JavaScript ES2022** features and best practices
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

See `ESLINT.md` for detailed configuration and troubleshooting guide.

## 🔥 Firebase Integration- **Modular Trade Management**: Add, edit, and delete trades with comprehensive details using a modular form architecture
- **Advanced Dashboard Analytics**: Visual statistics, equity curves, and performance heatmaps
- **Historical Analysis**: View trade history with filtering and search capabilities
- **Time-based Analysis**: Monthly/weekly breakdowns and calendar-based trading activity visualization
- **Real-time Data Sync**: Firebase integration for seamless data synchronization
- **Component-based Architecture**: Reusable, maintainable components for scalable development
- **Responsive Design**: Mobile-first design with adaptive layouts for all devices

## 🛠️ Tech Stack

- **Frontend**: Vue 3 with Composition API
- **Build Tool**: Vite
- **Database**: Firebase Firestore
- **Styling**: Custom CSS with responsive design
- **State Management**: Vue 3 Composition API with provide/inject

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/          # Dashboard analytics components
│   │   ├── DashboardStats.vue
│   │   ├── EquityCurve.vue
│   │   ├── MonthlyBreakdown.vue
│   │   ├── StatsGrid.vue
│   │   ├── TradingHeatmap.vue
│   │   ├── WeeklyBreakdown.vue
│   │   └── YearSelector.vue
│   └── trade/              # Trade management components
│       ├── forms/          # Modular trade form components
│       │   ├── TradeActions.vue
│       │   ├── TradeBasicInfo.vue
│       │   ├── TradeDates.vue
│       │   ├── TradeMetadata.vue
│       │   ├── TradePricing.vue
│       │   └── TradeSummary.vue
│       ├── TradeForm.vue   # Main trade form container
│       └── TradeHistory.vue
├── composables/            # Reusable composition functions
│   ├── useDashboardStats.js
│   └── useTradeForm.js
├── firebase/               # Firebase configuration and services
│   ├── config.js
│   └── tradeService.js
├── styles/                 # CSS stylesheets
│   └── dashboard.css
├── App.vue                 # Main application component
├── main.js                 # Application entry point
└── style.css              # Global styles
```

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project (for backend services)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd MyTradeJournal
```

2. Install dependencies:
```bash
npm install
```

3. Configure Environment Variables:
   - Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
   - Update the `.env` file with your Firebase project configuration:
   ```env
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project_id.firebasestorage.app
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```

4. Set up Firebase:
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore Database
   - Get your Firebase configuration from Project Settings > General > Your apps
   - Update the `.env` file with your Firebase credentials

5. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🔧 Available Scripts

### Development
- `npm run dev` - Start development server
- `npm run dev:prod` - Start development server with production config
- `npm run build` - Build for production
- `npm run build:dev` - Build for development environment
- `npm run build:prod` - Build for production environment
- `npm run preview` - Preview production build locally
- `npm run preview:prod` - Preview production build with production config

### Code Quality
- `npm run lint` - Run ESLint and fix auto-fixable issues
- `npm run lint:check` - Check for linting issues without fixing
- `npm run lint:fix` - Fix all auto-fixable ESLint issues

## 📊 Components Overview

### Dashboard Components
- **DashboardStats**: Main dashboard with key performance indicators
- **StatsGrid**: Grid layout for displaying trading statistics
- **MonthlyBreakdown**: Monthly performance analysis
- **WeeklyBreakdown**: Weekly performance trends
- **YearSelector**: Year selection for filtering data
- **EquityCurve**: Visual representation of account equity over time
- **TradingHeatmap**: Calendar-based heatmap showing trading activity

### Trade Components
- **TradeForm**: Main container for trade form using modular components
- **TradeHistory**: Table view of all trades with filtering options

### Trade Form Components (Modular Architecture)
- **TradeBasicInfo**: Symbol, type, and basic trade information
- **TradeDates**: Entry/exit dates and holding period calculation
- **TradePricing**: Entry/exit prices, quantity, and commission
- **TradeSummary**: P&L calculations and performance metrics
- **TradeMetadata**: Notes, tags, and additional trade information
- **TradeActions**: Form submission and action buttons

### Composables
- **useDashboardStats**: Logic for dashboard statistics and calculations
- **useTradeForm**: Form validation and trade management logic

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

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

If you encounter any issues or have questions, please open an issue on GitHub.

---

Built with ❤️ using Vue 3 and Firebase
