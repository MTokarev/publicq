using PublicQ.Application.Models;
using PublicQ.Shared.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Interface for storage service
/// </summary>
public interface IStorageService
{
    /// <summary>
    /// Saves the item to the storage
    /// </summary>
    /// <param name="storageItem">Item to save <seealso cref="StorageItem"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns url and status wrapped in <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<string, GenericOperationStatuses>> SaveAsync(
        StorageItem storageItem, 
        CancellationToken cancellationToken);

    /// <summary>
    /// Saves the item to the storage
    /// </summary>
    /// <param name="storageItem">itemId to get</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <param name="relativePath">Relative path</param>
    /// <returns>Returns <see cref="StorageItem"/>> wrapped in <see cref="Response{TStatus}"/></returns>
    Task<Response<StorageItem, GenericOperationStatuses>> GetAsync(
        string storageItem, 
        CancellationToken cancellationToken, 
        string? relativePath = null);
    
    /// <summary>
    /// Deletes the item from the storage
    /// </summary>
    /// <param name="filePath">itemId to save</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <param name="relativePath">Relative path</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> DeleteAsync(
        string filePath, 
        CancellationToken cancellationToken,
        string? relativePath = null);
}