using System.ComponentModel.DataAnnotations;

namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Represent JWT token configuration
/// </summary>
public class AuthOptions
{
    /// <summary>
    /// JWT token settings
    /// </summary>
    [Required]
    public JwtSettings JwtSettings { get; set; }
}