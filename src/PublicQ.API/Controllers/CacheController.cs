using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// Cache management controller.
/// </summary>
[ApiController]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class CacheController(ICacheService cacheService) : ControllerBase
{
    /// <summary>
    /// Clears all cached data.
    /// </summary>
    /// <param name="cancellationToken">Cancellation Token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    [HttpPost("clear")]
    public async Task<IActionResult> ClearCacheAsync(CancellationToken cancellationToken)
    {
        var response = await cacheService.ClearAllCacheAsync(cancellationToken);
        
        return response.ToActionResult();
    }

    /// <summary>
    /// Check cache service health.
    /// </summary>
    /// <param name="connectionString">Connection string</param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="GenericOperationStatuses"/> wrapped into <see cref="Response{TStatus}"/></returns>
    [HttpGet("health")]
    public async Task<IActionResult> GetCacheServiceHealthAsync(
        [FromQuery] string connectionString, 
        CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(connectionString))
        {
            return Response<GenericOperationStatuses, GenericOperationStatuses>.Failure(
                GenericOperationStatuses.BadRequest,
                "Connection string is required.")
                .ToActionResult();
        }

        var response = await cacheService.CheckCacheServiceHealthAsync(connectionString, cancellationToken);
        
        return response.ToActionResult();
    }
}