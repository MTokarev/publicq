import { AssignmentBase } from './assignment-base';

/**
 * Data Transfer Object for updating an existing assignment.
 */
export interface AssignmentUpdate extends AssignmentBase {
  /**
   * The unique identifier for the assignment to update.
   */
  id: string;
}
