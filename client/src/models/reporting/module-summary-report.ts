/**
 * Module summary report details
 */
export interface ModuleSummaryReport {
  /**
   * The unique identifier of the module
   */
  moduleId: string;

  /**
   * The title/name of the module
   */
  moduleTitle: string;

  /**
   * Description of the module
   */
  moduleDescription?: string;

  /**
   * Completion rate as a percentage (0-100)
   */
  completionRate: number;

  /**
   * Average score for this module
   */
  averageScore?: number;

  /**
   * Highest score achieved for this module
   */
  highestScore?: number;

  /**
   * Lowest score achieved for this module
   */
  lowestScore?: number;

  /**
   * Average time to complete this module (in minutes)
   */
  averageCompletionTimeMinutes?: number;

  /**
   * Total number of questions in this module
   */
  totalQuestions: number;
}
