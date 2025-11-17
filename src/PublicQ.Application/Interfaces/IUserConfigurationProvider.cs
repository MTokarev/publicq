using PublicQ.Application.Models;
using PublicQ.Shared.Enums;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Represents a provider for user-specific configurations.
/// </summary>
public interface IUserConfigurationProvider
{
    /// <summary>
    /// Gets the configuration of the specified type.
    /// </summary>
    /// <param name="userConfigType">The configuration type to retrieve.</param>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <typeparam name="TConfig">The type of the configuration model.</typeparam>
    /// <returns>A response containing the configuration.</returns>
    Task<Response<TConfig, GenericOperationStatuses>> GetConfigurationAsync<TConfig>(
        UserConfigTypes userConfigType,
        CancellationToken cancellationToken) 
        where TConfig : class, IConfigurationModel, new();

    /// <summary>
    /// Sets the configuration of the specified type.
    /// </summary>
    /// <param name="config">The configuration to apply.</param>
    /// <typeparam name="TConfig">The type of the configuration model.</typeparam>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>A response containing the operation status.</returns>
    Task<Response<GenericOperationStatuses>> SetConfigurationAsync<TConfig>(
        TConfig config, 
        CancellationToken cancellationToken) 
        where TConfig : class?, IConfigurationModel?, new();
}