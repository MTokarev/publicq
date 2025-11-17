namespace PublicQ.Application.Models;

/// <summary>
/// Log filter model for querying log entries based on various criteria.
/// </summary>
public class LogFilter
{
    /// <summary>
    /// Message content to search for within log entries.
    /// </summary>
    public string? MessageContains { get; set; } = default!;
    
    /// <summary>
    /// From date for filtering log entries.
    /// </summary>
    public DateTime? FromDate { get; set; }
    
    /// <summary>
    /// To date for filtering log entries.
    /// </summary>
    public DateTime? ToDate { get; set; }
    
    /// <summary>
    /// Log level for filtering log entries (e.g., Information, Warning, Error).
    /// </summary>
    public string? Level { get; set; }
    
    /// <summary>
    /// Category for filtering log entries. E.g. PublicQ.API
    /// </summary>
    public string? Category { get; set; }
    
    /// <summary>
    /// User identifier for filtering log entries.
    /// </summary>
    public string? UserId { get; set; }
    
    /// <summary>
    /// User Email for filtering log entries.
    /// </summary>
    public string? UserEmail { get; set; }
    
    /// <summary>
    /// Request identifier for filtering log entries.
    /// </summary>
    public string? RequestId { get; set; }
}