using PublicQ.Application.Models;
using PublicQ.Application.Models.Assignment;
using PublicQ.Application.Models.Exam;
using PublicQ.Application.Models.Group;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Interface for group-related operations in the application.
/// </summary>
public interface IGroupService
{
    /// <summary>
    /// Creates a new group with the specified details.
    /// </summary>
    /// <param name="groupDto">Creates a group that will have associated <see cref="AssessmentModuleDto"/>`s</param>
    /// <param name="createdByUser">Created by username</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GroupDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<GroupDto, GenericOperationStatuses>> CreateGroupAsync(
        GroupCreateDto groupDto,
        string createdByUser,
        CancellationToken cancellationToken);

    /// <summary>
    /// Updates an existing group with the specified details.
    /// </summary>
    /// <param name="groupDto">Updates a group</param>
    /// <param name="updatedByUser">Updated by username</param>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    Task<Response<GroupDto, GenericOperationStatuses>> UpdateGroupAsync(
        GroupUpdateDto groupDto,
        string updatedByUser,
        CancellationToken cancellationToken);

    /// <summary>
    /// Adds a member to an existing group.
    /// </summary>
    /// <param name="groupId">Parent group ID</param>
    /// <param name="groupMemberCreateDto">Group member to add</param>
    /// <param name="updatedByUser">Updated by username</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GroupDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<GroupDto, GenericOperationStatuses>> AddGroupMemberAsync(
        Guid groupId, 
        GroupMemberCreateDto groupMemberCreateDto,
        string updatedByUser,
        CancellationToken cancellationToken);

    /// <summary>
    /// Remove a group member.
    /// </summary>
    /// <param name="groupMemberId">Group member ID</param>
    /// <param name="deletedByUser">Created by username</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GroupDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<GroupDto, GenericOperationStatuses>> DeleteGroupMemberAsync(
        Guid groupMemberId,
        string deletedByUser,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Deletes a group by its ID.
    /// </summary>
    /// <param name="groupId">Group ID to delete</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> DeleteGroupAsync(
        Guid groupId, 
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Gets a group by its ID.
    /// </summary>
    /// <param name="groupId">Group ID to get</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GroupDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<GroupDto, GenericOperationStatuses>> GetGroupAsync(
        Guid groupId, 
        CancellationToken cancellationToken);

    /// <summary>
    /// Gets a paginated list of groups.
    /// </summary>
    /// <param name="pageSize">Page size</param>
    /// <param name="pageNumber">Page number</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a <see cref="PaginatedResponse{T}"/> of <see cref="GroupDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<PaginatedResponse<GroupDto>, GenericOperationStatuses>> GetGroupsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets assignments associated with a specific group.
    /// </summary>
    /// <param name="groupId">Group ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a list of <see cref="AssignmentDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<IList<AssignmentDto>, GenericOperationStatuses>> GetAssignmentsForGroupAsync(
        Guid groupId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Swaps the order of two group members within a group.
    /// </summary>
    /// <param name="swapRequest"><see cref="GroupMemberOrderSwapDto"/></param>
    /// <param name="updatedByUser">Updated by username</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns updated <see cref="GroupDto"/> wrapped in <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<GroupDto, GenericOperationStatuses>> SwapGroupMembersOrderAsync(
        GroupMemberOrderSwapDto swapRequest,
        string updatedByUser,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Gets the total number of groups.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns the total number of <see cref="GroupDto"/> wrapped in <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<long, GenericOperationStatuses>> GetTotalGroupsAsync(CancellationToken cancellationToken);
}