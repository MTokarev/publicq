import axios from '../api/axios';
import { GenericOperationStatuses } from '../models/GenericOperationStatuses';
import { LogEntry } from '../models/log-entry';
import { LogFilter } from '../models/log-filter';
import { PaginatedResponse } from '../models/paginatedResponse';
import { ResponseWithData } from '../models/responseWithData';

/**
 * Service for interacting with the logs API
 */
export const LogService = {

  /**
   * Get logs with filtering and pagination
   */
  async getLogs(pageNumber: number, pageSize: number, filter: LogFilter): Promise<ResponseWithData<PaginatedResponse<LogEntry>, GenericOperationStatuses>> {

    const params = this.buildParameters(filter);
    params.append('pageNumber', pageNumber.toString());
    params.append('pageSize', pageSize.toString());

    const response = await axios.get<ResponseWithData<PaginatedResponse<LogEntry>, GenericOperationStatuses>>('logs', {
      params
    });

    return response.data;
  },

  async exportLogs(filter: LogFilter): Promise<ResponseWithData<LogEntry[], GenericOperationStatuses>> {

    const params = this.buildParameters(filter);

    const response = await axios.get<ResponseWithData<LogEntry[], GenericOperationStatuses>>('logs/export', {
      params
    });

    return response.data;
  },

  buildParameters(filter: LogFilter): URLSearchParams {
    const params = new URLSearchParams();

    if (filter.messageContains) {
      params.append('filter.messageContains', filter.messageContains);
    }

    if (filter.fromDate) {
      // Convert to UTC ISO string for backend
      const utcDate = filter.fromDate instanceof Date 
        ? filter.fromDate.toISOString() 
        : new Date(filter.fromDate).toISOString();
      params.append('filter.fromDate', utcDate);
    }

    if (filter.toDate) {
      // Convert to UTC ISO string for backend
      const utcDate = filter.toDate instanceof Date 
        ? filter.toDate.toISOString() 
        : new Date(filter.toDate).toISOString();
      params.append('filter.toDate', utcDate);
    }

    if (filter.category) {
      params.append('filter.category', filter.category);
    }

    if (filter.userId) {
      params.append('filter.userId', filter.userId);
    }

    if (filter.userEmail) {
      params.append('filter.userEmail', filter.userEmail);
    }

    if (filter.requestId) {
      params.append('filter.requestId', filter.requestId);
    }

    if (filter.level) {
      params.append('filter.level', filter.level);
    }

    return params;
  }
};