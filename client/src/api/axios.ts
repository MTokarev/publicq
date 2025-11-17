import axios from 'axios';
import { config } from '../config';
import { CONSTANTS } from '../constants/contstants';
import { getGlobalLogoutCallback } from '../context/AuthContext';
import { Response } from '../models/response';

// Utility function for exponential backoff delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for handling rate limits (OPTIONAL - must be used explicitly)
// Components should NOT use this by default to avoid automatic retries on 429
export const retryRequest = async (requestFn: () => Promise<any>, maxRetries: number = 3): Promise<any> => {
  let retries = 0;
  
  while (retries < maxRetries) {
    try {
      return await requestFn();
    } catch (error: any) {
      if (error.response?.status === 429 && retries < maxRetries - 1) {
        retries++;
        
        // Calculate delay from headers or use exponential backoff
        let delayMs = Math.pow(2, retries) * 1000; // 2s, 4s, 8s...
        
        if (error.response.headers['retry-after']) {
          delayMs = parseInt(error.response.headers['retry-after']) * 1000;
        } else if (error.response.headers['x-ratelimit-reset']) {
          delayMs = Math.max(0, parseInt(error.response.headers['x-ratelimit-reset']) - Date.now());
        }
        
        await delay(delayMs);
        continue;
      }
      
      throw error;
    }
  }
};

const api = axios.create({
  baseURL: config.apiBaseUrl, // Adjust if your API is at a different base path
});

// Add request interceptor to attach token
api.interceptors.request.use(
  config => {
    const token = localStorage.getItem(CONSTANTS.TOKEN_VARIABLE_NAME);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Don't redirect if this is a login attempt failure
      // Check if the request was to the login endpoint
      const isLoginRequest = error.config?.url?.includes('/users/login');
      
      if (!isLoginRequest) {
        // Only handle unauthorized access for authenticated requests, not login attempts
        const logout = getGlobalLogoutCallback();
        if (logout) {
          logout();
        } else {
          // Fallback: clear localStorage if callback isn't available
          localStorage.removeItem(CONSTANTS.TOKEN_VARIABLE_NAME);
        }
        // Handle unauthorized access, e.g., redirect to login
        window.location.href = '/login';
      }
    }
    
    // Handle rate limiting (Too Many Requests)
    // NOTE: We do NOT automatically retry here - components should handle 429 errors gracefully
    if (error.response?.status === 429) {
      const retryAfter = error.response.headers['retry-after'];
      const retryAfterMs = error.response.headers['x-ratelimit-reset'];
      
      // Create a more descriptive error message
      let message = 'Too many requests. Please slow down and try again.';
      
      if (retryAfter) {
        message += ` Please wait ${retryAfter} seconds before retrying.`;
      } else if (retryAfterMs) {
        const waitTime = Math.ceil((parseInt(retryAfterMs) - Date.now()) / 1000);
        if (waitTime > 0) {
          message += ` Please wait ${waitTime} seconds before retrying.`;
        }
      }



      // Transform 429 error to match standard response format
      const standardErrorResponse: Response<string> = {
        errors: [message],
        status: 'TooManyRequests',
        message: 'Rate limit exceeded',
        isSuccess: false,
        isFailed: true
      };

      // Create a new error that looks like a regular axios response error
      const transformedError = {
        ...error,
        response: {
          ...error.response,
          data: standardErrorResponse
        },
        isRateLimit: true,
        message,
        // Keep rate limit specific info for advanced handling
        retryAfter: retryAfter ? parseInt(retryAfter) : null,
        retryAfterMs: retryAfterMs ? parseInt(retryAfterMs) : null
      };

      return Promise.reject(transformedError);
    }
    
    return Promise.reject(error);
  }
);

export default api;