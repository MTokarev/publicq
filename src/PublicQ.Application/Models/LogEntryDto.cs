namespace PublicQ.Application.Models;

/// <summary>
/// Data transfer object representing a log entry in the application.
/// </summary>
public class LogEntryDto
{
    /// <summary>
    /// Unique identifier for the log entry (auto-generated)
    /// </summary>
    public long Id { get; set; }

    /// <summary>
    /// When the log was created (UTC timestamp)
    /// </summary>
    public DateTime Timestamp { get; set; }

    /// <summary>
    /// Log level: Debug, Information, Warning, Error, Critical
    /// </summary>
    public string Level { get; set; } = null!;

    /// <summary>
    /// The logger category (usually the class name that created the log)
    /// Example: "PublicQ.API.Controllers.UserController"
    /// </summary>
    public string? Category { get; set; }

    /// <summary>
    /// The actual log message
    /// </summary>
    public string Message { get; set; } = null!;

    /// <summary>
    /// Exception details (stack trace, inner exceptions, etc.) if any
    /// </summary>
    public string? Exception { get; set; }

    /// <summary>
    /// ID of the user who was logged in when this log was created
    /// </summary>
    public string? UserId { get; set; }
    
    /// <summary>
    /// Email of the user who was logged in when this log was created
    /// </summary>
    public string? UserEmail { get; set; }

    /// <summary>
    /// Unique identifier for the HTTP request that generated this log
    /// Helps trace all logs from a single request
    /// </summary>
    public string? RequestId { get; set; }

    /// <summary>
    /// Name of the server/machine that generated the log
    /// Useful in multi-server environments
    /// </summary>
    public string? MachineName { get; set; }
}