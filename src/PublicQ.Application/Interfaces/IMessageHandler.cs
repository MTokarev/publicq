using PublicQ.Application.Models;
using PublicQ.Domain.Enums;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Message handler interface
/// </summary>
public interface IMessageHandler
{
    /// <summary>
    /// Provider type to handle this message
    /// </summary>
    MessageProvider Provider { get; }
    
    /// <summary>
    /// Send the message 
    /// </summary>
    /// <param name="message"><see cref="Message"/> to send></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns><see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> SendAsync(Message message, CancellationToken cancellationToken);
}