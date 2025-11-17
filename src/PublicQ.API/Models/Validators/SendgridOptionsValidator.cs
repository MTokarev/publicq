using FluentValidation;
using PublicQ.Infrastructure.Options;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for SendGrid configuration options.
/// </summary>
public class SendgridOptionsValidator : AbstractValidator<SendgridOptions>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public SendgridOptionsValidator()
    {
        RuleFor(x => x.ApiKey)
            .NotNull()
            .NotEmpty()
            .MinimumLength(2)
            .WithMessage("Please specify a valid Sendgrid API key");
    }
}