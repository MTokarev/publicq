namespace PublicQ.API.Models.Requests;

/// <summary>
/// Register request model.
/// </summary>
public class UserOperationRequest
{
    /// <summary>
    /// Email address of the user.
    /// </summary>
    public required string Email { get; set; }
    
    /// <summary>
    /// Password of the user.
    /// </summary>
    public required string Password { get; set; }
}