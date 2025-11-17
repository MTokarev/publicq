import { ExamTakerReport } from './exam-taker-report';

/**
 * Report details for an assignment
 */
export interface AssignmentReport {
  /**
   * The unique identifier of the assignment
   */
  assignmentId: string;

  /**
   * The title/name of the assignment
   */
  assignmentTitle: string;
  
  /**
   * The description of the assignment
   */
  assignmentDescription: string;

  /**
   * Total number of students assigned to this assignment
   */
  totalStudents: number;

  /**
   * Number of students who have completed all modules
   */
  completedStudents: number;

  /**
   * Number of students currently working on the assignment
   */
  inProgressStudents: number;

  /**
   * Number of students who haven't started yet
   */
  notStartedStudents: number;

  /**
   * Completion rate as a percentage (0-100)
   */
  completionRate: number;

  /**
   * Average score across all completed modules
   */
  averageScore?: number;

  /**
   * Average time taken to complete the assignment (in minutes)
   */
  averageCompletionTimeMinutes?: number;

  /**
   * When the assignment starts
   */
  startDateUtc: string;

  /**
   * When the assignment ends
   */
  endDateUtc: string;

  /**
   * Whether the assignment is currently active
   */
  isActive: boolean;
  
  /**
   * Exam taker progress details for this assignment
   */
  examTakerReports: ExamTakerReport[];
}