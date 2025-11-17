namespace PublicQ.Application.Models;

/// <summary>
/// Log levels for categorizing log entries.
/// Matches Microsoft.Extensions.Logging.LogLevel values for proper enum mapping.
/// </summary>
public enum LogLevel
{
    /// <summary>
    /// Trace level for very detailed diagnostic information.
    /// Maps to Microsoft.Extensions.Logging.LogLevel.Trace = 0
    /// </summary>
    Trace = 0,
    
    /// <summary>
    /// Debug level for detailed diagnostic information.
    /// Maps to Microsoft.Extensions.Logging.LogLevel.Debug = 1
    /// </summary>
    Debug = 1,
    
    /// <summary>
    /// Information level for general operational entries about application progress.
    /// Maps to Microsoft.Extensions.Logging.LogLevel.Information = 2
    /// </summary>
    Information = 2,
    
    /// <summary>
    /// Warning level for potentially harmful situations.
    /// Maps to Microsoft.Extensions.Logging.LogLevel.Warning = 3
    /// </summary>
    Warning = 3,
    
    /// <summary>
    /// Error level for error events that might still allow the application to continue running.
    /// Maps to Microsoft.Extensions.Logging.LogLevel.Error = 4
    /// </summary>
    Error = 4,
    
    /// <summary>
    /// Critical level for severe error events that will presumably lead the application to abort.
    /// Maps to Microsoft.Extensions.Logging.LogLevel.Critical = 5
    /// </summary>
    Critical = 5,
    
    /// <summary>
    /// None level disables logging.
    /// Maps to Microsoft.Extensions.Logging.LogLevel.None = 6
    /// </summary>
    None = 6
}