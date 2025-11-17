import { UserRole } from "./UserRole";

export const UserPolicies = {
  Admins: [UserRole.ADMINISTRATOR],
  Managers: [UserRole.MANAGER, UserRole.ADMINISTRATOR],
  Moderators: [UserRole.MODERATOR, UserRole.MANAGER, UserRole.ADMINISTRATOR],
  Analysts: [UserRole.ANALYST, UserRole.ADMINISTRATOR],
  Contributors: [UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.MANAGER, UserRole.ADMINISTRATOR],

  // Helper functions
  hasAnalystAccess: (userRoles: UserRole[]): boolean => {
    return UserPolicies.Analysts.some(role => userRoles.includes(role));
  },

  hasAdminAccess: (userRoles: UserRole[]): boolean => {
    return UserPolicies.Admins.some(role => userRoles.includes(role));
  },

  hasManagerAccess: (userRoles: UserRole[]): boolean => {
    return UserPolicies.Managers.some(role => userRoles.includes(role));
  },

  hasModeratorAccess: (userRoles: UserRole[]): boolean => {
    return UserPolicies.Moderators.some(role => userRoles.includes(role));
  },

  hasContributorAccess: (userRoles: UserRole[]): boolean => {
    return UserPolicies.Contributors.some(role => userRoles.includes(role));
  },

  // Generic helper function
  hasAccess: (policy: UserRole[], userRoles: UserRole[]): boolean => {
    return policy.some(role => userRoles.includes(role));
  }
};