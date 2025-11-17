/**
 * Password policy configuration options
 */
export interface PasswordPolicyOptions {
  /**
   * Required length of the password
   */
  requiredLength: number;
  
  /**
   * Require digit in the password
   */
  requireDigit: boolean;
  
  /**
   * Require uppercase letter in the password
   */
  requireUppercase: boolean;
  
  /**
   * Require lowercase letter in the password
   */
  requireLowercase: boolean;
  
  /**
   * Require non-alphanumeric character in the password
   */
  requireNonAlphanumeric: boolean;
}