namespace PublicQ.Application.Models;

/// <summary>
/// User model
/// </summary>
public class User
{
    /// <summary>
    /// User unique identifier.
    /// </summary>
    public required string Id { get; set; }
    
    /// <summary>
    /// Email address of the user.
    /// </summary>
    public string? Email { get; init; }
    
    /// <summary>
    /// Optional: Full name of the user.
    /// </summary>
    public string? FullName { get; init; }
    
    /// <summary>
    /// Optional: Date of birth of the user.
    /// </summary>
    public DateTime? DateOfBirth { get; set; }
    
    /// <summary>
    /// Indicates if the user has credentials set (password or external login).
    /// For exam takers, this will be false as they do not have credentials.
    /// </summary>
    public bool HasCredential { get; init; }
    
    /// <summary>
    /// Assigned roles of the user.
    /// </summary>
    public IList<string> Roles { get; init; } = new List<string>();
}