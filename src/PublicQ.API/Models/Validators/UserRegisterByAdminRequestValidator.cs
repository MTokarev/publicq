using FluentValidation;
using PublicQ.API.Models.Requests;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for <see cref="UserRegisterByAdminRequest"/>.
/// </summary>
public class UserRegisterByAdminRequestValidator : AbstractValidator<UserRegisterByAdminRequest>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    public UserRegisterByAdminRequestValidator()
    {
        RuleFor(x => x.Email)
            .NotEmpty().WithMessage("Email is required.")
            .EmailAddress().WithMessage("A valid email is required.")
            .MaximumLength(254).WithMessage("Email must not exceed 254 characters.");

        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("FullName is required.")
            .MinimumLength(2).WithMessage("FullName must be at least 2 characters long.")
            .MaximumLength(200).WithMessage("FullName must not exceed 200 characters.");
    }
}