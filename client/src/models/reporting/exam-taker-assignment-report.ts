import { ExamTakerModuleReport } from './exam-taker-module-report';

/**
 * Exam taker assignment report details
 */
export interface ExamTakerAssignmentReport {
  /**
   * Assignment identifier
   */
  assignmentId: string;

  /**
   * Gets or sets when students can start taking the assessment.
   * Students cannot access the assignment before this date and time.
   * All dates are stored in UTC to ensure consistent behavior across time zones.
   * The application layer should handle timezone conversion for display purposes.
   */
  assignmentStartDateUtc: string;

  /**
   * Gets or sets when the assignment expires (students can't start new attempts).
   * After this date, students can no longer begin the assignment, but can finish in-progress attempts.
   * Students who have already started before this deadline can typically continue,
   * depending on business rules implemented in the service layer.
   */
  assignmentEndDateUtc: string;

  /**
   * Assignment title
   */
  assignmentTitle: string;

  /**
   * When the student started this assignment
   */
  startedAtUtc?: string;

  /**
   * When the student completed this assignment
   */
  completedAtUtc?: string;

  /**
   * Time spent on this assignment (in minutes)
   */
  timeSpentMinutes: number;

  /**
   * Number of modules completed
   */
  completedModules: number;

  /**
   * Total number of modules in the assignment
   */
  totalModules: number;

  /**
   * Progress details for each module
   */
  moduleReports: ExamTakerModuleReport[];
}
