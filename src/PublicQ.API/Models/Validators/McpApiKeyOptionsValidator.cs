using FluentValidation;
using PublicQ.Infrastructure.Options;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for <see cref="McpApiKeyOptions"/>
/// </summary>
public class McpApiKeyOptionsValidator : AbstractValidator<McpApiKeyOptions>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public McpApiKeyOptionsValidator()
    {
        RuleForEach(x => x.Keys)
            .SetValidator(new ApiKeyValidator());
        
        RuleFor(x => x.Keys)
            .Must(keys => keys.Select(k => k.Key).Distinct().Count() == keys.Count)
            .WithMessage("Duplicate API keys are not allowed. Each key must be unique.");
    }
}

/// <summary>
/// Validator for <see cref="ApiKey"/>
/// </summary>
public class ApiKeyValidator : AbstractValidator<ApiKey>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public ApiKeyValidator()
    {
        RuleFor(x => x.Name)
            .MaximumLength(256)
            .NotEmpty()
            .WithMessage("Name is required.");
        
        RuleFor(x => x.Key)
            .NotEmpty()
            .WithMessage("Key is required.")
            .MinimumLength(36)
            .WithMessage("Key must be at least 36 characters.")
            .MaximumLength(128)
            .WithMessage("Key must not exceed 128 characters.");
        
        RuleFor(x => x.CreatedBy)
            .MaximumLength(256)
            .NotEmpty()
            .WithMessage("CreatedBy is required.");
        
        RuleFor(x => x.CreatedOnUtc)
            .LessThanOrEqualTo(DateTime.UtcNow)
            .WithMessage("CreatedOnUtc cannot be in the future.");
        
        RuleFor(x => x.ValidUntilUtc)
            .GreaterThan(x => x.CreatedOnUtc)
            .When(x => x.ValidUntilUtc.HasValue)
            .WithMessage("ValidUntilUtc must be greater than CreatedOnUtc.");
    }
}