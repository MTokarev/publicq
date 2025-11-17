using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.API.Models.Requests;
using PublicQ.API.Models.Validators;
using PublicQ.Application;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// Controller for managing assessment modules, including creation,
/// versioning, publishing, static file uploads, and question management.
/// </summary>
[ApiController]
[Authorize]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class AssessmentModulesController(IAssessmentService assessmentService) : ControllerBase
{
    /// <summary>
    /// Creates a new assessment module.
    /// </summary>
    /// <param name="request">The assessment module creation data.</param>
    /// <param name="validator">FluentValidator instance for validation.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>HTTP response containing the result of the operation.</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPost]
    public async Task<IActionResult> CreateAssessmentModuleAsync(
        [FromBody] AssessmentModuleCreateDto request,
        [FromServices] IValidator<AssessmentModuleCreateDto> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<AssessmentModuleCreateDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        request.CreatedByUser = fullName;
        
        var result = await assessmentService.CreateModuleAsync(request, cancellationToken);
        
        return result.ToActionResult();
    }

    /// <summary>
    /// Retrieves an assessment module by its ID.
    /// </summary>
    /// <param name="filter"><see cref="AssessmentModuleFilter"/></param>
    /// <param name="validator"><see cref="AssessmentModuleFilterValidator"/></param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>HTTP response with the module or error information.</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpGet("filter")]
    public async Task<IActionResult> GetModuleAsync(
        [FromQuery] AssessmentModuleFilter filter,
        [FromServices] IValidator<AssessmentModuleFilter> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(filter, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<AssessmentModuleDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var response = await assessmentService.GetModuleAsync(filter, cancellationToken);
        
        // Convert relative URLs to absolute URLs
        if (response.IsSuccess)
        {
            response.Data.ToAbsoluteUrls($"{Request.Scheme}://{Request.Host}");
        }
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Gets all assessment modules with pagination.
    /// </summary>
    /// <param name="request">Request model <see cref="GetPaginatedEntitiesRequest"/></param>
    /// <param name="validator">Validator</param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns paginated response wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpGet("all")]
    public async Task<IActionResult> GetAllModulesAsync(
        [FromQuery] GetPaginatedEntitiesRequest request,
        [FromServices] IValidator<GetPaginatedEntitiesRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var response = await assessmentService.GetModulesAsync(request.PageNumber, request.PageSize, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Gets assessment modules filtered by a title substring.
    /// </summary>
    /// <param name="title">Module title</param>
    /// <param name="request"><see cref="GetPaginatedEntitiesRequest"/></param>
    /// <param name="validator">Validator</param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns paginated modules</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpGet]
    public async Task<IActionResult> GetModulesByTitleAsync(
        [FromQuery] string title,
        [FromQuery] GetPaginatedEntitiesRequest request,
        [FromServices] IValidator<GetPaginatedEntitiesRequest> validator,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return Response<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Title query cannot be empty.")
                .ToActionResult();
        }
        
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var response = await assessmentService.GetModulesByTitleAsync(title, request.PageNumber, request.PageSize, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Retrieves a specific version of an assessment module.
    /// </summary>
    /// <param name="id">The ID of the module version.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>HTTP response with the module version or error.</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpGet("versions/{id}")]
    public async Task<IActionResult> GetModuleVersionAsync(Guid id, CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
        {
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest, "Module version ID cannot be empty.")
                .ToActionResult();
        }
        
        var response = await assessmentService.GetModuleVersionAsync(id, cancellationToken);
        
        // Convert relative URLs to absolute URLs
        if (response.IsSuccess)
        {
            response.Data.ToAbsoluteUrls($"{Request.Scheme}://{Request.Host}");
        }
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Retrieves the latest <b>published</b> module version (one per module) without a title filter.
    /// </summary>
    /// <param name="request"> <see cref="GetPaginatedEntitiesRequest"/></param>
    /// <param name="validator">Validator</param>
    /// <param name="cancellationToken">Operation cancellation token.</param>
    /// <returns>
    /// A <see cref="Response{TData, TStatus}"/> wrapping a <see cref="PaginatedResponse{T}"/> of
    /// <see cref="AssessmentModuleVersionDto"/> items, where each item is the highest <c>Version</c> (int)
    /// among published versions for its module.
    /// </returns>
    /// <remarks>
    /// <para>
    /// This endpoint enforces the “latest per module” rule by selecting <c>MAX(Version)</c> across
    /// published versions for each module. It will return flat module versions. They won't have attached questions or answers.
    /// </para>
    /// <para>
    /// If the dataset is small, and you must return all items, either (1) set a very large <c>pageSize</c>
    /// explicitly, or (2) provide a dedicated export (e.g., NDJSON/CSV) to keep API responses stable and memory-safe.
    /// </para>
    /// </remarks>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpGet("versions/latest/all")]
    public async Task<IActionResult> GetAllLatestPublishedModuleVersionsAsync(
        [FromQuery] GetPaginatedEntitiesRequest request,
        [FromServices] IValidator<GetPaginatedEntitiesRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var response = await assessmentService.GetAllLatestPublishedModuleVersionsAsync(
            request.PageNumber, 
            request.PageSize, 
            cancellationToken);
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Searches latest <b>published</b> module versions (one per module) filtered by a title substring.
    /// </summary>
    /// <param name="title">
    /// Optional case-insensitive substring to match against the version title.  
    /// If <c>null</c> or empty, no title filter is applied and all modules with at least one published version are considered.
    /// </param>
    /// <param name="request"> <see cref="GetPaginatedEntitiesRequest"/></param>
    /// <param name="validator">Validator <see cref="GetPaginatedEntitiesRequestValidator"/></param>
    /// <param name="cancellationToken">Operation cancellation token.</param>
    /// <returns>
    /// A <see cref="Response{TData, TStatus}"/> wrapping a <see cref="PaginatedResponse{T}"/> of
    /// <see cref="AssessmentModuleVersionDto"/> items. Each item represents the latest published version
    /// for a distinct module that matches the (optional) title filter.
    /// </returns>
    /// <remarks>
    /// <para>
    /// This will return flat module versions. They won't have attached questions or answers.
    /// </para>
    /// <para>
    /// Sorting is typically by newest (e.g., <c>Version</c> desc, then <c>CreatedAtUtc</c> desc).
    /// </para>
    /// </remarks>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpGet("versions/latest")]
    public async Task<IActionResult> GetLatestPublishedModuleVersionsByTitleAsync(
        [FromQuery] string title,
        [FromQuery] GetPaginatedEntitiesRequest request,
        [FromServices] IValidator<GetPaginatedEntitiesRequest> validator,
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(title))
        {
            return Response<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Title query cannot be empty.")
                .ToActionResult();
        }
        
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var response = await assessmentService.GetPublishedLatestModuleVersionsByTitleAsync(
            title,
            request.PageNumber, 
            request.PageSize, 
            cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Creates a new version for an existing assessment module.
    /// </summary>
    /// <param name="validator">Validator for the create DTO.</param>
    /// <param name="dto">Data required to create a new module version.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>HTTP response with the created module version.</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPost("versions")]
    public async Task<IActionResult> CreateNewModuleVersionAsync(
        [FromBody] AssessmentModuleVersionCreateDto dto, 
        [FromServices] IValidator<AssessmentModuleVersionCreateDto> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(dto, cancellationToken);
        
        if (!validationResult.IsValid)
        {
            return Response<AssessmentModuleVersionCreateDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        dto.CreatedByUser = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await assessmentService.CreateModuleVersionAsync(dto, cancellationToken);

        if (response.IsSuccess)
        {
            response.Data.ToAbsoluteUrls($"{Request.Scheme}://{Request.Host}");
        }
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Updates a not yet published assessment module version.
    /// </summary>
    /// <param name="request">The update DTO for the module version.</param>
    /// <param name="validator">Validator for the update DTO.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>HTTP response with the operation result.</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPatch("versions/draft")]
    public async Task<IActionResult> UpdateDraftModuleVersionAsync(
        [FromBody] AssessmentModuleVersionUpdateDto request,
        [FromServices] IValidator<AssessmentModuleVersionUpdateDto> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        
        if (!validationResult.IsValid)
        {
            return Response<AssessmentModuleVersionDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await assessmentService.UpdateDraftModuleVersionAsync(request, fullName, cancellationToken);

        if (response.IsSuccess)
        {
            response.Data.ToAbsoluteUrls($"{Request.Scheme}://{Request.Host}");
        }
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Updates an already published assessment module version.
    /// </summary>
    /// <param name="request">The update DTO for the module version.</param>
    /// <param name="validator">Validator for the update DTO.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>HTTP response with the operation result.</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPatch("versions/published")]
    public async Task<IActionResult> UpdatePublishedModuleVersionAsync(
        [FromBody] AssessmentModuleVersionUpdatePublishedDto request,
        [FromServices] IValidator<AssessmentModuleVersionUpdatePublishedDto> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);
        
        if (!validationResult.IsValid)
        {
            return Response<AssessmentModuleVersionDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await assessmentService.UpdatePublishedModuleVersionAsync(request, fullName, cancellationToken);
        
        if (response.IsSuccess)
        {
            response.Data.ToAbsoluteUrls($"{Request.Scheme}://{Request.Host}");
        }
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Publishes a specified assessment module version.
    /// </summary>
    /// <param name="id">The ID of the version to publish.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>HTTP response indicating success or failure.</returns>
    [Authorize(Constants.ModeratorsPolicy)]
    [HttpPatch("versions/{id:guid}/publish")]
    public async Task<IActionResult> PublishModuleVersionAsync(Guid id, CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Module version ID cannot be empty.")
                .ToActionResult();
        }
        
        var response = await assessmentService.PublishModuleVersionAsync(id, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Uploads a static file associated with an assessment module.
    /// </summary>
    /// <param name="request">The file upload request containing the module ID and file.</param>
    /// <param name="validator">Validator for the upload request.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>HTTP response with the uploaded file details.</returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPost("files")]
    [ServiceFilter(typeof(UploadSizeLimitFilter))]
    public async Task<IActionResult> UploadFilesAsync(
        FileUploadRequest request,
        [FromServices] IValidator<FileUploadRequest> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);

        if (!validationResult.IsValid)
        {
            return Response<StaticFileDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        await using var stream = request.File!.OpenReadStream();
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream, cancellationToken);

        var fileToUpload = new FileUploadDto()
        {
            Name = request.File.FileName,
            Content = memoryStream.ToArray()
        };
        var response = await assessmentService.SaveAssociatedWithModuleStaticFileAsync(
            request.ModuleId, 
            fileToUpload, 
            request.IsModuleLevelFile,
            cancellationToken);
        
        return response.ToActionResult();
    }
    
    
    /// <summary>
    /// Deletes an assessment module by its ID.
    /// </summary>
    /// <param name="id">Module ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteModuleAsync(Guid id, CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Module ID cannot be empty.")
                .ToActionResult();
        }
        
        var response = await assessmentService.DeleteModuleAsync(id, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Gets the total count of assessment modules in the system.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns the total number of <see cref="AssessmentModuleDto"/> wrapped in <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("total")]
    public async Task<IActionResult> GetTotalModulesAsync(CancellationToken cancellationToken)
    {
        var response = await assessmentService.GetTotalAssessmentModulesAsync(cancellationToken);
        
        return response.ToActionResult();
    }
}
