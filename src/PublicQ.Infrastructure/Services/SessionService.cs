using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Group;
using PublicQ.Application.Models.Session;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities.Assignment;
using PublicQ.Shared;
using PublicQ.Shared.Enums;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// Implementation of the <see cref="ISessionService"/> interface for managing user exam sessions.
/// </summary>
public class SessionService(
    ApplicationDbContext dbContext,
    IGroupService groupService,
    IAssessmentService assessmentService,
    IQuestionService questionService,
    ILogger<SessionService> logger) : ISessionService
{
    /// <inheritdoc cref="ISessionService.GetGroupMemberStatesAsync"/>
    public async Task<Response<IList<GroupMemberStateWithUserProgressDto>, GenericOperationStatuses>> GetGroupMemberStatesAsync
    (
        string userId,
        Guid examTakerAssignmentId,
        Guid groupId,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Getting assignments request received");
        Guard.AgainstNullOrWhiteSpace(userId, nameof(userId));
        
        var groupResponse = await groupService.GetGroupAsync(groupId, cancellationToken);
        if (groupResponse.IsFailed)
        {
            return Response<IList<GroupMemberStateWithUserProgressDto>, GenericOperationStatuses>.Failure(
                groupResponse.Status,
                groupResponse.Message, 
                groupResponse.Errors);
        }
        
        var examTakerAssignment = await dbContext.ExamTakerAssignments
            .AsNoTracking()
            .FirstOrDefaultAsync(ea => ea.Id == examTakerAssignmentId && ea.ExamTakerId == userId, cancellationToken);
        if (examTakerAssignment is null)
        {
            logger.LogInformation("Assignment {AssignmentId} not found for user {UserId}.",
                examTakerAssignmentId, 
                userId);
            
            return Response<IList<GroupMemberStateWithUserProgressDto>, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment {examTakerAssignmentId} not found for user {userId}.");
        }
        
        logger.LogInformation("Checking if user already launched any assignment");

        var assignment = await dbContext.Assignments
            .AsNoTracking()
            .FirstOrDefaultAsync(ea => ea.Id == examTakerAssignment.AssignmentId, cancellationToken);

        if (assignment == null)
        {
            logger.LogError("Assignment {AssignmentId} not found.", examTakerAssignmentId);
            return Response<IList<GroupMemberStateWithUserProgressDto>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Assignment {examTakerAssignmentId} not found.");
        }
        
        var userProgress = await dbContext.ModuleProgress
            .Where(mp => mp.ExamTakerId == userId && 
                         mp.GroupMember.GroupId == groupId &&
                         mp.ExamTakerAssignmentId == examTakerAssignment.Id)
            .Include(mp => mp.QuestionResponses)
            .Include(mp => mp.GroupMember)
            .Include(mp => mp.AssessmentModuleVersion)
                .ThenInclude(mpv => mpv.Questions)
            .ToListAsync(cancellationToken);
        
        var groupMembersWithStatus = groupResponse
            .Data!
            .GroupMembers
            .Select(g => new GroupMemberStateWithUserProgressDto
            {
                Id = g.Id,
                GroupId = g.GroupId,
                OrderNumber = g.OrderNumber,
                AssessmentModuleId = g.AssessmentModuleId,
                AssessmentModuleTitle = g.AssessmentModuleTitle,
                AssessmentModuleDescription = g.AssessmentModuleDescription,
                AnswerCount = userProgress
                    .FirstOrDefault(up => up.GroupMemberId == g.Id)?.QuestionResponses.Count ?? 0,
                QuestionCount = userProgress
                    .FirstOrDefault(up => up.GroupMemberId == g.Id)?.AssessmentModuleVersion.Questions.Count ?? 0,
                Status = GetModuleStatus(userProgress, g, groupResponse.Data)
            })
            .ToList();
        
        return Response<IList<GroupMemberStateWithUserProgressDto>, GenericOperationStatuses>.Success(
            groupMembersWithStatus, 
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="ISessionService.GetModuleProgressAsync"/>
    public async Task<Response<ModuleProgressDto, GenericOperationStatuses>> GetModuleProgressAsync(
        string userId,
        Guid assignmentId,
        Guid moduleId,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Getting assignments request received");
        Guard.AgainstNullOrWhiteSpace(userId, nameof(userId));
        
        var examAssignment = await dbContext.ExamTakerAssignments
            .AsNoTracking()
            .Where(ea => ea.AssignmentId == assignmentId && 
                         ea.ExamTakerId == userId)
            .Include(ea => ea.Assignment)
            .ThenInclude(a => a.Group)
            .ThenInclude(g => g!.GroupMemberEntities)
            .FirstOrDefaultAsync(cancellationToken);

        if (examAssignment is null)
        {
            logger.LogInformation("Assignment {AssignmentId} not found for user {UserId}.",
                assignmentId, 
                userId);
            
            return Response<ModuleProgressDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment {assignmentId} not found for user {userId}.");
        }
        
        if (examAssignment.Assignment.StartDateUtc > DateTime.UtcNow)
        {
            logger.LogInformation("Assignment {AssignmentId} for user {UserId} is not yet started.",
                assignmentId, 
                userId);
            
            return Response<ModuleProgressDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"Assignment {assignmentId} for user {userId} is not yet started.");
        }

        // Now get the user progress for this specific module
        var userProgress = await dbContext.ModuleProgress
            .AsNoTracking()
            .Include(mp => mp.QuestionResponses)
            .Include(mp => mp.AssessmentModuleVersion)
            .Where(mp => mp.ExamTakerId == userId && 
                         mp.ExamTakerAssignmentId == examAssignment.Id &&
                         mp.GroupMember.AssessmentModuleId == moduleId)
            .FirstOrDefaultAsync(cancellationToken);

        if (userProgress is null)
        {
            logger.LogInformation("No progress found for user {UserId} in assignment {AssignmentId}.",
                userId,
                assignmentId);
            return Response<ModuleProgressDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"No progress found for user {userId} in assignment {assignmentId}.");
        }
        
        return Response<ModuleProgressDto, GenericOperationStatuses>.Success(
            userProgress.ConvertToDto(),
            GenericOperationStatuses.Completed);
    }
    
    /// <inheritdoc cref="ISessionService.CreateModuleProgressAsync"/>
    public async Task<Response<ModuleProgressDto, GenericOperationStatuses>> CreateModuleProgressAsync(
        string userId, 
        Guid assignmentId, 
        Guid assessmentModuleId,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Creating new progress entry for assignment {AssignmentId}.", assignmentId);
        Guard.AgainstNullOrWhiteSpace(userId, nameof(userId));
        
        // 1. Check member state to ensure the module is accessible
        var groupStateResponse = await GetGroupStateAsync(userId, assignmentId, cancellationToken);
        if (groupStateResponse.IsFailed)
        {
            return Response<ModuleProgressDto, GenericOperationStatuses>.Failure(
                groupStateResponse.Status, 
                "Unable to validate module accessibility");
        }
        
        // This should never happen due to previous validations
        // If it does, it indicates a serious data integrity issue
        var groupMemberState = groupStateResponse.Data!.GroupMembers
            .First(gm => gm.AssessmentModuleId == assessmentModuleId);
        
        // 2. Ensure the module is accessible (NotStarted)
        //    This prevents creating progress for locked or completed modules
        if (groupMemberState.Status != ModuleStatus.NotStarted)
        {
            logger.LogInformation("Module {AssessmentModuleId} is not accessible for user {UserId}. Status: {Status}",
                assessmentModuleId, 
                userId,
                groupMemberState.Status);
            return Response<ModuleProgressDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Conflict,
                $"Module {assessmentModuleId} is not accessible. Current status: {groupMemberState.Status}");
        }
        
        // 3. Get the assignment data
        var examAssignment = await dbContext.ExamTakerAssignments
            .AsNoTracking()
            .Where(ea => ea.AssignmentId == assignmentId && ea.ExamTakerId == userId)
            .AsQueryable()
            .Include(ea => ea.Assignment)
                .ThenInclude(a => a.Group)
                    .ThenInclude(g => g!.GroupMemberEntities)
            .FirstOrDefaultAsync(cancellationToken);

        if (examAssignment is null)
        {
            logger.LogInformation("Assignment {AssignmentId} not found for user {UserId}.",
                assignmentId, 
                userId);
            
            return Response<ModuleProgressDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment {assignmentId} not found for user {userId}.");
        }
        
        // 4. Pull the latest published module version
        //    This ensures the user always gets the most up-to-date version
        //    If the module is updated after the user has started, they will still have their original version
        var latestVersion = await assessmentService.GetLatestPublishedModuleVersionAsync(
            assessmentModuleId, 
            cancellationToken);

        var moduleProgress = new ModuleProgressEntity
        {
            // Randomization seeds are only generated if randomization is enabled for the assignment
            AnswerRandomizationSeed = examAssignment.Assignment.RandomizeAnswers ? Guid.NewGuid(): null,
            QuestionRandomizationSeed = examAssignment.Assignment.RandomizeQuestions ? Guid.NewGuid(): null,
            ExamTakerId = userId,
            ExamTakerAssignmentId = examAssignment.Id,
            AssessmentModuleVersionId = latestVersion.Data!.Id,
            GroupMemberId = groupStateResponse.Data.GroupMembers.First(gm =>
                gm.AssessmentModuleId == assessmentModuleId).Id,
            HasStarted = true,
            StartedAtUtc = DateTime.UtcNow,
            DurationInMinutes = latestVersion.Data.DurationInMinutes,
        };
        
        var entityEntry = await dbContext.ModuleProgress.AddAsync(moduleProgress, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        
        logger.LogInformation("Module progress created for user {UserId}.", userId);
        
        return Response<ModuleProgressDto, GenericOperationStatuses>.Success(
            entityEntry.Entity.ConvertToDto(), 
            GenericOperationStatuses.Completed,
            "Module progress created successfully.");
    }

    /// <inheritdoc cref="ISessionService.GetModuleVersionAsync"/>
    public async Task<Response<ExamTakerModuleVersionDto, GenericOperationStatuses>> GetModuleVersionAsync(
        string userId,
        Guid assignmentId,
        Guid versionId,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Getting version request received");
        
        var assessmentModuleVersion = await dbContext.AssessmentModuleVersions
            .AsNoTracking()
            .Include(a => a.Questions)
                .ThenInclude(q => q.AssociatedStaticFiles)
            .Include(a => a.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.PossibleAnswers.OrderBy(a => a.Order))
                    .ThenInclude(q => q.AssociatedStaticFiles)
            .FirstOrDefaultAsync(v => v.Id == versionId, cancellationToken);

        if (assessmentModuleVersion is null)
        {
            logger.LogInformation("Assessment module version not found for version {VersionId}.", versionId);
            return Response<ExamTakerModuleVersionDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Assessment module version not found for version {versionId}.");
        }
        
        // This is a safeguard to ensure the user has progress for this version
        // Creating progress is handled in GetOrCreateModuleProgressAsync
        // This check is to avoid exposing module versions to users who haven't started them
        var userProgress = await dbContext.ModuleProgress
            .AsNoTracking()
            .Where(mp => mp.ExamTakerId == userId && 
                         mp.ExamTakerAssignment.AssignmentId == assignmentId &&
                         mp.AssessmentModuleVersionId == versionId)
            .FirstOrDefaultAsync(cancellationToken);
        
        if (userProgress is null)
        {
            logger.LogInformation("No progress found for version {VersionId}. Please create the progress entity first.", 
                versionId);
            return Response<ExamTakerModuleVersionDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"No progress found for version {versionId}. Please create the progress entity first.");
        }

        var assessmentModuleVersionDto = assessmentModuleVersion.ConvertToExamTakerDto();

        // Shuffle questions and answers if randomization seeds are present,
        // The same seed will always produce the same order
        if (userProgress.QuestionRandomizationSeed is not null)
        {
            logger.LogDebug("Question randomization seed {UserProgress.QuestionRandomizationSeed}",
                userProgress.QuestionRandomizationSeed);
            assessmentModuleVersionDto.Questions = ShuffleList(
                assessmentModuleVersionDto.Questions, 
                userProgress.QuestionRandomizationSeed.Value);
        }
        
        if (userProgress.AnswerRandomizationSeed is not null)
        {
            logger.LogDebug("Answer randomization seed {UserProgress.AnswerRandomizationSeed}",
                userProgress.AnswerRandomizationSeed);
            foreach (var question in assessmentModuleVersionDto.Questions)
            {
                question.Answers = ShuffleList(
                    question.Answers, 
                    userProgress.AnswerRandomizationSeed.Value);
            }
        }
        
        // Every answer for the free-text question is always correct
        // We need to clear out the answers to refrain from showing them to the user
        assessmentModuleVersionDto.Questions.ForEach(q =>
        {
            if (q.Type == QuestionType.FreeText)
            {
                q.Answers.Clear();
            }
        });
        
        // Add server-calculated time remaining to prevent client-side clock manipulation
        assessmentModuleVersionDto.TimeRemaining = userProgress.TimeRemaining;
        
        return Response<ExamTakerModuleVersionDto, GenericOperationStatuses>.Success(
            assessmentModuleVersionDto, 
            GenericOperationStatuses.Completed);
    }

    /// inheritdoc <see cref="ISessionService.GetGroupStateAsync"/>/>
    public async Task<Response<GroupStateDto, GenericOperationStatuses>> GetGroupStateAsync(
        string userId, 
        Guid assignmentId, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Getting group state request received");
        
        var examTakerAssignment = await dbContext.ExamTakerAssignments
            .AsNoTracking()
            .Where(ea => ea.AssignmentId == assignmentId && ea.ExamTakerId == userId)
            .AsQueryable()
            .Include(ea => ea.Assignment)
                .ThenInclude(a => a.Group)
                    .ThenInclude(g => g!.GroupMemberEntities)
            .FirstOrDefaultAsync(cancellationToken);
        
        if (examTakerAssignment is null)
        {
            logger.LogInformation("Assignment {AssignmentId} not found for user {UserId}.",
                assignmentId, 
                userId);
            return Response<GroupStateDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment {assignmentId} not found for user {userId}.");
        }
        
        var groupId = examTakerAssignment.Assignment.GroupId;
        var groupResponse = await groupService.GetGroupAsync(groupId, cancellationToken);
        
        if (groupResponse.IsFailed)
        {
            return Response<GroupStateDto, GenericOperationStatuses>.Failure(
                groupResponse.Status,
                groupResponse.Message, 
                groupResponse.Errors);
        }
        
        var userProgress = await dbContext.ModuleProgress
            .Where(mp => mp.ExamTakerId == userId &&
                         mp.ExamTakerAssignmentId == examTakerAssignment.Id &&
                         mp.GroupMember.GroupId == groupId)
            .Include(mp => mp.QuestionResponses)
            .Include(mp => mp.GroupMember)
            .Include(moduleProgressEntity => moduleProgressEntity.AssessmentModuleVersion)
                .ThenInclude(assessmentModuleVersionEntity => assessmentModuleVersionEntity.Questions)
            .ToListAsync(cancellationToken);

        var groupMemberStates = groupResponse.Data!.GroupMembers
            .Select(g =>
            {
                var progress = userProgress.FirstOrDefault(up => up.GroupMemberId == g.Id);
                var status = GetModuleStatus(userProgress, g, groupResponse.Data);
                var showScore = examTakerAssignment.Assignment.ShowResultsImmediately 
                                && status is ModuleStatus.Completed or ModuleStatus.TimeElapsed;
                
                return new GroupMemberStateDto
                {
                    Id = g.Id,
                    GroupId = g.GroupId,
                    OrderNumber = g.OrderNumber,
                    AssessmentModuleId = g.AssessmentModuleId,
                    AssessmentModuleTitle = g.AssessmentModuleTitle,
                    AssessmentModuleDescription = g.AssessmentModuleDescription,
                    StaticFileUrls = g.StaticFileUrls ?? [],
                    StartedAtUtc = progress?.StartedAtUtc,
                    CompletedAtUtc = progress?.CompletedAtUtc,
                    DurationInMinutes = progress?.DurationInMinutes,
                    TimeRemaining = progress?.TimeRemaining,
                    Status = status,
                    Passed = showScore ? progress?.Passed : null,
                    PassingScorePercentage = showScore ? progress?.PassingScorePercentage : null,
                    ScorePercentage = showScore ? progress?.ScorePercentage : null,
                };
            })
            .ToHashSet();
        
        var groupStateDto = new GroupStateDto
        {
            Id = groupResponse.Data.Id,
            Title = groupResponse.Data.Title,
            Description = groupResponse.Data.Description,
            IsMemberOrderLocked = groupResponse.Data.IsMemberOrderLocked,
            WaitModuleCompletion = groupResponse.Data.WaitModuleCompletion,
            GroupMembers = groupMemberStates
        };
        
        return Response<GroupStateDto, GenericOperationStatuses>.Success(
            groupStateDto,
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="ISessionService.SubmitAnswerAsync"/>
    public async Task<Response<GenericOperationStatuses>> SubmitAnswerAsync(
        Guid userProgressId, 
        QuestionResponseOperationDto dto, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Submitting answer request received");
        Guard.AgainstNull(dto, nameof(dto));

        var userProgress = await dbContext.ModuleProgress
            .Where(mp => mp.Id == userProgressId)
            .Include(mp => mp.QuestionResponses)
            .FirstOrDefaultAsync(cancellationToken);

        if (userProgress is null)
        {
            logger.LogInformation("Module progress {UserProgressId} not found.", userProgressId);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Module progress {userProgressId} not found.");
        }
        
        if (userProgress.CompletedAtUtc != null)
        {
            logger.LogInformation("Module progress {UserProgressId} is already completed. No further answers can be submitted.",
                userProgressId);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Conflict,
                $"Module progress {userProgressId} is already completed. No further answers can be submitted.");
        }
        
        if (userProgress.StartedAtUtc!.Value.AddMinutes(userProgress.DurationInMinutes) < DateTime.UtcNow)
        {
            logger.LogInformation("Module progress {UserProgressId} has expired. No further answers can be submitted.",
                userProgressId);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Conflict,
                $"Module progress {userProgressId} has expired. No further answers can be submitted.");
        }
        
        var answerResponse = await questionService.CheckQuestionAnswerAsync(dto, cancellationToken);

        if (answerResponse.IsFailed)
        {
            return Response<GenericOperationStatuses>.Failure(
                answerResponse.Status,
                answerResponse.Message,
                answerResponse.Errors);
        }
        
        var existingResponse = userProgress.QuestionResponses
            .FirstOrDefault(qr => qr.QuestionId == dto.QuestionId);
        
        if (existingResponse != null)
        {
            // Update the existing response if the new selection is different or more complete
            if (existingResponse.QuestionType == QuestionType.FreeText &&
                existingResponse.TextResponse != dto.TextResponse)
            {
                logger.LogInformation("Submitting updated free-text answer for question {QuestionId} in progress {UserProgressId}.",
                    dto.QuestionId, 
                    userProgressId);
                existingResponse.TextResponse = dto.TextResponse;
                existingResponse.IsCorrect = answerResponse.Data;
                existingResponse.RespondedAtUtc = DateTime.UtcNow;
            }
            
            // Check if the selected answers have changed (for non-free-text questions)
            else if (!dto.SelectedAnswerIds.All(sa => existingResponse.SelectedAnswerIds.Contains(sa)) ||
                     !existingResponse.SelectedAnswerIds.All(sa => dto.SelectedAnswerIds.Contains(sa)))
            {
                logger.LogInformation("Submitting updated answer for question {QuestionId} in progress {UserProgressId}.",
                    dto.QuestionId, 
                    userProgressId);
                existingResponse.SelectedAnswerIds = dto.SelectedAnswerIds;
                existingResponse.IsCorrect = answerResponse.Data;
                existingResponse.TextResponse = dto.TextResponse;
                existingResponse.RespondedAtUtc = DateTime.UtcNow;
            }
        }
        // No existing response, create a new one
        else
        {
            logger.LogInformation("Submitting new answer for question {QuestionId} in progress {UserProgressId}.",
                dto.QuestionId, 
                userProgressId);
            var newResponse = new QuestionResponseEntity
            {
                QuestionId = dto.QuestionId,
                QuestionType = dto.QuestionType,
                ModuleProgressId = userProgress.Id,
                SelectedAnswerIds = dto.SelectedAnswerIds,
                IsCorrect = answerResponse.Data,
                TextResponse = dto.TextResponse ?? string.Empty,
                RespondedAtUtc = DateTime.UtcNow,
            };
            await dbContext.QuestionResponses.AddAsync(newResponse, cancellationToken);
        }
        
        await dbContext.SaveChangesAsync(cancellationToken);
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            "Answer submitted successfully.");
    }

    /// <inheritdoc cref="ISessionService.CompleteModuleAsync"/>
    public async Task<Response<GenericOperationStatuses>> CompleteModuleAsync(
        Guid userProgressId, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Submitting module progress request received");
        var userProgress = await dbContext.ModuleProgress
            .Where(mp => mp.Id == userProgressId)
            .FirstOrDefaultAsync(cancellationToken);

        if (userProgress is null)
        {
            logger.LogInformation("Module progress {UserProgressId} not found.", userProgressId);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Module progress {userProgressId} not found.");
        }

        if (userProgress.StartedAtUtc!.Value.AddMinutes(userProgress.DurationInMinutes) < DateTime.UtcNow)
        {
            logger.LogWarning("Module progress {UserProgressId} has expired and cannot be completed.",
                userProgressId);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Conflict,
                $"Module progress {userProgressId} has expired and cannot be completed.");
        }
        
        userProgress.CompletedAtUtc = DateTime.UtcNow;
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Module progress {UserProgressId} marked as completed.", userProgressId);
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            "Module marked as completed successfully.");
    }

    /// <summary>
    /// This method determines the status of a module for a user based on their progress and the group's settings.
    /// </summary>
    /// <param name="userProgress">User Progress <see cref="ModuleProgressEntity"/></param>
    /// <param name="groupMemberDto">Group Member <see cref="GroupMemberDto"/></param>
    /// <param name="group">Group Model <see cref="GroupDto"/></param>
    /// <returns>Returns computed status <seealso cref="ModuleStatus"/></returns>
    private static ModuleStatus GetModuleStatus(
        List<ModuleProgressEntity> userProgress, 
        GroupMemberDto groupMemberDto,
        GroupDto group)
    {
        // 1. Check if user has progress for this module
        var progress = userProgress.FirstOrDefault(gm => gm.GroupMemberId == groupMemberDto.Id);

        // 2. If completed, check if we need to wait for duration to elapse
        if (progress?.CompletedAtUtc != null)
        {
            // If WaitModuleCompletion is enabled and this module's time hasn't elapsed
            if (group.WaitModuleCompletion && progress.StartedAtUtc != null)
            {
                var moduleEndTime = progress.StartedAtUtc.Value.AddMinutes(progress.DurationInMinutes);
                if (moduleEndTime > DateTime.UtcNow)
                {
                    return ModuleStatus.WaitForModuleDurationToElapse;
                }
            }
            return ModuleStatus.Completed;
        }

        // 3. If started but not completed, check time elapsed FIRST (TimeElapsed takes precedence over locking)
        if (progress?.HasStarted == true)
        {
            if (progress.StartedAtUtc?.AddMinutes(progress.DurationInMinutes) < DateTime.UtcNow)
            {
                return ModuleStatus.TimeElapsed; // Return TimeElapsed regardless of other modules
            }
            // If still in progress, continue to check locking rules for WaitModuleCompletion
        }

        // 4. If WaitModuleCompletion is enabled, check if any other module is currently in progress
        var inProgressModule = userProgress.Any(up => 
            up.Id != progress?.Id && 
            up.StartedAtUtc?.AddMinutes(up.DurationInMinutes) > DateTime.UtcNow);
        if (group.WaitModuleCompletion)
        {
            if (inProgressModule)
            {
                return ModuleStatus.Locked;
            }
        }

        // 5. If we reach here and the module was started, it must still be in progress
        if (progress?.HasStarted == true)
        {
            return ModuleStatus.InProgress;
        }

        // 6. If module lock is not enabled or the order number is 1 and WaitModuleCompletion is not enabled
        //    the module can be started
        if ((!group.IsMemberOrderLocked || groupMemberDto.OrderNumber == 1) && !group.WaitModuleCompletion)
        {
            return ModuleStatus.NotStarted;
        }

        // 7. Check previous module for order-locked groups
        //    7.1. If there is no previous member and WaitModuleCompletion is enabled and there is no in progress module
        //       the module is NotStarted, otherwise it is Locked   
        var previousMember = group.GroupMembers
            .FirstOrDefault(gm => gm.OrderNumber == groupMemberDto.OrderNumber - 1);
        if (previousMember is null)
        {
            if (group.WaitModuleCompletion && !inProgressModule)
            {
                return ModuleStatus.NotStarted;
            }
            return ModuleStatus.Locked;
        }

        // 8. For order-locked groups, we MUST check the previous module first
        //    8.1. If there is no progress for the previous member, return Locked
        var previousMemberProgress = userProgress
            .FirstOrDefault(gm => gm.GroupMemberId == previousMember.Id);
        if (previousMemberProgress is null && group.IsMemberOrderLocked)
        {
            return ModuleStatus.Locked;
        }
        
        // 9. Check if the previous module is finished (completed OR time elapsed)
        var previousModuleEndTime = previousMemberProgress?
            .StartedAtUtc?
            .AddMinutes(previousMemberProgress.DurationInMinutes);
        
        var previousModuleIsFinished = previousMemberProgress?.CompletedAtUtc != null || 
                                      (previousMemberProgress?.StartedAtUtc != null && previousModuleEndTime <= DateTime.UtcNow);
        
        // 9.1. If the previous module is completed, but we need to wait for duration to elapse
        if (group.WaitModuleCompletion && 
            previousMemberProgress?.CompletedAtUtc != null && 
            previousModuleEndTime > DateTime.UtcNow)
        {
            return ModuleStatus.WaitForModuleDurationToElapse;
        }

        // 10. For order-locked groups, if the previous module is not finished, return Locked
        if (group.IsMemberOrderLocked && !previousModuleIsFinished)
        {
            return ModuleStatus.Locked;
        }

        // 11. If we need to wait for module completion and there is no in-progress module, return NotStarted
        if (group.WaitModuleCompletion && !inProgressModule)
        {
            return ModuleStatus.NotStarted;
        }

        // 12. The previous module is finished (completed or time elapsed), this module can start
        return ModuleStatus.NotStarted;
    }
    
    /// <summary>
    /// This method shuffles a list based on a provided GUID seed.
    /// The same seed will always produce the same order.
    /// </summary>
    /// <param name="list">Source list</param>
    /// <param name="seed">Seed</param>
    /// <typeparam name="T">The resource type <see cref="T"/></typeparam>
    /// <returns>Returns a shuffled list</returns>
    private List<T> ShuffleList<T>(List<T> list, Guid seed)
    {
        var seedBytes = seed.ToByteArray();
        var random = new Random(BitConverter.ToInt32(seedBytes, 0));

        return list
            .OrderBy(o => random.Next())
            .ToList();
    }
}