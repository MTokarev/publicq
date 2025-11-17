using FluentValidation;
using PublicQ.Application.Models;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for <see cref="CacheConfigurationDto"/>.
/// </summary>
public class CacheConfigurationDtoValidator : AbstractValidator<CacheConfigurationDto>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    public CacheConfigurationDtoValidator()
    {
        RuleFor(x => x.ReportCacheDurationInMinutes)
            .ExclusiveBetween(0, 1440)
            .WithMessage("ReportCacheDurationInMinutes must be between 1 and 1440 minutes (24 hours).");
        
        RuleFor(x => x.KeyPrefix)
            .NotEmpty()
            .NotEmpty()
            .When(x => true)
            .WithMessage("KeyPrefix must not be empty.");
        
        RuleFor(x => x.ConnectionString)
            .NotEmpty()
            .NotEmpty()
            .When(x => true)
            .WithMessage("Connection string must not be empty.");
    }
}