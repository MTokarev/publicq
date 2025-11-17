/**
 * Check password token request model.
 */
export interface CheckPasswordTokenRequest {
  /**
   * User's email address.
   */
  email: string;
  
  /**
   * User's password reset token.
   */
  token: string;
}