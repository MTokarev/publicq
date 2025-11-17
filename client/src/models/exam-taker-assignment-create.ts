import { ExamTakerAssignmentBase } from './exam-taker-assignment-base';

/**
 * Exam taker assignment creation data transfer object.
 */
export interface ExamTakerAssignmentCreate extends ExamTakerAssignmentBase {
  /**
   * Exam taker unique identifier.
   */
  examTakerId: string;
}
