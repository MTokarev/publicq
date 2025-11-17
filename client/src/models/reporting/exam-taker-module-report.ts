import { ModuleStatus } from '../module-status';

/**
 * Module report details for an exam taker
 */
export interface ExamTakerModuleReport {
  /**
   * Module identifier
   */
  moduleId: string;

  /**
   * Module title
   */
  moduleTitle: string;

  /**
   * Student's status for this module
   */
  status: ModuleStatus;

  /**
   * Score achieved on this module
   */
  score?: number;

  /**
   * Whether the student passed this module
   */
  passed?: boolean;

  /**
   * When the student started this module
   */
  startedAtUtc?: string;

  /**
   * When the student completed this module
   */
  completedAtUtc?: string;

  /**
   * Time spent on this module (in minutes)
   */
  timeSpentMinutes: number;

  /**
   * Number of questions answered
   */
  answeredQuestions: number;

  /**
   * Total number of questions in the module
   */
  totalQuestions: number;

  /**
   * Passing score percentage for this module
   */
  passingScore?: number;
}
