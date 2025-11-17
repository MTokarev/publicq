import { GroupMemberCreate } from "./group-member";
import { GroupMemberStateWithUserProgress } from "./group-member-state-with-user-progress";

/**
 * Base interface for group data transfer objects
 */
export interface GroupBase {
  /**
   * Gets or sets the title of the group.
   * @maxLength 200 characters (aligned with backend constraint)
   */
  title: string;

  /**
   * Gets or sets the description of the group.
   * @maxLength 5000 characters (aligned with backend constraint)
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
}

/**
 * Exam group data transfer object (DTO) that represents a group of modules
 */
export interface Group extends GroupBase {
  /**
   * Gets or sets the unique identifier of the group.
   */
  id: string;

  /**
   * Group member entities
   */
  groupMembers: GroupMemberStateWithUserProgress[];

  /**
   * Gets or sets the UTC timestamp when the group was updated.
   */
  updatedAtUtc: string;

  /**
   * Gets or sets the identifier of the user who created the group.
   */
  createdByUserId: string;

  /**
   * Gets or sets the user who created the group.
   */
  createdByUser: string;

  /**
   * Gets or sets the identifier of the user who updated the group.
   */
  updatedByUserId: string;

  /**
   * Gets or sets the UTC timestamp when the group was created.
   */
  createdAtUtc: string;
}

/**
 * DTO for creating a new group
 */
export interface GroupCreate extends GroupBase {
  /**
   * Initial group members to add to the group
   */
  groupMembers: GroupMemberCreate[];
}

/**
 * DTO for updating an existing group
 */
export interface GroupUpdate extends GroupBase {
  /**
   * Gets or sets the unique identifier of the group.
   */
  id: string;

  /**
   * Updated group members
   */
  groupMembers: GroupMemberStateWithUserProgress[];
}
