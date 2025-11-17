using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// Controller for managing and retrieving application logs.
/// </summary>
[ApiController]
[Authorize(Constants.AdminsPolicy)]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class LogsController(
    ILogger<LogsController> logger, 
    ILogRepository logRepository) : ControllerBase
{
    /// <summary>
    /// Gets paginated logs with optional filtering.
    /// </summary>
    /// <param name="pageNumber">Optional: Page number</param>
    /// <param name="pageSize">Optional: Page size</param>
    /// <param name="filter">Optional: <see cref="LogFilter"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="PaginatedResponse{T}"/> wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet]
    public async Task<IActionResult> GetLogsAsync(
        [FromQuery] int pageNumber = 1,
        [FromQuery] int pageSize = 10,
        [FromQuery] LogFilter? filter = default,
        CancellationToken cancellationToken = default)
    {
        var result = await logRepository.GetLogsAsync(
            filter, 
            pageNumber, 
            pageSize, 
            cancellationToken);

        return result.ToActionResult();
    }
    
    /// <summary>
    /// Exports logs based on the provided filter.
    /// </summary>
    /// <param name="filter">Optional: <see cref="LogFilter"/></param>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns <see cref="IList{T}"/> wrapped into <see cref="Response{TData, TStatus}"/>/></returns>
    [HttpGet("export")]
    public async Task<IActionResult> ExportLogsAsync(
        [FromQuery] LogFilter? filter = default, 
        CancellationToken cancellationToken = default)
    {
        logger.LogInformation("Exporting logs requested received.");
        var result = await logRepository.ExportLogsAsync(filter, cancellationToken);
        logger.LogInformation("Export completed. Exported {Count} log entries.", result.Data?.Count ?? 0);
        
        return result.ToActionResult();
    }
}