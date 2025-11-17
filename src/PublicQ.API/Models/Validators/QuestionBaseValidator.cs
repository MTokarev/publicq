using FluentValidation;
using PublicQ.Application.Models.Exam;
using PublicQ.Shared.Enums;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for question update operations.
/// </summary>
public class QuestionBaseValidator : AbstractValidator<QuestionUpdateDto>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public QuestionBaseValidator()
    {
        RuleFor(x => x.Answers)
            .NotEmpty()
            .WithMessage("Answers are required.");
        
        RuleForEach(x => x.Answers)
            .SetValidator(new PossibleAnswerCreateDtoValidator());
        
        RuleFor(q => q.Answers.Count(a => a.IsCorrect))
            .Equal(1)
            .When(q =>
                q.Type == QuestionType.SingleChoice)
            .WithMessage("Exactly one answer must be marked as correct for single-choice questions.");

        RuleFor(q => q.Answers.Count(a => a.IsCorrect))
            .GreaterThan(0)
            .When(q => 
                q.Type is QuestionType.MultipleChoice or QuestionType.FreeText)
            .WithMessage("At least one answer must be marked as correct for multiple-choice or free text questions.");
        
        RuleFor(x => x.Text)
            .NotEmpty()
            .When(x => x.StaticFileIds?.Count == 0)
            .WithMessage("Text is required.")
            .MaximumLength(5000)
            .WithMessage("Question text must not exceed 5000 characters.");
        
        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Type must be a valid enum value.");
    }
}