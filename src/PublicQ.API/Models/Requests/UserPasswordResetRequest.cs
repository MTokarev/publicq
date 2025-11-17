namespace PublicQ.API.Models.Requests;

/// <summary>
/// User password reset request model.
/// </summary>
public class UserPasswordResetRequest
{
    /// <summary>
    /// User email address.
    /// </summary>
    public string Email { get; set; }
    
    /// <summary>
    /// New password for the user.
    /// </summary>
    public string Password { get; set; }
}