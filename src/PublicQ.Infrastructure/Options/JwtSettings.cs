using System.ComponentModel.DataAnnotations;

namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Represent JWT token configuration
/// </summary>
public class JwtSettings
{
    /// <summary>
    /// The main secret for sign all tokens
    /// </summary>
    /// <remarks>
    /// Keep this secret safe and do not expose it in your code.
    /// </remarks>
    [Required]
    public required string Secret { get; set; }
    
    /// <summary>
    /// Token Issues
    /// </summary>
    [Required]
    public required string Issuer { get; set; }
    
    /// <summary>
    /// Token Audience
    /// </summary>
    [Required]
    public required string Audience { get; set; }
    
    /// <summary>
    /// Optional: Token expiration time in minutes
    /// Default value is loaded from the service configuration
    /// </summary>
    public int? TokenExpiryMinutes { get; set; }
}