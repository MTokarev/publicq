using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Banner;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <inheritdoc cref="IBannerService"/>
public class BannerService(ApplicationDbContext dbContext, ILogger<BannerService> logger) : IBannerService
{
    /// <inheritdoc cref="IBannerService.GetActiveAsync"/>
    public async Task<Response<IList<BannerResponseDto>, GenericOperationStatuses>> GetActiveAsync(
        bool showOnlyForAuthenticatedUsers = false,
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("GetActiveAsync request received.");
        
        var activeBanners = await dbContext.Banners
            .Where(b => b.StartDateUtc <= DateTime.UtcNow 
                        && (b.EndDateUtc == null || b.EndDateUtc >= DateTime.UtcNow)
                        && (!b.ShowToAuthenticatedUsersOnly || showOnlyForAuthenticatedUsers))
            .ToListAsync(cancellationToken);
        
        logger.LogDebug("Retrieved {Count} active banners.", activeBanners.Count);
        
        var bannerDtos = activeBanners
            .Select(b => b.ToResponseDto())
            .ToList();
        
        return Response<IList<BannerResponseDto>, GenericOperationStatuses>.Success(
            bannerDtos, 
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IBannerService.GetAllAsync"/>
    public async Task<Response<IList<BannerResponseDto>, GenericOperationStatuses>> GetAllAsync(
        CancellationToken cancellationToken = default)
    {
        logger.LogDebug("GetAllAsync request received.");
        var allBanners = await dbContext.Banners
            .ToListAsync(cancellationToken);
        logger.LogDebug("Retrieved {Count} total banners.", allBanners.Count);
        
        var bannerDtos = allBanners
            .Select(b => b.ToResponseDto())
            .ToList();
        
        return Response<IList<BannerResponseDto>, GenericOperationStatuses>.Success(
            bannerDtos, 
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IBannerService.CreateAsync"/>
    public async Task<Response<BannerResponseDto, GenericOperationStatuses>> CreateAsync(
        string createdByUser,
        BannerDto bannerCreateRequest,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("CreateAsync request received.");
        Guard.AgainstNullOrWhiteSpace(createdByUser, nameof(createdByUser));
        Guard.AgainstNull(bannerCreateRequest, nameof(bannerCreateRequest));
        
        var bannerEntity = new BannerEntity
        {
            Type = bannerCreateRequest.Type,
            Title = bannerCreateRequest.Title,
            Content = bannerCreateRequest.Content,
            ShowToAuthenticatedUsersOnly = bannerCreateRequest.ShowToAuthenticatedUsersOnly,
            IsDismissible = bannerCreateRequest.IsDismissible,
            StartDateUtc = bannerCreateRequest.StartDateUtc,
            EndDateUtc = bannerCreateRequest.EndDateUtc,
            CreatedByUser = createdByUser,
            CreatedAtUtc = DateTime.UtcNow
        };
        
        dbContext.Banners.Add(bannerEntity);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogDebug("Banner created with ID {BannerId}.", bannerEntity.Id);
        
        return Response<BannerResponseDto, GenericOperationStatuses>.Success(
            bannerEntity.ToResponseDto(),
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IBannerService.UpdateAsync"/>
    public async Task<Response<GenericOperationStatuses>> UpdateAsync(
        Guid id,
        string updatedByUser,
        BannerDto bannerUpdateRequest, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("UpdateAsync request received.");
        Guard.AgainstNullOrWhiteSpace(updatedByUser, nameof(updatedByUser));
        Guard.AgainstNull(bannerUpdateRequest, nameof(bannerUpdateRequest));
        
        var bannerEntity = await dbContext.Banners
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (bannerEntity == null)
        {
            logger.LogWarning("Banner with ID {BannerId} not found.", id);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Banner with ID {id} not found.");
        }
        bannerEntity.Type = bannerUpdateRequest.Type;
        bannerEntity.Title = bannerUpdateRequest.Title;
        bannerEntity.Content = bannerUpdateRequest.Content;
        bannerEntity.ShowToAuthenticatedUsersOnly = bannerUpdateRequest.ShowToAuthenticatedUsersOnly;
        bannerEntity.IsDismissible = bannerUpdateRequest.IsDismissible;
        bannerEntity.StartDateUtc = bannerUpdateRequest.StartDateUtc;
        bannerEntity.EndDateUtc = bannerUpdateRequest.EndDateUtc;
        bannerEntity.UpdatedByUser = updatedByUser;
        bannerEntity.UpdatedAtUtc = DateTime.UtcNow;
        
        dbContext.Banners.Update(bannerEntity);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogDebug("Banner with ID {BannerId} updated successfully.", bannerEntity.Id);
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IBannerService.DeleteAsync"/>
    public async Task<Response<GenericOperationStatuses>> DeleteAsync(Guid id, CancellationToken cancellationToken)
    {
        logger.LogDebug("DeleteAsync request received.");
        
        var bannerEntity = await dbContext.Banners
            .FirstOrDefaultAsync(b => b.Id == id, cancellationToken);
        if (bannerEntity == null)
        {
            logger.LogWarning("Banner with ID {BannerId} not found.", id);
            return Response<GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Banner with ID {id} not found.");
        }
        
        dbContext.Banners.Remove(bannerEntity);
        await dbContext.SaveChangesAsync(cancellationToken);
        logger.LogDebug("Banner with ID {BannerId} deleted successfully.", id);
        
        return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed);
    }
}