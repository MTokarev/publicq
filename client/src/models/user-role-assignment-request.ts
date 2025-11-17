import { UserRole } from "./UserRole";

/**
 * Interface representing a request to assign a role to a user.
 */
export interface UserRoleAssignmentRequest {
  /** The unique identifier of the user to whom the role is being assigned. */
  userId: string;

  /** The role to be assigned to the user. */
  role: UserRole;
}