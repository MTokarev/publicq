/**
 * Student-safe possible answer to be presented in an exam session.
 * This interface is intended for use by exam takers and excludes any sensitive information
 * like whether the answer is correct or not.
 */
export interface ExamTakerPossibleAnswer {
  /**
   * Question possible answer identifier.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  id: string;
  
  /**
   * A possible answer text for a question.
   * @maxLength 2000 characters (aligned with backend constraint)
   */
  text: string;
  
  /**
   * Optional list of static file URLs (e.g., answer illustrations).
   */
  staticFileUrls?: string[];
  
  /**
   * Optional list of static file IDs (e.g., answer illustrations).
   */
  staticFileIds?: string[];
}
