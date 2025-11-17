/**
 * System-wide summary report details for admin dashboard
 */
export interface SystemSummaryReport {
  /**
   * Total number of users in the system
   */
  totalUsers: number;

  /**
   * Total number of exam takers
   */
  totalExamTakers: number;

  /**
   * Total number of administrators
   */
  totalAdministrators: number;

  /**
   * Total number of groups created
   */
  totalGroups: number;

  /**
   * Total number of modules created
   */
  totalModules: number;

  /**
   * Total number of published modules
   */
  totalPublishedModules: number;

  /**
   * Total number of assignments created
   */
  totalAssignments: number;

  /**
   * Total number of active assignments
   */
  totalActiveAssignments: number;

  /**
   * Total number of questions across all modules
   */
  totalQuestions: number;

  /**
   * Total number of completed exam sessions
   */
  totalCompletedSessions: number;

  /**
   * Overall system average score
   */
  overallAverageScore?: number;

  /**
   * When this report was generated
   */
  generatedAtUtc: string;
}
