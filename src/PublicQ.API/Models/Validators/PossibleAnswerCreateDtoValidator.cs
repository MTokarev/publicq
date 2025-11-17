using FluentValidation;
using PublicQ.Application.Models.Exam;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// PossibleAnswerCreateDto validator <seealso cref="PossibleAnswerCreateDto"/>
/// </summary>
public class PossibleAnswerCreateDtoValidator : AbstractValidator<PossibleAnswerCreateDto>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public PossibleAnswerCreateDtoValidator()
    {
        RuleFor(x => x.Text)
            .MaximumLength(2000)
            .When(x => !string.IsNullOrEmpty(x.Text))
            .WithMessage("Answer text must not exceed 2000 characters.");

        RuleFor(x => string.IsNullOrEmpty(x.Text) && x.StaticFileIds.Count == 0)
            .Equal(false)
            .WithMessage("Text or ImageId must be provided.");
    }
}