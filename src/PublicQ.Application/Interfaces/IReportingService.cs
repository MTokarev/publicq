using PublicQ.Application.Models;
using PublicQ.Application.Models.Assignment;
using PublicQ.Application.Models.Reporting;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// This interface defines the contract for reporting services within the application.
/// </summary>
public interface IReportingService
{
    /// <summary>
    /// Gets paginated assignment summary reports.
    /// </summary>
    /// <param name="pageNumber">The page number to retrieve (1-based indexing).</param>
    /// <param name="pageSize">The number of items per page.</param>
    /// <param name="cancellationToken">Token to monitor for cancellation requests.</param>
    /// <returns>A response containing paginated assignment summary report data.</returns>
    [Cacheable]
    Task<Response<PaginatedResponse<AssignmentSummaryReportDto>, GenericOperationStatuses>> GetAllAssignmentSummaryReportAsync(
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);
    
    /// <summary>
    /// Retrieves a comprehensive report for a specific assignment, including detailed exam taker progress and performance data.
    /// </summary>
    /// <param name="assignmentId">The unique identifier of the assignment to generate the report for.</param>
    /// <param name="cancellation">Token to monitor for cancellation requests.</param>
    /// <returns>A response containing the full assignment report data including exam taker details, progress, and performance metrics.</returns>
    [Cacheable]
    Task<Response<AssignmentReportDto, GenericOperationStatuses>> GetAssignmentFullReportAsync(
        Guid assignmentId,
        CancellationToken cancellation);
    
    /// <summary>
    /// Retrieves a summary report for a specific assignment with high-level statistics and overview data.
    /// </summary>
    /// <param name="assignmentId">The unique identifier of the assignment to generate the summary report for.</param>
    /// <param name="cancellation">Token to monitor for cancellation requests.</param>
    /// <returns>A response containing the assignment summary report with aggregate statistics.</returns>
    [Cacheable]
    Task<Response<AssignmentSummaryReportDto, GenericOperationStatuses>> GetAssignmentSummaryReportAsync(
        Guid assignmentId,
        CancellationToken cancellation);
    
    /// <summary>
    /// Retrieves detailed reports for multiple exam takers, optionally filtered by a specific assignment.
    /// </summary>
    /// <param name="examTakerIds">The collection of exam taker identifiers to generate reports for.</param>
    /// <param name="assignmentId">Optional assignment identifier to filter reports by. If null, returns reports across all assignments.</param>
    /// <param name="cancellationToken">Token to monitor for cancellation requests.</param>
    /// <returns>A response containing a list of exam taker reports with their performance and progress data.</returns>
    [Cacheable]
    Task<Response<IList<ExamTakerReportDto>, GenericOperationStatuses>> GetExamTakerReportsAsync(
        IList<string> examTakerIds,
        Guid? assignmentId = null,
        CancellationToken cancellationToken = default);
    
    /// <summary>
    /// Retrieves a detailed report for a single exam taker, optionally filtered by a specific assignment.
    /// </summary>
    /// <param name="examTakerId">The unique identifier of the exam taker to generate the report for.</param>
    /// <param name="assignmentId">Optional assignment identifier to filter the report by. If null, returns data across all assignments.</param>
    /// <param name="cancellationToken">Token to monitor for cancellation requests.</param>
    /// <returns>A response containing the exam taker report with performance metrics, progress data, and assignment details.</returns>
    [Cacheable]
    Task<Response<ExamTakerReportDto, GenericOperationStatuses>> GetExamTakerReportAsync(
        string examTakerId,
        Guid? assignmentId = null,
        CancellationToken cancellationToken = default);

    /// <summary>
    /// Gets paginated exam taker assignments.
    /// </summary>
    /// <param name="idFilter">Filter on exam taker ID</param>
    /// <param name="nameFilter">Filter on exam taker display name</param>
    /// <param name="pageNumber">The page number to retrieve (1-based indexing).</param>
    /// <param name="pageSize">The number of items per page.</param>
    /// <param name="cancellationToken">Token to monitor for cancellation requests.</param>
    /// <returns>A response containing paginated assignment summary report data.</returns>
    [Cacheable]
    Task<Response<PaginatedResponse<IndividualUserReportDto>, GenericOperationStatuses>> GetAllExamTakersAsync(
        string? idFilter,
        string? nameFilter,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken);
}