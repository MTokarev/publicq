using FluentValidation;
using PublicQ.API.Models.Requests;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for <see cref="GetPaginatedEntitiesRequest"/>.
/// </summary>
public class GetPaginatedEntitiesRequestValidator : AbstractValidator<GetPaginatedEntitiesRequest>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public GetPaginatedEntitiesRequestValidator()
    {
        RuleFor(x => x.PageSize)
            .GreaterThanOrEqualTo(0)
            .WithMessage("Page size must be greater than or equal to 0.");

        RuleFor(x => x.PageSize)
            .GreaterThan(0)
            .WithMessage("Page size must be greater than 0.");
    }
}