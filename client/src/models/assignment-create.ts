import { AssignmentBase } from './assignment-base';

/**
 * Data Transfer Object for creating a new assignment, extending the base assignment properties.
 */
export interface AssignmentCreate extends AssignmentBase {
  /**
   * Gets or sets the collection of student assignments linking specific exam takers to this assignment.
   * Represents which students have been assigned to complete this assessment.
   */
  examTakerIds: string[];

  /**
   * Gets or sets the foreign key reference to the group containing the assessment modules.
   * Links this assignment to a specific group of modules that students must complete.
   * The group defines the sequence and configuration of modules students must complete.
   * Changing this reference effectively changes the entire content of the assignment.
   */
  groupId: string;
}
