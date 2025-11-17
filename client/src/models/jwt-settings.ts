/**
 * Represent JWT token configuration
 */
export interface JwtSettings {
  /**
   * The main secret for sign all tokens
   * Keep this secret safe and do not expose it in your code.
   */
  secret: string;
  
  /**
   * Token Issuer
   */
  issuer: string;
  
  /**
   * Token Audience
   */
  audience: string;
  
  /**
   * Optional: Token expiration time in minutes
   * Default value is loaded from the service configuration
   */
  tokenExpiryMinutes?: number;
}