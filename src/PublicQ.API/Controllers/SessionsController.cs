using FluentValidation;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.API.Models.Validators;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Session;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// SessionController handles endpoints related to user sessions and their interactions within groups.
/// </summary>
/// <param name="sessionService"></param>
[ApiController] 
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class SessionsController(ISessionService sessionService) : ControllerBase
{
    /// <summary>
    /// Fetches the list of group members along with their current module statuses for a specific user and group.
    /// </summary>
    /// <param name="examTakerAssignmentId">Exam Taker Assignment ID</param>
    /// <param name="groupId">Group ID</param>
    /// <param name="userId">User ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns list of <see cref="GroupMemberStateWithUserProgressDto"/> wrapped in <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("{userId}/assignment/{examTakerAssignmentId:guid}/group/{groupId:guid}/members")]
    public async Task<IActionResult> GetGroupMembersAsync(
        [FromRoute] string userId,
        [FromRoute] Guid examTakerAssignmentId,
        [FromRoute] Guid groupId, 
        CancellationToken cancellationToken)
    {
        if (groupId == Guid.Empty)
        {
            return Response<IList<GroupMemberStateWithUserProgressDto>, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.")
                .ToActionResult();
        }
        
        var response = await sessionService.GetGroupMemberStatesAsync(
            userId, 
            examTakerAssignmentId, 
            groupId, 
            cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Gets the overall state of a group for a specific user and assignment.
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns></returns>
    [HttpGet("{userId}/assignment/{assignmentId:guid}/group/state")]
    public async Task<IActionResult> GetGroupStateAsync(
        [FromRoute] string userId,
        [FromRoute] Guid assignmentId,
        CancellationToken cancellationToken)
    {
        if (assignmentId == Guid.Empty || 
            string.IsNullOrWhiteSpace(userId))
        {
            return Response<GroupStateDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed. Please ensure all IDs are provided and valid.")
                .ToActionResult();
        }
        
        var response = await sessionService.GetGroupStateAsync(
            userId, 
            assignmentId, 
            cancellationToken);

        if (response.IsSuccess)
        {
            response.Data.ToAbsoluteUrls($"{Request.Scheme}://{Request.Host}");
        }
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// This endpoint retrieves student-safe module version
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="moduleVersionId">Module Version ID</param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns <see cref="ExamTakerModuleVersionDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("{userId}/assignment/{assignmentId:guid}/module/version/{moduleVersionId:guid}")]
    public async Task<IActionResult> GetModuleVersionAsync(
        [FromRoute] string userId,
        [FromRoute] Guid assignmentId,
        [FromRoute] Guid moduleVersionId,
        CancellationToken cancellationToken)
    {
        if (moduleVersionId == Guid.Empty || 
            assignmentId == Guid.Empty || 
            string.IsNullOrWhiteSpace(userId))
        {
            return Response<IList<GroupMemberStateWithUserProgressDto>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                    "Validation failed. Please ensure all IDs are provided and valid.")
                .ToActionResult();
        }
        
        var response = await sessionService.GetModuleVersionAsync(
            userId, 
            assignmentId, 
            moduleVersionId, 
            cancellationToken);
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Gets module progress for a user in a specific assignment and module.
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="moduleId">Module Id</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="ModuleProgressDto"/> wrapped in <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("{userId}/assignment/{assignmentId:guid}/module/{moduleId:guid}/progress")]
    public async Task<IActionResult> GetModuleProgressAsync(
        string userId,
        Guid assignmentId,
        Guid moduleId,
        CancellationToken cancellationToken)
    {
        if (assignmentId == Guid.Empty || 
            moduleId == Guid.Empty ||
            string.IsNullOrWhiteSpace(userId))
        {
            return Response<ModuleProgressDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                    "Validation failed. Please ensure all IDs are provided and valid.")
                .ToActionResult();
        }
        
        var response = await sessionService.GetModuleProgressAsync(
            userId, 
            assignmentId,
            moduleId,
            cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Creates module progress for a user in a specific assignment and module.
    /// </summary>
    /// <param name="userId">User ID</param>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="moduleId">Module ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="ModuleProgressDto"/> wrapped in <see cref="Response{TData, TStatus}"/></returns>
    [HttpPost("{userId}/assignment/{assignmentId:guid}/module/{moduleId:guid}/progress")]
    public async Task<IActionResult> CreateModuleProgressAsync(
        string userId,
        Guid assignmentId,
        Guid moduleId,
        CancellationToken cancellationToken)
    {
        if (moduleId == Guid.Empty || 
            assignmentId == Guid.Empty || 
            string.IsNullOrWhiteSpace(userId))
        {
            return Response<ModuleProgressDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                    "Validation failed. Please ensure all IDs are provided and valid.")
                .ToActionResult();
        }
        
        var response = await sessionService.CreateModuleProgressAsync(
            userId, 
            assignmentId, 
            moduleId, 
            cancellationToken);
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Submits an answer for a specific question within a user's progress session.
    /// </summary>
    /// <param name="userProgressId">User progress ID</param>
    /// <param name="dto"><see cref="QuestionResponseOperationDto"/></param>
    /// <param name="validator">Request validator <see cref="QuestionResponseOperationDtoValidator"/></param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns the <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    [HttpPost("progress/{userProgressId:guid}/answer")]
    public async Task<IActionResult> SubmitAnswerAsync(
        [FromRoute] Guid userProgressId,
        [FromBody] QuestionResponseOperationDto dto,
        [FromServices] IValidator<QuestionResponseOperationDto> validator,
        CancellationToken cancellationToken)
    {
        if (userProgressId == Guid.Empty)
        {
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                    "Validation failed. Please ensure all IDs are provided and valid.")
                .ToActionResult();
        }
        
        var validationResult = await validator.ValidateAsync(dto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "Validation failed.",
                validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var response = await sessionService.SubmitAnswerAsync(
            userProgressId, 
            dto, 
            cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Completes the module for a user's progress session.
    /// </summary>
    /// <param name="userProgressId">User's progress</param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    [HttpPost("progress/{userProgressId:guid}/complete")]
    public async Task<IActionResult> CompleteModuleAsync(
        [FromRoute] Guid userProgressId,
        CancellationToken cancellationToken)
    {
        if (userProgressId == Guid.Empty)
        {
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                    "Validation failed. Please ensure all IDs are provided and valid.")
                .ToActionResult();
        }
        
        var response = await sessionService.CompleteModuleAsync(
            userProgressId, 
            cancellationToken);
        
        return response.ToActionResult();
    }
}