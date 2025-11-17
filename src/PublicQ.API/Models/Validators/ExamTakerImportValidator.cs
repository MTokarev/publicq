using FluentValidation;
using PublicQ.Application.Models;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Exam taker import validation
/// </summary>
public class ExamTakerImportValidator : AbstractValidator<IList<ExamTakerImportDto>>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public ExamTakerImportValidator()
    {
        RuleFor(x => x)
            .NotNull()
            .WithMessage("Exam takers list cannot be null.")
            .NotEmpty()
            .WithMessage("At least one exam taker must be provided.");

        RuleForEach(x => x).ChildRules(examTaker =>
        {
            examTaker.RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Exam taker name is required.")
                .MaximumLength(200)
                .WithMessage("Exam taker name must not exceed 200 characters.");

            examTaker.RuleFor(x => x.Email)
                .EmailAddress()
                .When(x => !string.IsNullOrWhiteSpace(x.Email))
                .WithMessage("Email must be a valid email address when provided.")
                .MaximumLength(254)
                .When(x => !string.IsNullOrWhiteSpace(x.Email))
                .WithMessage("Email must not exceed 254 characters when provided.");
        });
    }
}