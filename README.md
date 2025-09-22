# MyTradeJournal

A modern trading journal application built with Vue 3 and Firebase to help traders track, analyze, and improve their trading performance.

## 🚀 Features

- **Trade Management**: Add, edit, and delete trades with comprehensive trade details
- **Modular Form Design**: Trade form broken into focused, reusable components
- **Dashboard Analytics**: Visual statistics and performance metrics
- **Historical Analysis**: View trade history with filtering and search capabilities
- **Trading Heatmap**: Visual representation of trading performance patterns
- **Real-time Data**: Firebase integration for real-time data synchronization
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

## 🛠️ Tech Stack

- **Frontend**: Vue 3 with Composition API
- **Build Tool**: Vite
- **Database**: Firebase Firestore
- **Styling**: Custom CSS with responsive design
- **Architecture**: Modular component design with reusable sub-components
- **State Management**: Vue 3 Composition API with provide/inject pattern

## 📁 Project Structure

```
src/
├── components/
│   ├── dashboard/          # Dashboard analytics components
│   │   └── DashboardStats.vue
│   ├── trade/              # Trade management components
│   │   ├── forms/          # Modular trade form components
│   │   │   ├── TradeActions.vue      # Save/Delete actions
│   │   │   ├── TradeBasicInfo.vue    # Symbol, quantity, type
│   │   │   ├── TradeDates.vue        # Entry/exit dates
│   │   │   ├── TradeMetadata.vue     # Strategy, notes, tags
│   │   │   ├── TradePricing.vue      # Price, fees, P&L
│   │   │   └── TradeSummary.vue      # Calculated summaries
│   │   ├── TradeForm.vue             # Main trade form container
│   │   └── TradeHistory.vue          # Trade history table
│   ├── HeatmapView.vue     # Trading performance heatmap
├── composables/            # Reusable composition functions
├── firebase/               # Firebase configuration and services
│   ├── config.js           # Firebase configuration
│   └── tradeService.js     # Firestore service functions
├── styles/                 # CSS stylesheets
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

3. Configure Firebase:
   - Create a Firebase project at [https://console.firebase.google.com](https://console.firebase.google.com)
   - Enable Firestore Database
   - Update the Firebase configuration in `src/firebase/config.js`

4. Start the development server:
```bash
npm run dev
```

5. Open your browser and navigate to `http://localhost:5173`

## 🔧 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## 📊 Components Overview

### Dashboard Components
- **DashboardStats**: Main dashboard with key performance indicators

### Trade Components
- **TradeForm**: Main container component that orchestrates all trade form sub-components
- **TradeHistory**: Table view of all trades with filtering options

#### Trade Form Sub-Components (Modular Architecture)
- **TradeBasicInfo**: Symbol, quantity, and trade type selection
- **TradeDates**: Entry date, exit date, and automatic days held calculation
- **TradePricing**: Entry/exit prices, fees, and P&L calculations
- **TradeSummary**: Calculated trade summaries and performance metrics
- **TradeMetadata**: Strategy, notes, and tags for trade categorization
- **TradeActions**: Save and delete action buttons with form validation

### Additional Components
- **HeatmapView**: Visual heatmap representation of trading performance patterns

## 🏗️ Architecture Highlights

### Modular Component Design
The application follows a modular architecture pattern, particularly evident in the TradeForm component which has been decomposed into focused sub-components:

- **Separation of Concerns**: Each form section is isolated into its own component
- **Reusability**: Sub-components can be easily reused across different contexts
- **Maintainability**: Smaller, focused components are easier to test and maintain
- **Vue 3 Composition API**: Leverages reactive refs and computed properties for optimal reactivity

### Component Communication
- **Props/Events Pattern**: Parent-child communication using props down, events up
- **v-model Binding**: Two-way data binding with computed properties (getter/setter pattern)
- **Reactive Updates**: Automatic recalculation of derived values (e.g., days held, P&L)

## 🔥 Firebase Integration

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
