using FluentValidation;
using PublicQ.Application.Models.Exam;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Assessment module creation DTO validator.
/// </summary>
public class AssessmentModuleCreateDtoValidator : AbstractValidator<AssessmentModuleCreateDto>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    public AssessmentModuleCreateDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Module title cannot be empty.")
            .MaximumLength(200)
            .WithMessage("Module title cannot exceed 200 characters.");

        RuleFor(x => x.DurationInMinutes)
            .GreaterThan(0)
            .WithMessage("Module duration must be greater than zero.");
        
        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Module description cannot be empty.")
            .MaximumLength(5000)
            .WithMessage("Module description cannot exceed 5000 characters.");
        
        RuleFor(x => x.PassingScorePercentage)
            .InclusiveBetween(1, 100)
            .WithMessage("Passing score percentage must be between 1 and 100.");
        
        RuleFor(x => x.DurationInMinutes)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Module duration must be greater than or equal to 0 minutes.");
    }
}