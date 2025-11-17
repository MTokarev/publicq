/**
 * Represents a single log entry from the database
 */
export interface LogEntry {
  /**
   * Unique identifier for the log entry
   */
  id: number;

  /**
   * When the log was created (UTC timestamp)
   */
  timestamp: Date | string;

  /**
   * Log level (Debug, Information, Warning, Error, Critical)
   * @maxLength 50 characters (aligned with backend constraint)
   */
  level: string;

  /**
   * Logger category (usually the class name that created the log)
   * @maxLength 255 characters (aligned with backend constraint)
   */
  category?: string | null;

  /**
   * The actual log message
   * @maxLength 2000 characters (aligned with backend constraint)
   */
  message: string;

  /**
   * Exception details if any
   * @maxLength 5000 characters (aligned with backend constraint)
   */
  exception?: string | null;

  /**
   * ID of the user who was logged in when this log was created
   * @maxLength 450 characters (aligned with backend constraint)
   */
  userId?: string | null;

  /**
   * Email of the user who was logged in when this log was created
   * @maxLength 256 characters (aligned with backend constraint)
   */
  userEmail?: string | null;

  /**
   * Unique identifier for the HTTP request
   * @maxLength 100 characters (aligned with backend constraint)
   */
  requestId?: string | null;

  /**
   * Name of the server/machine that generated the log
   * @maxLength 100 characters (aligned with backend constraint)
   */
  machineName?: string | null;
};
