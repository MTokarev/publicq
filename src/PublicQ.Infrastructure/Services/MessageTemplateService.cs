using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// Message template service implementation.
/// <seealso cref="IMessageTemplateService"/>
/// </summary>
public class MessageTemplateService(ApplicationDbContext dbContext, ILogger<MessageTemplateService> logger) : IMessageTemplateService
{
    /// <summary>
    /// <seealso cref="IMessageTemplateService.AddTemplateAsync"/>
    /// </summary>
    public async Task<Response<GenericOperationStatuses>> AddTemplateAsync(MessageTemplate template, CancellationToken cancellationToken)
    {
        logger.LogDebug("Attempting to add message template with name '{TemplateName}'", template.Name);
        
        Guard.AgainstNull(template, nameof(template));
        Guard.AgainstNullOrWhiteSpace(template.Name, nameof(template.Name));
        Guard.AgainstNullOrWhiteSpace(template.Body, nameof(template.Body));
        Guard.AgainstNullOrWhiteSpace(template.Subject, nameof(template.Subject));

        var templateToSave = new MessageTemplateEntity
        {
            Body = template.Body,
            Subject = template.Subject,
            Name = template.Name
        };
        
        dbContext.MessageTemplates.Add(templateToSave);
        var result = await dbContext.SaveChangesAsync(cancellationToken);
        
        logger.LogDebug("Successfully added message template with name '{TemplateName}'", template.Name);
        
        if (result == 0)
        {
            logger.LogError("Failed to add message template with name '{TemplateName}'", template.Name);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Failed to add message template.");
        }
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed);
    }

    /// <summary>
    /// <seealso cref="IMessageTemplateService.DeleteTemplateAsync"/>
    /// </summary>
    public async Task<Response<GenericOperationStatuses>> DeleteTemplateAsync(Guid templateId, CancellationToken cancellationToken)
    {
        logger.LogDebug("Attempting to delete message template with ID {TemplateId}", templateId);
        
        if (templateId == Guid.Empty)
        {
            logger.LogWarning("Attempted to delete a message template with an empty ID");
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Template ID cannot be empty.");
        }
        
        var messageTemplate = await dbContext.MessageTemplates
            .FirstOrDefaultAsync(t => t.Id == templateId, cancellationToken);
        
        if (messageTemplate == null)
        {
            logger.LogWarning("Message template with ID {TemplateId} not found", templateId);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Message template with ID {templateId} not found.");
        }

        dbContext.MessageTemplates.Remove(messageTemplate);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Message template with ID {TemplateId} deleted successfully", templateId);
        return Response<GenericOperationStatuses>.Success(
            GenericOperationStatuses.Completed,
            $"Message template with ID {templateId} deleted successfully.");
    }

    /// <summary>
    /// <seealso cref="IMessageTemplateService.GetAllMessageTemplatesAsync"/>
    /// </summary>
    public async Task<Response<IList<MessageTemplate>, GenericOperationStatuses>> GetAllMessageTemplatesAsync(CancellationToken cancellationToken)
    {
        logger.LogDebug("Attempting to retrieve all Message Template List");
        var templates = await dbContext.MessageTemplates
            .AsNoTracking()
            .Select(t => t.ToMessageTemplateModel())
            .ToListAsync(cancellationToken);
        
        logger.LogDebug("Retrieved '{Count}' Message Templates", templates.Count);
        
        return Response<IList<MessageTemplate>, GenericOperationStatuses>.Success(
            templates, 
            GenericOperationStatuses.Completed, 
            $"Retrieved {templates.Count} message templates successfully.");
    }

 
    /// <summary>
    /// <see cref="IMessageTemplateService.GetMessageTemplateAsync"/>
    /// </summary>
    public async Task<Response<MessageTemplate, GenericOperationStatuses>> GetMessageTemplateAsync(
        Guid messageTemplateId, 
        CancellationToken cancellationToken)
    {
        var messageTemplate = await dbContext.MessageTemplates
            .AsNoTracking()
            .FirstOrDefaultAsync(t => t.Id == messageTemplateId, cancellationToken);

        if (messageTemplate == null)
        {
            logger.LogWarning("Message template with ID {TemplateId} not found", messageTemplateId);
            return Response<MessageTemplate, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Message template with ID {messageTemplateId} not found.");
        }
    
        logger.LogInformation("Message template with ID {TemplateId} retrieved successfully", messageTemplateId);
    
        return Response<MessageTemplate, GenericOperationStatuses>.Success(
            messageTemplate.ToMessageTemplateModel(),
            GenericOperationStatuses.Completed,
            $"Message template with ID {messageTemplateId} retrieved successfully.");
    }
}