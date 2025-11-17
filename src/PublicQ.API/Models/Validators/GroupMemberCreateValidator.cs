using FluentValidation;
using PublicQ.Application.Models.Group;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Contains validation rules for <see cref="GroupMemberCreateDto"/>
/// </summary>
public class GroupMemberCreateValidator : AbstractValidator<GroupMemberCreateDto>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public GroupMemberCreateValidator()
    {
        RuleFor(x => x.AssessmentModuleId)
            .NotEmpty()
            .WithMessage("AssessmentModuleId is required.");
        
        RuleFor(x => x.OrderNumber)
            .GreaterThanOrEqualTo(0)
            .WithMessage("OrderNumber must be greater than or equal to 0.");
    }
}