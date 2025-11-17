using FluentValidation;
using PublicQ.API.Models.Requests;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// User registration request validator.
/// </summary>
public class UserRegisterRequestValidator : AbstractValidator<UserRegisterRequest>
{
    /// <summary>
    /// User registration request validator constructor.
    /// </summary>
    public UserRegisterRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email is required.")
            .MaximumLength(254).WithMessage("Email must not exceed 254 characters.");

        RuleFor(x => x.Password)
            .NotEmpty().WithMessage("Password is required.")
            .MaximumLength(100).WithMessage("Password must not exceed 100 characters.");
        
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("FullName is required.")
            .MinimumLength(2).WithMessage("FullName must be at least 2 characters long.")
            .MaximumLength(200).WithMessage("FullName must not exceed 200 characters.");
    }
}