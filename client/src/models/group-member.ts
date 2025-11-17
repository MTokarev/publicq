import { AssessmentModuleDto } from './assessment-module';

/**
 * Group member data transfer object
 */
export interface GroupMember {
  /**
   * Gets or sets the unique identifier of the group member.
   */
  id: string;
  
  /**
   * Gets or sets the identifier of the group this member belongs to.
   */
  groupId: string;
  
  /**
   * Gets or sets the order number of the member within the group.
   */
  orderNumber: number;

  /**
   * Assessment module identifier that this member is associated with.
   */
  assessmentModuleId: string;

  /**
   * Gets or sets the title of the assessment module that this member is associated with.
   */
  assessmentModuleTitle: string;

  /**
   * Gets or sets the description of the assessment module that this member is associated with.
   */
  assessmentModuleDescription: string;

  /**
   * Assessment module that this member is associated with.
   */
  assessmentModule?: AssessmentModuleDto;
}

/**
 * Group member creation data transfer object.
 */
export interface GroupMemberCreate {
  /**
   * Gets or sets the order number of the member within the group.
   */
  orderNumber: number;

  /**
   * Assessment module identifier that this member is associated with.
   */
  assessmentModuleId: string;
}
