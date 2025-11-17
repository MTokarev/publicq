using FluentValidation;
using PublicQ.API.Models.Requests;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Forget password request validator.
/// </summary>
public class ForgetPasswordRequestValidator : AbstractValidator<ForgetPasswordRequest>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    public ForgetPasswordRequestValidator()
    {
        RuleFor(x => x.EmailAddress)
            .EmailAddress()
            .WithMessage("Invalid email address");
    }
}