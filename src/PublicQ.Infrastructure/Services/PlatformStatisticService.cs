using Microsoft.Extensions.Logging;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;

namespace PublicQ.Infrastructure.Services;

/// <inheritdoc cref="IPlatformStatisticService"/>
public class PlatformStatisticService(
    IAssessmentService assessmentService, 
    IGroupService groupService, 
    IAssignmentService assignmentService, 
    IUserService userService, 
    IQuestionService questionService,
    ILogger<PlatformStatisticService> logger) : IPlatformStatisticService
{
    /// <inheritdoc cref="IPlatformStatisticService.GetPlatformStatisticsAsync"/>
    public async Task<Response<PlatformStatisticDto, GenericOperationStatuses>> GetPlatformStatisticsAsync(
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Getting platform statistics request received.");
        
        var assessmentCountTask = await assessmentService.GetTotalAssessmentModulesAsync(cancellationToken);
        var groupCountTask = await groupService.GetTotalGroupsAsync(cancellationToken);
        var assignmentCountTask = await assignmentService.GetAssignmentCountAsync(cancellationToken);
        var userCountTask = await userService.GetUserCountAsync(cancellationToken);
        var questionCountTask = await questionService.GetQuestionCountAsync(cancellationToken);
        
        var response = new PlatformStatisticDto
        {
            TotalModules = assessmentCountTask.Data,
            TotalGroups = groupCountTask.Data,
            TotalAssignments = assignmentCountTask.Data,
            TotalUsers = userCountTask.Data,
            TotalQuestions = questionCountTask.Data
        };
        
        if (assessmentCountTask.IsFailed || 
            groupCountTask.IsFailed || 
            assignmentCountTask.IsFailed || 
            userCountTask.IsFailed || 
            questionCountTask.IsFailed)
        {
            logger.LogWarning("One or more operations to get platform statistics failed.");
            return Response<PlatformStatisticDto, GenericOperationStatuses>.Success(
                response,
                GenericOperationStatuses.PartiallyCompleted,
                "One or more operations to get platform statistics failed.");
        }
        
        return Response<PlatformStatisticDto, GenericOperationStatuses>.Success(
            response,
            GenericOperationStatuses.Completed);
    }
}