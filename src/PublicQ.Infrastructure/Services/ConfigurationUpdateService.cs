using System.Text.Json;
using Microsoft.Extensions.Logging;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Shared;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// Implementation of <see cref="IConfigurationUpdateService"/>
/// </summary>
public class ConfigurationUpdateService(
    EntityConfigurationProvider configProvider, 
    ILogger<ConfigurationUpdateService> logger) : IConfigurationUpdateService
{
    /// <inheritdoc cref="IConfigurationUpdateService.Set{T}"/>
    public Response<GenericOperationStatuses> Set<TOptions>(TOptions options) where TOptions : class
    {
        Guard.AgainstNull(options, nameof(options));
        
        logger.LogInformation("Setting {Name} for entity {S}", typeof(TOptions).Name, typeof(TOptions).Name);
        
        var json = JsonSerializer.Serialize(options);
        using var document = JsonDocument.Parse(json);
        
        try
        {
            FlattenAndSet(typeof(TOptions).Name, document.RootElement);
        }
        catch (Exception ex)
        {
            logger.LogError(ex, "Failed to set up entity {name}", typeof(TOptions).Name);
            throw;
        }
        
        logger.LogInformation("Setting {Name} for entity {S}", typeof(TOptions).Name, typeof(TOptions).Name);
        
        return Response<GenericOperationStatuses>.Success(
            GenericOperationStatuses.Completed,
            $"Configuration has been updated successfully for '{typeof(TOptions).Name}'");
    }

    /// <inheritdoc cref="IConfigurationUpdateService.Replace{T}"/>
    public async Task<Response<GenericOperationStatuses>> Replace<TOptions>(TOptions options, CancellationToken cancellationToken) 
        where TOptions : class
    {
        Guard.AgainstNull(options, nameof(options));
        logger.LogInformation("Replacing {Name} for entity {S}", typeof(TOptions).Name, typeof(TOptions).Name);
        
        // Use transaction to ensure both operations succeed or fail together
        await using var transaction = await configProvider.BeginTransactionAsync(cancellationToken);
        
        try
        {
            // Clear existing settings for this options type
            var prefix = $"{typeof(TOptions).Name}";
            
            await configProvider.CleanAsync(prefix, cancellationToken);
            logger.LogInformation("Cleared existing settings for {Name}", typeof(TOptions).Name);
            
            // Set new values
            var result = Set(options);
            
            // If successful, commit the transaction
            if (result.IsSuccess)
            {
                await transaction.CommitAsync(cancellationToken);
                logger.LogInformation("Successfully replaced {Name} configuration", typeof(TOptions).Name);
            }
            else
            {
                await transaction.RollbackAsync(cancellationToken);
                logger.LogWarning("Failed to set new values for {Name}, transaction rolled back", typeof(TOptions).Name);
            }
            
            return result;
        }
        catch (Exception ex)
        {
            await transaction.RollbackAsync(cancellationToken);
            logger.LogError(ex, "Error occurred while replacing {Name} configuration, transaction rolled back", typeof(TOptions).Name);
            
            return Response<GenericOperationStatuses>
                .Failure(GenericOperationStatuses.Failed, 
                    "Failed to replace configuration", 
                    new List<string> { ex.Message });
        }
    }

    /// <summary>
    /// Flattens a JsonElement and sets the values in the configuration provider.
    /// </summary>
    /// <param name="prefix">Configuration prefix</param>
    /// <param name="element">Json element <see cref="JsonElement"/></param>
    void FlattenAndSet(string prefix, JsonElement element)
    {
        foreach (var property in element.EnumerateObject())
        {
            var key = $"{prefix}:{property.Name}";

            switch (property.Value.ValueKind)
            {
                case JsonValueKind.Object:
                    FlattenAndSet(key, property.Value); // recurse into the nested object
                    break;

                case JsonValueKind.Array:
                    // Iterate over the array to create indexed configuration
                    var index = 0;
                    foreach (var item in property.Value.EnumerateArray())
                    {
                        var indexedKey = $"{key}:{index}";

                        if (item.ValueKind == JsonValueKind.Object)
                            FlattenAndSet(indexedKey, item);
                        else
                            configProvider.Set(indexedKey, item.ToString());
                        index++;
                    }
                    break;

                default:
                    configProvider.Set(key, property.Value.ToString());
                    break;
            }
        }
    }
}