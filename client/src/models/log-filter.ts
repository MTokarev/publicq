/**
 * Filter criteria for querying application logs
 */
export interface LogFilter {
  /**
   * Filter logs from this date (inclusive)
   */
  fromDate?: Date | string | null;

  /**
   * Filter logs until this date (inclusive)
   */
  toDate?: Date | string | null;

  /**
   * Filter by log level (Debug, Information, Warning, Error, Critical)
   */
  level?: string | null;

  /**
   * Filter by logger category (e.g., "PublicQ.API.Controllers.UserController")
   */
  category?: string | null;

  /**
   * Filter by user ID who triggered the log
   */
  userId?: string | null;

  /**
   * Filter by user email who triggered the log
   */
  userEmail?: string | null;

  /**
   * Filter by HTTP request ID to trace logs from a single request
   */
  requestId?: string | null;

  /**
   * Filter logs containing this text in the message
   */
  messageContains?: string | null;
}

/**
 * Default values for LogFilter
 */
export const defaultLogFilter: LogFilter = {
  fromDate: null,
  toDate: null,
  level: null,
  category: null,
  userId: null,
  userEmail: null,
  requestId: null,
  messageContains: null
};

/**
 * Available log levels
 */
export const LogLevels = {
  Debug: 'Debug',
  Information: 'Information',
  Warning: 'Warning',
  Error: 'Error',
  Critical: 'Critical',
} as const;

export type LogLevel = typeof LogLevels[keyof typeof LogLevels];

/**
 * Helper function to create a LogFilter with defaults
 */
export function createLogFilter(partial: Partial<LogFilter> = {}): LogFilter {
  return {
    ...defaultLogFilter,
    ...partial,
  };
}

/**
 * Convert LogFilter to URL query parameters
 */
export function logFilterToQueryParams(filter: LogFilter): Record<string, string> {
  const params: Record<string, string> = {};

  if (filter.fromDate) {
    params.fromDate = filter.fromDate instanceof Date 
      ? filter.fromDate.toISOString() 
      : filter.fromDate;
  }

  if (filter.toDate) {
    params.toDate = filter.toDate instanceof Date 
      ? filter.toDate.toISOString() 
      : filter.toDate;
  }

  if (filter.level) params.level = filter.level;
  if (filter.category) params.category = filter.category;
  if (filter.userId) params.userId = filter.userId;
  if (filter.userEmail) params.userEmail = filter.userEmail;
  if (filter.requestId) params.requestId = filter.requestId;
  if (filter.messageContains) params.messageContains = filter.messageContains;
  

  return params;
}

/**
 * Convert URL query parameters to LogFilter
 */
export function queryParamsToLogFilter(params: URLSearchParams): LogFilter {
  return {
    fromDate: params.get('fromDate') || null,
    toDate: params.get('toDate') || null,
    level: params.get('level') || null,
    category: params.get('category') || null,
    userId: params.get('userId') || null,
    userEmail: params.get('userEmail') || null,
    requestId: params.get('requestId') || null,
    messageContains: params.get('messageContains') || null,
  };
}