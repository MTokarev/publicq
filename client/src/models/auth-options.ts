import { JwtSettings } from './jwt-settings';

/**
 * Represent JWT token configuration
 */
export interface AuthOptions {
  /**
   * JWT token settings
   */
  jwtSettings: JwtSettings;
}