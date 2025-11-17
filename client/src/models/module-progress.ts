import { ExamTakerAssignment } from './exam-taker-assignment';
import { GroupMemberStateWithUserProgress } from './group-member-state-with-user-progress';
import { QuestionResponse } from './question-response';

/**
 * Represents a student's progress through a specific module within an assignment.
 */
export interface ModuleProgress {
  /**
   * Gets or sets the unique identifier for this module progress record.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  id: string;

  /**
   * Gets or sets when the student started this module.
   */
  startedAtUtc?: string;

  /**
   * Gets or sets when the module was completed by the student.
   */
  completedAtUtc?: string;

  /**
   * Remaining time calculated by server as TimeSpan (e.g., "00:45:30").
   * Null if not started or no duration limit. "00:00:00" if expired.
   */
  timeRemaining?: string | null;

  /**
   * Gets or sets the score achieved on this module as a percentage.
   */
  scorePercentage?: number;

  /**
   * Gets or sets whether this module attempt passed based on the module's passing criteria.
   */
  passed?: boolean;

  /**
   * Gets or sets the foreign key reference to the exam taker assignment.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  examTakerAssignmentId: string;

  /**
   * Gets or sets the identifier of the exam taker (student) working on this module.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  examTakerId: string;

  /**
   * Gets or sets the foreign key reference to the specific group member.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  groupMemberId: string;

  /**
   * Gets or sets the assessment module version ID for this progress record.
   * @maxLength 50 characters (aligned with backend constraint)
   */
  assessmentModuleVersionId: string;

  /**
   * The exam taker assignment entity this progress belongs to.
   */
  examTakerAssignment?: ExamTakerAssignment;

  /**
   * The group member entity representing this module within the assignment's group.
   */
  groupMember?: GroupMemberStateWithUserProgress;

  /**
   * The collection of individual question responses within this module.
   */
  questionResponses?: QuestionResponse[];
}
