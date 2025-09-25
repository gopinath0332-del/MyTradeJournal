/**
 * Error handling utilities
 */

export class AppError extends Error {
  constructor(message, code = 'UNKNOWN_ERROR', details = null) {
    super(message)
    this.name = 'AppError'
    this.code = code
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

export const errorCodes = {
  FIREBASE_ERROR: 'FIREBASE_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NETWORK_ERROR: 'NETWORK_ERROR',
  ENV_CONFIG_ERROR: 'ENV_CONFIG_ERROR',
  TRADE_SERVICE_ERROR: 'TRADE_SERVICE_ERROR'
}

export const handleError = (error, context = 'Unknown') => {
  console.error(`[${context}] Error:`, error)
  
  // Log to external service in production
  if (!import.meta.env.DEV) {
    // TODO: Integrate with error tracking service like Sentry
    // logToExternalService(error, context)
  }
  
  // Return user-friendly error message
  if (error.code) {
    switch (error.code) {
      case errorCodes.FIREBASE_ERROR:
        return 'Unable to connect to database. Please check your internet connection.'
      case errorCodes.VALIDATION_ERROR:
        return error.message
      case errorCodes.NETWORK_ERROR:
        return 'Network error. Please try again.'
      case errorCodes.ENV_CONFIG_ERROR:
        return 'Application configuration error. Please contact support.'
      default:
        return 'An unexpected error occurred. Please try again.'
    }
  }
  
  return 'An unexpected error occurred. Please try again.'
}

export const withErrorHandling = async (fn, context = 'Operation') => {
  try {
    return await fn()
  } catch (error) {
    throw new AppError(
      handleError(error, context),
      error.code || errorCodes.UNKNOWN_ERROR,
      error
    )
  }
}