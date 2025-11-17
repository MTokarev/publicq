namespace PublicQ.Application.Models;

/// <summary>
/// Message template model
/// </summary>
public class MessageTemplate : ICloneable
{
    /// <summary>
    /// Message template identifier
    /// </summary>
    public Guid Id { get; set; }
    
    /// <summary>
    /// Template friendly-name
    /// </summary>
    public required string Name { get; set; }
    
    /// <summary>
    /// Message subject
    /// </summary>
    public required string Subject { get; set; }
    
    /// <summary>
    /// Message body
    /// </summary>
    public required string Body { get; set; }
    
    /// <summary>
    /// Required to keep all templates separate
    /// Otherwise one modification on the template property might affect all objects
    /// </summary>
    public object Clone()
    {
        return new MessageTemplate
        {   Name = new string(Name),
            Subject = new string(Subject),
            Body = new string(Body)
        };
    }
}