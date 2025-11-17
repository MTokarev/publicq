import axios from '../api/axios';
import { PaginatedResponse } from '../models/paginatedResponse';
import { Response } from '../models/response';
import { ResponseWithData } from '../models/responseWithData';
import { UserCreateRequest } from '../models/userCreateRequest';
import { AccessToken } from '../models/accessToken';
import { GenericOperationStatuses } from '../models/GenericOperationStatuses';
import { ExamTakerCreateRequest } from '../models/exam-taker-create-request';
import { UserRoleAssignmentRequest } from '../models/user-role-assignment-request';
import { UserRole } from '../models/UserRole';
import { User } from '../models/user';
import { ExamTakerImport } from '../models/exam-taker-import';
import { ResetPasswordRequest } from '../models/reset-password-request';
import { CheckPasswordTokenRequest } from '../models/check-password-token-request';
import { UserCreateByAdminRequest } from '../models/userCreateByAdminRequest';

export const userService = {
  fetchUsers: async (pageNumber: number, pageSize: number): Promise<ResponseWithData<PaginatedResponse<User>>> => {
    const r = await axios.get<ResponseWithData<PaginatedResponse<User>>>('/users', {
      params: { pageNumber, pageSize },
    });
    return r.data;
  },

  searchUsers: async (emailPart: string, idPart: string, pageNumber: number, pageSize: number): Promise<ResponseWithData<PaginatedResponse<User>>> => {
    const params = {
      ...(emailPart ? { emailPart } : {}),
      ...(idPart ? { idPart } : {}),
      pageNumber,
      pageSize,
    };
    const r = await axios.get<ResponseWithData<PaginatedResponse<User>>>('/users/search', {
      params,
    });
    return r.data;
  },

  getExamTaker: async (userId: string): Promise<ResponseWithData<User, GenericOperationStatuses>> => {
    const r = await axios.get<ResponseWithData<User, GenericOperationStatuses>>(`/users/exam-taker/${userId}`);
    return r.data;
  },

  createUser: async (request: UserCreateRequest): Promise<AccessToken> => {
    const r = await axios.post<ResponseWithData<AccessToken, GenericOperationStatuses>>('/users/register', request);
    return r.data.data;
  },

  // This method doesn't return access token in the response
  createUserByAdmin: async (request: UserCreateByAdminRequest): Promise<Response<GenericOperationStatuses>> => {
    const r = await axios.post<Response<GenericOperationStatuses>>('/users/register-by-admin', request);
    return r.data;
  },

  createExamTakerByAdmin: async (request: ExamTakerCreateRequest): Promise<ResponseWithData<User, GenericOperationStatuses>> => {
    const r = await axios.post<ResponseWithData<User, GenericOperationStatuses>>('/users/exam-taker/register-by-admin', request);
    return r.data;
  },

  resetPasswordByAdmin: async (email: string, password: string): Promise<Response> => {
    const request = {
      email: email,
      password: password
    }
    const r = await axios.patch<Response>('/users/reset-password-by-admin', request);
    return r.data;
  },

  deleteUser: async (userId: string): Promise<Response> => {
    const r = await axios.delete<Response>(`/users/${userId}`);
    return r.data;
  },
  
  getTotalUsers: async (): Promise<ResponseWithData<number>> => {
    const r = await axios.get<ResponseWithData<number>>('/users/total');
    return r.data;
  },

  getUserRoles: async (userId: string): Promise<ResponseWithData<UserRole[], GenericOperationStatuses>> => {
    const r = await axios.get<ResponseWithData<UserRole[], GenericOperationStatuses>>(`/users/${userId}/roles`);
    return r.data;
  },

  assignUserRole: async (request: UserRoleAssignmentRequest): Promise<Response<GenericOperationStatuses>> => {
    const r = await axios.post<Response<GenericOperationStatuses>>('/users/roles', request);
    return r.data;
  },

  unassignUserRole: async (request: UserRoleAssignmentRequest): Promise<Response<GenericOperationStatuses>> => {
    const r = await axios.delete<Response<GenericOperationStatuses>>('/users/roles', { data: request });
    return r.data;
  },

  importExamTakers: async (examTakers: ExamTakerImport[]): Promise<ResponseWithData<User[], GenericOperationStatuses>> => {
    const r = await axios.post<ResponseWithData<User[], GenericOperationStatuses>>('/users/exam-taker/import', examTakers);
    return r.data;
  },

  forgetPassword: async (email: string): Promise<Response<GenericOperationStatuses>> => {
    const request = { emailAddress: email };
    const r = await axios.post<Response<GenericOperationStatuses>>('/users/password/forget', request);
    return r.data;
  },

  resetPassword: async (request: ResetPasswordRequest): Promise<ResponseWithData<string, GenericOperationStatuses>> => {
    const r = await axios.post<ResponseWithData<string, GenericOperationStatuses>>('/users/password/reset', request);
    return r.data;
  },

  checkResetToken: async (request: CheckPasswordTokenRequest): Promise<Response<GenericOperationStatuses>> => {
    const r = await axios.post<Response<GenericOperationStatuses>>('/users/password/reset/token/validate', request);
    return r.data;  
  },

  downloadSampleCsv: (): void => {
    const csvContent = [
      // Header
      'id,name (Required),email,date_of_birth,assignment_id',
      // Sample data with auto-generated IDs (empty id column)
      ',"Mikhail T","mt@example.com","1982-05-15",',
      ',"Nikki","nikki@example.com","1987-08-22",',
      ',"Bob Wilson","bob.wilson@example.com","1988-12-03",',
      // Sample data with custom IDs
      'STUD001,"Alice Johnson","alice.johnson@example.com","1995-01-10",',
      'STUD002,"Charlie Brown","charlie.brown@example.com","1993-07-18",',
      // Sample with assignment ID
      ',"Diana Prince","diana.prince@example.com","1985-03-25","123e4567-e89b-12d3-a456-426614174000"',
      // Minimal example (just name, no optional fields)
      ',"Eve Adams",,,',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'exam_takers_sample.csv');
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    URL.revokeObjectURL(url);
  }
};