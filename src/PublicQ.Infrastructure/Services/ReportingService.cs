using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Assignment;
using PublicQ.Application.Models.Reporting;
using PublicQ.Application.Models.Session;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities.Assignment;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <inheritdoc cref="IReportingService"/>
public class ReportingService(
    ApplicationDbContext dbContext, 
    IUserService userService,
    IOptionsMonitor<ReportingServiceOptions> options,
    ILogger<ReportingService> logger) : IReportingService
{
    /// <inheritdoc cref="IReportingService.GetAllAssignmentSummaryReportAsync"/>
    public async Task<Response<PaginatedResponse<AssignmentSummaryReportDto>, GenericOperationStatuses>>
        GetAllAssignmentSummaryReportAsync(
            int pageNumber,
            int pageSize,
            CancellationToken cancellationToken)
    {
        if (pageNumber < 1)
        {
            logger.LogInformation("Page number {PageNumber} is less than 1. Defaulting to 1", pageNumber);
            pageNumber = 1;
        }

        if (pageSize > options.CurrentValue.MaxPageSize)
        {
            logger.LogInformation("Page size {PageSize} exceeds max of {MaxPageSize}. Capping to max.",
                pageSize,
                options.CurrentValue.MaxPageSize);
            pageSize = options.CurrentValue.MaxPageSize;
        }
        
        logger.LogDebug("GetAllAssignmentSummaryReportAsync request received");

        var query = dbContext.Assignments
            .AsNoTracking()
            .AsQueryable();
        
        var assignments = await query
            .OrderByDescending(assignment => assignment.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        if (assignments.Count == 0)
        {
            logger.LogInformation("No assignments found in the database.");
            return Response<PaginatedResponse<AssignmentSummaryReportDto>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                "No assignments found.");
        }
        

        var assignmentReports = new List<AssignmentSummaryReportDto>();
        var totalCount = await query.LongCountAsync(cancellationToken);
        var paginatedResponse = new PaginatedResponse<AssignmentSummaryReportDto>
        {
            Data = assignmentReports,
            TotalCount = totalCount,
            PageSize = assignments.Count,
        };
        
        foreach (var assignment in assignments)
        {
            logger.LogDebug("Processing AssignmentId: {AssignmentId}", assignment.Id);
            var assignmentReport = await GetAssignmentSummaryReportAsync(assignment.Id, cancellationToken);

            if (assignmentReport.IsSuccess)
            {
                assignmentReports.Add(assignmentReport.Data!);
            }
            else
            {
                logger.LogWarning("Failed to generate report for AssignmentId: {AssignmentId}. Errors: {Errors}",
                    assignment.Id,
                    string.Join(", ", assignmentReport.Errors));
            }
        }
        
        logger.LogDebug("Assembled {Count} assignment reports", assignmentReports.Count);
        
        return Response<PaginatedResponse<AssignmentSummaryReportDto>, GenericOperationStatuses>.Success(
            paginatedResponse, 
            GenericOperationStatuses.Completed,
            "Assignment summary reports retrieved successfully.");
    }

    /// <inheritdoc cref="IReportingService.GetAssignmentFullReportAsync"/>
    public async Task<Response<AssignmentReportDto, GenericOperationStatuses>> GetAssignmentFullReportAsync(
            Guid assignmentId,
            CancellationToken cancellation)
    {
        logger.LogDebug("GetExamTakersAssignmentReportAsync request received for AssignmentId: {AssignmentId}",
            assignmentId);
        
        var assignment = await dbContext.Assignments
            .AsNoTracking()
            .Include(assignmentEntity => assignmentEntity.ExamTakerAssignments)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellation);

        if (assignment == null)
        {
            logger.LogWarning("Assignment with ID {AssignmentId} not found.", assignmentId);
            return Response<AssignmentReportDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Assignment with ID {assignmentId} not found.");
        }
        
        // Get all exam taker IDs for batch processing
        var examTakerIds = assignment.ExamTakerAssignments.Select(eta => eta.ExamTakerId).ToList();
        
        var examTakerReportsResponse = await GetExamTakerReportsAsync(
            examTakerIds, 
            assignmentId, 
            cancellation);

        if (examTakerReportsResponse.IsFailed)
        {
            logger.LogError("Failed to get reports for assignment {AssignmentId}. Errors: {Errors}",
                assignmentId,
                string.Join(", ", examTakerReportsResponse.Errors));
            return Response<AssignmentReportDto, GenericOperationStatuses>.Failure(
                examTakerReportsResponse.Status,
                examTakerReportsResponse.Message,
                examTakerReportsResponse.Errors);
        }

        var fullAssignmentReport = AssignmentReportDto.CreateReportFromData(
            assignment.ConvertToDto(),
            examTakerReportsResponse.Data!);
        
        return Response<AssignmentReportDto, GenericOperationStatuses>.Success(
            fullAssignmentReport,
            GenericOperationStatuses.Completed,
            $"Exam taker assignment reports retrieved successfully for AssignmentId: {assignmentId}");
    }

    /// <inheritdoc cref="IReportingService.GetAssignmentSummaryReportAsync"/>
    public async Task<Response<AssignmentSummaryReportDto, GenericOperationStatuses>> GetAssignmentSummaryReportAsync(
        Guid assignmentId,
        CancellationToken cancellation)
    {
        logger.LogDebug("GetAssignmentSummaryReportAsync request received for AssignmentId: {AssignmentId}",
            assignmentId);

        var assignment = await dbContext.Assignments
            .Include(a => a.ExamTakerAssignments)
                .ThenInclude(eta => eta.ModuleProgress)
                    .ThenInclude(mp => mp.AssessmentModuleVersion)
            .Include(a => a.ExamTakerAssignments)
                .ThenInclude(eta => eta.ModuleProgress)
                    .ThenInclude(mp => mp.QuestionResponses)
            .Include(a => a.Group)
                .ThenInclude(g => g.GroupMemberEntities)
                    .ThenInclude(gm => gm.AssessmentModule)
                        .ThenInclude(am => am.Versions)
                            .ThenInclude(v => v.Questions)
            .AsSplitQuery()
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellation);

        if (assignment == null)
        {
            logger.LogWarning("Assignment with ID {AssignmentId} not found.", assignmentId);
            return Response<AssignmentSummaryReportDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Assignment with ID {assignmentId} not found.");
        }

        logger.LogDebug("Assembling report data for AssignmentId: {AssignmentId}", assignmentId);

        // Define the completion condition first
        var isModuleCompleted = (ModuleProgressEntity mp) => mp.CompletedAtUtc != null ||
                                                             (mp.StartedAtUtc != null &&
                                                              mp.StartedAtUtc.Value.AddMinutes(mp.DurationInMinutes) <
                                                              DateTime.UtcNow);

        // Get completed assignments (students who completed ALL modules)
        var completedAssignments = assignment.ExamTakerAssignments
            .Where(eta => eta.ModuleProgress.Count > 0 && 
                          assignment.Group != null && 
                          eta.ModuleProgress.Count(isModuleCompleted) == assignment.Group.GroupMemberEntities.Count)
            .ToList();

        // Get in-progress assignments  
        var inProgressAssignments = assignment.ExamTakerAssignments
            .Where(eta => eta.ModuleProgress.Any(mp => mp.StartedAtUtc != null) &&
                          assignment.Group != null &&
                          eta.ModuleProgress.Count(isModuleCompleted) != assignment.Group.GroupMemberEntities.Count)
            .ToList();

        // Get not-started assignments
        var notStartedAssignments = assignment.ExamTakerAssignments
            .Where(eta => !eta.ModuleProgress.Any()) // No progress records at all
            .ToList();

        // Calculate average score across all completed modules
        var averageScore = assignment.ExamTakerAssignments
            .SelectMany(eta => eta.ModuleProgress)
            .Where(isModuleCompleted)
            .Average(mp => (double?)mp.ScorePercentage) ?? 0;

        // Build module reports (grouped by module)
        // Get all modules in the assignment through Group -> GroupMembers -> AssessmentModules
        var moduleReports = assignment.Group.GroupMemberEntities
            .OrderBy(gm => gm.OrderNumber) // Maintain module order
            .Select(groupMember => 
            {
                var module = groupMember.AssessmentModule;
                
                // Find progress records for THIS specific module across all students
                var moduleProgresses = assignment.ExamTakerAssignments
                    .SelectMany(eta => eta.ModuleProgress)
                    .Where(mp => mp.AssessmentModuleVersion.AssessmentModuleId == module.Id)
                    .ToList();
                    
                var completedModules = moduleProgresses.Where(isModuleCompleted).ToList();
                
                // Get the latest version for display info
                var latestVersion = module.Versions
                    .OrderByDescending(v => v.Version)
                    .FirstOrDefault();
                
                var moduleCompletionTimes = completedModules
                    .Where(mp => mp is { CompletedAtUtc: not null, StartedAtUtc: not null })
                    .Select(mp => (mp.CompletedAtUtc!.Value - mp.StartedAtUtc!.Value).TotalMinutes)
                    .ToList();
                
                return new ModuleSummaryReportDto
                {
                    ModuleId = module.Id,
                    ModuleTitle = latestVersion?.Title ?? string.Empty,
                    ModuleDescription = latestVersion?.Description,
                    
                    TotalQuestions = latestVersion?.Questions.Count ?? 0,
                    
                    // Handle case where no one started this module
                    CompletionRate = assignment.ExamTakerAssignments.Any() 
                        ? (double)completedModules.Count / assignment.ExamTakerAssignments.Count * 100 
                        : 0,
                    
                    // Scores - could be null if no one completed
                    AverageScore = completedModules.Any() 
                        ? completedModules.Average(m => (double?)m.ScorePercentage) 
                        : null,
                    HighestScore = completedModules.Any() 
                        ? completedModules.Max(m => (double?)m.ScorePercentage) 
                        : null,
                    LowestScore = completedModules.Any() 
                        ? completedModules.Min(m => (double?)m.ScorePercentage) 
                        : null,
                    
                    // Average completion time
                    AverageCompletionTimeMinutes = moduleCompletionTimes.Any() 
                        ? moduleCompletionTimes.Average() 
                        : null
                };
            })
            .ToList();

        // Calculate average completion time for completed assignments
        // Here we don't include assignments with any incomplete modules
        var averageCompletionTimeInMinutes = completedAssignments.Any()
            ? completedAssignments
                .Where(eta => eta.ModuleProgress.All(mp => mp is { CompletedAtUtc: not null, StartedAtUtc: not null }))
                .Select(eta => eta.ModuleProgress
                    .Sum(mp => (mp.CompletedAtUtc!.Value - mp.StartedAtUtc!.Value).TotalMinutes))
                .DefaultIfEmpty(0)
                .Average()
            : 0;
        
        // Build the final assignment report
        var report = new AssignmentSummaryReportDto
        {
            AssignmentId = assignment.Id,
            AssignmentTitle = assignment.Title,
            AssignmentDescription = assignment.Description ?? string.Empty,
            TotalStudents = assignment.ExamTakerAssignments.Count,
            AverageScore = averageScore,

            // Fixed missing properties:
            CompletedStudents = completedAssignments.Count,
            CompletionRate = assignment.ExamTakerAssignments.Any()
                ? (double)completedAssignments.Count / assignment.ExamTakerAssignments.Count * 100
                : 0,
            InProgressStudents = inProgressAssignments.Count,
            NotStartedStudents = notStartedAssignments.Count,

            StartDateUtc = assignment.StartDateUtc,
            EndDateUtc = assignment.EndDateUtc,
            IsActive = assignment.EndDateUtc > DateTime.UtcNow,
            AverageCompletionTimeMinutes = averageCompletionTimeInMinutes,

            // Add the module reports
            ModuleReports = moduleReports
        };
        
        return Response<AssignmentSummaryReportDto, GenericOperationStatuses>.Success(
            report, 
            GenericOperationStatuses.Completed,
            $"Report generated successfully for AssignmentId: {assignmentId}");
    }

    /// <inheritdoc cref="IReportingService.GetExamTakerReportAsync"/>
    public async Task<Response<ExamTakerReportDto, GenericOperationStatuses>> GetExamTakerReportAsync(
        string examTakerId, 
        Guid? assignmentId = null,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("GetExamTakerReportAsync request received.");
        Guard.AgainstNullOrWhiteSpace(examTakerId, nameof(examTakerId));
        
        var response = await GetExamTakerReportsAsync(
            new List<string> { examTakerId }, 
            assignmentId, 
            cancellationToken);

        if (response.IsFailed)
        {
            return Response<ExamTakerReportDto, GenericOperationStatuses>.Failure(
                response.Status, 
                response.Message, 
                response.Errors);
        }
        
        return Response<ExamTakerReportDto, GenericOperationStatuses>.Success(
            response.Data!.First(), 
            response.Status, 
            response.Message);
    }

    /// <inheritdoc cref="IReportingService.GetAllExamTakersAsync"/>
    public async Task<Response<PaginatedResponse<IndividualUserReportDto>, GenericOperationStatuses>> GetAllExamTakersAsync(
        string? idFilter,
        string? nameFilter,
        int pageNumber,
        int pageSize,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("GetAllExamTakerAssignmentsAsync request received.");
        if (pageNumber < 1)
        {
            logger.LogInformation("Page number {PageNumber} is less than 1. Defaulting to 1", pageNumber);
            pageNumber = 1;
        }
        if (pageSize > options.CurrentValue.MaxPageSize)
        {
            logger.LogInformation("Page size {PageSize} exceeds max of {MaxPageSize}. Capping to max.",
                pageSize,
                options.CurrentValue.MaxPageSize);
            pageSize = options.CurrentValue.MaxPageSize;
        }
        
        // Get distinct exam taker assignments
        var uniqueIds = dbContext.ExamTakerAssignments
            .GroupBy(eta => eta.ExamTakerId)
            .Select(g => g.First().Id); // Any record

        var query = dbContext.ExamTakerAssignments
            .AsNoTracking()
            .Where(eta => uniqueIds.Contains(eta.Id))
            .AsQueryable();

        var totalCount = await query.LongCountAsync(cancellationToken);

        if (!string.IsNullOrWhiteSpace(idFilter))
        {
            query = query.Where(eta => EF.Functions.Like(
                eta.ExamTakerId.ToUpper(), 
                $"%{idFilter.ToUpper()}%"));
        }
        
        if (!string.IsNullOrWhiteSpace(nameFilter))
        {
            query = query.Where(eta => EF.Functions.Like(
                eta.ExamTakerDisplayName.ToUpper(), 
                $"%{nameFilter.ToUpper()}%"));
        }
        
        var assignments = await query
            .OrderBy(eta => eta.ExamTakerDisplayName)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);
        
        var paginatedResponse = new PaginatedResponse<IndividualUserReportDto>
        {
            Data = assignments.Select(eta => eta.ConvertToDto()).ToList(),
            TotalCount = totalCount,
            PageSize = assignments.Count
        };
        
        logger.LogDebug("Assembled {Count} exam taker assignments", assignments.Count);
        
        return Response<PaginatedResponse<IndividualUserReportDto>, GenericOperationStatuses>.Success(
            paginatedResponse, 
            GenericOperationStatuses.Completed,
            "Exam taker assignments retrieved successfully.");
    }

    /// <inheritdoc cref="IReportingService.GetExamTakerReportsAsync"/>
    public async Task<Response<IList<ExamTakerReportDto>, GenericOperationStatuses>> GetExamTakerReportsAsync(
        IList<string> examTakerIds,
        Guid? assignmentId = null,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("GetExamTakerReports call received.");
        Guard.AgainstNull(examTakerIds, nameof(examTakerIds));
        logger.LogDebug("GetExamTakerReportsAsync request received for {Count} ExamTakerIds: {ExamTakerIds}", 
            examTakerIds.Count, string.Join(", ", examTakerIds));
        
        // Get exam taker assignments
        var examTakerAssignments = await dbContext.ExamTakerAssignments
            .AsNoTracking()
            .Where(eta => examTakerIds.Contains(eta.ExamTakerId) && 
                          (!assignmentId.HasValue || eta.AssignmentId == assignmentId.Value))
            .Include(eta => eta.Assignment)
            .ToListAsync(cancellationToken);
        
        // Get existing user progresses
        var userProgresses = await dbContext.ModuleProgress
            .Where(mp => examTakerIds.Contains(mp.ExamTakerId) && 
                         (!assignmentId.HasValue || mp.ExamTakerAssignment.AssignmentId == assignmentId.Value))
            .Include(mp => mp.QuestionResponses)
            .Include(mp => mp.ExamTakerAssignment)
                .ThenInclude(eta => eta.Assignment)
            .Include(moduleProgressEntity => moduleProgressEntity.AssessmentModuleVersion)
                .ThenInclude(assessmentModuleVersionEntity => assessmentModuleVersionEntity.Questions)
            .ToListAsync(cancellationToken);
        
        // Get all assignment modules that this exam taker should have
        var expectedModules = await dbContext.Groups
            .AsNoTracking()
            .Where(g => examTakerAssignments.Select(eta => eta.Assignment.GroupId).Contains(g.Id))
            .SelectMany(g => g.GroupMemberEntities!)
            .Include(gm => gm.AssessmentModule)
                .ThenInclude(am => am.Versions)
            .ToListAsync(cancellationToken);

        // Create missing user progresses for modules without progress
        var existingProgressModuleKeys = userProgresses
            .Select(up => up.AssessmentModuleVersionId)
            .ToHashSet();

        var missingProgresses = expectedModules
            .SelectMany(em => 
            {
                // If user already has progress for this module, skip
                if (userProgresses.Any(up => 
                        up.AssessmentModuleVersion.AssessmentModuleId == em.AssessmentModuleId))
                {
                    return [];
                }
                
                var latestVersion = em.AssessmentModule.Versions
                    .OrderByDescending(v => v.Version)
                    .FirstOrDefault();

                if (latestVersion == null || existingProgressModuleKeys.Contains(latestVersion.Id))
                {
                    return [];
                }
                    
                return examTakerAssignments
                    .Where(eta => eta.Assignment.GroupId == em.GroupId)
                    .Select(eta => new ModuleProgressEntity
                    {
                        ExamTakerId = eta.ExamTakerId,
                        AssessmentModuleVersionId = latestVersion.Id,
                        StartedAtUtc = null,
                        CompletedAtUtc = null,
                        DurationInMinutes = 0,
                        AssessmentModuleVersion = latestVersion,
                        ExamTakerAssignment = eta,
                        QuestionResponses = new List<QuestionResponseEntity>()
                    });
            })
            .ToList();

        // Combine existing and missing progresses
        var completeUserProgresses = userProgresses.Concat(missingProgresses).ToList();

        logger.LogDebug("Found {ExistingCount} existing progresses and created {MissingCount} missing progresses for ExamTakerIds: {ExamTakerIds}", 
            userProgresses.Count, missingProgresses.Count, string.Join(", ", examTakerIds));
        
        // Create reports for each exam taker
        var reports = new List<ExamTakerReportDto>();
        
        foreach (var examTaker in examTakerIds!)
        {
            // Filter data for this specific exam taker
            var examTakerSpecificAssignments = examTakerAssignments.Where(eta => eta.ExamTakerId == examTaker).ToList();
            var examTakerSpecificProgresses = completeUserProgresses.Where(up => up.ExamTakerId == examTaker).ToList();
            
            // Generate module and assignment reports for this exam taker
            var moduleReports = GetModuleReports(examTakerSpecificProgresses);
            var assignmentReports = GetAssignmentReports(moduleReports);

            var totalAssignments = examTakerSpecificAssignments.Count;
            var inProgressAssignments = assignmentReports.Count(ar => ar.CompletedModules > 0 && ar.CompletedModules < ar.TotalModules);
            var completedAssignments = assignmentReports.Count(ar => ar.CompletedModules == ar.TotalModules && ar.TotalModules > 0);

            var examTakerDisplayName = examTakerSpecificAssignments
                .Select(e => e.ExamTakerDisplayName)
                .FirstOrDefault();
            
            var report = new ExamTakerReportDto
            {
                StudentId = examTaker,
                DisplayName = string.IsNullOrWhiteSpace(examTakerDisplayName) ? 
                    $"ID '{examTaker}'" : 
                    examTakerDisplayName,
                TotalAssignments = totalAssignments,
                CompletedAssignments = completedAssignments,
                InProgressAssignments = inProgressAssignments,
                NotStartedAssignments = totalAssignments - (inProgressAssignments + completedAssignments),
                OverallAverageScore = assignmentReports.Any() 
                    ? assignmentReports.Where(ar => ar.ModuleReports.Any(mr => mr.Score.HasValue))
                        .SelectMany(ar => ar.ModuleReports.Where(mr => mr.Score.HasValue))
                        .Average(mr => mr.Score!.Value)
                    : null,
                TotalTimeSpentMinutes = assignmentReports.Sum(ar => ar.TimeSpentMinutes),
                AssignmentProgress = assignmentReports
            };
            
            reports.Add(report);
        }
        
        logger.LogDebug("Assembling report data completed for {Count} exam takers", reports.Count);
        
        return Response<IList<ExamTakerReportDto>, GenericOperationStatuses>.Success(
            reports, 
            GenericOperationStatuses.Completed,
            $"Reports generated successfully for {reports.Count} exam takers");
    }

    /// <summary>
    /// Generates assignment reports from module reports
    /// </summary>
    /// <param name="moduleReports">module reports</param>
    /// <returns>Returns array of <see cref="ExamTakerAssignmentReportDto"/></returns>
    private static List<ExamTakerAssignmentReportDto> GetAssignmentReports(
        Dictionary<AssignmentEntity, HashSet<ExamTakerModuleReportDto>> moduleReports)
    {
        var assignmentReports = new List<ExamTakerAssignmentReportDto>();
        foreach (var kvp in moduleReports)
        {
            var assignmentReport = new ExamTakerAssignmentReportDto
            {
                AssignmentId = kvp.Key.Id,
                AssignmentStartDateUtc = kvp.Key.StartDateUtc,
                AssignmentEndDateUtc = kvp.Key.EndDateUtc,
                AssignmentTitle = kvp.Key.Title,
                StartedAtUtc = kvp.Value.Min(mr => mr.StartedAtUtc),
                CompletedAtUtc = kvp.Value.Max(mr => mr.CompletedAtUtc),
                TimeSpentMinutes = kvp.Value.Sum(mr => mr.TimeSpentMinutes),
                CompletedModules = kvp.Value.Count(mr => mr.Status == ModuleStatus.Completed),
                TotalModules = kvp.Value.Count,
                ModuleReports = kvp.Value
            };
            assignmentReports.Add(assignmentReport);
        }

        return assignmentReports;
    }

    /// <summary>
    /// Gets module reports from user progresses
    /// </summary>
    /// <param name="userProgresses">User module progress</param>
    /// <returns>Returns a dictionary where <see cref="AssignmentEntity"/> is a key and
    /// <see cref="ExamTakerModuleReportDto"/> is a value</returns>
    private static Dictionary<AssignmentEntity, HashSet<ExamTakerModuleReportDto>> GetModuleReports(
        List<ModuleProgressEntity> userProgresses)
    {
        var moduleReports = new Dictionary<AssignmentEntity, HashSet<ExamTakerModuleReportDto>>();
        foreach (var progress in userProgresses)
        {
            var moduleStatus = DetermineModuleStatus(progress);
            
            var moduleReport = new ExamTakerModuleReportDto
            {
                ModuleId = progress.AssessmentModuleVersion.Id,
                ModuleTitle = progress.AssessmentModuleVersion.Title,
                Status = moduleStatus,
                PassingScore = progress.PassingScorePercentage,
                Score = progress.ScorePercentage,
                Passed = progress.Passed,
                StartedAtUtc = progress.StartedAtUtc,
                CompletedAtUtc = progress.CompletedAtUtc ?? progress.StartedAtUtc?.AddMinutes(progress.DurationInMinutes),
                TimeSpentMinutes = CalculateTimeSpentMinutes(progress),
                AnsweredQuestions = progress.QuestionResponses.Count,
                TotalQuestions = progress.AssessmentModuleVersion.Questions.Count
            };
            
            if (moduleReports.ContainsKey(progress.ExamTakerAssignment.Assignment))
            {
                moduleReports[progress.ExamTakerAssignment.Assignment].Add(moduleReport);
            }
            else
            {
                moduleReports[progress.ExamTakerAssignment.Assignment] = [moduleReport];
            }
        }

        return moduleReports;
    }

    /// <summary>
    /// Calculates the module status based on progress details
    /// </summary>
    /// <param name="progress">Module progress entity</param>
    /// <returns>Returns calculated <see cref="ModuleStatus"/></returns>
    private static ModuleStatus DetermineModuleStatus(ModuleProgressEntity progress)
    {
        // If never started, it's not started
        if (progress.StartedAtUtc == null)
            return ModuleStatus.NotStarted;
            
        if (progress.CompletedAtUtc != null) 
            return ModuleStatus.Completed;
        
        var expirationTime = progress.StartedAtUtc.Value.AddMinutes(progress.DurationInMinutes);
        return expirationTime > DateTime.UtcNow ? ModuleStatus.InProgress : ModuleStatus.Completed;
    }

    /// <summary>
    /// Calculates time spent on a module in minutes
    /// </summary>
    /// <param name="progress">Module progress entity</param>
    /// <returns>Returns time in minute user spent in the module</returns>
    private static int CalculateTimeSpentMinutes(ModuleProgressEntity progress)
    {
        // If never started, no time spent
        if (progress.StartedAtUtc == null)
            return 0;
            
        if (progress.CompletedAtUtc != null)
        {
            // For completed modules, use actual completion time
            return (int)(progress.CompletedAtUtc.Value - progress.StartedAtUtc.Value).TotalMinutes;
        }
        
        var expirationTime = progress.StartedAtUtc.Value.AddMinutes(progress.DurationInMinutes);
        var endTime = DateTime.UtcNow < expirationTime ? DateTime.UtcNow : expirationTime;
        
        // For incomplete modules, use time until now or expiration time, whichever is earlier
        return (int)(endTime - progress.StartedAtUtc.Value).TotalMinutes;
    }
}