namespace PublicQ.Infrastructure.Options;

/// <summary>
/// MCP API Key Options
/// </summary>
public class McpApiKeyOptions
{
    /// <summary>
    /// Enables or disables API Key authentication
    /// </summary>
    public bool Enabled { get; set; } = false;
    
    /// <summary>
    /// A list of API Keys
    /// </summary>
    public IList<ApiKey> Keys { get; set; } = new List<ApiKey>();
}

/// <summary>
/// Represents an API Key
/// </summary>
public class ApiKey
{
    /// <summary>
    /// Key Name
    /// </summary>
    public string Name { get; set; }
    
    /// <summary>
    /// Key Value
    /// </summary>
    public string Key { get; set; }
    
    /// <summary>
    /// Created By
    /// </summary>
    public string CreatedBy { get; set; } = "unknown";
    
    /// <summary>
    /// Valid Until UTC
    /// </summary>
    public DateTime? ValidUntilUtc { get; set; }
    
    /// <summary>
    /// Creation Date UTC
    /// </summary>
    public DateTime CreatedOnUtc { get; set; }
}