import { GroupMemberState } from './group-member-state';

/**
 * Contains necessary information to present the group state.
 * Corresponds to GroupStateDto in the backend.
 */
export interface GroupState {
  /**
   * Gets or sets the unique identifier of the group.
   */
  id: string;

  /**
   * Gets or sets the title of the group.
   */
  title: string;

  /**
   * Gets or sets the description of the group.
   */
  description: string;

  /**
   * Gets or sets a value indicating whether module completion is required 
   * before progressing in the group context.
   */
  waitModuleCompletion: boolean;

  /**
   * Indicates whether the order of group members is locked.
   * If it is locked, exam takers cannot launch modules out of order.
   */
  isMemberOrderLocked: boolean;

  /**
   * Group member entities with their current states
   */
  groupMembers: GroupMemberState[];
}
