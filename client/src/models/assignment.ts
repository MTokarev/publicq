import { Group } from './group';
import { ExamTakerAssignment } from './exam-taker-assignment';

/**
 * Base assignment data transfer object with common properties.
 */
export interface AssignmentBase {
  /**
   * Gets or sets the title/name of the assignment.
   * This is the display name shown to students and administrators.
   */
  title: string;

  /**
   * Gets or sets the optional description/instructions for students.
   * Provides detailed information about what students should expect or prepare for.
   */
  description?: string;

  /**
   * Server's current UTC time. Use this instead of new Date() for date comparisons
   * to prevent clock manipulation vulnerabilities.
   */
  serverUtcNow?: string;

  /**
   * Gets or sets when students can start taking the assessment.
   * Students cannot access the assignment before this date and time.
   */
  startDateUtc: string;

  /**
   * Gets or sets when the assignment expires (students can't start new attempts).
   * After this date, students can no longer begin the assignment, but can finish in-progress attempts.
   */
  endDateUtc: string;

  /**
   * Gets or sets whether to show results immediately after completion.
   * Controls student access to their scores and feedback upon assignment completion.
   */
  showResultsImmediately: boolean;

  /**
   * Gets or sets whether to randomize question order within modules.
   * When enabled, questions are presented in random order to reduce cheating opportunities.
   */
  randomizeQuestions: boolean;

  /**
   * Gets or sets whether to randomize answers' order within question.
   * When enabled, answers are presented in random order to reduce cheating opportunities.
   */
  randomizeAnswers: boolean;

  /**
   * Gets or sets the foreign key reference to the group containing the assessment modules.
   */
  groupId: string;
}

/**
 * Assignment data transfer object that represents an assignment of a group to students.
 */
export interface Assignment extends AssignmentBase {
  /**
   * Gets or sets the unique identifier for this assignment.
   */
  id: string;

  /**
   * Gets or sets the title of the group containing the assessment modules.
   */
  groupTitle: string;

  /**
   * Gets or sets the assignment status, indicating whether it's published and visible to students.
   */
  isPublished: boolean;

  /**
   * Gets or sets the user ID of the administrator who created this assignment.
   */
  createdByUserId: string;

  /**
   * Gets or sets the user who created this assignment.
   */
  createdByUser: string;

  /**
   * Gets or sets the user ID of the administrator who last updated this assignment.
   */
  updatedByUserId: string;

  /**
   * Gets or sets the user who last updated this assignment.
   */
  updatedByUser?: string;

  /**
   * Gets or sets when this assignment was created.
   */
  createdAtUtc: string;

  /**
   * Gets or sets when this assignment was last updated.
   */
  updatedAtUtc?: string;

  /**
   * The group entity containing the assessment modules for this assignment.
   */
  group?: Group;

  /**
   * The collection of student assignments linking specific exam takers to this assignment.
   */
  examTakerAssignments?: ExamTakerAssignment[];
}

/**
 * Data Transfer Object for creating a new assignment.
 */
export interface AssignmentCreate extends AssignmentBase {
  /**
   * Gets or sets the collection of user IDs for students assigned to this assignment.
   * This field is optional during creation - exam takers can be added later via separate operations.
   */
  examTakerIds?: string[];
}

/**
 * Data Transfer Object for updating an existing assignment.
 */
export interface AssignmentUpdate extends AssignmentBase {
  /**
   * The unique identifier for the assignment to update.
   */
  id: string;
}
