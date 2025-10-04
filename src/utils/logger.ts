/**
 * Logger utility for the Trade Journal application
 * Provides structured logging with different levels and optional console output
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: string | undefined
  data?: any
  timestamp: Date
}

class Logger {
  private logLevel: LogLevel
  private logs: LogEntry[] = []
  private maxLogs = 1000 // Keep last 1000 logs

  constructor(level: LogLevel = LogLevel.INFO) {
    this.logLevel = level
  }

  private shouldLog(level: LogLevel): boolean {
    return level >= this.logLevel
  }

  private addLog(level: LogLevel, message: string, context?: string, data?: any): void {
    const entry: LogEntry = {
      level,
      message,
      context,
      data,
      timestamp: new Date()
    }

    this.logs.push(entry)

    // Keep only the last maxLogs entries
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs)
    }

    // Output to console in development
    if (process.env.NODE_ENV === 'development' && this.shouldLog(level)) {
      this.outputToConsole(entry)
    }
  }

  private outputToConsole(entry: LogEntry): void {
    const prefix = entry.context ? `[${entry.context}]` : ''
    const message = `${prefix} ${entry.message}`

    switch (entry.level) {
      case LogLevel.DEBUG:
        // eslint-disable-next-line no-console
        console.debug(message, entry.data || '')
        break
      case LogLevel.INFO:
        // eslint-disable-next-line no-console
        console.info(message, entry.data || '')
        break
      case LogLevel.WARN:
        // eslint-disable-next-line no-console
        console.warn(message, entry.data || '')
        break
      case LogLevel.ERROR:
        // eslint-disable-next-line no-console
        console.error(message, entry.data || '')
        break
    }
  }

  debug(message: string, context?: string, data?: any): void {
    this.addLog(LogLevel.DEBUG, message, context, data)
  }

  info(message: string, context?: string, data?: any): void {
    this.addLog(LogLevel.INFO, message, context, data)
  }

  warn(message: string, context?: string, data?: any): void {
    this.addLog(LogLevel.WARN, message, context, data)
  }

  error(message: string, context?: string, data?: any): void {
    this.addLog(LogLevel.ERROR, message, context, data)
  }

  // Get recent logs for debugging
  getLogs(level?: LogLevel): LogEntry[] {
    if (level !== undefined) {
      return this.logs.filter(log => log.level >= level)
    }
    return [...this.logs]
  }

  // Clear all logs
  clearLogs(): void {
    this.logs = []
  }

  // Set log level
  setLevel(level: LogLevel): void {
    this.logLevel = level
  }
}

// Create and export singleton logger instance
export const logger = new Logger(
  process.env.NODE_ENV === 'development' ? LogLevel.DEBUG : LogLevel.WARN
)

// Export default instance
export default logger
