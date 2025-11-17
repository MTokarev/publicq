import { UserRole } from '../models/UserRole';

export class UserPolicies {
  constructor(private userRoles: UserRole[]) {}

  /**
   * Check if user has any of the specified roles
   */
  hasAnyRole(roles: UserRole[]): boolean {
    return roles.some(role => this.userRoles.includes(role));
  }

  /**
   * Check if user has all of the specified roles
   */
  hasAllRoles(roles: UserRole[]): boolean {
    return roles.every(role => this.userRoles.includes(role));
  }

  /**
   * Check if user has a specific role
   */
  hasRole(role: UserRole): boolean {
    return this.userRoles.includes(role);
  }

  // Specific policy methods for your app
  canAccessReports(): boolean {
    return this.hasAnyRole([UserRole.ANALYST, UserRole.ADMINISTRATOR]);
  }

  canAccessModules(): boolean {
    return this.hasAnyRole([UserRole.ANALYST, UserRole.ADMINISTRATOR]);
  }

  canManageUsers(): boolean {
    return this.hasRole(UserRole.ADMINISTRATOR);
  }

  canManageGroups(): boolean {
    return this.hasAnyRole([UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMINISTRATOR]);
  }

  canManageAssignments(): boolean {
    return this.hasAnyRole([UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMINISTRATOR]);
  }

  canManageEmail(): boolean {
    return this.hasRole(UserRole.ADMINISTRATOR);
  }

  canAccessAdminPanel(): boolean {
    return this.hasAnyRole([UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ANALYST, UserRole.ADMINISTRATOR]);
  }

  // More granular permissions
  canCreateAssignments(): boolean {
    return this.hasAnyRole([UserRole.CONTRIBUTOR, UserRole.MODERATOR, UserRole.ADMINISTRATOR]);
  }

  canDeleteAssignments(): boolean {
    return this.hasAnyRole([UserRole.MODERATOR, UserRole.ADMINISTRATOR]);
  }

  canViewAnalytics(): boolean {
    return this.hasAnyRole([UserRole.ANALYST, UserRole.ADMINISTRATOR]);
  }
}

// Custom hook for using policies
export const useUserPolicies = (userRoles: UserRole[]) => {
  return new UserPolicies(userRoles);
};