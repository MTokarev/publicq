using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Pages;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Infrastructure.Persistence.Entities;
using PublicQ.Shared.Models;

namespace PublicQ.Infrastructure.Services;

/// <inheritdoc cref="IPageService"/>
/// <remarks>
/// The service handles to build the content pages used in the application, such as About, Terms of Service, Privacy Policy, etc.
/// Service is registered as a cached service in the DI container.
/// This means that the results of its methods are cached according to the caching policies defined
/// in the application. This is done to improve performance and reduce load on the underlying data sources.
/// Ensure that any changes to the data that this service manages are properly invalidated in the cache
/// to prevent stale data from being served.
/// </remarks>
public class PageService(ApplicationDbContext dbContext,
    IStorageService storageService,
    ILogger<PageService> logger) : IPageService
{
    /// <summary>
    /// Page folder for static content pages
    /// </summary>
    readonly string pageFolder = "pages";
    
    /// <inheritdoc cref="IPageService.GetContactPageAsync"/>
    public async Task<Response<ContactPageDto, GenericOperationStatuses>> GetContactPageAsync(CancellationToken cancellationToken)
    {
        logger.LogDebug("Get page request received");
        
        // Retrieve the page from the database based on the provided page type
        // Logically, there should be only one page per type
        // But if service is extended in the future to support multiple pages per type,
        // this query will need to be updated accordingly
        var page = await dbContext
            .Pages
            .FirstOrDefaultAsync(p => p.Type == PageType.Contact, cancellationToken);

        if (page == null)
        {
            logger.LogDebug("Page {Type} type not found", PageType.Contact);
            return Response<ContactPageDto, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound, 
                $"Page of type '{PageType.Contact}' not found");
        }
        
        return Response<ContactPageDto, GenericOperationStatuses>.Success(
            page.ConvertToContactDto(),
            GenericOperationStatuses.Completed);
    }

    /// <inheritdoc cref="IPageService.SetOrUpdateAsync"/>
    public async Task<Response<PageDto, GenericOperationStatuses>> SetOrUpdateAsync(
        PageDto pageDto,
        string userId,
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Set or update page request received");
        
        // Check if a page with the specified type already exists
        var existingPage = await dbContext
            .Pages
            .FirstOrDefaultAsync(p => p.Type == pageDto.Type, cancellationToken);

        if (existingPage == null)
        {
            // Create new page
            var newPage = new PageEntity
            {
                Type = pageDto.Type,
                Title = pageDto.Title,
                Body = pageDto.Body,
                JsonData = pageDto.JsonData,
                CreatedBy = userId,
                CreatedAtUtc = DateTime.UtcNow
            };

            await dbContext.Pages.AddAsync(newPage, cancellationToken);
            logger.LogDebug("Creating new page of type {Type}", pageDto.Type);
        }
        else
        {
            // Update existing page
            existingPage.Title = pageDto.Title;
            existingPage.Body = pageDto.Body;
            existingPage.JsonData = pageDto.JsonData;
            existingPage.UpdatedBy = userId;
            existingPage.UpdatedAtUtc = DateTime.UtcNow;

            dbContext.Pages.Update(existingPage);
            logger.LogDebug("Updating existing page of type {Type}", pageDto.Type);
        }

        await dbContext.SaveChangesAsync(cancellationToken);

        // Retrieve the updated or newly created page to return
        var savedPage = await dbContext
            .Pages
            .FirstOrDefaultAsync(p => p.Type == pageDto.Type, cancellationToken);

        var pageJson = JsonSerializer.Serialize(savedPage);
        var storageItem = new StorageItem
        {
            Name = $"{savedPage!.Type.ToString().ToLower()}.json",
            RelativePath = pageFolder,
            Content = Encoding.UTF8.GetBytes(pageJson)
        };
        
        await storageService.SaveAsync(storageItem, cancellationToken);
        
        return Response<PageDto, GenericOperationStatuses>.Success(
            savedPage!.ConvertToDto(),
            GenericOperationStatuses.Completed);
    }
}