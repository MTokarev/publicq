namespace PublicQ.Application.Models.Ai;

/// <summary>
/// MCP Tool representation.
/// </summary>
public class McpTool
{
    /// <summary>
    /// Tool name.
    /// </summary>
    public string Name { get; set; } = default!;
    
    /// <summary>
    /// Tool description.
    /// </summary>
    public string Description { get; set; } = default!;
    
    /// <summary>
    /// Input schema for the tool.
    /// </summary>
    public object InputSchema { get; set; } = default!;
}