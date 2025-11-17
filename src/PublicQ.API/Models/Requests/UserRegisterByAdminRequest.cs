namespace PublicQ.API.Models.Requests;

/// <summary>
/// User registration request model by an admin (inherits from UserRegisterRequest).
/// </summary>
public class UserRegisterByAdminRequest : UserRegisterRequest
{
    /// <summary>
    /// Password of the user.
    /// This property is redefined to be nullable, as an admin might not set a password during registration.
    /// </summary>
    public new string? Password { get; set; }
}