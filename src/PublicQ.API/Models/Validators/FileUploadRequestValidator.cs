using FluentValidation;
using PublicQ.API.Models.Requests;
using PublicQ.Application;
using PublicQ.Application.Interfaces;

namespace PublicQ.API.Models.Validators;

/// <summary>
/// Validator for file upload requests.
/// </summary>
public class FileUploadRequestValidator : AbstractValidator<FileUploadRequest>
{
    /// <summary>
    /// Constructor with assessment service dependency
    /// </summary>
    /// <param name="assessmentService">Assessment service for validation</param>
    public FileUploadRequestValidator(IAssessmentService assessmentService)
    {
        RuleFor(x => x.ModuleId)
            .NotEmpty()
            .WithMessage("Module Version ID is required.")
            .MustAsync(
                async (id, cancellationToken) =>
                {
                    var response = await assessmentService.GetModuleAsync(new AssessmentModuleFilter
                    {
                        Id = id
                    }, cancellationToken);
                    return response.IsSuccess;
                }
            )
            .WithMessage("Module Version does not exist or is not valid.");

        RuleFor(x => x.File)
            .NotNull()
            .WithMessage("File is required.")
            .NotEmpty()
            .WithMessage("Please select a file to upload.");
    }
}