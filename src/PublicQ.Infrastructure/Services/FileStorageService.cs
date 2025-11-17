using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Options;
using PublicQ.Shared;
using PublicQ.Shared.Models;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// <see cref="IStorageService"/>
/// </summary>
public class FileStorageService(
    IOptionsMonitor<FileStorageOptions> options, 
    ILogger<FileStorageService> logger) : IStorageService
{
    /// <summary>
    /// <see cref="IStorageService.SaveAsync"/>
    /// </summary>
    public async Task<Response<string, GenericOperationStatuses>> SaveAsync(
        StorageItem storageItem, 
        CancellationToken cancellationToken)
    {
        logger.LogDebug("Saving item to file storage to '{StaticContentPath}'", options.CurrentValue.StaticContentPath);
        
        Guard.AgainstNull(storageItem, nameof(storageItem));
        Guard.AgainstNullOrWhiteSpace(storageItem.Name, nameof(storageItem.Name));
        Guard.AgainstNullOrWhiteSpace(storageItem.Content, nameof(storageItem.Content));
        
        var filePath = options.CurrentValue.StaticContentPath;
        if (!string.IsNullOrWhiteSpace(storageItem.RelativePath))
        {
            filePath = Path.Combine(filePath, storageItem.RelativePath);
        }

        try
        {
            if (!Directory.Exists(filePath))
            {
                logger.LogDebug("Directory '{Directory}' doesn't exist. Creating...", filePath);
                Directory.CreateDirectory(filePath);
            }
        }
        catch (IOException ex)
        {
            logger.LogError(ex, "Failed to create directory '{Directory}'", filePath);
            return Response<string, GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed,
                $"Failed to create directory '{filePath}'. Exception message: '{ex.Message}'.");
        }
        
        filePath = Path.Combine(filePath, storageItem.Name);
        
        try
        {
            await File.WriteAllBytesAsync(filePath, storageItem.Content, cancellationToken);
        }
        catch (IOException ex)
        {
            logger.LogError(
                ex, 
                "Failed to save '{Path}'", 
                filePath);
            
            return Response<string, GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed,
                $"Failed to save '{filePath}'. Exception message: '{ex.Message}'.");
        }
        
        logger.LogDebug("Item with name '{Path}' saved successfully", filePath);
        
        return Response<string, GenericOperationStatuses>
            .Success(filePath, GenericOperationStatuses.Cancelled, $"Item saved successfully to '{filePath}'.");
    }

    /// <summary>
    /// <see cref="IStorageService.GetAsync"/>
    /// </summary>
    public async Task<Response<StorageItem, GenericOperationStatuses>> GetAsync(
        string itemName, 
        CancellationToken cancellationToken, 
        string? relativePath = null)
    {
        logger.LogDebug("Retrieving item with ID: '{ItemName}'", itemName);
        
        Guard.AgainstNullOrWhiteSpace(itemName, nameof(itemName));
        
        var filePath = ConstructFilePath(itemName, relativePath);
        byte[] fileBytes;
        try
        {
            if (!File.Exists(filePath))
            {
                logger.LogWarning("File with ID '{ItemName}' not found at path '{FilePath}'", itemName, filePath);
                return Response<StorageItem, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.NotFound,
                    $"File '{filePath}' not found.");
            }

            fileBytes = await File.ReadAllBytesAsync(filePath, cancellationToken);
        }
        catch (IOException ex)
        {
            logger.LogError(ex, "Failed to read file '{FilePath}'", filePath);
            return Response<StorageItem, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Failed to read file '{filePath}'. Exception message: '{ex.Message}'.");
        }
        
        var storageItem = new StorageItem
        {
            Name = itemName,
            Content = fileBytes
        };
        
        logger.LogDebug("File '{FilePath}' found and retrieved", filePath);
        
        return Response<StorageItem, GenericOperationStatuses>.Success(storageItem,
            GenericOperationStatuses.Completed,
            $"File '{filePath}' retrieved successfully.");
    }

    /// <summary>
    /// <see cref="IStorageService.DeleteAsync"/>
    /// </summary>
    public async Task<Response<GenericOperationStatuses>> DeleteAsync(
        string filePath, 
        CancellationToken cancellationToken, 
        string? relativePath = null)
    {
        logger.LogDebug("Starting deletion of item with ID: '{StorageItem}'", filePath);
        
        Guard.AgainstNullOrWhiteSpace(filePath, nameof(filePath));
        
        try
        {
            if (!File.Exists(filePath))
            {
                return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.NotFound, $"File '{filePath}' does not exist.");
            }

            File.Delete(filePath);

            return Response<GenericOperationStatuses>.Success(GenericOperationStatuses.Completed, $"File '{filePath}' deleted successfully.");
        }
        catch (Exception ex)
        {
            return Response<GenericOperationStatuses>.Failure(GenericOperationStatuses.Failed, $"Failed to delete file '{filePath}': {ex.Message}");
        }
        
    }
    
    private string ConstructFilePath(string itemName, string? relativePath)
    {
        var filePath = options.CurrentValue.StaticContentPath;
        if (!string.IsNullOrWhiteSpace(relativePath))
        {
            filePath = Path.Combine(filePath, relativePath);
        }
        
        filePath = Path.Combine(filePath, itemName);
        return filePath;
    }
}