using PublicQ.Application.Models;

namespace PublicQ.Application.Interfaces;

/// <summary>
/// Interface for platform statistic-related operations in the application.
/// </summary>
public interface IPlatformStatisticService
{
    /// <summary>
    /// Gets platform statistics.
    /// </summary>
    /// <param name="cancellationToken"></param>
    /// <returns></returns>
    [Cacheable]
    Task<Response<PlatformStatisticDto, GenericOperationStatuses>> GetPlatformStatisticsAsync(
        CancellationToken cancellationToken);
}