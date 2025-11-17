import { ModuleProgress } from './module-progress';
import { QuestionDto } from './assessment-module';

/**
 * Represents a student's response to a specific question within a module during an assignment.
 */
export interface QuestionResponse {
  /**
   * Gets or sets the unique identifier for this question response.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  id: string;

  /**
   * Gets or sets the selected answer IDs for multiple choice questions.
   */
  selectedAnswerIds?: string[];

  /**
   * Gets or sets the text response for free text questions.
   * @maxLength 5000 characters (aligned with backend constraint)
   */
  textResponse?: string;

  /**
   * Gets or sets the question type (SingleChoice, MultipleChoice, FreeText).
   */
  questionType?: string;

  /**
   * Gets or sets whether this response is correct based on automated evaluation.
   */
  isCorrect?: boolean;

  /**
   * Gets or sets when the response was submitted by the student.
   */
  respondedAtUtc: string;

  /**
   * Gets or sets the foreign key reference to the module progress this response belongs to.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  moduleProgressId: string;

  /**
   * Gets or sets the foreign key reference to the specific question being answered.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  questionId: string;

  /**
   * The module progress entity this response belongs to.
   */
  moduleProgress?: ModuleProgress;

  /**
   * The question entity being answered.
   */
  question?: QuestionDto;
}
