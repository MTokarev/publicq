using FluentValidation;
using PublicQ.API.Models.Requests;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Password reset request validator.
/// </summary>
public class ResetPasswordRequestValidator: AbstractValidator<ResetPasswordRequest>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    public ResetPasswordRequestValidator()
    {
        RuleFor(request => request.Email)
            .EmailAddress()
            .WithMessage("Email is required")
            .MaximumLength(254)
            .WithMessage("Email must not exceed 254 characters.");
        
        RuleFor(request => request.Token)
            .NotNull()
            .NotEmpty()
            .WithMessage("Token is required");
        
        RuleFor(request => request.NewPassword)
            .NotNull()
            .NotEmpty()
            .WithMessage("New password is required")
            .MaximumLength(100)
            .WithMessage("Password must not exceed 100 characters.");
    }
}