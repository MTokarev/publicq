/**
 * Exam taker import data transfer object.
 * 
 * This DTO is used to do a bulk import and assign students to assignments.
 */
export interface ExamTakerImport {
  /**
   * Exam taker ID. Can be empty string - backend will auto-generate if empty.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  id: string;

  /**
   * Full name of the exam taker.
   * @maxLength 200 characters (aligned with backend constraint)
   */
  name: string;

  /**
   * Optional: Email address.
   * @maxLength 254 characters (aligned with backend constraint)
   */
  email?: string;

  /**
   * Optional: Date of birth in ISO date string format (YYYY-MM-DD).
   */
  dateOfBirth?: string;

  /**
   * Optional: Assignment ID to assign the exam taker to.
   */
  assignmentId?: string;
}

/**
 * Request object for importing exam takers.
 */
export interface ExamTakerImportRequest {
  /**
   * Array of exam takers to import.
   */
  examTakers: ExamTakerImport[];
}