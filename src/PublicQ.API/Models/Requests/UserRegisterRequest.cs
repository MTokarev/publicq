namespace PublicQ.API.Models.Requests;

/// <summary>
/// User registration request model.
/// </summary>
public class UserRegisterRequest
{
    /// <summary>
    /// Full name of the user.
    /// </summary>
    public string FullName { get; set; } = default!;
    
    /// <summary>
    /// Email address of the user.
    /// </summary>
    public string Email { get; set; } = default!;
    
    /// <summary>
    /// Password of the user.
    /// </summary>
    public string Password { get; set; } = default!;
    
    /// <summary>
    /// Optional: Date of birth of the user.
    /// </summary>
    public DateTime? DateOfBirth { get; set; }
}