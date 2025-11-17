using FluentValidation;
using PublicQ.Application.Models.Session;
using PublicQ.Shared.Enums;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// A Validator for <see cref="QuestionResponseOperationDto"/>
/// </summary>
public class QuestionResponseOperationDtoValidator : AbstractValidator<QuestionResponseOperationDto>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    public QuestionResponseOperationDtoValidator()
    {
        RuleFor(x => x.QuestionId)
            .NotEmpty()
            .WithMessage("Question ID is required.");
        
        RuleFor(x => x.SelectedAnswerIds)
            .NotEmpty()
            .Must(x => x is { Count: 1 })
            .WithMessage("Selected answer IDs are required. For single choice questions, exactly one answer must be selected.")
            .When(x => x.QuestionType == QuestionType.SingleChoice);

        RuleFor(x => x.SelectedAnswerIds)
            .NotEmpty()
            .Must(x => x is { Count: > 0 })
            .WithMessage(
                "Selected answer IDs are required. For multiple choice questions, at least one answer must be selected.")
            .When(x => x.QuestionType == QuestionType.MultipleChoice);
        
        RuleFor(x => x.TextResponse)
            .NotEmpty()
            .NotNull()
            .WithMessage("Text response is required.")
            .MaximumLength(1000)
            .WithMessage("Text response must not exceed 1000 characters.")
            .When(x => x.QuestionType == QuestionType.FreeText);
    }
}