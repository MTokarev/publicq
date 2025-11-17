using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// Platform statistics controller.
/// </summary>
[ApiController]
[Authorize]
[Route($"{Constants.ControllerRoutePrefix}/platform-statistics")]
public class PlatformStatisticsController(IPlatformStatisticService platformStatisticService)
{
    /// <summary>
    /// Gets platform statistics.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="PlatformStatisticDto"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet]
    public async Task<IActionResult> GetPlatformStatisticsAsync(CancellationToken cancellationToken)
    {
        var result = await platformStatisticService.GetPlatformStatisticsAsync(cancellationToken);
        return result.ToActionResult();
    }
}