using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Reporting;
using Constants = PublicQ.Shared.Constants;

namespace PublicQ.API.Controllers;

/// <summary>
/// Controller for handling reporting-related endpoints.
/// </summary>
[ApiController]
[Authorize(Constants.AnalyticsPolicy)]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class ReportsController(IReportingService reportingService) : ControllerBase
{
    /// <summary>
    /// Generates a paginated summary report of all assignments.
    /// </summary>
    /// <param name="pageNumber">Page number</param>
    /// <param name="pageSize">Page Size</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="PaginatedResponse{T}"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("assignments")]
    public async Task<IActionResult> GetAllAssignmentsSummaryReport(
        [FromQuery] int pageNumber = 1, 
        [FromQuery] int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber <= 0 || pageSize <= 0)
        {
            return Response<PaginatedResponse<AssignmentSummaryReportDto>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "PageNumber and PageSize must be greater than zero.")
                .ToActionResult();
        }
        
        var result = await reportingService.GetAllAssignmentSummaryReportAsync(
            pageNumber, 
            pageSize, 
            cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Retrieves a paginated list of all exam takers with optional filtering by ID and name.
    /// </summary>
    /// <param name="pageNumber">Page number</param>
    /// <param name="pageSize">Page Size</param>
    /// <param name="idFilter">Optional: Filter on Exam Taker ID</param>
    /// <param name="nameFilter">Filter on Exam Taker Disaply Name</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns paginated response with <see cref="IndividualUserReportDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("exam-takers")]
    public async Task<IActionResult> GetAllExamTakersAsync(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] string? idFilter = null,
        [FromQuery] string? nameFilter = null,
        CancellationToken cancellationToken = default)
    {
        if (pageNumber <= 0 || pageSize <= 0)
        {
            return Response<PaginatedResponse<AssignmentSummaryReportDto>, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    "PageNumber and PageSize must be greater than zero.")
                .ToActionResult();
        }
        
        var result = await reportingService.GetAllExamTakersAsync(
            idFilter,
            nameFilter,
            pageNumber,
            pageSize,
            cancellationToken);
        
        return result.ToActionResult();
    }
        
    
    /// <summary>
    /// Gets a summary report for a specific assignment.
    /// </summary>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="cancellationToken">Cancellation ID</param>
    /// <returns>Returns <see cref="AssignmentSummaryReportDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("assignments/{assignmentId:guid}/summary")]
    public async Task<IActionResult> GetAssignmentSummaryReport(Guid assignmentId, CancellationToken cancellationToken)
    {
        if (assignmentId == Guid.Empty)
        {
            return Response<AssignmentSummaryReportDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "AssignmentId cannot be empty.")
                .ToActionResult();
        }
        
        var result = await reportingService.GetAssignmentSummaryReportAsync(assignmentId, cancellationToken);

        return result.ToActionResult();
    }
    
    /// <summary>
    /// Gets a full report for a specific assignment.
    /// </summary>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="cancellationToken">Cancellation ID</param>
    /// <returns>Returns a list of <see cref="ExamTakerAssignmentReportDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("assignments/{assignmentId:guid}")]
    public async Task<IActionResult> GetAssignmentReport(Guid assignmentId, CancellationToken cancellationToken)
    {
        if (assignmentId == Guid.Empty)
        {
            return Response<AssignmentSummaryReportDto, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    "AssignmentId cannot be empty.")
                .ToActionResult();
        }
        
        var result = await reportingService.GetAssignmentFullReportAsync(assignmentId, cancellationToken);

        return result.ToActionResult();
    }
    
    /// <summary>
    /// Gets a detailed report for a specific exam taker.
    /// </summary>
    /// <param name="examTakerId">Exam taker ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="ExamTakerReportDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("exam-takers/{examTakerId}")]
    public async Task<IActionResult> GetExamTakerReportAsync(string examTakerId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(examTakerId))
        {
            return Response<IList<ExamTakerAssignmentReportDto>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "ExamTakerId cannot be empty.")
                .ToActionResult();
        }
        
        var result = await reportingService.GetExamTakerReportAsync(
            examTakerId, 
            cancellationToken: cancellationToken);

        return result.ToActionResult();
    }

    /// <summary>
    /// Gets a detailed report for a specific exam taker on the specific assignment.
    /// </summary>
    /// <param name="examTakerId">Exam taker ID</param>
    /// <param name="assignmentId">Assignment ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="ExamTakerReportDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("exam-takers/{examTakerId}/assignments/{assignmentId:guid}")]
    public async Task<IActionResult> GetExamTakerReportAsync(
        string examTakerId, 
        Guid assignmentId, 
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(examTakerId))
        {
            return Response<IList<ExamTakerAssignmentReportDto>, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    "ExamTakerId cannot be empty.")
                .ToActionResult();
        }
        
        var result = await reportingService.GetExamTakerReportAsync(
            examTakerId,
            assignmentId,
            cancellationToken);

        return result.ToActionResult();
    }
}