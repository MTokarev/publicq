namespace PublicQ.Application.Models.Ai;

/// <summary>
/// Chat message representation.
/// </summary>
public class ChatMessage
{
    /// <summary>
    /// Role of the message sender (e.g., "user", "assistant", "system").
    /// <remarks>
    /// Roles help the AI understand the context of the message.
    /// </remarks>
    /// </summary>
    public ChatRole Role { get; set; } = default!;
    
    /// <summary>
    /// Content of the message.
    /// </summary>
    public string Content { get; set; } = default!;
    
    /// <summary>
    /// Tool call identifier, if the message is associated with a tool call.
    /// </summary>
    public string? ToolCallId { get; set; }
    
    /// <summary>
    /// Tool name, if the message is associated with a tool call.
    /// </summary>
    public string? ToolName { get; set; }
    
    /// <summary>
    /// Raw tool calls from the AI response (for assistant messages).
    /// This is needed when reconstructing conversation history with tool messages.
    /// </summary>
    public object? ToolCalls { get; set; }
}
