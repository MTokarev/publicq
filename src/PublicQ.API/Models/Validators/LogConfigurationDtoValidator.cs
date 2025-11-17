using FluentValidation;
using PublicQ.Application.Models;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// A validator for the <see cref="LogConfigurationDto"/> model.
/// </summary>
public class LogConfigurationDtoValidator : AbstractValidator<LogConfigurationDto>
{
    /// <summary>
    /// Default constructor that sets up validation rules.
    /// </summary>
    public LogConfigurationDtoValidator()
    {
        RuleFor(x => x.Enable)
            .NotNull();
        
        RuleFor(x => x.LogLevel)
            .IsInEnum();
        
        RuleFor(x => x.RetentionPeriodInDays)
            .GreaterThan(0)
            .WithMessage("StoredLogsMaxDays must be greater than 0.");
    }
}