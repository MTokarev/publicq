namespace PublicQ.Infrastructure.Options;

/// <summary>
/// Password policy.
/// </summary>
public class PasswordPolicyOptions
{
    /// <summary>
    /// Required length of the password.
    /// </summary>
    public int RequiredLength { get; set; }
    
    /// <summary>
    /// Require digit in the password.
    /// </summary>
    public bool RequireDigit { get; set; }
    
    /// <summary>
    /// Require uppercase letter in the password.
    /// </summary>
    public bool RequireUppercase { get; set; }
    
    /// <summary>
    /// Require lowercase letter in the password.
    /// </summary>
    public bool RequireLowercase { get; set; }
    
    /// <summary>
    /// Require non-alphanumeric character in the password.
    /// </summary>
    public bool RequireNonAlphanumeric { get; set; }
}