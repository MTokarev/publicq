using FluentValidation;
using PublicQ.Infrastructure.Options;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// SMTP options validator.
/// </summary>
public class SmtpOptionsValidator : AbstractValidator<SmtpOptions>
{
    /// <summary>
    /// Default constructor.
    /// </summary>
    public SmtpOptionsValidator()
    {
        RuleFor(x => x.SmtpHost)
            .NotNull()
            .NotEmpty()
            .WithMessage("SMTP host is required.");
        
        RuleFor(x => x.SmtpPort)
            .InclusiveBetween(1, 65535)
            .WithMessage("SMTP port must be in the range 1-65535.");
    }
}