export interface UserCreateRequest {
  email: string; /** @maxLength 254 characters (aligned with backend constraint) */
  fullName: string; /** @maxLength 100 characters (aligned with backend constraint) */
  password: string;
  dateOfBirth?: string; // Optional ISO date string
}