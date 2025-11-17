using PublicQ.Application.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Service interface for managing message templates.
/// </summary>
public interface IMessageTemplateService
{
    /// <summary>
    /// Send message request
    /// </summary>
    /// <param name="template"><see cref="MessageTemplate"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> AddTemplateAsync(
        MessageTemplate template,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Send message request
    /// </summary>
    /// <param name="templateId">Template identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> DeleteTemplateAsync(
        Guid templateId,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Send message request
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TStatus}"/></returns>
    Task<Response<IList<MessageTemplate>, GenericOperationStatuses>> GetAllMessageTemplatesAsync(
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Send message request
    /// </summary>
    /// <param name="messageTemplateId">Template Identifier</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="MessageTemplate"/> wrapped in <see cref="Response{TStatus}"/></returns>
    Task<Response<MessageTemplate, GenericOperationStatuses>> GetMessageTemplateAsync(
        Guid messageTemplateId,
        CancellationToken cancellationToken);
}