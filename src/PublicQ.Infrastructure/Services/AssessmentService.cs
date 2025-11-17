using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Exam;
using PublicQ.Infrastructure.Options;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities.Module;
using PublicQ.Shared;
using PublicQ.Shared.Models;

namespace PublicQ.Infrastructure.Services;

/// <inheritdoc />
public class AssessmentService(
    ApplicationDbContext dbContext,
    IStorageService storageService,
    IOptionsMonitor<AssessmentServiceOptions> options,
    ILogger<AssessmentService> logger) : IAssessmentService
{
    private const string ModuleFolderName = "modules/";

    /// <inheritdoc />
    public async Task<Response<AssessmentModuleDto, GenericOperationStatuses>> CreateModuleAsync(
        AssessmentModuleCreateDto dto,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Create Module request received with DTO: {@Dto}", dto);

        Guard.AgainstNull(dto, nameof(dto));
        Guard.AgainstNull(dto.Title, nameof(dto.Title));
        Guard.AgainstNull(dto.Description, nameof(dto.Description));
        Guard.AgainstNull(dto.CreatedByUser, nameof(dto.CreatedByUser));

        var validation= await CheckIfTitleExistsInLatestVersionsAsync(
            dto.Title, 
            cancellationToken: cancellationToken);
        if (validation.IsFailed)
        {
            return Response<AssessmentModuleDto, GenericOperationStatuses>.Failure(
                validation.Status, 
                validation.Message, 
                validation.Errors);
        }

        var moduleVersionEntity = new AssessmentModuleVersionEntity
        {
            Title = dto.Title,
            NormalizedTitle = dto.Title.ToUpperInvariant(),
            Description = dto.Description,
            PassingScorePercentage = dto.PassingScorePercentage,
            DurationInMinutes = dto.DurationInMinutes,
            CreatedByUser = dto.CreatedByUser
        };

        var moduleEntity = new AssessmentModuleEntity
        {
            CreatedByUser = dto.CreatedByUser,
            CreatedAtUtc = DateTime.UtcNow,
            Versions = new List<AssessmentModuleVersionEntity> { moduleVersionEntity }
        };

        moduleVersionEntity.AssessmentModule = moduleEntity;

        var createdEntity = await dbContext.AssessmentModules.AddAsync(moduleEntity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogDebug("Module created successfully with ID: {ModuleId}", createdEntity.Entity.Id);

        return Response<AssessmentModuleDto, GenericOperationStatuses>.Success(
            createdEntity.Entity.ConvertToDto(),
            GenericOperationStatuses.Completed,
            $"Module created successfully. Module ID: '{createdEntity.Entity.Id}'");
    }

    /// <inheritdoc cref="IAssessmentService.GetModuleAsync"/>
    public async Task<Response<AssessmentModuleDto, GenericOperationStatuses>> GetModuleAsync(
        AssessmentModuleFilter filter,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Get Module request received.");
        if (filter.Id == Guid.Empty && string.IsNullOrWhiteSpace(filter.Title))
        {
            return Response<AssessmentModuleDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Module ID cannot be empty.");
        }

        var query = BuildQuery();
        
        if (filter.Id != null && filter.Id.Value != Guid.Empty)
        {
            query = query.Where(x => x.Id == filter.Id);
        }

        if (!string.IsNullOrWhiteSpace(filter.Title))
        {
            query = query.Where(x => x.Versions.Any(v => v.NormalizedTitle == filter.Title.ToUpperInvariant()));
        }
        
        var moduleEntity = await query
            .FirstOrDefaultAsync(cancellationToken);

        if (moduleEntity == null)
        {
            logger.LogWarning("Module with to search criteria: {@Filter} not found", filter);
            return Response<AssessmentModuleDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.NotFound, $"Module to search criteria: '{filter}' not found.");
        }

        logger.LogDebug("Module with ID: {ModuleId} successfully found", moduleEntity.Id);

        return Response<AssessmentModuleDto, GenericOperationStatuses>.Success(
            moduleEntity.ConvertToDto(),
            GenericOperationStatuses.Completed,
            "Module retrieved successfully.");
    }

    public Task<Response<AssessmentModuleDto, GenericOperationStatuses>> GetModuleAsync(string title, CancellationToken cancellationToken)
    {
        throw new NotImplementedException();
    }

    /// <inheritdoc cref="IAssessmentService.GetModulesAsync"/>
    public async Task<Response<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>> GetModulesAsync(
        int pageNumber = 1,
        int pageSize = 10,
        CancellationToken cancellationToken = default)
    {
        return await GetModulesByTitleAsync(string.Empty, pageNumber, pageSize, cancellationToken);
    }

    /// <inheritdoc cref="IAssessmentService.GetModulesByTitleAsync"/>
    public async Task<Response<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>>
        GetModulesByTitleAsync(
            string title = "",
            int pageNumber = 1,
            int pageSize = 10,
            CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Get Modules request received");

        pageNumber = Math.Max(1, pageNumber);
        pageSize   = Math.Max(1, Math.Min(pageSize, options.CurrentValue.MaxPageSize));

        var titleIsEmpty = string.IsNullOrWhiteSpace(title);

        var baseQuery = dbContext.AssessmentModules
            .AsNoTracking()
            .Where(m => m.Versions.Any(v =>
                (titleIsEmpty || EF.Functions.Like(v.Title, $"%{title}%"))
            ));

        var totalCount = await baseQuery.LongCountAsync(cancellationToken);

        // Order by latest version creation date, then by module creation date for stability
        var page = await baseQuery
            .OrderByDescending(m => m.Versions.Max(v => v.CreatedAtUtc))
            .ThenByDescending(m => m.CreatedAtUtc)
            .ThenBy(m => m.Id)
            .Skip(pageSize * (pageNumber - 1))
            .Take(pageSize)
            .Include(m => m.Versions)
            .ToListAsync(cancellationToken);

        // Map after materialization to avoid translation issues
        var items = page.Select(m => m.ConvertToDto()).ToList();

        var payload = new PaginatedResponse<AssessmentModuleDto>
        {
            PageNumber = pageNumber,
            PageSize   = pageSize,
            TotalCount = totalCount,
            Data       = items
        };

        if (items.Count == 0)
        {
            logger.LogDebug("No records found for Title: {Title}", title);
            return Response<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>.Success(
                payload,
                GenericOperationStatuses.NotFound,
                $"No modules found with title filter '{title}'.");
        }

        return Response<PaginatedResponse<AssessmentModuleDto>, GenericOperationStatuses>.Success(
            payload,
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IAssessmentService.GetPublishedLatestModuleVersionsByTitleAsync"/>
    public async Task<Response<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>>
        GetPublishedLatestModuleVersionsByTitleAsync(
            string title = "",
            int pageNumber = 1,
            int pageSize = 10,
            CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Search latest published ModuleVersions by title. Title: '{Title}'", title);
        pageNumber = Math.Max(1, pageNumber);
        pageSize = Math.Min(pageSize, options.CurrentValue.MaxPageSize);

        var titleIsEmpty = string.IsNullOrWhiteSpace(title);

        // 1) Base set: only published; apply title filter if provided
        var baseQuery = dbContext.AssessmentModuleVersions
            .AsNoTracking()
            .Where(v => v.IsPublished &&
                        (titleIsEmpty || EF.Functions.Like(v.Title, $"%{title}%")));

        // 2) Correlated subquery: keep rows whose Version equals the max Version for their module
        //    NOTE: cast to (int?) so Max() returns null for empty groups (keeps translation stable).
        var latestVersionsQuery = baseQuery.Where(v =>
            v.Version == dbContext.AssessmentModuleVersions
                .Where(x => x.AssessmentModuleId == v.AssessmentModuleId
                            && x.IsPublished
                            && (titleIsEmpty || EF.Functions.Like(x.Title, $"%{title}%")))
                .Max(x => (int?)x.Version));

        // 3) Total count (after the latest filter)
        var totalCount = await latestVersionsQuery.LongCountAsync(cancellationToken);

        // 4) Ordering & paging (pick one: CreatedAtUtc or Version)
        var items = await latestVersionsQuery
            .OrderByDescending(v => v.CreatedAtUtc) // or .OrderByDescending(v => v.Version)
            .Skip(pageSize * (pageNumber - 1))
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var dtoList = items.Select(v => v.ConvertToDto()).ToList();

        var payload = new PaginatedResponse<AssessmentModuleVersionDto>
        {
            PageNumber = pageNumber,
            PageSize = pageSize,
            TotalCount = totalCount,
            Data = dtoList
        };

        if (dtoList.Count == 0)
        {
            return Response<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>.Success(
                payload, GenericOperationStatuses.NotFound,
                $"No latest published module versions found with title filter '{title}'.");
        }

        return Response<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>.Success(
            payload, GenericOperationStatuses.Completed,
            $"Latest published module versions found. Total: {totalCount}.");
    }

    /// <inheritdoc cref="IAssessmentService.GetAllLatestPublishedModuleVersionsAsync"/>
    public async Task<Response<PaginatedResponse<AssessmentModuleVersionDto>, GenericOperationStatuses>>
        GetAllLatestPublishedModuleVersionsAsync(
            int pageNumber = 1,
            int pageSize = 10,
            CancellationToken cancellationToken = default)
    {
        return await GetPublishedLatestModuleVersionsByTitleAsync(
            string.Empty,
            pageNumber,
            pageSize,
            cancellationToken);
    }

    /// <inheritdoc cref="IAssessmentService.GetLatestPublishedModuleVersionAsync"/>
    public async Task<Response<AssessmentModuleVersionDto, GenericOperationStatuses>> GetLatestPublishedModuleVersionAsync(
        Guid moduleId, 
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("Get latest published ModuleVersion for Module ID: {ModuleId}", moduleId);
        
        var latestModuleVersion = await dbContext.AssessmentModuleVersions
                .Where(m => m.AssessmentModuleId == moduleId && m.IsPublished)
                .OrderByDescending(v => v.Version)
                .FirstOrDefaultAsync(cancellationToken);

        if (latestModuleVersion == null)
        {
            logger.LogWarning("No published versions found for Module ID: {ModuleId}", moduleId);
            return Response<AssessmentModuleVersionDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"No published versions found for Module ID: '{moduleId}'.");
        }
        
        logger.LogDebug("Found latest published ModuleVersion ID: {VersionId} for Module ID: {ModuleId}",
            latestModuleVersion.Id, 
            moduleId);
        
        return Response<AssessmentModuleVersionDto, GenericOperationStatuses>.Success(
            latestModuleVersion.ConvertToDto(),
            GenericOperationStatuses.Completed,
            $"Latest published module version found. Module ID: '{moduleId}', Version ID: '{latestModuleVersion.Id}'.");
    }

    /// <inheritdoc cref="IAssessmentService.PublishModuleVersionAsync"/>
    public async Task<Response<GenericOperationStatuses>> PublishModuleVersionAsync(
        Guid moduleVersionId,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Publish Module request received for Version: {VersionId}",
            moduleVersionId);

        if (moduleVersionId == Guid.Empty)
        {
            logger.LogWarning("Unable to publish Module because GUID is empty.");
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Module version ID cannot be empty.");
        }

        var moduleVersion = await dbContext
            .AssessmentModuleVersions
            .FirstOrDefaultAsync(v => v.Id == moduleVersionId, cancellationToken);

        if (moduleVersion == null)
        {
            logger.LogWarning("Module Version with ID: {VersionId} not found", moduleVersionId);
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.NotFound, $"Module version with ID: '{moduleVersionId}' not found.");
        }

        if (moduleVersion.IsPublished)
        {
            logger.LogWarning("Module Version with ID: {VersionId} is already published", moduleVersionId);
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.Conflict,
                    $"Module version with ID: '{moduleVersionId}' is already published.");
        }

        // Mark the module version as published
        moduleVersion.IsPublished = true;
        dbContext.AssessmentModuleVersions.Update(moduleVersion);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogDebug("Module Version with ID: {VersionId} published successfully", moduleVersionId);

        return Response<GenericOperationStatuses>
            .Success(GenericOperationStatuses.Completed, $"Module version '{moduleVersionId}' published successfully.");
    }

    /// <inheritdoc />
    public async Task<Response<GenericOperationStatuses>> DeleteModuleAsync(
        Guid moduleId,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Delete Module request received for ID: {ModuleId}", moduleId);

        // Quick existence check without loading navigation properties
        var exists = await dbContext.AssessmentModules
            .AnyAsync(m => m.Id == moduleId, cancellationToken);

        if (!exists)
        {
            logger.LogInformation("Module with ID: {ModuleId} not found", moduleId);
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.NotFound, $"Module with ID: '{moduleId}' not found.");
        }

        // Check if there are any dependent group members (more efficient than Count)
        var groupMembersQuery = dbContext.GroupMembers
            .AsNoTracking()
            .Where(gm => gm.AssessmentModuleId == moduleId)
            .AsQueryable();

        var hasGroupMembers = await groupMembersQuery
            .AnyAsync(cancellationToken);
        
        if (hasGroupMembers)
        {
            logger.LogWarning("Module with ID: {ModuleId} cannot be deleted because it has associated group members.",
                moduleId);
            
            var groupsWithMembers = await groupMembersQuery
                .Include(gm => gm.Group)
                .Select(gm => gm.Group.Title)
                .Distinct()
                .ToListAsync(cancellationToken);
                
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.Conflict,
                    $"Module cannot be deleted because it has associated groups: '{string.Join(", ", groupsWithMembers)}'.");
        }

        // Delete without re-querying the full entity
        dbContext.Attach(new AssessmentModuleEntity { Id = moduleId }).State = EntityState.Deleted;
        
        await DeleteAssociatedWithModuleStaticFilesAsync(moduleId, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogInformation("Module with ID: {ModuleId} deleted successfully.", moduleId);

        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            $"Module with ID: '{moduleId}' deleted successfully.");
    }

    /// <inheritdoc />
    public async Task<Response<AssessmentModuleDto, GenericOperationStatuses>> CreateModuleVersionAsync(
        AssessmentModuleVersionCreateDto dto,
        CancellationToken cancellationToken)
    {
        Guard.AgainstNull(dto, nameof(dto));

        var latestModuleVersion = await dbContext.AssessmentModuleVersions
            .Where(v => v.AssessmentModuleId == dto.ModuleId)
            .Include(v => v.AssociatedStaticFiles)
            .Include(v => v.Questions)
                .ThenInclude(q => q.AssociatedStaticFiles)
            .Include(v => v.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.PossibleAnswers.OrderBy(a => a.Order))
                    .ThenInclude(a => a.AssociatedStaticFiles)
            .OrderByDescending(v => v.Version)
            .FirstOrDefaultAsync(cancellationToken);

        if (latestModuleVersion == null)
        {
            logger.LogWarning("Unable to create module version with ID: '{ModuleId}'. Check if module has any version.",
                dto.ModuleId);
            return Response<AssessmentModuleDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound,
                $"Module with ID: '{dto.ModuleId}' not found.");
        }

        if (!latestModuleVersion.IsPublished)
        {
            logger.LogInformation(
                "Unable to create module version with ID: '{ModuleId}'. Latest version is not published. You can modify not published version.",
                dto.ModuleId);

            return Response<AssessmentModuleDto, GenericOperationStatuses>.Failure(GenericOperationStatuses.Conflict,
                $"Module with ID: '{dto.ModuleId}' has latest version that is not published. You can modify not published version.");
        }

        logger.LogDebug("Creating new module version for Module ID: {ModuleId} with DTO: {@Dto}",
            dto.ModuleId, dto);

        var questionsCopy = latestModuleVersion.Questions
            .Select(q => new QuestionEntity
            {
                Order = q.Order,
                Text = q.Text,
                Type = q.Type,
                AssociatedStaticFiles = q.AssociatedStaticFiles.ToList(),
                PossibleAnswers = q.PossibleAnswers.Select(a => new PossibleAnswerEntity
                {
                    Order = a.Order,
                    Text = a.Text,
                    IsCorrect = a.IsCorrect,
                    AssociatedStaticFiles = a.AssociatedStaticFiles.ToList()
                }).ToList()
            }).ToList();

        var associatedStaticFiles = await dbContext
            .StaticFiles
            .Where(f => dto.StaticFileIds.Contains(f.Id))
            .ToHashSetAsync(cancellationToken);

        var newVersion = new AssessmentModuleVersionEntity
        {
            AssessmentModuleId = dto.ModuleId,
            Version = latestModuleVersion.Version + 1,
            PassingScorePercentage = dto.PassingScorePercentage,
            Title = dto.Title,
            Description = dto.Description,
            DurationInMinutes = dto.DurationInMinutes,
            CreatedByUser = dto.CreatedByUser,
            AssociatedStaticFiles = associatedStaticFiles,
            Questions = questionsCopy
        };

        var createdVersion = await dbContext
            .AssessmentModuleVersions
            .AddAsync(newVersion, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        // Load the associated module to ensure it is fully populated
        await dbContext.Entry(createdVersion.Entity)
            .Reference(v => v.AssessmentModule)
            .LoadAsync(cancellationToken);

        logger.LogDebug("Module version created successfully with ID: {VersionId}", createdVersion.Entity.Id);

        return Response<AssessmentModuleDto, GenericOperationStatuses>.Success(
            createdVersion.Entity.AssessmentModule.ConvertToDto(),
            GenericOperationStatuses.Completed,
            $"Module version created successfully. Module ID: '{createdVersion.Entity.AssessmentModuleId}', Version ID: '{createdVersion.Entity.Id}'");
    }

    /// <inheritdoc />
    public async Task<Response<AssessmentModuleVersionDto, GenericOperationStatuses>> GetModuleVersionAsync(
        Guid versionId,
        CancellationToken cancellationToken)
    {
        if (versionId == Guid.Empty)
        {
            logger.LogDebug("Get Module Version request received with empty ID");
        }

        var response = await GetAssessmentVersionEntityAsync(versionId, cancellationToken);

        if (response.IsFailed)
        {
            logger.LogWarning("Failed to retrieve module version. Message: {Message}. Errors: {@Errors}",
                response.Message, response.Errors);
            return Response<AssessmentModuleVersionDto, GenericOperationStatuses>
                .Failure(response.Status, response.Message, response.Errors);
        }

        return Response<AssessmentModuleVersionDto, GenericOperationStatuses>
            .Success(response.Data!.ConvertToDto(), GenericOperationStatuses.Completed,
                response.Message);
    }

    /// <inheritdoc />
    public async Task<Response<AssessmentModuleVersionDto, GenericOperationStatuses>> UpdateDraftModuleVersionAsync(
        AssessmentModuleVersionUpdateDto updateDto,
        string fullName,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Update Draft Module Version request received with DTO: {@UpdateDto}", updateDto);
        Guard.AgainstNull(updateDto, nameof(updateDto));
        Guard.AgainstNull(updateDto.Title, nameof(updateDto.Title));

        var versionResponse = await GetAssessmentVersionEntityAsync(updateDto.Id, cancellationToken);

        if (versionResponse.IsFailed)
        {
            return Response<AssessmentModuleVersionDto, GenericOperationStatuses>
                .Failure(versionResponse.Status, versionResponse.Message, versionResponse.Errors);
        }
        
        var validation= await CheckIfTitleExistsInLatestVersionsAsync(
            updateDto.Title, 
            versionResponse.Data.AssessmentModuleId,
            cancellationToken);
        if (validation.IsFailed)
        {
            return Response<AssessmentModuleVersionDto, GenericOperationStatuses>.Failure(
                validation.Status, 
                validation.Message, 
                validation.Errors);
        }

        if (versionResponse.Data!.IsPublished)
        {
            logger.LogInformation("Module Version with ID: {VersionId} is already published and cannot be updated.",
                updateDto.Id);
            return Response<AssessmentModuleVersionDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.Conflict,
                    $"Module version with ID: '{updateDto.Id}' is already published and cannot be updated.");
        }
        
        return await UpdateModuleVersionAsync(updateDto, versionResponse.Data, fullName, cancellationToken);
    }

    /// inheritdoc <see cref="IAssessmentService.UpdatePublishedModuleVersionAsync"/>
    public async Task<Response<AssessmentModuleVersionDto, GenericOperationStatuses>> UpdatePublishedModuleVersionAsync(
        AssessmentModuleVersionUpdatePublishedDto updatePublishedDto,
        string fullName,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Update Published Module Version request received for version with DTO: {@UpdateDto}",
            updatePublishedDto);
        Guard.AgainstNull(updatePublishedDto, nameof(updatePublishedDto));

        var versionResponse = await GetAssessmentVersionEntityAsync(updatePublishedDto.Id, cancellationToken);

        if (versionResponse.IsFailed)
        {
            return Response<AssessmentModuleVersionDto, GenericOperationStatuses>
                .Failure(versionResponse.Status, versionResponse.Message, versionResponse.Errors);
        }

        var moduleToUpdate = new AssessmentModuleVersionUpdateDto
        {
            Id = versionResponse.Data!.Id,
            Title = updatePublishedDto.Title,
            Description = updatePublishedDto.Description,
            DurationInMinutes = updatePublishedDto.DurationInMinutes,
            // PassingScorePercentage is not allowed to be updated for published versions.
            PassingScorePercentage = versionResponse.Data.PassingScorePercentage,
            StaticFileIds = updatePublishedDto.StaticFileIds
        };

        return await UpdateModuleVersionAsync(moduleToUpdate, versionResponse.Data, fullName, cancellationToken);
    }

    /// inheritdoc <see cref="IAssessmentService.SaveAssociatedWithModuleStaticFileAsync"/>
    public async Task<Response<StaticFileDto, GenericOperationStatuses>> SaveAssociatedWithModuleStaticFileAsync(
        Guid moduleId,
        FileUploadDto fileToUpload,
        bool isModuleLevelFile,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Save Static File request received for Module ID: {ModuleId} with filename: {FileName}",
            moduleId, fileToUpload.Name);
        Guard.AgainstNull(fileToUpload, nameof(fileToUpload));
        Guard.AgainstNullOrWhiteSpace(fileToUpload.Name, nameof(fileToUpload.Name));

        if (moduleId == Guid.Empty)
        {
            logger.LogWarning("Unable to save static file because Module ID is empty.");
            return Response<StaticFileDto, GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest, "Module ID cannot be empty.");
        }

        // Files are stored in a folder named after the module ID.
        // If different module versions share the same file name,
        // the existing file will be replaced, and both versions will end up sharing the same file.
        var fileExtension = Path.GetExtension(fileToUpload.Name);
        var newFileName = $"{Guid.NewGuid()}{fileExtension}";

        var storageItem = new StorageItem
        {
            Name = newFileName,
            Content = fileToUpload.Content,
            RelativePath = $"{ModuleFolderName}{moduleId.ToString()}"
        };

        var fileSaveResponse = await storageService.SaveAsync(
            storageItem,
            cancellationToken);

        if (fileSaveResponse.IsFailed)
        {
            logger.LogWarning("Failed to save static file. Message: {Message}. Errors: {@Errors}",
                fileSaveResponse.Message, fileSaveResponse.Errors);
            return Response<StaticFileDto, GenericOperationStatuses>
                .Failure(fileSaveResponse.Status, fileSaveResponse.Message, fileSaveResponse.Errors);
        }

        var fileEntity = new StaticFileEntity
        {
            FileUrl = fileSaveResponse.Data!,
            AssessmentModuleId = moduleId,
            UploadedAtUtc = DateTime.UtcNow,
            IsModuleLevelFile = isModuleLevelFile,
        };

        var response = await dbContext
            .StaticFiles
            .AddAsync(fileEntity, cancellationToken);
        await dbContext.SaveChangesAsync(cancellationToken);

        return Response<StaticFileDto, GenericOperationStatuses>.Success(
            response.Entity.ConvertToDto(),
            GenericOperationStatuses.Completed,
            $"Static file saved successfully. File ID: '{response.Entity.Id}'");
    }

    /// inheritdoc <see cref="IAssessmentService.DeleteAssociatedWithModuleStaticFilesAsync"/>
    public async Task<Response<GenericOperationStatuses>> DeleteAssociatedWithModuleStaticFilesAsync(
        Guid moduleId, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Delete Static File request received for Module ID: {ModuleId}", moduleId);
        
        var fileEntities = await dbContext
            .StaticFiles
            .AsNoTracking()
            .Where(f => f.AssessmentModuleId == moduleId)
            .ToListAsync(cancellationToken);
        
        logger.LogDebug("Found {FileCount} static files associated with Module ID: {ModuleId}",
            fileEntities.Count, 
            moduleId);

        // TODO: Check response of each delete operation and aggregate errors if any
        var responses = new List<Response<GenericOperationStatuses>>();
        foreach (var file in fileEntities)
        {
            var response = await storageService.DeleteAsync(
                file.FileUrl, 
                cancellationToken);
            responses.Add(response);
        }
        
        if (responses.Any(r => r.IsFailed))
        {
            var errorMessages = responses
                .Where(r => r.IsFailed)
                .SelectMany(r => r.Errors)
                .ToList();
            
            logger.LogWarning("Failed to delete one or more static files associated with Module ID: {ModuleId}. Errors: {@Errors}",
                moduleId, errorMessages);

            return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.PartiallyCompleted,
                $"Some static files associated with Module ID: '{moduleId}' could not be deleted. Errors: '{string.Join(",", errorMessages)}'.");
        }
 
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            $"All '{fileEntities.Count}' static files associated with Module ID: '{moduleId}' have been deleted.");
    }

    /// <inheritdoc cref="IAssessmentService.GetTotalAssessmentModulesAsync" />
    public async Task<Response<long, GenericOperationStatuses>> GetTotalAssessmentModulesAsync(CancellationToken cancellationToken)
    {
        logger.LogDebug("Get total assessment modules request received.");
        
        var totalModules = await dbContext
            .AssessmentModules
            .LongCountAsync(cancellationToken);
        
        return Response<long, GenericOperationStatuses>.Success(
            totalModules,
            GenericOperationStatuses.Completed,
            $"Total assessment modules: {totalModules}");
    }

    /// <summary>
    /// Gets the assessment module version entity by its ID.
    /// </summary>
    /// <param name="versionId">Module version ID</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="AssessmentModuleVersionEntity"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    private async Task<Response<AssessmentModuleVersionEntity, GenericOperationStatuses>>
        GetAssessmentVersionEntityAsync(
            Guid versionId,
            CancellationToken cancellationToken)
    {
        logger.LogDebug("Get Module Version request received for ID: {VersionId}", versionId);

        // Module version should be fetched in full of,
        // including all questions and possible answers.
        // This response will be saved in the user cache at the beginning of the exam,
        // so it should contain all necessary data to display the module and its questions.
        var version = await dbContext
            .AssessmentModuleVersions
            .Where(v => v.Id == versionId)
            .Include(v => v.AssociatedStaticFiles)
            .Include(v => v.Questions.OrderBy(q => q.Order))
                .ThenInclude(q => q.PossibleAnswers.OrderBy(a => a.Order))
                    .ThenInclude(a => a.AssociatedStaticFiles)
            .Include(v => v.Questions)
                .ThenInclude(q => q.AssociatedStaticFiles)
            .FirstOrDefaultAsync(cancellationToken);

        if (version == null)
        {
            logger.LogWarning("Module Version with ID: {VersionId} not found", versionId);
            return Response<AssessmentModuleVersionEntity, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Module version with ID: '{versionId}' not found.");
        }

        logger.LogDebug("Module Version with ID: {VersionId} retrieved successfully", versionId);

        return Response<AssessmentModuleVersionEntity, GenericOperationStatuses>
            .Success(version, GenericOperationStatuses.Completed,
                $"Module version with ID: '{versionId}' retrieved successfully.");
    }

    /// <summary>
    /// Verifies that all static files attached to the question and its answers
    /// If they are not found in the module's static files collection,
    /// then it returns a failure response with appropriate error messages.
    /// </summary>
    /// <param name="createDto"><see cref="QuestionCreateDto"/></param>
    /// <param name="staticFileEntities">An array of <see cref="StaticFileEntity"/></param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    private Response<GenericOperationStatuses> VerifyAttachedFiles(QuestionCreateDto createDto,
        List<StaticFileEntity> staticFileEntities)
    {
        var errorMessages = new List<string>();
        foreach (var staticFileEntity in createDto.StaticFileIds)
        {
            if (staticFileEntities.All(f => f.Id != staticFileEntity))
            {
                logger.LogWarning(
                    "Static file attached to question with ID: '{StaticFileId}' not found in module with ID: '{ModuleId}'",
                    staticFileEntity, createDto.ModuleId);
                errorMessages.Add(
                    $"Static file attached to question with ID: '{staticFileEntity}' not found in module with ID: '{createDto.ModuleId}'.");
            }
        }

        foreach (var answer in createDto.Answers)
        {
            foreach (var staticFileId in answer.StaticFileIds)
            {
                if (staticFileEntities.All(f => f.Id != staticFileId))
                {
                    logger.LogWarning(
                        "Static file attached to answers with ID: '{StaticFileId}' not found in module with ID: '{ModuleId}'",
                        staticFileId, createDto.ModuleId);
                    errorMessages.Add(
                        $"Static file attached to answers with ID: '{staticFileId}' not found in module with ID: '{createDto.ModuleId}'.");
                }
            }
        }

        if (errorMessages.Count > 0)
        {
            logger.LogWarning("Failed to create question due to missing static files: {@Errors}", errorMessages);
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.BadRequest,
                    "One or more static files are not associated with the module.", errorMessages);
        }

        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed,
            "All static files are valid and associated with the module.");
    }

    /// <summary>
    /// Updates the module version with the provided data.
    /// </summary>
    /// <param name="updateDto"><see cref="AssessmentModuleVersionUpdateDto"/></param>
    /// <param name="versionEntity"><see cref="AssessmentModuleEntity"/></param>
    /// <param name="fullName">Updater full name</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="AssessmentModuleVersionDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    private async Task<Response<AssessmentModuleVersionDto, GenericOperationStatuses>> UpdateModuleVersionAsync(
        AssessmentModuleVersionUpdateDto updateDto,
        AssessmentModuleVersionEntity versionEntity,
        string fullName,
        CancellationToken cancellationToken)
    {
        // Verify and re-attach static files if provided
        var staticFiles = new List<StaticFileEntity>();
        if (updateDto.StaticFileIds is { Count: > 0 })
        {
            logger.LogDebug(
                "Updating static files for Module Version ID: {VersionId} with Static File IDs: {@StaticFileIds}",
                updateDto.Id, updateDto.StaticFileIds);

            staticFiles = await dbContext
                .StaticFiles
                .Where(f => updateDto.StaticFileIds.Contains(f.Id))
                .ToListAsync(cancellationToken);

            if (staticFiles.Count != updateDto.StaticFileIds.Count)
            {
                logger.LogWarning(
                    "Not all static files found for Module Version ID: {VersionId}. Expected: {ExpectedCount}, Found: {FoundCount}",
                    updateDto.Id,
                    updateDto.StaticFileIds.Count,
                    staticFiles.Count);
                return Response<AssessmentModuleVersionDto, GenericOperationStatuses>
                    .Failure(GenericOperationStatuses.BadRequest,
                        "One or more static files not found for the module version.");
            }

            foreach (var staticFile in staticFiles)
            {
                if (staticFile.AssessmentModuleId != versionEntity.AssessmentModuleId)
                {
                    logger.LogWarning(
                        "Static file with ID: {StaticFileId} is not associated with Module ID: {ModuleId}",
                        staticFile.Id,
                        versionEntity.AssessmentModuleId);
                    return Response<AssessmentModuleVersionDto, GenericOperationStatuses>
                        .Failure(GenericOperationStatuses.BadRequest,
                            $"Static file with ID: '{staticFile.Id}' is not associated with the module '{versionEntity.AssessmentModuleId}'.");
                }
            }
        }

        versionEntity.AssociatedStaticFiles.Clear();
        versionEntity.AssociatedStaticFiles = staticFiles;

        // Update the version entity with the new data
        versionEntity.Title = updateDto.Title;
        versionEntity.NormalizedTitle = updateDto.Title.ToUpperInvariant();
        versionEntity.Description = updateDto.Description;
        versionEntity.DurationInMinutes = updateDto.DurationInMinutes;
        versionEntity.PassingScorePercentage = updateDto.PassingScorePercentage;
        versionEntity.UpdatedByUser = fullName;

        dbContext
            .AssessmentModuleVersions
            .Update(versionEntity);
        await dbContext.SaveChangesAsync(cancellationToken);

        logger.LogDebug("Module version updated successfully with ID: {VersionId}", versionEntity.Id);

        return Response<AssessmentModuleVersionDto, GenericOperationStatuses>
            .Success(versionEntity.ConvertToDto(),
                GenericOperationStatuses.Completed,
                $"Module version with ID: '{updateDto.Id}' updated successfully.");
    }

    /// <summary>
    /// Checks if a module with the same title already exists in the latest versions.
    /// </summary>
    /// <param name="moduleTitle">Module title</param>
    /// <param name="moduleId">Optional: Current module ID</param>
    /// <param name="cancellationToken">Optional: Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    private async Task<Response<GenericOperationStatuses>> CheckIfTitleExistsInLatestVersionsAsync(
        string moduleTitle,
        Guid? moduleId = default,
        CancellationToken cancellationToken = default)
    {
        var existingModule = await dbContext
            .AssessmentModuleVersions
            .AsNoTracking()
            .Where(v => !moduleId.HasValue || v.AssessmentModuleId != moduleId!.Value) // Exclude current module if ID is provided
            .GroupBy(v => v.AssessmentModuleId)  // Group by module
            .Select(g => g.OrderByDescending(v => v.Version).First())  // Get latest version of each module
            .AnyAsync(v => v.NormalizedTitle == moduleTitle.ToUpperInvariant(), cancellationToken);

        if (existingModule)
        {
            logger.LogDebug("Module already exists with name: {@Name}", moduleTitle);
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.Conflict, $"Module version with title '{moduleTitle}' already exists.");
        }

        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed);
    }
    
    /// <summary>
    /// Builds the base query for fetching an Assessment Module with its latest version,
    /// </summary>
    /// <returns>Returns <see cref="IQueryable{T}"/></returns>
    private IQueryable<AssessmentModuleEntity> BuildQuery()
    {
        // The Module should be fetched in full of its latest version,
        // including all questions and possible answers.
        // This response will be saved in the user cache at the beginning of the exam,
        // so it should contain all necessary data to display the module and its questions.
        return dbContext
            .AssessmentModules
            .AsNoTracking()
            .AsSplitQuery()
            .Include(m => m.AssociatedStaticFiles)
            .Include(m => m.Versions
                .OrderByDescending(v => v.Version) // or CreatedAtUtc
                .Take(1))
            .ThenInclude(v => v.Questions)
            .ThenInclude(q => q.PossibleAnswers)
            .ThenInclude(a => a.AssociatedStaticFiles)
            .Include(m => m.Versions
                .OrderByDescending(v => v.Version)
                .Take(1))
            .ThenInclude(v => v.Questions)
            .ThenInclude(q => q.AssociatedStaticFiles)
            .AsQueryable();
    }
}