using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Assignment;
using PublicQ.Application.Models.Group;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities.Group;
using PublicQ.Infrastructure.Persistence.Entities.Module;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// Group service implementation.
/// It provides methods for creating and updating groups.
/// </summary>
/// <remarks>
/// This service is responsible for managing groups in the application.
/// The group consists of a set of <see cref="AssessmentModuleEntity"/> entities.
/// </remarks>
public class GroupService(
    ApplicationDbContext dbContext, 
    IOptionsMonitor<GroupServiceOptions> options, 
    ILogger<GroupService> logger) : IGroupService
{
    /// <inheritdoc cref="IGroupService.CreateGroupAsync"/>
    public async Task<Response<GroupDto, GenericOperationStatuses>> CreateGroupAsync(
        GroupCreateDto groupDto, 
        string createdByUser,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Creating group request received.");
        Guard.AgainstNull(groupDto, nameof(groupDto));
        Guard.AgainstNullOrWhiteSpace(createdByUser, nameof(createdByUser));
        
        var validation = await CheckIfGroupExistAsync(groupDto.Title, cancellationToken);
        if (validation.IsFailed)
        {
            return Response<GroupDto, GenericOperationStatuses>.Failure(
                validation.Status, 
                validation.Message, 
                validation.Errors);
        }

        logger.LogDebug("Assembling group entity from DTO.");
        var groupEntityToCreate = new GroupEntity
        {
            Title = groupDto.Title,
            NormalizedTitle = groupDto.Title.ToUpperInvariant(),
            Description = groupDto.Description,
            UpdatedAtUtc = DateTime.UtcNow,
            CreatedByUser = createdByUser,
            CreatedAtUtc = DateTime.UtcNow,
            WaitModuleCompletion = groupDto.WaitModuleCompletion,
            IsMemberOrderLocked = groupDto.IsMemberOrderLocked
        };
        
        var orderNumbersToValidate = groupDto
            .GroupMembers
            .Select(m => m.OrderNumber)
            .ToList();

        if (groupDto
                .GroupMembers
                .Select(m => m.AssessmentModuleId)
                .Distinct()
                .ToList()
                .Count != groupDto.GroupMembers.Count)
        {
            logger.LogWarning("One or more group members have duplicate AssessmentModuleId. One group cannot have multiple members with the same AssessmentModuleId.");
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest, 
                "One or more group members have duplicate AssessmentModuleId. One group cannot have multiple members with the same AssessmentModuleId.");
        }

        // Processing the case when there is at least one group member
        if (orderNumbersToValidate.Count > 0)
        {
            if (!orderNumbersToValidate.AreConsecutiveStartingAtOne())
            {
                logger.LogWarning("Unable to create group. Order numbers must start at 1, be unique, and be continuous with no gaps.");
                return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest, 
                    "Order numbers must start at 1, be unique, and be continuous with no gaps.");
            }
            
            var assessmentModuleIdsToValidate = groupDto
                .GroupMembers
                .Select(m => m.AssessmentModuleId)
                .ToList();
            
            var verificationResponse = await ValidateAssessmentModulesAsync(
                assessmentModuleIdsToValidate, 
                cancellationToken);
            
            if (verificationResponse.IsFailed)
            {
                return Response<GroupDto, GenericOperationStatuses>.Failure(
                    verificationResponse.Status, 
                    verificationResponse.Message, 
                    verificationResponse.Errors);
            }
            
            logger.LogDebug("Assembling group members entities from DTO.");
            var groupMemberEntitiesToCreate = groupDto
                .GroupMembers
                .Select(m => new GroupMemberEntity
                {
                    Group = groupEntityToCreate,
                    OrderNumber = m.OrderNumber,
                    AssessmentModuleId = m.AssessmentModuleId
                })
                .ToHashSet();
        
            groupEntityToCreate.GroupMemberEntities = groupMemberEntitiesToCreate;
        
            logger.LogInformation("Creating group with title '{GroupTitle}' and {MemberCount} members.",
                groupEntityToCreate.Title, 
                groupMemberEntitiesToCreate.Count);
        }
        
        var response = await dbContext
            .Groups
            .AddAsync(groupEntityToCreate, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Group with ID '{GroupId}' created successfully.", response.Entity.Id);
        
        return Response<GroupDto, GenericOperationStatuses>.Success(
            response.Entity.ToGroupDto(),
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IGroupService.UpdateGroupAsync"/>
    public async Task<Response<GroupDto, GenericOperationStatuses>> UpdateGroupAsync(
        GroupUpdateDto groupDto,
        string updatedByUser,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Updating group request received.");
        Guard.AgainstNull(groupDto, nameof(groupDto));
        
        var currentGroup = await dbContext
            .Groups
            .FirstOrDefaultAsync(g => g.Id == groupDto.Id, cancellationToken);

        if (currentGroup is null)
        {
            logger.LogWarning("Unable to update Group. Group with ID '{GroupId}' not found.", groupDto.Id);
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Unable to update Group. Group with ID '{groupDto.Id}' not found.");
        }
        
        if (!string.Equals(currentGroup.Title, groupDto.Title, StringComparison.OrdinalIgnoreCase))
        {
            var validation = await CheckIfGroupExistAsync(groupDto.Title, cancellationToken);
            if (validation.IsFailed)
            {
                return Response<GroupDto, GenericOperationStatuses>.Failure(
                    validation.Status, 
                    validation.Message, 
                    validation.Errors);
            }
        }
        
        currentGroup.UpdatedByUserId = updatedByUser;
        currentGroup.UpdatedAtUtc = DateTime.UtcNow;
        
        currentGroup.Title = groupDto.Title;
        currentGroup.NormalizedTitle = groupDto.Title.ToUpperInvariant();
        currentGroup.Description = groupDto.Description;
        currentGroup.IsMemberOrderLocked = groupDto.IsMemberOrderLocked;
        currentGroup.WaitModuleCompletion = groupDto.WaitModuleCompletion;
        
        var result= dbContext
            .Groups
            .Update(currentGroup);
        await dbContext.SaveChangesAsync(cancellationToken);
        
        return Response<GroupDto, GenericOperationStatuses>.Success(
            result.Entity.ToGroupDto(),
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IGroupService.AddGroupMemberAsync"/>
    public async Task<Response<GroupDto, GenericOperationStatuses>> AddGroupMemberAsync(
        Guid groupId, 
        GroupMemberCreateDto groupMemberCreateDto,
        string updatedByUser,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Adding group member request received.");
        Guard.AgainstNull(groupMemberCreateDto, nameof(groupMemberCreateDto));
        
        // Get the new member's assessment module including its versions.
        logger.LogDebug("Retrieving assessment module with ID '{AssessmentModuleId}' to add to group with ID '{GroupId}'.",
            groupMemberCreateDto.AssessmentModuleId, 
            groupId);
        
        var moduleExists = await dbContext.AssessmentModules
            .AsNoTracking()
            .AnyAsync(m => m.Id == groupMemberCreateDto.AssessmentModuleId, cancellationToken);
        
        if (!moduleExists)
        {
            logger.LogWarning("Unable to add group member. Assessment module with ID '{AssessmentModuleId}' not found.",
                groupMemberCreateDto.AssessmentModuleId);
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound, 
                $"Unable to add group member. Assessment module with ID '{groupMemberCreateDto.AssessmentModuleId}' not found.");
        }
        
        var hasPublished = await dbContext.AssessmentModuleVersions
            .AsNoTracking()
            .AnyAsync(v => v.AssessmentModuleId == groupMemberCreateDto.AssessmentModuleId && v.IsPublished, cancellationToken);
        
        if (!hasPublished)
        {
            logger.LogWarning("Unable to add group member. Assessment module with ID '{AssessmentModuleId}' does not have a published version.",
                groupMemberCreateDto.AssessmentModuleId);
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict, 
                $"Unable to add group member. Assessment module with ID '{groupMemberCreateDto.AssessmentModuleId}' does not have a published version.");
        }
        
        logger.LogDebug("Retrieving group with ID '{GroupId}' to add member.", groupId);
        var group = await dbContext.Groups
            .Include(g => g.GroupMemberEntities)
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);
        
        if (group is null)
        {
            logger.LogWarning("Unable to add group member. Group with ID '{GroupId}' not found.", groupId);
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Unable to add group member. Group with ID '{groupId}' not found.");
        }
        
        if (group.GroupMemberEntities.Any(m => m.AssessmentModuleId == groupMemberCreateDto.AssessmentModuleId))
        {
            logger.LogWarning("Unable to add group member. Group already has a member with AssessmentModuleId '{AssessmentModuleId}'.",
                groupMemberCreateDto.AssessmentModuleId);
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict, 
                $"Unable to add group member. Group already has a member with AssessmentModuleId '{groupMemberCreateDto.AssessmentModuleId}'.");
        }
        
        var membersOrder = group
            .GroupMemberEntities
            .Select(m => m.OrderNumber)
            .ToList();
        membersOrder.Add(groupMemberCreateDto.OrderNumber);
        
        if (!membersOrder.AreConsecutiveStartingAtOne())
        {
            logger.LogWarning("Unable to add group member. Order numbers must start at 1, be unique, and be continuous with no gaps.");
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest, 
                "Order numbers must start at 1, be unique, and be continuous with no gaps.");
        }
        
        logger.LogDebug("Assembling group member entity from DTO.");
        group.GroupMemberEntities.Add(new GroupMemberEntity
        {
            GroupId = group.Id,
            AssessmentModuleId = groupMemberCreateDto.AssessmentModuleId,
            OrderNumber = groupMemberCreateDto.OrderNumber
        });
        
        group.UpdatedByUserId = updatedByUser;
        group.UpdatedAtUtc = DateTime.UtcNow;
        
        logger.LogInformation("Adding group member with AssessmentModuleId '{AssessmentModuleId}' to group with ID '{GroupId}'.",
            groupMemberCreateDto.AssessmentModuleId, 
            groupId);
        
        await dbContext.SaveChangesAsync(cancellationToken);
        
        var responseDto = await dbContext.Groups
            .AsNoTracking()
            .Where(g => g.Id == groupId)
            .Include(g => g.GroupMemberEntities)
            .ThenInclude(gm => gm.AssessmentModule)
            .ThenInclude(m => m.Versions
                .OrderByDescending(v => v.Version)
                .Take(1)) // only if your DTO needs the latest version data
            .Select(g => g.ToGroupDto())
            .FirstAsync(cancellationToken);
        
        logger.LogInformation("Group '{GroupId}' updated with a new member.", groupId);
        
        return Response<GroupDto, GenericOperationStatuses>.Success(
            responseDto,
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IGroupService.DeleteGroupMemberAsync"/>
    public async Task<Response<GroupDto, GenericOperationStatuses>> DeleteGroupMemberAsync(
        Guid groupMemberId,
        string deletedByUser,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Deleting group member request received.");
        Guard.AgainstNullOrWhiteSpace(deletedByUser, nameof(deletedByUser));
        
        var groupMember = await dbContext
            .GroupMembers
            .AsSplitQuery()
            .Include(gm => gm.Group)
                .ThenInclude(g => g.GroupMemberEntities)
                    .ThenInclude(gm => gm.AssessmentModule)
                        .ThenInclude(m => m.Versions)
            .FirstOrDefaultAsync(gm => gm.Id == groupMemberId, cancellationToken);

        if (groupMember is null)
        {
            logger.LogWarning("Unable to delete group member. Group member with ID '{GroupMemberId}' not found.", groupMemberId);
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Unable to delete group member. Group member with ID '{groupMemberId}' not found.");
        }
        
        var assignmentsUsingGroup = await dbContext
            .Assignments
            .Where(a => a.GroupId == groupMember.GroupId)
            .ToListAsync(cancellationToken);

        if (assignmentsUsingGroup.Count > 0)
        {
            var assignmentTitles = string.Join(", ", assignmentsUsingGroup.Select(a => $"'{a.Title}'"));
            logger.LogInformation("Unable to delete group member because this group is associated with {AssignmentTitles} assignments.",
                assignmentTitles);
            
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"Unable to delete group member because this group is associated with {assignmentTitles} assignments.");
        }
        
        logger.LogInformation("Deleting group member with ID '{GroupMemberId}' from group with ID '{GroupId}'.",
            groupMemberId, 
            groupMember.Group.Id);
        
        groupMember.Group.UpdatedAtUtc = DateTime.UtcNow;
        groupMember.Group.UpdatedByUserId = deletedByUser;
        
        dbContext.GroupMembers.Remove(groupMember);

        var group = groupMember.Group;
        
        // Reorder remaining group members after deletion.
        // If the deleted member's order number is not the last one,
        // we need to decrement the order numbers of all members that had a higher order number.
        foreach (var member in group.GroupMemberEntities
                     .Where(m => m.OrderNumber > groupMember.OrderNumber)
                     .OrderBy(m => m.OrderNumber))
        {
            logger.LogDebug("Decrementing order number for group member with ID '{GroupMemberId}' from {OldOrderNumber} to {NewOrderNumber}.",
                member.Id, 
                member.OrderNumber, 
                member.OrderNumber - 1);
            member.OrderNumber--;
        }
        
        await dbContext.SaveChangesAsync(cancellationToken);
        
        logger.LogInformation("Group member with ID '{GroupMemberId}' deleted successfully from group with ID '{GroupId}'.",
            groupMemberId, 
            groupMember.Group.Id);
        
        return Response<GroupDto, GenericOperationStatuses>.Success(
            groupMember.Group.ToGroupDto(),
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IGroupService.DeleteGroupAsync"/>
    public async Task<Response<GenericOperationStatuses>> DeleteGroupAsync(
        Guid groupId, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Deleting group request received.");
        
        var group = await dbContext
            .Groups
            .FirstOrDefaultAsync(g => g.Id == groupId, cancellationToken);

        if (group is null)
        {
            logger.LogWarning("Unable to delete group. Group with ID '{GroupId}' not found.", groupId);
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Unable to delete group. Group with ID '{groupId}' not found.");
        }
        
        logger.LogInformation("Deleting group with ID '{GroupId}'.", groupId);
        dbContext
            .Groups
            .Remove(group);
        await dbContext.SaveChangesAsync(cancellationToken);
        
        logger.LogInformation("Group with ID '{GroupId}' deleted successfully.", groupId);
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            $"Group with ID '{groupId}' deleted successfully.");
    }

    /// <inheritdoc cref="IGroupService.GetGroupAsync"/>
    public async Task<Response<GroupDto, GenericOperationStatuses>> GetGroupAsync(
        Guid groupId, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Getting group with ID '{GroupId}' request received.", groupId);
        
        // Main group with basic structure
        var group = await dbContext
            .Groups
            .AsNoTracking()
            .Include(g => g.GroupMemberEntities)
                .ThenInclude(gm => gm.AssessmentModule)
                    .ThenInclude(m => m.Versions)
                        .ThenInclude(v => v.AssociatedStaticFiles)
            .Where(g => g.Id == groupId)
            .AsSplitQuery()
            .FirstOrDefaultAsync(cancellationToken);

        if (group is null)
        {
            logger.LogWarning("Requested group with ID '{GroupId}' not found.", groupId);
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Requested group with ID '{groupId}' not found.");
        }

        logger.LogDebug("Group with ID '{GroupId}' retrieved successfully.", groupId);
        
        return Response<GroupDto, GenericOperationStatuses>.Success(group.ToGroupDto(), GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IGroupService.GetGroupsAsync"/>
    public async Task<Response<PaginatedResponse<GroupDto>, GenericOperationStatuses>> GetGroupsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Getting groups request received. Page {Page}, Size {Size}", pageNumber, pageSize);

        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Max(1, Math.Min(pageSize, options.CurrentValue.MaxPageSize));

        // Base query (countable)
        var baseQuery = dbContext.Groups.AsNoTracking();

        // Total before paging
        var totalCount = await baseQuery.LongCountAsync(cancellationToken);

        var paginatedResponse = new PaginatedResponse<GroupDto>
        {
            PageNumber = pageNumber,
            PageSize   = pageSize,
            TotalCount = totalCount,
            Data       = []
        };
        
        if (totalCount == 0)
        {
            // Prefer success with empty data, not a failure.
            return Response<PaginatedResponse<GroupDto>, GenericOperationStatuses>.Success(
                paginatedResponse,
                GenericOperationStatuses.Completed,
                "No groups found.");
        }

        // Page query – consider SplitQuery to avoid cartesian explosion with deep includes
        var entities = await baseQuery
            .OrderByDescending(g => g.UpdatedAtUtc > g.CreatedAtUtc ? g.UpdatedAtUtc : g.CreatedAtUtc)
            .ThenByDescending(g => g.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .AsSplitQuery()
            .Include(g => g.GroupMemberEntities)
                .ThenInclude(gm => gm.AssessmentModule)
                    .ThenInclude(m => m.Versions
                        .OrderByDescending(v => v.Version)
                        .Take(1))
            .ToListAsync(cancellationToken);

        var dtos = entities
            .Select(g => g.ToGroupDto())
            .ToList();
        paginatedResponse.Data.AddRange(dtos);

        logger.LogDebug("Returning {Count} group(s) out of {Total}.", dtos.Count, totalCount);

        return Response<PaginatedResponse<GroupDto>, GenericOperationStatuses>.Success(
            paginatedResponse,
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IGroupService.GetAssignmentsForGroupAsync"/>
    public async Task<Response<IList<AssignmentDto>, GenericOperationStatuses>> GetAssignmentsForGroupAsync(
        Guid groupId, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Getting assignments for group with ID {GroupId} request received.", groupId);
        
        // Get assignments that use the specified group
        var assignments = await dbContext
            .Assignments
            .AsNoTracking()
            .Where(a => a.GroupId == groupId)
            .ToListAsync(cancellationToken);
        
        logger.LogDebug("Assignments for group with ID {GroupId} retrieved successfully. Found {Count} assignments.", 
            groupId,
            assignments.Count);
        
        return Response<IList<AssignmentDto>, GenericOperationStatuses>.Success(
            assignments.Select(a => a.ConvertToDto()).ToList(),
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IGroupService.SwapGroupMembersOrderAsync"/>
    public async Task<Response<GroupDto, GenericOperationStatuses>> SwapGroupMembersOrderAsync(
        GroupMemberOrderSwapDto swapRequest,
        string updatedByUser,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Updating group member order request received.");
        Guard.AgainstNull(swapRequest, nameof(swapRequest));
        
        if (swapRequest.FirstMemberId == swapRequest.SecondMemberId)
        {
            logger.LogWarning("Unable to swap group members order. The two member IDs are the same.");
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                "Unable to swap group members order. The two member IDs are the same.");
        }
        
        var ids = new[] { swapRequest.FirstMemberId, swapRequest.SecondMemberId };
        var members = await dbContext.GroupMembers
            .Where(m => m.GroupId == swapRequest.GroupId && ids.Contains(m.Id))
            .ToDictionaryAsync(m => m.Id, cancellationToken);

        if (members.Count != 2)
        {
            logger.LogWarning("Requested group with ID '{GroupId}' not found.", swapRequest.GroupId);
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"One or more group members not found in group with ID '{swapRequest.GroupId}'.");
        }
        
        var first  = members[swapRequest.FirstMemberId];
        var second = members[swapRequest.SecondMemberId];
        
        if (first.GroupId != swapRequest.GroupId || second.GroupId != swapRequest.GroupId)
        {
            logger.LogWarning("One or more group members do not belong to group with ID '{GroupId}'.", swapRequest.GroupId);
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"One or more group members do not belong to group with ID '{swapRequest.GroupId}'.");
        }
        
        // We cannot swap directly as it would violate the unique constraint
        // We have to use a temporary value
        var tempOrder = int.MaxValue;
        var firstOriginalOrder = first.OrderNumber;
        var secondOriginalOrder = second.OrderNumber;
        
        await dbContext.GroupMembers
            .Where(m => m.Id == swapRequest.FirstMemberId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(m => m.OrderNumber, tempOrder), cancellationToken);
        
        // Step 2: Set second member to first member's original order
        await dbContext.GroupMembers
            .Where(m => m.Id == swapRequest.SecondMemberId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(m => m.OrderNumber, firstOriginalOrder), cancellationToken);
        
        // Step 3: Set first member to second member's original order
        await dbContext.GroupMembers
            .Where(m => m.Id == swapRequest.FirstMemberId)
            .ExecuteUpdateAsync(setters => setters.SetProperty(m => m.OrderNumber, secondOriginalOrder), cancellationToken);

        logger.LogInformation("Group members with IDs '{FirstMemberId}' and '{SecondMemberId}' order swapped successfully in group with ID '{GroupId}'.",
            swapRequest.FirstMemberId, 
            swapRequest.SecondMemberId, 
            swapRequest.GroupId);
        
        // Use AsNoTracking to ensure fresh data from database, bypassing any cached entities
        var groupToUpdate = await dbContext.Groups
            .AsNoTracking()
            .Where(g => g.Id == swapRequest.GroupId)
            .Include(g => g.GroupMemberEntities)
                .ThenInclude(gm => gm.AssessmentModule)
                    .ThenInclude(m => m.Versions
                        .OrderByDescending(v => v.Version)
            .Take(1)) // only if your DTO needs the latest version data
            .FirstAsync(cancellationToken);

        // Update the group metadata without tracking since we only need it for the DTO
        await dbContext.Groups
            .Where(g => g.Id == swapRequest.GroupId)
            .ExecuteUpdateAsync(setters => setters
                .SetProperty(g => g.UpdatedByUserId, updatedByUser)
                .SetProperty(g => g.UpdatedAtUtc, DateTime.UtcNow), cancellationToken);
        
        return Response<GroupDto, GenericOperationStatuses>.Success(
            groupToUpdate.ToGroupDto(),
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IGroupService.GetTotalGroupsAsync"/>
    public async Task<Response<long, GenericOperationStatuses>> GetTotalGroupsAsync(CancellationToken cancellationToken)
    {
        logger.LogDebug("Getting total groups request received.");
        var totalGroups = await dbContext
            .Groups
            .LongCountAsync(cancellationToken);
        
        logger.LogDebug("Total groups count retrieved: {TotalGroups}.", totalGroups);
        return Response<long, GenericOperationStatuses>.Success(totalGroups, GenericOperationStatuses.Completed);
    }

    /// <summary>
    /// Validates that the specified assessment modules exist and that each has at least one published version.
    /// </summary>
    /// <param name="assessmentModuleIds">The identifiers of the assessment modules to validate.</param>
    /// <param name="cancellationToken">A token to observe while waiting for the task to complete.</param>
    /// <returns>
    /// A <see cref="Response{TStatus}"/> indicating success when all modules exist and each has a published version; 
    /// otherwise, a failure response with <see cref="GenericOperationStatuses.NotFound"/> if any module IDs are missing,
    /// or <see cref="GenericOperationStatuses.Conflict"/> if any existing module lacks a published version.
    /// </returns>
    private async Task<Response<GenericOperationStatuses>> ValidateAssessmentModulesAsync(
        List<Guid> assessmentModuleIds, 
        CancellationToken cancellationToken)
    {
        if (assessmentModuleIds.Count == 0)
        {
            return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed);
        }

        var existingCount = await dbContext.AssessmentModules
            .AsNoTracking()
            .LongCountAsync(m => assessmentModuleIds.Contains(m.Id), cancellationToken);

        if (existingCount != assessmentModuleIds.Count)
        {
            logger.LogWarning("One or more assessment modules not found. Expected {ExpectedCount}, found {FoundCount}.",
                assessmentModuleIds.Count, 
                existingCount);
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed,
                $"One or more assessment modules not found. Expected {assessmentModuleIds.Count}, found {existingCount}.");
        }
        
        var withoutPublished = await dbContext.AssessmentModules
            .AsNoTracking()
            .Where(m => assessmentModuleIds.Contains(m.Id))
            .Where(m => !m.Versions.Any(v => v.IsPublished))
            .Select(m => m.Id)
            .ToListAsync(cancellationToken);
        
        if (withoutPublished.Count > 0)
        {
            logger.LogWarning("Unable to add group member. All assessment modules must have at least one published version.");
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"Unable to add group member. All assessment modules must have at least one published version.");
        }

        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed);
    }
    
    /// <summary>
    /// Checks if a group with the same title already exists.
    /// </summary>
    /// <param name="title">Group title</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    private async Task<Response<GenericOperationStatuses>> CheckIfGroupExistAsync(string title, CancellationToken cancellationToken)
    {
        var groupExists = await dbContext.Groups
            .AsNoTracking()
            .AnyAsync(g => g.NormalizedTitle == title.ToUpperInvariant(), cancellationToken);

        if (groupExists)
        {
            logger.LogWarning("Unable to create group. A group with the title '{GroupTitle}' already exists.",
                title);
            return Response<GroupDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"Unable to create group. A group with the title '{title}' already exists.");
        }

        return Response<GroupDto, GenericOperationStatuses>.Success(
            GenericOperationStatuses.Completed);
    }
}