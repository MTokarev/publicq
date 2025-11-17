using System.ComponentModel.DataAnnotations;
using System.Text.Json.Serialization;
using PublicQ.Application.Models;
using PublicQ.Shared.Enums;

namespace PublicQ.Infrastructure.Persistence.Entities;

/// <summary>
/// Message Notification Template
/// </summary>
public class MessageTemplateEntity : ICloneable
{
    /// <summary>
    /// Template identifier
    /// </summary>
    [Key]
    public Guid Id { get; set; }
    
    /// <summary>
    /// Template friendly-name
    /// </summary>
    [Required]
    [MaxLength(100)]
    public string Name { get; set; }
    
    /// <summary>
    /// Message subject
    /// </summary>
    [MaxLength(300)]
    public string Subject { get; set; }
    
    /// <summary>
    /// Message body
    /// </summary>
    [MaxLength(10000)]
    public string Body { get; set; }

    /// <summary>
    /// Required to keep all templates separate
    /// Otherwise one modification on the template property might affect all objects
    /// </summary>
    public object Clone()
    {
        return new MessageTemplateEntity
        {   Name = new string(Name),
            Subject = new string(Subject),
            Body = new string(Body)
        };
    }
    
    /// <summary>
    /// Converts this entity to a message template model
    /// </summary>
    /// <returns><see cref="MessageTemplate"/></returns>
    public MessageTemplate ToMessageTemplateModel()
    {
        return new MessageTemplate
        {
            Id = Id,
            Name = Name,
            Subject = Subject,
            Body = Body
        };
    }
}