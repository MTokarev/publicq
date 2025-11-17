using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Infrastructure.Persistence;
using PublicQ.Shared.Enums;

namespace PublicQ.Infrastructure.Services;

/// <summary>
/// Implementation of <see cref="IUserConfigurationProvider"/> that retrieves configuration from the database.
/// </summary>
// TODO: Add caching to reduce database calls or implement IConfigurationProvider with event based model that will update configuration in memory
public class UserConfigurationProvider(ApplicationDbContext context, ILogger<UserConfigurationProvider> logger)
    : IUserConfigurationProvider
{
    private readonly ApplicationDbContext _context = context;
    private readonly ILogger<UserConfigurationProvider> _logger = logger;

    /// <summary>
    /// <see cref="IUserConfigurationProvider"/>
    /// </summary>
    public async Task<Response<TConfig, GenericOperationStatuses>> GetConfigurationAsync<TConfig>(
        UserConfigTypes userConfigType,
        CancellationToken cancellationToken)
        where TConfig : class, IConfigurationModel, new()
    {
        _logger.LogDebug("Retrieving configuration for type: {Type}", userConfigType);
        var configuration = await _context.UserConfigurations.FirstOrDefaultAsync(c => c.Type == userConfigType, cancellationToken);

        if (configuration is null)
        {
            _logger.LogDebug("Configuration for type {Type} not found", userConfigType);
            return Response<TConfig, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.NotFound,
                $"Configuration for type {userConfigType} not found.");
        }

        var entity = JsonSerializer.Deserialize<TConfig>(configuration.DataJson);
        if (entity is null)
        {
            _logger.LogDebug("Failed to deserialize configuration for type {Type}", userConfigType);
            return Response<TConfig, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Failed to deserialize configuration for type {userConfigType}.");
        }
        
        _logger.LogDebug("Configuration for type {Type} retrieved successfully", userConfigType);
        return Response<TConfig, GenericOperationStatuses>.Success(
            entity,
            GenericOperationStatuses.Completed,
            $"Configuration for type {userConfigType} retrieved successfully.");
    }

    /// <summary>
    /// <see cref="IUserConfigurationProvider"/>
    /// </summary>
    public async Task<Response<GenericOperationStatuses>> SetConfigurationAsync<TConfig>(
        TConfig configToUpdate, 
        CancellationToken cancellationToken)
        where TConfig : class, IConfigurationModel, new()
    {
        _logger.LogDebug("Setting configuration for type: {Type}", typeof(TConfig).Name);

        var configResponse = await GetConfigurationAsync<TConfig>(configToUpdate.UserConfigType, cancellationToken);
        if (configResponse.IsFailed)
        {
            return Response<TConfig, GenericOperationStatuses>.Failure(
                configResponse.Status, 
                configResponse.Message, 
                configResponse.Errors);
        }
        
        var jsonData = JsonSerializer.Serialize(configToUpdate);
        if (string.IsNullOrEmpty(jsonData))
        {
            _logger.LogError("Failed to serialize configuration for '{ConfigType}'.", configToUpdate.UserConfigType);
            return Response<TConfig, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.Failed,
                $"Failed to serialize configuration for '{configToUpdate.UserConfigType}'.");
        }

        await _context.UserConfigurations
            .Where(c => c.Type == configResponse.Data.UserConfigType)
            .ExecuteUpdateAsync(
                c => c.SetProperty(c => c.DataJson, jsonData),
                cancellationToken);

        _logger.LogDebug("Configuration for {ConfigType} set successfully.", configToUpdate.UserConfigType);

        return Response<TConfig, GenericOperationStatuses>.Success(
            GenericOperationStatuses.Completed,
            $"Configuration for {configToUpdate.UserConfigType} set successfully.");
    }
}