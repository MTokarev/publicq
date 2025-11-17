using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Domain.Enums;
using PublicQ.Infrastructure.Options;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// Message service implementation <seealso cref="IMessageService"/>
/// </summary>
public class MessageService : IMessageService
{
    private readonly Dictionary<MessageProvider, IMessageHandler> _handlersDictionary;
    private readonly IMessageTemplateService _templateService;
    private readonly IOptionsMonitor<EmailOptions> _options;
    private readonly ILogger<MessageService> _logger;
    
    public MessageService(
        IEnumerable<IMessageHandler> handlers,
        IMessageTemplateService templateService,
        IOptionsMonitor<EmailOptions> options, 
        ILogger<MessageService> logger)
    {
        _handlersDictionary = handlers?.ToDictionary(k => k.Provider, h => h) 
                              ?? throw new ArgumentNullException(nameof(handlers), "Message handlers cannot be null");
        _templateService = templateService;
        _options = options;
        _logger = logger;
    }
    
    /// <summary>
    /// <see cref="IMessageService.SendAsync"/>
    /// </summary>
    public async Task<Response<GenericOperationStatuses>> SendAsync(SendMessageRequest request, CancellationToken cancellationToken)
    {
        _logger.LogDebug("Sending message request received");
        
        var currentOptions = _options.CurrentValue;
        if (!currentOptions.Enabled)
        {
            _logger.LogDebug("Message sending is disabled. Skipping message sending.");
            return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.FeatureIsNotAvailable);
        }
        
        Guard.AgainstNull(request, nameof(request));
        Guard.AgainstNullOrWhiteSpace(request.Recipients, nameof(request.Recipients));

        var provider = currentOptions.MessageProvider;
        var sendFrom = currentOptions.SendFrom;
        
        if (!_handlersDictionary.TryGetValue(provider, out var handler))
        {
            _logger.LogError("Message provider '{Provider}' not found", provider);
            
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Message provider '{provider}' not found.");
        }
        
        if (request.TemplateId == Guid.Empty)
        {
            if (string.IsNullOrEmpty(request.Body))
            {
                _logger.LogError("'{TemplateIdProperty}' or '{BodyProperty}' must be provided", 
                    nameof(request.TemplateId), 
                    nameof(request.Body));
                return Response<GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.Failed,
                    $"{nameof(request.TemplateId)} or {nameof(request.Body)} must be provided.");
            }
            
            _logger.LogDebug("No '{TemplateIdProperty}' provided, creating direct message using provided body.",
                nameof(request.TemplateId));
            
            // Template is not provided, create a direct message
            var directMessage = new Message
            {
                Body = request.Body,
                Recipients = request.Recipients,
                Subject = request.Subject,
                Sender = sendFrom
            };
            
            return await handler.SendAsync(directMessage, cancellationToken);
        }
        
        _logger.LogDebug("Using template id '{TemplateId}' for message", request.TemplateId);

        var templateResponse = await _templateService.GetMessageTemplateAsync(request.TemplateId, cancellationToken);
        
        if (templateResponse.IsFailed)
        {
            _logger.LogError("Failed to retrieve message template: {Message}", templateResponse.Message);
            return Response<GenericOperationStatuses>.Failure(
                templateResponse.Status,
                templateResponse.Message,
                templateResponse.Errors);
        }
        
        var template = templateResponse.Data;

        ReplacePlaceholders(request, template);
        
        _logger.LogDebug("Assembling message from template '{TemplateName}'", template!.Name);
        
        var message = new Message
        {
            Body = template.Body,
            Subject = template.Subject,
            Recipients = request.Recipients,
            Sender = sendFrom
        };
        
        return await handler.SendAsync(message, cancellationToken);
    }
    
    /// <summary>
    /// Replace placeholders in the template body and subject with actual values from the request
    /// </summary>
    /// <param name="request"><see cref="SendMessageRequest"/></param>
    /// <param name="template"><see cref="MessageTemplate"/></param>
    private void ReplacePlaceholders(SendMessageRequest request, MessageTemplate? template)
    {
        if (request.Placeholders is null)
        {
            return;
        }

        _logger.LogDebug("Replacing placeholders in template '{TemplateName}'", template!.Name);
            
        // Replace placeholders in the template body and subject
        foreach (var placeholder in request.Placeholders)
        {
            template.Body = template.Body.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
            template.Subject = template.Subject.Replace($"{{{{{placeholder.Key}}}}}", placeholder.Value);
        }
    }
}