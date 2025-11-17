using FluentValidation;
using PublicQ.Application;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Assessment Module Filter Validator
/// </summary>
public class AssessmentModuleFilterValidator : AbstractValidator<AssessmentModuleFilter>
{
    /// <summary>
    /// Default Constructor
    /// </summary>
    public AssessmentModuleFilterValidator()
    {
        // At least one filter criterion must be provided
        RuleFor(filter => filter)
            .Must(filter => filter.Id.HasValue || !string.IsNullOrWhiteSpace(filter.Title))
            .WithMessage("At least one filter criterion (Id or Title) must be provided.");
        
        // If Id is provided, it must be a valid GUID (not empty)
        RuleFor(filter => filter.Id)
            .Must(id => id.HasValue && id.Value != Guid.Empty)
            .WithMessage("Id must be a valid GUID when provided.")
            .When(filter => filter.Id.HasValue);
    }
}