using System.ComponentModel.DataAnnotations;
using PublicQ.Application.Models;

namespace PublicQ.Infrastructure.Persistence.Entities;

/// <summary>
/// Log entry entity for storing application logs in the database.
/// </summary>
public class LogEntryEntity
{
    /// <summary>
    /// Internal unique identifier for the log entry.
    /// </summary>
    public long Id { get; set; }
    
    /// <summary>
    /// Date and time when the log entry was created.
    /// </summary>
    public DateTime Timestamp { get; set; }
    
    /// <summary>
    /// Log level (e.g., Information, Warning, Error).
    /// </summary>
    [MaxLength(50)]
    public string Level { get; set; } = null!;
    
    /// <summary>
    /// Category of the log entry (e.g., the source or context).
    /// </summary>
    [MaxLength(255)]
    public string? Category { get; set; }
    
    /// <summary>
    /// The log message.
    /// </summary>
    public string Message { get; set; } = null!;
    
    /// <summary>
    /// Exception details if applicable.
    /// </summary>
    public string? Exception { get; set; }
    
    /// <summary>
    /// User identifier associated with the log entry, if any.
    /// </summary>
    [MaxLength(450)]
    public string? UserId { get; set; }
    
    /// <summary>
    /// User Email associated with the log entry, if any.
    /// </summary>
    [MaxLength(450)]
    public string? UserEmail { get; set; }
    
    /// <summary>
    /// Request identifier to correlate logs from the same request, if any.
    /// </summary>
    [MaxLength(100)]
    public string? RequestId { get; set; }
    
    /// <summary>
    /// Converts the entity to a DTO.
    /// </summary>
    /// <returns>Returns <see cref="LogEntryDto"/></returns>
    public LogEntryDto ConvertToDto()
    {
        return new LogEntryDto
        {
            Timestamp = Timestamp,
            Level = Level,
            Category = Category,
            Message = Message,
            Exception = Exception,
            UserId = UserId,
            UserEmail = UserEmail,
            RequestId = RequestId
        };
    }
}