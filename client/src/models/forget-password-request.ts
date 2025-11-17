/**
 * Forget password request model.
 */
export interface ForgetPasswordRequest {
  /**
   * User's email address to send the password reset link to.
   */
  emailAddress: string;
}
