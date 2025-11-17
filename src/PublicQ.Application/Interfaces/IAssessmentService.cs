using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;
using PublicQ.Shared.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Represents the service for managing assessments.
/// </summary>
public interface IAssessmentService
{
    /// <summary>
    /// Creates a new assessment module along with its first version, questions, answers, and associated static files.
    /// </summary>
    /// <param name="dto">DTO containing module, version, questions, and answers data. <seealso cref="AssessmentModuleCreateDto"/></param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>ID and summary of the created module.</returns>
    Task<Response<AssessmentModuleDto, GenericOperationStatuses>> CreateModuleAsync(
        AssessmentModuleCreateDto dto,
        CancellationToken cancellationToken);

    /// <summary>
    /// Gets assessment module by ID.
    /// </summary>
    /// <param name="filter"><see cref="AssessmentModuleFilter"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="AssessmentModuleDto"/> wrapped in <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<AssessmentModuleDto, GenericOperationStatuses>> GetModuleAsync(
        AssessmentModuleFilter filter,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Returns a paginated list of all assessment modules.
    /// </summary>
    /// <param name="pageNumber">The 1-based page number to retrieve. Values less than 1 may be coerced to 1 by the implementation</param>
    /// <param name="pageSize">The number of items per page. Implementations may clamp this to a configured maximum</param>
    /// <param name="cancellationToken">
    /// A token that can be used to cancel the asynchronous operation.
    /// </param>
    /// <returns>Returns <see cref="PaginatedResponse{T}"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>> GetModulesAsync(
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Returns a paginated list of assessment modules filtered by title.
    /// </summary>
    /// <param name="title">
    /// A title fragment to search for. Implementations typically perform a contains match
    /// (e.g., <c>%title%</c>) and may treat <see langword="null" /> or whitespace as "no filter"
    /// to return all modules.
    /// </param>
    /// <param name="pageNumber">The 1-based page number to retrieve. Values less than 1 may be coerced to 1 by the implementation</param>
    /// <param name="pageSize">The number of items per page. Implementations may clamp this to a configured maximum</param>
    /// <param name="cancellationToken">
    /// A token that can be used to cancel the asynchronous operation.
    /// </param>
    /// <returns>Returns <see cref="PaginatedResponse{T}"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>> GetModulesByTitleAsync(
        string title,
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// This method retrieves a paginated list of assessment modules based on the provided title.
    /// </summary>
    /// <remarks>
    /// This will return flat module versions. They won't have attached questions or answers.
    /// </remarks>
    /// <param name="title">Module title to search</param>
    /// <param name="pageNumber">Page number</param>
    /// <param name="pageSize">Page Size</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="PaginatedResponse{T}"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>> GetPublishedLatestModuleVersionsByTitleAsync(
        string title,
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Gets all assessment modules.
    /// </summary>
    /// <remarks>
    /// This will return flat module versions. They won't have attached questions or answers.
    /// </remarks>
    /// <param name="pageNumber">Page number</param>
    /// <param name="pageSize">Page Size</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="PaginatedResponse{T}"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>> GetAllLatestPublishedModuleVersionsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets the latest published version of all assessment modules.
    /// </summary>
    /// <param name="moduleId">Module Id</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="AssessmentModuleVersionDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<AssessmentModuleVersionDto, GenericOperationStatuses>> GetLatestPublishedModuleVersionAsync(
        Guid moduleId,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Approves an assessment module for publishing.
    /// </summary>
    /// <param name="moduleVersionId">ID of the module to approve.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result of the approval operation.</returns>
    Task<Response<GenericOperationStatuses>> PublishModuleVersionAsync(
        Guid moduleVersionId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Deletes an assessment module by its ID.
    /// </summary>
    /// <param name="moduleId">ID of the module to delete.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Result of the delete operation.</returns>
    Task<Response<GenericOperationStatuses>> DeleteModuleAsync(
        Guid moduleId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Creates a new version of an existing assessment module.
    /// </summary>
    /// <param name="dto">DTO containing version, questions, and associated static files.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>ID and updated summary of the module.</returns>
    Task<Response<AssessmentModuleDto, GenericOperationStatuses>> CreateModuleVersionAsync(
        AssessmentModuleVersionCreateDto dto,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Retrieves an assessment module version by its ID.
    /// </summary>
    /// <param name="versionId">Version Id</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="AssessmentModuleVersionDto"/></returns>
    Task<Response<AssessmentModuleVersionDto, GenericOperationStatuses>> GetModuleVersionAsync(
        Guid versionId,
        CancellationToken cancellationToken);

    /// <summary>
    /// Updates an existing not published module version with new data.
    /// </summary>
    /// <param name="updateDto"><see cref="AssessmentModuleVersionUpdateDto"/></param>
    /// <param name="fullName">User who performs the update</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="AssessmentModuleVersionDto"/> with the <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<AssessmentModuleVersionDto, GenericOperationStatuses>> UpdateDraftModuleVersionAsync(
        AssessmentModuleVersionUpdateDto updateDto,
        string fullName,
        CancellationToken cancellationToken);

    /// <summary>
    /// Updates an existing published module version with new data.
    /// </summary>
    /// <remarks>
    /// The difference between this method and <see cref="UpdateDraftModuleVersionAsync"/> is that this method
    /// can only update the module version if it is already published and only allowed fields.
    /// </remarks>
    /// <param name="updatePublishedDto"><see cref="AssessmentModuleVersionUpdatePublishedDto"/></param>
    /// <param name="fullName">Updater full name</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    Task<Response<AssessmentModuleVersionDto, GenericOperationStatuses>> UpdatePublishedModuleVersionAsync(
        AssessmentModuleVersionUpdatePublishedDto updatePublishedDto,
        string fullName,
        CancellationToken cancellationToken);

    /// <summary>
    /// Saves a static file associated with a module.
    /// </summary>
    /// <param name="moduleId">Model ID</param>
    /// <param name="fileToUpload"><see cref="StorageItem"/></param>
    /// <param name="isModuleLevelFile">Indicates if the file is being uploaded at module level (true) or question/answer level (false)</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="StaticFileDto"/> wrapped in <see cref="Response{TData, TStatus}"/></returns>
    Task<Response<StaticFileDto, GenericOperationStatuses>> SaveAssociatedWithModuleStaticFileAsync(
        Guid moduleId, 
        FileUploadDto fileToUpload, 
        bool isModuleLevelFile,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Deletes all static files associated with a module.
    /// </summary>
    /// <param name="moduleId">Model ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped in <see cref="Response{TStatus}"/></returns>
    Task<Response<GenericOperationStatuses>> DeleteAssociatedWithModuleStaticFilesAsync(
        Guid moduleId, 
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Gets total number of assessment modules.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns total number of <see cref="AssessmentModuleDto"/> wrapped into <see cref="Response{TDatam, TStatus}"/></returns>
    Task<Response<long, GenericOperationStatuses>> GetTotalAssessmentModulesAsync(CancellationToken cancellationToken);
}