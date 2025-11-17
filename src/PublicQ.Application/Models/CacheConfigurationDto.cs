namespace PublicQ.Application.Models;

/// <summary>
/// Update Redis configuration request model.
/// </summary>
public class CacheConfigurationDto
{
    /// <summary>
    /// True if caching service enabled, otherwise - false
    /// </summary>
    public bool Enable { get; set; }
    
    /// <summary>
    /// Connection string to the caching service.
    /// </summary>
    public required string ConnectionString { get; set; }
    
    /// <summary>
    /// Key prefix to use for all cache entries.
    /// </summary>
    public required string KeyPrefix { get; set; }
    
    /// <summary>
    /// For how long reports should be in the cache in minutes
    /// </summary>
    public int ReportCacheDurationInMinutes { get; set; }
}