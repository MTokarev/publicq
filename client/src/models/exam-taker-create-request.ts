export interface ExamTakerCreateRequest {
  /**
   * Optional: Unique identifier for the exam taker
   * If not provided, a new identifier will be generated.
   * Format XXXX-XXXX where x is a Alphanumeric character in Uppercase
   */
  id?: string;
  fullName: string; /** @maxLength 100 characters (aligned with backend constraint) */
  email?: string; /** @maxLength 254 characters (aligned with backend constraint) */
  /**
   * Optional: Date of birth in ISO date string format (YYYY-MM-DD)
   */
  dateOfBirth?: string;
}