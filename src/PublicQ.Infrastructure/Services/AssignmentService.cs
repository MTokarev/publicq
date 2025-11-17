using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Assignment;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities.Assignment;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// Implementation of the assignment service.
/// <seealso cref="IAssignmentService"/>
/// </summary>
public class AssignmentService(
    ApplicationDbContext dbContext,
    IOptionsMonitor<AssignmentServiceOptions> options,
    ILogger<AssignmentService> logger) : IAssignmentService
{
    /// <inheritdoc cref="IAssignmentService.CreateAsync"/>
    public async Task<Response<AssignmentDto, GenericOperationStatuses>> CreateAsync(
        string createdByUserId,
        AssignmentCreateDto assignmentCreateDto,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Create new assignment request received");
        Guard.AgainstNull(assignmentCreateDto, nameof(assignmentCreateDto));
        Guard.AgainstNullOrWhiteSpace(createdByUserId, nameof(createdByUserId));

        var assignmentWithSameTitleExists = await dbContext.Assignments
            .AnyAsync(a => a.NormalizedTitle == assignmentCreateDto.Title.ToUpperInvariant(), cancellationToken);
        if (assignmentWithSameTitleExists)
        {
            logger.LogWarning("Create assignment failed. Assignment with title {Title} already exists",
                assignmentCreateDto.Title);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"Assignment with title '{assignmentCreateDto.Title}' already exists");
        }

        var groupExistWithAtLeastOneMember = await dbContext.Groups
            .AnyAsync(g => g.Id == assignmentCreateDto.GroupId && 
                             g.GroupMemberEntities.Count != 0, cancellationToken);
        
        if (!groupExistWithAtLeastOneMember)
        {
            logger.LogWarning("Create assignment failed. No group found with id {GroupId} or it has no members",
                assignmentCreateDto.GroupId);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                $"Group with id '{assignmentCreateDto.GroupId}' not found or it has no members");
        }
        
        if (assignmentCreateDto.ExamTakerIds.Count > 0)
        {
            var validationResponse = await GetValidatedExamTakersAsync(assignmentCreateDto.ExamTakerIds, cancellationToken);
            if (validationResponse.IsFailed)
            {
                return Response<AssignmentDto, GenericOperationStatuses>.Failure(
                    validationResponse.Status,
                    validationResponse.Message,
                    validationResponse.Errors);
            }
        }

        // Start transaction for atomic operation
        await using var transaction = await dbContext.Database.BeginTransactionAsync(cancellationToken);
        var nowUtc = DateTime.UtcNow;
        try
        {
            var assignmentToCreate = new AssignmentEntity
            {
                GroupId = assignmentCreateDto.GroupId,
                Title = assignmentCreateDto.Title,
                NormalizedTitle = assignmentCreateDto.Title.ToUpperInvariant(),
                Description = assignmentCreateDto.Description,
                IsPublished = false,
                StartDateUtc = assignmentCreateDto.StartDateUtc,
                EndDateUtc = assignmentCreateDto.EndDateUtc,
                CreatedAtUtc = nowUtc,
                CreatedByUser = createdByUserId,
                RandomizeQuestions = assignmentCreateDto.RandomizeQuestions,
                RandomizeAnswers = assignmentCreateDto.RandomizeAnswers,
                ShowResultsImmediately = assignmentCreateDto.ShowResultsImmediately
            };

            logger.LogDebug("Adding new assignment to the database: {@AssignmentEntity}", assignmentToCreate);
            logger.LogInformation(
                "Adding new assignment to the database for {GroupId} group id. Created by {CreatedBy}",
                assignmentToCreate.GroupId,
                assignmentToCreate.CreatedByUser);

            var response = await dbContext.Assignments
                .AddAsync(assignmentToCreate, cancellationToken);
            await dbContext.SaveChangesAsync(cancellationToken);

            logger.LogInformation("New assignment added to the database with id {AssignmentId}", response.Entity.Id);

            // Create exam taker assignments within the same transaction
            var examTakerAssignmentsToCreate = assignmentCreateDto
                .ExamTakerIds
                .Select(id => new ExamTakerAssignmentEntity
                {
                    AssignmentId = response.Entity.Id,
                    ExamTakerId = id,
                }).ToList();

            if (examTakerAssignmentsToCreate.Count > 0)
            {
                logger.LogDebug("Adding {Count} exam taker assignments to the database",
                    examTakerAssignmentsToCreate.Count);

                await dbContext.ExamTakerAssignments.AddRangeAsync(examTakerAssignmentsToCreate, cancellationToken);
                await dbContext.SaveChangesAsync(cancellationToken);

                logger.LogInformation("Added {Count} exam taker assignments to the database",
                    examTakerAssignmentsToCreate.Count);
            }
            else
            {
                logger.LogDebug("No exam taker assignments to add to the database");
            }

            // Commit transaction - all operations succeeded
            await transaction.CommitAsync(cancellationToken);

            logger.LogInformation(
                "Assignment creation transaction completed successfully for assignment {AssignmentId}",
                response.Entity.Id);

            return Response<AssignmentDto, GenericOperationStatuses>.Success(
                response.Entity.ConvertToDto(),
                GenericOperationStatuses.Completed,
                "Assignment created successfully");
        }
        catch (Exception ex)
        {
            // Rollback transaction on any error
            await transaction.RollbackAsync(cancellationToken);

            logger.LogError(ex, "Failed to create assignment. Transaction rolled back.");

            return Response<AssignmentDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                "Failed to create assignment");
        }
    }
    
    /// <inheritdoc cref="IAssignmentService.GetByIdAsync"/>
    public async Task<Response<AssignmentDto, GenericOperationStatuses>> GetByIdAsync(Guid assignmentId,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Get assignment request received for {AssignmentId}", assignmentId);

        var assignment = await dbContext.Assignments
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (assignment is null)
        {
            logger.LogWarning("Get assignment failed. No assignment found with id {AssignmentId}", assignmentId);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment with id '{assignmentId}' not found");
        }

        logger.LogInformation("Assignment with id {AssignmentId} retrieved successfully", assignmentId);

        return Response<AssignmentDto, GenericOperationStatuses>.Success(
            assignment.ConvertToDto(),
            GenericOperationStatuses.Completed,
            "Assignment retrieved successfully");
    }

    /// <inheritdoc cref="IAssignmentService.UpdateAsync"/>
    public async Task<Response<AssignmentDto, GenericOperationStatuses>> UpdateAsync(
        AssignmentUpdateDto updateDto,
        string updatedByUser,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Update assignment request received");
        Guard.AgainstNull(updateDto, nameof(updateDto));
        Guard.AgainstNullOrWhiteSpace(updatedByUser, nameof(updatedByUser));

        var assignmentToUpdate = await dbContext.Assignments
            .FindAsync([updateDto.Id], cancellationToken);

        if (assignmentToUpdate is null)
        {
            logger.LogWarning("Update failed. No assignment found with id {AssignmentId}", updateDto.Id);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment with id '{updateDto.Id}' not found");
        }

        if (!string.Equals(updateDto.Title.ToUpperInvariant(),
                assignmentToUpdate.NormalizedTitle,
                StringComparison.InvariantCultureIgnoreCase))
        {
            var assignmentWithSameTitleExists = await dbContext.Assignments
                .AnyAsync(a => a.NormalizedTitle == updateDto.Title.ToUpperInvariant(), cancellationToken);
            if (assignmentWithSameTitleExists)
            {
                logger.LogWarning("Create assignment failed. Assignment with title {Title} already exists",
                    updateDto.Title);
                return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                    $"Assignment with title '{updateDto.Title}' already exists");
            }
        }

        assignmentToUpdate.Title = updateDto.Title;
        assignmentToUpdate.Description = updateDto.Description;
        assignmentToUpdate.StartDateUtc = updateDto.StartDateUtc;
        assignmentToUpdate.EndDateUtc = updateDto.EndDateUtc;
        assignmentToUpdate.RandomizeQuestions = updateDto.RandomizeQuestions;
        assignmentToUpdate.RandomizeAnswers = updateDto.RandomizeAnswers;
        assignmentToUpdate.ShowResultsImmediately = updateDto.ShowResultsImmediately;
        assignmentToUpdate.UpdatedAtUtc = DateTime.UtcNow;
        assignmentToUpdate.UpdatedByUser = updatedByUser;

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Assignment with id {AssignmentId} successfully updated", updateDto.Id);
        
        var updatedAssignment = await dbContext.Assignments
            .AsNoTracking()
            .Include(x => x.ExamTakerAssignments)
            .Include(x => x.Group)
            .FirstOrDefaultAsync(a => a.Id == updateDto.Id, cancellationToken);

        if (updatedAssignment is null)
        {
            // This should not happen as we already checked existence
            logger.LogError("Unexpected error: Assignment with id {AssignmentId} not found after update", updateDto.Id);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed,
                $"Unexpected error: Assignment with id '{updateDto.Id}' not found after update");
        }
        
        return Response<AssignmentDto, GenericOperationStatuses>.Success(
            updatedAssignment.ConvertToDto(),
            GenericOperationStatuses.Completed,
            $"Assignment with ID '{assignmentToUpdate.Id}' updated successfully");
    }

    /// <inheritdoc cref="IAssignmentService.AddExamTakersAsync"/>
    public async Task<Response<AssignmentDto, GenericOperationStatuses>> AddExamTakersAsync(
        Guid assignmentId,
        HashSet<string> examTakerIds,
        string updatedByUser,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Adding exam takers request received");
        Guard.AgainstNullOrWhiteSpace(updatedByUser, nameof(updatedByUser));
        
        if (examTakerIds.Count == 0)
        {
            logger.LogWarning("No exam takers provided to add to assignment with id {AssignmentId}", assignmentId);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.BadRequest,
                "No exam takers provided to add");
        }
        
        var assignment = await dbContext.Assignments
            .FindAsync([assignmentId], cancellationToken);
        
        if (assignment is null)
        {
            logger.LogWarning("Add exam takers failed. No assignment found with id {AssignmentId}", assignmentId);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment with id '{assignmentId}' not found");
        }

        var existingAssignments = await dbContext.ExamTakerAssignments
            .LongCountAsync(eta => eta.AssignmentId == assignmentId && examTakerIds.Contains(eta.ExamTakerId),
                cancellationToken);

        if (existingAssignments > 0)
        {
            logger.LogWarning("Some exam takers are already assigned to assignment with id {AssignmentId}",
                assignmentId);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                "One or more exam takers are already assigned to this assignment");
        }

        var validatedExamTakersResponse = await GetValidatedExamTakersAsync(examTakerIds, cancellationToken);
        if (validatedExamTakersResponse.IsFailed)
        {
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(
                validatedExamTakersResponse.Status,
                validatedExamTakersResponse.Message,
                validatedExamTakersResponse.Errors);
        }

        var assignmentsToAdd = validatedExamTakersResponse.Data!
            .Select(et => new ExamTakerAssignmentEntity
            {
                AssignmentId = assignmentId,
                ExamTakerDisplayName = $"{et.FullName}" + 
                                       $"{(string.IsNullOrWhiteSpace(et.Email) ? string.Empty : $" ({et.Email})")}",
                ExamTakerId = et.Id
            }).ToList();

        logger.LogInformation("Adding {Count} exam takers to assignment with id {AssignmentId}",
            assignmentsToAdd.Count, assignmentId);
        
        assignment.UpdatedAtUtc = DateTime.UtcNow;
        assignment.UpdatedByUser = updatedByUser;
        
        await dbContext.ExamTakerAssignments.AddRangeAsync(assignmentsToAdd, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Assigned {Count} exam takers to assignment with id {AssignmentId}",
            assignmentsToAdd.Count,
            assignmentId);
        
        var updatedAssignment = await dbContext.Assignments
            .AsNoTracking()
            .Include(a => a.ExamTakerAssignments)
            .Include(a => a.Group)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);

        if (updatedAssignment is null)
        {
            // This should not happen as we already checked existence
            logger.LogError("Unexpected error: Assignment with id {AssignmentId} not found after adding exam takers",
                assignmentId);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed,
                $"Unexpected error: Assignment with id '{assignmentId}' not found after adding exam takers");
        }

        return Response<AssignmentDto, GenericOperationStatuses>.Success(
            updatedAssignment.ConvertToDto(),
            GenericOperationStatuses.Completed,
            $"Added {assignmentsToAdd.Count} exam takers to assignment with id '{assignmentId}' successfully");
    }

    /// <inheritdoc cref="IAssignmentService.GetExamTakersAsync"/>
    public async Task<Response<IList<User>, GenericOperationStatuses>> GetExamTakersAsync(
        Guid assignmentId, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Get exam takers for assignment request received");
        
        var assignment = await dbContext.Assignments
            .FindAsync([assignmentId], cancellationToken);

        if (assignment is null)
        {
            logger.LogWarning("Get exam takers failed. No assignment found with id {AssignmentId}", assignmentId);
            return Response<IList<User>, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment with id '{assignmentId}' not found");
        }
        
        var examTakerIds = await dbContext.ExamTakerAssignments
            .AsNoTracking()
            .Where(eta => eta.AssignmentId == assignmentId)
            .Select(eta => eta.ExamTakerId)
            .ToHashSetAsync(cancellationToken);

        if (examTakerIds.Count == 0)
        {
            logger.LogDebug("No exam takers assigned to assignment with id {AssignmentId}", assignmentId);
            return Response<IList<User>, GenericOperationStatuses>.Success(
                new List<User>(),
                GenericOperationStatuses.Completed,
                "No exam takers assigned to this assignment");
        }
        
        var combinedExamTakers = await GetExamTakersAsync(examTakerIds, cancellationToken);

        if (combinedExamTakers.Count == 0)
        {
            return Response<IList<User>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                "No exam takers found for this assignment");
        }
        
        logger.LogDebug("Found {Count} exam takers for assignment with id {AssignmentId}",
            combinedExamTakers.Count, assignmentId);
        
        return Response<IList<User>, GenericOperationStatuses>.Success(
            combinedExamTakers,
            GenericOperationStatuses.Completed,
            $"Found {combinedExamTakers.Count} exam takers for assignment with id '{assignmentId}'");
    }

    /// <inheritdoc cref="IAssignmentService.RemoveExamTakersAsync"/>
    public async Task<Response<AssignmentDto, GenericOperationStatuses>> RemoveExamTakersAsync(
        Guid assignmentId,
        HashSet<string> examTakerIds,
        string updatedByUser,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Removing exam takers request received");
        Guard.AgainstNullOrWhiteSpace(updatedByUser, nameof(updatedByUser));
        
        var assignment = await dbContext.Assignments
            .FindAsync([assignmentId], cancellationToken);

        if (assignment is null)
        {
            logger.LogWarning("Remove exam takers failed. No assignment found with id {AssignmentId}",
                assignmentId);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment with id '{assignmentId}' not found");
        }

        var assignmentsToRemove = await dbContext.ExamTakerAssignments
            .Where(eta => eta.AssignmentId == assignmentId && examTakerIds.Contains(eta.ExamTakerId))
            .ToListAsync(cancellationToken);

        if (assignmentsToRemove.Count == examTakerIds.Count)
        {
            logger.LogWarning("Some exam takers are not assigned to assignment with id {AssignmentId}",
                assignmentId);
        }

        dbContext.ExamTakerAssignments.RemoveRange(assignmentsToRemove);

        logger.LogInformation("Removing {Count} exam takers from assignment with id {AssignmentId}",
            assignmentsToRemove.Count,
            assignmentId);
        
        assignment.UpdatedAtUtc = DateTime.UtcNow;
        assignment.UpdatedByUser = updatedByUser;
        
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Removed {Count} exam takers from assignment with id {AssignmentId}",
            assignmentsToRemove.Count,
            assignmentId);
        
        var updatedAssignment = await dbContext.Assignments
            .AsNoTracking()
            .Include(a => a.ExamTakerAssignments)
            .Include(a => a.Group)
            .FirstOrDefaultAsync(a => a.Id == assignmentId, cancellationToken);
        
        if (updatedAssignment is null)
        {
            // This should not happen as we already checked existence
            logger.LogError("Unexpected error: Assignment with id {AssignmentId} not found after removing exam takers",
                assignmentId);
            return Response<AssignmentDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed,
                $"Unexpected error: Assignment with id '{assignmentId}' not found after removing exam takers");
        }

        return Response<AssignmentDto, GenericOperationStatuses>.Success(
            updatedAssignment.ConvertToDto(),
            GenericOperationStatuses.Completed,
            $"Removed {assignmentsToRemove.Count} exam takers from assignment with id '{assignmentId}' successfully");
    }

    /// <inheritdoc cref="IAssignmentService.PublishAsync"/>
    public async Task<Response<GenericOperationStatuses>> PublishAsync(
        Guid assignmentId,
        string updatedByUser,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Publishing assignment with {ID} ID request received", assignmentId);
        Guard.AgainstNullOrWhiteSpace(updatedByUser, nameof(updatedByUser));

        var assignmentToPublish = await dbContext.Assignments
            .FindAsync([assignmentId], cancellationToken);

        if (assignmentToPublish is null)
        {
            logger.LogWarning("Publish failed. No assignment found with id {AssignmentId}", assignmentId);
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment with id '{assignmentId}' not found");
        }

        if (assignmentToPublish.IsPublished)
        {
            logger.LogWarning("Unable to publish assignment with id {AssignmentId} as it is already published",
                assignmentId);
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"Assignment with id '{assignmentId}' is already published");
        }

        logger.LogInformation("Publishing assignment with id {AssignmentId}", assignmentId);
        assignmentToPublish.IsPublished = true;
        assignmentToPublish.UpdatedAtUtc = DateTime.UtcNow;
        assignmentToPublish.UpdatedByUser = updatedByUser;

        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogInformation("Published assignment with id {AssignmentId}", assignmentId);

        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            $"Assignment with id '{assignmentId}' published successfully");
    }

    /// <inheritdoc cref="IAssignmentService.DeleteAsync"/>
    public async Task<Response<GenericOperationStatuses>> DeleteAsync(
        Guid assignmentId,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Delete assignment request received for {AssignmentId}", assignmentId);

        var assignmentToRemove = await dbContext.Assignments
            .FindAsync([assignmentId], cancellationToken);

        if (assignmentToRemove is null)
        {
            logger.LogWarning("Delete failed. No assignment found with id {AssignmentId}", assignmentId);
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Assignment with id '{assignmentId}' not found");
        }

        dbContext.Assignments.Remove(assignmentToRemove);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Assignment with id {AssignmentId} successfully removed", assignmentId);

        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            $"Assignment with id '{assignmentId}' deleted successfully");
    }
    

    /// <inheritdoc cref="IAssignmentService.GetAssignmentsAsync"/>
    public async Task<Response<PaginatedResponse<AssignmentDto>, GenericOperationStatuses>> GetAssignmentsAsync(
        int pageNumber = 1,
        int pageSize = 10,
        string? titleFilter = null,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Get assignments request received.");

        if (pageNumber < 1)
        {
            pageNumber = 1;
            logger.LogInformation("Page number less than 1. Defaulting to 1.");
        }

        if (pageSize < 1 || pageSize > options.CurrentValue.MaxPageSize)
        {
            pageSize = options.CurrentValue.MaxPageSize;
            logger.LogInformation("Page size out of range. Defaulting to {DefaultPageSize}.",
                options.CurrentValue.MaxPageSize);
        }

        logger.LogDebug(
            "Fetching assignments. Query - PageNumber: {PageNumber}, PageSize: {PageSize}, TitleFilter: {TitleFilter}",
            pageNumber,
            pageSize,
            titleFilter);

        var titleEmpty = string.IsNullOrWhiteSpace(titleFilter);
        var query = dbContext.Assignments
            .Where(a => titleEmpty || EF.Functions.Like(a.Title, $"%{titleFilter}%"))
            .AsNoTracking()
            .Include(a => a.ExamTakerAssignments)
            .Include(a => a.Group)
            .AsQueryable();

        var totalCount = await query.LongCountAsync(cancellationToken);

        var paginatedResponse = new PaginatedResponse<AssignmentDto>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount
        };

        if (totalCount <= 0)
        {
            logger.LogInformation("No assignments found.");
            return Response<PaginatedResponse<AssignmentDto>, GenericOperationStatuses>.Success(
                paginatedResponse,
                GenericOperationStatuses.NotFound,
                "No assignments found");
        }

        var assignments = await query
            .OrderByDescending(a => a.UpdatedAtUtc ?? a.CreatedAtUtc)
            .ThenByDescending(a => a.CreatedAtUtc)
            .Skip((pageNumber - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        logger.LogDebug("Fetched {Count} assignments out of {TotalCount}.",
            assignments.Count, totalCount);

        var assignmentDtos = assignments
            .Select(a => a.ConvertToDto())
            .ToList();

        paginatedResponse.Data.AddRange(assignmentDtos);

        return Response<PaginatedResponse<AssignmentDto>, GenericOperationStatuses>.Success(
            paginatedResponse,
            GenericOperationStatuses.Completed,
            "Assignments retrieved successfully");
    }

    /// <inheritdoc cref="IAssignmentService.GetAvailableAssignmentsAsync"/>
    public async Task<Response<IList<ExamTakerAssignmentDto>, GenericOperationStatuses>> GetAvailableAssignmentsAsync(
        string examTakerId, 
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Get assignments by exam taker ID request received.");
        Guard.AgainstNullOrWhiteSpace(examTakerId, nameof(examTakerId));

        var query = dbContext.Assignments
            .AsNoTracking()
            .Where(a => a.IsPublished
                        && a.ExamTakerAssignments.Any(eta => eta.ExamTakerId == examTakerId));
        
        var totalCount = await query.LongCountAsync(cancellationToken);
        
        if (totalCount == 0)
        {
            logger.LogInformation("No assignments found.");
            return Response<IList<ExamTakerAssignmentDto>, GenericOperationStatuses>.Success(
                new List<ExamTakerAssignmentDto>(),
                GenericOperationStatuses.NotFound,
                "No assignments found");
        }

        var items = await query
            .OrderByDescending(x => x.UpdatedAtUtc)
            .Include(a => a.Group)
            .Select(a => a.ConvertToExamTakerAssignmentDto(a.Id))
            .ToListAsync(cancellationToken);

        logger.LogInformation("Fetched {Count} assignments out of {Total} for exam taker {ExamTakerId}",
            items.Count, 
            totalCount, 
            examTakerId);
        
        return Response<IList<ExamTakerAssignmentDto>, GenericOperationStatuses>.Success(
                items, 
                GenericOperationStatuses.Completed,
                "Assignments retrieved successfully");
    }

    /// <inheritdoc cref="IAssignmentService.GetAssignmentCountAsync"/>
    public async Task<Response<long, GenericOperationStatuses>> GetAssignmentCountAsync(
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Get assignment count request received.");

        var count = await dbContext.Assignments
            .AsNoTracking()
            .LongCountAsync(cancellationToken);
        logger.LogDebug("Total assignments count: {Count}", count);

        return Response<long, GenericOperationStatuses>.Success(
            count,
            GenericOperationStatuses.Completed,
            $"Total assignments count: '{count}' found.");
    }
    
    /// <summary>
    /// This service method validates that all provided exam taker IDs exist in the system.
    /// </summary>
    /// <param name="userIds">Array of user IDs.</param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns a list of <see cref="User"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    /// <exception cref="NotImplementedException"></exception>
    private async Task<Response<IList<User>, GenericOperationStatuses>> GetValidatedExamTakersAsync(
        HashSet<string> userIds, 
        CancellationToken cancellationToken)
    {
        var examTakers = await GetExamTakersAsync(userIds, cancellationToken);
        if (examTakers.Count == 0)
        {
            return Response<IList<User>, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                "No exam takers found for the provided IDs");
        }

        var foundUserIds = examTakers.Select(u => u.Id).ToHashSet();
        var missingUserIds = userIds.Except(foundUserIds, StringComparer.InvariantCultureIgnoreCase).ToList();

        if (missingUserIds.Count > 0)
        {
            logger.LogWarning("Validation failed. Some exam takers not found: {MissingUserIds}",
                string.Join(", ", missingUserIds));
            return Response<IList<User>, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Some exam takers not found: {string.Join(", ", missingUserIds)}");
        }

        logger.LogDebug("All provided exam takers validated successfully.");
        return Response<IList<User>, GenericOperationStatuses>.Success(
            examTakers, 
            GenericOperationStatuses.Completed,
            "All exam takers validated successfully");
    }
    
    // TODO: Create user repository to avoid direct DbContext access in the service
    // Otherwise, we have circular dependency between UserService and AssignmentService
    /// <summary>
    /// This method retrieves and combines exam takers from both ExamTakers and Users tables based on provided IDs.
    /// </summary>
    /// <param name="examTakerIds">Exam taker IDs</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns an array of <see cref="User"/></returns>
    private async Task<List<User>> GetExamTakersAsync(HashSet<string> examTakerIds, CancellationToken cancellationToken)
    {
        var examTakerIdsUppercase = examTakerIds.Select(id => id.ToUpperInvariant()).ToHashSet();
        var examTakers = await dbContext.ExamTakers
            .AsNoTracking()
            .Where(e => examTakerIdsUppercase.Contains(e.Id))
            .Select(e => e.ConvertToUser())
            .ToListAsync(cancellationToken);

        var users = await dbContext.Users
            .AsNoTracking()
            .Where(e => examTakerIds.Contains(e.Id))
            .Select(e => e.ConvertToUser())
            .ToListAsync(cancellationToken);
        
        var combinedExamTakers = examTakers
            .Concat(users)
            .ToList();
        
        return combinedExamTakers;
    }
}