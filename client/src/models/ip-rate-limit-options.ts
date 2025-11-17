/**
 * IP rate limiting configuration options.
 */
export interface IpRateLimitOptions {
  /**
   * Enable endpoint rate limiting.
   */
  enableEndpointRateLimiting: boolean;

  /**
   * Stack blocked requests.
   */
  stackBlockedRequests: boolean;

  /**
   * HTTP status code to return when rate limit is exceeded.
   */
  httpStatusCode: number;

  /**
   * Header used to determine the real client IP when behind a proxy.
   */
  realIpHeader: string;

  /**
   * A list of IP addresses (v4 and v6) that are exempt from rate limiting.
   */
  ipWhitelist: string[];

  /**
   * A list of endpoint patterns that are exempt from rate limiting.
   */
  endpointWhitelist: string[];

  /**
   * General rate limiting rules applied to all endpoints.
   */
  generalRules: RateLimitRule[];

  /**
   * Rate limiting rules for specific endpoints.
   */
  rules: RateLimitRule[];
}

/**
 * Rate limiting rule configuration.
 */
export interface RateLimitRule {
  /**
   * Endpoint pattern (e.g., "*", "/api/*", "/api/users").
   */
  endpoint: string;

  /**
   * Time period for the rate limit (e.g., "1s", "1m", "1h").
   */
  period: string;

  /**
   * Maximum number of requests allowed in the specified period.
   */
  limit: number;
}

/**
 * Default IP rate limiting options.
 */
export const defaultIpRateLimitOptions: IpRateLimitOptions = {
  enableEndpointRateLimiting: false,
  stackBlockedRequests: false,
  httpStatusCode: 429,
  realIpHeader: "X-Real-IP",
  ipWhitelist: [],
  endpointWhitelist: [],
  generalRules: [],
  rules: []
};