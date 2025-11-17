import { GroupMember } from "./group-member";
import { ModuleStatus } from "./module-status";

export interface GroupMemberState extends GroupMember {
  id: string;
  name: string;
  status: ModuleStatus | string; // Backend sends string representation of enum
  
  /**
   * Gets or sets when the student started this module.
   * Tracks the beginning of the student's work on this specific module.
   * 
   * A UTC DateTime representing when the student first accessed this module,
   * or null if the module has not yet been started.
   * 
   * This timestamp is set when the student first navigates to or begins working on the module.
   * Used for progress tracking, analytics, and determining time spent on modules.
   * All timestamps are stored in UTC for consistency across time zones.
   */
  startedAtUtc?: string;

  /** Indicates if the student has passed the module based on scoring criteria. */
  passed?: boolean;

  /** Minimum score percentage required to pass the module. */
  passingScorePercentage?: number;
  
  /** The student's score as a percentage (0 to 100) for the module. */
  scorePercentage?: number;
  
  /**
   * Gets or sets when the module was completed by the student.
   * Marks the successful completion of all requirements for this module.
   * 
   * A UTC DateTime representing when the student completed this module,
   * or null if the module is not yet completed.
   * 
   * This timestamp is set when the student finishes the module, typically after
   * answering all questions and meeting any completion criteria.
   * Used for progress tracking, completion reporting, and calculating completion duration.
   */
  completedAtUtc?: string;
  
  /**
   * Duration in minutes. Represents how much time is allowed for the test.
   */
  durationInMinutes?: number;

  /**
   * Remaining time calculated by server as TimeSpan (e.g., "00:45:30").
   * Null if not started or no duration limit. "00:00:00" if expired.
   */
  timeRemaining?: string | null;

  /**
   * Static file URLs associated with the module.
   */
  staticFileUrls?: string[];
}