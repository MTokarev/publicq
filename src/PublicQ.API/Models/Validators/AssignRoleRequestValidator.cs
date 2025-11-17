using FluentValidation;
using PublicQ.API.Models.Requests;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Assign role request validator
/// </summary>
public class AssignRoleRequestValidator : AbstractValidator<UserAssignRoleRequest>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public AssignRoleRequestValidator()
    {
        RuleFor(x => x.UserId)
            .NotNull()
            .NotEmpty()
            .WithMessage("Email is required");
        
        RuleFor(x => x.Role)
            .IsInEnum()
            .WithMessage("Role is invalid");
    }
}