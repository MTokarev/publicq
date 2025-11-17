using FluentValidation;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Pages;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Page DTO Validator
/// </summary>
/// <typeparam name="T"></typeparam>
public class PageDtoValidator : AbstractValidator<PageDto>  
{
    /// <summary>
    /// Default constructor
    /// </summary>
    public PageDtoValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required.")
            .MaximumLength(256)
            .WithMessage("Title cannot exceed 256 characters.");

        RuleFor(x => x.Body)
            .NotEmpty()
            .WithMessage("Body is required.")
            .MaximumLength(20480)
            .WithMessage("Body cannot exceed 20,480 characters.");

        RuleFor(x => x.JsonData)
            .MaximumLength(20480)
            .WithMessage("JsonData cannot exceed 20,480 characters.")
            .When(x => !string.IsNullOrEmpty(x.JsonData));

        RuleFor(x => x.Type)
            .IsInEnum()
            .WithMessage("Type must be a valid PageType.");
    }
}