using PublicQ.Domain.Enums;

namespace PublicQ.Infrastructure.Options;

public class EmailOptions
{
    /// <summary>
    /// Indicates whether email functionality is enabled.
    /// </summary>
    public bool Enabled { get; set; }
    
    /// <summary>
    /// Email provider used for sending emails.
    /// <see cref="MessageProvider"/>
    /// </summary>
    public MessageProvider MessageProvider { get; set; }
    
    /// <summary>
    /// Sender's email address used for sending emails.
    /// </summary>
    public string SendFrom { get; set; } = string.Empty;
}