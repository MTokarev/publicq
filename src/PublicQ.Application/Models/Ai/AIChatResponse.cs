namespace PublicQ.Application.Models.Ai;

/// <summary>
/// Chat response from the AI service.
/// </summary>
public class AIChatResponse
{
    /// <summary>
    /// Text response from the AI, if any.
    /// </summary>
    public string? TextResponse { get; set; }
    
    /// <summary>
    /// Tool calls suggested by the AI, if any.
    /// </summary>
    public List<ToolCall>? ToolCalls { get; set; }
    
    /// <summary>
    /// Indicates whether the AI response is complete.
    /// </summary>
    public bool IsComplete { get; set; }
}