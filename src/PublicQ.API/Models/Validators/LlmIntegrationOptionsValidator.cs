using FluentValidation;
using PublicQ.Infrastructure.Options;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Defines validation rules for <see cref="LlmIntegrationOptions"/>
/// </summary>
public class LlmIntegrationOptionsValidator : AbstractValidator<LlmIntegrationOptions>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public LlmIntegrationOptionsValidator()
    {
        RuleFor(x => x.Provider)
            .IsInEnum()
            .WithMessage("LLM Provider must be a valid enum value.");
    }
}