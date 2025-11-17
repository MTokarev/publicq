using FluentValidation;
using Microsoft.Extensions.Options;
using PublicQ.API.Models.Requests;
using PublicQ.Infrastructure.Options;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for the RegisterRequest model.
/// </summary>
public class RegisterRequestValidator : AbstractValidator<UserOperationRequest>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    /// <param name="passwordPolicyOptions"></param>
    public RegisterRequestValidator(IOptionsMonitor<PasswordPolicyOptions> passwordPolicyOptions)
    {
        var policy = passwordPolicyOptions.CurrentValue;

        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("Invalid email format.")
            .MaximumLength(254).WithMessage("Email must not exceed 254 characters.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MinimumLength(policy.RequiredLength)
            .WithMessage($"Password must be at least {policy.RequiredLength} characters.");

        RuleFor(x => x.Password)
            .Must(p => !policy.RequireDigit || p.Any(char.IsDigit))
            .WithMessage("Password must contain at least one digit.");

        RuleFor(x => x.Password)
            .Must(p => !policy.RequireLowercase || p.Any(char.IsLower))
            .WithMessage("Password must contain at least one lowercase letter.");

        RuleFor(x => x.Password)
            .Must(p => !policy.RequireUppercase || p.Any(char.IsUpper))
            .WithMessage("Password must contain at least one uppercase letter.");

        RuleFor(x => x.Password)
            .Must(p => !policy.RequireNonAlphanumeric || p.Any(ch => !char.IsLetterOrDigit(ch)))
            .WithMessage("Password must contain at least one special character.");
    }
}