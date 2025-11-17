using PublicQ.Application.Models;
using PublicQ.Application.Models.Banner;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Interface for Banner service
/// </summary>
public interface IBannerService
{
    /// <summary>
    /// Retrieves active banners.
    /// </summary>
    /// <param name="showOnlyForAuthenticatedUsers">Optional: Show only for authorized users</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TData, TStatus}"/></returns>
    public Task<Response<IList<BannerResponseDto>, GenericOperationStatuses>> GetActiveAsync(
        bool showOnlyForAuthenticatedUsers = false,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets all banners.
    /// </summary>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns <see cref="Response{TData, TStatus}"/></returns>
    public Task<Response<IList<BannerResponseDto>, GenericOperationStatuses>> GetAllAsync(
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Creates a new banner.
    /// </summary>
    /// <param name="createdByUser">Created by user</param>
    /// <param name="bannerCreateRequest">Banner to create <see cref="BannerDto"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TData, Status}"/></returns>
    public Task<Response<BannerResponseDto, GenericOperationStatuses>> CreateAsync(
        string createdByUser,
        BannerDto bannerCreateRequest,
        CancellationToken cancellationToken);

    /// <summary>
    /// Banner update method
    /// </summary>
    /// <param name="id">Banner ID</param>
    /// <param name="updatedByUser">Updated by user</param>
    /// <param name="bannerUpdateRequest"><see cref="BannerResponseDto"/></param>
    /// <param name="cancellationToken"></param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    public Task<Response<GenericOperationStatuses>> UpdateAsync(
        Guid id,
        string updatedByUser,
        BannerDto bannerUpdateRequest,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Deletes a banner by ID.
    /// </summary>
    /// <param name="id">Banner ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns><see cref="Response{TStatus}"/></returns>
    public Task<Response<GenericOperationStatuses>> DeleteAsync(
        Guid id,
        CancellationToken cancellationToken);
}