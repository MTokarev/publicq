using System.ComponentModel;
using ModelContextProtocol.Server;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Reporting;
using PublicQ.Shared;

namespace PublicQ.API.Tools;

/// <summary>
/// MCP tools for retrieving student/exam taker performance reports
/// </summary>
[McpServerToolType]
public class GetExamTakerReportTools(
    IReportingService reportingService, 
    IMcpAuthService mcpAuthService, 
    ILogger<GetExamTakerReportTools> logger)
{
    /// <summary>
    /// Retrieves a comprehensive performance report for a specific student/exam taker.
    /// </summary>
    /// <param name="userId">The unique identifier of the student</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Comprehensive exam taker report with all assignment progress</returns>
    [McpServerTool]
    [Description(@"Retrieve a comprehensive performance report for a specific student/exam taker.

**OVERVIEW:**
This tool generates a detailed report showing a student's performance across all assignments, including:
- Overall progress metrics (total, completed, in-progress, not started assignments)
- Average scores and time spent
- Detailed breakdown of each assignment with module-level progress
- Assignment start/end dates and completion status

**WHEN TO USE:**
- Analyzing individual student performance
- Reviewing a student's progress across multiple assignments
- Generating progress reports for students or parents
- Identifying struggling students who need help
- Tracking completion rates and time management

**REQUIRED PERMISSION:**
- Analyst role or higher required
- Cannot access if not authorized

**⚠️ CRITICAL - COMPLETE DATA RETURNED:**
This tool returns COMPLETE student performance data including:
- Student identification (StudentId, DisplayName)
- Overall metrics:
  * TotalAssignments - Total number of assignments assigned
  * CompletedAssignments - Number fully completed
  * InProgressAssignments - Number currently being worked on
  * NotStartedAssignments - Number not yet started
  * OverallAverageScore - Average score across all completed assignments (decimal, null if none completed)
  * TotalTimeSpentMinutes - Total time across all assignments in minutes
- AssignmentProgress array - Detailed list of all assignments with:
  * AssignmentId, AssignmentTitle
  * StartedAtUtc, CompletedAtUtc - Timestamps (UTC, null if not applicable)
  * AssignmentStartDateUtc, AssignmentEndDateUtc - Assignment availability window
  * TimeSpentMinutes - Time spent on this assignment
  * CompletedModules, TotalModules - Module completion tracking
  * ModuleReports - Detailed progress for each module in the assignment

**USAGE EXAMPLES:**

1. Get report for a specific student:
   Input: { ""userId"": ""user-123"" }
   Use case: Teacher wants to review John's performance across all assignments

2. Check student completion status:
   Input: { ""userId"": ""student-abc-456"" }
   Use case: Identify if student has completed required assignments

3. Analyze time management:
   Input: { ""userId"": ""user-789"" }
   Use case: See how long student is spending on assignments

**WORKFLOW - Analyzing Student Performance:**
When asked to analyze a student's performance:
1. Call this tool with the student's userId
2. Review the returned data:
   - Check CompletedAssignments vs TotalAssignments for completion rate
   - Review OverallAverageScore for academic performance
   - Examine TotalTimeSpentMinutes for time management
   - Look at AssignmentProgress for detailed assignment-by-assignment analysis
3. Identify patterns (struggling with specific topics, time management issues, etc.)

**TYPICAL USER REQUESTS:**
- ""How is student X performing?""
- ""Show me progress report for user Y""
- ""Has student Z completed all assignments?""
- ""What's the average score for student A?""
- ""How much time has student B spent on assignments?""

**IMPORTANT NOTES:**
- userId parameter is required (cannot be null or empty)
- All dates/times are in UTC format
- OverallAverageScore is null if no assignments have been completed
- Scores are typically on a 0-100 scale (decimal for precision)
- Time is tracked in minutes for granularity

**ERROR HANDLING:**
- Returns failure if userId is null/empty
- Returns failure if user lacks Analyst permissions
- Service handles cases where student has no assignments (empty AssignmentProgress array)")]
    public async Task<Response<ExamTakerReportDto,GenericOperationStatuses>> GetExamTakerReportAsync(
        [Description(@"The unique identifier (user ID) of the student/exam taker to generate the report for. Required.
Cannot be null or empty. Must be a valid user ID in the system.")]
        string userId, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Starting GetExamTakerReportAsync tool execution.");
        Guard.AgainstNullOrWhiteSpace(userId, nameof(userId));
        
        var authResponse = mcpAuthService.IsInAnalystPolicy();
        if (authResponse.IsFailed)
        {
            logger.LogWarning("Authorization failed for GetExamTakerReportAsync: {Message}", authResponse.Message);
            return Response<ExamTakerReportDto, GenericOperationStatuses>.Failure(
                authResponse.Status,
                authResponse.Message);
        }
        
        var reportData = await reportingService.GetExamTakerReportAsync(
            userId, 
            cancellationToken: cancellationToken);
        logger.LogInformation("Successfully generated exam taker report.");
        
        return reportData;
    }
}