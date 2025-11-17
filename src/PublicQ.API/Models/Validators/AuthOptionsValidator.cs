using FluentValidation;
using PublicQ.Infrastructure.Options;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Auth options validator.
/// </summary>
public class AuthOptionsValidator : AbstractValidator<AuthOptions>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public AuthOptionsValidator()
    {
        RuleFor(o => o.JwtSettings).NotNull().SetValidator(new JwtSettingsValidator());
    }
}

/// <summary>
/// JWT settings validator.
/// </summary>
public class JwtSettingsValidator : AbstractValidator<JwtSettings>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public JwtSettingsValidator()
    {
        RuleFor(o => o.Issuer).NotEmpty().WithMessage("JWT Issuer is required.");
        RuleFor(o => o.Audience).NotEmpty().WithMessage("JWT Audience is required.");
        RuleFor(o => o.Secret).NotEmpty().WithMessage("JWT Secret is required.")
            .MinimumLength(32).WithMessage("JWT Secret must be at least 32 characters long.");
    }
}