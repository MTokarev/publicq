import axios from '../api/axios';
import { AccessToken } from '../models/accessToken';
import { GenericOperationStatuses } from '../models/GenericOperationStatuses';
import { LoginRequest } from '../models/loginRequest';
import { UserCreateRequest } from '../models/userCreateRequest';
import { ResponseWithData } from '../models/responseWithData';

export const authService = {
  login: (credentials: LoginRequest) => axios.post<ResponseWithData<string, GenericOperationStatuses>>('/users/login', credentials)
    .then(r => r.data.data),
  register: (request: UserCreateRequest) => axios.post<ResponseWithData<AccessToken, GenericOperationStatuses>>('/users/register', request)
    .then(r => r.data.data)
};