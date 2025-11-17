using Microsoft.AspNetCore.Mvc;
using PublicQ.Application.Interfaces;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// Initialization controller for setting up the application.
/// </summary>
/// <param name="applicationInitializer"></param>
[ApiController]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class ApplicationInitializationController(IApplicationInitializer applicationInitializer) : ControllerBase
{
    /// <summary>
    /// Initializes the application.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token.</param>
    /// <returns>Response indicating the result of the initialization.</returns>
    [HttpPost("initialize")]
    public async Task<IActionResult> InitializeAsync(CancellationToken cancellationToken)
    {
        var response = await applicationInitializer.InitializeAsync(cancellationToken);
        if (response.IsFailed)
        {
            return BadRequest(response.Errors);
        }

        return response.IsFailed 
            ? StatusCode(StatusCodes.Status500InternalServerError, response.Errors) 
            : Ok(response.Message);
    }
}