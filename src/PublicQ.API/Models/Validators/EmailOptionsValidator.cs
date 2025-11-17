using FluentValidation;
using PublicQ.Infrastructure.Options;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for email configuration options.
/// </summary>
public class EmailOptionsValidator : AbstractValidator<EmailOptions>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public EmailOptionsValidator()
    {
        RuleFor(e => e.MessageProvider)
            .IsInEnum()
            .WithMessage("Email provider is not valid. Check supported email providers and try again.");
        
        RuleFor(e => e.SendFrom)
            .EmailAddress()
            .WithMessage("Email address is not valid.");
    }
}