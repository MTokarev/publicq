import { CONSTANTS } from '../constants/contstants';
import { jwtDecode } from 'jwt-decode';
import { UserRole } from '../models/UserRole';
import { User } from '../models/user';
import { ExamTakerState } from '../models/exam-taker-state';

export type CurrentUser = User | ExamTakerState;

interface DecodedToken {
  sub: string;
  unique_name?: string;
  email?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'?: string;
  'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'?: string;
  'http://schemas.microsoft.com/ws/2008/06/identity/claims/role'?: string | string[];
  exp: number;
  iat?: number;
  iss?: string;
  aud?: string;
}

export const getTokenRoles = (): UserRole[] => {
  try {
    const token = localStorage.getItem(CONSTANTS.TOKEN_VARIABLE_NAME);
    if (!token) return [];

    const decoded = jwtDecode<DecodedToken>(token);
    
    // Get roles from Microsoft claims format
    const rolesClaimKey = 'http://schemas.microsoft.com/ws/2008/06/identity/claims/role';
    const rolesClaim = decoded[rolesClaimKey];
    
    if (!rolesClaim) {
      return [];
    }
    
    // Handle both single role (string) and multiple roles (array)
    const rolesArray = Array.isArray(rolesClaim) ? rolesClaim : [rolesClaim];
    
    const roles = rolesArray
      .map((role: string) => {
        // Find the enum value that matches the role string
        const enumKey = Object.keys(UserRole).find(key => UserRole[key as keyof typeof UserRole] === role);
        return enumKey ? UserRole[enumKey as keyof typeof UserRole] : undefined;
      })
      .filter((role): role is UserRole => role !== undefined);
    
    return roles;
  } catch (error) {
    return [];
  }
}

export const getUserInformation = (): User => {
  var token = localStorage.getItem(CONSTANTS.TOKEN_VARIABLE_NAME);
  if (!token) {
    throw new Error('User is not authenticated');
  }

  const decoded = jwtDecode<DecodedToken>(token);
  return {
    id: decoded.sub,
    email: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress'] || decoded.email || '',
    fullName: decoded['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name'] || decoded.unique_name || '',
    hasCredential: true,
  };
};

export const getTokenUserId = (): string | undefined => {
  try {
    const token = localStorage.getItem(CONSTANTS.TOKEN_VARIABLE_NAME);
    if (!token) return undefined;

    const decoded = jwtDecode<DecodedToken>(token);
    return decoded.sub;
  } catch (error) {
    return undefined;
  }
};

export const hasRole = (requiredRole: UserRole): boolean => {
  const roles = getTokenRoles();
  return roles.includes(requiredRole);
}
