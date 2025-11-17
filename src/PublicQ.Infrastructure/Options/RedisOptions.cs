using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;

namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Connection strings options.
/// </summary>
public class RedisOptions
{
    /// <summary>
    /// Enables or disables Redis caching.
    /// </summary>
    public bool Enabled { get; set; }
    
    /// <summary>
    /// Redis connection string.
    /// </summary>
    public required string ConnectionString { get; set; }

    /// <summary>
    /// Key prefix to use for all cache entries.
    /// </summary>
    public required string KeyPrefix { get; set; }
    
    /// <summary>
    /// Default cache duration in minutes.
    /// </summary>
    public int DefaultDurationInMinutes { get; set; }
    
    /// <summary>
    /// If true, the connection will fail immediately if the Redis server is unreachable.
    /// </summary>
    public bool AbortOnConnectFail { get; set; }
    
    /// <summary>
    /// Method-specific cache durations in minutes.
    /// </summary>
    public Dictionary<string, int> MethodDurationsInMinutes { get; set; } = new();
    
    /// <summary>
    /// Service-specific cache durations in minutes.
    /// </summary>
    public Dictionary<string, int> ServiceDurationsInMinutes { get; set; } = new();

    /// <summary>
    /// Retrieves the cache duration for a specific service method.
    /// </summary>
    /// <param name="serviceName">Given service name</param>
    /// <param name="methodName">Method name</param>
    /// <returns>Returns time duration for the given service:method</returns>
    public TimeSpan GetCacheDuration(string serviceName, string methodName)
    {
        var key = $"{serviceName}.{methodName}";
        if (MethodDurationsInMinutes.TryGetValue(key, out var methodCacheDurationInMinutes))
        {
            return TimeSpan.FromMinutes(methodCacheDurationInMinutes);
        }
        
        if (ServiceDurationsInMinutes.TryGetValue(serviceName, out var serviceCacheDurationInMinutes))
        {
            return TimeSpan.FromMinutes(serviceCacheDurationInMinutes);
        }

        return TimeSpan.FromMinutes(DefaultDurationInMinutes);
    }

    /// <summary>
    /// Converts the current configuration to a DTO.
    /// </summary>
    /// <returns>Returns <see cref="CacheConfigurationDto"/></returns>
    public CacheConfigurationDto ConvertToDto()
    {
        return new CacheConfigurationDto
        {
            Enable = Enabled,
            KeyPrefix = KeyPrefix,
            ConnectionString = ConnectionString,
            ReportCacheDurationInMinutes =
                ServiceDurationsInMinutes.TryGetValue(nameof(IReportingService), out var duration)
                    ? duration
                    : DefaultDurationInMinutes
        };
    }
}