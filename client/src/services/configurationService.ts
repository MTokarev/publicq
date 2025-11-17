import axios from '../api/axios';
import { EmailOption } from "../models/email-option";
import { ApiResponse } from "../models/apiResponse";
import { ResponseWithData } from '../models/responseWithData';
import { AuthOptions } from '../models/auth-options';
import { GenericOperationStatuses } from '../models/GenericOperationStatuses';
import { Response } from '../models/response';
import { PasswordPolicyOptions } from '../models/password-policy-options';
import { CacheConfiguration } from '../models/cache-configuration';
import { LogConfiguration } from '../models/log-configuration';
import { FileStorageConfiguration } from '../models/file-storage-configuration';
import { SmtpOptions } from '../models/smtp-options';
import { IpRateLimitUpdateRequest } from '../models/ip-rate-limit-update-request';
import { IpRateLimitOptions } from '../models/ip-rate-limit-options';
import { LlmIntegrationOptions, OpenAIOptions } from '../models/llm-integration-options';
import { McpApiKeyOptions } from '../models/mcp-api-key-options';

export const configurationService = {
  getEmailOptions: async (): Promise<EmailOption> => {
    const response = await axios.get<ApiResponse<EmailOption>>('/configuration/email');
    return response.data.data;
  },

  setEmailOptions: async (options: EmailOption): Promise<EmailOption> => {
    const response = await axios.post<ApiResponse<EmailOption>>('/configuration/email', options);
    return response.data.data;
  },

  setSendgridOptions: async (apiKey: string): Promise<void> => {
    await axios.post('/configuration/sendgrid', { apiKey });
  },

  getSmtpOptions: async (): Promise<ResponseWithData<SmtpOptions, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<SmtpOptions, GenericOperationStatuses>>('/configuration/smtp');
    return response.data;
  },

  setSmtpOptions: async (options: SmtpOptions): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/smtp', options);
    return response.data;
  },

  getTokenOptions: async (): Promise<ResponseWithData<AuthOptions, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<AuthOptions, GenericOperationStatuses>>('/configuration/security/token');
    return response.data;
  },

  setTokenOptions: async (options: AuthOptions): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/security/token', options);
    return response.data;
  },

  getPasswordPolicy: async (): Promise<ResponseWithData<PasswordPolicyOptions, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<PasswordPolicyOptions, GenericOperationStatuses>>('/configuration/security/password');
    return response.data;
  },

  setPasswordPolicy: async (options: PasswordPolicyOptions): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/security/password', options);
    return response.data;
  },

  getCacheOptions: async (): Promise<ResponseWithData<CacheConfiguration, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<CacheConfiguration, GenericOperationStatuses>>('/configuration/cache');
    return response.data;
  },

  setCacheOptions: async (options: CacheConfiguration): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/cache', options);
    return response.data;
  },

  getLogOptions: async (): Promise<ResponseWithData<LogConfiguration, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<LogConfiguration, GenericOperationStatuses>>('/configuration/logging');
    return response.data;
  },

  setLogOptions: async (options: LogConfiguration): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/logging', options);
    return response.data;
  },

  getAttachmentMaxSizeKb: async (): Promise<ResponseWithData<FileStorageConfiguration, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<FileStorageConfiguration, GenericOperationStatuses>>('/configuration/file-storage');
    return response.data;
  },

  setAttachmentMaxSizeKb: async (maxSizeKb: number): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/file-storage', maxSizeKb, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  getSelfServiceRegistration: async (): Promise<ResponseWithData<boolean, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<boolean, GenericOperationStatuses>>('/configuration/security/user/registration');
    return response.data;
  },

  setSelfServiceRegistration: async (enabled: boolean): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/security/user/registration', enabled, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  },

  getIpRateLimitOptions: async (): Promise<ResponseWithData<IpRateLimitOptions, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<IpRateLimitOptions, GenericOperationStatuses>>('/configuration/ip-rate-limiting');
    return response.data;
  },

  updateIpRateLimitSettings: async (updateRequest: IpRateLimitUpdateRequest): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/ip-rate-limiting', updateRequest);
    return response.data;
  },

  getLlmIntegrationOptions: async (): Promise<ResponseWithData<LlmIntegrationOptions, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<LlmIntegrationOptions, GenericOperationStatuses>>('/configuration/llm-integration');
    return response.data;
  },
  
  setLlmIntegrationOptions: async (options: LlmIntegrationOptions): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/llm-integration', options);
    return response.data;
  },

  getOpenAIOptions: async (): Promise<ResponseWithData<OpenAIOptions, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<OpenAIOptions, GenericOperationStatuses>>('/configuration/llm-integration/openai');
    return response.data;
  },

  setOpenAIOptions: async (options: OpenAIOptions): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/llm-integration/openai', options);
    return response.data;
  },

  getMcpApiOptions: async (): Promise<ResponseWithData<McpApiKeyOptions, GenericOperationStatuses>> => {
    const response = await axios.get<ResponseWithData<McpApiKeyOptions, GenericOperationStatuses>>('/configuration/llm-integration/mcp-api-key');
    return response.data;
  },

  setMcpApiOptions: async (options: McpApiKeyOptions): Promise<Response<GenericOperationStatuses>> => {
    const response = await axios.post<Response<GenericOperationStatuses>>('/configuration/llm-integration/mcp-api-key', options);
    return response.data;
  }
};
