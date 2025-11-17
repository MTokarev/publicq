using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Options;
using PublicQ.Shared;
using StackExchange.Redis;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// Implements cache service using Redis.
/// </summary>
public class RedisCacheService : ICacheService
{
    private IConnectionMultiplexer _redis;
    private string _previousConnectionString = string.Empty;
    
    private readonly IDistributedCache _distributedCache;
    private readonly IOptionsMonitor<RedisOptions> _options;
    private readonly ILogger<RedisCacheService> _logger;
    

    /// <summary>
    /// Implements cache service using Redis.
    /// </summary>
    public RedisCacheService(IConnectionMultiplexer redis,
        IDistributedCache distributedCache,
        IOptionsMonitor<RedisOptions> options, 
        ILogger<RedisCacheService> logger)
    {
        _redis = redis;
        _distributedCache = distributedCache;
        _options = options;
        _logger = logger;
        _previousConnectionString = options.CurrentValue.ConnectionString;
        _options.OnChange(RecreateRedisConnection);
    }

    /// <inheritdoc cref="ICacheService.GetAsync{T}"/>
    public async Task<Response<T, GenericOperationStatuses>> GetAsync<T>(
        string key, 
        CancellationToken cancellationToken = default) where T : class
    {
        _logger.LogDebug("Getting cache request received");
        Guard.AgainstNullOrWhiteSpace(key, nameof(key));
        
        if (!_options.CurrentValue.Enabled)
        {
            _logger.LogDebug("Redis cache is disabled in configuration");
            return Response<T, GenericOperationStatuses>.Success(
                default,
                GenericOperationStatuses.Completed,
                "Redis caching is disabled.");
        }

        try
        {
            key = GetPrefixedKey(key);
            _logger.LogDebug("Fetching from cache with key: {Key}", key);
            var cachedData = await _distributedCache.GetStringAsync(key, cancellationToken);

            if (string.IsNullOrEmpty(cachedData))
            {
                _logger.LogDebug("Cache miss for key: {Key}", key);
                return Response<T, GenericOperationStatuses>.Success(
                    default,
                    GenericOperationStatuses.NotFound,
                    "Cache miss.");
            }

            var deserializedData = JsonSerializer.Deserialize<T>(cachedData);
            _logger.LogDebug("Cache hit for key: {Key}", key);
            return Response<T, GenericOperationStatuses>.Success(
                deserializedData!,
                GenericOperationStatuses.Completed,
                "Cache hit.");
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogWarning(ex, "Redis connection issue while handling key: {Key}", key);
            return Response<T, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis connection issue.");
        }
        catch (RedisTimeoutException ex)
        {
            _logger.LogWarning(ex, "Redis timeout while handling key: {Key}", key);
            return Response<T, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis timeout issue.");
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to deserialize cache entry for key: {Key}", key);
            return Response<T, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Deserialization error.");
        }
    }

    /// <inheritdoc cref="ICacheService.SetAsync{T}"/>
    public async Task<Response<GenericOperationStatuses>> SetAsync<T>(
        string key, 
        T value, 
        TimeSpan? expiration = null, 
        CancellationToken cancellationToken = default) where T : class
    {
        _logger.LogDebug("Setting cache request received");
        Guard.AgainstNullOrWhiteSpace(key, nameof(key));
        Guard.AgainstNull(value, nameof(value));
        
        if (!_options.CurrentValue.Enabled)
        {
            _logger.LogDebug("Redis cache is disabled in configuration");
            return Response<GenericOperationStatuses>.Success(
                GenericOperationStatuses.Completed,
                "Redis caching is disabled.");
        }

        try
        {
            var fullKey = GetPrefixedKey(key);
            var serializedData = JsonSerializer.Serialize(value);
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = expiration ?? TimeSpan.FromMinutes(_options.CurrentValue.DefaultDurationInMinutes)
            };
            
            await _distributedCache.SetStringAsync(fullKey, serializedData, cacheOptions, cancellationToken);
            _logger.LogDebug("Cache set for key: {Key} with expiration: {Expiration}", 
                fullKey, 
                cacheOptions.AbsoluteExpirationRelativeToNow);
            
            return Response<GenericOperationStatuses>.Success(
                GenericOperationStatuses.Completed,
                "Cache set successfully.");
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogWarning(ex, "Redis connection issue while setting key: {Key}", key);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis connection issue.");
        }
        catch (RedisTimeoutException ex)
        {
            _logger.LogWarning(ex, "Redis timeout while setting key: {Key}", key);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis timeout issue.");
        }
        catch (JsonException ex)
        {
            _logger.LogError(ex, "Failed to serialize cache entry for key: {Key}", key);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Serialization error.");
        }
    }

    /// <inheritdoc cref="ICacheService.RemoveAsync"/>
    public async Task<Response<GenericOperationStatuses>> RemoveAsync(
        string key, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Removing cache request received");
        Guard.AgainstNullOrWhiteSpace(key, nameof(key));
        
        if (!_options.CurrentValue.Enabled)
        {
            _logger.LogDebug("Redis cache is disabled in configuration");
            return Response<GenericOperationStatuses>.Success(
                GenericOperationStatuses.Completed,
                "Redis caching is disabled.");
        }

        try
        {
            var fullKey = GetPrefixedKey(key);
            await _distributedCache.RemoveAsync(fullKey, cancellationToken);
            _logger.LogDebug("Cache removed for key: {Key}", fullKey);
            
            return Response<GenericOperationStatuses>.Success(
                GenericOperationStatuses.Completed,
                "Cache removed successfully.");
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogWarning(ex, "Redis connection issue while removing key: {Key}", key);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis connection issue.");
        }
        catch (RedisTimeoutException ex)
        {
            _logger.LogWarning(ex, "Redis timeout while removing key: {Key}", key);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis timeout issue.");
        }
    }

    /// <inheritdoc cref="ICacheService.RemoveByPatternAsync"/>
    public async Task<Response<GenericOperationStatuses>> RemoveByPatternAsync(
        string pattern, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Removing cache request received");
        Guard.AgainstNullOrWhiteSpace(pattern, nameof(pattern));
        if (!_options.CurrentValue.Enabled)
        {
            _logger.LogDebug("Redis cache is disabled in configuration");
            return Response<GenericOperationStatuses>.Success(
                GenericOperationStatuses.Completed,
                "Redis caching is disabled.");
        }
        
        try
        {
            if (!_redis.IsConnected)
            {
                _logger.LogDebug("Redis not connected, recreating connection...");
                RecreateRedisConnection(_options.CurrentValue);
            }
            
            var server = _redis.GetServer(_redis.GetEndPoints().First());
            
            if (!pattern.StartsWith(_options.CurrentValue.KeyPrefix, StringComparison.OrdinalIgnoreCase))
            {
                pattern = $"{_options.CurrentValue.KeyPrefix}:{pattern}";
            }
            
            var keys = server.Keys(pattern: pattern).ToArray();

            if (keys.Length == 0)
            {
                _logger.LogDebug("No keys found matching pattern: {Pattern}", pattern);
                return Response<GenericOperationStatuses>.Success(
                    GenericOperationStatuses.NotFound,
                    "No keys found matching the pattern.");
            }

            var db = _redis.GetDatabase();
            
            await db.KeyDeleteAsync(keys);
            
            _logger.LogDebug("Removed {Count} keys matching pattern: {Pattern}", keys.Length, pattern);

            return Response<GenericOperationStatuses>.Success(
                GenericOperationStatuses.Completed,
                $"Removed '{keys.Length}' keys matching the pattern.");
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogWarning(ex, "Redis connection issue while removing keys with pattern: {Pattern}", pattern);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis connection issue.");
        }
        catch (RedisTimeoutException ex)
        {
            _logger.LogWarning(ex, "Redis timeout while removing keys with pattern: {Pattern}", pattern);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis timeout issue.");
        }
    }

    /// <inheritdoc cref="ICacheService.RemoveByTagAsync"/>
    public async Task<Response<GenericOperationStatuses>> RemoveByTagAsync(
        string tag, 
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Removing cache request received");
        
        return await RemoveByPatternAsync($":tag:{tag}:*", cancellationToken);
    }

    /// <inheritdoc cref="ICacheService.ClearAllCacheAsync"/>
    public Task<Response<GenericOperationStatuses>> ClearAllCacheAsync(CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Clearing cache request received");
        
        var pattern = $"{_options.CurrentValue.KeyPrefix}*";
        
        return RemoveByPatternAsync(pattern, cancellationToken);
    }

    /// <inheritdoc cref="ICacheService.CheckCacheServiceHealthAsync"/>
    public async Task<Response<GenericOperationStatuses>> CheckCacheServiceHealthAsync(
        string connectionString,
        CancellationToken cancellationToken = default)
    {
        _logger.LogDebug("Checking cache service health request received");
        Guard.AgainstNullOrWhiteSpace(connectionString, nameof(connectionString));
        
        if (!_options.CurrentValue.Enabled)
        {
            _logger.LogDebug("Redis cache is disabled in configuration");
            return Response<GenericOperationStatuses>.Success(
                GenericOperationStatuses.Completed,
                "Redis caching is disabled.");
        }

        try
        {
            await using var redis = await ConnectionMultiplexer.ConnectAsync(connectionString);
            IDatabase db = redis.GetDatabase();

            var latency = await db.PingAsync();
            _logger.LogDebug("Redis ping successful, latency: {Latency} ms", latency.TotalMilliseconds);
            
            return Response<GenericOperationStatuses>.Success(
                GenericOperationStatuses.Completed, 
                $"Redis ping successful, latency: '{latency.TotalMilliseconds}' ms");
        }
        catch (RedisConnectionException ex)
        {
            _logger.LogWarning(ex, "Redis connection issue while clearing cache service");
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis connection issue.");
        }
        catch (RedisTimeoutException ex)
        {
            _logger.LogWarning(ex, "Redis timeout while clearing cache service");
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis timeout issue.");
        }
        catch (RedisException ex)
        {
            _logger.LogWarning(ex, "Redis general issue while clearing cache service");
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Redis general issue.");
        }
    }

    /// <summary>
    /// Gets the prefixed key.
    /// </summary>
    /// <param name="key">Given Key</param>
    /// <returns>Returns combination of <see cref="RedisOptions.KeyPrefix"/> and the key</returns>
    private string GetPrefixedKey(string key) => $":{key}";
    
    /// <summary>
    /// Handle options change event to recreate Redis connection if needed.
    /// </summary>
    /// <param name="newOptions"><see cref="RedisOptions"/></param>
    private void RecreateRedisConnection(RedisOptions newOptions)
    {
        try
        {
            _logger.LogInformation("Redis configuration changed, recreating connection...");
        
            // Check if we need to reconnect
            var needsReconnection = newOptions.Enabled && 
                                     !string.Equals(_previousConnectionString, newOptions.ConnectionString, StringComparison.OrdinalIgnoreCase);
        
            var needsDisconnection = !newOptions.Enabled && _redis != null;
        
            if (needsReconnection)
            {
                // Dispose old connection
                _redis?.Dispose();
            
                // Create new connection - use connection string directly
                _redis = ConnectionMultiplexer.Connect(newOptions.ConnectionString);
            
                _logger.LogInformation("Redis connection recreated successfully");
            }
            else if (needsDisconnection)
            {
                // Dispose and nullify when disabled
                _redis?.Dispose();
                _redis = null;
            
                _logger.LogInformation("Redis connection disposed (caching disabled)");
            }
        
            _previousConnectionString = newOptions.ConnectionString;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to recreate Redis connection");
        }
    }
}