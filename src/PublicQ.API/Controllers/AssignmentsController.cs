using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Assignment;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// API controller for managing assignments and exam takers.
/// </summary>
[ApiController]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class AssignmentsController(IAssignmentService assignmentService) : ControllerBase
{
    /// <summary>
    /// Creates a new assignment.
    /// </summary>
    /// <param name="assignmentCreateDto">The assignment creation data.</param>
    /// <param name="validator">Validator for <see cref="AssignmentCreateDto"/>.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>An <see cref="IActionResult"/> with the creation response.</returns>
    [Authorize(Constants.ModeratorsPolicy)]
    [HttpPost]
    public async Task<IActionResult> CreateAssignmentAsync(
        [FromBody] AssignmentCreateDto assignmentCreateDto,
        [FromServices] IValidator<AssignmentCreateDto> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(assignmentCreateDto, cancellationToken);
        
        if (!validationResult.IsValid)
        {
            return Response<AssignmentCreateDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await assignmentService.CreateAsync(fullName, assignmentCreateDto, cancellationToken);
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Gets a paginated list of assignments.
    /// </summary>
    /// <param name="pageNumber">Optional: Page number</param>
    /// <param name="pageSize">Optional: Page size</param>
    /// <param name="titleFilter">Optional: Filter on title</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>An <see cref="IActionResult"/> with the list of assignments.</returns>
    [Authorize(Constants.ModeratorsPolicy)]
    [HttpGet]
    public async Task<IActionResult> GetAssignmentsAsync(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? titleFilter = default,
        CancellationToken cancellationToken = default)
    {
        var response = await assignmentService.GetAssignmentsAsync(pageNumber, pageSize, titleFilter, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Gets an assignment by its ID.
    /// </summary>
    /// <remarks>
    /// This API endpoint needs to be accessible to exam takers as well, so no special authorization policy is applied.
    /// </remarks>
    /// <param name="id">The assignment ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>An <see cref="IActionResult"/> with the assignment details.</returns>
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetAssignmentByIdAsync(Guid id, CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
        {
            return Response<AssignmentDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed. Assignment ID cannot be empty.")
                .ToActionResult();
        }
        
        var response = await assignmentService.GetByIdAsync(id, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Gets a paginated list of available assignments for a specific exam taker.
    /// Available assignments are those that are published, and the exam taker has associated with their account.
    /// </summary>
    /// <param name="examTakerId">Exam taker ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a paginated list of assignments</returns>
    [HttpGet("available/{examTakerId}")]
    public async Task<IActionResult> GetAvailableAssignmentsAsync(
        string examTakerId,
        CancellationToken cancellationToken = default)
    {
        if (string.IsNullOrWhiteSpace(examTakerId))
        {
            return Response<PaginatedResponse<AssignmentDto>, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed. Exam taker ID cannot be empty.")
                .ToActionResult();
        }
        
        var response = await assignmentService.GetAvailableAssignmentsAsync(
            examTakerId, 
            cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Updates an existing assignment.
    /// </summary>
    /// <param name="updateDto">The assignment update data.</param>
    /// <param name="validator">Validator for <see cref="AssignmentUpdateDto"/>.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>An <see cref="IActionResult"/> with the update response.</returns>
    [Authorize(Constants.ModeratorsPolicy)]
    [HttpPut]
    public async Task<IActionResult> UpdateAssignmentAsync(
        [FromBody] AssignmentUpdateDto updateDto,
        [FromServices] IValidator<AssignmentUpdateDto> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(updateDto, cancellationToken);
        
        if (!validationResult.IsValid)
        {
            return Response<AssignmentUpdateDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await assignmentService.UpdateAsync(updateDto, fullName, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Deletes an assignment by ID.
    /// </summary>
    /// <param name="id">The assignment ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>An <see cref="IActionResult"/> with the delete response.</returns>
    [Authorize(Constants.ModeratorsPolicy)]
    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> DeleteAssignmentAsync(Guid id, CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed. Assignment ID cannot be empty.")
                .ToActionResult();
        }
        
        var response = await assignmentService.DeleteAsync(id, cancellationToken);
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Gets the list of exam takers for a given assignment.
    /// </summary>
    /// <param name="id">The assignment ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>An <see cref="IActionResult"/> containing the exam takers or an error response.</returns>
    [Authorize(Constants.ModeratorsPolicy)]
    [HttpGet("{id:guid}/exam-takers")]
    public async Task<IActionResult> GetExamTakersAsync(Guid id, CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed. Assignment ID cannot be empty.")
                .ToActionResult();
        }
        
        var response = await assignmentService.GetExamTakersAsync(id, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Adds exam takers to an assignment.
    /// </summary>
    /// <param name="id">The assignment ID.</param>
    /// <param name="examTakerIds">The exam taker IDs to add.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>An <see cref="IActionResult"/> with the update response.</returns>
    [Authorize(Constants.ModeratorsPolicy)]
    [HttpPost("{id:guid}/exam-takers")]
    public async Task<IActionResult> AddExamTakersAsync(
        Guid id, 
        [FromBody] HashSet<string> examTakerIds, 
        CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed. Assignment ID cannot be empty.")
                .ToActionResult();
        }
        
        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await assignmentService.AddExamTakersAsync(
            id, 
            examTakerIds, 
            fullName, 
            cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Removes exam takers from an assignment.
    /// </summary>
    /// <param name="id">The assignment ID.</param>
    /// <param name="examTakerIds">The exam taker IDs to remove.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>An <see cref="IActionResult"/> with the update response.</returns>
    [Authorize(Constants.ModeratorsPolicy)]
    [HttpDelete("{id:guid}/exam-takers")]
    public async Task<IActionResult> RemoveExamTakersAsync(Guid id, [FromBody] HashSet<string> examTakerIds, CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed. Assignment ID cannot be empty.")
                .ToActionResult();
        }
        
        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await assignmentService.RemoveExamTakersAsync(
            id, 
            examTakerIds, 
            fullName,
            cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Publishes an assignment.
    /// </summary>
    /// <param name="id">The assignment ID.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>An <see cref="IActionResult"/> with the publish response.</returns>
    [Authorize(Constants.ModeratorsPolicy)]
    [HttpPost("{id:guid}/publish")]
    public async Task<IActionResult> PublishAssignmentAsync(Guid id, CancellationToken cancellationToken)
    {
        if (id == Guid.Empty)
        {
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed. Assignment ID cannot be empty.")
                .ToActionResult();
        }
        
        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await assignmentService.PublishAsync(id, fullName, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Gets the total number of assignments.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>An <see cref="IActionResult"/> with the count of assignments.</returns>
    [Authorize]
    [HttpGet("total")]
    public async Task<IActionResult> GetAssignmentCountAsync(CancellationToken cancellationToken)
    {
        var response = await assignmentService.GetAssignmentCountAsync(cancellationToken);
        
        return response.ToActionResult();
    }
}