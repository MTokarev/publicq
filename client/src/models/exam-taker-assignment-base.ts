/**
 * Base exam taker assignment properties.
 */
export interface ExamTakerAssignmentBase {
  /**
   * Gets or sets the user ID of the exam taker (student) assigned to this assignment.
   */
  examTakerId: string;
}

/**
 * Exam taker assignment creation data transfer object.
 */
export interface ExamTakerAssignmentCreate extends ExamTakerAssignmentBase {
  // Inherits examTakerId from base
}
