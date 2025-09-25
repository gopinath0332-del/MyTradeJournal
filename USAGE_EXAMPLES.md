# Usage Examples for New Features

This document provides examples of how to use the new features and improvements added to MyTradeJournal.

## 🧪 Testing

### Running Tests
```bash
# Run tests in watch mode (for development)
npm run test

# Run tests once (for CI/CD)
npm run test:run

# Run tests with UI
npm run test:ui
```

### Writing Tests
```javascript
import { describe, it, expect, vi } from 'vitest'
import { useTradeForm } from '@/composables/useTradeForm'

describe('MyComponent', () => {
  it('should work correctly', () => {
    const result = useTradeForm()
    expect(result.formData.symbol).toBe('')
  })
})
```

## 📊 Data Export

### Using the Export Utilities
```javascript
import { exportToCSV, exportToJSON, downloadFile, generateFileName } from '@/utils/exportUtils'

// Export trades to CSV
const exportTradesToCSV = (trades) => {
  try {
    const csvContent = exportToCSV(trades)
    const filename = generateFileName('trades_export', 'csv')
    downloadFile(csvContent, filename, 'text/csv')
  } catch (error) {
    console.error('Export failed:', error.message)
  }
}

// Export trades to JSON
const exportTradesToJSON = (trades) => {
  const jsonContent = exportToJSON(trades)
  const filename = generateFileName('trades_backup', 'json')
  downloadFile(jsonContent, filename, 'application/json')
}
```

## ⌨️ Keyboard Shortcuts

### Using the Keyboard Shortcuts Composable
```javascript
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'

export default {
  setup() {
    // Define your shortcuts
    const shortcuts = {
      'ctrl+n': () => navigateToNewTrade(),
      'ctrl+s': () => saveTrade(),
      'ctrl+e': () => exportData(),
      'escape': () => closeModal()
    }
    
    // Enable shortcuts
    useKeyboardShortcuts(shortcuts)
    
    return {
      // your component logic
    }
  }
}
```

## 🛡️ Error Handling

### Using the Error Boundary Utilities
```javascript
import { withErrorHandling, AppError, errorCodes } from '@/utils/errorBoundary'

// Wrap async operations
const saveTrade = async (tradeData) => {
  return withErrorHandling(async () => {
    const result = await tradeService.addTrade(tradeData)
    return result
  }, 'Save Trade')
}

// Throw custom errors
const validateTrade = (trade) => {
  if (!trade.symbol) {
    throw new AppError(
      'Symbol is required',
      errorCodes.VALIDATION_ERROR,
      { field: 'symbol' }
    )
  }
}
```

## 🔧 Environment Configuration

### Using Environment Validation
```javascript
import { validateEnvironment, getEnvVar } from '@/utils/env'

// Validate environment on app startup
try {
  validateEnvironment()
  console.log('✅ Environment configuration is valid')
} catch (error) {
  console.error('❌ Environment error:', error.message)
}

// Get environment variables safely
const appTitle = getEnvVar('VITE_APP_TITLE', 'My Trade Journal')
const apiKey = getEnvVar('VITE_FIREBASE_API_KEY')
```

## 📱 PWA Features

### Service Worker Registration
The PWA functionality is automatically configured. Users can:

1. **Install the app** - Browser will show an "Install" button
2. **Work offline** - Basic functionality works without internet
3. **Receive updates** - App automatically updates when new versions are deployed

### Customizing PWA Settings
Edit `vite.config.js` to customize PWA behavior:

```javascript
VitePWA({
  manifest: {
    name: 'Your Custom Name',
    short_name: 'CustomName',
    theme_color: '#your-color'
  }
})
```

## 🎨 Code Formatting

### Auto-formatting Code
```bash
# Format all files
npm run format

# Check formatting without changes
npm run format:check

# Lint and fix issues
npm run lint

# Check linting without fixes
npm run lint:check
```

### Editor Integration
For VS Code, the project includes recommended extensions in `.vscode/extensions.json`. Install:
- ESLint extension
- Prettier extension  
- Vue Language Features (Volar)

## 🚀 Build and Deploy

### Building the Application
```bash
# Development build
npm run build:dev

# Production build (with linting)
npm run build:prod

# Preview production build
npm run preview:prod
```

### CI/CD Pipeline
The GitHub Actions workflow automatically:
1. Runs linting and formatting checks
2. Executes all tests
3. Builds the application
4. Stores build artifacts

## 📊 Bundle Analysis

### Analyzing Bundle Size
```bash
# Build and check the dist/ folder
npm run build
ls -lh dist/assets/

# The build shows gzipped sizes automatically
```

### Performance Tips
- Main bundle: ~482KB (131KB gzipped)
- PWA assets add minimal overhead
- Service worker enables caching for better performance
- Consider code splitting for larger applications

## 🔍 Debugging

### Development Tools
```bash
# Run with source maps
npm run dev

# Run tests with debugging
npm run test:ui

# Check for issues
npm run lint:check
```

### Common Issues
1. **Environment variables not set**: Check `.env` file against `.env.example`
2. **Tests failing**: Make sure mocks are properly configured
3. **Build failing**: Run `npm run lint` to fix code issues
4. **PWA not working**: Check `public/` folder for required assets

## 📚 Further Reading

- [Vue 3 Composition API](https://vuejs.org/guide/composition-api/)
- [Vitest Testing Framework](https://vitest.dev/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [Prettier Configuration](https://prettier.io/docs/en/configuration.html)
- [Vite PWA Plugin](https://vite-pwa-org.netlify.app/)