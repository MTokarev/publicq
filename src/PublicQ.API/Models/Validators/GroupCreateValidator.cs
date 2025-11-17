using FluentValidation;
using PublicQ.Application.Models.Group;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for <see cref="GroupCreateDto"/>
/// </summary>
public class GroupCreateValidator : AbstractValidator<GroupCreateDto>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public GroupCreateValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Group title is required.")
            .MaximumLength(200)
            .WithMessage("Group title must not exceed 200 characters.");

        RuleFor(x => x.Description)
            .MaximumLength(5000)
            .When(x => !string.IsNullOrEmpty(x.Description))
            .WithMessage("Group description must not exceed 5000 characters.");
        
        RuleForEach(x => x.GroupMembers)
            .SetValidator(new GroupMemberCreateValidator());
    }
}