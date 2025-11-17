namespace PublicQ.API.Models.Requests;

/// <summary>
/// Reset password request model.
/// </summary>
public class ResetPasswordRequest
{
    /// <summary>
    /// User's email address.
    /// </summary>
    public required string Email { get; set; }
    
    /// <summary>
    /// User's password reset token.
    /// </summary>
    public required string Token { get; set; }
    
    /// <summary>
    /// User's new password.
    /// </summary>
    public required string NewPassword { get; set; }
}