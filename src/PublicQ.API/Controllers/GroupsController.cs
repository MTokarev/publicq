using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.API.Models.Requests;
using PublicQ.API.Models.Validators;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Assignment;
using PublicQ.Application.Models.Group;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// API controller for managing groups and group members.
/// Provides endpoints to create, update, and delete groups, as well as add and remove group members.
/// </summary>
[ApiController]
[Authorize]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class GroupsController(IGroupService groupService) : ControllerBase
{
    /// <summary>
    /// Gets a group by its unique identifier.
    /// </summary>
    /// <param name="groupId">Group ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpGet("{groupId:guid}")]
    public async Task<IActionResult> GetGroupAsync(
        Guid groupId,
        CancellationToken cancellationToken)
    {
        if (groupId == Guid.Empty)
        {
            return Response<GroupDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    new List<string> { "Group ID cannot be empty." })
                .ToActionResult();
        }

        var response = await groupService.GetGroupAsync(groupId, cancellationToken);
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Get assignments associated with a specific group.
    /// </summary>
    /// <param name="groupId">Group ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a list of <see cref="AssignmentDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpGet("{groupId:guid}/assignments")]
    public async Task<IActionResult> GetGroupAssignmentsAsync(
        Guid groupId,
        CancellationToken cancellationToken)
    {
        if (groupId == Guid.Empty)
        {
            return Response<List<AssignmentDto>, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    new List<string> { "Group ID cannot be empty." })
                .ToActionResult();
        }

        var response = await groupService.GetAssignmentsForGroupAsync(groupId, cancellationToken);
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Get a paginated list of groups.
    /// </summary>
    /// <param name="request"><see cref="GetPaginatedEntitiesRequest"/></param>
    /// <param name="validator">Validator <seealso cref="GetPaginatedEntitiesRequestValidator"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpGet]
    public async Task<IActionResult> GetGroupsAsync(
        [FromQuery] GetPaginatedEntitiesRequest request,
        [FromServices] IValidator<GetPaginatedEntitiesRequest> validator,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await validator.ValidateAsync(request, cancellationToken);

        if (!validationResult.IsValid)
        {
            return Response<GetPaginatedEntitiesRequest, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var response = await groupService.GetGroupsAsync(request.PageNumber, request.PageSize, cancellationToken);
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Creates a new group with its members.
    /// </summary>
    /// <param name="groupCreateDto">The DTO containing details for creating a group.</param>
    /// <param name="validator">Validator for <see cref="GroupCreateDto"/>.</param>
    /// <param name="cancellationToken">Token to cancel the request.</param>
    /// <returns>
    /// Returns <see cref="IActionResult"/> with the created group or validation errors.
    /// </returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPost]
    public async Task<IActionResult> CreateGroupAsync(
        [FromBody] GroupCreateDto groupCreateDto,
        [FromServices] IValidator<GroupCreateDto> validator,
        CancellationToken cancellationToken)
    {
        var validationResult = await validator.ValidateAsync(groupCreateDto, cancellationToken);

        if (!validationResult.IsValid)
        {
            return Response<GroupCreateDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var groupCreateResponse = await groupService.CreateGroupAsync(groupCreateDto, fullName, cancellationToken);
        
        return groupCreateResponse.ToActionResult();
    }
    
    /// <summary>
    /// Deletes a group member by its unique identifier.
    /// </summary>
    /// <param name="memberId">The unique identifier of the group member to delete.</param>
    /// <param name="cancellationToken">Token to cancel the request.</param>
    /// <returns>
    /// Returns <see cref="IActionResult"/> indicating success or failure.
    /// </returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpDelete("member/{memberId:guid}")]
    public async Task<IActionResult> DeleteGroupMemberAsync(
        Guid memberId,
        CancellationToken cancellationToken)
    {
        if (memberId == Guid.Empty)
        {
            return BadRequest("Member ID cannot be empty.");
        }

        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await groupService.DeleteGroupMemberAsync(memberId, fullName, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Adds a new member to an existing group.
    /// </summary>
    /// <param name="groupId">The unique identifier of the group.</param>
    /// <param name="groupMemberCreateDto">The DTO containing details of the group member to add.</param>
    /// <param name="validator">Validator for <see cref="GroupMemberCreateDto"/>.</param>
    /// <param name="cancellationToken">Token to cancel the request.</param>
    /// <returns>
    /// Returns <see cref="IActionResult"/> with the added member or validation errors.
    /// </returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPost("{groupId:guid}/member")]
    public async Task<IActionResult> AddGroupMemberAsync(
        Guid groupId,
        [FromBody] GroupMemberCreateDto groupMemberCreateDto,
        [FromServices] IValidator<GroupMemberCreateDto> validator,
        CancellationToken cancellationToken)
    {
        if (groupId == Guid.Empty)
        {
            return BadRequest("Group ID cannot be empty.");
        }

        var validationResult = await validator.ValidateAsync(groupMemberCreateDto, cancellationToken);

        if (!validationResult.IsValid)
        {
            return Response<GroupMemberCreateDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "Validation failed.",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }
        
        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await groupService.AddGroupMemberAsync(
            groupId, 
            groupMemberCreateDto,
            fullName,
            cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Updates the details of an existing group.
    /// </summary>
    /// <param name="groupUpdateDto">The DTO containing updated group details.</param>
    /// <param name="cancellationToken">Token to cancel the request.</param>
    /// <returns>
    /// Returns <see cref="IActionResult"/> with the updated group or validation errors.
    /// </returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPatch]
    public async Task<IActionResult> UpdateGroupAsync(
        [FromBody] GroupUpdateDto groupUpdateDto,
        CancellationToken cancellationToken)
    {
        if (groupUpdateDto.Id == Guid.Empty)
        {
            return Response<GroupUpdateDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Group ID cannot be empty.")
                .ToActionResult();
        }
        
        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await groupService.UpdateGroupAsync(groupUpdateDto, fullName, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Deletes a group by its unique identifier.
    /// </summary>
    /// <param name="groupId">The unique identifier of the group to delete.</param>
    /// <param name="cancellationToken">Token to cancel the request.</param>
    /// <returns>
    /// Returns <see cref="IActionResult"/> indicating success or failure.
    /// </returns>
    [Authorize(Constants.ContributorsPolicy)]
    [HttpDelete("{groupId:guid}")]
    public async Task<IActionResult> DeleteGroupAsync(
        Guid groupId,
        CancellationToken cancellationToken)
    {
        if (groupId == Guid.Empty)
        {
            return BadRequest("Group ID cannot be empty.");
        }

        var response = await groupService.DeleteGroupAsync(groupId, cancellationToken);
        return response.ToActionResult();
    }

    /// <summary>
    /// Swaps the order of two group members within a group.
    /// </summary>
    /// <param name="swapRequest"><see cref="GroupMemberOrderSwapDto"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// Returns <see cref="IActionResult"/> indicating success or failure.
    [Authorize(Constants.ContributorsPolicy)]
    [HttpPatch("members/swap-order")]
    public async Task<IActionResult> SwapGroupMembersOrderAsync(
        [FromBody] GroupMemberOrderSwapDto swapRequest,
        CancellationToken cancellationToken)
    {
        if (swapRequest.FirstMemberId == Guid.Empty || swapRequest.SecondMemberId == Guid.Empty)
        {
            return BadRequest("Member IDs cannot be empty.");
        }
        
        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);
        var response = await groupService.SwapGroupMembersOrderAsync(swapRequest, fullName, cancellationToken);
        
        return response.ToActionResult();
    }
    
    /// <summary>
    /// Retrieves the total number of groups.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>The total number of <see cref="GroupDto"/></returns>
    [HttpGet("total")]
    public async Task<IActionResult> GetTotalGroupsAsync(CancellationToken cancellationToken)
    {
        var response = await groupService.GetTotalGroupsAsync(cancellationToken);
        return response.ToActionResult();
    }
}