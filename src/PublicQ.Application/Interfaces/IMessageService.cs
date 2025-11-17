using PublicQ.Application.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Interface for message service
/// </summary>
public interface IMessageService
{
    /// <summary>
    /// Send message request
    /// </summary>
    /// <param name="request"><see cref="SendMessageRequest"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> SendAsync(
        SendMessageRequest request, 
        CancellationToken cancellationToken);
}