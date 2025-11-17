using PublicQ.Application.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Interface for cache service.
/// </summary>
public interface ICacheService
{
    /// <summary>
    /// Gets a cached item by key.
    /// </summary>
    /// <param name="key">Key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <typeparam name="T">The type of the cached item</typeparam>
    /// <returns>Returns the cached item wrapped into Response</returns>
    Task<Response<T, GenericOperationStatuses>> GetAsync<T>(
        string key, 
        CancellationToken cancellationToken = default) where T : class;
    
    /// <summary>
    /// Sets a cached item with an optional expiration time.
    /// </summary>
    /// <param name="key">Key</param>
    /// <param name="value">Value to cache</param>
    /// <param name="expiration">Optional: Cache expiration</param>
    /// <param name="cancellationToken">Optional: Cancellation token</param>
    /// <typeparam name="T">The type of the item to cache</typeparam>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> SetAsync<T>(
        string key, 
        T value, TimeSpan? expiration = null, 
        CancellationToken cancellationToken = default) where T : class;
    
    /// <summary>
    /// Removes a cached item by key.
    /// </summary>
    /// <param name="key">Key</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> RemoveAsync(string key, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Removes by pattern
    /// </summary>
    /// <param name="pattern">Pattern to use</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> RemoveByPatternAsync(string pattern, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Removes cache entries by tag.
    /// </summary>
    /// <param name="tag">Tag</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> RemoveByTagAsync(string tag, CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Remove all cache entries.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> ClearAllCacheAsync(CancellationToken cancellationToken = default);

    /// <summary>
    /// Check if the cache service is healthy.
    /// </summary>
    /// <param name="connectionString">Connection string to the cache service</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> CheckCacheServiceHealthAsync(
        string connectionString, 
        CancellationToken cancellationToken = default);
}