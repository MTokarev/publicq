namespace PublicQ.API.Models.Requests;

/// <summary>
/// Forget password request model.
/// </summary>
public class ForgetPasswordRequest
{
    /// <summary>
    /// User's email address to send the password reset link to.
    /// </summary>
    public string EmailAddress { get; set; }
}