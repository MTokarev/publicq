using System.ComponentModel.DataAnnotations;

namespace PublicQ.Application.Models;

/// <summary>
/// Represent a model for the message
/// </summary>
public class Message
{
    /// <summary>
    /// Sender address
    /// </summary>
    [EmailAddress]
    public required string Sender { get; set; }
    
    /// <summary>
    /// An recipient array
    /// </summary>
    public required IList<string> Recipients { get; set; }
    
    /// <summary>
    /// Optional: The message subject
    /// </summary>
    public string Subject { get; set; } = string.Empty;
    
    /// <summary>
    /// The message body
    /// </summary>
    public required string Body { get; set; }
}