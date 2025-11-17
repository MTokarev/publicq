using PublicQ.Application.Models;
using LogLevel = Microsoft.Extensions.Logging.LogLevel;
using CustomLogLevel = PublicQ.Application.Models.LogLevel;

namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Database logger options.
/// </summary>
public class DbLoggerOptions
{
    /// <summary>
    /// Enables or disables logging to the database.
    /// </summary>
    public bool Enabled { get; set; } = true;
    
    /// <summary>
    /// Log level threshold for logging to the database.
    /// </summary>
    public LogLevel LogLevel { get; set; } 
    
    /// <summary>
    /// Excluded categories from logging to the database.
    /// </summary>
    public IList<string> ExcludedCategories { get; set; } = new List<string>();
    
    /// <summary>
    /// Maximum page size for user queries.
    /// </summary>
    public int MaxPageSize { get; set; } = 100;
    
    /// <summary>
    /// Maximum number of days to retain stored logs in the database.
    /// </summary>
    public int RetentionPeriodInDays { get; set; } = 90;
    
    public LogConfigurationDto ConvertToDto()
    {
        return new LogConfigurationDto
        {
            Enable = Enabled,
            LogLevel = (CustomLogLevel)(int)LogLevel, // Direct cast since enum values match
            RetentionPeriodInDays = RetentionPeriodInDays
        };
    }
}