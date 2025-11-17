using PublicQ.Application.Models;
using PublicQ.Application.Models.Ai;
using PublicQ.Domain.Enums;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Chat Handler interface for AI interactions.
/// </summary>
public interface IAIChatHandler
{
    /// <summary>
    /// Chat provider type to handle this AI interaction.
    /// <see cref="LlmProvider"/>
    /// </summary>
    LlmProvider ChatProvider { get; }
    
    /// <summary>
    /// Sends a message to the AI chat service and retrieves the response.
    /// </summary>
    /// <param name="message">The message to send to the AI.</param>
    /// <param name="availableTools">List of tools available for the AI to use.</param>
    /// <param name="conversationHistory">Optional conversation history for context.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>An <see cref="AIChatResponse"/> containing the AI's response.</returns>
    Task<Response<AIChatResponse, GenericOperationStatuses>> SendMessageAsync(
        string message,
        List<McpTool> availableTools,
        List<ChatMessage> conversationHistory = null,
        CancellationToken cancellationToken = default);
}