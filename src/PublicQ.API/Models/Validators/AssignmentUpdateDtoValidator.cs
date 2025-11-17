using FluentValidation;
using PublicQ.Application.Models.Assignment;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for AssignmentUpdateDto <seealso cref="AssignmentUpdateDto"/>
/// </summary>
public class AssignmentUpdateDtoValidator : AbstractValidator<AssignmentUpdateDto>
{
    /// <summary>
    /// Defines validation rules for updating an assignment.
    /// </summary>
    public AssignmentUpdateDtoValidator()
    {
        RuleFor(x => x.Id)
            .NotEmpty()
            .WithMessage("Id is required.");
        
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required.")
            .MaximumLength(200)
            .WithMessage("Assignment title must not exceed 200 characters.");
        
        RuleFor(x => x.Description)
            .MaximumLength(5000)
            .When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("Assignment description must not exceed 5000 characters.");
    }
}