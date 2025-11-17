import { ExamTakerQuestion } from "./exam-taker-question";

/**
 * Student-safe representation of an assessment module version.
 * This interface is intended for use by exam takers and excludes any sensitive information
 * like correct answers.
 */
export interface ExamTakerModuleVersion {
  /**
   * Module version identifier.
   */
  id: string;
  
  /**
   * Parent module identifier.
   */
  assessmentModuleId: string;
  
  /**
   * Module version number.
   */
  version: number;
  
  /**
   * Indicates whether this version should be published immediately.
   */
  isPublished: boolean;

  /**
   * Minimum percentage of correct answers required to pass the assessment.
   */
  passingScorePercentage: number;

  /**
   * Time allowed to complete the assessment, in minutes.
   */
  durationInMinutes: number;

  /**
   * Time when the test module was created.
   */
  createdAtUtc: string;
  
  /**
   * User ID of the creator.
   */
  createdByUserId: string;
  
  /**
   * Optional: Title of the test module.
   */
  title: string;
  
  /**
   * Optional: Description of the test module.
   */
  description: string;

  /**
   * Optional list of static file URLs to associate with this version (e.g., module-level images or documents).
   */
  staticFileUrls?: string[];
  
  /**
   * Optional list of static file IDs to associate with this version (e.g., module-level images or documents).
   */
  staticFileIds?: string[];

  /**
   * A list of questions included in this assessment module version.
   */
  questions: ExamTakerQuestion[];
}
