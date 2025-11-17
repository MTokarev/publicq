namespace PublicQ.API.Models.Requests;

/// <summary>
/// Check password token request model.
/// </summary>
public class CheckPasswordTokenRequest
{
    /// <summary>
    /// User's email address.
    /// </summary>
    public string Email { get; set; }
    
    /// <summary>
    /// User's password reset token.
    /// </summary>
    public string Token { get; set; }
}