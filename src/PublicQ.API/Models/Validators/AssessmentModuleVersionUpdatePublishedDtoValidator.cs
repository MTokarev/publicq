using FluentValidation;
using PublicQ.Application.Models.Exam;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for updating the published version of an assessment module.
/// </summary>
public class AssessmentModuleVersionUpdatePublishedDtoValidator : AbstractValidator<AssessmentModuleVersionUpdatePublishedDto>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public AssessmentModuleVersionUpdatePublishedDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Id cannot be empty");
            
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Module title cannot be empty.")
            .MaximumLength(200)
            .WithMessage("Module title cannot exceed 200 characters.");
        
        RuleFor(x => x.Description)
            .NotEmpty()
            .WithMessage("Module description cannot be empty.")
            .MaximumLength(5000)
            .WithMessage("Module description cannot exceed 5000 characters.");
            
        RuleFor(x => x.DurationInMinutes)
            .GreaterThan(0)
            .WithMessage("Duration in minutes must be greater than 0.");
    }
}