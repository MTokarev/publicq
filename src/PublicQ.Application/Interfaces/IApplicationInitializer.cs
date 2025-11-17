using PublicQ.Application.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Represents an application initializer interface.
/// </summary>
public interface IApplicationInitializer
{
    /// <summary>
    /// Does initial application initialization
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="Response{TStatus}"/> with the operation status.</returns>
    Task<Response<GenericOperationStatuses>> InitializeAsync(CancellationToken cancellationToken);
}