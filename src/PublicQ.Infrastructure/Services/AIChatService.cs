using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Ai;
using PublicQ.Domain.Enums;
using PublicQ.Infrastructure.Options;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <inheritdoc cref="IAIChatService"/>
public class AIChatService(
    IEnumerable<IAIChatHandler> handlers, 
    IOptionsMonitor<LlmIntegrationOptions> options,
    ILogger<AIChatService> logger) : IAIChatService
{
    // Map of LLM providers to their respective chat handlers
    private readonly Dictionary<LlmProvider, IAIChatHandler> chatHandler = 
        handlers.ToDictionary(h => h.ChatProvider, h => h);
    
    /// <inheritdoc cref="IAIChatHandler.SendMessageAsync"/>
    public async Task<Response<AIChatResponse, GenericOperationStatuses>> SendMessageAsync(
        string message, 
        List<McpTool> availableTools, 
        List<ChatMessage> conversationHistory = null,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Send message request received.");
        Guard.AgainstNull(message, nameof(message));
        Guard.AgainstNull(availableTools, nameof(availableTools));

        if (!options.CurrentValue.Enabled)
        {
            logger.LogDebug("Chat service is disabled.");
            return Response<AIChatResponse, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotAllowed, 
                "AI chat service is currently disabled.");
        }
        
        var provider = options.CurrentValue.Provider;
        if (!chatHandler.TryGetValue(provider, out var handler))
        {
            logger.LogError("No handler found for {Provider}.", nameof(provider));
            return Response<AIChatResponse, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest, 
                $"No chat handler found for the '{nameof(provider)}' provider.");
        }
        
        return await handler.SendMessageAsync(
            message, 
            availableTools, 
            conversationHistory, 
            cancellationToken);
    }
}