using FluentValidation;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PublicQ.API.Helpers;
using PublicQ.Application.Interfaces;
using PublicQ.Application.Models;
using PublicQ.Application.Models.Pages;
using PublicQ.Shared;

namespace PublicQ.API.Controllers;

/// <summary>
/// Api Controller for managing pages.
/// </summary>
[ApiController]
// [Authorize(Constants.ManagersPolicy)]
[Route($"{Constants.ControllerRoutePrefix}/[controller]")]
public class PagesController(IPageService pageService) : ControllerBase
{
    /// <summary>
    /// Gets page by type.
    /// </summary>
    /// <param name="cancellationToken">Cancellation token</param>
    /// <returns>Returns a contact page wrapped into <see cref="Response{TData, TStatus}"/></returns>
    [HttpGet("contact")]
    public async Task<IActionResult> GetContactPageAsync(
        CancellationToken cancellationToken = default)
    {
        var result = await pageService.GetContactPageAsync(cancellationToken);
        
        return result.ToActionResult();
    }

    /// <summary>
    /// Sets or updates a page.
    /// </summary>
    /// <param name="pageDto"><see cref="PageDto"/></param>
    /// <param name="validator">Validator</param>
    /// <param name="cancellationToken">Cancellation token</param>
    [HttpPost]
    public async Task<IActionResult> SetOrUpdateAsync(
        [FromBody] PageDto pageDto,
        [FromServices] IValidator<PageDto> validator,
        CancellationToken cancellationToken = default)
    {
        var validationResult = await validator.ValidateAsync(pageDto, cancellationToken);
        if (!validationResult.IsValid)
        {
            return Response<PageDto, GenericOperationStatuses>.Failure(
                    GenericOperationStatuses.BadRequest,
                    "Validation failed",
                    validationResult.Errors.Select(e => e.ErrorMessage).ToList())
                .ToActionResult();
        }

        // Retrieve the user ID from the authenticated user's claims
        var fullName = UserClaimParser.GetUserDisplayName(User.Claims);

        var result = await pageService.SetOrUpdateAsync(
            pageDto,
            fullName,
            cancellationToken);
        return result.ToActionResult();
    }
}