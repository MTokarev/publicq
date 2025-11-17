/**
 * Reset password request model.
 */
export interface ResetPasswordRequest {
  /**
   * User's email address.
   */
  email: string;
  
  /**
   * User's password reset token.
   */
  token: string;
  
  /**
   * User's new password.
   */
  newPassword: string;
}
