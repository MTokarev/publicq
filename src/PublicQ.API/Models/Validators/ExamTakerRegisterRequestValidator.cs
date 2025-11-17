using FluentValidation;
using PublicQ.API.Models.Requests;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validation for <see cref="ExamTakerRegisterRequest"/>
/// </summary>
public class ExamTakerRegisterRequestValidator : AbstractValidator<ExamTakerRegisterRequest>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    public ExamTakerRegisterRequestValidator()
    {
        RuleFor(x => x.Id)
            .MinimumLength(4).WithMessage("Id must be at least 4 characters long.")
            .MaximumLength(50).WithMessage("Id must not exceed 50 characters.")
            .When(x => !string.IsNullOrEmpty(x.Id));
        
        RuleFor(x => x.Email)
            .EmailAddress().WithMessage("Email must be a valid email address.")
            .MaximumLength(254).WithMessage("Email must not exceed 254 characters.")
            .When(x => !string.IsNullOrEmpty(x.Email));
        
        RuleFor(x => x.FullName)
            .NotEmpty().WithMessage("FullName is required.")
            .MinimumLength(2).WithMessage("FullName must be at least 2 characters long.")
            .MaximumLength(200).WithMessage("FullName must not exceed 200 characters.");
    }
}