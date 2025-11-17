import { ExamTakerAssignmentReport } from './exam-taker-assignment-report';

/**
 * Exam taker progress report details
 */
export interface ExamTakerReport {
  /**
   * The unique identifier of the student
   */
  studentId: string;

  /**
   * Student's display name
   */
  displayName: string;

  /**
   * Total number of assignments assigned to this student
   */
  totalAssignments: number;

  /**
   * Number of assignments completed by this student
   */
  completedAssignments: number;

  /**
   * Number of assignments in progress
   */
  inProgressAssignments: number;

  /**
   * Number of assignments not yet started
   */
  notStartedAssignments: number;

  /**
   * Overall average score across all assignments
   */
  overallAverageScore?: number;

  /**
   * Total time spent on all assignments (in minutes)
   */
  totalTimeSpentMinutes: number;
  
  /**
   * Detailed progress for each assignment
   */
  assignmentProgress: ExamTakerAssignmentReport[];
}
