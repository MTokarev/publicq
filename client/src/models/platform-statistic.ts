/**
 * Platform statistics model containing aggregate data about the platform
 */
export interface PlatformStatistic {
  /**
   * Total number of users in the platform
   */
  totalUsers: number;

  /**
   * Total number of groups in the platform
   */
  totalGroups: number;

  /**
   * Total number of assignments in the platform
   */
  totalAssignments: number;

  /**
   * Total number of modules in the platform
   */
  totalModules: number;

  /**
   * Total number of questions in the platform
   */
  totalQuestions: number;
}