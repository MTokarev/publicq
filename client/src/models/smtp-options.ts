/**
 * SMTP configuration options for email delivery
 */
export interface SmtpOptions {
  /**
   * SMTP host address
   */
  smtpHost: string;

  /**
   * SMTP port number
   */
  smtpPort: number;

  /**
   * Optional: username for SMTP authentication
   */
  userName?: string;

  /**
   * Optional: password for SMTP authentication
   */
  password?: string;

  /**
   * Use STARTTLS if the server supports it
   */
  useStartTls: boolean;

  /**
   * Use SSL to connect to the SMTP server
   */
  useSsl: boolean;
}