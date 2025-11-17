namespace PublicQ.Application.Models;

/// <summary>
/// Log configuration model.
/// </summary>
public class LogConfigurationDto
{
    /// <summary>
    /// True if caching service enabled, otherwise - false
    /// </summary>
    public bool Enable { get; set; }

    /// <summary>
    /// Log level threshold for logging to the database.
    /// </summary>
    public LogLevel LogLevel { get; set; }
    
    /// <summary>
    /// Maximum number of days to retain stored logs in the database.
    /// </summary>
    public int RetentionPeriodInDays { get; set; }
}