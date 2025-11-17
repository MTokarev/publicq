using FluentValidation;
using PublicQ.Application.Models.Banner;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for <see cref="BannerDto"/>
/// </summary>
public class BannerDtoValidator : AbstractValidator<BannerDto>
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public BannerDtoValidator()
    {
        RuleFor(dto => dto.Title)
            .MaximumLength(200)
            .WithMessage("Title cannot exceed 200 characters.");
        
        RuleFor(dto => dto.Content)
            .NotEmpty().WithMessage("Content is required.")
            .MaximumLength(5000)
            .WithMessage("Content cannot exceed 5000 characters.");
        
        RuleFor(dto => dto.Type)
            .IsInEnum()
            .WithMessage("Invalid banner type.");

        RuleFor(dto => dto.EndDateUtc)
            .GreaterThan(DateTime.UtcNow)
            .When(dto => dto.EndDateUtc.HasValue)
            .WithMessage("End date must be in the future.");
    }
}