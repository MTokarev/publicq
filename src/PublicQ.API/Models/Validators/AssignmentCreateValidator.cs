using FluentValidation;
using PublicQ.Application.Models.Assignment;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for AssignmentCreateDto <seealso cref="AssignmentCreateDto"/>
/// </summary>
public class AssignmentCreateValidator : AbstractValidator<AssignmentCreateDto>
{
    /// <summary>
    /// Defines validation rules for creating an assignment.
    /// </summary>
    public AssignmentCreateValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required.")
            .MaximumLength(200)
            .WithMessage("Assignment title must not exceed 200 characters.");
        
        RuleFor(x => x.Description)
            .MaximumLength(5000)
            .When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("Assignment description must not exceed 5000 characters.");
        
        RuleFor(x => x.GroupId)
            .NotEmpty()
            .WithMessage("GroupId is required.");
    }
}