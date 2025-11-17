using PublicQ.Application.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Configuration update service interface
/// </summary>
public interface IConfigurationUpdateService
{
    /// <summary>
    /// Set configuration options
    /// </summary>
    /// <param name="options">Options to set</param>
    /// <typeparam name="TOptions">The type of the configuration options</typeparam>
    /// <returns>Returns operation status wrapped into Response</returns>
    Response<GenericOperationStatuses> Set<TOptions>(TOptions options) where TOptions : class;

    /// <summary>
    /// Replace configuration options
    /// If the options type exists, it will be removed first
    /// </summary>
    /// <remarks>
    /// This method should be used when you want to ensure that all settings for the given options type are replaced.
    /// It is required when your options have arrays or collections, as individual items cannot be removed via the Set method.
    /// </remarks>
    /// <param name="options">Options to set</param>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <typeparam name="TOptions">The type of the configuration options</typeparam>
    /// <returns>Returns operation status wrapped into Response</returns>
    Task<Response<GenericOperationStatuses>> Replace<TOptions>(
        TOptions options, 
        CancellationToken cancellationToken) where TOptions : class;
}