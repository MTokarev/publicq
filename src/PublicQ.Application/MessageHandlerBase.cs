using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Domain.Enums;

namespace PublicQ.Application;

/// <summary>
/// Base class for message handlers
/// </summary>
public abstract class MessageHandlerBase : IMessageHandler
{    
    /// <summary>
    /// Message provider type <seealso cref="MessageProvider"/>
    /// </summary>
    public MessageProvider Provider { get; protected set; }
    
    /// <summary>
    /// <see cref="IMessageHandler.SendAsync"/>
    /// </summary>
    public abstract Task<Response<GenericOperationStatuses>> SendAsync(Message message, CancellationToken cancellationToken);
}