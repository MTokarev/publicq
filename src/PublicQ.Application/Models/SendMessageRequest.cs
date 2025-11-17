using PublicQ.Application.Interfaces;

namespace PublicQ.Application.Models;

/// <summary>
/// Message request model
/// </summary>
public class SendMessageRequest
{
    /// <summary>
    /// Template to use for this message
    /// <remarks>
    /// This property ignored if <see cref="Body"/> is supplied
    /// </remarks>
    /// </summary>
    public Guid TemplateId { get; set; } = Guid.Empty;
    
    /// <summary>
    /// Placeholders for building the message
    /// </summary>
    public IDictionary<string, string>? Placeholders { get; set; }
    
    /// <summary>
    /// Message subject
    /// </summary>
    public string Subject { get; set; }
    
    /// <summary>
    /// Message body
    /// </summary>
    public string? Body { get; set; }
    
    /// <summary>
    /// An array of message recipients
    /// </summary>
    public IList<string> Recipients { get; set; }
}