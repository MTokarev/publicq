using PublicQ.Application.Models.Ai;

namespace PublicQ.API.Models.Requests;

/// <summary>
/// AI chat request.
/// </summary>
public class AiChatRequest
{
    /// <summary>
    /// Chat message to send to the AI.
    /// </summary>
    public string Message { get; set; } = default!;
    
    /// <summary>
    /// A list of tools available for the AI to use.
    /// <see cref="McpTool"/>
    /// </summary>
    public List<McpTool> AvailableTools { get; set; } = new();
    
    /// <summary>
    /// A list of previous chat messages for context.
    /// <see cref="ChatMessage"/>
    /// </summary>
    public List<ChatMessage>? ConversationHistory { get; set; }
}