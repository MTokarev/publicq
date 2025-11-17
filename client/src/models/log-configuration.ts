/**
 * Log configuration model for managing application logging settings.
 */
export interface LogConfiguration {
  /**
   * True if database logging is enabled, otherwise false
   */
  enable: boolean;

  /**
   * Log level threshold for logging to the database.
   * Only logs at or above this level will be stored.
   */
  logLevel: LogLevel;
  
  /**
   * Maximum number of days to retain stored logs in the database.
   * Logs older than this period will be automatically purged.
   */
  retentionPeriodInDays: number;
}

/**
 * Log levels for categorizing log entries.
 * Ordered from least to most severe.
 */
export enum LogLevel {
  /**
   * Debug level for detailed diagnostic information.
   */
  Debug = 'Debug',
  
  /**
   * Information level for general operational entries about application progress.
   */
  Information = 'Information',
  
  /**
   * Warning level for potentially harmful situations.
   */
  Warning = 'Warning',
  
  /**
   * Error level for error events that might still allow the application to continue running.
   */
  Error = 'Error',
  
  /**
   * Critical level for severe error events that will presumably lead the application to abort.
   */
  Critical = 'Critical'
}

/**
 * Default values for LogConfiguration
 */
export const defaultLogConfiguration: LogConfiguration = {
  enable: true,
  logLevel: LogLevel.Information,
  retentionPeriodInDays: 30
};

/**
 * Helper function to create a LogConfiguration with defaults
 */
export function createLogConfiguration(partial: Partial<LogConfiguration> = {}): LogConfiguration {
  return {
    ...defaultLogConfiguration,
    ...partial,
  };
}

/**
 * Get all available log levels as an array
 */
export function getLogLevels(): LogLevel[] {
  return Object.values(LogLevel);
}
