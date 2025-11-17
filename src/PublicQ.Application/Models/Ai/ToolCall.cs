namespace PublicQ.Application.Models.Ai;

/// <summary>
/// Tool call representation from the AI.
/// </summary>
public class ToolCall
{
    /// <summary>
    /// Tool identifier.
    /// </summary>
    public string Id { get; set; } = default!;
    
    /// <summary>
    /// Tool name.
    /// </summary>
    public string Name { get; set; } = default!;
    
    /// <summary>
    /// Arguments for the tool call.
    /// </summary>
    public Dictionary<string, object> Arguments { get; set; } = new(); 
}