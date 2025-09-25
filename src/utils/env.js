/**
 * Environment variable validation utility
 */

export const requiredEnvVars = [
  'VITE_FIREBASE_API_KEY',
  'VITE_FIREBASE_AUTH_DOMAIN',
  'VITE_FIREBASE_PROJECT_ID',
  'VITE_FIREBASE_STORAGE_BUCKET',
  'VITE_FIREBASE_MESSAGING_SENDER_ID',
  'VITE_FIREBASE_APP_ID'
]

export const validateEnvironment = () => {
  const missingVars = requiredEnvVars.filter(varName => !import.meta.env[varName])
  
  if (missingVars.length > 0) {
    const errorMessage = `Missing required environment variables: ${missingVars.join(', ')}.\n\nPlease create a .env file based on .env.example and fill in your Firebase configuration.`
    
    // Show user-friendly error in development
    if (import.meta.env.DEV) {
      console.error('❌ Environment Configuration Error:')
      console.error(errorMessage)
      console.error('\n📝 Steps to fix:')
      console.error('1. Copy .env.example to .env')
      console.error('2. Fill in your Firebase project configuration')
      console.error('3. Restart the development server')
    }
    
    throw new Error(errorMessage)
  }
  
  return true
}

export const getEnvVar = (key, defaultValue = '') => {
  const value = import.meta.env[key]
  if (!value && defaultValue === '') {
    console.warn(`⚠️ Environment variable ${key} is not set`)
  }
  return value || defaultValue
}