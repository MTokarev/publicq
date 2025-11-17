/**
 * Update Redis configuration request model.
 */
export interface CacheConfiguration {
  /**
   * True if caching service enabled, otherwise - false
   */
  enable: boolean;

  /**
   * Connection string to the caching service.
   */
  connectionString: string;
  
  /**
   * Key prefix to use for all cache entries.
   */
  keyPrefix: string;
  
  /**
   * For how long reports should be in the cache in minutes
   */
  reportCacheDurationInMinutes: number;
}