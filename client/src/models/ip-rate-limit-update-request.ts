/**
 * Update request model for IP rate limiting settings.
 */
export interface IpRateLimitUpdateRequest {
  
  /** Whether IP rate limiting is enabled or disabled. */
  enabled: boolean;

  /**
   * A list of IP addresses (v4 and v6) that are exempt from rate limiting.
   */
  ipWhitelist: string[];

  /**
   * Header used to determine the real client IP when behind a proxy.
   */
  realIpHeader: string;

  /**
   * API calls limit for the specified period.
   */
  limit: number;

  /**
   * Period for the rate limit in seconds.
   */
  periodInSeconds: number;
}

/**
 * Default IP rate limit update request values.
 */
export const defaultIpRateLimitUpdateRequest: IpRateLimitUpdateRequest = {
  enabled: true,
  ipWhitelist: [],
  realIpHeader: "X-Real-IP",
  limit: 100,
  periodInSeconds: 60
};