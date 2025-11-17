using FluentValidation;
using PublicQ.Infrastructure.Options;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// OpenAI options validator
/// </summary>
public class OpenAIOptionsValidator : AbstractValidator<OpenAIOptions>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public OpenAIOptionsValidator()
    {
        RuleFor(x => x.ApiKey)
            .NotEmpty()
            .MaximumLength(1024)
            .WithMessage("OpenAI API key must be provided.");
        
        RuleFor(x => x.MaxTokens)
            .GreaterThan(0)
            .WithMessage("Max tokens must be greater than zero.");
        
        RuleFor(x => x.Temperature)
            .GreaterThan(0.0)
            .WithMessage("Temperature must be greater than zero.");
        
        RuleFor(x => x.Model)
            .NotEmpty()
            .MaximumLength(256)
            .WithMessage("Model must be provided. Make sure this model is valid for OpenAI.");
    }
}