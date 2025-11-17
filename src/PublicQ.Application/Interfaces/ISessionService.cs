using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;
using PublicQ.Application.Models.Session;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// This interface defines methods for managing users` exam sessions.
/// </summary>
public interface ISessionService
{
    /// <summary>
    /// Retrieves the states of all group members for a specific assignment and group, including their progress information.
    /// </summary>
    /// <param name="userId">The ID of the requesting user</param>
    /// <param name="examTakerAssignmentId">The ID of the exam taker assignment</param>
    /// <param name="groupId">The ID of the group to get member states for</param>
    /// <param name="cancellationToken">Token to cancel the operation</param>
    /// <returns>A response containing the list of group member states with user progress</returns>
    Task<Response<IList<GroupMemberStateWithUserProgressDto>, GenericOperationStatuses>> GetGroupMemberStatesAsync(
        string userId,
        Guid examTakerAssignmentId,
        Guid groupId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Retrieves the current module progress for a user on a specific assignment.
    /// </summary>
    /// <param name="userId">The ID of the user whose progress to retrieve</param>
    /// <param name="assignmentId">The ID of the assignment</param>
    /// <param name="moduleId">Module ID</param>
    /// <param name="cancellationToken">Token to cancel the operation</param>
    /// <returns>A response containing the user's module progress information</returns>
    Task<Response<ModuleProgressDto, GenericOperationStatuses>> GetModuleProgressAsync(
        string userId,
        Guid assignmentId,
        Guid moduleId,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Creates a new module progress record for a user starting a specific assessment module.
    /// </summary>
    /// <param name="userId">The ID of the user starting the module</param>
    /// <param name="assignmentId">The ID of the assignment</param>
    /// <param name="assessmentModuleId">The ID of the assessment module to start</param>
    /// <param name="cancellationToken">Token to cancel the operation</param>
    /// <returns>A response containing the created module progress information</returns>
    Task<Response<ModuleProgressDto, GenericOperationStatuses>> CreateModuleProgressAsync(
        string userId,
        Guid assignmentId,
        Guid assessmentModuleId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Retrieves a specific version of an assessment module for a user.
    /// </summary>
    /// <param name="userId">The ID of the user requesting the module version</param>
    /// <param name="assignmentId">The ID of the assignment</param>
    /// <param name="versionId">The ID of the module version to retrieve</param>
    /// <param name="cancellationToken">Token to cancel the operation</param>
    /// <returns>A response containing the exam taker's module version data</returns>
    Task<Response<ExamTakerModuleVersionDto, GenericOperationStatuses>> GetModuleVersionAsync(
        string userId,
        Guid assignmentId,
        Guid versionId,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Retrieves the current state of a group for a specific assignment, including overall progress and status.
    /// </summary>
    /// <param name="userId">The ID of the requesting user</param>
    /// <param name="assignmentId">The ID of the assignment</param>
    /// <param name="cancellationToken">Token to cancel the operation</param>
    /// <returns>A response containing the group's current state information</returns>
    Task<Response<GroupStateDto, GenericOperationStatuses>> GetGroupStateAsync(
        string userId,
        Guid assignmentId, 
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Submits a user's answer response for a specific question in their module progress.
    /// </summary>
    /// <param name="userProgressId">The ID of the user's progress record</param>
    /// <param name="dto">The question response operation data containing the answer details</param>
    /// <param name="cancellationToken">Token to cancel the operation</param>
    /// <returns>A response indicating the success or failure of the answer submission</returns>
    Task<Response<GenericOperationStatuses>> SubmitAnswerAsync(
        Guid userProgressId,
        QuestionResponseOperationDto dto,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Completes a module for a user, finalizing their progress and preventing further modifications.
    /// </summary>
    /// <param name="userProgressId">The ID of the user's progress record to complete</param>
    /// <param name="cancellationToken">Token to cancel the operation</param>
    /// <returns>A response indicating the success or failure of the module completion</returns>
    Task<Response<GenericOperationStatuses>> CompleteModuleAsync(
        Guid userProgressId,
        CancellationToken cancellationToken);
}