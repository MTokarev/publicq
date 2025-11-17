import { QuestionType } from "./question-types";
import { ExamTakerPossibleAnswer } from "./exam-taker-possible-answer";

/**
 * Student-safe question representation for exam sessions.
 */
export interface ExamTakerQuestion {
  /**
   * Question identifier.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  id: string;
  
  /**
   * Question text that will be presented to the user.
   * @maxLength 5000 characters (aligned with backend constraint)
   */
  text: string;
  
  /**
   * Question type, indicating how the question should be answered (e.g., single choice, multiple choice, free text).
   */
  type: QuestionType;
  
  /**
   * Optional: list of static file IDs (e.g., images, diagrams) associated with the question.
   */
  staticFileIds?: string[];
  
  /**
   * Optional: list of static file URLs (e.g., images, diagrams) associated with the question.
   */
  staticFileUrls?: string[];
  
  /**
   * List of possible answers for the question. Each answer excludes correct answer information.
   */
  answers: ExamTakerPossibleAnswer[];
}
