import { UserCreateRequest } from './userCreateRequest';

/**
 * User registration request model by an admin (inherits from UserCreateRequest).
 */
export interface UserCreateByAdminRequest extends Omit<UserCreateRequest, 'password'> {
  /**
   * Password of the user.
   * This property is redefined to be nullable, as an admin might not set a password during registration.
   */
  password?: string;
}