using PublicQ.Application.Models;
using PublicQ.Application.Models.Assignment;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Defines operations for managing assignments and their exam takers.
/// </summary>
public interface IAssignmentService
{
    /// <summary>
    /// Gets an assignment by its ID with full details.
    /// </summary>
    /// <param name="assignmentId">The ID of the assignment.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing the assignment details and operation status.</returns>
    Task<Response<AssignmentDto, GenericOperationStatuses>> GetByIdAsync(
        Guid assignmentId, 
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Creates a new assignment.
    /// </summary>
    /// <param name="createdByUserId">The ID of the user creating the assignment.</param>
    /// <param name="assignmentCreateDto">The assignment creation data transfer object.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing the created assignment and operation status.</returns>
    Task<Response<AssignmentDto, GenericOperationStatuses>> CreateAsync(
        string createdByUserId,
        AssignmentCreateDto assignmentCreateDto,
        CancellationToken cancellationToken);

    /// <summary>
    /// Updates an existing assignment.
    /// </summary>
    /// <param name="updateDto">The assignment update data transfer object.</param>
    /// <param name="updatedByUser">Updared by username</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing the updated assignment and operation status.</returns>
    Task<Response<AssignmentDto, GenericOperationStatuses>> UpdateAsync(
        AssignmentUpdateDto updateDto,
        string updatedByUser,
        CancellationToken cancellationToken);

    /// <summary>
    /// Adds exam takers to an assignment.
    /// </summary>
    /// <param name="assignmentId">The ID of the assignment.</param>
    /// <param name="examTakerIds">The set of exam taker IDs to add.</param>
    /// <param name="updatedByUser">Updated by username</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing the updated assignment and operation status.</returns>
    Task<Response<AssignmentDto, GenericOperationStatuses>> AddExamTakersAsync(
        Guid assignmentId,
        HashSet<string> examTakerIds,
        string updatedByUser,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Retrieves exam takers for a given assignment.
    /// </summary>
    /// <param name="assignmentId">The ID of the assignment.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing the list of exam takers and operation status.</returns>
    Task<Response<IList<User>, GenericOperationStatuses>> GetExamTakersAsync(
        Guid assignmentId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Removes exam takers from an assignment.
    /// </summary>
    /// <param name="assignmentId">The ID of the assignment.</param>
    /// <param name="examTakerIds">The set of exam taker IDs to remove.</param>
    /// <param name="updatedByUser">Updated by username</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing the updated assignment and operation status.</returns>
    Task<Response<AssignmentDto, GenericOperationStatuses>> RemoveExamTakersAsync(
        Guid assignmentId,
        HashSet<string> examTakerIds,
        string updatedByUser,
        CancellationToken cancellationToken);

    /// <summary>
    /// Publishes an assignment.
    /// </summary>
    /// <param name="assignmentId">The ID of the assignment.</param>
    /// <param name="updatedByUser">The ID of the user publishing the assignment.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing the operation status.</returns>
    Task<Response<GenericOperationStatuses>> PublishAsync(
        Guid assignmentId,
        string updatedByUser,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Deletes an assignment.
    /// </summary>
    /// <param name="assignmentId">The ID of the assignment.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing the operation status.</returns>
    Task<Response<GenericOperationStatuses>> DeleteAsync(
        Guid assignmentId, 
        CancellationToken cancellationToken);

    /// <summary>
    /// Gets a paginated list of assignments with optional filtering.
    /// </summary>
    /// <param name="pageNumber">The page number to retrieve. Defaults to 1.</param>
    /// <param name="pageSize">The number of items per page. Defaults to 10.</param>
    /// <param name="titleFilter">Optional filter by assignment title.</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing a paginated list of assignments and operation status.</returns>
    Task<Response<PaginatedResponse<AssignmentDto>, GenericOperationStatuses>> GetAssignmentsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? titleFilter = null,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets a list of available assignments for a specific exam taker.
    /// </summary>
    /// <param name="examTakerId">Exam taker ID</param>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing a list of assignments and operation status.</returns>
    Task<Response<IList<ExamTakerAssignmentDto>, GenericOperationStatuses>> GetAvailableAssignmentsAsync(
        string examTakerId,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets the total number of assignments.
    /// </summary>
    /// <param name="cancellationToken">Token to cancel the operation.</param>
    /// <returns>A response containing the total count of assignments and operation status.</returns>
    Task<Response<long, GenericOperationStatuses>> GetAssignmentCountAsync(
        CancellationToken cancellationToken = default);
}