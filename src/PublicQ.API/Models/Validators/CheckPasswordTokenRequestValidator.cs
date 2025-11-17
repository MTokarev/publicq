using FluentValidation;
using PublicQ.API.Models.Requests;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Password reset token request validator.
/// </summary>
public class CheckPasswordTokenRequestValidator: AbstractValidator<CheckPasswordTokenRequest>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    public CheckPasswordTokenRequestValidator()
    {
        RuleFor(request => request.Email)
            .EmailAddress()
            .WithMessage("Email is required");
        
        RuleFor(request => request.Token)
            .NotNull()
            .NotEmpty()
            .WithMessage("Token is required");
    }
}