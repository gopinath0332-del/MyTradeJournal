# MyTradeJournal

A modern trading journal application built with Vue 3 and Firebase to help traders track, analyze, and improve their trading performance.

## 🚀 Features

- **Trade Management**: Add, edit, and delete trades with comprehensive trade details
- **Dashboard Analytics**: Visual statistics and performance metrics
- **Historical Analysis**: View trade history with filtering and search capabilities
- **Monthly/Weekly Breakdowns**: Detailed performance analysis by time periods
- **Real-time Data**: Firebase integration for real-time data synchronization
- **Responsive Design**: Mobile-friendly interface with adaptive layouts

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
│   │   ├── MonthlyBreakdown.vue
│   │   ├── StatsGrid.vue
│   │   ├── WeeklyBreakdown.vue
│   │   └── YearSelector.vue
│   └── trade/              # Trade management components
│       ├── TradeForm.vue
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
- **StatsGrid**: Grid layout for displaying trading statistics
- **MonthlyBreakdown**: Monthly performance analysis
- **WeeklyBreakdown**: Weekly performance trends
- **YearSelector**: Year selection for filtering data

### Trade Components
- **TradeForm**: Form for adding and editing trades
- **TradeHistory**: Table view of all trades with filtering options

### Composables
- **useDashboardStats**: Logic for dashboard statistics and calculations
- **useTradeForm**: Form validation and trade management logic

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
