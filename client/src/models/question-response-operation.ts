import { QuestionType } from './question-types';

/**
 * Question response data transfer object (DTO) used when a student submits their answer to a question.
 */
export interface QuestionResponseOperation {
  /**
   * Question ID that this response corresponds to
   */
  questionId: string;
  
  /**
   * For multiple choice/select questions: selected answer IDs.
   */
  selectedAnswerIds: string[];
  
  /**
   * Stores the question type at the time of response for validation.
   */
  questionType: QuestionType;

  /**
   * For text-based questions: the user's text response.
   */
  textResponse?: string;
  
  /**
   * Gets or sets when the response was submitted by the student.
   * Records the exact moment the student provided their answer to this question.
   * 
   * This timestamp is crucial for:
   * - Determining question-level timing and pace analytics
   * - Enforcing time limits on individual questions or modules
   * - Audit trails for academic integrity purposes
   * - Understanding student response patterns and behavior
   * All timestamps are stored in UTC for consistency across time zones.
   */
  respondedAtUtc: string;
}
