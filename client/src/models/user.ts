export interface User {
  /**
   * Unique identifier for the user.
   */
  id: string;

  /**
   * Email address of the user.
   * @maxLength 254 characters (aligned with backend constraint)
   */
  email: string;

  /**
   * Indicates if the user has valid credentials.
   * Exam takers don't have credentials and can access exams assigned to them.
   */
  hasCredential: boolean;

  /**
   * Optional: Full name of the user.
   * @maxLength 100 characters (aligned with backend constraint)
   */
  fullName?: string;

  /**
   * Optional: Date of birth of the user.
   */
  dateOfBirth?: string; // ISO date string
}