# Environment Configuration Guide

This document explains how to set up and manage environment variables for the MyTradeJournal application.

## Overview

The application uses environment variables to manage configuration across different environments (development, staging, production). All client-side environment variables must be prefixed with `VITE_` to be accessible in the frontend code.

## Environment Files

The following environment files are used:

- `.env` - Default environment variables (loaded in all environments)
- `.env.development` - Development-specific variables
- `.env.production` - Production-specific variables
- `.env.example` - Template file showing required variables (safe to commit)

## Setup Instructions

### 1. Initial Setup

Copy the example file to create your local environment file:
```bash
cp .env.example .env
```

### 2. Configure Firebase

Update the `.env` file with your Firebase project configuration:

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Select your project
3. Go to Project Settings > General > Your apps
4. Copy the configuration values to your `.env` file

### 3. Environment-Specific Configuration

For different environments, create or update the appropriate `.env.*` file:

- **Development**: Use `.env.development` or `.env` 
- **Production**: Use `.env.production`

## Available Scripts

The following npm scripts support different environments:

```bash
# Development
npm run dev                 # Uses .env and .env.development
npm run build:dev          # Build for development environment

# Production  
npm run dev:prod           # Run dev server with production config
npm run build:prod         # Build for production environment
npm run preview:prod       # Preview production build
```

## Environment Variables Reference

### Firebase Configuration (Required)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_API_KEY` | Firebase API Key | `AIzaSyD...` |
| `VITE_FIREBASE_AUTH_DOMAIN` | Firebase Auth Domain | `myproject.firebaseapp.com` |
| `VITE_FIREBASE_PROJECT_ID` | Firebase Project ID | `myproject-12345` |
| `VITE_FIREBASE_STORAGE_BUCKET` | Firebase Storage Bucket | `myproject.appspot.com` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | FCM Sender ID | `123456789` |
| `VITE_FIREBASE_APP_ID` | Firebase App ID | `1:123:web:abc123` |

### Firebase Configuration (Optional)

| Variable | Description | Example |
|----------|-------------|---------|
| `VITE_FIREBASE_MEASUREMENT_ID` | Google Analytics ID | `G-XXXXXXXXXX` |

### Application Configuration (Optional)

| Variable | Description | Default | Example |
|----------|-------------|---------|---------|
| `VITE_APP_TITLE` | Application Title | `Trade Journal` | `My Trading App` |
| `VITE_APP_VERSION` | Application Version | `1.0.0` | `2.1.0` |
| `VITE_APP_ENV` | Environment Name | - | `development` |
| `VITE_DEBUG_MODE` | Debug Mode | `false` | `true` |

## Security Best Practices

### ✅ Safe Practices
- Use `.env.example` for documenting required variables
- Keep environment-specific files separate
- Use different Firebase projects for different environments
- Regularly rotate API keys and secrets

### ❌ Avoid These Mistakes
- **Never commit `.env` files** to version control
- Don't put sensitive secrets in client-side environment variables
- Don't use the same Firebase project for development and production
- Don't hardcode configuration values in source code

## Troubleshooting

### Common Issues

1. **Variables not loading**: Ensure they start with `VITE_` prefix
2. **Build fails**: Check that all required variables are set
3. **Firebase connection fails**: Verify all Firebase config values are correct

### Debugging Environment Variables

To see which environment variables are loaded, you can temporarily add this to your code:
```javascript
console.log('Environment variables:', import.meta.env)
```

### Environment Loading Order

Vite loads environment files in this order:
1. `.env`
2. `.env.local`
3. `.env.[mode]` (e.g., `.env.development`)
4. `.env.[mode].local`

Later files override earlier ones.

## Firebase Security Rules

When using different environments, consider setting up Firebase Security Rules that restrict access based on your configuration.

## Support

For questions or issues with environment configuration, please:
1. Check this documentation
2. Verify your `.env` file matches `.env.example`
3. Check the browser console for error messages
4. Open an issue on GitHub with your configuration (remove sensitive values)