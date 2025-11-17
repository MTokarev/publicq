using FluentValidation;
using PublicQ.API.Models.Requests;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for user password reset requests.
/// </summary>
public class UserPasswordResetRequestValidator : AbstractValidator<UserPasswordResetRequest>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public UserPasswordResetRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotNull()
            .NotEmpty()
            .EmailAddress()
            .WithMessage("Email is required and must be a valid email address.");
        
        // Password reset bypasses the password complexity requirements but must still be a minimum length.
        RuleFor(x => x.Password)
            .NotNull()
            .NotEmpty()
            .MinimumLength(8)
            .WithMessage("Password is required and must be at least 8 characters long.");
    }
}