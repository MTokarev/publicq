import axios from "../api/axios";
import { GenericOperationStatuses } from "../models/GenericOperationStatuses";
import { Response } from "../models/response";

export const CacheService = {
  clearAllCache: async (): Promise<Response<GenericOperationStatuses>> => {
    var response = await axios.post<Response<GenericOperationStatuses>>('/cache/clear');
    return response.data;
  },

  getCacheServiceHealth: async (connectionString: string): Promise<Response<GenericOperationStatuses>> => {
    var response = await axios.get<Response<GenericOperationStatuses>>('/cache/health', {
      params: {
        connectionString
      }
    });
    return response.data;
  }
};