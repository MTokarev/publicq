using PublicQ.Application.Models;
using PublicQ.Application.Models.Pages;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Interface for Page Service
/// </summary>
public interface IPageService
{
    /// <summary>
    /// Gets page by type
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a page <see cref="ContactPageDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<ContactPageDto, GenericOperationStatuses>> GetContactPageAsync(
        CancellationToken cancellationToken);

    /// <summary>
    /// Sets or updates a page
    /// </summary>
    /// <param name="pageDto"><see cref="PageDto"/></param>
    /// <param name="userId">Action initiator</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a page <see cref="PageDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<PageDto, GenericOperationStatuses>> SetOrUpdateAsync(
        PageDto pageDto,
        string userId,
        CancellationToken cancellationToken);
}