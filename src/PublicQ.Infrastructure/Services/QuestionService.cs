using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;
using PublicQ.Application.Models.Session;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities.Module;
using PublicQ.Shared;
using PublicQ.Shared.Enums;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// Represents a service for managing module's questions.
/// </summary>
public class QuestionService(ApplicationDbContext dbContext, ILogger<QuestionService> logger) : IQuestionService
{
     /// <inheritdoc />
    /// <remarks>
    /// This method creates a new question for a specific module version.
    /// On this stage user should have already created a module version and preloaded it with static files.
    /// This method will fetch associated static files from the database and associate them with the question
    /// and answers.
    /// </remarks>
    public async Task<Response<QuestionDto, GenericOperationStatuses>> CreateQuestionAsync(
        QuestionCreateDto createDto,
        CancellationToken cancellationToken)
    {
        logger.LogDebug(
            "Create Question request received for Module Version ID: {ModuleVersionId} with DTO: {@CreateDto}",
            createDto.ModuleVersionId, createDto);
        Guard.AgainstNull(createDto, nameof(createDto));

        if (createDto.ModuleVersionId.Equals(Guid.Empty))
        {
            logger.LogWarning("Unable to create a question because Module Version ID is empty.");
            return Response<QuestionDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Module version ID cannot be empty.");
        }

        var moduleVersion = await dbContext.AssessmentModuleVersions.Where(m => m.Id == createDto.ModuleVersionId)
            .AsNoTracking()
            .Include(m => m.AssessmentModule)
            .FirstOrDefaultAsync(cancellationToken);
        
        if (moduleVersion == null)
        {
            logger.LogWarning("Module Version with ID: {ModuleVersionId} not found", createDto.ModuleVersionId);
            return Response<QuestionDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.NotFound, $"Module version with ID: '{createDto.ModuleVersionId}' not found.");
        }

        if (moduleVersion.IsPublished)
        {
            return Response<QuestionDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Conflict, 
                "Cannot create a question for a published module version. Please create a new version first.");
        }

        // Ensure the module version is associated with the correct module
        logger.LogDebug("Retrieving static files for Module ID: {ModuleId}", createDto.ModuleId);
        var staticFileEntities = await dbContext.StaticFiles
            .Where(f => f.AssessmentModuleId == createDto.ModuleId)
            .ToListAsync(cancellationToken);
        
        var fileValidationResult = VerifyAttachedFiles(createDto, staticFileEntities);
        if (fileValidationResult.IsFailed)
        {
            return Response<QuestionDto, GenericOperationStatuses>.Failure(
                fileValidationResult.Status, 
                fileValidationResult.Message, 
                fileValidationResult.Errors);
        }

        logger.LogDebug("Assembling QuestionEntity from DTO: {@CreateDto}", createDto);
        var questionEntity = new QuestionEntity
        {
            Order = createDto.Order,
            Text = createDto.Text,
            Type = createDto.Type,
            AssessmentModuleVersionId = createDto.ModuleVersionId,
            // Let's attach static files directly to the question
            AssociatedStaticFiles = staticFileEntities
                .Where(f => createDto.StaticFileIds.Contains(f.Id))
                .ToList()
        };
        
        logger.LogDebug("Assembling possible answers: {@Answers}", createDto.Answers);
        var possibleAnswers = createDto.Answers.Select(a => new PossibleAnswerEntity
            {
                Question = questionEntity,
                Order = a.Order,
                Text = a.Text,
                IsCorrect = a.IsCorrect,
                // Now we associate static files directly with the answer
                AssociatedStaticFiles = staticFileEntities
                    .Where(f => a.StaticFileIds.Contains(f.Id))
                    .ToList()
            })
            .ToList();

        questionEntity.PossibleAnswers = possibleAnswers;

        var entityToCreate = await dbContext
            .AssessmentQuestions
            .AddAsync(questionEntity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogDebug("Question created successfully with ID: {QuestionId}", entityToCreate.Entity.Id);

        return Response<QuestionDto, GenericOperationStatuses>.Success(
            entityToCreate.Entity.ConvertToDto(),
            GenericOperationStatuses.Completed,
            $"Question created successfully. Question ID: '{entityToCreate.Entity.Id}'");
    }

    /// <inheritdoc />
    public async Task<Response<QuestionDto, GenericOperationStatuses>> DeleteQuestionAsync(
        Guid questionId,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Delete Question request received for ID: {QuestionId}", questionId);
        if (questionId == Guid.Empty)
        {
            logger.LogWarning("Unable to delete question because Question ID is empty.");
            return Response<QuestionDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Question ID cannot be empty.");
        }

        var questionEntity = await dbContext
            .AssessmentQuestions
            .FirstOrDefaultAsync(q => q.Id == questionId, cancellationToken);

        if (questionEntity == null)
        {
            logger.LogWarning("Question with ID: {QuestionId} not found", questionId);
            return Response<QuestionDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.NotFound, $"Question with ID: '{questionId}' not found.");
        }

        dbContext.AssessmentQuestions.Remove(questionEntity);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogDebug("Question with ID: {QuestionId} deleted successfully", questionId);
        return Response<QuestionDto, GenericOperationStatuses>
            .Success(questionEntity.ConvertToDto(), GenericOperationStatuses.Completed,
                $"Question with ID: '{questionId}' deleted successfully.");
    }

    /// <inheritdoc />
    public async Task<Response<QuestionDto, GenericOperationStatuses>> UpdateQuestionAsync(
        QuestionUpdateDto updateDto,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Update Question request received with DTO: {@UpdateDto}", updateDto);
        Guard.AgainstNull(updateDto, nameof(updateDto));
        
        // TODO: The heavy query below can be optimized by changing replace method to a patch.
        // That means that we will not load all the question entity with its possible answers and static files,
        // but rather update only the fields that are provided in the DTO.
        var questionEntity = await dbContext
            .AssessmentQuestions
            .Include(q => q.AssociatedStaticFiles)
            .Include(q => q.PossibleAnswers.OrderBy(a => a.Order))
                .ThenInclude(pa => pa.AssociatedStaticFiles)
            .Include(questionEntity => questionEntity.AssessmentModuleVersion)
            .FirstOrDefaultAsync(q => q.Id == updateDto.Id, cancellationToken);

        if (questionEntity == null)
        {
            logger.LogWarning("Update question with ID: {QuestionId} operation failed. Question has not been found", updateDto.Id);
            return Response<QuestionDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.NotFound, $"Question with ID: '{updateDto.Id}' not found.");
        }
        
        if (questionEntity.AssessmentModuleVersion.IsPublished)
        {
            logger.LogWarning("Cannot update a question with ID: {QuestionId} for a published module version with ID: {VersionId}. Please create a new version first.",
                questionEntity.Id,
                questionEntity.AssessmentModuleVersionId);
            return Response<QuestionDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.Conflict, $"Cannot update a question for a published {questionEntity.AssessmentModuleVersionId} module version. Please create a new version first.");
        }

        var questionAttachmentResult = await ReattachQuestionStaticFilesAsync(
            updateDto, 
            questionEntity, 
            cancellationToken);
        
        if (questionAttachmentResult.IsFailed)
        {
            return Response<QuestionDto, GenericOperationStatuses>.Failure(
                questionAttachmentResult.Status,
                questionAttachmentResult.Message,
                questionAttachmentResult.Errors);
        }

        var answerAttachmentResult = await ReattachAnswersAsync(
            updateDto, 
            questionEntity, 
            cancellationToken);

        if (answerAttachmentResult.IsFailed)
        {
            return Response<QuestionDto, GenericOperationStatuses>.Failure(
                answerAttachmentResult.Status,
                answerAttachmentResult.Message,
                answerAttachmentResult.Errors);
        }
        
        // Update question text and type
        questionEntity.Text = updateDto.Text;
        questionEntity.Type = updateDto.Type;

        await dbContext.SaveChangesAsync(cancellationToken);
        
        logger.LogDebug("Question with ID: {QuestionId} has been updated", questionEntity.Id);

        return Response<QuestionDto, GenericOperationStatuses>.Success(
            questionEntity.ConvertToDto(),
            GenericOperationStatuses.Completed,
            $"Question with ID: '{questionEntity.Id}' updated successfully.");
    }

    /// <inheritdoc cref="IQuestionService.CheckQuestionAnswerAsync"/>
    public async Task<Response<bool, GenericOperationStatuses>> CheckQuestionAnswerAsync(
        QuestionResponseOperationDto responseOperationDto,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Check Question Answer request received for Question with DTO: {@ResponseCreateDto}",
            responseOperationDto);
        var questionId = responseOperationDto.QuestionId;
        
        var questionEntity = await dbContext
            .AssessmentQuestions
            .AsNoTracking()
            .Include(q => q.PossibleAnswers)
            .FirstOrDefaultAsync(q => q.Id == questionId, cancellationToken);

        if (questionEntity == null)
        {
            logger.LogWarning("Question with ID: {QuestionId} not found", questionId);
            return Response<bool, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound, 
                $"Question with ID: '{questionId}' not found.");
        }

        // Check if the provided answers belong to the question
        // For FreeText questions, we skip this check as there are no predefined answers
        if (questionEntity.Type != QuestionType.FreeText && 
            !responseOperationDto.SelectedAnswerIds.Any(sa => questionEntity.PossibleAnswers.Select(a => a.Id).Contains(sa)))
        {
            logger.LogWarning("One or more selected answer IDs do not belong to Question ID: {QuestionId}", questionId);
            return Response<bool, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest, 
                "One or more selected answer IDs do not belong to the specified question.");
        }
        
        if (questionEntity.Type == QuestionType.FreeText)
        {
            var isCorrect = questionEntity.PossibleAnswers
                .Any(a => a.Text.Equals(responseOperationDto.TextResponse, StringComparison.OrdinalIgnoreCase) && a.IsCorrect);
            return Response<bool, GenericOperationStatuses>.Success(
                isCorrect, 
                GenericOperationStatuses.Completed, 
                isCorrect ? "The provided free text answer is correct." : "The provided free text answer is incorrect.");
        }
        
        if (questionEntity.Type == QuestionType.SingleChoice)
        {
            var selectedAnswerId = responseOperationDto.SelectedAnswerIds.First();
            var isCorrect = questionEntity.PossibleAnswers
                .Any(a => a.Id == selectedAnswerId && a.IsCorrect);
            return Response<bool, GenericOperationStatuses>.Success(
                isCorrect, 
                GenericOperationStatuses.Completed, 
                isCorrect ? "The selected answer is correct." : "The selected answer is incorrect.");
        }

        if (questionEntity.Type == QuestionType.MultipleChoice)
        {
            var correctAnswerIds = questionEntity.PossibleAnswers
                .Where(a => a.IsCorrect)
                .Select(a => a.Id)
                .ToHashSet();
            var selectedAnswerIds = responseOperationDto.SelectedAnswerIds.ToHashSet();

            var isCorrect = correctAnswerIds.SetEquals(selectedAnswerIds);
            return Response<bool, GenericOperationStatuses>.Success(
                isCorrect, 
                GenericOperationStatuses.Completed, 
                isCorrect ? "The selected answers are correct." : "The selected answers are incorrect.");
        }
        
        logger.LogWarning("Unsupported question type: {QuestionType} for Question ID: {QuestionId}", 
            questionEntity.Type, 
            questionId);
        
        return Response<bool, GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed,
            $"Unsupported question type: {questionEntity.Type}.");
    }

    /// <inheritdoc cref="IQuestionService.GetQuestionCountAsync"/>
    public async Task<Response<long, GenericOperationStatuses>> GetQuestionCountAsync(CancellationToken cancellationToken)
    {
        logger.LogDebug("Get Question Count request received");
        var latestVersionIds = await dbContext
            .AssessmentModuleVersions
            .Where(v => v.IsPublished)
            .GroupBy(v => v.AssessmentModuleId)
            .Select(g => g.OrderByDescending(v => v.Version).First().Id)
            .ToListAsync(cancellationToken);

        var questionCount = await dbContext
            .AssessmentQuestions
            .Where(q => latestVersionIds.Contains(q.AssessmentModuleVersionId))
            .LongCountAsync(cancellationToken);
        
        return Response<long, GenericOperationStatuses>.Success(questionCount, 
            GenericOperationStatuses.Completed);
    }

    /// <summary>
    /// Verifies that all static files attached to the question and its answers
    /// If they are not found in the module's static files collection,
    /// then it returns a failure response with appropriate error messages.
    /// </summary>
    /// <param name="createDto"><see cref="QuestionCreateDto"/></param>
    /// <param name="staticFileEntities">An array of <see cref="StaticFileEntity"/></param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    private Response<GenericOperationStatuses> VerifyAttachedFiles(QuestionCreateDto createDto, List<StaticFileEntity> staticFileEntities)
    {
        var errorMessages = new List<string>();
        foreach (var staticFileEntity in createDto.StaticFileIds)
        {
            if (staticFileEntities.All(f => f.Id != staticFileEntity))
            {
                logger.LogWarning("Static file attached to question with ID: '{StaticFileId}' not found in module with ID: '{ModuleId}'",
                    staticFileEntity, createDto.ModuleId);
                errorMessages.Add($"Static file attached to question with ID: '{staticFileEntity}' not found in module with ID: '{createDto.ModuleId}'.");
            }
        }
        
        foreach (var answer in createDto.Answers)
        {
            foreach (var staticFileId in answer.StaticFileIds)
            {
                if (staticFileEntities.All(f => f.Id != staticFileId))
                {
                    logger.LogWarning("Static file attached to answers with ID: '{StaticFileId}' not found in module with ID: '{ModuleId}'",
                        staticFileId, createDto.ModuleId);
                    errorMessages.Add($"Static file attached to answers with ID: '{staticFileId}' not found in module with ID: '{createDto.ModuleId}'.");
                }
            }
        }
        
        if (errorMessages.Count > 0)
        {
            logger.LogWarning("Failed to create question due to missing static files: {@Errors}", errorMessages);
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "One or more static files are not associated with the module.", errorMessages);
        }

        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed, 
            "All static files are valid and associated with the module.");
    }
    
    /// <summary>
    /// Reattaches answers to the question entity.
    /// </summary>
    /// <param name="updateDto"><see cref="QuestionUpdateDto"/></param>
    /// <param name="questionEntity">Db entity</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns><see cref="GenericOperationStatuses"/></returns>
    private async Task<Response<GenericOperationStatuses>> ReattachAnswersAsync(
        QuestionUpdateDto updateDto,
        QuestionEntity questionEntity,
        CancellationToken cancellationToken)
    {
        // Re-attach possible answers and their static files
        logger.LogDebug("Assembling possible answers: {@Answers}", updateDto.Answers);
        
        // Check if there are any static files associated with the answers
        var answerStaticFileIds = updateDto
            .Answers
            .Select(a => a.StaticFileIds)
            .SelectMany(ids => ids)
            .Distinct()
            .ToHashSet();
        
        var answerStaticFiles = new List<StaticFileEntity>();
        if (answerStaticFileIds.Count > 0)
        {
            answerStaticFiles = await dbContext
                .StaticFiles
                .Where(f => answerStaticFileIds.Contains(f.Id))
                .ToListAsync(cancellationToken);
        }

        if (answerStaticFileIds.Count != answerStaticFiles.Count)
        {
            logger.LogWarning("Not all static files found for answers in Question ID: {QuestionId}. Expected: {ExpectedCount}, Found: {FoundCount}",
                updateDto.Id, 
                answerStaticFileIds.Count,
                answerStaticFiles.Count);

            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.Failed,"One or more static files not found for the question answers.");
        }
        
        var possibleAnswers = updateDto.Answers
            .Select(a => new PossibleAnswerEntity
            {
                Question = questionEntity,
                Order = a.Order,
                Text = a.Text,
                IsCorrect = a.IsCorrect,
                // Now we associate static files directly with the answer
                AssociatedStaticFiles = answerStaticFiles?
                    .Where(f => a.StaticFileIds.Contains(f.Id))
                    .ToList() ?? []
            })
            .ToList();
        
        questionEntity.PossibleAnswers.Clear();
            
        // Add new possible answers to the question
        await dbContext
            .AssessmentPossibleAnswers
            .AddRangeAsync(possibleAnswers, cancellationToken);
        questionEntity.PossibleAnswers = possibleAnswers;
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed);
    }

    /// <summary>
    /// Attaches static files to the question entity.
    /// </summary>
    /// <param name="updateDto"><see cref="QuestionUpdateDto"/></param>
    /// <param name="questionEntity">Db entity</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns><see cref="GenericOperationStatuses"/></returns>
    private async Task<Response<GenericOperationStatuses>> ReattachQuestionStaticFilesAsync(
        QuestionUpdateDto updateDto,
        QuestionEntity questionEntity,
        CancellationToken cancellationToken)
    {
        // Verify and re-attach static files if provided
        List<StaticFileEntity>? questionStaticFiles = [];
        if (updateDto.StaticFileIds is { Count: > 0 })
        {
            logger.LogDebug("Updating static files for Question ID: {QuestionId} with Static File IDs: {@StaticFileIds}",
                updateDto.Id, updateDto.StaticFileIds);
            
            questionStaticFiles = await dbContext
                .StaticFiles
                .Where(f => updateDto.StaticFileIds.Contains(f.Id))
                .ToListAsync(cancellationToken);
            
            if (questionStaticFiles.Count != updateDto.StaticFileIds.Count)
            {
                logger.LogWarning("Not all static files found for Question ID: {QuestionId}. Expected: {ExpectedCount}, Found: {FoundCount}",
                    updateDto.Id, 
                    updateDto.StaticFileIds.Count,
                    questionStaticFiles.Count);
                return Response<GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    "One or more static files not found for the question.");
            }
            
            foreach (var staticFile in questionStaticFiles)
            {
                if (staticFile.AssessmentModuleId != questionEntity.AssessmentModuleVersion.AssessmentModuleId)
                {
                    logger.LogWarning("Static file with ID: {StaticFileId} is not associated with Module ID: {ModuleId}",
                        staticFile.Id, 
                        questionEntity.AssessmentModuleVersion.AssessmentModuleId);
                    return Response<GenericOperationStatuses>
                        .Failure(GenericOperationStatuses.BadRequest,
                            $"Static file with ID: '{staticFile.Id}' is not associated with the module '{questionEntity.AssessmentModuleVersion.AssessmentModuleId}'.");
                }
            }
        }
        
        questionEntity.AssociatedStaticFiles.Clear();
        questionEntity.AssociatedStaticFiles = questionStaticFiles;
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed);
    }
}