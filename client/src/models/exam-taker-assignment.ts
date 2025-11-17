import { Assignment } from "./assignment";
import { ExamTakerAssignmentBase } from "./exam-taker-assignment-base";
import { ModuleProgress } from "./module-progress";

/**
 * Exam taker assignment data transfer object that represents the assignment of a specific exam taker to a specific assignment.
 */
export interface ExamTakerAssignment extends ExamTakerAssignmentBase {
  /**
   * Gets or sets the unique identifier of the exam taker assignment.
   */
  id: string;

  /**
   * Gets or sets the foreign key reference to the assignment.
   */
  assignmentId: string;

  /**
   * The assignment entity this student is assigned to.
   */
  assignment?: Assignment;

  /**
   * The collection of module progress records for this student's assignment.
   */
  moduleProgress?: ModuleProgress[];
}